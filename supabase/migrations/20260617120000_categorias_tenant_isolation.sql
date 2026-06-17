-- ════════════════════════════════════════════════════════════════════════
-- Isolar categorias por empresa. Antes eram globais porque havia UNIQUE(nome)
-- global (dois tenants não podiam ter "Básico") e a RLS tinha "empresa_id IS
-- NULL", expondo a taxonomia de um tenant aos demais.
--
-- Seguro: atribui as legadas ao dono REAL (por uso de curso), troca o unique
-- p/ (nome, empresa_id), escopa a RLS e semeia defaults por tenant. Verificado:
-- 0 categorias null e 0 cursos apontando para categoria de outra empresa.
-- ════════════════════════════════════════════════════════════════════════

-- 1) Atribuir legadas (empresa_id null) ao dono correto
UPDATE public.categorias SET empresa_id = '7a3f37ad-6fe9-4735-8a52-5e85e6c6840c'
WHERE id = '7940940f-129d-44e8-90ba-802bddcdef72';           -- "model 1" -> BLUME (curso usa)
UPDATE public.categorias SET empresa_id = '8e90233c-4fe8-48ae-8415-31b5d41209d0'
WHERE empresa_id IS NULL;                                     -- restante -> Panalearn

-- 2) UNIQUE global -> composto (permite mesmo nome em tenants diferentes)
ALTER TABLE public.categorias DROP CONSTRAINT IF EXISTS categorias_nome_key;
ALTER TABLE public.categorias ADD CONSTRAINT categorias_nome_empresa_key UNIQUE (nome, empresa_id);

-- 3) empresa_id automático + obrigatório
ALTER TABLE public.categorias ALTER COLUMN empresa_id SET DEFAULT public.get_empresa_id();
ALTER TABLE public.categorias ALTER COLUMN empresa_id SET NOT NULL;

-- 4) RLS escopada por empresa (admin_master enxerga tudo)
DROP POLICY IF EXISTS "categorias: admin gerencia" ON public.categorias;
DROP POLICY IF EXISTS "categorias_admin" ON public.categorias;
DROP POLICY IF EXISTS "categorias: leitura pública autenticada" ON public.categorias;
DROP POLICY IF EXISTS "categorias_select_by_empresa" ON public.categorias;

CREATE POLICY "categorias_select_tenant" ON public.categorias
  FOR SELECT TO authenticated
  USING (empresa_id = public.get_empresa_id() OR public.is_admin_master());
CREATE POLICY "categorias_insert_admin" ON public.categorias
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() AND (empresa_id = public.get_empresa_id() OR public.is_admin_master()));
CREATE POLICY "categorias_update_admin" ON public.categorias
  FOR UPDATE TO authenticated
  USING (public.is_admin() AND (empresa_id = public.get_empresa_id() OR public.is_admin_master()))
  WITH CHECK (public.is_admin() AND (empresa_id = public.get_empresa_id() OR public.is_admin_master()));
CREATE POLICY "categorias_delete_admin" ON public.categorias
  FOR DELETE TO authenticated
  USING (public.is_admin() AND (empresa_id = public.get_empresa_id() OR public.is_admin_master()));

-- 5) Semear 4 categorias genéricas para cada tenant existente ≠ Panalearn
INSERT INTO public.categorias (nome, descricao, cor, empresa_id)
SELECT d.nome, d.descricao, d.cor, e.id
FROM public.empresas e
CROSS JOIN (VALUES
  ('Básico',        'Treinamentos introdutórios',          '#3B82F6'),
  ('Intermediário', 'Treinamentos de nível intermediário', '#F59E0B'),
  ('Avançado',      'Treinamentos avançados',              '#8B5CF6'),
  ('Comercial',     'Vendas, negociação e atendimento',    '#10B981')
) AS d(nome, descricao, cor)
WHERE e.id <> '8e90233c-4fe8-48ae-8415-31b5d41209d0'
ON CONFLICT (nome, empresa_id) DO NOTHING;

-- 6) Seed automático para novas empresas no onboarding
CREATE OR REPLACE FUNCTION public.create_empresa_for_user(p_nome text, p_subdominio text, p_plan text DEFAULT 'starter'::text, p_plan_status text DEFAULT 'awaiting_onboarding'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_empresa_id uuid;
BEGIN
  INSERT INTO public.empresas (nome, subdominio, plan, plan_status)
  VALUES (p_nome, p_subdominio, p_plan, p_plan_status)
  RETURNING id INTO v_empresa_id;

  INSERT INTO public.categorias (nome, descricao, cor, empresa_id) VALUES
    ('Básico',        'Treinamentos introdutórios',          '#3B82F6', v_empresa_id),
    ('Intermediário', 'Treinamentos de nível intermediário', '#F59E0B', v_empresa_id),
    ('Avançado',      'Treinamentos avançados',              '#8B5CF6', v_empresa_id),
    ('Comercial',     'Vendas, negociação e atendimento',    '#10B981', v_empresa_id)
  ON CONFLICT (nome, empresa_id) DO NOTHING;

  RETURN v_empresa_id;
END;
$function$;
