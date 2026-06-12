import { supabase } from '@/integrations/supabase/client';
import {
  Quiz, QuizCreate, QuizUpdate,
  Questao, QuestaoComOpcoes, QuestaoCreate,
  Opcao, OpcaoCreate,
  Tentativa, TentativaCreate,
  Resposta, RespostaCreate,
  ResultadoQuiz
} from '@/types/quiz.types';

// ════════════════════════════════════════════════════════════
// QUIZZES
// ════════════════════════════════════════════════════════════

export async function criarQuiz(data: QuizCreate): Promise<Quiz> {
  const { data: quiz, error } = await supabase
    .from('quizzes')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return quiz;
}

export async function obterQuiz(quizId: string): Promise<Quiz> {
  const { data, error } = await supabase
    .from('quizzes')
    .select()
    .eq('id', quizId)
    .single();

  if (error) throw error;
  return data;
}

export async function obterQuizComQuestoes(quizId: string): Promise<{ quiz: Quiz; questoes: QuestaoComOpcoes[] }> {
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select()
    .eq('id', quizId)
    .single();

  if (quizError) throw quizError;

  const { data: questoes, error: questoesError } = await supabase
    .from('quiz_questoes')
    .select(`
      *,
      quiz_opcoes (
        id,
        questao_id,
        empresa_id,
        texto,
        correta,
        ordem,
        grupo,
        criado_em
      )
    `)
    .eq('quiz_id', quizId)
    .order('ordem', { ascending: true });

  if (questoesError) throw questoesError;

  return {
    quiz,
    questoes: (questoes || []).map(q => ({
      ...q,
      opcoes: q.quiz_opcoes || []
    }))
  };
}

export async function atualizarQuiz(id: string, data: Partial<QuizUpdate>): Promise<Quiz> {
  const { id: _, ...updateData } = data;
  const { data: quiz, error } = await supabase
    .from('quizzes')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return quiz;
}

export async function deletarQuiz(quizId: string): Promise<void> {
  const { error } = await supabase
    .from('quizzes')
    .delete()
    .eq('id', quizId);

  if (error) throw error;
}

// ════════════════════════════════════════════════════════════
// QUESTÕES
// ════════════════════════════════════════════════════════════

export async function criarQuestao(quizId: string, data: QuestaoCreate): Promise<Questao> {
  const { opcoes, ...questaoData } = data;

  const { data: questao, error } = await supabase
    .from('quiz_questoes')
    .insert([{ quiz_id: quizId, ...questaoData }])
    .select()
    .single();

  if (error) throw error;

  // Inserir opções se fornecidas
  if (opcoes && opcoes.length > 0) {
    const opcoesData = opcoes.map(op => ({
      questao_id: questao.id,
      ...op
    }));

    const { error: opcoesError } = await supabase
      .from('quiz_opcoes')
      .insert(opcoesData);

    if (opcoesError) throw opcoesError;
  }

  return questao;
}

export async function obterQuestao(questaoId: string): Promise<QuestaoComOpcoes> {
  const { data, error } = await supabase
    .from('quiz_questoes')
    .select(`
      *,
      quiz_opcoes (
        id,
        questao_id,
        empresa_id,
        texto,
        correta,
        ordem,
        grupo,
        criado_em
      )
    `)
    .eq('id', questaoId)
    .single();

  if (error) throw error;

  return {
    ...data,
    opcoes: data.quiz_opcoes || []
  };
}

export async function atualizarQuestao(questaoId: string, data: Partial<QuestaoCreate>): Promise<Questao> {
  const { opcoes, ...questaoData } = data;

  const { data: questao, error } = await supabase
    .from('quiz_questoes')
    .update(questaoData)
    .eq('id', questaoId)
    .select()
    .single();

  if (error) throw error;

  return questao;
}

export async function deletarQuestao(questaoId: string): Promise<void> {
  const { error } = await supabase
    .from('quiz_questoes')
    .delete()
    .eq('id', questaoId);

  if (error) throw error;
}

export async function reordenarQuestoes(questoes: Array<{ id: string; ordem: number }>): Promise<void> {
  for (const questao of questoes) {
    const { error } = await supabase
      .from('quiz_questoes')
      .update({ ordem: questao.ordem })
      .eq('id', questao.id);

    if (error) throw error;
  }
}

// ════════════════════════════════════════════════════════════
// OPÇÕES
// ════════════════════════════════════════════════════════════

export async function criarOpcao(questaoId: string, data: OpcaoCreate): Promise<Opcao> {
  const { data: opcao, error } = await supabase
    .from('quiz_opcoes')
    .insert([{ questao_id: questaoId, ...data }])
    .select()
    .single();

  if (error) throw error;
  return opcao;
}

export async function atualizarOpcao(opcaoId: string, data: Partial<OpcaoCreate>): Promise<Opcao> {
  const { data: opcao, error } = await supabase
    .from('quiz_opcoes')
    .update(data)
    .eq('id', opcaoId)
    .select()
    .single();

  if (error) throw error;
  return opcao;
}

export async function deletarOpcao(opcaoId: string): Promise<void> {
  const { error } = await supabase
    .from('quiz_opcoes')
    .delete()
    .eq('id', opcaoId);

  if (error) throw error;
}

