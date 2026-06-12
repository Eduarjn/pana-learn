import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ERALayout } from '@/components/ERALayout';
import { Quiz, TipoQuestao, QuestaoComOpcoes, OpcaoCreate } from '@/types/quiz.types';
import * as quizService from '@/services/quizService';
import { Loader2, Trash2, Plus, GripVertical } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function QuizEditor() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(!quizId);
  const [salvando, setSalvando] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questoes, setQuestoes] = useState<QuestaoComOpcoes[]>([]);

  // Form state
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tempoLimite, setTempoLimite] = useState<number | ''>('');
  const [tentativasPermitidas, setTentativasPermitidas] = useState(1);
  const [notaMinimaAprovacao, setNotaMinimaAprovacao] = useState(70);

  // Questão em edição
  const [questaoEmEdicao, setQuestaoEmEdicao] = useState<QuestaoComOpcoes | null>(null);
  const [tipoQuestao, setTipoQuestao] = useState<TipoQuestao>('multipla_escolha');
  const [enunciado, setEnunciado] = useState('');
  const [pontuacao, setPontuacao] = useState(1);
  const [opcoes, setOpcoes] = useState<OpcaoCreate[]>([]);

  // Carregar quiz se editando
  useEffect(() => {
    if (!quizId) return;

    const carregar = async () => {
      try {
        setLoading(true);
        const { quiz: quizData, questoes: questoesData } = await quizService.obterQuizComQuestoes(quizId);
        setQuiz(quizData);
        setQuestoes(questoesData);
        setTitulo(quizData.titulo);
        setDescricao(quizData.descricao || '');
        setTempoLimite(quizData.tempo_limite || '');
        setTentativasPermitidas(quizData.tentativas_permitidas);
        setNotaMinimaAprovacao(quizData.nota_minima_aprovacao);
      } catch (err) {
        toast({
          title: 'Erro',
          description: 'Erro ao carregar quiz',
          variant: 'destructive'
        });
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, [quizId]);

  const adicionarOpcao = () => {
    setOpcoes([...opcoes, { texto: '', correta: false, ordem: opcoes.length }]);
  };

  const removerOpcao = (idx: number) => {
    setOpcoes(opcoes.filter((_, i) => i !== idx));
  };

  const atualizarOpcao = (idx: number, opcao: OpcaoCreate) => {
    const novas = [...opcoes];
    novas[idx] = opcao;
    setOpcoes(novas);
  };

  const salvarQuestao = async () => {
    if (!titulo || !enunciado) {
      toast({
        title: 'Erro',
        description: 'Preencha os campos obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSalvando(true);

      if (questaoEmEdicao) {
        // Atualizar questão existente
        await quizService.atualizarQuestao(questaoEmEdicao.id, {
          tipo: tipoQuestao,
          enunciado,
          pontuacao,
          opcoes
        });

        toast({
          title: 'Sucesso',
          description: 'Questão atualizada'
        });
      } else {
        // Criar nova questão
        if (!quiz) return;
        await quizService.criarQuestao(quiz.id, {
          tipo: tipoQuestao,
          enunciado,
          pontuacao,
          ordem: questoes.length,
          opcoes
        });

        toast({
          title: 'Sucesso',
          description: 'Questão criada'
        });

        // Recarregar questões
        const { questoes: questoesData } = await quizService.obterQuizComQuestoes(quiz.id);
        setQuestoes(questoesData);
      }

      // Limpar form
      setQuestaoEmEdicao(null);
      setTipoQuestao('multipla_escolha');
      setEnunciado('');
      setPontuacao(1);
      setOpcoes([]);
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar questão',
        variant: 'destructive'
      });
      console.error(err);
    } finally {
      setSalvando(false);
    }
  };

  const deletarQuestao = async (questaoId: string) => {
    if (!confirm('Deseja deletar esta questão?')) return;

    try {
      setSalvando(true);
      await quizService.deletarQuestao(questaoId);
      setQuestoes(questoes.filter(q => q.id !== questaoId));
      toast({
        title: 'Sucesso',
        description: 'Questão deletada'
      });
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Erro ao deletar questão',
        variant: 'destructive'
      });
    } finally {
      setSalvando(false);
    }
  };

  const salvarQuiz = async () => {
    if (!titulo || !questoes.length) {
      toast({
        title: 'Erro',
        description: 'Quiz deve ter um título e pelo menos uma questão',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSalvando(true);

      if (quiz) {
        // Atualizar
        await quizService.atualizarQuiz(quiz.id, {
          id: quiz.id,
          titulo,
          descricao,
          tempo_limite: tempoLimite ? Number(tempoLimite) : undefined,
          tentativas_permitidas: tentativasPermitidas,
          nota_minima_aprovacao: notaMinimaAprovacao
        });

        toast({
          title: 'Sucesso',
          description: 'Quiz atualizado'
        });
      } else {
        // Criar novo
        const novoQuiz = await quizService.criarQuiz({
          titulo,
          descricao,
          tempo_limite: tempoLimite ? Number(tempoLimite) : undefined,
          tentativas_permitidas: tentativasPermitidas,
          nota_minima_aprovacao: notaMinimaAprovacao
        });

        setQuiz(novoQuiz);

        toast({
          title: 'Sucesso',
          description: 'Quiz criado'
        });
      }
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar quiz',
        variant: 'destructive'
      });
      console.error(err);
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <ERALayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-pana-teal" />
        </div>
      </ERALayout>
    );
  }

  return (
    <ERALayout breadcrumbs={['Admin', 'Editor de Quiz']}>
      <div className="space-y-6">
        {/* Configurações do Quiz */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg text-pana-indigo">Configurações do quiz</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-pana-text font-medium">Título *</Label>
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Digite o título do quiz"
                className="mt-1 border-gray-300"
              />
            </div>

            <div>
              <Label className="text-pana-text font-medium">Descrição</Label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Digite a descrição do quiz"
                className="w-full p-3 border border-gray-300 rounded-lg mt-1 focus:ring-2 focus:ring-pana-grape/50"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-pana-text font-medium">Tempo limite (minutos)</Label>
                <Input
                  type="number"
                  value={tempoLimite}
                  onChange={(e) => setTempoLimite(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Deixe em branco para ilimitado"
                  className="mt-1 border-gray-300"
                  min={1}
                />
              </div>

              <div>
                <Label className="text-pana-text font-medium">Nota mínima aprovação (%)</Label>
                <Input
                  type="number"
                  value={notaMinimaAprovacao}
                  onChange={(e) => setNotaMinimaAprovacao(Number(e.target.value))}
                  className="mt-1 border-gray-300"
                  min={0}
                  max={100}
                />
              </div>

              <div>
                <Label className="text-pana-text font-medium">Tentativas permitidas</Label>
                <Input
                  type="number"
                  value={tentativasPermitidas}
                  onChange={(e) => setTentativasPermitidas(Number(e.target.value))}
                  className="mt-1 border-gray-300"
                  min={1}
                />
              </div>
            </div>

            <Button
              onClick={salvarQuiz}
              disabled={salvando || !titulo}
              className="bg-pana-teal hover:bg-pana-teal/90 text-white w-full"
            >
              {salvando ? 'Salvando...' : 'Salvar configuraçõesdo quiz'}
            </Button>
          </CardContent>
        </Card>

        {/* Editor de Questões */}
        {quiz && (
          <>
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg text-pana-indigo">
                  {questaoEmEdicao ? 'Editar questão' : 'Adicionar nova questão'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-pana-text font-medium">Tipo de questão *</Label>
                  <Select value={tipoQuestao} onValueChange={(value) => setTipoQuestao(value as TipoQuestao)}>
                    <SelectTrigger className="mt-1 border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multipla_escolha">Múltipla escolha</SelectItem>
                      <SelectItem value="verdadeiro_falso">Verdadeiro/Falso</SelectItem>
                      <SelectItem value="resposta_aberta">Resposta aberta</SelectItem>
                      <SelectItem value="arrastar_soltar">Arrastar e soltar</SelectItem>
                      <SelectItem value="fill_blank">Preencher lacunas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-pana-text font-medium">Enunciado *</Label>
                  <textarea
                    value={enunciado}
                    onChange={(e) => setEnunciado(e.target.value)}
                    placeholder="Digite a pergunta. Use [___] para marcar lacunas em 'Arrastar/Preencher'"
                    className="w-full p-3 border border-gray-300 rounded-lg mt-1 focus:ring-2 focus:ring-pana-grape/50"
                    rows={3}
                  />
                </div>

                <div>
                  <Label className="text-pana-text font-medium">Pontuação</Label>
                  <Input
                    type="number"
                    value={pontuacao}
                    onChange={(e) => setPontuacao(Number(e.target.value))}
                    className="mt-1 border-gray-300"
                    min={1}
                  />
                </div>

                {/* Opções (para tipos que usam) */}
                {['multipla_escolha', 'verdadeiro_falso', 'arrastar_soltar', 'fill_blank'].includes(tipoQuestao) && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-pana-text font-medium">Opções *</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={adicionarOpcao}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar opção
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {opcoes.map((opcao, idx) => (
                        <div key={idx} className="flex items-end gap-2 p-3 bg-pana-background rounded-lg border border-gray-200">
                          <div className="flex-1 space-y-1">
                            <Input
                              value={opcao.texto}
                              onChange={(e) => atualizarOpcao(idx, { ...opcao, texto: e.target.value })}
                              placeholder="Texto da opção"
                              className="text-sm"
                            />
                          </div>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={opcao.correta || false}
                              onChange={(e) => atualizarOpcao(idx, { ...opcao, correta: e.target.checked })}
                              className="w-4 h-4 accent-pana-teal"
                            />
                            <span className="text-sm text-pana-text">Correta</span>
                          </label>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removerOpcao(idx)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={salvarQuestao}
                    disabled={salvando || !enunciado}
                    className="flex-1 bg-pana-teal hover:bg-pana-teal/90 text-white"
                  >
                    {salvando ? 'Salvando...' : 'Salvar questão'}
                  </Button>
                  {questaoEmEdicao && (
                    <Button
                      onClick={() => {
                        setQuestaoEmEdicao(null);
                        setEnunciado('');
                        setOpcoes([]);
                      }}
                      variant="outline"
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lista de Questões */}
            {questoes.length > 0 && (
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg text-pana-indigo">
                    Questões ({questoes.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {questoes.map((questao, idx) => (
                      <div
                        key={questao.id}
                        className="p-3 bg-pana-background rounded-lg border border-gray-200 flex items-start justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-pana-indigo text-sm">
                            {idx + 1}. {questao.enunciado.substring(0, 60)}...
                          </p>
                          <p className="text-xs text-pana-text-secondary mt-1">
                            Tipo: {questao.tipo.replace(/_/g, ' ')} | Pontuação: {questao.pontuacao}
                          </p>
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setQuestaoEmEdicao(questao);
                              setTipoQuestao(questao.tipo);
                              setEnunciado(questao.enunciado);
                              setPontuacao(questao.pontuacao);
                              setOpcoes(questao.opcoes);
                              window.scrollTo(0, 0);
                            }}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deletarQuestao(questao.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </ERALayout>
  );
}
