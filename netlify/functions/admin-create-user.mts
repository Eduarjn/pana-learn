// Netlify Function — paridade com api/admin-create-user.ts
// Cria usuário em uma empresa via service role, sem trocar a sessão do admin.
import type { Context, Config } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const ALLOWED_ORIGINS = new Set([
  'https://www.panalearn.com',
  'https://panalearn.com',
  'https://panalearn.netlify.app',
  'http://localhost:8080',
  'http://localhost:5173',
]);

const genPassword = () =>
  Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase() + '!2';

export default async (req: Request, _ctx: Context) => {
  const origin = req.headers.get('origin') || '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  if (ALLOWED_ORIGINS.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: 'Supabase credentials not configured no servidor' }, 503);
  }

  const { nome, email, senha, tipo_usuario, empresa_id } = await req.json().catch(() => ({}));
  if (!email || !nome || !empresa_id || !tipo_usuario) {
    return json({ error: 'nome, email, tipo_usuario e empresa_id são obrigatórios' }, 400);
  }

  const admin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const authHeader = req.headers.get('authorization') || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!bearer) return json({ error: 'Authorization Bearer obrigatório' }, 401);

  const { data: authData, error: authErr } = await admin.auth.getUser(bearer);
  if (authErr || !authData.user) return json({ error: 'Token inválido' }, 401);

  const { data: caller } = await admin
    .from('usuarios')
    .select('empresa_id, tipo_usuario')
    .eq('user_id', authData.user.id)
    .maybeSingle();

  const isMaster = caller?.tipo_usuario === 'admin_master';
  const isAdminOfEmpresa = caller?.tipo_usuario === 'admin' && caller?.empresa_id === empresa_id;
  if (!isMaster && !isAdminOfEmpresa) {
    return json({ error: 'Sem permissão para criar usuários nesta empresa' }, 403);
  }
  if (tipo_usuario === 'admin_master' && !isMaster) {
    return json({ error: 'Apenas admin_master pode criar admin_master' }, 403);
  }

  const password = senha && String(senha).length >= 6 ? String(senha) : genPassword();
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nome, tipo_usuario },
  });

  if (createErr) {
    const already = /registered|already|exists/i.test(createErr.message);
    return json(
      { error: already ? 'Este email já está cadastrado no sistema' : createErr.message },
      already ? 409 : 500,
    );
  }

  const newUserId = created.user!.id;

  const { data: updated } = await admin
    .from('usuarios')
    .update({ empresa_id, tipo_usuario, nome })
    .eq('user_id', newUserId)
    .select('id');

  if (!updated || updated.length === 0) {
    const { error: insErr } = await admin.from('usuarios').insert({
      user_id: newUserId, email, nome, tipo_usuario, empresa_id, status: 'ativo',
    });
    if (insErr) return json({ error: `Usuário criado mas não vinculado: ${insErr.message}` }, 500);
  }

  return json({ success: true, password });
};

export const config: Config = { path: '/api/admin-create-user' };
