-- Tabelas do assistente de suporte IA (Fase A).
-- Escrita só via service role (endpoint /api/ai-support); leitura via RLS.

-- Histórico de chat da IA (por usuário).
CREATE TABLE IF NOT EXISTS public.ai_chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,                          -- usuarios.id
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  sender text NOT NULL CHECK (sender IN ('user','ai','system')),
  content text NOT NULL,
  tokens_used integer NOT NULL DEFAULT 0,
  course_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_user ON public.ai_chat_history(user_id, created_at);
ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_chat_select_own" ON public.ai_chat_history
  FOR SELECT TO authenticated
  USING (user_id IN (SELECT id FROM public.usuarios WHERE user_id = auth.uid()) OR public.is_admin_master());

-- Orçamento mensal de tokens da IA, por empresa (atrelado ao plano).
CREATE TABLE IF NOT EXISTS public.ai_token_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  period_month text NOT NULL,                     -- 'YYYY-MM'
  tokens_used bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, period_month)
);
ALTER TABLE public.ai_token_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_token_usage_select_tenant" ON public.ai_token_usage
  FOR SELECT TO authenticated
  USING (empresa_id = public.get_empresa_id() OR public.is_admin_master());
