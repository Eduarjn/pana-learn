-- =============================================================================
-- Fix tenant leak nas tabelas restantes (video_progress, progresso_quiz,
-- certificados). Policies antigas davam acesso cross-tenant para admins.
--
-- Aplicada via MCP em 2026-06-13 no projeto oqoxhavdhrgdjvxvajze.
-- =============================================================================

-- video_progress
DROP POLICY IF EXISTS "video_progress_select" ON public.video_progress;
DROP POLICY IF EXISTS "video_progress_update" ON public.video_progress;
DROP POLICY IF EXISTS "video_progress_insert" ON public.video_progress;

CREATE POLICY "video_progress_select_tenant"
  ON public.video_progress FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (is_admin() AND empresa_id = get_empresa_id())
    OR is_admin_master()
  );

CREATE POLICY "video_progress_insert_tenant"
  ON public.video_progress FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR (is_admin() AND empresa_id = get_empresa_id())
    OR is_admin_master()
  );

CREATE POLICY "video_progress_update_tenant"
  ON public.video_progress FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR (is_admin() AND empresa_id = get_empresa_id())
    OR is_admin_master()
  );

-- progresso_quiz
DROP POLICY IF EXISTS "progresso_quiz_select_own" ON public.progresso_quiz;
DROP POLICY IF EXISTS "progresso_quiz_update_own" ON public.progresso_quiz;
DROP POLICY IF EXISTS "progresso_quiz_insert_own" ON public.progresso_quiz;

CREATE POLICY "progresso_quiz_select_tenant"
  ON public.progresso_quiz FOR SELECT TO authenticated
  USING (
    usuario_id IN (SELECT id FROM public.usuarios WHERE user_id = auth.uid())
    OR (is_admin() AND empresa_id = get_empresa_id())
    OR is_admin_master()
  );

CREATE POLICY "progresso_quiz_insert_tenant"
  ON public.progresso_quiz FOR INSERT TO authenticated
  WITH CHECK (
    usuario_id IN (SELECT id FROM public.usuarios WHERE user_id = auth.uid())
    OR (is_admin() AND empresa_id = get_empresa_id())
    OR is_admin_master()
  );

CREATE POLICY "progresso_quiz_update_tenant"
  ON public.progresso_quiz FOR UPDATE TO authenticated
  USING (
    usuario_id IN (SELECT id FROM public.usuarios WHERE user_id = auth.uid())
    OR (is_admin() AND empresa_id = get_empresa_id())
    OR is_admin_master()
  );

-- certificados
DROP POLICY IF EXISTS "certificados_select" ON public.certificados;
DROP POLICY IF EXISTS "certificados_update" ON public.certificados;
DROP POLICY IF EXISTS "certificados_insert" ON public.certificados;
DROP POLICY IF EXISTS "certificados: admin vê da empresa" ON public.certificados;
DROP POLICY IF EXISTS "certificados: usuário vê próprio" ON public.certificados;
DROP POLICY IF EXISTS "certificados: sistema insere" ON public.certificados;

CREATE POLICY "certificados_select_tenant"
  ON public.certificados FOR SELECT TO authenticated
  USING (
    usuario_id IN (SELECT id FROM public.usuarios WHERE user_id = auth.uid())
    OR (is_admin() AND empresa_id = get_empresa_id())
    OR is_admin_master()
  );

CREATE POLICY "certificados_insert_tenant"
  ON public.certificados FOR INSERT TO authenticated
  WITH CHECK (
    usuario_id IN (SELECT id FROM public.usuarios WHERE user_id = auth.uid())
    OR (is_admin() AND empresa_id = get_empresa_id())
    OR is_admin_master()
  );

CREATE POLICY "certificados_update_tenant"
  ON public.certificados FOR UPDATE TO authenticated
  USING (
    (is_admin() AND empresa_id = get_empresa_id())
    OR is_admin_master()
  );
