-- =============================================================================
-- RPC SECURITY DEFINER: cria empresa durante onboarding e retorna o id.
--
-- Contexto: INSERT em empresas funciona, mas .select() pos-INSERT dispara
-- a policy SELECT (id = get_empresa_id() OR is_admin_master()). O usuario
-- recem-criado ainda nao tem empresa_id em usuarios, entao get_empresa_id()
-- retorna NULL → 403.
--
-- Esta RPC roda como definer (postgres), bypassa RLS, retorna o uuid limpo.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.create_empresa_for_user(
  p_nome text,
  p_subdominio text,
  p_plan text DEFAULT 'starter',
  p_plan_status text DEFAULT 'pending'
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_empresa_id uuid;
BEGIN
  INSERT INTO public.empresas (nome, subdominio, plan, plan_status)
  VALUES (p_nome, p_subdominio, p_plan, p_plan_status)
  RETURNING id INTO v_empresa_id;
  RETURN v_empresa_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_empresa_for_user(text, text, text, text)
  TO anon, authenticated;
