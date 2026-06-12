-- ─────────────────────────────────────────────────────────────────────────────
-- Vincula um template de certificado a cada curso (treinamento).
-- Sem esta coluna, o vínculo curso↔template fica apenas no localStorage do
-- navegador (não funciona entre usuários diferentes). Com a coluna, o template
-- escolhido pelo admin é respeitado para QUALQUER aluno que gere o certificado.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.cursos
  ADD COLUMN IF NOT EXISTS template_id UUID
  REFERENCES public.certificate_templates(id) ON DELETE SET NULL
  DEFAULT NULL;

COMMENT ON COLUMN public.cursos.template_id IS
  'Template de certificado vinculado a este curso. NULL = usa o template padrão (is_default).';

-- Índice para joins rápidos ao gerar/consultar certificados
CREATE INDEX IF NOT EXISTS idx_cursos_template_id ON public.cursos(template_id);
