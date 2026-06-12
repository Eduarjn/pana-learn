-- ============================================================
-- onboarding_completed agora mora em empresas (fonte única de tenant).
-- A tabela organizations e a view current_tenant nunca existiram no
-- banco real — o código foi alinhado para usar apenas empresas.
-- (Já aplicada manualmente no Supabase em 2026-06-12.)
-- ============================================================

ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
