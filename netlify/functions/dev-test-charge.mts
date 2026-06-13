// Netlify Function — paridade com api/dev-test-charge.ts
// Caminho exposto: /api/dev-test-charge

import type { Context, Config } from '@netlify/functions';

const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '';

async function asaasFetch(endpoint: string, body: Record<string, unknown>) {
  const res = await fetch(`${ASAAS_API_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', access_token: ASAAS_API_KEY },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let parsed: any = text;
  try { parsed = JSON.parse(text); } catch {}
  if (!res.ok) {
    const msg = parsed?.errors?.[0]?.description || `Asaas ${res.status}`;
    const err: any = new Error(msg);
    err.status = res.status;
    err.detail = parsed;
    throw err;
  }
  return parsed;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });

export default async (req: Request, _ctx: Context) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200 });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const { nome, email, cpfCnpj } = await req.json().catch(() => ({}));
  if (!nome || !email || !cpfCnpj) {
    return json({ error: 'nome, email e cpfCnpj sao obrigatorios' }, 400);
  }

  try {
    const customer = await asaasFetch('/customers', {
      name: nome,
      email,
      cpfCnpj: String(cpfCnpj).replace(/\D/g, ''),
    });

    const due = new Date();
    due.setDate(due.getDate() + 3);
    const dueDate = due.toISOString().split('T')[0];

    const payment = await asaasFetch('/payments', {
      customer: customer.id,
      billingType: 'PIX',
      value: 10.00,
      dueDate,
      description: 'Teste Panalearn R$ 10',
    });

    return json({
      paymentId: payment.id,
      invoiceUrl: payment.invoiceUrl,
      bankSlipUrl: payment.bankSlipUrl,
      value: payment.value,
      dueDate: payment.dueDate,
    });
  } catch (e: any) {
    console.error('dev-test-charge erro:', e.message, e.detail);
    return json({ error: e.message, detail: e.detail }, e.status || 500);
  }
};

export const config: Config = { path: '/api/dev-test-charge' };
