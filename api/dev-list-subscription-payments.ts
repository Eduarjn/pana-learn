// /api/dev-list-subscription-payments.ts
// DEV: lista cobrancas de uma subscription Asaas. Util quando nao tem
// login no sandbox para descobrir paymentId.
// REMOVER apos teste end-to-end.

import type { VercelRequest, VercelResponse } from '@vercel/node';

const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '';
const ADMIN_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.headers['x-admin-token'] as string;
  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const subscriptionId = (req.query.subscriptionId || req.query.sub) as string;
  if (!subscriptionId) return res.status(400).json({ error: 'subscriptionId obrigatorio' });

  try {
    const r = await fetch(`${ASAAS_API_URL}/subscriptions/${subscriptionId}/payments`, {
      headers: { access_token: ASAAS_API_KEY },
    });
    const body = await r.json();
    return res.status(r.status).json(body);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
