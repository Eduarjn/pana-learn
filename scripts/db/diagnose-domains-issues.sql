-- Script de diagnóstico para problemas com Domínios
-- Execute este arquivo no Supabase SQL Editor para identificar problemas

-- ========================================
-- 1. VERIFICAR ESTRUTURA DO BANCO
-- ========================================

-- Verificar se a tabela usuarios existe
SELECT 
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'usuarios') 
    THEN '✅ Tabela usuarios existe'
    ELSE '❌ Tabela usuarios NÃO existe'
  END as status_usuarios;

-- Verificar se a tabela domains existe
SELECT 
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'domains') 
    THEN '✅ Tabela domains existe'
    ELSE '❌ Tabela domains NÃO existe'
  END as status_domains;

-- ========================================
-- 2. VERIFICAR ENUM USER_TYPE
-- ========================================

-- Verificar valores do enum user_type
SELECT 
  enumlabel as tipo_usuario,
  CASE 
    WHEN enumlabel = 'admin_master' THEN '✅ admin_master disponível'
    ELSE 'Valor padrão'
  END as status
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_type')
ORDER BY enumsortorder;

-- ========================================
-- 3. VERIFICAR USUÁRIOS ADMIN_MASTER
-- ========================================

-- Verificar se existem usuários admin_master
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Existem ' || COUNT(*) || ' usuários admin_master'
    ELSE '❌ Nenhum usuário admin_master encontrado'
  END as status_admin_master
FROM usuarios 
WHERE tipo_usuario = 'admin_master';

-- Listar usuários admin_master
SELECT 
  id,
  email,
  nome,
  tipo_usuario,
  status,
  data_criacao
FROM usuarios 
WHERE tipo_usuario = 'admin_master';

-- ========================================
-- 4. VERIFICAR RLS E POLÍTICAS
-- ========================================

-- Verificar se RLS está ativo na tabela domains
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE tablename = 'domains' 
      AND rowsecurity = true
    ) THEN '✅ RLS ativo na tabela domains'
    ELSE '❌ RLS NÃO está ativo na tabela domains'
  END as status_rls;

-- Verificar políticas RLS existentes
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
WHERE tablename = 'domains';

-- ========================================
-- 5. VERIFICAR DADOS DE DOMÍNIOS
-- ========================================

-- Contar domínios existentes
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Existem ' || COUNT(*) || ' domínios'
    ELSE '❌ Nenhum domínio encontrado'
  END as status_domains_count
FROM domains;

-- Listar domínios existentes
SELECT 
  id,
  name,
  description,
  created_by,
  created_at
FROM domains 
ORDER BY created_at DESC;

-- ========================================
-- 6. VERIFICAR RELACIONAMENTOS
-- ========================================

-- Verificar se os domínios têm created_by válido
SELECT 
  d.name,
  d.created_by,
  CASE 
    WHEN u.id IS NOT NULL THEN '✅ Usuário válido: ' || u.nome
    ELSE '❌ Usuário não encontrado'
  END as status_usuario
FROM domains d
LEFT JOIN usuarios u ON d.created_by = u.id;

-- ========================================
-- 7. TESTAR PERMISSÕES
-- ========================================

-- Testar inserção (vai falhar se não for admin_master)
DO $$
BEGIN
  BEGIN
    INSERT INTO domains (name, description) VALUES ('test-domain.com', 'Teste de permissão');
    RAISE NOTICE '❌ ERRO: Inserção permitida sem ser admin_master';
  EXCEPTION 
    WHEN OTHERS THEN
      RAISE NOTICE '✅ CORRETO: Inserção bloqueada - %', SQLERRM;
  END;
END $$;

-- ========================================
-- 8. RECOMENDAÇÕES
-- ========================================

SELECT 
  CASE 
    WHEN NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'domains') 
    THEN '🔧 Execute o script setup-domains-complete.sql'
    WHEN NOT EXISTS (SELECT 1 FROM usuarios WHERE tipo_usuario = 'admin_master')
    THEN '🔧 Crie um usuário admin_master'
    WHEN NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'admin_master')
    THEN '🔧 Adicione admin_master ao enum user_type'
    ELSE '✅ Configuração parece estar correta'
  END as recomendacao; 
