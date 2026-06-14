-- =============================================================================
-- Housekeeping: remove tabelas _backup_* (snapshots de migracoes antigas)
-- que ficavam no schema public. Eram cópias de dados sensíveis (usuarios com
-- PII, empresas, subscriptions, organizations) sem nenhuma FK apontando pra
-- elas. Detectadas pelos Supabase advisors (rls_enabled_no_policy).
--
-- Aplicada via MCP em 2026-06-14 no projeto oqoxhavdhrgdjvxvajze.
-- =============================================================================

DROP TABLE IF EXISTS public._backup_branding_config;
DROP TABLE IF EXISTS public._backup_domains;
DROP TABLE IF EXISTS public._backup_empresas;
DROP TABLE IF EXISTS public._backup_organizations;
DROP TABLE IF EXISTS public._backup_subscriptions;
DROP TABLE IF EXISTS public._backup_usuarios;
