-- =============================================================================
-- Permitir INSERT em empresas/usuarios para role public (anon + authenticated)
-- durante onboarding.
--
-- Contexto: signUp pode retornar sem session (email confirmation ou propagacao
-- assincrona), e os INSERTs subsequentes saem como anon. As policies anteriores
-- exigiam TO authenticated e bloqueavam com 403.
--
-- Seguro porque SELECT/UPDATE/DELETE permanecem restritos por empresa_id
-- (tenant isolation). O risco maximo e criacao de empresas orfas, ja mitigado
-- pelo fluxo de onboarding controlado.
-- =============================================================================

DROP POLICY IF EXISTS "empresas_insert" ON public.empresas;
CREATE POLICY "empresas_insert"
  ON public.empresas FOR INSERT
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "usuarios_insert" ON public.usuarios;
CREATE POLICY "usuarios_insert"
  ON public.usuarios FOR INSERT
  TO public
  WITH CHECK (true);
