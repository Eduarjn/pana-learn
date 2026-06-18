// Netlify Function — Gerenciamento do uso de IA por empresa.
// Permite ao admin_master (ou admin da própria empresa) ajustar o limite
// mensal de tokens e zerar o consumo do mês.
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
    return json({ error: 'Supabase não configurado no servidor' }, 503);
  }

  const { empresa_id, action, value } = await req.json().catch(() => ({}));
  if (!empresa_id) return json({ error: 'empresa_id obrigatório' }, 400);
  if (!['set_limit', 'clear_limit', 'reset_usage'].includes(action)) {
    return json({ error: 'action inválida' }, 400);
  }

  const admin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  // Autenticar chamador
  const authHeader = req.headers.get('authorization') || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!bearer) return json({ error: 'Autenticação necessária' }, 401);

  const { data: authData, error: authErr } = await admin.auth.getUser(bearer);
  if (authErr || !authData.user) return json({ error: 'Sessão inválida' }, 401);

  const { data: caller } = await admin
    .from('usuarios')
    .select('empresa_id, tipo_usuario')
    .eq('user_id', authData.user.id)
    .maybeSingle();

  const isMaster = caller?.tipo_usuario === 'admin_master';
  const isAdminOfEmpresa = caller?.tipo_usuario === 'admin' && caller?.empresa_id === empresa_id;
  if (!isMaster && !isAdminOfEmpresa) {
    return json({ error: 'Sem permissão para gerenciar IA desta empresa' }, 403);
  }

  if (action === 'set_limit') {
    const limit = Number(value);
    if (!Number.isFinite(limit) || limit < 0) return json({ error: 'Valor de limite inválido' }, 400);
    const { error } = await admin.from('empresas').update({ ai_tokens_limit_override: Math.floor(limit) }).eq('id', empresa_id);
    if (error) return json({ error: error.message }, 500);
    return json({ success: true, message: `Limite definido em ${Math.floor(limit).toLocaleString('pt-BR')} tokens/mês` });
  }

  if (action === 'clear_limit') {
    const { error } = await admin.from('empresas').update({ ai_tokens_limit_override: null }).eq('id', empresa_id);
    if (error) return json({ error: error.message }, 500);
    return json({ success: true, message: 'Limite voltou a usar o padrão do plano' });
  }

  if (action === 'reset_usage') {
    const period = new Date().toISOString().slice(0, 7);
    const { error } = await admin
      .from('ai_token_usage')
      .upsert({ empresa_id, period_month: period, tokens_used: 0, updated_at: new Date().toISOString() }, { onConflict: 'empresa_id,period_month' });
    if (error) return json({ error: error.message }, 500);
    return json({ success: true, message: 'Uso do mês atual foi zerado' });
  }

  return json({ error: 'action inválida' }, 400);
};

export const config: Config = { path: '/api/admin-ai-usage' };
