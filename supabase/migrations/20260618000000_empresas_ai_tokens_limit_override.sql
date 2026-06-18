-- Override de limite mensal de tokens de IA por empresa.
-- NULL => usa o limite padrão do plano (PLAN_TOKEN_LIMITS no endpoint ai-support).
ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS ai_tokens_limit_override bigint
  CHECK (ai_tokens_limit_override IS NULL OR ai_tokens_limit_override >= 0);
