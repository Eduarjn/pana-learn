// /api/payment-webhook.ts
// Recebe notificações de pagamento do Asaas
// Documentação: https://docs.asaas.com/reference/webhook

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN || '';

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Asaas valida o endpoint com GET
  if (req.method === 'GET') return res.status(200).json({ ok: true });
  if (req.method !== 'POST') return res.status(405).end();

  // ── Verificar token de autenticação do webhook ───────────────────────────
  // Fail-closed: sem token configurado no servidor → rejeita tudo
  if (!WEBHOOK_TOKEN) {
    console.error('Webhook: ASAAS_WEBHOOK_TOKEN não configurado — rejeitando requisição');
    return res.status(503).json({ error: 'Webhook not configured' });
  }
  // Token só via header (nunca query string — vaza em logs)
  const rawToken = req.headers['asaas-access-token'];
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;
  if (!token || !safeEqual(token, WEBHOOK_TOKEN)) {
    console.warn('Webhook: token inválido ou ausente');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { event, payment } = req.body;

  if (!event || !payment) {
    return res.status(200).json({ ok: true, msg: 'Evento sem payload' });
  }

  console.log(`[Asaas Webhook] Evento: ${event}, Payment ID: ${payment.id}`);

  // Fail-closed com erro legível (createClient lança se faltar env var → 500 opaco)
  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[Asaas Webhook] VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas');
    return res.status(503).json({ error: 'Supabase credentials not configured' });
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  try {
    const subscriptionId = payment.subscription; // ID da assinatura Asaas

    if (!subscriptionId) {
      console.log('[Asaas Webhook] Pagamento avulso (sem assinatura), ignorando');
      return res.status(200).json({ ok: true });
    }

    // ── Eventos de pagamento confirmado ──────────────────────────────────
    if (
      event === 'PAYMENT_CONFIRMED' ||
      event === 'PAYMENT_RECEIVED' ||
      event === 'PAYMENT_RECEIVED_IN_CASH'
    ) {
      const now = new Date();
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      // Atualizar subscription
      // Validar valor do pagamento contra subscriptions.amount_cents
      // para nao ativar plano com cobranca subdimensionada
      const { data: subCheck, error: subCheckErr } = await supabase
        .from('subscriptions')
        .select('amount_cents')
        .eq('asaas_subscription_id', subscriptionId)
        .single();
      if (subCheckErr || !subCheck) {
        console.error('[Asaas Webhook] Subscription nao encontrada para validacao:', subscriptionId);
        return res.status(500).json({ error: 'Subscription not found' });
      }
      const paymentCents = Math.round(Number(payment.value) * 100);
      if (paymentCents < subCheck.amount_cents) {
        console.warn(
          `[Asaas Webhook] Valor recebido (${paymentCents}) menor que esperado (${subCheck.amount_cents}) para ${subscriptionId}`
        );
        return res.status(400).json({ error: 'Payment value below subscription amount' });
      }

      const { data: sub, error: subError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          asaas_payment_id: payment.id,
          current_period_start: now.toISOString(),
          current_period_end: nextMonth.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('asaas_subscription_id', subscriptionId)
        .select('organization_id, plan')
        .single();

      if (subError) {
        console.error('[Asaas Webhook] Erro ao atualizar subscription (activated):', subError);
        return res.status(500).json({ error: `Subscription update failed: ${subError.message}` });
      }
      if (!sub?.organization_id) {
        console.error('[Asaas Webhook] Subscription não encontrada para', subscriptionId);
        return res.status(500).json({ error: 'Subscription not found' });
      }

      const { error: empError } = await supabase
        .from('empresas')
        .update({
          plan: sub.plan,
          plan_status: 'active',
          onboarding_completed: true,
        })
        .eq('id', sub.organization_id);

      if (empError) {
        console.error('[Asaas Webhook] Erro ao ativar empresa:', empError);
        return res.status(500).json({ error: `Empresa update failed: ${empError.message}` });
      }

      console.log(`[Asaas Webhook] Empresa ${sub.organization_id} ativada com plano ${sub.plan}`);
      return res.status(200).json({ ok: true, action: 'activated' });
    }

    // ── Pagamento vencido / não pago ──────────────────────────────────────
    if (event === 'PAYMENT_OVERDUE') {
      const { data: sub, error: subError } = await supabase
        .from('subscriptions')
        .update({
          status: 'overdue',
          updated_at: new Date().toISOString(),
        })
        .eq('asaas_subscription_id', subscriptionId)
        .select('organization_id')
        .single();

      if (subError) {
        console.error('[Asaas Webhook] Erro ao atualizar subscription (overdue):', subError);
        return res.status(500).json({ error: `Subscription update failed: ${subError.message}` });
      }
      if (!sub?.organization_id) {
        console.error('[Asaas Webhook] Subscription não encontrada para', subscriptionId);
        return res.status(500).json({ error: 'Subscription not found' });
      }

      const { error: empError } = await supabase
        .from('empresas')
        .update({ plan_status: 'overdue' })
        .eq('id', sub.organization_id);
      if (empError) {
        console.error('[Asaas Webhook] Erro ao marcar empresa overdue:', empError);
        return res.status(500).json({ error: `Empresa update failed: ${empError.message}` });
      }

      console.log(`[Asaas Webhook] Empresa ${sub.organization_id} com pagamento vencido`);
      return res.status(200).json({ ok: true, action: 'overdue' });
    }

    // ── Assinatura cancelada ─────────────────────────────────────────────
    if (event === 'PAYMENT_DELETED' || event === 'SUBSCRIPTION_DELETED') {
      const { data: sub, error: subError } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('asaas_subscription_id', subscriptionId)
        .select('organization_id')
        .single();

      if (subError) {
        console.error('[Asaas Webhook] Erro ao atualizar subscription (cancelled):', subError);
        return res.status(500).json({ error: `Subscription update failed: ${subError.message}` });
      }
      if (!sub?.organization_id) {
        console.error('[Asaas Webhook] Subscription não encontrada para', subscriptionId);
        return res.status(500).json({ error: 'Subscription not found' });
      }

      const { error: empError } = await supabase
        .from('empresas')
        .update({ plan_status: 'cancelled' })
        .eq('id', sub.organization_id);
      if (empError) {
        console.error('[Asaas Webhook] Erro ao cancelar empresa:', empError);
        return res.status(500).json({ error: `Empresa update failed: ${empError.message}` });
      }

      return res.status(200).json({ ok: true, action: 'cancelled' });
    }

    // Outros eventos — aceitar sem processar
    return res.status(200).json({ ok: true, event });

  } catch (error: any) {
    console.error('[Asaas Webhook] Erro:', error.message);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
