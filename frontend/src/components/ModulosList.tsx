import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Video, CheckCircle2, Play } from 'lucide-react';

interface Modulo {
  id: string;
  tipo: 'video_lesson' | 'quiz';
  titulo: string;
  descricao?: string;
  ordem: number;
  duracao?: number; // para vídeos, em minutos
  videoId?: string;
  quizId?: string;
  watched?: boolean;
  completed?: boolean;
}

interface ModulosListProps {
  cursoId: string;
  onModuloSelect?: (modulo: Modulo) => void;
}

export function ModulosList({ cursoId, onModuloSelect }: ModulosListProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [selectedModuloId, setSelectedModuloId] = useState<string | null>(null);

  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);

        // Buscar módulos (vídeos e quizzes) do curso
        const { data, error } = await (window as any).supabase
          .from('modulos')
          .select(`
            id,
            tipo,
            titulo,
            descricao,
            ordem,
            video_id,
            quiz_id,
            watched,
            videos (
              id,
              titulo,
              duracao
            ),
            quizzes (
              id,
              titulo
            )
          `)
          .eq('curso_id', cursoId)
          .order('ordem', { ascending: true });

        if (error) throw error;

        // Processar dados para o formato esperado
        const modulosProcessados: Modulo[] = (data || []).map((item: any) => {
          if (item.tipo === 'quiz') {
            return {
              id: item.id,
              tipo: 'quiz',
              titulo: item.quizzes?.titulo || item.titulo || 'Quiz',
              descricao: item.descricao,
              ordem: item.ordem,
              quizId: item.quiz_id,
              completed: false
            };
          } else {
            return {
              id: item.id,
              tipo: 'video_lesson',
              titulo: item.videos?.titulo || item.titulo || 'Vídeo',
              descricao: item.descricao,
              ordem: item.ordem,
              duracao: item.videos?.duracao,
              videoId: item.video_id,
              watched: item.watched || false
            };
          }
        });

        setModulos(modulosProcessados);

        // Selecionar primeiro módulo por padrão
        if (modulosProcessados.length > 0 && !selectedModuloId) {
          setSelectedModuloId(modulosProcessados[0].id);
        }
      } catch (err) {
        console.error('Erro ao carregar módulos:', err);
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, [cursoId]);

  const handleSelectModulo = (modulo: Modulo) => {
    setSelectedModuloId(modulo.id);
    if (onModuloSelect) {
      onModuloSelect(modulo);
    }

    // Navegar para quiz se for quiz
    if (modulo.tipo === 'quiz' && modulo.quizId) {
      navigate(`/quiz/${modulo.quizId}`);
    }
  };

  if (loading) {
    return (
      <Card className="bg-pana-indigo/10 border-gray-300 rounded-xl">
        <CardContent className="p-6 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-pana-teal" />
          <p className="text-pana-text-secondary text-sm mt-2">Carregando módulos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-gray-200 rounded-xl">
      <CardHeader>
        <CardTitle className="text-lg text-pana-indigo">Conteúdo do Curso</CardTitle>
      </CardHeader>

      <CardContent>
        {modulos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-pana-text-secondary text-sm">Nenhum módulo disponível</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {modulos.map((modulo) => (
              <li
                key={modulo.id}
                onClick={() => handleSelectModulo(modulo)}
                className={`
                  flex items-start gap-3 cursor-pointer rounded-lg px-3 py-2 transition-all
                  border-2 text-sm
                  ${
                    selectedModuloId === modulo.id
                      ? 'bg-pana-grape/10 border-pana-grape'
                      : 'bg-pana-background border-transparent hover:bg-white'
                  }
                `}
              >
                {/* Ícone */}
                <div className="flex-shrink-0 mt-1">
                  {modulo.tipo === 'quiz' ? (
                    <CheckCircle2 className="h-5 w-5 text-pana-teal" />
                  ) : (
                    <Video className="h-5 w-5 text-pana-grape" />
                  )}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${
                    selectedModuloId === modulo.id
                      ? 'text-pana-indigo'
                      : 'text-pana-text'
                  }`}>
                    {modulo.titulo}
                  </p>
                  {modulo.descricao && (
                    <p className="text-xs text-pana-text-secondary line-clamp-1 mt-0.5">
                      {modulo.descricao}
                    </p>
                  )}
                </div>

                {/* Badge Info */}
                <div className="flex-shrink-0">
                  {modulo.tipo === 'video_lesson' && modulo.duracao ? (
                    <Badge className="bg-gray-100 text-pana-text-secondary font-medium text-xs">
                      {modulo.duracao} min
                    </Badge>
                  ) : modulo.tipo === 'quiz' ? (
                    <Badge className="bg-pana-teal/10 text-pana-teal font-medium text-xs">
                      Quiz
                    </Badge>
                  ) : null}
                </div>

                {/* Status */}
                {modulo.tipo === 'video_lesson' && modulo.watched && (
                  <div className="flex-shrink-0">
                    <span className="text-xs text-green-600 font-semibold">✓</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Estatísticas */}
        {modulos.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center">
                <p className="text-pana-text-secondary">Vídeos</p>
                <p className="font-bold text-pana-indigo">
                  {modulos.filter(m => m.tipo === 'video_lesson').length}
                </p>
              </div>
              <div className="text-center">
                <p className="text-pana-text-secondary">Quizzes</p>
                <p className="font-bold text-pana-teal">
                  {modulos.filter(m => m.tipo === 'quiz').length}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
