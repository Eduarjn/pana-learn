import React from 'react';
import { QuestaoComponentProps } from '@/types/quiz.types';

export function VerdadeiroFalso({ questao, resposta, onChange }: QuestaoComponentProps) {
  const selecionada = ((resposta?.opcoes_selecionadas as string[]) || [])[0];

  const handleChange = (opcaoId: string) => {
    onChange({
      questao_id: questao.id,
      opcoes_selecionadas: [opcaoId]
    });
  };

  return (
    <div className="space-y-2">
      {questao.opcoes
        .sort((a, b) => a.ordem - b.ordem)
        .map(opcao => (
          <label key={opcao.id} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-pana-background transition">
            <input
              type="radio"
              name={`questao-${questao.id}`}
              checked={selecionada === opcao.id}
              onChange={() => handleChange(opcao.id)}
              className="w-4 h-4 cursor-pointer accent-pana-teal"
            />
            <span className="text-pana-text font-medium">{opcao.texto}</span>
          </label>
        ))}
    </div>
  );
}
