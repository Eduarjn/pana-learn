-- =============================================================================
-- RPC admin_link_user_to_empresa: vincula um usuario recem-criado a uma empresa.
--
-- Bug: ao criar usuario (admin de empresa), o UPDATE em usuarios para setar
-- empresa_id era bloqueado pela RLS — a linha nova nasce com empresa_id NULL e
-- usuarios_update_tenant so deixa o admin editar linhas que JA sao da sua
-- empresa. Resultado: usuario criado no auth mas orfao (nao aparecia no
-- ambiente da empresa).
--
-- Correcao: RPC SECURITY DEFINER que faz o vinculo bypassando a RLS, mas
-- valida que o chamador e admin_master OU admin da empresa alvo, e que admin
-- comum nao cria admin_master.
--
-- Aplicada via MCP em 2026-06-15 no projeto oqoxhavdhrgdjvxvajze.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.admin_link_user_to_empresa(
  p_user_id uuid,
  p_empresa_id uuid,
  p_tipo text,
  p_nome text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (
    public.is_admin_master()
    OR (public.is_admin() AND public.get_empresa_id() = p_empresa_id)
  ) THEN
    RAISE EXCEPTION 'Sem permissao para vincular usuario a esta empresa';
  END IF;

  IF p_tipo = 'admin_master' AND NOT public.is_admin_master() THEN
    RAISE EXCEPTION 'Apenas admin_master pode criar admin_master';
  END IF;

  UPDATE public.usuarios
  SET empresa_id = p_empresa_id,
      tipo_usuario = p_tipo::user_type,
      nome = p_nome
  WHERE user_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_link_user_to_empresa(uuid, uuid, text, text) TO authenticated;
