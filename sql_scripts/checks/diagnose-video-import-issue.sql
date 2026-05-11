-- Script para diagnosticar problemas de importação de vídeos
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se o curso "OMNICHANNEL para Empresas" existe
SELECT 
  id,
  nome,
  categoria,
  status,
  data_criacao
FROM cursos 
WHERE nome LIKE '%OMNICHANNEL%' OR nome LIKE '%Omnichannel%';

-- 2. Verificar todos os cursos disponíveis
SELECT 
  id,
  nome,
  categoria,
  status
FROM cursos 
ORDER BY nome;

-- 3. Verificar vídeos importados e seus cursos associados
SELECT 
  v.id as video_id,
  v.titulo as video_titulo,
  v.curso_id,
  v.categoria as video_categoria,
  c.nome as curso_nome,
  c.categoria as curso_categoria,
  v.data_criacao as video_data_criacao
FROM videos v
LEFT JOIN cursos c ON v.curso_id = c.id
ORDER BY v.data_criacao DESC;

-- 4. Verificar vídeos sem curso associado
SELECT 
  id,
  titulo,
  curso_id,
  categoria,
  data_criacao
FROM videos 
WHERE curso_id IS NULL;

-- 5. Verificar vídeos com curso_id mas sem curso correspondente
SELECT 
  v.id,
  v.titulo,
  v.curso_id,
  v.categoria
FROM videos v
LEFT JOIN cursos c ON v.curso_id = c.id
WHERE v.curso_id IS NOT NULL AND c.id IS NULL;

-- 6. Verificar estrutura da tabela videos
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'videos'
ORDER BY ordinal_position;

-- 7. Verificar políticas RLS da tabela videos
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'videos';

-- 8. Testar inserção de vídeo de teste para o curso OMNICHANNEL
-- Primeiro, pegar o ID do curso
WITH curso_omnichannel AS (
  SELECT id FROM cursos WHERE nome = 'OMNICHANNEL para Empresas' LIMIT 1
)
INSERT INTO videos (
  titulo,
  descricao,
  duracao,
  url_video,
  categoria,
  curso_id,
  source
)
SELECT 
  'Vídeo de Teste OMNICHANNEL',
  'Vídeo de teste para verificar importação',
  10,
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'Omnichannel',
  c.id,
  'youtube'
FROM curso_omnichannel c
WHERE c.id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 9. Verificar se o vídeo foi inserido
SELECT 
  v.id,
  v.titulo,
  v.curso_id,
  c.nome as curso_nome,
  v.data_criacao
FROM videos v
LEFT JOIN cursos c ON v.curso_id = c.id
WHERE v.titulo = 'Vídeo de Teste OMNICHANNEL';

-- 10. Verificar vídeos do curso OMNICHANNEL
SELECT 
  v.id,
  v.titulo,
  v.duracao,
  v.categoria,
  v.data_criacao,
  c.nome as curso_nome
FROM videos v
JOIN cursos c ON v.curso_id = c.id
WHERE c.nome = 'OMNICHANNEL para Empresas'
ORDER BY v.data_criacao DESC; 