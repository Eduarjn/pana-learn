// Netlify Function — paridade com api/dev-receive-payment.ts
// Caminho exposto: /api/dev-receive-payment

import type { Context, Config } from '@netlify/functions';

const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '';
const ADMIN_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN || '';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export default async (req: Request, _ctx: Context) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const url = new URL(req.url);
  const token = req.headers.get('x-admin-token') || url.searchParams.get('token') || '';
  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) return json({ error: 'Unauthorized' }, 401);

  const body = await req.json().catch(() => ({}));
  const { paymentId, value } = body;
  if (!paymentId || !value) return json({ error: 'paymentId e value obrigatórios' }, 400);

  try {
    const today = new Date().toISOString().split('T')[0];
    const r = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/receiveInCash`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', access_token: ASAAS_API_KEY },
      body: JSON.stringify({ paymentDate: today, value, notifyCustomer: false }),
    });
    const text = await r.text();
    let parsed: any = text;
    try { parsed = JSON.parse(text); } catch {}
    return json({ ok: r.ok, status: r.status, body: parsed }, r.status);
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
};

export const config: Config = { path: '/api/dev-receive-payment' };
