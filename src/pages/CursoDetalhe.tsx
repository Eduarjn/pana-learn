import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourseModules, useCourses } from '@/hooks/useCourses';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Module, Course } from '@/hooks/useCourses';
import type { Database } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, Play, Clock, PlusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { VideoPlayerWithProgress } from '@/components/VideoPlayerWithProgress';
import { VideoChecklist } from '@/components/VideoChecklist';
import { QuizModal } from '@/components/QuizModal';
import { CourseQuizModal } from '@/components/CourseQuizModal';
import { CourseCompletionModal } from '@/components/CourseCompletionModal';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CommentsSection from '@/components/CommentsSection';
import { useQuiz } from '@/hooks/useQuiz';
import { toast } from '@/components/ui/use-toast';

// Adicionar tipo auxiliar para vídeo com modulo_id e categoria
type VideoWithModulo = Database['public']['Tables']['videos']['Row'] & {
  modulo_id?: string;
  categoria?: string;
};

const ModuleEditForm = ({ modulo, onSaved }: { modulo: Module, onSaved: () => void }) => {
  const [link, setLink] = React.useState(modulo.link_video || '');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSave = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase
      .from('modulos')
      .update({ link_video: link })
      .eq('id', modulo.id);
    setLoading(false);
    if (error) {
      setError('Erro ao salvar');
    } else {
      onSaved();
    }
  };

  return (
    <div className="p-2 border rounded mb-2 bg-gray-50">
      <label className="block mb-1 font-semibold">Link do vídeo</label>
      <input
        className="border px-2 py-1 w-full mb-2"
        value={link}
        onChange={e => setLink(e.target.value)}
        placeholder="https://youtu.be/..."
      />
      <button
        className="bg-era-lime text-era-dark-blue px-3 py-1 rounded font-bold"
        onClick={handleSave}
        disabled={loading}
      >
        {loading ? 'Salvando...' : 'Salvar'}
      </button>
      {error && <div className="text-red-500 mt-2">{error}</div>}
    </div>
  );
};

// Helper para pegar o link do vídeo
function getVideoUrl(item: Module | { url_video?: string; link_video?: string }) {
  if ('link_video' in item && item.link_video) return item.link_video;
  if ('url_video' in item && item.url_video) return item.url_video;
  return '';
}

function getModuleTitle(item: Module | { titulo?: string; nome_modulo?: string }) {
  if ('nome_modulo' in item && item.nome_modulo) return item.nome_modulo;
  if ('titulo' in item && item.titulo) return item.titulo;
  return '';
}

