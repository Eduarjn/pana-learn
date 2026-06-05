-- ============================================================
-- ISOLAMENTO MULTI-TENANT — Pana-Learn
-- Execute no SQL Editor do Supabase (PASSO A PASSO)
-- ============================================================
-- IMPORTANTE: Execute CADA seção separadamente e verifique o resultado.
-- Se alguma seção der erro, NÃO continue — me envie o erro.
-- ============================================================


-- ============================================================
-- SEÇÃO 1: DIAGNÓSTICO (execute primeiro, só para ver o estado atual)
-- ============================================================

-- 1a. Verificar se quizzes já tem empresa_id
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'quizzes' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 1b. Verificar se videos já tem empresa_id
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'videos' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 1c. Listar todas as políticas atuais das tabelas críticas
SELECT tablename, policyname, cmd, permissive, roles, qual
FROM pg_policies 
WHERE tablename IN ('quizzes', 'quiz_perguntas', 'progresso_quiz', 'certificados', 'cursos', 'videos', 'categorias', 'usuarios')
ORDER BY tablename, policyname;


-- ============================================================
-- SEÇÃO 2: ADICIONAR empresa_id NAS TABELAS QUE FALTAM
-- (Execute após verificar a Seção 1)
-- ============================================================

-- 2a. Adicionar empresa_id na tabela quizzes
ALTER TABLE public.quizzes 
  ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);

-- 2b. Adicionar empresa_id na tabela videos
ALTER TABLE public.videos 
  ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);

-- 2c. Criar índices para performance de filtro por empresa
CREATE INDEX IF NOT EXISTS idx_quizzes_empresa_id ON public.quizzes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_videos_empresa_id ON public.videos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cursos_empresa_id ON public.cursos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_certificados_empresa_id ON public.certificados(empresa_id);
CREATE INDEX IF NOT EXISTS idx_categorias_empresa_id ON public.categorias(empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa_id ON public.usuarios(empresa_id);

SELECT 'SEÇÃO 2 CONCLUÍDA — Colunas e índices criados com sucesso' as resultado;


-- ============================================================
-- SEÇÃO 3: POPULAR empresa_id NOS REGISTROS EXISTENTES
-- (Importantíssimo: preenche os dados existentes que estão NULL)
-- ============================================================

-- 3a. Popular quizzes: usa a empresa_id do curso vinculado via curso_quiz_mapping
UPDATE public.quizzes q
SET empresa_id = c.empresa_id
FROM public.curso_quiz_mapping m
JOIN public.cursos c ON c.id = m.curso_id
WHERE q.id = m.quiz_id 
  AND q.empresa_id IS NULL
  AND c.empresa_id IS NOT NULL;

-- 3b. Popular videos: usa a empresa_id do curso vinculado
UPDATE public.videos v
SET empresa_id = c.empresa_id
FROM public.cursos c
WHERE v.curso_id = c.id
  AND v.empresa_id IS NULL
  AND c.empresa_id IS NOT NULL;

-- 3c. Verificar resultados
SELECT 'quizzes' as tabela, 
       count(*) as total, 
       count(empresa_id) as com_empresa, 
       count(*) - count(empresa_id) as sem_empresa
FROM public.quizzes
UNION ALL
SELECT 'videos', count(*), count(empresa_id), count(*) - count(empresa_id)
FROM public.videos
UNION ALL
SELECT 'cursos', count(*), count(empresa_id), count(*) - count(empresa_id)
FROM public.cursos
UNION ALL
SELECT 'certificados', count(*), count(empresa_id), count(*) - count(empresa_id)
FROM public.certificados
UNION ALL
SELECT 'categorias', count(*), count(empresa_id), count(*) - count(empresa_id)
FROM public.categorias
UNION ALL
SELECT 'usuarios', count(*), count(empresa_id), count(*) - count(empresa_id)
FROM public.usuarios;


-- ============================================================
-- SEÇÃO 4: CORRIGIR POLÍTICAS RLS — QUIZZES
-- ============================================================

-- 4a. Remover políticas antigas de quizzes
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'quizzes' AND schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.quizzes', pol.policyname);
  END LOOP;
END;
$$;

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado pode LER quizzes da sua empresa (ou quizzes sem empresa para retrocompatibilidade)
CREATE POLICY "quizzes_select_by_empresa"
  ON public.quizzes FOR SELECT TO authenticated
  USING (
    empresa_id IS NULL
    OR empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.usuarios WHERE user_id = auth.uid() AND tipo_usuario = 'admin_master')
  );

