import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { QuizPlayer } from '@/components/quiz/QuizPlayer';
import { QuizResultado } from '@/components/quiz/QuizResultado';
import { ERALayout } from '@/components/ERALayout';
import { ResultadoQuiz } from '@/types/quiz.types';

export default function QuizPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const [resultado, setResultado] = useState<ResultadoQuiz | null>(null);

  if (!quizId) {
    return (
      <ERALayout breadcrumbs={['Quizzes']}>
        <div className="text-center p-8">
          <p className="text-red-600">Quiz não encontrado</p>
        </div>
      </ERALayout>
    );
  }

  return (
    <ERALayout breadcrumbs={['Quizzes', resultado ? 'Resultado' : 'Fazer Quiz']}>
      {resultado ? (
        <QuizResultado
          resultado={resultado}
          onReset={() => setResultado(null)}
        />
      ) : (
        <QuizPlayer
          quizId={quizId}
          onComplete={(result) => setResultado(result)}
        />
      )}
    </ERALayout>
  );
}
