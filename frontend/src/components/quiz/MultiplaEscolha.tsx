import React from 'react';
import { QuestaoComponentProps } from '@/types/quiz.types';

export function MultiplaEscolha({ questao, resposta, onChange }: QuestaoComponentProps) {
  const selecionadas = (resposta?.opcoes_selecionadas as string[]) || [];

  const handleChange = (opcaoId: string, checked: boolean) => {
    let novasSelecionadas = [...selecionadas];
    if (checked) {
      novasSelecionadas.push(opcaoId);
    } else {
      novasSelecionadas = novasSelecionadas.filter(id => id !== opcaoId);
    }
    onChange({
      questao_id: questao.id,
      opcoes_selecionadas: novasSelecionadas
    });
  };

  return (
    <div className="space-y-3">
      {questao.opcoes
        .sort((a, b) => a.ordem - b.ordem)
        .map(opcao => (
          <label key={opcao.id} className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-pana-background transition">
            <input
              type="checkbox"
              checked={selecionadas.includes(opcao.id)}
              onChange={(e) => handleChange(opcao.id, e.target.checked)}
              className="mt-1 w-4 h-4 rounded cursor-pointer accent-pana-teal"
            />
            <span className="text-pana-text">{opcao.texto}</span>
          </label>
        ))}
    </div>
  );
}
