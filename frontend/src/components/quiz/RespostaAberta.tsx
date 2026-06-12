import React from 'react';
import { QuestaoComponentProps } from '@/types/quiz.types';

export function RespostaAberta({ questao, resposta, onChange }: QuestaoComponentProps) {
  const textoResposta = resposta?.resposta_texto || '';

  const handleChange = (texto: string) => {
    onChange({
      questao_id: questao.id,
      resposta_texto: texto
    });
  };

  return (
    <div className="space-y-2">
      <textarea
        value={textoResposta}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Digite sua resposta aqui..."
        className="w-full min-h-[150px] p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pana-grape/50 focus:border-pana-grape resize-none text-pana-text"
      />
      <p className="text-xs text-pana-text-secondary">
        Sua resposta será revisada manualmente
      </p>
    </div>
  );
}
