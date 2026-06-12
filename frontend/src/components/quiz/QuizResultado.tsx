import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QuizResultadoProps, QuestaoComOpcoes } from '@/types/quiz.types';
import { CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

export function QuizResultado({ resultado, onReset }: QuizResultadoProps) {
  const [questoesExpandidas, setQuestoesExpandidas] = useState<Set<string>>(new Set());

  const toggleQuestao = (questaoId: string) => {
    const nova = new Set(questoesExpandidas);
    if (nova.has(questaoId)) {
      nova.delete(questaoId);
    } else {
      nova.add(questaoId);
    }
    setQuestoesExpandidas(nova);
  };

  const renderizarRespostaPorTipo = (questao: QuestaoComOpcoes, resposta: any) => {
    switch (questao.tipo) {
      case 'multipla_escolha': {
        const selecionadas = (resposta.opcoes_selecionadas as string[]) || [];
        return (
          <div className="space-y-2">
            {questao.opcoes.map(opcao => {
              const foiSelecionada = selecionadas.includes(opcao.id);
              const ehCorreta = opcao.correta;
              return (
                <div
                  key={opcao.id}
                  className={`p-2 rounded-lg border-2 ${
                    foiSelecionada && ehCorreta
                      ? 'border-green-500 bg-green-50'
                      : foiSelecionada && !ehCorreta
                      ? 'border-red-500 bg-red-50'
                      : ehCorreta && !foiSelecionada
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {foiSelecionada && ehCorreta && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {foiSelecionada && !ehCorreta && <XCircle className="h-4 w-4 text-red-600" />}
                    {!foiSelecionada && ehCorreta && <CheckCircle className="h-4 w-4 text-green-600" />}
                    <span className="text-sm text-pana-text">{opcao.texto}</span>
                    {foiSelecionada && !ehCorreta && <span className="ml-auto text-xs text-red-600 font-medium">Sua resposta</span>}
                    {!foiSelecionada && ehCorreta && <span className="ml-auto text-xs text-green-600 font-medium">Resposta correta</span>}
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      case 'verdadeiro_falso': {
        const selecionada = ((resposta.opcoes_selecionadas as string[]) || [])[0];
        return (
          <div className="space-y-2">
            {questao.opcoes.map(opcao => {
              const foiSelecionada = selecionada === opcao.id;
              const ehCorreta = opcao.correta;
              return (
                <div
                  key={opcao.id}
                  className={`p-3 rounded-lg border-2 ${
                    foiSelecionada && ehCorreta
                      ? 'border-green-500 bg-green-50'
                      : foiSelecionada && !ehCorreta
                      ? 'border-red-500 bg-red-50'
                      : ehCorreta && !foiSelecionada
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {foiSelecionada && ehCorreta && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {foiSelecionada && !ehCorreta && <XCircle className="h-4 w-4 text-red-600" />}
                    {!foiSelecionada && ehCorreta && <CheckCircle className="h-4 w-4 text-green-600" />}
                    <span className="text-sm font-medium text-pana-indigo">{opcao.texto}</span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      case 'resposta_aberta': {
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium text-pana-text">Sua resposta:</p>
            <div className="p-3 bg-pana-background rounded-lg border border-gray-200">
              <p className="text-sm text-pana-text whitespace-pre-wrap">{resposta.resposta_texto}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-2 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span>Esta questão será revisada manualmente</span>
            </div>
          </div>
        );
      }

      case 'arrastar_soltar':
      case 'fill_blank': {
        const mapeamento = (resposta.opcoes_selecionadas as Record<string, string>) || {};
        return (
          <div className="space-y-2">
            {Object.entries(mapeamento).map(([lacunaId, opcaoId]) => {
              const opcao = questao.opcoes.find(o => o.id === opcaoId);
              return (
                <div key={lacunaId} className="p-2 bg-pana-background rounded-lg border border-gray-200">
                  <p className="text-sm">
                    <span className="font-medium text-pana-indigo">{opcao?.texto}</span>
                    {opcao?.correta && (
                      <span className="ml-2 text-xs text-green-600 font-medium">✓ Correto</span>
                    )}
                    {!opcao?.correta && (
                      <span className="ml-2 text-xs text-red-600 font-medium">✗ Incorreto</span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        );
      }

      default:
        return <p className="text-sm text-pana-text-secondary">N/A</p>;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Resultado Principal */}
      <Card className={`${resultado.aprovado ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {resultado.aprovado ? (
              <CheckCircle className="h-16 w-16 text-green-600" />
            ) : (
              <XCircle className="h-16 w-16 text-red-600" />
            )}
          </div>
          <CardTitle className={`text-2xl ${resultado.aprovado ? 'text-green-700' : 'text-red-700'}`}>
            {resultado.aprovado ? 'Parabéns!' : 'Não aprovado'}
          </CardTitle>
          <p className={`text-sm mt-2 ${resultado.aprovado ? 'text-green-600' : 'text-red-600'}`}>
            {resultado.aprovado
              ? 'Você completou o quiz com sucesso!'
              : 'Você não atingiu a nota mínima de aprovação.'}
          </p>
        </CardHeader>
      </Card>

      {/* Score Card */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg text-pana-indigo">Sua pontuação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-pana-text font-medium">Pontos obtidos:</span>
              <span className="text-2xl font-heading font-bold text-pana-teal">
                {resultado.pontuacao.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-pana-text font-medium">Pontos totais:</span>
              <span className="text-lg text-pana-text-secondary">{resultado.pontuacao_maxima}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-pana-text font-medium">Percentual:</span>
              <Badge className="bg-pana-teal text-white">
                {resultado.percentual.toFixed(1)}%
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-pana-teal h-3 rounded-full transition-all"
                style={{ width: `${Math.min(resultado.percentual, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revisão de Questões */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg text-pana-indigo">Revisão das questões</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {resultado.questoes.map((questao, idx) => {
            const resposta = resultado.respostas.find(r => r.questao_id === questao.id);
            const estaExpandida = questoesExpandidas.has(questao.id);
            const isCorreta = resposta?.correta;

            return (
              <div key={questao.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Header */}
                <button
                  onClick={() => toggleQuestao(questao.id)}
                  className="w-full p-4 bg-gray-50 hover:bg-gray-100 transition flex items-start gap-3 text-left"
                >
                  <div className="mt-1">
                    {isCorreta === true && <CheckCircle className="h-5 w-5 text-green-600" />}
                    {isCorreta === false && <XCircle className="h-5 w-5 text-red-600" />}
                    {isCorreta === null && <AlertCircle className="h-5 w-5 text-amber-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-pana-indigo text-sm break-words">
                      Questão {idx + 1}: {questao.enunciado}
                    </p>
                    <p className="text-xs text-pana-text-secondary mt-1">
                      Tipo: {questao.tipo.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {estaExpandida ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Conteúdo expandido */}
                {estaExpandida && resposta && (
                  <div className="p-4 border-t border-gray-200 bg-white">
                    {renderizarRespostaPorTipo(questao, resposta)}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Botões de ação */}
      {onReset && (
        <div className="flex gap-3">
          <Button
            onClick={onReset}
            className="flex-1 bg-pana-teal hover:bg-pana-teal/90 text-white"
          >
            Fazer novamente
          </Button>
          <Button variant="outline" className="flex-1">
            Voltar
          </Button>
        </div>
      )}
    </div>
  );
}