-- Apenas admin/admin_master podem INSERT
CREATE POLICY "quizzes_insert_admin"
  ON public.quizzes FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.usuarios WHERE user_id = auth.uid() AND tipo_usuario IN ('admin', 'admin_master'))
  );

-- Apenas admin/admin_master podem UPDATE
CREATE POLICY "quizzes_update_admin"
  ON public.quizzes FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE user_id = auth.uid() AND tipo_usuario IN ('admin', 'admin_master'))
  );

-- Apenas admin/admin_master podem DELETE
CREATE POLICY "quizzes_delete_admin"
  ON public.quizzes FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE user_id = auth.uid() AND tipo_usuario IN ('admin', 'admin_master'))
  );

SELECT 'SEÇÃO 4 CONCLUÍDA — Políticas de quizzes criadas' as resultado;


-- ============================================================
-- SEÇÃO 5: CORRIGIR POLÍTICAS RLS — QUIZ_PERGUNTAS
-- ============================================================

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'quiz_perguntas' AND schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.quiz_perguntas', pol.policyname);
  END LOOP;
END;
$$;

ALTER TABLE public.quiz_perguntas ENABLE ROW LEVEL SECURITY;

-- Perguntas visíveis se o quiz for visível (mesma lógica de empresa)
CREATE POLICY "quiz_perguntas_select"
  ON public.quiz_perguntas FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_perguntas.quiz_id
      AND (
        q.empresa_id IS NULL
        OR q.empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.usuarios WHERE user_id = auth.uid() AND tipo_usuario = 'admin_master')
      )
    )
  );

CREATE POLICY "quiz_perguntas_admin"
  ON public.quiz_perguntas FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE user_id = auth.uid() AND tipo_usuario IN ('admin', 'admin_master'))
  );

SELECT 'SEÇÃO 5 CONCLUÍDA — Políticas de quiz_perguntas criadas' as resultado;


-- ============================================================
-- SEÇÃO 6: CORRIGIR POLÍTICAS RLS — PROGRESSO_QUIZ
-- ============================================================

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'progresso_quiz' AND schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.progresso_quiz', pol.policyname);
  END LOOP;
END;
$$;

ALTER TABLE public.progresso_quiz ENABLE ROW LEVEL SECURITY;

-- Usuário vê e gerencia seu próprio progresso
CREATE POLICY "progresso_quiz_select_own"
  ON public.progresso_quiz FOR SELECT TO authenticated
  USING (
    usuario_id IN (SELECT id FROM public.usuarios WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.usuarios WHERE user_id = auth.uid() AND tipo_usuario IN ('admin', 'admin_master'))
  );

CREATE POLICY "progresso_quiz_insert_own"
  ON public.progresso_quiz FOR INSERT TO authenticated
  WITH CHECK (
    usuario_id IN (SELECT id FROM public.usuarios WHERE user_id = auth.uid())
  );

CREATE POLICY "progresso_quiz_update_own"
  ON public.progresso_quiz FOR UPDATE TO authenticated
  USING (
    usuario_id IN (SELECT id FROM public.usuarios WHERE user_id = auth.uid())
  );

SELECT 'SEÇÃO 6 CONCLUÍDA — Políticas de progresso_quiz criadas' as resultado;


-- ============================================================
-- SEÇÃO 7: CORRIGIR POLÍTICAS RLS — CERTIFICADOS
-- ============================================================

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'certificados' AND schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.certificados', pol.policyname);
  END LOOP;
END;
$$;

ALTER TABLE public.certificados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "certificados_select"
  ON public.certificados FOR SELECT TO authenticated
  USING (
    usuario_id IN (SELECT id FROM public.usuarios WHERE user_id = auth.uid())
    OR empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE user_id = auth.uid() AND tipo_usuario = 'admin')
    OR EXISTS (SELECT 1 FROM public.usuarios WHERE user_id = auth.uid() AND tipo_usuario = 'admin_master')
  );

CREATE POLICY "certificados_insert"
  ON public.certificados FOR INSERT TO authenticated
  WITH CHECK (
    usuario_id IN (SELECT id FROM public.usuarios WHERE user_id = auth.uid())
  );

CREATE POLICY "certificados_update"
  ON public.certificados FOR UPDATE TO authenticated
  USING (
    usuario_id IN (SELECT id FROM public.usuarios WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.usuarios WHERE user_id = auth.uid() AND tipo_usuario IN ('admin', 'admin_master'))
  );

