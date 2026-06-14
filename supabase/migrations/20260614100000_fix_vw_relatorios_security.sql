-- =============================================================================
-- FIX CRÍTICO: vw_relatorios vazava PII (nome, email, progresso) de TODOS os
-- tenants para qualquer um — era SECURITY DEFINER (ignora RLS) e tinha SELECT
-- concedido ao role anon (não autenticado).
--
-- Correção:
--   - security_invoker = true → view passa a respeitar a RLS de
--     progresso_usuario / usuarios / cursos (isolamento por empresa_id).
--   - REVOKE do anon → relatório nunca é legível por não autenticado.
--
-- Aplicada via MCP em 2026-06-14 no projeto oqoxhavdhrgdjvxvajze.
-- =============================================================================

ALTER VIEW public.vw_relatorios SET (security_invoker = true);
REVOKE ALL ON public.vw_relatorios FROM anon;
