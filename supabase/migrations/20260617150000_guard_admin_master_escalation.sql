-- ════════════════════════════════════════════════════════════════════════
-- Item 3 (parte crítica): impedir escalada para admin_master pelo frontend.
--
-- Contexto: usuarios NÃO tem UNIQUE em user_id, e a policy usuarios_update_tenant
-- permite user_id=auth.uid() no USING+CHECK. Logo um usuário podia (a) inserir
-- uma 2ª linha para si com tipo_usuario='admin_master' ou (b) atualizar a
-- própria linha para 'admin_master' -> god-mode cross-tenant
-- (is_admin_master() usa EXISTS user_id=auth.uid AND tipo='admin_master').
--
-- Trigger bloqueia conceder admin_master a partir do frontend. Backend
-- (service_role, auth.uid() NULL) e um admin_master existente seguem podendo.
-- Onboarding usa 'admin' (não 'admin_master') -> não é afetado.
-- ════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.guard_admin_master_grant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.tipo_usuario = 'admin_master'
     AND auth.uid() IS NOT NULL
     AND NOT public.is_admin_master() THEN
    RAISE EXCEPTION 'Apenas admin_master pode conceder o papel admin_master';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_usuarios_guard_admin_master ON public.usuarios;
CREATE TRIGGER trg_usuarios_guard_admin_master
  BEFORE INSERT OR UPDATE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION public.guard_admin_master_grant();
