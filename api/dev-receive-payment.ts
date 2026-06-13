// /api/dev-receive-payment.ts
// ENDPOINT TEMPORÁRIO de DEV — marca uma cobrança Asaas como recebida em dinheiro.
// Protegido por ASAAS_WEBHOOK_TOKEN (reusa token existente).
// REMOVER APÓS TESTE END-TO-END.

import type { VercelRequest, VercelResponse } from '@vercel/node';

const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '';
const ADMIN_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.headers['x-admin-token'] as string;
  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { paymentId, value } = req.body || {};
  if (!paymentId || !value) {
    return res.status(400).json({ error: 'paymentId e value obrigatórios' });
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const r = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/receiveInCash`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', access_token: ASAAS_API_KEY },
      body: JSON.stringify({ paymentDate: today, value, notifyCustomer: false }),
    });
    const text = await r.text();
    let body: any = text;
    try { body = JSON.parse(text); } catch {}
    return res.status(r.status).json({ ok: r.ok, status: r.status, body });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
