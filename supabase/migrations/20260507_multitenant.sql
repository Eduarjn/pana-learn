-- =============================================
-- MULTI-TENANT COMPLETO — EXECUTE NO SUPABASE (Eduarjn's Project)
-- =============================================

-- 1. Tabela de empresas (tenant central)
CREATE TABLE IF NOT EXISTS empresas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  subdominio VARCHAR(100),
  plan VARCHAR(20) DEFAULT 'trial',
  plan_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de branding por empresa
CREATE TABLE IF NOT EXISTS branding_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE UNIQUE,
  company_name VARCHAR(255),
  primary_color VARCHAR(20) DEFAULT '#22c55e',
  secondary_color VARCHAR(20) DEFAULT '#14213D',
  logo_url TEXT,
  favicon_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Adicionar empresa_id nas tabelas existentes
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);
ALTER TABLE cursos ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);
ALTER TABLE videos ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);
ALTER TABLE modulos ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);
ALTER TABLE certificados ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);
ALTER TABLE categorias ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);
ALTER TABLE progresso_usuario ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);
ALTER TABLE video_progress ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);

-- 4. Índices
CREATE INDEX IF NOT EXISTS idx_empresas_org ON empresas(organization_id);
CREATE INDEX IF NOT EXISTS idx_branding_empresa ON branding_config(empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa ON usuarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cursos_empresa ON cursos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_videos_empresa ON videos(empresa_id);

-- 5. RLS para empresas
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their empresa" ON empresas FOR SELECT
  USING (id IN (SELECT empresa_id FROM usuarios WHERE user_id = auth.uid()));

CREATE POLICY "Service role full access empresas" ON empresas FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated can insert empresas" ON empresas FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 6. RLS para branding_config
ALTER TABLE branding_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their branding" ON branding_config FOR SELECT
  USING (empresa_id IN (SELECT empresa_id FROM usuarios WHERE user_id = auth.uid()));

CREATE POLICY "Admins update branding" ON branding_config FOR UPDATE
  USING (empresa_id IN (SELECT empresa_id FROM usuarios WHERE user_id = auth.uid()));

CREATE POLICY "Authenticated can insert branding" ON branding_config FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 7. View current_tenant (junta tudo para o usuário logado)
CREATE OR REPLACE VIEW current_tenant AS
SELECT
  e.id AS empresa_id,
  o.id AS organization_id,
  e.subdominio,
  e.nome AS empresa_nome,
  o.plan,
  o.plan_status,
  bc.primary_color AS cor_primaria,
  bc.logo_url,
  o.onboarding_completed,
  o.trial_end_date,
  u.tipo_usuario,
  u.id AS usuario_interno_id,
  u.nome AS usuario_nome
FROM usuarios u
JOIN empresas e ON e.id = u.empresa_id
JOIN organizations o ON o.id = e.organization_id
LEFT JOIN branding_config bc ON bc.empresa_id = e.id
WHERE u.user_id = auth.uid()
LIMIT 1;

-- 8. Função setup_tenant_environment
CREATE OR REPLACE FUNCTION setup_tenant_environment(
  p_organization_id UUID,
  p_owner_auth_id UUID,
  p_company_name TEXT,
  p_platform_name TEXT DEFAULT NULL,
  p_primary_color TEXT DEFAULT '#22c55e',
  p_logo_url TEXT DEFAULT NULL,
  p_subdominio TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_empresa_id UUID;
  v_owner_email TEXT;
  v_owner_name TEXT;
BEGIN
  -- Buscar dados do owner no auth
  SELECT email, raw_user_meta_data->>'full_name'
  INTO v_owner_email, v_owner_name
  FROM auth.users WHERE id = p_owner_auth_id;

  -- Criar empresa
  INSERT INTO empresas (organization_id, nome, subdominio, plan, plan_status)
  VALUES (p_organization_id, p_company_name, p_subdominio, 'trial', 'pending')
  RETURNING id INTO v_empresa_id;

  -- Vincular organization à empresa
  UPDATE organizations SET empresa_id = v_empresa_id WHERE id = p_organization_id;

  -- Criar branding
  INSERT INTO branding_config (empresa_id, company_name, primary_color, logo_url)
  VALUES (v_empresa_id, COALESCE(p_platform_name, p_company_name), p_primary_color, p_logo_url);

  -- Criar usuario admin vinculado à empresa
  INSERT INTO usuarios (nome, email, tipo_usuario, status, user_id, empresa_id, senha_hashed)
  VALUES (
    COALESCE(v_owner_name, p_company_name),
    v_owner_email,
    'admin_master',
    'ativo',
    p_owner_auth_id,
    v_empresa_id,
    'supabase_auth'
  )
  ON CONFLICT (email) DO UPDATE SET empresa_id = v_empresa_id, tipo_usuario = 'admin_master';

  RETURN v_empresa_id;
END;
$$;
