import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QuestaoComponentProps } from '@/types/quiz.types';

export function FillInTheBlank({ questao, resposta, onChange }: QuestaoComponentProps) {
  const preenchimentos = (resposta?.opcoes_selecionadas as Record<string, string>) || {};

  // Extrair lacunas do enunciado
  const lacunasMatch = questao.enunciado.match(/\[___\]/g) || [];
  const lacunas = lacunasMatch.map((_, idx) => ({
    id: `lacuna-${idx}`,
    numero: idx + 1
  }));

  const handleSelectChange = (lacunaId: string, opcaoId: string) => {
    const novoPreenchimento = { ...preenchimentos };
    novoPreenchimento[lacunaId] = opcaoId;

    onChange({
      questao_id: questao.id,
      opcoes_selecionadas: novoPreenchimento
    });
  };

  return (
    <div className="space-y-4">
      {/* Enunciado com dropdowns nas lacunas */}
      <div className="p-4 bg-pana-background rounded-lg border border-gray-200">
        <p className="text-pana-text leading-relaxed flex flex-wrap gap-2 items-center">
          {questao.enunciado.split(/(\[___\])/).map((parte, idx) => {
            if (parte === '[___]') {
              const lacunaIdx = questao.enunciado.substring(0, idx).match(/\[___\]/g)?.length || 0;
              const lacunaId = `lacuna-${lacunaIdx}`;
              const opcaoSelecionada = preenchimentos[lacunaId];

              return (
                <Select key={lacunaId} value={opcaoSelecionada || ''} onValueChange={(value) => handleSelectChange(lacunaId, value)}>
                  <SelectTrigger className="w-[180px] border-pana-teal">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {questao.opcoes
                      .sort((a, b) => a.ordem - b.ordem)
                      .map(opcao => (
                        <SelectItem key={opcao.id} value={opcao.id}>
                          {opcao.texto}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              );
            }
            return <span key={idx}>{parte}</span>;
          })}
        </p>
      </div>

      {/* Lista de opções disponíveis */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-pana-text-secondary">Opções disponíveis:</p>
        <div className="flex flex-wrap gap-2">
          {questao.opcoes
            .sort((a, b) => a.ordem - b.ordem)
            .map(opcao => (
              <span
                key={opcao.id}
                className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm text-pana-text"
              >
                {opcao.texto}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}
