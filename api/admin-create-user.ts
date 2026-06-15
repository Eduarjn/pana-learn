// /api/admin-create-user.ts
// Cria um usuário em uma empresa SEM trocar a sessão do admin (usa service role).
// Chamado pelo admin (Bearer JWT). Valida que o chamador é admin da empresa alvo.

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

  const { nome, email, senha, tipo_usuario, empresa_id } = req.body || {};
  if (!email || !nome || !empresa_id || !tipo_usuario) {
    return res.status(400).json({ error: 'nome, email, tipo_usuario e empresa_id são obrigatórios' });
  }

  const admin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  // ── Autenticação + autorização do chamador ───────────────────────────────
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

  const isMaster = caller?.tipo_usuario === 'admin_master';
  const isAdminOfEmpresa = caller?.tipo_usuario === 'admin' && caller?.empresa_id === empresa_id;
  if (!isMaster && !isAdminOfEmpresa) {
    return res.status(403).json({ error: 'Sem permissão para criar usuários nesta empresa' });
  }
  if (tipo_usuario === 'admin_master' && !isMaster) {
    return res.status(403).json({ error: 'Apenas admin_master pode criar admin_master' });
  }

  // ── Cria o usuário no Auth (sem afetar a sessão do admin) ─────────────────
  const password = senha && String(senha).length >= 6 ? String(senha) : genPassword();
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nome, tipo_usuario },
  });

  if (createErr) {
    const already = /registered|already|exists/i.test(createErr.message);
    return res.status(already ? 409 : 500).json({
      error: already ? 'Este email já está cadastrado no sistema' : createErr.message,
    });
  }

  const newUserId = created.user!.id;

  // ── Garante a linha em usuarios vinculada à empresa ──────────────────────
  const { data: updated } = await admin
    .from('usuarios')
    .update({ empresa_id, tipo_usuario, nome })
    .eq('user_id', newUserId)
    .select('id');

  if (!updated || updated.length === 0) {
    const { error: insErr } = await admin.from('usuarios').insert({
      user_id: newUserId,
      email,
      nome,
      tipo_usuario,
      empresa_id,
      status: 'ativo',
    });
    if (insErr) {
      return res.status(500).json({ error: `Usuário criado mas não vinculado: ${insErr.message}` });
    }
  }

  return res.status(200).json({ success: true, password });
}
