-- =============================================================================
-- RLS: Permitir que utilizadores autenticados criem e actualizem empresas
-- Necessário para o fluxo de onboarding
-- =============================================================================

-- Garantir que RLS está activo
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;

-- Permitir INSERT para utilizadores autenticados (onboarding cria a empresa)
CREATE POLICY IF NOT EXISTS "Authenticated users can create empresas"
  ON empresas
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Permitir SELECT para utilizadores autenticados (ver a sua empresa)
CREATE POLICY IF NOT EXISTS "Authenticated users can view empresas"
  ON empresas
  FOR SELECT
  TO authenticated
  USING (true);

-- Permitir UPDATE para utilizadores autenticados (onboarding actualiza plano/status)
CREATE POLICY IF NOT EXISTS "Authenticated users can update empresas"
  ON empresas
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── USUARIOS ────────────────────────────────────────────────────────────────
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "usuarios_insert"
  ON usuarios FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "usuarios_select"
  ON usuarios FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "usuarios_update"
  ON usuarios FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
