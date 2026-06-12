export type TipoQuestao = 'multipla_escolha' | 'verdadeiro_falso' | 'resposta_aberta' | 'arrastar_soltar' | 'fill_blank';

// ════════════════════════════════════════════════════════════
// Quiz
// ════════════════════════════════════════════════════════════
export interface Quiz {
  id: string;
  empresa_id: string;
  titulo: string;
  descricao?: string;
  tempo_limite?: number; // minutos
  tentativas_permitidas: number;
  nota_minima_aprovacao: number;
  criado_em: string;
  atualizado_em: string;
}

export interface QuizCreate {
  titulo: string;
  descricao?: string;
  tempo_limite?: number;
  tentativas_permitidas?: number;
  nota_minima_aprovacao?: number;
}

export interface QuizUpdate extends Partial<QuizCreate> {
  id: string;
}

// ════════════════════════════════════════════════════════════
// Questão
// ════════════════════════════════════════════════════════════
export interface Questao {
  id: string;
  quiz_id: string;
  empresa_id: string;
  tipo: TipoQuestao;
  enunciado: string;
  ordem: number;
  pontuacao: number;
  criado_em: string;
  atualizado_em: string;
}

export interface QuestaoComOpcoes extends Questao {
  opcoes: Opcao[];
}

export interface QuestaoCreate {
  tipo: TipoQuestao;
  enunciado: string;
  ordem?: number;
  pontuacao?: number;
  opcoes?: OpcaoCreate[];
}

export interface QuestaoUpdate extends Partial<QuestaoCreate> {
  id: string;
}

// ════════════════════════════════════════════════════════════
// Opção de Resposta
// ════════════════════════════════════════════════════════════
export interface Opcao {
  id: string;
  questao_id: string;
  empresa_id: string;
  texto: string;
  correta: boolean;
  ordem: number;
  grupo?: string; // para arrastar_soltar
  criado_em: string;
}

export interface OpcaoCreate {
  texto: string;
  correta?: boolean;
  ordem?: number;
  grupo?: string;
}

// ════════════════════════════════════════════════════════════
// Tentativa
// ════════════════════════════════════════════════════════════
export interface Tentativa {
  id: string;
  quiz_id: string;
  usuario_id: string;
  empresa_id: string;
  iniciada_em: string;
  finalizada_em?: string;
  pontuacao_obtida?: number;
  pontuacao_total?: number;
  aprovado?: boolean;
  criado_em: string;
}

export interface TentativaCreate {
  quiz_id: string;
}

// ════════════════════════════════════════════════════════════
// Resposta do Usuário
// ════════════════════════════════════════════════════════════
export interface Resposta {
  id: string;
  tentativa_id: string;
  questao_id: string;
  empresa_id: string;
  resposta_texto?: string;
  opcoes_selecionadas?: string[] | Record<string, string>; // JSON para multipla/arrastar/fill_blank
  correta?: boolean;
  criado_em: string;
}

export interface RespostaCreate {
  questao_id: string;
  resposta_texto?: string;
  opcoes_selecionadas?: string[] | Record<string, string>;
}

export interface RespostaUpdate extends Partial<RespostaCreate> {
  id: string;
}

// ════════════════════════════════════════════════════════════
// Estado do Quiz Player
// ════════════════════════════════════════════════════════════
export interface RespostasUsuario {
  [questaoId: string]: {
    resposta_texto?: string;
    opcoes_selecionadas?: string[] | Record<string, string>;
  };
}

export interface QuizPlayerState {
  tentativaId: string;
  questaoIndex: number;
  respostas: RespostasUsuario;
  iniciada_em: string;
  tempo_restante?: number; // segundos
}

// ════════════════════════════════════════════════════════════
// Resultado
// ════════════════════════════════════════════════════════════
export interface ResultadoQuiz {
  tentativa: Tentativa;
  questoes: QuestaoComOpcoes[];
  respostas: Resposta[];
  pontuacao: number;
  pontuacao_maxima: number;
  percentual: number;
  aprovado: boolean;
}

// ════════════════════════════════════════════════════════════
// Tipos para componentes (props)
// ════════════════════════════════════════════════════════════

export interface QuizPlayerProps {
  quizId: string;
  modulo_id?: string;
  onComplete?: (resultado: ResultadoQuiz) => void;
}

export interface QuestaoComponentProps {
  questao: QuestaoComOpcoes;
  resposta?: RespostaCreate;
  onChange: (resposta: RespostaCreate) => void;
}

export interface QuizResultadoProps {
  resultado: ResultadoQuiz;
  onReset?: () => void;
}

export interface QuizEditorProps {
  quizId?: string;
  onSave?: (quiz: Quiz) => void;
}
