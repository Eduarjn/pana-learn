// /api/payment-webhook.ts
// Recebe notificações de pagamento do Asaas
// Documentação: https://docs.asaas.com/reference/webhook

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Asaas valida o endpoint com GET
  if (req.method === 'GET') return res.status(200).json({ ok: true });
  if (req.method !== 'POST') return res.status(405).end();

  // ── Verificar token de autenticação do webhook ───────────────────────────
  if (WEBHOOK_TOKEN) {
    const token = req.headers['asaas-access-token'] || req.query?.token;
    if (token !== WEBHOOK_TOKEN) {
      console.warn('Webhook: token inválido');
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const { event, payment } = req.body;

  if (!event || !payment) {
    return res.status(200).json({ ok: true, msg: 'Evento sem payload' });
  }

  console.log(`[Asaas Webhook] Evento: ${event}, Payment ID: ${payment.id}`);

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  try {
    const subscriptionId = payment.subscription; // ID da assinatura Asaas

    if (!subscriptionId) {
      console.log('[Asaas Webhook] Pagamento avulso (sem assinatura), ignorando');
      return res.status(200).json({ ok: true });
    }

    // ── Eventos de pagamento confirmado ──────────────────────────────────
    if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
      const now = new Date();
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      // Atualizar subscription
      const { data: sub } = await supabase
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

      if (sub?.organization_id) {
        // Ativar empresa
        await supabase
          .from('organizations')
          .update({
            plan: sub.plan,
            plan_status: 'active',
            onboarding_completed: true,
          })
          .eq('id', sub.organization_id);

        console.log(`[Asaas Webhook] Empresa ${sub.organization_id} ativada com plano ${sub.plan}`);
      }

      return res.status(200).json({ ok: true, action: 'activated' });
    }

    // ── Pagamento vencido / não pago ──────────────────────────────────────
    if (event === 'PAYMENT_OVERDUE') {
      const { data: sub } = await supabase
        .from('subscriptions')
        .update({
          status: 'overdue',
          updated_at: new Date().toISOString(),
        })
        .eq('asaas_subscription_id', subscriptionId)
        .select('organization_id')
        .single();

      if (sub?.organization_id) {
        await supabase
          .from('organizations')
          .update({ plan_status: 'overdue' })
          .eq('id', sub.organization_id);

        console.log(`[Asaas Webhook] Empresa ${sub.organization_id} com pagamento vencido`);
      }

      return res.status(200).json({ ok: true, action: 'overdue' });
    }

    // ── Assinatura cancelada ─────────────────────────────────────────────
    if (event === 'PAYMENT_DELETED' || event === 'SUBSCRIPTION_DELETED') {
      const { data: sub } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('asaas_subscription_id', subscriptionId)
        .select('organization_id')
        .single();

      if (sub?.organization_id) {
        await supabase
          .from('organizations')
          .update({ plan_status: 'cancelled' })
          .eq('id', sub.organization_id);
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
