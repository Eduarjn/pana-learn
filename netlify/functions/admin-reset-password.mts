// Netlify Function — redefine a senha de um usuário via service role.
// Substituto SEGURO do "ver senha": a senha antiga é hash irreversível; o admin
// define uma nova e a recebe UMA vez para repassar ao usuário.
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

  // target_user_id = usuarios.id do alvo; senha opcional (se ausente, gera)
  const { target_user_id, senha } = await req.json().catch(() => ({}));
  if (!target_user_id) return json({ error: 'target_user_id é obrigatório' }, 400);
  if (senha && String(senha).length < 8) return json({ error: 'A senha deve ter ao menos 8 caracteres' }, 400);

  const admin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  // 1) Autenticar o chamador
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

  // 2) Carregar o usuário alvo (precisa do user_id de auth e da empresa)
  const { data: target } = await admin
    .from('usuarios')
    .select('user_id, empresa_id, tipo_usuario, email')
    .eq('id', target_user_id)
    .maybeSingle();

  if (!target?.user_id) return json({ error: 'Usuário alvo não encontrado' }, 404);

  // 3) Permissão: admin_master pode tudo; admin só na própria empresa
  const isMaster = caller?.tipo_usuario === 'admin_master';
  const isAdminOfEmpresa = caller?.tipo_usuario === 'admin' && caller?.empresa_id === target.empresa_id;
  if (!isMaster && !isAdminOfEmpresa) {
    return json({ error: 'Sem permissão para redefinir a senha deste usuário' }, 403);
  }
  // admin comum não pode redefinir senha de admin_master
  if (target.tipo_usuario === 'admin_master' && !isMaster) {
    return json({ error: 'Apenas admin_master pode redefinir senha de admin_master' }, 403);
  }

  // 4) Redefinir a senha no Supabase Auth
  const password = senha && String(senha).length >= 8 ? String(senha) : genPassword();
  const { error: updErr } = await admin.auth.admin.updateUserById(target.user_id, { password });
  if (updErr) {
    const weak = /weak|easy to guess|pwned|leaked/i.test(updErr.message);
    return json(
      { error: weak ? 'Senha muito comum ou vazada. Escolha uma senha mais forte.' : updErr.message },
      weak ? 422 : 500,
    );
  }

  return json({ success: true, password, email: target.email });
};

export const config: Config = { path: '/api/admin-reset-password' };
