// /api/create-tenant-user.ts
// Cria usuário no Supabase Auth e vincula à empresa do tenant

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { nome, email, senha, tipo_usuario, empresa_id } = req.body;

  if (!nome || !email || !senha || !empresa_id) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { full_name: nome },
    });

    if (authError) throw authError;

    // 2. Criar na tabela usuarios vinculado ao empresa_id do tenant
    const { error: usuarioError } = await supabase.from('usuarios').insert({
      nome,
      email,
      tipo_usuario: tipo_usuario || 'cliente',
      status: 'ativo',
      user_id: authData.user.id,
      empresa_id,
      senha_hashed: 'supabase_auth',
    });

    if (usuarioError) {
      // Rollback: deletar o auth user criado
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw usuarioError;
    }

    return res.status(200).json({ ok: true, user_id: authData.user.id });

  } catch (error: any) {
    console.error('create-tenant-user error:', error);
    return res.status(500).json({ error: error.message || 'Erro interno' });
  }
}
