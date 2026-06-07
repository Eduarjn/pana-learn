// supabase/functions/admin-update-password/index.ts
// Edge Function para admin alterar senha de utilizadores
// Usa a SERVICE_ROLE_KEY do servidor (nunca exposta ao browser)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    // 1. Verificar que o chamador é admin autenticado
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Criar client com a anon key para verificar o JWT do chamador
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verificar quem é o chamador
    const { data: { user: caller }, error: authError } = await anonClient.auth.getUser();
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Verificar se é admin ou admin_master na tabela usuarios
    const { data: callerProfile } = await anonClient
      .from("usuarios")
      .select("tipo_usuario")
      .or(`user_id.eq.${caller.id},id.eq.${caller.id}`)
      .single();

    if (!callerProfile || !["admin", "admin_master"].includes(callerProfile.tipo_usuario)) {
      return new Response(JSON.stringify({ error: "Sem permissão. Apenas admins podem alterar senhas." }), {
        status: 403,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // 2. Ler os dados do request
    const { user_id, password, user_data } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id obrigatório" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // 3. Verificar se o alvo é admin_master (admin comum não pode editar admin_master)
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: targetUser } = await adminClient
      .from("usuarios")
      .select("tipo_usuario")
      .or(`user_id.eq.${user_id},id.eq.${user_id}`)
      .single();

    if (targetUser?.tipo_usuario === "admin_master" && callerProfile.tipo_usuario !== "admin_master") {
      return new Response(JSON.stringify({ error: "Sem permissão. Apenas admin master pode alterar outro admin master." }), {
        status: 403,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Alterar senha se fornecida
    if (password) {
      const { error: pwError } = await adminClient.auth.admin.updateUserById(user_id, { password });
      if (pwError) {
        return new Response(JSON.stringify({ error: pwError.message }), {
          status: 400,
          headers: { ...CORS, "Content-Type": "application/json" },
        });
      }
    }

    // Alterar outros dados se fornecidos (email, user_metadata)
    if (user_data) {
      const { error: udError } = await adminClient.auth.admin.updateUserById(user_id, user_data);
      if (udError) {
        return new Response(JSON.stringify({ error: udError.message }), {
          status: 400,
          headers: { ...CORS, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
