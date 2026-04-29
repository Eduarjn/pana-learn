-- ============================================================
-- Execute este SQL no Supabase SQL Editor (app.supabase.com)
-- ============================================================

-- 1. Habilitar RLS (se não estiver habilitado)
ALTER TABLE public.branding_config ENABLE ROW LEVEL SECURITY;

-- 2. Remover policies antigas (ignora erro se não existirem)
DROP POLICY IF EXISTS "Permitir leitura do branding" ON public.branding_config;
DROP POLICY IF EXISTS "Permitir admin atualizar branding" ON public.branding_config;
DROP POLICY IF EXISTS "branding_select" ON public.branding_config;
DROP POLICY IF EXISTS "branding_insert" ON public.branding_config;
DROP POLICY IF EXISTS "branding_update" ON public.branding_config;
DROP POLICY IF EXISTS "branding_delete" ON public.branding_config;

-- 3. Criar policies permissivas para branding
-- Leitura: qualquer usuário autenticado pode ler
CREATE POLICY "branding_select" ON public.branding_config
  FOR SELECT TO authenticated USING (true);

-- Insert: qualquer usuário autenticado pode inserir (para primeiro setup)
CREATE POLICY "branding_insert" ON public.branding_config
  FOR INSERT TO authenticated WITH CHECK (true);

-- Update: qualquer usuário autenticado pode atualizar
CREATE POLICY "branding_update" ON public.branding_config
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Delete: qualquer usuário autenticado pode deletar
CREATE POLICY "branding_delete" ON public.branding_config
  FOR DELETE TO authenticated USING (true);

-- 4. Atualizar defaults da tabela para PANALEARN
ALTER TABLE public.branding_config
  ALTER COLUMN logo_url SET DEFAULT '/panalearn-logo.png',
  ALTER COLUMN sub_logo_url SET DEFAULT '/panalearn-icon-dark.png',
  ALTER COLUMN favicon_url SET DEFAULT '/panalearn-favicon.png',
  ALTER COLUMN primary_color SET DEFAULT '#FCA311',
  ALTER COLUMN secondary_color SET DEFAULT '#14213D',
  ALTER COLUMN company_name SET DEFAULT 'Panalearn',
  ALTER COLUMN company_slogan SET DEFAULT 'Conhecimento em Conexão',
  ALTER COLUMN background_url SET DEFAULT '';

-- 5. Atualizar dados existentes para nova marca PANALEARN
UPDATE public.branding_config
SET
  logo_url = '/panalearn-logo.png',
  sub_logo_url = '/panalearn-icon-dark.png',
  favicon_url = '/panalearn-favicon.png',
  primary_color = '#FCA311',
  secondary_color = '#14213D',
  company_name = 'Panalearn',
  company_slogan = 'Conhecimento em Conexão',
  background_url = '',
  updated_at = now();

-- 6. Se não existir nenhum registro, inserir um
INSERT INTO public.branding_config (
  logo_url, sub_logo_url, favicon_url, background_url,
  primary_color, secondary_color, company_name, company_slogan
)
SELECT
  '/panalearn-logo.png', '/panalearn-icon-dark.png', '/panalearn-favicon.png', '',
  '#FCA311', '#14213D', 'Panalearn', 'Conhecimento em Conexão'
WHERE NOT EXISTS (SELECT 1 FROM public.branding_config);
