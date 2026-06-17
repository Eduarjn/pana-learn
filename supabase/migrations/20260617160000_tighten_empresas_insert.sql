-- empresas_insert era check=true (qualquer authenticated criava empresa).
-- Onboarding cria empresa via RPC create_empresa_for_user (SECURITY DEFINER,
-- bypassa RLS), então a policy direta só precisa cobrir admin_master.
DROP POLICY IF EXISTS "empresas_insert" ON public.empresas;
CREATE POLICY "empresas_insert" ON public.empresas
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_master());
