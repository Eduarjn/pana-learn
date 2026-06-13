// Netlify Function — paridade com api/dev-list-subscription-payments.ts
// Caminho exposto: /api/dev-list-subscription-payments

import type { Context, Config } from '@netlify/functions';

const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '';
const ADMIN_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN || '';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export default async (req: Request, _ctx: Context) => {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);

  const token = req.headers.get('x-admin-token') || '';
  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) return json({ error: 'Unauthorized' }, 401);

  const url = new URL(req.url);
  const subscriptionId = url.searchParams.get('subscriptionId') || url.searchParams.get('sub');
  if (!subscriptionId) return json({ error: 'subscriptionId obrigatorio' }, 400);

  try {
    const r = await fetch(`${ASAAS_API_URL}/subscriptions/${subscriptionId}/payments`, {
      headers: { access_token: ASAAS_API_KEY },
    });
    const body = await r.json();
    return json(body, r.status);
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
};

export const config: Config = { path: '/api/dev-list-subscription-payments' };
