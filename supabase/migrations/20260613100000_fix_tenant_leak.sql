-- =============================================================================
-- FIX: vazamento de dados entre tenants
--
-- Postgres combina policies SELECT com OR. Policies permissivas existentes:
--   - quizzes: USING (ativo = TRUE)          → vê quizzes de qualquer tenant
--   - quiz_perguntas: via subselect em quizzes ativos
--   - usuarios: USING (true)                  → vê usuários de qualquer tenant
--   - empresas: USING (true)                  → vê empresas de qualquer tenant
--
-- Drop policies permissivas e substitui por filtro empresa_id = get_empresa_id().
-- Mantém caminho de onboarding (INSERT empresa + perfil próprio).
-- =============================================================================

-- ── QUIZZES ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Todos podem ver quizzes ativos" ON public.quizzes;
DROP POLICY IF EXISTS "Admins podem gerenciar quizzes" ON public.quizzes;
-- as policies "quizzes: usuário lê/admin insere/..." da migration de 2026-06-10
-- já estão corretas (filtram por get_empresa_id), nada a fazer nelas.

-- ── QUIZ_PERGUNTAS (tabela legada, se ainda existir) ────────────────────────
DROP POLICY IF EXISTS "Todos podem ver perguntas de quizzes ativos" ON public.quiz_perguntas;
DROP POLICY IF EXISTS "Admins podem gerenciar perguntas" ON public.quiz_perguntas;

-- ── USUARIOS ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "usuarios_select" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_update" ON public.usuarios;
-- usuarios_insert mantido: handle_new_user trigger e StepConta precisam inserir
-- antes de a empresa_id estar associada.

CREATE POLICY "usuarios_select_tenant"
  ON public.usuarios FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()                                         -- próprio perfil sempre
    OR empresa_id = public.get_empresa_id()                      -- ou mesma empresa
    OR public.is_admin_master()                                   -- admin_master vê tudo
  );

CREATE POLICY "usuarios_update_tenant"
  ON public.usuarios FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR (public.is_admin() AND empresa_id = public.get_empresa_id())
    OR public.is_admin_master()
  )
  WITH CHECK (
    user_id = auth.uid()
    OR (public.is_admin() AND empresa_id = public.get_empresa_id())
    OR public.is_admin_master()
  );

-- ── EMPRESAS ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can view empresas" ON public.empresas;
DROP POLICY IF EXISTS "Authenticated users can update empresas" ON public.empresas;
-- Authenticated users can create empresas (INSERT) mantido p/ onboarding.

CREATE POLICY "empresas_select_tenant"
  ON public.empresas FOR SELECT
  TO authenticated
  USING (
    id = public.get_empresa_id()
    OR public.is_admin_master()
  );

CREATE POLICY "empresas_update_tenant"
  ON public.empresas FOR UPDATE
  TO authenticated
  USING (
    (public.is_admin() AND id = public.get_empresa_id())
    OR public.is_admin_master()
  )
  WITH CHECK (
    (public.is_admin() AND id = public.get_empresa_id())
    OR public.is_admin_master()
  );
