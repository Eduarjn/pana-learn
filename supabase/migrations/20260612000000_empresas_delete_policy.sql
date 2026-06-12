-- ============================================================
-- Permitir admin_master deletar empresas
-- Sem esta policy, DELETE na tabela `empresas` retorna 200 OK
-- com 0 rows afetadas (silenciado pela RLS) — a UI parece deletar
-- mas a linha volta no próximo fetch.
-- ============================================================

DROP POLICY IF EXISTS "empresas: admin_master deleta" ON public.empresas;

CREATE POLICY "empresas: admin_master deleta"
  ON public.empresas FOR DELETE
  USING (public.is_admin_master());

-- Nota: empresas.id é referenciada por usuarios, cursos, videos,
-- modulos, categorias, progresso_usuario, video_progress,
-- subscriptions, organizations — sem ON DELETE CASCADE. Se a
-- empresa tiver registros vinculados, o DELETE falhará com FK
-- violation. Empresas em trial vazias deletam normalmente.
