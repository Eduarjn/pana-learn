-- =============================================================================
-- Drop setup_tenant_environment: função quebrada que referenciava tabela
-- 'organizations' (nunca criada em prod). Substituída por create_empresa_for_user
-- + fluxo de onboarding novo (StepConta/StepPersonalize/StepPagamento).
--
-- Aplicada via MCP em 2026-06-13 no projeto oqoxhavdhrgdjvxvajze.
-- =============================================================================

DROP FUNCTION IF EXISTS public.setup_tenant_environment(uuid, uuid, text, text, text, text, text);
