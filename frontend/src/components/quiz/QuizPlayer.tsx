import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MultiplaEscolha } from './MultiplaEscolha';
import { VerdadeiroFalso } from './VerdadeiroFalso';
import { RespostaAberta } from './RespostaAberta';
import { ArrastarSoltar } from './ArrastarSoltar';
import { FillInTheBlank } from './FillInTheBlank';
import { QuizPlayerProps, RespostaCreate, Tentativa, QuestaoComOpcoes } from '@/types/quiz.types';
import * as quizService from '@/services/quizService';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

export function QuizPlayer({ quizId, onComplete }: QuizPlayerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [questoes, setQuestoes] = useState<QuestaoComOpcoes[]>([]);
  const [tentativa, setTentativa] = useState<Tentativa | null>(null);
  const [questaoIndex, setQuestaoIndex] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, RespostaCreate>>({});
  const [tempoRestante, setTempoRestante] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Carregar quiz e iniciar tentativa
  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        const { quiz: quizData, questoes: questoesData } = await quizService.obterQuizComQuestoes(quizId);
        setQuiz(quizData);
        setQuestoes(questoesData);

        const novaTentativa = await quizService.iniciarTentativa(quizId);
        setTentativa(novaTentativa);

        // Iniciar timer se houver tempo limite
        if (quizData.tempo_limite) {
          setTempoRestante(quizData.tempo_limite * 60); // converter para segundos
        }

        setQuestaoIndex(0);
        setRespostas({});
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar quiz');
        console.error('Erro ao carregar quiz:', err);
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, [quizId]);

  // Timer para tempo limite
  useEffect(() => {
    if (!tempoRestante || tempoRestante <= 0) return;

    const interval = setInterval(() => {
      setTempoRestante(t => {
        if (t && t <= 1) {
          finalizarQuiz();
          return 0;
        }
        return t ? t - 1 : null;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [tempoRestante]);

  const questaoAtual = questoes[questaoIndex];
  const totalQuestoes = questoes.length;
  const percentualProgresso = ((questaoIndex + 1) / totalQuestoes) * 100;

  const handleRespostaChange = (resposta: RespostaCreate) => {
    setRespostas(prev => ({
      ...prev,
      [questaoAtual.id]: resposta
    }));
  };

  const irProxima = () => {
    if (questaoIndex < totalQuestoes - 1) {
      setQuestaoIndex(questaoIndex + 1);
    }
  };

  const irAnterior = () => {
    if (questaoIndex > 0) {
      setQuestaoIndex(questaoIndex - 1);
    }
  };

  const finalizarQuiz = async () => {
    if (!tentativa) return;

    try {
      setEnviando(true);

      // Salvar todas as respostas
      for (const [questaoId, resposta] of Object.entries(respostas)) {
        const questao = questoes.find(q => q.id === questaoId);
        if (questao) {
          const correta = quizService.validarResposta(questao, resposta);
          await quizService.criarResposta(tentativa.id, questaoId, {
            ...resposta,
            correta: questao.tipo === 'resposta_aberta' ? null : correta
          });
        }
      }

      // Calcular pontuação
      let pontuacaoObtida = 0;
      let pontuacaoTotal = 0;

      for (const questao of questoes) {
        pontuacaoTotal += questao.pontuacao;
        const resposta = respostas[questao.id];
        if (resposta) {
          const correta = quizService.validarResposta(questao, resposta);
          if (correta) {
            pontuacaoObtida += questao.pontuacao;
          }
        }
      }

      // Finalizar tentativa
      const tentativaFinalizada = await quizService.finalizarTentativa(
        tentativa.id,
        pontuacaoObtida,
        pontuacaoTotal,
        quiz
      );

      // Obter resultado completo
      const resultado = await quizService.obterResultadoQuiz(tentativa.id);

      if (onComplete) {
        onComplete(resultado);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao finalizar quiz');
      console.error('Erro ao finalizar quiz:', err);
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <p className="text-pana-text">Carregando quiz...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <p className="text-red-700">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!quiz || questoes.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <p className="text-pana-text-secondary">Quiz não encontrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <Card className="page-hero rounded-xl">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-white text-xl mb-1">{quiz.titulo}</CardTitle>
              <p className="text-pana-bone/80 text-sm">{quiz.descricao}</p>
            </div>
            {tempoRestante !== null && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg">
                <Clock className="h-4 w-4 text-pana-bone" />
                <span className="text-pana-bone font-semibold">
                  {Math.floor(tempoRestante / 60)}:{(tempoRestante % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-pana-indigo">
            Questão {questaoIndex + 1} de {totalQuestoes}
          </span>
          <span className="text-sm text-pana-text-secondary">
            {Math.round(percentualProgresso)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-pana-teal h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentualProgresso}%` }}
          />
        </div>
      </div>

      {/* Questão */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg text-pana-indigo">
            {questaoAtual.enunciado}
          </CardTitle>
          <p className="text-xs text-pana-text-secondary mt-2">
            Valor: {questaoAtual.pontuacao} ponto{questaoAtual.pontuacao !== 1 ? 's' : ''}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Renderizar componente da questão baseado no tipo */}
          {questaoAtual.tipo === 'multipla_escolha' && (
            <MultiplaEscolha
              questao={questaoAtual}
              resposta={respostas[questaoAtual.id]}
              onChange={handleRespostaChange}
            />
          )}
          {questaoAtual.tipo === 'verdadeiro_falso' && (
            <VerdadeiroFalso
              questao={questaoAtual}
              resposta={respostas[questaoAtual.id]}
              onChange={handleRespostaChange}
            />
          )}
          {questaoAtual.tipo === 'resposta_aberta' && (
            <RespostaAberta
              questao={questaoAtual}
              resposta={respostas[questaoAtual.id]}
              onChange={handleRespostaChange}
            />
          )}
          {questaoAtual.tipo === 'arrastar_soltar' && (
            <ArrastarSoltar
              questao={questaoAtual}
              resposta={respostas[questaoAtual.id]}
              onChange={handleRespostaChange}
            />
          )}
          {questaoAtual.tipo === 'fill_blank' && (
            <FillInTheBlank
              questao={questaoAtual}
              resposta={respostas[questaoAtual.id]}
              onChange={handleRespostaChange}
            />
          )}
        </CardContent>
      </Card>

      {/* Navegação */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={irAnterior}
          disabled={questaoIndex === 0}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>

        <div className="flex-1"></div>

        {questaoIndex < totalQuestoes - 1 ? (
          <Button
            onClick={irProxima}
            className="bg-pana-teal hover:bg-pana-teal/90 text-white flex items-center gap-2"
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={finalizarQuiz}
            disabled={enviando}
            className="bg-pana-grape hover:bg-pana-grape/90 text-white"
          >
            {enviando ? 'Enviando...' : 'Finalizar Quiz'}
          </Button>
        )}
      </div>
    </div>
  );
}
