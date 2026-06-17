-- Remove quiz órfão (empresa_id null) que vazava entre tenants — resquício do
-- curso "ts" já excluído — e remove a policy de SELECT redundante com
-- "empresa_id IS NULL" em quizzes (a policy limpa isolada por empresa permanece).

DELETE FROM public.progresso_quiz     WHERE quiz_id = '79abc65f-1030-4bac-95c5-a37ab23f441e';
DELETE FROM public.quiz_perguntas     WHERE quiz_id = '79abc65f-1030-4bac-95c5-a37ab23f441e';
DELETE FROM public.curso_quiz_mapping WHERE quiz_id = '79abc65f-1030-4bac-95c5-a37ab23f441e';
DELETE FROM public.quizzes            WHERE id = '79abc65f-1030-4bac-95c5-a37ab23f441e';

DROP POLICY IF EXISTS "quizzes_select_by_empresa" ON public.quizzes;
