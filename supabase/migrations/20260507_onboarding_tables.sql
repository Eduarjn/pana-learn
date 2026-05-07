-- =============================================
-- ONBOARDING WIZARD — TABELAS E POLÍTICAS
-- Execute este SQL no Supabase SQL Editor
-- =============================================

-- 1. Tabela de organizações (multi-tenant)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT,
  logo_url TEXT,
  primary_color VARCHAR(20) DEFAULT '#22c55e',
  platform_name VARCHAR(255),
  plan VARCHAR(20) DEFAULT 'trial' CHECK (plan IN ('trial', 'starter', 'pro', 'enterprise')),
  plan_status VARCHAR(20) DEFAULT 'pending' CHECK (plan_status IN ('pending', 'trial', 'active', 'cancelled', 'expired')),
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_step INTEGER DEFAULT 1,
  content_preferences JSONB DEFAULT '[]',
  trial_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de assinaturas/planos
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan VARCHAR(20) NOT NULL CHECK (plan IN ('trial', 'starter', 'pro', 'enterprise')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'trial', 'active', 'cancelled', 'expired')),
  mp_preference_id TEXT,
  mp_payment_id TEXT,
  mp_external_reference TEXT,
  amount_cents INTEGER,
  trial_end_date TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. RLS para organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their organizations"
  ON organizations FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can update their organizations"
  ON organizations FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can insert organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 4. RLS para subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their subscriptions"
  ON subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their subscriptions"
  ON subscriptions FOR UPDATE
  USING (user_id = auth.uid());

-- 5. Índices para performance
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_organization_id ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_mp_external_reference ON subscriptions(mp_external_reference);
