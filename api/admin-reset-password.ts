// /api/admin-reset-password.ts
// Redefine a senha de um usuário via service role (substituto seguro do "ver
// senha": a senha antiga é hash irreversível). Chamado pelo admin (Bearer JWT);
// valida que o chamador é admin_master ou admin da empresa do usuário alvo.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const ALLOWED_ORIGINS = new Set([
  'https://www.panalearn.com',
  'https://panalearn.com',
  'https://panalearn.netlify.app',
  'http://localhost:8080',
  'http://localhost:5173',
]);

function genPassword() {
  return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase() + '!2';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = (req.headers.origin as string) || '';
  if (ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(503).json({ error: 'Supabase credentials not configured no servidor' });
  }

  const { target_user_id, senha } = req.body || {};
  if (!target_user_id) return res.status(400).json({ error: 'target_user_id é obrigatório' });
  if (senha && String(senha).length < 8) {
    return res.status(400).json({ error: 'A senha deve ter ao menos 8 caracteres' });
  }

  const admin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  // ── Autenticação do chamador ─────────────────────────────────────────────
  const authHeader = req.headers.authorization || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!bearer) return res.status(401).json({ error: 'Authorization Bearer obrigatório' });

  const { data: authData, error: authErr } = await admin.auth.getUser(bearer);
  if (authErr || !authData.user) return res.status(401).json({ error: 'Token inválido' });

  const { data: caller } = await admin
    .from('usuarios')
    .select('empresa_id, tipo_usuario')
    .eq('user_id', authData.user.id)
    .maybeSingle();

  // ── Usuário alvo ─────────────────────────────────────────────────────────
  const { data: target } = await admin
    .from('usuarios')
    .select('user_id, empresa_id, tipo_usuario, email')
    .eq('id', target_user_id)
    .maybeSingle();

  if (!target?.user_id) return res.status(404).json({ error: 'Usuário alvo não encontrado' });

  // ── Autorização ──────────────────────────────────────────────────────────
  const isMaster = caller?.tipo_usuario === 'admin_master';
  const isAdminOfEmpresa = caller?.tipo_usuario === 'admin' && caller?.empresa_id === target.empresa_id;
  if (!isMaster && !isAdminOfEmpresa) {
    return res.status(403).json({ error: 'Sem permissão para redefinir a senha deste usuário' });
  }
  if (target.tipo_usuario === 'admin_master' && !isMaster) {
    return res.status(403).json({ error: 'Apenas admin_master pode redefinir senha de admin_master' });
  }

  // ── Redefine no Supabase Auth ────────────────────────────────────────────
  const password = senha && String(senha).length >= 8 ? String(senha) : genPassword();
  const { error: updErr } = await admin.auth.admin.updateUserById(target.user_id, { password });
  if (updErr) {
    const weak = /weak|easy to guess|pwned|leaked/i.test(updErr.message);
    return res.status(weak ? 422 : 500).json({
      error: weak ? 'Senha muito comum ou vazada. Escolha uma senha mais forte.' : updErr.message,
    });
  }

  return res.status(200).json({ success: true, password, email: target.email });
}
