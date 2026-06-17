-- ════════════════════════════════════════════════════════════════════
-- Item 2 — hardening multi-tenant (achados do get_advisors security)
-- ════════════════════════════════════════════════════════════════════

-- 1) Cursos órfãos (empresa_id null) vazavam para todos os tenants via a
--    cláusula "OR empresa_id IS NULL" nas policies de SELECT. Eram cursos
--    de teste vazios (0 vídeos/certificados) e sem dono -> excluir.
DELETE FROM public.modulos
WHERE curso_id IN (SELECT id FROM public.cursos WHERE empresa_id IS NULL);
DELETE FROM public.cursos WHERE empresa_id IS NULL;

-- Consolidar as DUAS policies de SELECT redundantes numa só, isolada por
-- empresa_id (admin_master enxerga tudo). Remove a brecha do null.
DROP POLICY IF EXISTS "cursos: usuário lê da empresa" ON public.cursos;
DROP POLICY IF EXISTS "cursos_select_by_empresa" ON public.cursos;
CREATE POLICY "cursos_select_tenant" ON public.cursos
  FOR SELECT TO authenticated
  USING (empresa_id = public.get_empresa_id() OR public.is_admin_master());

-- 2) usage_monthly_summary: a policy "Service upsert summary" (ALL, true/true,
--    todos os roles) permitia ler/escrever stats de uso de QUALQUER tenant.
--    Nada escreve essa tabela via RLS (sem trigger/função/código); aggregations
--    futuras usam service role (bypassa RLS). A policy de SELECT escopada por
--    empresa ("Users read own empresa summary") permanece.
DROP POLICY IF EXISTS "Service upsert summary" ON public.usage_monthly_summary;

-- 3) Tabelas de quiz legadas (vazias, RLS habilitada sem policy, sem referência
--    no código — sobra da migração quiz-as-module). Remover.
DROP TABLE IF EXISTS public.quiz_respostas CASCADE;
DROP TABLE IF EXISTS public.quiz_tentativas CASCADE;
DROP TABLE IF EXISTS public.quiz_opcoes CASCADE;