SELECT 'SEÇÃO 7 CONCLUÍDA — Políticas de certificados criadas' as resultado;


-- ============================================================
-- SEÇÃO 8: CORRIGIR POLÍTICAS RLS — CURSOS
-- ============================================================

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'cursos' AND schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.cursos', pol.policyname);
  END LOOP;
END;
$$;

ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cursos_select_by_empresa"
  ON public.cursos FOR SELECT TO authenticated
  USING (
    empresa_id IS NULL
    OR empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.usuarios WHERE user_id = auth.uid() AND tipo_usuario = 'admin_master')
  );

CREATE POLICY "cursos_insert_admin"
  ON public.cursos FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.usuarios WHERE user_id = auth.uid() AND tipo_usuario IN ('admin', 'admin_master'))
  );

CREATE POLICY "cursos_update_admin"
  ON public.cursos FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE user_id = auth.uid() AND tipo_usuario IN ('admin', 'admin_master'))
  );

CREATE POLICY "cursos_delete_admin"
  ON public.cursos FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE user_id = auth.uid() AND tipo_usuario IN ('admin', 'admin_master'))
  );

SELECT 'SEÇÃO 8 CONCLUÍDA — Políticas de cursos criadas' as resultado;


-- ============================================================
-- SEÇÃO 9: CORRIGIR POLÍTICAS RLS — VIDEOS
-- ============================================================

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'videos' AND schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.videos', pol.policyname);
  END LOOP;
END;
$$;

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "videos_select_by_empresa"
  ON public.videos FOR SELECT TO authenticated
  USING (
    empresa_id IS NULL
    OR empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.usuarios WHERE user_id = auth.uid() AND tipo_usuario = 'admin_master')
  );

CREATE POLICY "videos_insert_admin"
  ON public.videos FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.usuarios WHERE user_id = auth.uid() AND tipo_usuario IN ('admin', 'admin_master'))
  );

CREATE POLICY "videos_update_admin"
  ON public.videos FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE user_id = auth.uid() AND tipo_usuario IN ('admin', 'admin_master'))
  );

CREATE POLICY "videos_delete_admin"
  ON public.videos FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE user_id = auth.uid() AND tipo_usuario IN ('admin', 'admin_master'))
  );

SELECT 'SEÇÃO 9 CONCLUÍDA — Políticas de videos criadas' as resultado;


-- ============================================================
-- SEÇÃO 10: CORRIGIR POLÍTICAS RLS — CATEGORIAS
-- ============================================================

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'categorias' AND schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.categorias', pol.policyname);
  END LOOP;
END;
$$;

ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categorias_select_by_empresa"
  ON public.categorias FOR SELECT TO authenticated
  USING (
    empresa_id IS NULL
    OR empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.usuarios WHERE user_id = auth.uid() AND tipo_usuario = 'admin_master')
  );

CREATE POLICY "categorias_admin"
  ON public.categorias FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE user_id = auth.uid() AND tipo_usuario IN ('admin', 'admin_master'))
  );

SELECT 'SEÇÃO 10 CONCLUÍDA — Políticas de categorias criadas' as resultado;


-- ============================================================
-- SEÇÃO 11: CORRIGIR POLÍTICAS RLS — VIDEO_PROGRESS
-- ============================================================

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'video_progress' AND schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.video_progress', pol.policyname);
  END LOOP;
END;
$$;

ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;

-- Nota: video_progress usa user_id (auth.uid()) diretamente, NÃO usuario_id da tabela usuarios
CREATE POLICY "video_progress_select"
  ON public.video_progress FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.usuarios WHERE user_id = auth.uid() AND tipo_usuario IN ('admin', 'admin_master'))
  );

CREATE POLICY "video_progress_insert"
  ON public.video_progress FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "video_progress_update"
  ON public.video_progress FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

SELECT 'SEÇÃO 11 CONCLUÍDA — Políticas de video_progress criadas' as resultado;


-- ============================================================
-- SEÇÃO 12: VERIFICAÇÃO FINAL
-- ============================================================

SELECT '=== VERIFICAÇÃO FINAL ===' as info;

SELECT tablename, count(*) as total_policies
FROM pg_policies 
WHERE tablename IN ('quizzes', 'quiz_perguntas', 'progresso_quiz', 'certificados', 'cursos', 'videos', 'categorias', 'video_progress')
  AND schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

SELECT '✅ ISOLAMENTO MULTI-TENANT CONCLUÍDO COM SUCESSO!' as resultado;
