import React, { useState } from 'react';
import { QuestaoComponentProps } from '@/types/quiz.types';

export function ArrastarSoltar({ questao, resposta, onChange }: QuestaoComponentProps) {
  const mapeamento = (resposta?.opcoes_selecionadas as Record<string, string>) || {};
  const [dragSource, setDragSource] = useState<{ opcaoId: string; grupo: string | undefined } | null>(null);

  // Agrupar opções por 'grupo'
  const grupos = [...new Set(questao.opcoes.map(o => o.grupo || 'padrão'))];
  const opçoesPorGrupo: Record<string, typeof questao.opcoes> = {};

  grupos.forEach(grupo => {
    opçoesPorGrupo[grupo] = questao.opcoes.filter(o => (o.grupo || 'padrão') === grupo);
  });

  // Extrair lacunas do enunciado (marcadas com [___])
  const lacunasMatch = questao.enunciado.match(/\[___\]/g) || [];
  const lacunas = lacunasMatch.map((_, idx) => ({
    id: `lacuna-${idx}`,
    numero: idx + 1
  }));

  const handleDragStart = (opcaoId: string, grupo: string | undefined) => {
    setDragSource({ opcaoId, grupo });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (lacunaId: string) => {
    if (!dragSource) return;

    const novoMapeamento = { ...mapeamento };
    novoMapeamento[lacunaId] = dragSource.opcaoId;

    onChange({
      questao_id: questao.id,
      opcoes_selecionadas: novoMapeamento
    });

    setDragSource(null);
  };

  const removerMapeamento = (lacunaId: string) => {
    const novoMapeamento = { ...mapeamento };
    delete novoMapeamento[lacunaId];

    onChange({
      questao_id: questao.id,
      opcoes_selecionadas: novoMapeamento
    });
  };

  return (
    <div className="space-y-6">
      {/* Enunciado com lacunas */}
      <div className="p-4 bg-pana-background rounded-lg border border-gray-200">
        <p className="text-pana-text leading-relaxed">
          {questao.enunciado.split(/(\[___\])/).map((parte, idx) => {
            if (parte === '[___]') {
              const lacunaIdx = questao.enunciado.substring(0, idx).match(/\[___\]/g)?.length || 0;
              const lacunaId = `lacuna-${lacunaIdx}`;
              const opcaoSelecionada = mapeamento[lacunaId];
              const opcao = questao.opcoes.find(o => o.id === opcaoSelecionada);

              return (
                <span
                  key={lacunaId}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(lacunaId)}
                  className="inline-block min-w-[150px] mx-1 px-3 py-2 border-2 border-dashed border-pana-teal rounded-lg bg-white transition"
                >
                  {opcao ? (
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-pana-indigo">{opcao.texto}</span>
                      <button
                        onClick={() => removerMapeamento(lacunaId)}
                        className="text-xs text-red-500 hover:text-red-700 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ) : (
                    <span className="text-sm text-pana-text-secondary italic">Arraste aqui</span>
                  )}
                </span>
              );
            }
            return <span key={idx}>{parte}</span>;
          })}
        </p>
      </div>

      {/* Opções para arrastar */}
      <div className="space-y-4">
        <p className="text-sm font-medium text-pana-text">Arraste as opções para completar as lacunas:</p>
        <div className="grid grid-cols-2 gap-3">
          {questao.opcoes.map(opcao => {
            const estaUsada = Object.values(mapeamento).includes(opcao.id);
            return (
              <div
                key={opcao.id}
                draggable
                onDragStart={() => handleDragStart(opcao.id, opcao.grupo)}
                className={`p-3 rounded-lg border-2 border-gray-300 cursor-move transition ${
                  estaUsada
                    ? 'bg-gray-100 opacity-50 cursor-not-allowed'
                    : 'bg-white hover:border-pana-teal hover:shadow-md'
                }`}
                style={estaUsada ? { pointerEvents: 'none' } : {}}
              >
                <p className="text-sm font-medium text-pana-indigo">{opcao.texto}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
