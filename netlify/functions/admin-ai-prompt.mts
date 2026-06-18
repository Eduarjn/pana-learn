// Netlify Function — Gerencia o system prompt do assistente IA.
// Apenas admin_master pode ler/editar. Singleton (id=true).
import type { Context, Config } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const ALLOWED_ORIGINS = new Set([
  'https://www.panalearn.com',
  'https://panalearn.com',
  'https://panalearn.netlify.app',
  'http://localhost:8080',
  'http://localhost:5173',
]);

const MAX_PROMPT_LEN = 100_000;

export default async (req: Request, _ctx: Context) => {
  const origin = req.headers.get('origin') || '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  if (ALLOWED_ORIGINS.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers });
  if (!['GET', 'POST'].includes(req.method)) return json({ error: 'Method not allowed' }, 405);

  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: 'Supabase não configurado no servidor' }, 503);
  }

  const admin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  // Auth: admin_master apenas
  const auth = req.headers.get('authorization') || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!bearer) return json({ error: 'Autenticação necessária' }, 401);
  const { data: authData, error: authErr } = await admin.auth.getUser(bearer);
  if (authErr || !authData.user) return json({ error: 'Sessão inválida' }, 401);
  const { data: caller } = await admin.from('usuarios').select('tipo_usuario').eq('user_id', authData.user.id).maybeSingle();
  if (caller?.tipo_usuario !== 'admin_master') return json({ error: 'Apenas admin_master pode gerenciar o prompt' }, 403);

  if (req.method === 'GET') {
    const { data, error } = await admin.from('ai_settings').select('system_prompt, updated_at, updated_by').eq('id', true).maybeSingle();
    if (error) return json({ error: error.message }, 500);
    return json({
      system_prompt: data?.system_prompt || '',
      updated_at: data?.updated_at || null,
      updated_by: data?.updated_by || null,
    });
  }

  // POST: atualizar
  const { system_prompt } = await req.json().catch(() => ({}));
  if (typeof system_prompt !== 'string') return json({ error: 'system_prompt obrigatório' }, 400);
  const trimmed = system_prompt.trim();
  if (!trimmed) return json({ error: 'O prompt não pode ficar vazio' }, 400);
  if (trimmed.length > MAX_PROMPT_LEN) return json({ error: `Prompt muito longo (máx ${MAX_PROMPT_LEN} caracteres)` }, 400);

  const { error } = await admin
    .from('ai_settings')
    .update({ system_prompt: trimmed, updated_at: new Date().toISOString(), updated_by: authData.user.id })
    .eq('id', true);
  if (error) return json({ error: error.message }, 500);

  return json({ success: true, message: 'Prompt da IA atualizado com sucesso.', length: trimmed.length });
};

export const config: Config = { path: '/api/admin-ai-prompt' };
