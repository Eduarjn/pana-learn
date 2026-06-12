-- ============================================================
-- Migration: Quiz como tipo de módulo na trilha
-- Data: 2026-06-10
-- Tabelas: quizzes, quiz_questoes, quiz_opcoes,
--          quiz_tentativas, quiz_respostas
-- ============================================================

-- Primeiro, adicionar coluna 'tipo' na tabela modulos (se não existir)
-- Assumindo que modulos já existe com id, trilha_id, titulo, etc.
-- ALTER TABLE public.modulos ADD COLUMN tipo VARCHAR(50) DEFAULT 'video_lesson';
-- ALTER TABLE public.modulos ADD COLUMN quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL;

-- ════════════════════════════════════════════════════════════
-- TABELA: quizzes
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  tempo_limite INTEGER, -- minutos, nullable
  tentativas_permitidas INTEGER NOT NULL DEFAULT 1 CHECK (tentativas_permitidas > 0),
  nota_minima_aprovacao INTEGER NOT NULL DEFAULT 70 CHECK (nota_minima_aprovacao >= 0 AND nota_minima_aprovacao <= 100),
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quizzes_empresa_id ON public.quizzes(empresa_id);

-- ════════════════════════════════════════════════════════════
-- TABELA: quiz_questoes
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.quiz_questoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('multipla_escolha', 'verdadeiro_falso', 'resposta_aberta', 'arrastar_soltar', 'fill_blank')),
  enunciado TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  pontuacao INTEGER NOT NULL DEFAULT 1 CHECK (pontuacao > 0),
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_questoes_quiz_id ON public.quiz_questoes(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questoes_empresa_id ON public.quiz_questoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questoes_ordem ON public.quiz_questoes(ordem);

-- ════════════════════════════════════════════════════════════
-- TABELA: quiz_opcoes
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.quiz_opcoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  questao_id UUID NOT NULL REFERENCES public.quiz_questoes(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  correta BOOLEAN NOT NULL DEFAULT FALSE,
  ordem INTEGER NOT NULL DEFAULT 0,
  grupo VARCHAR(255), -- para arrastar_soltar: agrupa opções em colunas/grupos
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_opcoes_questao_id ON public.quiz_opcoes(questao_id);
CREATE INDEX IF NOT EXISTS idx_quiz_opcoes_empresa_id ON public.quiz_opcoes(empresa_id);

-- ════════════════════════════════════════════════════════════
-- TABELA: quiz_tentativas
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.quiz_tentativas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  iniciada_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  finalizada_em TIMESTAMP WITH TIME ZONE,
  pontuacao_obtida NUMERIC(5,2),
  pontuacao_total NUMERIC(5,2),
  aprovado BOOLEAN,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_tentativas_quiz_id ON public.quiz_tentativas(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_tentativas_usuario_id ON public.quiz_tentativas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_quiz_tentativas_empresa_id ON public.quiz_tentativas(empresa_id);

-- ════════════════════════════════════════════════════════════
-- TABELA: quiz_respostas
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.quiz_respostas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tentativa_id UUID NOT NULL REFERENCES public.quiz_tentativas(id) ON DELETE CASCADE,
  questao_id UUID NOT NULL REFERENCES public.quiz_questoes(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  resposta_texto TEXT, -- para resposta_aberta
  opcoes_selecionadas JSONB, -- para multipla_escolha, arrastar, fill_blank
  correta BOOLEAN, -- null se resposta_aberta (precisa validação manual)
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_respostas_tentativa_id ON public.quiz_respostas(tentativa_id);
CREATE INDEX IF NOT EXISTS idx_quiz_respostas_questao_id ON public.quiz_respostas(questao_id);
CREATE INDEX IF NOT EXISTS idx_quiz_respostas_empresa_id ON public.quiz_respostas(empresa_id);

-- ════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ════════════════════════════════════════════════════════════

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_opcoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_tentativas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_respostas ENABLE ROW LEVEL SECURITY;

-- Políticas para quizzes
CREATE POLICY "quizzes: usuário lê da empresa"
  ON public.quizzes FOR SELECT
  USING (
    empresa_id = public.get_empresa_id()
    OR public.is_admin_master()
  );

CREATE POLICY "quizzes: admin insere"
  ON public.quizzes FOR INSERT
  WITH CHECK (
    public.is_admin()
    AND (empresa_id = public.get_empresa_id() OR public.is_admin_master())
  );

CREATE POLICY "quizzes: admin atualiza"
  ON public.quizzes FOR UPDATE
  USING (
    public.is_admin()
    AND (empresa_id = public.get_empresa_id() OR public.is_admin_master())
  );

CREATE POLICY "quizzes: admin deleta"
  ON public.quizzes FOR DELETE
  USING (
    public.is_admin()
    AND (empresa_id = public.get_empresa_id() OR public.is_admin_master())
  );

-- Políticas para quiz_questoes
CREATE POLICY "quiz_questoes: usuário lê da empresa"
  ON public.quiz_questoes FOR SELECT
  USING (
    empresa_id = public.get_empresa_id()
    OR public.is_admin_master()
  );

CREATE POLICY "quiz_questoes: admin insere"
  ON public.quiz_questoes FOR INSERT
  WITH CHECK (
    public.is_admin()
    AND (empresa_id = public.get_empresa_id() OR public.is_admin_master())
  );

CREATE POLICY "quiz_questoes: admin atualiza"
  ON public.quiz_questoes FOR UPDATE
  USING (
    public.is_admin()
    AND (empresa_id = public.get_empresa_id() OR public.is_admin_master())
  );

CREATE POLICY "quiz_questoes: admin deleta"
  ON public.quiz_questoes FOR DELETE
  USING (
    public.is_admin()
    AND (empresa_id = public.get_empresa_id() OR public.is_admin_master())
  );

-- Políticas para quiz_opcoes
CREATE POLICY "quiz_opcoes: usuário lê da empresa"
  ON public.quiz_opcoes FOR SELECT
  USING (
    empresa_id = public.get_empresa_id()
    OR public.is_admin_master()
  );

CREATE POLICY "quiz_opcoes: admin insere"
  ON public.quiz_opcoes FOR INSERT
  WITH CHECK (
    public.is_admin()
    AND (empresa_id = public.get_empresa_id() OR public.is_admin_master())
  );

CREATE POLICY "quiz_opcoes: admin atualiza"
  ON public.quiz_opcoes FOR UPDATE
  USING (
    public.is_admin()
    AND (empresa_id = public.get_empresa_id() OR public.is_admin_master())
  );

CREATE POLICY "quiz_opcoes: admin deleta"
  ON public.quiz_opcoes FOR DELETE
  USING (
    public.is_admin()
    AND (empresa_id = public.get_empresa_id() OR public.is_admin_master())
  );

-- Políticas para quiz_tentativas
CREATE POLICY "quiz_tentativas: usuário vê suas tentativas"
  ON public.quiz_tentativas FOR SELECT
  USING (
    usuario_id = auth.uid()
    OR (public.is_admin() AND empresa_id = public.get_empresa_id())
    OR public.is_admin_master()
  );

CREATE POLICY "quiz_tentativas: usuário insere suas tentativas"
  ON public.quiz_tentativas FOR INSERT
  WITH CHECK (
    usuario_id = auth.uid()
    AND empresa_id = public.get_empresa_id()
  );

CREATE POLICY "quiz_tentativas: usuário atualiza suas tentativas"
  ON public.quiz_tentativas FOR UPDATE
  USING (
    usuario_id = auth.uid()
    AND empresa_id = public.get_empresa_id()
  );

-- Políticas para quiz_respostas
CREATE POLICY "quiz_respostas: usuário vê suas respostas"
  ON public.quiz_respostas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_tentativas
      WHERE quiz_tentativas.id = quiz_respostas.tentativa_id
      AND (
        quiz_tentativas.usuario_id = auth.uid()
        OR (public.is_admin() AND quiz_tentativas.empresa_id = public.get_empresa_id())
        OR public.is_admin_master()
      )
    )
  );

CREATE POLICY "quiz_respostas: usuário insere suas respostas"
  ON public.quiz_respostas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quiz_tentativas
      WHERE quiz_tentativas.id = quiz_respostas.tentativa_id
      AND quiz_tentativas.usuario_id = auth.uid()
      AND quiz_respostas.empresa_id = public.get_empresa_id()
    )
  );

-- ════════════════════════════════════════════════════════════
-- TRIGGERS para updated_at
-- ════════════════════════════════════════════════════════════

CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quiz_questoes_updated_at
  BEFORE UPDATE ON public.quiz_questoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ════════════════════════════════════════════════════════════
-- COMMENTS para documentação
-- ════════════════════════════════════════════════════════════

COMMENT ON TABLE public.quizzes IS 'Quizzes como módulos de trilhas, com suporte a múltiplas tentativas e tempo limite';
COMMENT ON TABLE public.quiz_questoes IS 'Questões dos quizzes, com suporte a 5 tipos diferentes';
COMMENT ON TABLE public.quiz_opcoes IS 'Opções de resposta para questões de múltipla escolha, arrastar/soltar, etc.';
COMMENT ON TABLE public.quiz_tentativas IS 'Registro de cada tentativa de um usuário em um quiz';
COMMENT ON TABLE public.quiz_respostas IS 'Respostas individuais do usuário para cada questão de uma tentativa';
