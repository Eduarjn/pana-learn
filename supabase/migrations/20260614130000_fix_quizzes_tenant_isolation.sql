-- =============================================================================
-- FIX: isolamento por tenant em quizzes / quiz_perguntas
--
-- 1. quizzes tinha DUAS policies de INSERT: a estrita (empresa_id=get_empresa_id)
--    e a frouxa 'quizzes_insert_admin' (so checa is_admin, sem empresa_id).
--    Como RLS combina INSERT com OR, a frouxa anulava a estrita — admin podia
--    criar quiz orfao (empresa_id NULL). Removida a frouxa.
--
-- 2. quiz_perguntas tinha so 'quiz_perguntas_admin' (ALL, sem with_check) =
--    totalmente permissiva. Substituida por SELECT escopado por empresa e
--    WRITE restrito a admin da propria empresa.
--
-- Frontend tambem passou a propagar empresa_id nos INSERTs de quiz/perguntas
-- (Quizzes.tsx, QuizConfig.tsx).
--
-- Aplicada via MCP em 2026-06-14 no projeto oqoxhavdhrgdjvxvajze.
-- =============================================================================

DROP POLICY IF EXISTS quizzes_insert_admin ON public.quizzes;

DROP POLICY IF EXISTS quiz_perguntas_admin ON public.quiz_perguntas;

CREATE POLICY quiz_perguntas_select_tenant ON public.quiz_perguntas
  FOR SELECT TO authenticated
  USING (empresa_id = public.get_empresa_id() OR empresa_id IS NULL OR public.is_admin_master());

CREATE POLICY quiz_perguntas_write_tenant ON public.quiz_perguntas
  FOR ALL TO authenticated
  USING (public.is_admin() AND (empresa_id = public.get_empresa_id() OR public.is_admin_master()))
  WITH CHECK (public.is_admin() AND (empresa_id = public.get_empresa_id() OR public.is_admin_master()));