const CursoDetalhe = () => {
  const { id } = useParams();
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.tipo_usuario === 'admin';
  const userId = userProfile?.id;
  const navigate = useNavigate();
  const [refresh, setRefresh] = React.useState(0);
  const { data: modules = [], isLoading, error } = useCourseModules(id || '');
  const [videos, setVideos] = React.useState<VideoWithModulo[]>([]);
  const [progress, setProgress] = React.useState<Record<string, Database['public']['Tables']['progresso_usuario']['Row']>>({});
  const [loading, setLoading] = React.useState(false);
  const [selectedVideo, setSelectedVideo] = React.useState<VideoWithModulo | null>(null);
  const [selectedModule, setSelectedModule] = React.useState<Module | null>(null);
  const [editingModuleId, setEditingModuleId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState('');
  const [editDesc, setEditDesc] = React.useState('');
  const [currentCourse, setCurrentCourse] = React.useState<Course | null>(null);
  const [totalVideos, setTotalVideos] = React.useState(0);
  const [completedVideos, setCompletedVideos] = React.useState(0);
  const [showQuizModal, setShowQuizModal] = React.useState(false);
  const [quizCompleted, setQuizCompleted] = React.useState(false);
  const { data: allCourses = [] } = useCourses();
  const currentCourseData = allCourses.find(c => c.id === id);
  const currentCategory = currentCourseData?.categoria;
  
  // Hook para gerenciar quiz e certificado
  const { 
    quizConfig, 
    isCourseCompleted, 
    certificate, 
    generateCertificate 
  } = useQuiz(userId, currentCategory);

  // Calcular progresso do curso
  const calculateCourseProgress = React.useCallback(async () => {
    if (!id || !userId) return;

    try {
      // Buscar todos os vídeos do curso
      const { data: allVideos } = await supabase
        .from('videos')
        .select('id')
        .eq('curso_id', id);

      if (!allVideos) return;

      const total = allVideos.length;
      setTotalVideos(total);

      // Buscar progresso dos vídeos
      const videoIds = allVideos.map(v => v.id);
      const { data: progress } = await supabase
        .from('video_progress')
        .select('video_id, concluido')
        .eq('usuario_id', userId)
        .in('video_id', videoIds);

      if (progress) {
        const completed = progress.filter(p => p.concluido).length;
        setCompletedVideos(completed);
      }
    } catch (error) {
      console.error('Erro ao calcular progresso do curso:', error);
    }
  }, [id, userId]);

  // Carregar progresso inicial
  React.useEffect(() => {
    calculateCourseProgress();
  }, [calculateCourseProgress]);

  const handleCourseComplete = React.useCallback(async () => {
    if (!userId || !id) return;
    
    try {
      // Verificar se todos os vídeos foram concluídos
      const allVideosCompleted = videos.every(video => {
        const videoProgress = progress[video.id];
        return videoProgress?.status === 'concluido';
      });

      if (allVideosCompleted && !quizCompleted) {
        // Mostrar modal de quiz
        setShowQuizModal(true);
      }
    } catch (error) {
      console.error('Erro ao verificar conclusão do curso:', error);
    }
  }, [userId, id, videos, progress, quizCompleted]);

  const handleQuizComplete = React.useCallback((nota: number, aprovado: boolean) => {
    setQuizCompleted(true);
    setShowQuizModal(false);
    
    if (aprovado) {
      toast({
        title: "Parabéns! 🎉",
        description: `Você foi aprovado no quiz com ${nota}%!`,
        variant: "default"
      });
    } else {
      toast({
        title: "Continue estudando",
        description: `Sua nota foi ${nota}%. Tente novamente!`,
        variant: "destructive"
      });
    }
  }, []);

  React.useEffect(() => {
    if (!id || !userId) return;
    const fetchVideosAndProgress = async () => {
      setLoading(true);
      const { data: videosData } = await supabase
        .from('videos')
        .select('*')
        .eq('curso_id', id);
      setVideos(videosData || []);
      console.log('Vídeos carregados:', videosData);
      // Buscar progresso do usuário para cada módulo
      const { data: progressData } = await supabase
        .from('progresso_usuario')
        .select('*')
        .eq('curso_id', id)
        .eq('usuario_id', userId);
      // Indexar por modulo_id
      const progressMap: Record<string, Database['public']['Tables']['progresso_usuario']['Row']> = {};
      (progressData || []).forEach((p) => {
        if (p.modulo_id) progressMap[p.modulo_id] = p;
      });
      setProgress(progressMap);
      setLoading(false);
    };
    fetchVideosAndProgress();
  }, [id, userId, refresh, isAdmin]);

  // Buscar média de conclusão por módulo
  useEffect(() => {
    const fetchProgress = async () => {
      if (!id) return;
      const { data } = await supabase
        .from('progresso_usuario')
        .select('modulo_id, percentual_concluido')
        .eq('curso_id', id);
      const map: Record<string, number[]> = {};
      (data || []).forEach((p: { modulo_id: string | null, percentual_concluido: number | null }) => {
        if (p.modulo_id) {
          if (!map[p.modulo_id]) map[p.modulo_id] = [];
          if (typeof p.percentual_concluido === 'number') map[p.modulo_id].push(p.percentual_concluido);
        }
      });
      const avg: Record<string, number> = {};
      Object.entries(map).forEach(([modId, arr]) => {
        avg[modId] = arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
      });
      // Progresso calculado
    };
    if (isAdmin) fetchProgress();
  }, [id, isAdmin, refresh]);

  // Dentro do map dos módulos, filtrar vídeos pela categoria do curso
  const filteredVideos = videos.filter(v => v.categoria === currentCategory);

  // Verificar se deve mostrar o quiz quando o curso for concluído
  React.useEffect(() => {
    if (isCourseCompleted && !certificate && quizConfig) {
      setShowQuizModal(true);
    }
  }, [isCourseCompleted, certificate, quizConfig]);

  const handleViewCertificate = () => {
    if (certificate) {
      window.open(`/certificado/${certificate.id}`, '_blank');
    }
  };

  // Renderização para CLIENTE
  if (!isAdmin) {

    return (
      <div className="p-4 md:p-8 bg-era-light-gray-2 min-h-screen">
        <div className="mb-4 flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/treinamentos')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
        </div>
        {/* Header do Curso */}
        <div className="mb-8 p-6 rounded-2xl shadow-lg border-l-8 border-era-lime bg-white flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <div className="bg-era-lime rounded-lg p-2">
              <Play className="w-8 h-8 text-era-dark-blue" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-era-dark-blue">{currentCourseData?.nome || 'Detalhes do Curso'}</h1>
              {currentCourseData?.descricao && (
                <p className="text-era-gray text-lg">{currentCourseData.descricao}</p>
              )}
              <div className="flex gap-3 mt-2">
                {currentCourseData?.categoria && <Badge className="bg-era-lime text-black">{currentCourseData.categoria}</Badge>}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Player e Comentários */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {selectedVideo ? (
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-2">
                <h2 className="text-xl font-bold mb-2">{selectedVideo.titulo}</h2>
                <VideoPlayerWithProgress
                  video={selectedVideo}
                  cursoId={id || ''}
                  moduloId={selectedModule?.id}
                  userId={userId}
                  onCourseComplete={handleCourseComplete}
                  totalVideos={totalVideos}
                  completedVideos={completedVideos}
                  className="mb-4"
                />
              </div>
            ) : (
              <Card className="mb-6">
                <CardContent className="p-8 text-center">
                  <Play className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Selecione um vídeo para começar
                  </h3>
                  <p className="text-gray-500">
                    Escolha um vídeo da lista ao lado para iniciar seu aprendizado
                  </p>
                </CardContent>
              </Card>
            )}
            <div className="bg-white rounded-2xl shadow p-6">
              {selectedVideo && userProfile && (
                <CommentsSection videoId={selectedVideo.id} currentUser={{...userProfile, role: userProfile.tipo_usuario}} />
              )}
            </div>
          </div>

          {/* Sidebar de módulos */}
          <div className="space-y-6">
            {modules.map((modulo) => {
              const videosDoModulo = videos.filter(v => String(v.modulo_id).trim() === String(modulo.id).trim());
              const progresso = progress[modulo.id];
              const status = progresso?.status === 'concluido' ? 'Concluído' : (progresso?.status === 'em_andamento' ? 'Em andamento' : 'Não iniciado');
              const percentual = progresso?.percentual_concluido ?? 0;
              return (
                <Card key={modulo.id} className={`border-2 ${selectedModule?.id === modulo.id ? 'border-era-lime' : 'border-era-lime/30'} rounded-xl shadow-sm transition-all`}>
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-era-dark-blue flex items-center gap-2">
                      <Play className="w-5 h-5 text-era-lime" />
                      {modulo.nome_modulo}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={status === 'Concluído' ? 'default' : 'secondary'}
                        className={status === 'Concluído' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {status}
                      </Badge>
                      <span className="text-sm text-gray-600">{percentual}% completo</span>
                    </div>
                    <Progress value={percentual} className="h-2" />
                  </CardHeader>
                  <CardContent>
                    {videosDoModulo.length > 0 ? (
                      <div className="space-y-2">
                        {videosDoModulo.map(video => (
                          <div
                            key={video.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-era-lime/10 ${selectedVideo?.id === video.id ? 'border-era-lime bg-era-lime/10' : 'border-gray-200 bg-white'}`}
                            onClick={() => {
                              setSelectedVideo(video);
                              setSelectedModule(modulo);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                {progresso?.status === 'concluido' ? (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : (
                                  <Play className="w-5 h-5 text-era-lime" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 truncate">
                                  {video.titulo}
                                </h4>
                                {video.descricao && (
                                  <p className="text-sm text-gray-600 truncate">
                                    {video.descricao}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Nenhum vídeo disponível</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Renderização para ADMINISTRADOR
  if (isAdmin) {
    return (
      <div className="p-4 md:p-8 bg-era-light-gray-2 min-h-screen">
        <div className="mb-4 flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/treinamentos')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
        </div>
        {/* Header do Curso */}
        <div className="mb-8 p-6 rounded-2xl shadow-lg border-l-8 border-era-lime bg-white flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <div className="bg-era-lime rounded-lg p-2">
              <Play className="w-8 h-8 text-era-dark-blue" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-era-dark-blue">{currentCourseData?.nome || 'Detalhes do Curso'}</h1>
              {currentCourseData?.descricao && (
                <p className="text-era-gray text-lg">{currentCourseData.descricao}</p>
              )}
              <div className="flex gap-3 mt-2">
                {currentCourseData?.categoria && <Badge className="bg-era-lime text-black">{currentCourseData.categoria}</Badge>}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Player e Comentários */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {selectedVideo ? (
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-2">
                <h2 className="text-xl font-bold mb-2">{selectedVideo.titulo}</h2>
                <VideoPlayerWithProgress
                  video={selectedVideo}
                  cursoId={id || ''}
                  moduloId={selectedModule?.id}
                  userId={userId}
                  onCourseComplete={handleCourseComplete}
                  totalVideos={totalVideos}
                  completedVideos={completedVideos}
                  className="mb-4"
                />
              </div>
            ) : (
              <Card className="mb-6">
                <CardContent className="p-8 text-center">
                  <Play className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Selecione um vídeo para começar
                  </h3>
                  <p className="text-gray-500">
                    Escolha um vídeo da lista ao lado para iniciar seu aprendizado
                  </p>
                </CardContent>
              </Card>
            )}
            <div className="bg-white rounded-2xl shadow p-6">
              {selectedVideo && userProfile && (
                <CommentsSection videoId={selectedVideo.id} currentUser={{...userProfile, role: userProfile.tipo_usuario}} />
              )}
            </div>
          </div>

          {/* Sidebar de módulos */}
          <div className="space-y-6">
            {modules.map((modulo) => {
              const videosDoModulo = videos.filter(v => String(v.modulo_id).trim() === String(modulo.id).trim());
              const progresso = progress[modulo.id];
              const status = progresso?.status === 'concluido' ? 'Concluído' : (progresso?.status === 'em_andamento' ? 'Em andamento' : 'Não iniciado');
              const percentual = progresso?.percentual_concluido ?? 0;
              return (
                <Card key={modulo.id} className={`border-2 ${selectedModule?.id === modulo.id ? 'border-era-lime' : 'border-era-lime/30'} rounded-xl shadow-sm transition-all`}>
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-era-dark-blue flex items-center gap-2">
                      <Play className="w-5 h-5 text-era-lime" />
                      {modulo.nome_modulo}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={status === 'Concluído' ? 'default' : 'secondary'}
                        className={status === 'Concluído' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {status}
                      </Badge>
                      <span className="text-sm text-gray-600">{percentual}% completo</span>
                    </div>
                    <Progress value={percentual} className="h-2" />
                  </CardHeader>
                  <CardContent>
                    {videosDoModulo.length > 0 ? (
                      <div className="space-y-2">
                        {videosDoModulo.map(video => (
                          <div
                            key={video.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-era-lime/10 ${selectedVideo?.id === video.id ? 'border-era-lime bg-era-lime/10' : 'border-gray-200 bg-white'}`}
                            onClick={() => {
                              setSelectedVideo(video);
                              setSelectedModule(modulo);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                {progresso?.status === 'concluido' ? (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : (
                                  <Play className="w-5 h-5 text-era-lime" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 truncate">
                                  {video.titulo}
                                </h4>
                                {video.descricao && (
                                  <p className="text-sm text-gray-600 truncate">
                                    {video.descricao}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Nenhum vídeo disponível</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Quiz Modal */}
        {/* Modal de Quiz */}
        <CourseQuizModal
          isOpen={showQuizModal}
          onClose={() => setShowQuizModal(false)}
          courseId={id || ''}
          courseName={currentCourseData?.nome || ''}
          onQuizComplete={handleQuizComplete}
        />
      </div>
    );
  }

  // Renderização
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar estilo Udemy */}
      <aside style={{ width: 320, background: '#fff', borderRight: '1px solid #eee', padding: 24 }}>
        <Button
          variant="outline"
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          ← Voltar
        </Button>
        <h2 style={{ fontWeight: 'bold', marginBottom: 16 }}>{currentCourseData?.nome || 'Curso'}</h2>
        {modules.map(modulo => (
          <div key={modulo.id} style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
              {modulo.nome_modulo}
            </div>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {(videos.filter(v => v.modulo_id === modulo.id) || []).map(video => (
                <li
                  key={video.id}
                  style={{
                    padding: 8,
                    background: selectedVideo?.id === video.id ? '#f0f0f0' : 'transparent',
                    borderRadius: 6,
                    cursor: 'pointer',
                    marginBottom: 4,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  onClick={() => setSelectedVideo(video)}
                >
                  <input
                    type="checkbox"
                    style={{ marginRight: 8 }}
                    checked={false /* Progresso local, pode salvar no banco depois */}
                    readOnly
                  />
                  <span style={{ flex: 1 }}>{video.titulo || 'Sem título'}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

      </aside>
      {/* Área principal */}
      <main style={{ flex: 1, padding: 32 }}>
        {selectedVideo ? (
          <>
            {('titulo' in selectedVideo) && (
              <>
                <h1 style={{ fontSize: 24, fontWeight: 'bold' }}>{selectedVideo.titulo}</h1>
                <p style={{ color: '#666', marginBottom: 16 }}>{selectedVideo.descricao}</p>
                {selectedVideo.url_video?.includes('youtube.com') || selectedVideo.url_video?.includes('youtu.be') ? (
                  <iframe
                    width="100%"
                    height="480"
                    src={selectedVideo.url_video}
                    title={selectedVideo.titulo}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video width="100%" height="480" src={selectedVideo.url_video} controls />
                )}
              </>
            )}
            {/* Se for um módulo, pode mostrar outras infos se desejar */}
          </>
        ) : (
          <p>Selecione um vídeo</p>
        )}

      </main>
    </div>
  );
};

export default CursoDetalhe; 