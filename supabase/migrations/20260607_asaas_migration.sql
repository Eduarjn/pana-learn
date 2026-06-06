-- =============================================================================
-- Migração: Mercado Pago → Asaas
-- Data: 2026-06-07
-- =============================================================================

-- 1. Adicionar coluna asaas_customer_id na tabela empresas
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT;

-- 2. Substituir colunas MP por Asaas na tabela subscriptions
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS asaas_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS asaas_payment_id TEXT;

-- 3. Índice para lookup rápido por subscription_id (webhook)
CREATE INDEX IF NOT EXISTS idx_subscriptions_asaas_sub_id
  ON subscriptions(asaas_subscription_id)
  WHERE asaas_subscription_id IS NOT NULL;

-- 4. Remover colunas do Mercado Pago (safe — já não são usadas após deploy)
-- Descomentar após confirmar que tudo funciona:
-- ALTER TABLE subscriptions DROP COLUMN IF EXISTS mp_preference_id;
-- ALTER TABLE subscriptions DROP COLUMN IF EXISTS mp_payment_id;
-- ALTER TABLE subscriptions DROP COLUMN IF EXISTS mp_external_reference;
