-- =============================================================================
-- FIX: subscriptions tinha RLS 'always true' para authenticated em INSERT,
-- UPDATE e SELECT. Riscos:
--   - UPDATE/INSERT abertos: usuario logado podia marcar a propria assinatura
--     como 'active' sem pagar.
--   - SELECT aberto: lia assinaturas de TODOS os tenants.
--
-- Frontend nunca escreve em subscriptions (so o service_role via webhook e
-- create-payment, que ignora RLS). Logo: remove INSERT/UPDATE de authenticated
-- e escopa SELECT por tenant.
--
-- Aplicada via MCP em 2026-06-14 no projeto oqoxhavdhrgdjvxvajze.
-- =============================================================================

DROP POLICY IF EXISTS subs_insert ON public.subscriptions;
DROP POLICY IF EXISTS subs_update ON public.subscriptions;
DROP POLICY IF EXISTS subs_select ON public.subscriptions;

CREATE POLICY subs_select_tenant ON public.subscriptions
  FOR SELECT TO authenticated
  USING (
    organization_id = public.get_empresa_id()
    OR public.is_admin_master()
  );
