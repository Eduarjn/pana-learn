-- Corrige IDOR (Insecure Direct Object Reference) nas funções de certificado.
--
-- Problema: gerar_certificado_dinamico, gerar_certificado_curso e
-- buscar_certificados_usuario_dinamico recebiam p_usuario_id e confiavam nele,
-- sem checar quem é o caller. Como são SECURITY DEFINER (bypassam RLS), um usuário
-- autenticado podia ler/gerar certificados de OUTRO usuário passando o uuid alheio.
--
-- Observações de contexto:
--   • p_usuario_id é o usuarios.id (PK), não auth.uid(). O frontend passa
--     userProfile.id (= usuarios.id do próprio caller).
--   • O fluxo principal de geração (useQuiz.ts) NÃO usa essas RPCs — insere direto
--     na tabela certificados respeitando RLS. As RPCs são caminho secundário
--     (CertificateGenerator/useCertificates), sempre com o id do próprio usuário.
--   • gerar_certificado_curso (ambas overloads) não é chamada por ninguém
--     (nem frontend, nem outra função) → lockdown total.

-- ── Helper de autorização ─────────────────────────────────────────────────────
-- Permite: o próprio usuário; admin_master (qualquer um); admin (mesma empresa).
create or replace function public.assert_can_manage_user_cert(p_target uuid)
returns void
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_caller       uuid;
  v_caller_tipo  text;
  v_caller_emp   uuid;
  v_target_emp   uuid;
begin
  select id, tipo_usuario::text, empresa_id
    into v_caller, v_caller_tipo, v_caller_emp
    from public.usuarios
   where user_id = auth.uid();

  if v_caller is null then
    raise exception 'Usuário não autenticado';
  end if;

  -- próprio usuário
  if v_caller = p_target then
    return;
  end if;

  -- admin_master pode qualquer um
  if v_caller_tipo = 'admin_master' then
    return;
  end if;

  -- admin pode usuários da mesma empresa
  if v_caller_tipo = 'admin' then
    select empresa_id into v_target_emp from public.usuarios where id = p_target;
    if v_target_emp is not null and v_target_emp = v_caller_emp then
      return;
    end if;
  end if;

  raise exception 'Acesso negado: sem permissão para acessar dados deste usuário';
end;
$$;

revoke execute on function public.assert_can_manage_user_cert(uuid) from public, anon;
grant  execute on function public.assert_can_manage_user_cert(uuid) to authenticated;

-- ── buscar_certificados_usuario_dinamico: + guard ─────────────────────────────
create or replace function public.buscar_certificados_usuario_dinamico(p_usuario_id uuid)
 returns table(id uuid, curso_nome text, categoria text, numero_certificado character varying, data_emissao timestamp with time zone, carga_horaria integer, nota integer, status character varying, certificado_url text, qr_code_url text)
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
begin
  perform public.assert_can_manage_user_cert(p_usuario_id);

  return query
  select
    c.id,
    c.curso_nome,
    c.categoria,
    c.numero_certificado,
    c.data_emissao,
    calcular_carga_horaria_curso(c.curso_id) as carga_horaria,
    c.nota,
    c.status,
    c.certificado_url,
    c.qr_code_url
  from certificados c
  where c.usuario_id = p_usuario_id
  order by c.data_emissao desc;
end;
$function$;

-- ── gerar_certificado_dinamico: + guard ───────────────────────────────────────
create or replace function public.gerar_certificado_dinamico(p_usuario_id uuid, p_curso_id uuid, p_quiz_id uuid, p_nota integer)
 returns uuid
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
declare
  v_certificado_id UUID;
  v_curso_nome TEXT;
  v_usuario_nome TEXT;
  v_carga_horaria INTEGER;
  v_numero_certificado VARCHAR(50);
  v_categoria TEXT;
begin
  perform public.assert_can_manage_user_cert(p_usuario_id);

  -- Verificar se já existe certificado para este usuário e curso
  IF EXISTS (
    SELECT 1 FROM certificados
    WHERE usuario_id = p_usuario_id AND curso_id = p_curso_id
  ) THEN
    RAISE EXCEPTION 'Certificado já existe para este usuário e curso';
  END IF;

  -- Obter dados do curso
  SELECT c.nome, c.categoria
  INTO v_curso_nome, v_categoria
  FROM cursos c
  WHERE c.id = p_curso_id;

  -- Obter nome do usuário (usando apenas tabela usuarios)
  SELECT COALESCE(u.nome, u.email)
  INTO v_usuario_nome
  FROM usuarios u
  WHERE u.id = p_usuario_id;

  -- Calcular carga horária
  v_carga_horaria := calcular_carga_horaria_curso(p_curso_id);

  -- Gerar número único do certificado
  v_numero_certificado := gerar_numero_certificado(p_curso_id, p_usuario_id);

  -- Inserir certificado
  INSERT INTO certificados (
    usuario_id, curso_id, curso_nome, categoria, quiz_id, nota,
    data_conclusao, data_emissao, numero_certificado, status,
    certificado_url, qr_code_url
  ) VALUES (
    p_usuario_id, p_curso_id, v_curso_nome, v_categoria, p_quiz_id, p_nota,
    NOW(), NOW(), v_numero_certificado, 'ativo',
    NULL, NULL
  ) RETURNING id INTO v_certificado_id;

  RETURN v_certificado_id;
end;
$function$;

-- garante grants corretos após o CREATE OR REPLACE
revoke execute on function public.buscar_certificados_usuario_dinamico(uuid) from public, anon;
grant  execute on function public.buscar_certificados_usuario_dinamico(uuid) to authenticated;
revoke execute on function public.gerar_certificado_dinamico(uuid,uuid,uuid,integer) from public, anon;
grant  execute on function public.gerar_certificado_dinamico(uuid,uuid,uuid,integer) to authenticated;

-- ── gerar_certificado_curso: órfã → lockdown total ────────────────────────────
revoke execute on function public.gerar_certificado_curso(uuid,uuid,uuid,integer) from public, anon, authenticated;
revoke execute on function public.gerar_certificado_curso(uuid,uuid,uuid,numeric) from public, anon, authenticated;
