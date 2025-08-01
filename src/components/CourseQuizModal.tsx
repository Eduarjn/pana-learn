import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Trophy, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface QuizQuestion {
  id: string;
  pergunta: string;
  opcoes: string[];
  resposta_correta: number;
  explicacao?: string;
  ordem: number;
}

interface Quiz {
  id: string;
  titulo: string;
  descricao?: string;
  nota_minima: number;
  quiz_perguntas: QuizQuestion[];
}

interface CourseQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseName: string;
  onQuizComplete: (nota: number, aprovado: boolean) => void;
}

export const CourseQuizModal: React.FC<CourseQuizModalProps> = ({
  isOpen,
  onClose,
  courseId,
  courseName,
  onQuizComplete
}) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [nota, setNota] = useState(0);
  const [loading, setLoading] = useState(false);
  const [quizLoading, setQuizLoading] = useState(true);

  const currentQuestion = quiz?.quiz_perguntas[currentQuestionIndex];
  const totalQuestions = quiz?.quiz_perguntas.length || 0;
  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  // Carregar quiz do curso
  useEffect(() => {
    if (isOpen && courseId) {
      loadCourseQuiz();
    }
  }, [isOpen, courseId]);

  const loadCourseQuiz = async () => {
    try {
      setQuizLoading(true);
      
      // Buscar quiz pelo curso_id
      const { data: quizData, error } = await supabase
        .from('quizzes')
        .select(`
          id,
          titulo,
          descricao,
          nota_minima,
          quiz_perguntas(
            id,
            pergunta,
            opcoes,
            resposta_correta,
            explicacao,
            ordem
          )
        `)
        .eq('curso_id', courseId)
        .eq('ativo', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (quizData) {
        // Ordenar perguntas por ordem
        const sortedPerguntas = quizData.quiz_perguntas?.sort((a, b) => a.ordem - b.ordem) || [];
        setQuiz({
          ...quizData,
          quiz_perguntas: sortedPerguntas
        });
      } else {
        toast({
          title: "Quiz não encontrado",
          description: "Este curso ainda não possui um quiz configurado.",
          variant: "destructive"
        });
        onClose();
      }
    } catch (error) {
      console.error('Erro ao carregar quiz:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o quiz.",
        variant: "destructive"
      });
      onClose();
    } finally {
      setQuizLoading(false);
    }
  };

  // Resetar estado quando modal abrir
  useEffect(() => {
    if (isOpen) {
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setIsSubmitted(false);
      setNota(0);
    }
  }, [isOpen]);

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const calculateNota = () => {
    if (!quiz) return 0;
    
    let acertos = 0;
    quiz.quiz_perguntas.forEach(question => {
      const selectedAnswer = selectedAnswers[question.id];
      if (selectedAnswer === question.resposta_correta) {
        acertos++;
      }
    });
    
    return Math.round((acertos / totalQuestions) * 100);
  };

  const handleSubmitQuiz = async () => {
    if (!quiz) return;
    
    setLoading(true);
    try {
      const notaCalculada = calculateNota();
      const aprovado = notaCalculada >= quiz.nota_minima;
      
      // Salvar progresso do quiz
      const { error: progressError } = await supabase
        .from('progresso_quiz')
        .insert({
          quiz_id: quiz.id,
          respostas: selectedAnswers,
          nota: notaCalculada,
          aprovado: aprovado,
          data_conclusao: new Date().toISOString()
        });

      if (progressError) {
        throw progressError;
      }

      setNota(notaCalculada);
      setIsSubmitted(true);
      
      // Notificar componente pai
      onQuizComplete(notaCalculada, aprovado);
      
      toast({
        title: aprovado ? "Parabéns!" : "Continue estudando",
        description: aprovado 
          ? `Você foi aprovado com ${notaCalculada}%!` 
          : `Sua nota foi ${notaCalculada}%. Nota mínima: ${quiz.nota_minima}%`,
        variant: aprovado ? "default" : "destructive"
      });
    } catch (error) {
      console.error('Erro ao submeter quiz:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar suas respostas.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const isAnswerCorrect = (questionId: string, answerIndex: number) => {
    if (!isSubmitted) return false;
    const question = quiz?.quiz_perguntas.find(q => q.id === questionId);
    return question?.resposta_correta === answerIndex;
  };

  const isAnswerSelected = (questionId: string, answerIndex: number) => {
    return selectedAnswers[questionId] === answerIndex;
  };

  if (quizLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Carregando Quiz...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!quiz) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Quiz de Conclusão - {courseName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do quiz */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{quiz.titulo}</CardTitle>
              {quiz.descricao && (
                <p className="text-gray-600">{quiz.descricao}</p>
              )}
              <div className="flex items-center gap-4">
                <Badge variant="outline">
                  {totalQuestions} pergunta{totalQuestions !== 1 ? 's' : ''}
                </Badge>
                <Badge variant="outline">
                  Nota mínima: {quiz.nota_minima}%
                </Badge>
                {isSubmitted && (
                  <Badge className={nota >= quiz.nota_minima ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {nota >= quiz.nota_minima ? "Aprovado" : "Reprovado"}
                  </Badge>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Barra de progresso */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progresso do Quiz</span>
              <span>{currentQuestionIndex + 1} de {totalQuestions}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Pergunta atual */}
          {currentQuestion && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Pergunta {currentQuestionIndex + 1}: {currentQuestion.pergunta}
                  </h3>
                  
                  <div className="space-y-3">
                    {currentQuestion.opcoes.map((opcao, index) => (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                        disabled={isSubmitted}
                        className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                          isAnswerSelected(currentQuestion.id, index)
                            ? isSubmitted
                              ? isAnswerCorrect(currentQuestion.id, index)
                                ? 'border-green-500 bg-green-50'
                                : 'border-red-500 bg-red-50'
                              : 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        } ${isSubmitted ? 'cursor-default' : 'cursor-pointer hover:bg-gray-50'}`}
                      >
                        <div className="flex items-center gap-3">
                          {isAnswerSelected(currentQuestion.id, index) && (
                            <div className="flex-shrink-0">
                              {isSubmitted ? (
                                isAnswerCorrect(currentQuestion.id, index) ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-500" />
                                )
                              ) : (
                                <CheckCircle className="h-5 w-5 text-blue-500" />
                              )}
                            </div>
                          )}
                          <span className="flex-1">{opcao}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Explicação (após submeter) */}
                  {isSubmitted && currentQuestion.explicacao && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">Explicação:</h4>
                      <p className="text-blue-700">{currentQuestion.explicacao}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navegação */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              Anterior
            </Button>

            {currentQuestionIndex === totalQuestions - 1 ? (
              <Button
                onClick={handleSubmitQuiz}
                disabled={loading || Object.keys(selectedAnswers).length < totalQuestions}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? "Submetendo..." : "Finalizar Quiz"}
              </Button>
            ) : (
              <Button
                onClick={handleNextQuestion}
                disabled={!selectedAnswers[currentQuestion?.id || '']}
              >
                Próxima
              </Button>
            )}
          </div>

          {/* Resultado final */}
          {isSubmitted && (
            <Card className="border-2 border-blue-200">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-4">
                  {nota >= quiz.nota_minima ? (
                    <Trophy className="h-12 w-12 text-yellow-500" />
                  ) : (
                    <AlertCircle className="h-12 w-12 text-red-500" />
                  )}
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {nota >= quiz.nota_minima ? "Parabéns!" : "Continue estudando"}
                </h3>
                <p className="text-lg mb-4">
                  Sua nota: <span className="font-bold">{nota}%</span>
                </p>
                <p className="text-gray-600">
                  {nota >= quiz.nota_minima 
                    ? "Você foi aprovado no quiz e pode receber seu certificado!"
                    : `Nota mínima necessária: ${quiz.nota_minima}%`
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 