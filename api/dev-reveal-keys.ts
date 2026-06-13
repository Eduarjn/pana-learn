// /api/dev-reveal-keys.ts
// TEMPORARIO: devolve chaves do servidor para migracao para outro host.
// Protegido por ASAAS_WEBHOOK_TOKEN. REMOVER imediatamente apos migracao.

import type { VercelRequest, VercelResponse } from '@vercel/node';

const ADMIN_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers['x-admin-token'] || req.query.token) as string;
  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return res.status(200).json({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || null,
    ASAAS_API_KEY: process.env.ASAAS_API_KEY || null,
    ASAAS_API_URL: process.env.ASAAS_API_URL || null,
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || null,
  });
}
