-- Hardening: remove acesso anônimo (anon/PUBLIC) a funções SECURITY DEFINER sensíveis.
--
-- Contexto: advisors do Supabase apontaram 29 funções SECURITY DEFINER executáveis
-- pelo papel `anon` (usuário NÃO autenticado) via /rest/v1/rpc/. Algumas não tinham
-- nenhuma checagem interna de autenticação, permitindo a um anônimo:
--   • reescrever a branding da plataforma (update_branding_config)
--   • forjar certificados para qualquer usuário/curso (gerar_certificado_*)
--   • ler certificados (PII) de qualquer usuário (buscar_certificados_usuario_dinamico)
--
-- Estratégia conservadora (não altera lógica/corpo das funções):
--   1. Funções usadas pelo frontend autenticado → REVOKE de PUBLIC/anon, mantém authenticated.
--   2. Funções de TRIGGER → REVOKE de PUBLIC/anon/authenticated (triggers disparam como
--      owner, não precisam de grant de EXECUTE; não há motivo de ficarem no RPC).
--
-- NÃO mexido de propósito:
--   • Helpers de RLS (is_admin, get_empresa_id, current_empresa_id, etc.): são chamados
--     dentro de policies; revogar EXECUTE poderia quebrar o RLS. Além disso só retornam
--     o contexto do próprio caller (para anon = null), não vazam dados de terceiros.
--   • validar_certificado_dinamico: validação PÚBLICA de certificado (/validar/:codigo)
--     precisa continuar acessível ao anon.

-- ── 1. Funções de negócio: somente usuários autenticados ──────────────────────
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.update_branding_config(text,text,text,text,text,text,text)',
    'public.update_branding_config(text,text,text,text,text,text,text,text)',
    'public.gerar_certificado_dinamico(uuid,uuid,uuid,integer)',
    'public.gerar_certificado_curso(uuid,uuid,uuid,integer)',
    'public.gerar_certificado_curso(uuid,uuid,uuid,numeric)',
    'public.gerar_numero_certificado(uuid,uuid)',
    'public.buscar_certificados_usuario_dinamico(uuid)'
  ]
  loop
    execute format('revoke execute on function %s from public', fn);
    execute format('revoke execute on function %s from anon', fn);
    execute format('grant execute on function %s to authenticated', fn);
  end loop;
end $$;

-- ── 2. Funções de TRIGGER: sem acesso via RPC para ninguém ────────────────────
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.atualizar_progresso_geral_curso()',
    'public.atualizar_ultimo_login_usuario()',
    'public.guard_admin_master_grant()'
  ]
  loop
    execute format('revoke execute on function %s from public', fn);
    execute format('revoke execute on function %s from anon', fn);
    execute format('revoke execute on function %s from authenticated', fn);
  end loop;
end $$;
