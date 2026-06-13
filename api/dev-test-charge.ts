// /api/dev-test-charge.ts
// DEV: cria cobranca Pix R$ 10 no Asaas para simular fluxo de pagamento real.
// Retorna invoiceUrl que abre QR Code Pix + boleto.
// REMOVER apos validacao.

import type { VercelRequest, VercelResponse } from '@vercel/node';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { nome, email, cpfCnpj } = req.body || {};
  if (!nome || !email || !cpfCnpj) {
    return res.status(400).json({ error: 'nome, email e cpfCnpj sao obrigatorios' });
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

    return res.status(200).json({
      paymentId: payment.id,
      invoiceUrl: payment.invoiceUrl,
      bankSlipUrl: payment.bankSlipUrl,
      value: payment.value,
      dueDate: payment.dueDate,
    });
  } catch (e: any) {
    console.error('dev-test-charge erro:', e.message, e.detail);
    return res.status(e.status || 500).json({ error: e.message, detail: e.detail });
  }
}
