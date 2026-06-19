// Netlify Function — Direitos do titular dos dados (LGPD art. 18):
// GET    → exporta TODOS os dados do usuário autenticado em JSON
// DELETE → exclui a conta do usuário autenticado (Auth + linha em usuarios + RPC de anonimização)
// O usuário só pode agir sobre os PRÓPRIOS dados — nunca de outro usuário.
import type { Context, Config } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const ALLOWED_ORIGINS = new Set([
  'https://www.panalearn.com',
  'https://panalearn.com',
  'https://panalearn.netlify.app',
  'http://localhost:8080',
  'http://localhost:5173',
]);

export default async (req: Request, _ctx: Context) => {
  const origin = req.headers.get('origin') || '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  if (ALLOWED_ORIGINS.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers });
  if (!['GET', 'DELETE'].includes(req.method)) return json({ error: 'Method not allowed' }, 405);

  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: 'Supabase não configurado no servidor' }, 503);
  }

  const admin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  // Auth do chamador
  const authHeader = req.headers.get('authorization') || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!bearer) return json({ error: 'Autenticação necessária' }, 401);
  const { data: authData, error: authErr } = await admin.auth.getUser(bearer);
  if (authErr || !authData.user) return json({ error: 'Sessão inválida' }, 401);
  const authUserId = authData.user.id;

  if (req.method === 'GET') {
    // Exporta dados do PRÓPRIO usuário
    const { data, error } = await admin.rpc('exportar_dados_usuario', { p_user_id: authUserId });
    if (error) return json({ error: error.message }, 500);
    return new Response(JSON.stringify(data ?? {}, null, 2), {
      status: 200,
      headers: {
        ...headers,
        'Content-Disposition': `attachment; filename="panalearn-meus-dados-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  }

  // DELETE: exclui conta do PRÓPRIO usuário
  // 1) chama RPC de anonimização/limpeza no schema public
  const { error: rpcErr } = await admin.rpc('deletar_dados_usuario', { p_user_id: authUserId });
  if (rpcErr) return json({ error: `Falha ao limpar dados: ${rpcErr.message}` }, 500);

  // 2) remove o usuário do Supabase Auth (revoga sessão e impossibilita login)
  const { error: delAuthErr } = await admin.auth.admin.deleteUser(authUserId);
  if (delAuthErr) return json({ error: `Dados anonimizados mas falha ao excluir login: ${delAuthErr.message}` }, 500);

  return json({ success: true, message: 'Sua conta foi excluída. Sentiremos sua falta.' });
};

export const config: Config = { path: '/api/user-data' };
