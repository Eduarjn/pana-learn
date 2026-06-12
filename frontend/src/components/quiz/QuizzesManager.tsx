import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Quiz } from '@/types/quiz.types';
import * as quizService from '@/services/quizService';
import { Loader2, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface QuizzesManagerProps {
  cursoId: string;
  onQuizAdded?: () => void;
}

export function QuizzesManager({ cursoId, onQuizAdded }: QuizzesManagerProps) {
  const [loading, setLoading] = useState(true);
  const [quizzesDisponiveis, setQuizzesDisponiveis] = useState<Quiz[]>([]);
  const [quizzesVinculados, setQuizzesVinculados] = useState<Quiz[]>([]);
  const [quizSelecionado, setQuizSelecionado] = useState<string>('');
  const [salvando, setSalvando] = useState(false);
  const { toast } = useToast();

  // Carregar quizzes disponíveis (do banco)
  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);

        // Buscar todos os quizzes disponíveis
        const { data, error } = await (window as any).supabase
          .from('quizzes')
          .select('*')
          .order('titulo', { ascending: true });

        if (error) throw error;

        setQuizzesDisponiveis(data || []);

        // Carregar quizzes vinculados a este curso
        // Nota: você precisa de uma tabela de junção ou coluna no modulos
        const { data: modulosData, error: modulosError } = await (window as any).supabase
          .from('modulos')
          .select('quiz_id, quizzes(*)')
          .eq('curso_id', cursoId)
          .eq('tipo', 'quiz');

        if (modulosError) throw modulosError;

        const quizzesVincs = (modulosData || [])
          .filter(m => m.quizzes)
          .map(m => m.quizzes);

        setQuizzesVinculados(quizzesVincs);
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
  }, [cursoId]);

  const vincularQuiz = async () => {
    if (!quizSelecionado) {
      toast({
        title: 'Erro',
        description: 'Selecione um quiz',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSalvando(true);

      // Criar módulo tipo 'quiz'
      const { error } = await (window as any).supabase
        .from('modulos')
        .insert([
          {
            curso_id: cursoId,
            tipo: 'quiz',
            quiz_id: quizSelecionado,
            titulo: quizzesDisponiveis.find(q => q.id === quizSelecionado)?.titulo || 'Quiz',
            ordem: (quizzesVinculados.length || 0) + 1
          }
        ]);

      if (error) throw error;

      // Recarregar quizzes vinculados
      const quizAdicionado = quizzesDisponiveis.find(q => q.id === quizSelecionado);
      if (quizAdicionado) {
        setQuizzesVinculados([...quizzesVinculados, quizAdicionado]);
      }

      setQuizSelecionado('');

      toast({
        title: 'Sucesso',
        description: 'Quiz adicionado ao curso'
      });

      if (onQuizAdded) onQuizAdded();
    } catch (err) {
      console.error('Erro ao vincular quiz:', err);
      toast({
        title: 'Erro',
        description: 'Erro ao adicionar quiz',
        variant: 'destructive'
      });
    } finally {
      setSalvando(false);
    }
  };

  const removerQuiz = async (quizId: string) => {
    if (!confirm('Deseja remover este quiz?')) return;

    try {
      setSalvando(true);

      // Deletar o módulo
      const { error } = await (window as any).supabase
        .from('modulos')
        .delete()
        .eq('curso_id', cursoId)
        .eq('quiz_id', quizId)
        .eq('tipo', 'quiz');

      if (error) throw error;

      setQuizzesVinculados(quizzesVinculados.filter(q => q.id !== quizId));

      toast({
        title: 'Sucesso',
        description: 'Quiz removido'
      });

      if (onQuizAdded) onQuizAdded();
    } catch (err) {
      console.error('Erro ao remover quiz:', err);
      toast({
        title: 'Erro',
        description: 'Erro ao remover quiz',
        variant: 'destructive'
      });
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="p-6 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-pana-teal" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg text-pana-indigo">Quizzes do Curso</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Adicionar novo quiz */}
        <div className="space-y-3 p-4 bg-pana-background rounded-lg border border-gray-200">
          <label className="block">
            <span className="text-sm font-medium text-pana-text">Adicionar Quiz</span>
            <Select value={quizSelecionado} onValueChange={setQuizSelecionado}>
              <SelectTrigger className="mt-1 border-gray-300">
                <SelectValue placeholder="Selecione um quiz..." />
              </SelectTrigger>
              <SelectContent>
                {quizzesDisponiveis
                  .filter(q => !quizzesVinculados.find(qv => qv.id === q.id))
                  .map(quiz => (
                    <SelectItem key={quiz.id} value={quiz.id}>
                      {quiz.titulo}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </label>

          <Button
            onClick={vincularQuiz}
            disabled={!quizSelecionado || salvando}
            className="w-full bg-pana-teal hover:bg-pana-teal/90 text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            {salvando ? 'Adicionando...' : 'Adicionar Quiz'}
          </Button>
        </div>

        {/* Lista de quizzes vinculados */}
        {quizzesVinculados.length === 0 ? (
          <div className="text-center py-6 text-pana-text-secondary">
            <p className="text-sm">Nenhum quiz adicionado ainda</p>
          </div>
        ) : (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-pana-text">Quizzes Adicionados:</h3>
            {quizzesVinculados.map(quiz => (
              <div
                key={quiz.id}
                className="flex items-start justify-between gap-3 p-3 bg-pana-background rounded-lg border border-gray-200"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-pana-indigo text-sm">{quiz.titulo}</p>
                  <p className="text-xs text-pana-text-secondary mt-1">
                    Nota mín: {quiz.nota_minima_aprovacao}% |
                    Tentativas: {quiz.tentativas_permitidas}
                    {quiz.tempo_limite && ` | Tempo: ${quiz.tempo_limite} min`}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removerQuiz(quiz.id)}
                  disabled={salvando}
                  className="text-red-600 hover:text-red-700 flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {quizzesDisponiveis.length === 0 && (
          <div className="text-center py-4 text-pana-text-secondary text-sm">
            <p>Nenhum quiz disponível. Crie um em /admin/quiz-editor</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
