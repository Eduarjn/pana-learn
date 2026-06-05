-- ============================================================
-- Migration: Sistema de Certificados Customizáveis
-- Tabelas: certificate_templates
-- Alterações: certificados (+ template_id, carga_horaria, etc.)
-- Storage: bucket certificate-assets
-- ============================================================

-- ─── Tabela: certificate_templates ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id          uuid REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  name                text NOT NULL,
  is_default          boolean DEFAULT false,
  layout_type         text NOT NULL DEFAULT 'classic',  -- classic | modern | minimal | corporate

  -- Identidade
  company_name        text,
  company_logo_url    text,

  -- Cores
  primary_color       text DEFAULT '#4B3F72',
  secondary_color     text DEFAULT '#417B5A',
  background_color    text DEFAULT '#FFFFFF',
  text_color          text DEFAULT '#1F2937',

  -- Tipografia
  font_family         text DEFAULT 'Georgia',
  font_size_title     integer DEFAULT 36,
  font_size_name      integer DEFAULT 28,
  font_size_body      integer DEFAULT 14,

  -- Assinatura
  signature_name      text,
  signature_role      text,
  signature_image_url text,

  -- Textos customizáveis
  header_text         text DEFAULT 'CERTIFICADO DE CONCLUSÃO',
  intro_text          text DEFAULT 'Certificamos para os devidos fins que',
  body_text           text DEFAULT 'concluiu com êxito o curso de formação profissional em',
  footer_text         text DEFAULT 'Emitido pela plataforma Panalearn',

  -- Decoração
  show_border         boolean DEFAULT true,
  border_color        text DEFAULT '#4B3F72',
  border_style        text DEFAULT 'double',     -- none | single | double | ornamental
  show_watermark      boolean DEFAULT false,

  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- ─── Atualizar tabela certificados ───────────────────────────────────────────
ALTER TABLE public.certificados
  ADD COLUMN IF NOT EXISTS template_id      uuid REFERENCES public.certificate_templates(id),
  ADD COLUMN IF NOT EXISTS carga_horaria    integer,
  ADD COLUMN IF NOT EXISTS aproveitamento   numeric(5,2),
  ADD COLUMN IF NOT EXISTS validation_code  text UNIQUE DEFAULT upper(substring(gen_random_uuid()::text, 1, 8)),
  ADD COLUMN IF NOT EXISTS issued_at        timestamptz DEFAULT now();

-- Preencher validation_code para registros existentes sem código
UPDATE public.certificados
  SET validation_code = upper(substring(gen_random_uuid()::text, 1, 8))
  WHERE validation_code IS NULL;

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

-- Usuários da empresa leem seus templates
CREATE POLICY "templates: empresa lê os próprios"
  ON public.certificate_templates FOR SELECT
  USING (empresa_id = public.get_empresa_id() OR public.is_admin_master());

-- Admin gerencia templates da empresa
CREATE POLICY "templates: admin gerencia"
  ON public.certificate_templates FOR ALL
  USING (public.is_admin() AND (empresa_id = public.get_empresa_id() OR public.is_admin_master()));

-- ─── Função: garantir apenas 1 template padrão por empresa ───────────────────
CREATE OR REPLACE FUNCTION public.ensure_single_default_template()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.certificate_templates
    SET is_default = false
    WHERE empresa_id = NEW.empresa_id
      AND id <> NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_single_default_template ON public.certificate_templates;
CREATE TRIGGER trg_single_default_template
  AFTER INSERT OR UPDATE OF is_default ON public.certificate_templates
  FOR EACH ROW EXECUTE FUNCTION public.ensure_single_default_template();

-- ─── Storage bucket ───────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
  VALUES ('certificate-assets', 'certificate-assets', true)
  ON CONFLICT (id) DO NOTHING;

-- Policy: usuários autenticados podem ler assets
CREATE POLICY "certificate-assets: leitura pública"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'certificate-assets');

-- Policy: admin pode fazer upload
CREATE POLICY "certificate-assets: admin upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'certificate-assets'
    AND public.is_admin()
  );

-- Policy: admin pode deletar
CREATE POLICY "certificate-assets: admin delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'certificate-assets'
    AND public.is_admin()
  );
