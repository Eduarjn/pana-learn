// /api/payment-webhook.ts
// Recebe notificações de pagamento do Mercado Pago

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // MP faz GET para validar o endpoint
  if (req.method === 'GET') return res.status(200).json({ ok: true });
  if (req.method !== 'POST') return res.status(405).end();

  const { type, data } = req.body;

  // Só processar notificações de pagamento
  if (type !== 'payment') return res.status(200).json({ ok: true });

  try {
    // Consultar o pagamento na API do MP para confirmar
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    });

    const payment = await mpResponse.json();

    if (payment.status !== 'approved') {
      return res.status(200).json({ ok: true, status: payment.status });
    }

    // Pagamento aprovado — atualizar no Supabase
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const organization_id = payment.metadata?.organization_id;
    const user_id = payment.metadata?.user_id;
    const plan = payment.metadata?.plan;

    // Buscar empresa vinculada à organization
    const { data: org } = await supabase
      .from('organizations')
      .select('empresa_id, name, platform_name, primary_color, logo_url')
      .eq('id', organization_id)
      .single();

    let empresaId = (org as any)?.empresa_id;

    // Se ainda não tem empresa (pagou sem trial), criar agora
    if (!empresaId) {
      const { data: newEmpresaId } = await supabase.rpc('setup_tenant_environment', {
        p_organization_id: organization_id,
        p_owner_auth_id: user_id,
        p_company_name: (org as any)?.name || 'Empresa',
        p_platform_name: (org as any)?.platform_name || (org as any)?.name,
        p_primary_color: (org as any)?.primary_color || '#22c55e',
        p_logo_url: (org as any)?.logo_url || null,
      });
      empresaId = newEmpresaId;
    }

    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const externalRef = payment.external_reference;

    // Atualizar subscription
    await supabase.from('subscriptions')
      .update({
        status: 'active',
        empresa_id: empresaId,
        mp_payment_id: String(data.id),
        current_period_start: now.toISOString(),
        current_period_end: nextMonth.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('mp_external_reference', externalRef);

    // Atualizar organization
    await supabase.from('organizations')
      .update({
        plan,
        plan_status: 'active',
        onboarding_completed: true,
      })
      .eq('id', organization_id);

    // Atualizar empresa com plano ativo
    if (empresaId) {
      await supabase.from('empresas')
        .update({
          plan,
          plan_status: 'active',
        })
        .eq('id', empresaId);
    }

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
