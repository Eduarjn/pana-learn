-- ============================================================
-- PanaLearn: Video Usage Tracking + Plan Limit Enforcement
-- Execute no Supabase SQL Editor
-- ============================================================

-- 1. video_usage_logs: um registro por segmento de sessão
CREATE TABLE IF NOT EXISTS public.video_usage_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  curso_id uuid REFERENCES public.cursos(id) ON DELETE SET NULL,
  watched_seconds integer NOT NULL DEFAULT 0,
  estimated_mb numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_video_usage_logs_empresa ON public.video_usage_logs(empresa_id, created_at);
CREATE INDEX IF NOT EXISTS idx_video_usage_logs_video ON public.video_usage_logs(video_id);
CREATE INDEX IF NOT EXISTS idx_video_usage_logs_empresa_time ON public.video_usage_logs(empresa_id, created_at DESC);

-- 2. usage_monthly_summary: rollup mensal por empresa
CREATE TABLE IF NOT EXISTS public.usage_monthly_summary (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  month date NOT NULL,
  total_mb_used numeric(12,2) NOT NULL DEFAULT 0,
  total_watch_seconds bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, month)
);
CREATE INDEX IF NOT EXISTS idx_usage_monthly_empresa ON public.usage_monthly_summary(empresa_id, month);

-- 3. RLS: video_usage_logs
ALTER TABLE public.video_usage_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users insert own logs" ON public.video_usage_logs;
CREATE POLICY "Users insert own logs" ON public.video_usage_logs
  FOR INSERT WITH CHECK (
    user_id = (SELECT id FROM public.usuarios WHERE user_id = auth.uid() LIMIT 1)
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Admins read empresa logs" ON public.video_usage_logs;
CREATE POLICY "Admins read empresa logs" ON public.video_usage_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE (u.user_id = auth.uid() OR u.id = auth.uid())
        AND u.empresa_id = video_usage_logs.empresa_id
    )
  );

-- 4. RLS: usage_monthly_summary
ALTER TABLE public.usage_monthly_summary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own empresa summary" ON public.usage_monthly_summary;
CREATE POLICY "Users read own empresa summary" ON public.usage_monthly_summary
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE (u.user_id = auth.uid() OR u.id = auth.uid())
        AND u.empresa_id = usage_monthly_summary.empresa_id
    )
  );

DROP POLICY IF EXISTS "Service upsert summary" ON public.usage_monthly_summary;
CREATE POLICY "Service upsert summary" ON public.usage_monthly_summary
  FOR ALL USING (true) WITH CHECK (true);

-- 5. Verificar resultado
SELECT 'video_usage_logs criada' as status WHERE EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_name = 'video_usage_logs'
)
UNION ALL
SELECT 'usage_monthly_summary criada' WHERE EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_name = 'usage_monthly_summary'
);
