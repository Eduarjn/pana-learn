-- =============================================================================
-- video_progress: alinhar RLS a convencao do codigo (usuarios.id).
--
-- O player e a leitura de progresso usam usuarios.id como user_id (igual a
-- progresso_quiz/certificados). A RLS anterior exigia user_id = auth.uid(),
-- bloqueando TODOS os writes — video_progress ficava sempre vazio, o curso
-- nunca chegava a 100%, o quiz nunca liberava e o certificado nunca era
-- gerado. Alinhado para user_id IN (usuarios do auth.uid()).
--
-- Aplicada via MCP em 2026-06-15 no projeto oqoxhavdhrgdjvxvajze.
-- =============================================================================

DROP POLICY IF EXISTS video_progress_select_tenant ON public.video_progress;
DROP POLICY IF EXISTS video_progress_insert_tenant ON public.video_progress;
DROP POLICY IF EXISTS video_progress_update_tenant ON public.video_progress;

CREATE POLICY video_progress_select_tenant ON public.video_progress
  FOR SELECT TO authenticated
  USING (
    user_id IN (SELECT id FROM public.usuarios WHERE user_id = auth.uid())
    OR (public.is_admin() AND empresa_id = public.get_empresa_id())
    OR public.is_admin_master()
  );

CREATE POLICY video_progress_insert_tenant ON public.video_progress
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id IN (SELECT id FROM public.usuarios WHERE user_id = auth.uid())
    OR (public.is_admin() AND empresa_id = public.get_empresa_id())
    OR public.is_admin_master()
  );

CREATE POLICY video_progress_update_tenant ON public.video_progress
  FOR UPDATE TO authenticated
  USING (
    user_id IN (SELECT id FROM public.usuarios WHERE user_id = auth.uid())
    OR (public.is_admin() AND empresa_id = public.get_empresa_id())
    OR public.is_admin_master()
  );
