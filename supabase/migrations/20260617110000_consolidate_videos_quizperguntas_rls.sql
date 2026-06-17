-- Fecha o vetor latente "empresa_id IS NULL" nas policies de SELECT de videos
-- e quiz_perguntas (0 linhas null hoje), consolidando numa policy isolada por
-- empresa_id (admin_master enxerga tudo) — mesmo padrão de cursos/quizzes.

DROP POLICY IF EXISTS "videos: usuário lê da empresa" ON public.videos;
DROP POLICY IF EXISTS "videos_select_by_empresa" ON public.videos;
CREATE POLICY "videos_select_tenant" ON public.videos
  FOR SELECT TO authenticated
  USING (empresa_id = public.get_empresa_id() OR public.is_admin_master());

DROP POLICY IF EXISTS "quiz_perguntas_select" ON public.quiz_perguntas;
DROP POLICY IF EXISTS "quiz_perguntas_select_tenant" ON public.quiz_perguntas;
CREATE POLICY "quiz_perguntas_select_tenant" ON public.quiz_perguntas
  FOR SELECT TO authenticated
  USING (empresa_id = public.get_empresa_id() OR public.is_admin_master());
