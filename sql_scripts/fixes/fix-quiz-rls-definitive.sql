-- ============================================================
-- CORREÇÃO DEFINITIVA: RLS do Sistema de Quizzes e Certificados
-- Execute este script INTEIRO no SQL Editor do Supabase
-- ============================================================

-- ========================================
-- 1. LIMPAR POLÍTICAS ANTIGAS (COM ERROS)
-- ========================================
DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Limpar políticas de progresso_quiz
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'progresso_quiz' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.progresso_quiz', pol.policyname);
    END LOOP;
    
    -- Limpar políticas de certificados
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'certificados' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.certificados', pol.policyname);
    END LOOP;

    -- Limpar políticas de quizzes e quiz_perguntas
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'quizzes' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.quizzes', pol.policyname);
    END LOOP;

    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'quiz_perguntas' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.quiz_perguntas', pol.policyname);
    END LOOP;
END;
$$;

-- Garantir que RLS está habilitado
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_perguntas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progresso_quiz ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificados ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 2. POLÍTICAS PARA QUIZZES E PERGUNTAS
-- ========================================

-- Todos os usuários autenticados podem ver os quizzes e perguntas (se estiverem ativos ou não, a lógica de bloqueio de inativos fica no front, ou permitimos admins ver inativos)
CREATE POLICY "Todos podem ler quizzes"
  ON public.quizzes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Todos podem ler perguntas"
  ON public.quiz_perguntas FOR SELECT TO authenticated USING (true);

-- Apenas admins podem gerenciar quizzes
CREATE POLICY "Admins gerenciam quizzes"
  ON public.quizzes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.usuarios WHERE user_id = auth.uid() AND tipo_usuario IN ('admin', 'admin_master')));

CREATE POLICY "Admins gerenciam perguntas"
  ON public.quiz_perguntas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.usuarios WHERE user_id = auth.uid() AND tipo_usuario IN ('admin', 'admin_master')));

-- ========================================
-- 3. POLÍTICAS PARA PROGRESSO DO QUIZ
-- O erro anterior era comparar usuario_id (uuid da tabela usuarios) com auth.uid().
-- A forma correta é fazer um JOIN com a tabela usuarios.
-- ========================================

-- O aluno pode ver e inserir o seu próprio progresso
CREATE POLICY "Aluno gerencia proprio progresso quiz SELECT"
  ON public.progresso_quiz FOR SELECT TO authenticated
  USING (
    usuario_id IN (SELECT id FROM public.usuarios WHERE user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.usuarios WHERE user_id = auth.uid() AND tipo_usuario IN ('admin', 'admin_master'))
  );

CREATE POLICY "Aluno gerencia proprio progresso quiz INSERT"
  ON public.progresso_quiz FOR INSERT TO authenticated
  WITH CHECK (
    usuario_id IN (SELECT id FROM public.usuarios WHERE user_id = auth.uid())
  );

CREATE POLICY "Aluno gerencia proprio progresso quiz UPDATE"
  ON public.progresso_quiz FOR UPDATE TO authenticated
  USING (
    usuario_id IN (SELECT id FROM public.usuarios WHERE user_id = auth.uid())
  );

-- ========================================
-- 4. POLÍTICAS PARA CERTIFICADOS
-- ========================================

-- O aluno pode ver e criar seus próprios certificados
CREATE POLICY "Aluno gerencia proprio certificado SELECT"
  ON public.certificados FOR SELECT TO authenticated
  USING (
    usuario_id IN (SELECT id FROM public.usuarios WHERE user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.usuarios WHERE user_id = auth.uid() AND tipo_usuario IN ('admin', 'admin_master'))
  );

CREATE POLICY "Aluno gerencia proprio certificado INSERT"
  ON public.certificados FOR INSERT TO authenticated
  WITH CHECK (
    usuario_id IN (SELECT id FROM public.usuarios WHERE user_id = auth.uid())
  );

CREATE POLICY "Aluno gerencia proprio certificado UPDATE"
  ON public.certificados FOR UPDATE TO authenticated
  USING (
    usuario_id IN (SELECT id FROM public.usuarios WHERE user_id = auth.uid())
  );

SELECT 'Políticas RLS de Quizzes e Certificados corrigidas com sucesso!' as resultado;
