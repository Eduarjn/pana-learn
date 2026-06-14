-- =============================================================================
-- 1. cursos.template_id: coluna existia em migration mas nao fora aplicada no
--    banco -> frontend dava 400 em cursos?select=template_id. Aplicada agora.
-- 2. usuarios: faltava DELETE policy -> admin de empresa nao removia usuarios.
--
-- Aplicada via MCP em 2026-06-14 no projeto oqoxhavdhrgdjvxvajze.
-- =============================================================================

ALTER TABLE public.cursos
  ADD COLUMN IF NOT EXISTS template_id UUID
  REFERENCES public.certificate_templates(id) ON DELETE SET NULL DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_cursos_template_id ON public.cursos(template_id);

DROP POLICY IF EXISTS usuarios_delete_tenant ON public.usuarios;
CREATE POLICY usuarios_delete_tenant ON public.usuarios
  FOR DELETE TO authenticated
  USING (
    (public.is_admin() AND empresa_id = public.get_empresa_id())
    OR public.is_admin_master()
  );
