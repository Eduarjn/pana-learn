-- ============================================================
-- CORREÇÃO DEFINITIVA: RLS da tabela VIDEOS
-- Execute este script INTEIRO no SQL Editor do Supabase
-- ============================================================

-- PASSO 1: Verificar estado atual
SELECT '=== PASSO 1: Políticas atuais na tabela videos ===' as info;
SELECT policyname, cmd, permissive, roles, qual
FROM pg_policies 
WHERE tablename = 'videos'
ORDER BY policyname;

-- PASSO 2: Verificar se RLS está habilitado
SELECT '=== PASSO 2: RLS status ===' as info;
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'videos';

-- PASSO 3: Verificar se existem vídeos no banco
SELECT '=== PASSO 3: Total de vídeos ===' as info;
SELECT count(*) as total_videos FROM public.videos;

-- PASSO 4: Listar vídeos com curso_id e categoria
SELECT '=== PASSO 4: Vídeos existentes ===' as info;
SELECT id, titulo, curso_id, categoria 
FROM public.videos 
ORDER BY data_criacao DESC 
LIMIT 20;

-- PASSO 5: REMOVER TODAS as políticas existentes na tabela videos
SELECT '=== PASSO 5: Removendo todas as políticas ===' as info;
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'videos' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.videos', pol.policyname);
        RAISE NOTICE 'Removida política: %', pol.policyname;
    END LOOP;
END;
$$;

-- PASSO 6: Garantir que RLS está habilitado
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- PASSO 7: Criar política PERMISSIVA para SELECT (todos os autenticados)
CREATE POLICY "videos_select_authenticated"
  ON public.videos
  FOR SELECT
  TO authenticated
  USING (true);

-- PASSO 8: Criar política para INSERT (apenas admins)
CREATE POLICY "videos_insert_admin"
  ON public.videos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios u 
      WHERE u.user_id = auth.uid() 
      AND u.tipo_usuario IN ('admin', 'admin_master')
    )
  );

-- PASSO 9: Criar política para UPDATE (apenas admins)
CREATE POLICY "videos_update_admin"
  ON public.videos
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u 
      WHERE u.user_id = auth.uid() 
      AND u.tipo_usuario IN ('admin', 'admin_master')
    )
  );

-- PASSO 10: Criar política para DELETE (apenas admins)
CREATE POLICY "videos_delete_admin"
  ON public.videos
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u 
      WHERE u.user_id = auth.uid() 
      AND u.tipo_usuario IN ('admin', 'admin_master')
    )
  );

-- PASSO 11: Verificar políticas após correção
SELECT '=== PASSO 11: Políticas APÓS correção ===' as info;
SELECT policyname, cmd, permissive, roles, qual
FROM pg_policies 
WHERE tablename = 'videos'
ORDER BY policyname;

-- PASSO 12: Também corrigir video_progress (alunos precisam ler/escrever)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'video_progress' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.video_progress', pol.policyname);
        RAISE NOTICE 'Removida política video_progress: %', pol.policyname;
    END LOOP;
END;
$$;

ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;

-- Todos podem ler seu próprio progresso
CREATE POLICY "video_progress_select_own"
  ON public.video_progress
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins podem ver tudo
CREATE POLICY "video_progress_select_admin"
  ON public.video_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u 
      WHERE u.user_id = auth.uid() 
      AND u.tipo_usuario IN ('admin', 'admin_master')
    )
  );

-- Todos podem inserir/atualizar seu próprio progresso
CREATE POLICY "video_progress_insert_own"
  ON public.video_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "video_progress_update_own"
  ON public.video_progress
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

SELECT '=== CONCLUÍDO! Políticas corrigidas com sucesso ===' as resultado;
