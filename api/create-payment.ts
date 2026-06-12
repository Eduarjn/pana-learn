// /api/create-payment.ts
// Vercel Serverless Function — cria cliente + assinatura no Asaas

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '';

const PLANOS: Record<string, { nome: string; valor: number }> = {
  starter:    { nome: 'Panalearn Starter',    valor: 397.00 },
  pro:        { nome: 'Panalearn Pro',         valor: 697.00 },
  enterprise: { nome: 'Panalearn Enterprise',  valor: 1097.00 },
};

async function asaasFetch(endpoint: string, body: Record<string, unknown>) {
  let res: Response;
  try {
    res = await fetch(`${ASAAS_API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: ASAAS_API_KEY,
      },
      body: JSON.stringify(body),
    });
  } catch (networkErr: any) {
    const err: any = new Error(`Asaas network error: ${networkErr.message}`);
    err.isUpstream = true;
    throw err;
  }

  if (!res.ok) {
    const text = await res.text();
    let parsedMsg = `Asaas ${res.status}`;
    try {
      const j = JSON.parse(text);
      parsedMsg = j?.errors?.[0]?.description || parsedMsg;
    } catch { /* resposta não-JSON — usa texto bruto */ }
    const err: any = new Error(parsedMsg);
    err.isUpstream = true;
    err.upstreamStatus = res.status;
    err.upstreamBody = text.slice(0, 1000);
    throw err;
  }

  return await res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { plan, user_id, organization_id, user_email, user_name, cpf_cnpj, trial } = req.body;
  const TRIAL_DAYS = 14;

  if (!plan || !PLANOS[plan]) {
    return res.status(400).json({ error: 'Plano inválido' });
  }
  // Trial pode iniciar sem CPF; "Pagar agora" continua exigindo
  if (!trial && !cpf_cnpj) {
    return res.status(400).json({ error: 'CPF ou CNPJ obrigatório para o Asaas' });
  }

  const plano = PLANOS[plan];

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  try {
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + TRIAL_DAYS);

    // ── Trial sem CPF: registra apenas localmente, sem chamar Asaas ───────
    if (trial && !cpf_cnpj) {
      await supabase.from('subscriptions').insert({
        organization_id,
        user_id,
        plan,
        status: 'trial',
        trial_end_date: trialEndDate.toISOString(),
        amount_cents: Math.round(plano.valor * 100),
      });
      await supabase
        .from('empresas')
        .update({ plan, plan_status: 'trial' })
        .eq('id', organization_id);
      await supabase
        .from('organizations')
        .update({ onboarding_completed: true })
        .eq('id', organization_id);
      return res.status(200).json({
        trial: true,
        trialEndDate: trialEndDate.toISOString(),
      });
    }

    // ── 1. Obter ou criar cliente no Asaas ─────────────────────────────────
    let asaasCustomerId: string | null = null;

    // Verificar se a org já tem um customer_id
    const { data: org } = await supabase
      .from('empresas')
      .select('asaas_customer_id')
      .eq('id', organization_id)
      .single();

    if (org?.asaas_customer_id) {
      asaasCustomerId = org.asaas_customer_id;
    } else {
      // Criar novo cliente no Asaas
      const customer = await asaasFetch('/customers', {
        name: user_name || 'Cliente Panalearn',
        email: user_email,
        cpfCnpj: cpf_cnpj.replace(/\D/g, ''),
      });

      asaasCustomerId = customer.id;

      // Salvar customer_id na organization
      await supabase
        .from('empresas')
        .update({ asaas_customer_id: customer.id })
        .eq('id', organization_id);
    }

    // ── 2. Criar assinatura mensal (1ª cobrança em 14 dias — trial) ───────
    const nextDueDate = trialEndDate.toISOString().split('T')[0];

    const subscription = await asaasFetch('/subscriptions', {
      customer: asaasCustomerId,
      billingType: 'BOLETO',
      value: plano.valor,
      cycle: 'MONTHLY',
      nextDueDate, // hoje + 14 dias
      description: `Assinatura ${plano.nome}`,
      externalReference: `${organization_id}__${plan}`,
    });

    // ── 3. Registar assinatura no Supabase (status trial) ──────────────────
    await supabase.from('subscriptions').insert({
      organization_id,
      user_id,
      plan,
      status: 'trial',
      asaas_subscription_id: subscription.id,
      trial_end_date: trialEndDate.toISOString(),
      amount_cents: Math.round(plano.valor * 100),
    });

    await supabase
      .from('empresas')
      .update({ plan, plan_status: 'trial' })
      .eq('id', organization_id);

    await supabase
      .from('organizations')
      .update({ onboarding_completed: true })
      .eq('id', organization_id);

    // ── 4. Devolver URL de pagamento (1ª cobrança vence em 14 dias) ────────
    return res.status(200).json({
      paymentUrl: subscription.invoiceUrl || `https://sandbox.asaas.com/i/${subscription.id}`,
      subscriptionId: subscription.id,
      trialEndDate: trialEndDate.toISOString(),
    });

  } catch (error: any) {
    console.error('Erro Asaas:', {
      message: error.message,
      upstreamStatus: error.upstreamStatus,
      upstreamBody: error.upstreamBody,
    });
    const status = error.isUpstream ? 502 : 500;
    return res.status(status).json({
      error: error.message || 'Erro ao criar assinatura',
      upstreamStatus: error.upstreamStatus,
      upstreamDetail: error.upstreamBody,
    });
  }
}
