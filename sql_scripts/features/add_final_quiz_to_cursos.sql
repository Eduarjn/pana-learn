-- ============================================================
-- PanaLearn: Verificar estrutura do quiz final por curso
-- A tabela curso_quiz_mapping já existe no banco.
-- Execute este script APENAS para verificar e garantir RLS.
-- ============================================================

-- 1. Verificar tabelas existentes
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('cursos', 'quizzes', 'curso_quiz_mapping');

-- 2. Verificar mappings existentes
SELECT
  cqm.id,
  c.nome as curso_nome,
  q.titulo as quiz_titulo,
  cqm.data_criacao
FROM curso_quiz_mapping cqm
JOIN cursos c ON c.id = cqm.curso_id
JOIN quizzes q ON q.id = cqm.quiz_id
ORDER BY c.nome;

-- 3. (Opcional) Garantir que RLS permite admins gerenciar mapeamentos
-- Ative se ainda não estiver configurado:

ALTER TABLE public.curso_quiz_mapping ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Todos podem ver mapeamentos" ON public.curso_quiz_mapping;
CREATE POLICY "Todos podem ver mapeamentos" ON public.curso_quiz_mapping
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins podem gerenciar mapeamentos" ON public.curso_quiz_mapping;
CREATE POLICY "Admins podem gerenciar mapeamentos" ON public.curso_quiz_mapping
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.tipo_usuario IN ('admin', 'admin_master')
    )
  );
