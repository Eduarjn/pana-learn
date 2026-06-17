-- ════════════════════════════════════════════════════════════════════════
-- Trancar funções SECURITY DEFINER que estavam com GRANT a PUBLIC/anon
-- (advisor: anon_security_definer_function_executable).
--
-- Achado crítico: admin_update_user_password(uuid, text) era chamável por
-- qualquer usuário autenticado/anon -> trocava a senha de QUALQUER usuário
-- (account takeover). Idem deletar/exportar dados (PII).
-- ════════════════════════════════════════════════════════════════════════

-- RPCs privilegiadas NÃO usadas pelo app -> só service_role (via endpoints)
REVOKE EXECUTE ON FUNCTION public.admin_update_user_password(uuid, text)             FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_link_user_to_empresa(uuid, uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.deletar_dados_usuario(uuid)                        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.exportar_dados_usuario(uuid)                       FROM PUBLIC, anon, authenticated;

-- RPCs usadas por usuários AUTENTICADOS: tira de PUBLIC/anon, mantém authenticated
REVOKE EXECUTE ON FUNCTION public.delete_video_comment_admin(uuid)                  FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_empresa_for_user(text, text, text, text)   FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.delete_video_comment_admin(uuid)                  TO authenticated;
GRANT  EXECUTE ON FUNCTION public.create_empresa_for_user(text, text, text, text)   TO authenticated;

-- Funções de TRIGGER: ninguém chama direto (o trigger dispara sem EXECUTE)
REVOKE EXECUTE ON FUNCTION public.handle_new_user()       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.criar_quiz_automatico() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_admin_action()      FROM PUBLIC, anon, authenticated;
