-- Isola quiz_audios por empresa_id (multi-tenant).
-- Antes: policy "Todos podem ver audios" com USING (true) vazava áudios de
-- um tenant para todos os outros (ex.: áudio do PanaLearn aparecia na BLUME).
-- O empresa_id também ficava null no INSERT (frontend não enviava).

-- 1) Dar dono ao áudio órfão (carregado no PanaLearn central) e impedir órfãos futuros
UPDATE public.quiz_audios
SET empresa_id = '8e90233c-4fe8-48ae-8415-31b5d41209d0'
WHERE empresa_id IS NULL;

-- empresa_id passa a ser preenchido automaticamente pela empresa do usuário logado
ALTER TABLE public.quiz_audios ALTER COLUMN empresa_id SET DEFAULT public.get_empresa_id();
ALTER TABLE public.quiz_audios ALTER COLUMN empresa_id SET NOT NULL;

-- 2) Remover as policies que vazavam entre tenants
DROP POLICY IF EXISTS "Todos podem ver audios" ON public.quiz_audios;
DROP POLICY IF EXISTS "Admins podem gerenciar audios" ON public.quiz_audios;

-- 3) Policies isoladas por empresa_id (admin_master enxerga tudo)
-- SELECT: qualquer usuário do mesmo tenant (necessário para tocar áudio no quiz)
CREATE POLICY "quiz_audios_select_tenant" ON public.quiz_audios
  FOR SELECT TO authenticated
  USING (empresa_id = public.get_empresa_id() OR public.is_admin_master());

-- INSERT: apenas admins, e dentro do próprio tenant
CREATE POLICY "quiz_audios_insert_admin" ON public.quiz_audios
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    AND (empresa_id = public.get_empresa_id() OR public.is_admin_master())
  );

-- UPDATE: admins do próprio tenant
CREATE POLICY "quiz_audios_update_admin" ON public.quiz_audios
  FOR UPDATE TO authenticated
  USING (public.is_admin() AND (empresa_id = public.get_empresa_id() OR public.is_admin_master()))
  WITH CHECK (public.is_admin() AND (empresa_id = public.get_empresa_id() OR public.is_admin_master()));

-- DELETE: admins do próprio tenant
CREATE POLICY "quiz_audios_delete_admin" ON public.quiz_audios
  FOR DELETE TO authenticated
  USING (public.is_admin() AND (empresa_id = public.get_empresa_id() OR public.is_admin_master()));
