// Netlify Function — paridade com api/create-payment.ts (Vercel)
// Caminho exposto: /api/create-payment

import type { Context, Config } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '';

const PLANOS: Record<string, { nome: string; valor: number }> = {
  starter:    { nome: 'Panalearn Starter',    valor: 597.00 },
  pro:        { nome: 'Panalearn Pro',         valor: 897.00 },
  enterprise: { nome: 'Panalearn Enterprise',  valor: 1097.00 },
};

async function asaasFetch(endpoint: string, body?: Record<string, unknown>, method: 'POST' | 'GET' = 'POST') {
  let res: Response;
  try {
    res = await fetch(`${ASAAS_API_URL}${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json', access_token: ASAAS_API_KEY },
      body: method === 'GET' ? undefined : JSON.stringify(body ?? {}),
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
    } catch {}
    const err: any = new Error(parsedMsg);
    err.isUpstream = true;
    err.upstreamStatus = res.status;
    err.upstreamBody = text.slice(0, 1000);
    throw err;
  }
  return await res.json();
}

const ALLOWED_ORIGINS = new Set([
  'https://www.panalearn.com',
  'https://panalearn.com',
  'https://panalearn.netlify.app',
  'http://localhost:8080',
  'http://localhost:5173',
]);

const corsHeaders = (origin: string) => {
  const h: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  if (ALLOWED_ORIGINS.has(origin)) {
    h['Access-Control-Allow-Origin'] = origin;
    h['Vary'] = 'Origin';
  }
  return h;
};

export default async (req: Request, _ctx: Context) => {
  const origin = req.headers.get('origin') || '';
  const baseHeaders = { 'Content-Type': 'application/json', ...corsHeaders(origin) };
  const jsonResponse = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: baseHeaders });

  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders(origin) });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const { plan, user_id, organization_id, user_email, user_name, cpf_cnpj, trial } = await req.json();
  const TRIAL_DAYS = 14;

  if (!plan || !PLANOS[plan]) return jsonResponse({ error: 'Plano inválido' }, 400);
  if (!trial && !cpf_cnpj) return jsonResponse({ error: 'CPF ou CNPJ obrigatório para o Asaas' }, 400);
  if (!user_id || !organization_id) return jsonResponse({ error: 'user_id e organization_id obrigatórios' }, 400);

  const plano = PLANOS[plan];

  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('create-payment: VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas');
    return jsonResponse({ error: 'Supabase credentials not configured no servidor' }, 503);
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  // Authenticacao: Bearer token + validacao de pertencimento ao tenant
  const authHeader = req.headers.get('authorization') || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!bearer) return jsonResponse({ error: 'Authorization Bearer obrigatório' }, 401);
  const { data: authData, error: authErr } = await supabase.auth.getUser(bearer);
  if (authErr || !authData.user) return jsonResponse({ error: 'Token inválido' }, 401);
  if (authData.user.id !== user_id) return jsonResponse({ error: 'user_id não corresponde ao token' }, 403);
  const { data: callerUsuario, error: cuErr } = await supabase
    .from('usuarios')
    .select('empresa_id')
    .eq('user_id', user_id)
    .maybeSingle();
  if (cuErr) return jsonResponse({ error: `Falha ao validar usuário: ${cuErr.message}` }, 500);
  if (!callerUsuario || callerUsuario.empresa_id !== organization_id) {
    return jsonResponse({ error: 'Usuário não pertence à empresa informada' }, 403);
  }

  try {
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + TRIAL_DAYS);

    if (trial && !cpf_cnpj) {
      const { error: subError } = await supabase.from('subscriptions').insert({
        organization_id, user_id, plan,
        status: 'trial',
        trial_end_date: trialEndDate.toISOString(),
        amount_cents: Math.round(plano.valor * 100),
      });
      if (subError) {
        console.error('Erro ao criar subscription (trial):', subError);
        return jsonResponse({ error: `Erro ao registrar assinatura: ${subError.message}` }, 500);
      }

      const { data: empUpdated, error: empError } = await supabase
        .from('empresas')
        .update({ plan, plan_status: 'trial', onboarding_completed: true })
        .eq('id', organization_id)
        .select('id');
      if (empError || !empUpdated || empUpdated.length === 0) {
        return jsonResponse({ error: `Erro ao ativar empresa: ${empError?.message ?? 'empresa não encontrada'}` }, 500);
      }
      return jsonResponse({ trial: true, trialEndDate: trialEndDate.toISOString() });
    }

    let asaasCustomerId: string | null = null;
    const { data: org } = await supabase
      .from('empresas')
      .select('asaas_customer_id')
      .eq('id', organization_id)
      .single();

    if (org?.asaas_customer_id) {
      asaasCustomerId = org.asaas_customer_id;
    } else {
      const customer = await asaasFetch('/customers', {
        name: user_name || 'Cliente Panalearn',
        email: user_email,
        cpfCnpj: cpf_cnpj.replace(/\D/g, ''),
      });
      asaasCustomerId = customer.id;
      await supabase.from('empresas').update({ asaas_customer_id: customer.id }).eq('id', organization_id);
    }

    const nextDueDate = trialEndDate.toISOString().split('T')[0];

    const subscription = await asaasFetch('/subscriptions', {
      customer: asaasCustomerId,
      billingType: 'BOLETO',
      value: plano.valor,
      cycle: 'MONTHLY',
      nextDueDate,
      description: `Assinatura ${plano.nome}`,
      externalReference: `${organization_id}__${plan}`,
    });

    const { error: subError } = await supabase.from('subscriptions').insert({
      organization_id, user_id, plan,
      status: 'awaiting_payment',
      asaas_subscription_id: subscription.id,
      trial_end_date: trialEndDate.toISOString(),
      amount_cents: Math.round(plano.valor * 100),
    });
    if (subError) {
      console.error('Erro ao criar subscription:', subError);
      return jsonResponse({ error: `Erro ao registrar assinatura: ${subError.message}` }, 500);
    }

    const { data: empUpdated, error: empError } = await supabase
      .from('empresas')
      .update({ plan, plan_status: 'awaiting_payment', onboarding_completed: true })
      .eq('id', organization_id)
      .select('id');
    if (empError || !empUpdated || empUpdated.length === 0) {
      return jsonResponse({ error: `Erro ao ativar empresa: ${empError?.message ?? 'empresa não encontrada'}` }, 500);
    }

    let paymentUrl: string | null = null;
    try {
      const payments = await asaasFetch(`/subscriptions/${subscription.id}/payments`, undefined, 'GET');
      const firstPayment = payments?.data?.[0];
      paymentUrl = firstPayment?.invoiceUrl || firstPayment?.bankSlipUrl || null;
    } catch (e: any) {
      console.error('Falha ao buscar payments da subscription:', e.message);
    }

    return jsonResponse({
      paymentUrl: paymentUrl || `https://sandbox.asaas.com/c/${subscription.customer}`,
      subscriptionId: subscription.id,
      trialEndDate: trialEndDate.toISOString(),
    });
  } catch (error: any) {
    console.error('Erro Asaas:', { message: error.message, upstreamStatus: error.upstreamStatus });
    const status = error.isUpstream ? 502 : 500;
    return jsonResponse({
      error: error.message || 'Erro ao criar assinatura',
      upstreamStatus: error.upstreamStatus,
      upstreamDetail: error.upstreamBody,
    }, status);
  }
};

export const config: Config = { path: '/api/create-payment' };
