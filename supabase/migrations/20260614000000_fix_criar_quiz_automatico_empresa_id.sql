-- =============================================================================
-- Fix: trigger criar_quiz_automatico propaga empresa_id para evitar RLS error
--
-- O trigger inseria em quizzes e curso_quiz_mapping sem empresa_id, fazendo
-- RLS bloquear admins (não admin_master) ao criar curso:
--   "new row violates row-level security policy for table curso_quiz_mapping"
--
-- Aplicada via MCP em 2026-06-14 no projeto oqoxhavdhrgdjvxvajze.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.criar_quiz_automatico()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    novo_quiz_id uuid;
BEGIN
    INSERT INTO public.quizzes (
        titulo, descricao, categoria, nota_minima, ativo, empresa_id
    )
    VALUES (
        'Quiz de Conclusão - ' || NEW.nome,
        'Quiz final gerado automaticamente para o curso ' || NEW.nome,
        NEW.id::text,
        70,
        true,
        NEW.empresa_id
    )
    RETURNING id INTO novo_quiz_id;

    INSERT INTO public.curso_quiz_mapping (curso_id, quiz_id, empresa_id)
    VALUES (NEW.id, novo_quiz_id, NEW.empresa_id);

    RETURN NEW;
END;
$function$;
