// Netlify Function — paridade com api/payment-webhook.ts (Vercel)
// Caminho exposto: /api/payment-webhook

import type { Context, Config } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN || '';

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export default async (req: Request, _ctx: Context) => {
  if (req.method === 'GET') return json({ ok: true });
  if (req.method !== 'POST') return new Response(null, { status: 405 });

  if (!WEBHOOK_TOKEN) {
    console.error('Webhook: ASAAS_WEBHOOK_TOKEN não configurado — rejeitando requisição');
    return json({ error: 'Webhook not configured' }, 503);
  }
  const token = req.headers.get('asaas-access-token') || '';
  if (!token || !safeEqual(token, WEBHOOK_TOKEN)) {
    console.warn('Webhook: token inválido ou ausente');
    return json({ error: 'Unauthorized' }, 401);
  }

  const body = await req.json();
  const { event, payment } = body;
  if (!event || !payment) return json({ ok: true, msg: 'Evento sem payload' });

  console.log(`[Asaas Webhook] Evento: ${event}, Payment ID: ${payment.id}`);

  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[Asaas Webhook] VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas');
    return json({ error: 'Supabase credentials not configured' }, 503);
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  try {
    const subscriptionId = payment.subscription;
    if (!subscriptionId) {
      console.log('[Asaas Webhook] Pagamento avulso (sem assinatura), ignorando');
      return json({ ok: true });
    }

    if (
      event === 'PAYMENT_CONFIRMED' ||
      event === 'PAYMENT_RECEIVED' ||
      event === 'PAYMENT_RECEIVED_IN_CASH'
    ) {
      const now = new Date();
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const { data: subCheck, error: subCheckErr } = await supabase
        .from('subscriptions')
        .select('amount_cents')
        .eq('asaas_subscription_id', subscriptionId)
        .single();
      if (subCheckErr || !subCheck) {
        console.error('[Asaas Webhook] Subscription nao encontrada para validacao:', subscriptionId);
        return json({ error: 'Subscription not found' }, 500);
      }
      const paymentCents = Math.round(Number(payment.value) * 100);
      if (paymentCents < subCheck.amount_cents) {
        console.warn(
          `[Asaas Webhook] Valor recebido (${paymentCents}) menor que esperado (${subCheck.amount_cents}) para ${subscriptionId}`
        );
        return json({ error: 'Payment value below subscription amount' }, 400);
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
        return json({ error: `Subscription update failed: ${subError.message}` }, 500);
      }
      if (!sub?.organization_id) {
        console.error('[Asaas Webhook] Subscription não encontrada para', subscriptionId);
        return json({ error: 'Subscription not found' }, 500);
      }

      const { error: empError } = await supabase
        .from('empresas')
        .update({ plan: sub.plan, plan_status: 'active', onboarding_completed: true })
        .eq('id', sub.organization_id);

      if (empError) {
        console.error('[Asaas Webhook] Erro ao ativar empresa:', empError);
        return json({ error: `Empresa update failed: ${empError.message}` }, 500);
      }

      console.log(`[Asaas Webhook] Empresa ${sub.organization_id} ativada com plano ${sub.plan}`);
      return json({ ok: true, action: 'activated' });
    }

    if (event === 'PAYMENT_OVERDUE') {
      const { data: sub, error: subError } = await supabase
        .from('subscriptions')
        .update({ status: 'overdue', updated_at: new Date().toISOString() })
        .eq('asaas_subscription_id', subscriptionId)
        .select('organization_id')
        .single();

      if (subError) return json({ error: `Subscription update failed: ${subError.message}` }, 500);
      if (!sub?.organization_id) return json({ error: 'Subscription not found' }, 500);

      const { error: empError } = await supabase
        .from('empresas')
        .update({ plan_status: 'overdue' })
        .eq('id', sub.organization_id);
      if (empError) return json({ error: `Empresa update failed: ${empError.message}` }, 500);

      return json({ ok: true, action: 'overdue' });
    }

    if (event === 'PAYMENT_DELETED' || event === 'SUBSCRIPTION_DELETED') {
      const { data: sub, error: subError } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('asaas_subscription_id', subscriptionId)
        .select('organization_id')
        .single();

      if (subError) return json({ error: `Subscription update failed: ${subError.message}` }, 500);
      if (!sub?.organization_id) return json({ error: 'Subscription not found' }, 500);

      const { error: empError } = await supabase
        .from('empresas')
        .update({ plan_status: 'cancelled' })
        .eq('id', sub.organization_id);
      if (empError) return json({ error: `Empresa update failed: ${empError.message}` }, 500);

      return json({ ok: true, action: 'cancelled' });
    }

    return json({ ok: true, event });
  } catch (error: any) {
    console.error('[Asaas Webhook] Erro:', error.message);
    return json({ error: 'Webhook processing failed' }, 500);
  }
};

export const config: Config = { path: '/api/payment-webhook' };
