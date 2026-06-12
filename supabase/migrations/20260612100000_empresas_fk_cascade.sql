-- ============================================================
-- ON DELETE CASCADE em todas as FKs que apontam para empresas.id
-- Ao deletar uma empresa, apaga em cascata: usuarios, cursos,
-- videos, modulos, certificados, categorias, progressos,
-- subscriptions, branding_config, quizzes, quiz_* da empresa.
-- ⚠️ Destrutivo — pensa duas vezes antes em produção.
-- ============================================================

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT
      tc.table_schema,
      tc.table_name,
      tc.constraint_name,
      kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema   = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
     AND ccu.table_schema    = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'empresas'
      AND ccu.column_name = 'id'
      AND ccu.table_schema = 'public'
  LOOP
    EXECUTE format(
      'ALTER TABLE %I.%I DROP CONSTRAINT %I',
      rec.table_schema, rec.table_name, rec.constraint_name
    );
    EXECUTE format(
      'ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.empresas(id) ON DELETE CASCADE',
      rec.table_schema, rec.table_name, rec.constraint_name, rec.column_name
    );
    RAISE NOTICE 'Cascade adicionado: %.% (%)', rec.table_schema, rec.table_name, rec.column_name;
  END LOOP;
END $$;
