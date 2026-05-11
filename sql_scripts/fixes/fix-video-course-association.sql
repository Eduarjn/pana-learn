-- Script para corrigir a associação de vídeos aos cursos
-- Execute este script no Supabase SQL Editor

-- 1. Adicionar colunas necessárias na tabela videos
ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS curso_id UUID REFERENCES public.cursos(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS modulo_id UUID REFERENCES public.modulos(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS categoria VARCHAR(100),
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'upload',
ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_videos_curso_id ON public.videos(curso_id);
CREATE INDEX IF NOT EXISTS idx_videos_modulo_id ON public.videos(modulo_id);
CREATE INDEX IF NOT EXISTS idx_videos_categoria ON public.videos(categoria);

-- 3. Verificar se as colunas foram adicionadas
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'videos' 
  AND column_name IN ('curso_id', 'modulo_id', 'categoria', 'source', 'storage_path')
ORDER BY column_name;

-- 4. Atualizar vídeos existentes com categoria baseada no curso (se aplicável)
-- Primeiro, vamos verificar quais vídeos existem
SELECT 
  id,
  titulo,
  curso_id,
  categoria,
  data_criacao
FROM videos 
ORDER BY data_criacao DESC;

-- 5. Testar inserção de vídeo para o curso OMNICHANNEL
-- Primeiro, verificar se o curso existe
SELECT 
  id,
  nome,
  categoria,
  status
FROM cursos 
WHERE nome LIKE '%OMNICHANNEL%' OR nome LIKE '%Omnichannel%';

-- 6. Inserir vídeo de teste para OMNICHANNEL para Empresas
WITH curso_omnichannel AS (
  SELECT id, categoria FROM cursos WHERE nome = 'OMNICHANNEL para Empresas' LIMIT 1
)
INSERT INTO videos (
  titulo,
  descricao,
  duracao,
  url_video,
  categoria,
  curso_id,
  source,
  storage_path
)
SELECT 
  'Introdução ao Omnichannel',
  'Vídeo introdutório sobre soluções omnichannel para empresas',
  15,
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  c.categoria,
  c.id,
  'youtube',
  'youtube/teste_omnichannel_intro'
FROM curso_omnichannel c
WHERE c.id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 7. Verificar se o vídeo foi inserido corretamente
SELECT 
  v.id,
  v.titulo,
  v.curso_id,
  v.categoria,
  c.nome as curso_nome,
  v.data_criacao
FROM videos v
LEFT JOIN cursos c ON v.curso_id = c.id
WHERE v.titulo = 'Introdução ao Omnichannel';

-- 8. Verificar todos os vídeos com seus cursos associados
SELECT 
  v.id,
  v.titulo,
  v.duracao,
  v.categoria,
  v.curso_id,
  c.nome as curso_nome,
  v.data_criacao
FROM videos v
LEFT JOIN cursos c ON v.curso_id = c.id
ORDER BY v.data_criacao DESC;

-- 9. Verificar políticas RLS da tabela videos
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'videos';

-- 10. Garantir que as políticas RLS permitam acesso aos vídeos
-- Política para permitir que todos vejam vídeos
DROP POLICY IF EXISTS "Todos podem ver videos" ON public.videos;
CREATE POLICY "Todos podem ver videos" 
  ON public.videos 
  FOR SELECT 
  USING (true);

-- Política para permitir que admins insiram vídeos
DROP POLICY IF EXISTS "Admins podem inserir videos" ON public.videos;
CREATE POLICY "Admins podem inserir videos" 
  ON public.videos 
  FOR INSERT 
  WITH CHECK (true);

-- Política para permitir que admins atualizem vídeos
DROP POLICY IF EXISTS "Admins podem atualizar videos" ON public.videos;
CREATE POLICY "Admins podem atualizar videos" 
  ON public.videos 
  FOR UPDATE 
  USING (true);

-- Política para permitir que admins deletem vídeos
DROP POLICY IF EXISTS "Admins podem deletar videos" ON public.videos;
CREATE POLICY "Admins podem deletar videos" 
  ON public.videos 
  FOR DELETE 
  USING (true); 