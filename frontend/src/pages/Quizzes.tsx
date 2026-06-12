import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ERALayout } from '@/components/ERALayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Quiz, Tentativa } from '@/types/quiz.types';
import * as quizService from '@/services/quizService';
import { Loader2, BookOpen, Plus, Clock, Target, RotateCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function Quizzes() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [tentativas, setTentativas] = useState<Map<string, Tentativa[]>>(new Map());
  const isAdmin = userProfile?.tipo_usuario === 'admin' || userProfile?.tipo_usuario === 'admin_master';

  // Carregar quizzes disponíveis
  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);

        // Buscar quizzes da empresa (via RLS)
        // Nota: você precisa criar uma função Supabase que retorna quizzes
        // ou usar supabase.from('quizzes').select() diretamente
        const { data, error } = await (window as any).supabase
          .from('quizzes')
          .select('*')
          .order('criado_em', { ascending: false });

        if (error) throw error;

        setQuizzes(data || []);

        // Para cada quiz, carregar tentativas do usuário
        if (!isAdmin) {
          for (const quiz of data || []) {
            const tents = await quizService.obterTentativasDoUsuario(quiz.id);
            setTentativas(prev => new Map(prev).set(quiz.id, tents));
          }
        }
      } catch (err) {
        console.error('Erro ao carregar quizzes:', err);
        toast({
          title: 'Erro',
          description: 'Erro ao carregar quizzes',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, [isAdmin]);

  const obterStatusQuiz = (quizId: string) => {
    const tents = tentativas.get(quizId) || [];
    if (tents.length === 0) return { status: 'nao_iniciado', label: 'Não iniciado' };

    const ultimaTentativa = tents[0];
    if (ultimaTentativa.aprovado) {
      return { status: 'aprovado', label: 'Aprovado', pontuacao: ultimaTentativa.pontuacao_obtida };
    }

    const quiz = quizzes.find(q => q.id === quizId);
    if (tents.length >= (quiz?.tentativas_permitidas || 1)) {
      return { status: 'limite_atingido', label: 'Tentativas esgotadas' };
    }

    return { status: 'reprovado', label: 'Reprovado' };
  };

  const podeIniciar = (quizId: string) => {
    const tents = tentativas.get(quizId) || [];
    const quiz = quizzes.find(q => q.id === quizId);

    // Se não tem tentativa, pode iniciar
    if (tents.length === 0) return true;

    // Se tem tentativa e foi aprovado, pode revisar
    if (tents[0].aprovado) return true;

    // Se tem tentativas restantes
    return tents.length < (quiz?.tentativas_permitidas || 1);
  };

  if (loading) {
    return (
      <ERALayout breadcrumbs={['Treinamentos', 'Quizzes']}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-pana-teal" />
        </div>
      </ERALayout>
    );
  }

  return (
    <ERALayout breadcrumbs={['Treinamentos', 'Quizzes']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="page-hero rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-heading font-bold text-pana-bone mb-1">Quizzes</h1>
              <p className="text-pana-bone/80">Teste seus conhecimentos com nossos quizzes</p>
            </div>
            {isAdmin && (
              <Button
                onClick={() => navigate('/admin/quiz-editor')}
                className="bg-pana-teal hover:bg-pana-teal/90 text-white gap-2"
              >
                <Plus className="h-4 w-4" />
                Criar quiz
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="todos" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-pana-background">
            <TabsTrigger value="todos">Todos ({quizzes.length})</TabsTrigger>
            {!isAdmin && (
              <>
                <TabsTrigger value="pendentes">
                  Pendentes ({quizzes.filter(q => !obterStatusQuiz(q.id).label.includes('Aprovado')).length})
                </TabsTrigger>
                <TabsTrigger value="aprovados">
                  Aprovados ({quizzes.filter(q => obterStatusQuiz(q.id).status === 'aprovado').length})
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Tab: Todos */}
          <TabsContent value="todos" className="space-y-4">
            {quizzes.length === 0 ? (
              <Card className="bg-white border-gray-200">
                <CardContent className="p-12 text-center">
                  <BookOpen className="h-12 w-12 text-pana-text-secondary mx-auto mb-3 opacity-50" />
                  <p className="text-pana-text-secondary font-medium">Nenhum quiz disponível no momento</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quizzes.map(quiz => {
                  const status = obterStatusQuiz(quiz.id);
                  const tents = tentativas.get(quiz.id) || [];
                  const ultimaTentativa = tents[0];

                  return (
                    <Card key={quiz.id} className="bg-white border-gray-200 hover:shadow-lg transition">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base text-pana-indigo line-clamp-2">
                            {quiz.titulo}
                          </CardTitle>
                          <Badge
                            className={`flex-shrink-0 ${
                              status.status === 'aprovado'
                                ? 'bg-green-100 text-green-700'
                                : status.status === 'reprovado'
                                ? 'bg-amber-100 text-amber-700'
                                : status.status === 'limite_atingido'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {status.label}
                          </Badge>
                        </div>
                        {quiz.descricao && (
                          <p className="text-sm text-pana-text-secondary line-clamp-2 mt-1">
                            {quiz.descricao}
                          </p>
                        )}
                      </CardHeader>

                      <CardContent className="space-y-3">
                        {/* Informações */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1 text-pana-text">
                            <Target className="h-3 w-3 text-pana-teal" />
                            <span>Nota min: {quiz.nota_minima_aprovacao}%</span>
                          </div>
                          {quiz.tempo_limite && (
                            <div className="flex items-center gap-1 text-pana-text">
                              <Clock className="h-3 w-3 text-pana-teal" />
                              <span>{quiz.tempo_limite} min</span>
                            </div>
                          )}
                          {tents.length > 0 && (
                            <div className="flex items-center gap-1 text-pana-text">
                              <RotateCw className="h-3 w-3 text-pana-teal" />
                              <span>
                                {tents.length}/{quiz.tentativas_permitidas} tentativas
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Última tentativa */}
                        {ultimaTentativa && (
                          <div className="p-2 bg-pana-background rounded-lg border border-gray-200">
                            <p className="text-xs text-pana-text-secondary font-medium">Última tentativa:</p>
                            <p className="text-sm font-bold text-pana-indigo">
                              {ultimaTentativa.pontuacao_obtida?.toFixed(1)} / {ultimaTentativa.pontuacao_total}
                              {' '}
                              ({((ultimaTentativa.pontuacao_obtida || 0) / (ultimaTentativa.pontuacao_total || 1) * 100).toFixed(0)}%)
                            </p>
                          </div>
                        )}

                        {/* Botões */}
                        <div className="flex gap-2 pt-2">
                          {isAdmin ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/admin/quiz-editor/${quiz.id}`)}
                                className="flex-1"
                              >
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => navigate(`/quiz/${quiz.id}`)}
                                className="flex-1 bg-pana-teal hover:bg-pana-teal/90 text-white"
                              >
                                Visualizar
                              </Button>
                            </>
                          ) : podeIniciar(quiz.id) ? (
                            <Button
                              size="sm"
                              onClick={() => navigate(`/quiz/${quiz.id}`)}
                              className="w-full bg-pana-teal hover:bg-pana-teal/90 text-white"
                            >
                              {status.status === 'aprovado' ? 'Revisar' : 'Começar'}
                            </Button>
                          ) : (
                            <Button size="sm" disabled className="w-full opacity-50">
                              Indisponível
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Tab: Pendentes */}
          {!isAdmin && (
            <TabsContent value="pendentes" className="space-y-4">
              {quizzes.filter(q => !obterStatusQuiz(q.id).label.includes('Aprovado')).length === 0 ? (
                <Card className="bg-white border-gray-200">
                  <CardContent className="p-12 text-center">
                    <p className="text-pana-text-secondary">Nenhum quiz pendente!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {quizzes
                    .filter(q => !obterStatusQuiz(q.id).label.includes('Aprovado'))
                    .map(quiz => (
                      <Card key={quiz.id} className="bg-white border-gray-200 hover:shadow-lg transition">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base text-pana-indigo">{quiz.titulo}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Button
                            size="sm"
                            onClick={() => navigate(`/quiz/${quiz.id}`)}
                            className="w-full bg-pana-teal hover:bg-pana-teal/90 text-white"
                          >
                            Começar
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </TabsContent>
          )}

          {/* Tab: Aprovados */}
          {!isAdmin && (
            <TabsContent value="aprovados" className="space-y-4">
              {quizzes.filter(q => obterStatusQuiz(q.id).status === 'aprovado').length === 0 ? (
                <Card className="bg-white border-gray-200">
                  <CardContent className="p-12 text-center">
                    <p className="text-pana-text-secondary">Nenhum quiz aprovado ainda</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {quizzes
                    .filter(q => obterStatusQuiz(q.id).status === 'aprovado')
                    .map(quiz => {
                      const tents = tentativas.get(quiz.id) || [];
                      const ultimaTentativa = tents[0];

                      return (
                        <Card key={quiz.id} className="bg-green-50 border-green-200 hover:shadow-lg transition">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base text-green-700">{quiz.titulo}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="p-2 bg-white rounded-lg">
                              <p className="text-sm font-bold text-pana-teal">
                                ✓ {ultimaTentativa?.pontuacao_obtida?.toFixed(1)} / {ultimaTentativa?.pontuacao_total}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/quiz/${quiz.id}`)}
                              className="w-full"
                            >
                              Revisar
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </ERALayout>
  );
}
