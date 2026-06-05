-- ============================================================
-- Migration: RLS multi-tenant policies
-- Tabelas cobertas: usuarios, cursos, modulos, videos,
--                   categorias, progresso_usuario, certificados
--
-- Modelo de isolamento:
--   - Usuários veem apenas registros da sua empresa
--   - Admins da empresa veem todos os registros da empresa
--   - admin_master vê tudo (bypass via role check)
--   - anon key não consegue ler dados sensíveis
--
-- NOTA: funções helper criadas em public (não auth) pois o
--       schema auth é restrito no Supabase managed.
-- ============================================================

-- ─── Helpers ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_empresa_id() RETURNS uuid
  LANGUAGE sql STABLE SECURITY DEFINER AS
$$
  SELECT empresa_id FROM public.usuarios
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER AS
$$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE user_id = auth.uid()
      AND tipo_usuario IN ('admin', 'admin_master')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_master() RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER AS
$$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE user_id = auth.uid()
      AND tipo_usuario = 'admin_master'
  );
$$;


-- ════════════════════════════════════════════════════════════
-- TABELA: usuarios
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios: lê próprio perfil"
  ON public.usuarios FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "usuarios: admin vê empresa"
  ON public.usuarios FOR SELECT
  USING (
    public.is_admin()
    AND (empresa_id = public.get_empresa_id() OR public.is_admin_master())
  );

CREATE POLICY "usuarios: atualiza próprio perfil"
  ON public.usuarios FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "usuarios: admin cria na empresa"
  ON public.usuarios FOR INSERT
  WITH CHECK (
    public.is_admin()
    AND (empresa_id = public.get_empresa_id() OR public.is_admin_master())
  );

CREATE POLICY "usuarios: admin exclui da empresa"
  ON public.usuarios FOR DELETE
  USING (
    public.is_admin()
    AND (empresa_id = public.get_empresa_id() OR public.is_admin_master())
  );


-- ════════════════════════════════════════════════════════════
-- TABELA: cursos
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cursos: usuário lê da empresa"
  ON public.cursos FOR SELECT
  USING (
    empresa_id = public.get_empresa_id()
    OR public.is_admin_master()
    OR empresa_id IS NULL
  );

CREATE POLICY "cursos: admin insere"
  ON public.cursos FOR INSERT
  WITH CHECK (public.is_admin() AND (empresa_id = public.get_empresa_id() OR public.is_admin_master()));

CREATE POLICY "cursos: admin atualiza"
  ON public.cursos FOR UPDATE
  USING (public.is_admin() AND (empresa_id = public.get_empresa_id() OR public.is_admin_master()));

CREATE POLICY "cursos: admin exclui"
  ON public.cursos FOR DELETE
  USING (public.is_admin() AND (empresa_id = public.get_empresa_id() OR public.is_admin_master()));


-- ════════════════════════════════════════════════════════════
-- TABELA: modulos
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.modulos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "modulos: usuário lê"
  ON public.modulos FOR SELECT
  USING (
    curso_id IN (
      SELECT id FROM public.cursos
      WHERE empresa_id = public.get_empresa_id()
        OR empresa_id IS NULL
        OR public.is_admin_master()
    )
  );

CREATE POLICY "modulos: admin gerencia"
  ON public.modulos FOR ALL
  USING (public.is_admin());


-- ════════════════════════════════════════════════════════════
-- TABELA: videos
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "videos: usuário lê da empresa"
  ON public.videos FOR SELECT
  USING (
    empresa_id = public.get_empresa_id()
    OR public.is_admin_master()
    OR empresa_id IS NULL
  );

CREATE POLICY "videos: admin gerencia"
  ON public.videos FOR ALL
  USING (
    public.is_admin()
    AND (empresa_id = public.get_empresa_id() OR public.is_admin_master())
  );


-- ════════════════════════════════════════════════════════════
-- TABELA: categorias
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categorias: leitura pública autenticada"
  ON public.categorias FOR SELECT
  USING (
    empresa_id IS NULL
    OR empresa_id = public.get_empresa_id()
    OR public.is_admin_master()
  );

CREATE POLICY "categorias: admin gerencia"
  ON public.categorias FOR ALL
  USING (public.is_admin());


-- ════════════════════════════════════════════════════════════
-- TABELA: progresso_usuario
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.progresso_usuario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "progresso: usuário lê o próprio"
  ON public.progresso_usuario FOR SELECT
  USING (
    usuario_id IN (
      SELECT id FROM public.usuarios WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "progresso: admin vê da empresa"
  ON public.progresso_usuario FOR SELECT
  USING (
    public.is_admin()
    AND usuario_id IN (
      SELECT id FROM public.usuarios
      WHERE empresa_id = public.get_empresa_id()
    )
  );

CREATE POLICY "progresso: usuário insere/atualiza próprio"
  ON public.progresso_usuario FOR INSERT
  WITH CHECK (
    usuario_id IN (
      SELECT id FROM public.usuarios WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "progresso: usuário atualiza próprio"
  ON public.progresso_usuario FOR UPDATE
  USING (
    usuario_id IN (
      SELECT id FROM public.usuarios WHERE user_id = auth.uid()
    )
  );


-- ════════════════════════════════════════════════════════════
-- TABELA: certificados
-- ════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "certificados: usuário vê próprio" ON public.certificados;
DROP POLICY IF EXISTS "certificados: admin vê empresa"  ON public.certificados;

CREATE POLICY "certificados: usuário vê próprio"
  ON public.certificados FOR SELECT
  USING (
    usuario_id IN (
      SELECT id FROM public.usuarios WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "certificados: admin vê da empresa"
  ON public.certificados FOR SELECT
  USING (
    public.is_admin()
    AND (empresa_id = public.get_empresa_id() OR public.is_admin_master())
  );

CREATE POLICY "certificados: sistema insere"
  ON public.certificados FOR INSERT
  WITH CHECK (public.is_admin());