// ════════════════════════════════════════════════════════════
// TENTATIVAS
// ════════════════════════════════════════════════════════════

export async function iniciarTentativa(quizId: string): Promise<Tentativa> {
  const { data: tentativa, error } = await supabase
    .from('quiz_tentativas')
    .insert([{ quiz_id: quizId }])
    .select()
    .single();

  if (error) throw error;
  return tentativa;
}

export async function obterTentativa(tentativaId: string): Promise<Tentativa> {
  const { data, error } = await supabase
    .from('quiz_tentativas')
    .select()
    .eq('id', tentativaId)
    .single();

  if (error) throw error;
  return data;
}

export async function obterTentativasDoUsuario(quizId: string): Promise<Tentativa[]> {
  const { data, error } = await supabase
    .from('quiz_tentativas')
    .select()
    .eq('quiz_id', quizId)
    .order('criado_em', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function finalizarTentativa(
  tentativaId: string,
  pontuacao_obtida: number,
  pontuacao_total: number,
  quiz: Quiz
): Promise<Tentativa> {
  const aprovado = (pontuacao_obtida / pontuacao_total) * 100 >= quiz.nota_minima_aprovacao;

  const { data: tentativa, error } = await supabase
    .from('quiz_tentativas')
    .update({
      finalizada_em: new Date().toISOString(),
      pontuacao_obtida,
      pontuacao_total,
      aprovado
    })
    .eq('id', tentativaId)
    .select()
    .single();

  if (error) throw error;
  return tentativa;
}

// ════════════════════════════════════════════════════════════
// RESPOSTAS
// ════════════════════════════════════════════════════════════

export async function criarResposta(tentativaId: string, questaoId: string, data: RespostaCreate): Promise<Resposta> {
  const { data: resposta, error } = await supabase
    .from('quiz_respostas')
    .insert([{
      tentativa_id: tentativaId,
      questao_id: questaoId,
      ...data
    }])
    .select()
    .single();

  if (error) throw error;
  return resposta;
}

export async function atualizarResposta(respostaId: string, data: Partial<RespostaCreate>): Promise<Resposta> {
  const { data: resposta, error } = await supabase
    .from('quiz_respostas')
    .update(data)
    .eq('id', respostaId)
    .select()
    .single();

  if (error) throw error;
  return resposta;
}

export async function obterRespostasDoTentativa(tentativaId: string): Promise<Resposta[]> {
  const { data, error } = await supabase
    .from('quiz_respostas')
    .select()
    .eq('tentativa_id', tentativaId)
    .order('criado_em', { ascending: true });

  if (error) throw error;
  return data || [];
}

// ════════════════════════════════════════════════════════════
// RESULTADO
// ════════════════════════════════════════════════════════════

export async function obterResultadoQuiz(tentativaId: string): Promise<ResultadoQuiz> {
  const tentativa = await obterTentativa(tentativaId);
  const quiz = await obterQuiz(tentativa.quiz_id);
  const { questoes } = await obterQuizComQuestoes(quiz.id);
  const respostas = await obterRespostasDoTentativa(tentativaId);

  const pontuacao_total = questoes.reduce((sum, q) => sum + q.pontuacao, 0);
  const pontuacao = respostas.reduce((sum, r) => {
    if (r.correta === true) {
      const questao = questoes.find(q => q.id === r.questao_id);
      return sum + (questao?.pontuacao || 0);
    }
    return sum;
  }, 0);

  return {
    tentativa,
    questoes,
    respostas,
    pontuacao,
    pontuacao_maxima: pontuacao_total,
    percentual: (pontuacao / pontuacao_total) * 100,
    aprovado: tentativa.aprovado || false
  };
}

// ════════════════════════════════════════════════════════════
// VALIDAÇÃO DE RESPOSTA
// ════════════════════════════════════════════════════════════

export function validarResposta(questao: QuestaoComOpcoes, resposta: RespostaCreate): boolean {
  switch (questao.tipo) {
    case 'multipla_escolha':
    case 'verdadeiro_falso': {
      const opcoesSelecionadas = (resposta.opcoes_selecionadas as string[]) || [];
      const opcaoCorreta = questao.opcoes.find(o => o.correta);
      return opcoesSelecionadas.includes(opcaoCorreta?.id || '');
    }

    case 'arrastar_soltar': {
      const mapeamento = (resposta.opcoes_selecionadas as Record<string, string>) || {};
      // Validar se cada lacuna tem a opção correta
      for (const [lacunaId, opcaoId] of Object.entries(mapeamento)) {
        const opcao = questao.opcoes.find(o => o.id === opcaoId);
        if (!opcao?.correta) return false;
      }
      return true;
    }

    case 'fill_blank': {
      // Similar ao arrastar, validar preenchimento correto
      const preenchimentos = (resposta.opcoes_selecionadas as Record<string, string>) || {};
      for (const [_, opcaoId] of Object.entries(preenchimentos)) {
        const opcao = questao.opcoes.find(o => o.id === opcaoId);
        if (!opcao?.correta) return false;
      }
      return true;
    }

    case 'resposta_aberta':
      // Resposta aberta não pode ser validada automaticamente
      return true; // Precisará de revisão manual

    default:
      return false;
  }
}
