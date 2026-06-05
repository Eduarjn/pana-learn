import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourseModules, useCourses } from '@/hooks/useCourses';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Module, Course } from '@/hooks/useCourses';
import type { Database } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, Play, Clock, PlusCircle, Video, BookOpen, FileText, Award } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { VideoPlayerWithProgress } from '@/components/VideoPlayerWithProgress';
import { VideoChecklist } from '@/components/VideoChecklist';
import { QuizModal } from '@/components/QuizModal';
import { CourseCompletionModal } from '@/components/CourseCompletionModal';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import CommentsSection from '@/components/CommentsSection';
import { useQuiz } from '@/hooks/useQuiz';
import { useOptionalQuiz } from '@/hooks/useOptionalQuiz';
import { QuizNotification } from '@/components/QuizNotification';
import { CourseQuizModal } from '@/components/CourseQuizModal';
import { toast } from '@/components/ui/use-toast';
import { VideoUpload } from '@/components/VideoUpload';
import { VideoInfo } from '@/components/VideoInfo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    <div className="p-2 border rounded mb-2" style={{ background: '#14213D', borderColor: 'rgba(252,163,17,0.18)' }}>
      <label className="block mb-1 font-semibold" style={{ color: '#E5E5E5' }}>Link do vídeo</label>
      <input
        className="border px-2 py-1 w-full mb-2"
        style={{ background: '#0d1828', borderColor: 'rgba(252,163,17,0.18)', color: '#E5E5E5', borderRadius: 8 }}
        value={link}
        onChange={e => setLink(e.target.value)}
        placeholder="https://youtu.be/..."
      />
      <button
        className="px-3 py-1 rounded font-bold"
        style={{ background: '#FCA311', color: '#000000' }}
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
  const isAdmin = userProfile?.tipo_usuario === 'admin' || userProfile?.tipo_usuario === 'admin_master';
  const userId = userProfile?.id;
  const navigate = useNavigate();

  // Debug logs apenas em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.log('🎯 CursoDetalhe - Componente carregado');
    console.log('🎯 CursoDetalhe - ID recebido:', id);
    console.log('🎯 CursoDetalhe - IsAdmin:', isAdmin);
  }

  const [videos, setVideos] = React.useState<VideoWithModulo[]>([]);
  const [progress, setProgress] = React.useState<Record<string, Database['public']['Tables']['video_progress']['Row']>>({});
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = React.useState<VideoWithModulo | null>(null);
  const [selectedModule, setSelectedModule] = React.useState<Module | null>(null);
  const [showUploadModal, setShowUploadModal] = React.useState(false);
  const [showQuizNotification, setShowQuizNotification] = React.useState(false);
  const [showQuizModal, setShowQuizModal] = React.useState(false);
  const [refresh, setRefresh] = React.useState(0);

  const [editingModuleId, setEditingModuleId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState('');
  const [editDesc, setEditDesc] = React.useState('');
  const [currentCourse, setCurrentCourse] = React.useState<Course | null>(null);
  const [totalVideos, setTotalVideos] = React.useState(0);
  const [completedVideos, setCompletedVideos] = React.useState(0);
  const [quizCompleted, setQuizCompleted] = React.useState(false);
  const [quizShown, setQuizShown] = React.useState(false);
  const [showVideoUpload, setShowVideoUpload] = React.useState(false);
  const { data: allCourses = [] } = useCourses();
  const currentCourseData = allCourses.find(c => c.id === id);
  const currentCategory = currentCourseData?.categoria;
  const { data: modules = [] } = useCourseModules(id || '');

  // ── Final Quiz binding (admin) ─────────────────────────────────
  const [availableQuizzes, setAvailableQuizzes] = React.useState<{ id: string; titulo: string; categoria: string }[]>([]);
  const [selectedFinalQuizId, setSelectedFinalQuizId] = React.useState<string>('');
  const [linkedQuizTitle, setLinkedQuizTitle] = React.useState<string>('');
  const [linkedQuizId, setLinkedQuizId] = React.useState<string>('');
  const [savingQuiz, setSavingQuiz] = React.useState(false);

  // Load available quizzes and current mapping on mount
  React.useEffect(() => {
    const fetchQuizData = async () => {
      const { data: quizList } = await supabase
        .from('quizzes')
        .select('id, titulo, categoria')
        .eq('ativo', true)
        .order('titulo');
      if (quizList) setAvailableQuizzes(quizList);

      // Load the current mapping from curso_quiz_mapping
      if (id) {
        const { data: mapping } = await supabase
          .from('curso_quiz_mapping')
          .select('quiz_id')
          .eq('curso_id', id)
          .maybeSingle();
        if (mapping?.quiz_id) {
          setSelectedFinalQuizId(mapping.quiz_id);
          setLinkedQuizId(mapping.quiz_id);
          const linked = quizList?.find(q => q.id === mapping.quiz_id);
          if (linked) setLinkedQuizTitle(linked.titulo);
        }
      }
    };
    fetchQuizData();
  }, [id]);

  const handleSaveFinalQuiz = async () => {
    if (!id || !selectedFinalQuizId) return;
    setSavingQuiz(true);
    // Upsert into curso_quiz_mapping (delete old, insert new for clean 1-to-1)
    await supabase.from('curso_quiz_mapping').delete().eq('curso_id', id);
    const { error } = await supabase
      .from('curso_quiz_mapping')
      .insert({ curso_id: id, quiz_id: selectedFinalQuizId });
    setSavingQuiz(false);
    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível salvar o quiz.', variant: 'destructive' });
    } else {
      const linked = availableQuizzes.find(q => q.id === selectedFinalQuizId);
      setLinkedQuizTitle(linked?.titulo || '');
      setLinkedQuizId(selectedFinalQuizId);
      toast({ title: 'Vínculo salvo!', description: `Quiz "${linked?.titulo}" vinculado ao curso.` });
    }
  };
  // ─────────────────────────────────────────────────────────────

  // Hook para gerenciar quiz opcional (não interfere no fluxo atual)
  const { quizState, loading: quizLoading, checkCourseCompletion } = useOptionalQuiz(id || '');
  
  // Hook para gerenciar quiz e certificado
  const { 
    quizConfig, 
    isCourseCompleted, 
    certificate, 
    generateCertificate 
  } = useQuiz(userId, id);

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
        .eq('user_id', userId)
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

  // Verificar se deve mostrar notificação de quiz (apenas uma vez)
  React.useEffect(() => {
    if (quizState.shouldShowQuiz && !quizCompleted && !quizShown) {
      console.log('🎯 Curso concluído! Mostrando notificação de quiz...');
      setShowQuizNotification(true);
      setQuizShown(true); // Marcar como já mostrado para esta sessão
    }
  }, [quizState.shouldShowQuiz, quizCompleted, quizShown]);

  // Forçar verificação do quiz quando progresso dos vídeos mudar
  React.useEffect(() => {
    if (videos.length > 0 && Object.keys(progress).length > 0) {
      // Verificar se todos os vídeos foram concluídos
      const allVideosCompleted = videos.every(video => {
        const videoProgress = progress[video.id];
        const isCompleted = videoProgress?.concluido === true || videoProgress?.percentual_assistido >= 90;
        return isCompleted;
      });

      if (allVideosCompleted && !quizState.quizAlreadyCompleted) {
        console.log('🎯 Todos os vídeos concluídos detectados! Forçando verificação do quiz...');
        checkCourseCompletion();
      }
    }
  }, [videos, progress, quizState.quizAlreadyCompleted, checkCourseCompletion]);

  const handleCourseComplete = React.useCallback(async (courseId: string) => {
    if (!userId || !id) return;
    
    try {
      // Verificar se todos os vídeos foram concluídos
      const allVideosCompleted = videos.every(video => {
        const videoProgress = progress[video.id];
        const isCompleted = videoProgress?.concluido === true || videoProgress?.percentual_assistido >= 90;
        return isCompleted;
      });

      if (allVideosCompleted) {
        console.log('🎉 Todos os vídeos foram concluídos!');
        
        // Forçar nova verificação do quiz
        await checkCourseCompletion();
        
        // Verificar se deve mostrar quiz imediatamente
        if (quizState.shouldShowQuiz && !quizCompleted && !quizShown) {
          console.log('🎯 Mostrando quiz imediatamente após conclusão do curso!');
          setShowQuizNotification(true);
          setQuizShown(true);
        }
        
        // Gerar certificado se disponível (nota 100 para conclusão por vídeos)
        if (generateCertificate) {
          try {
            await generateCertificate(100);
            console.log('✅ Certificado gerado com sucesso!');
          } catch (error) {
            console.error('❌ Erro ao gerar certificado:', error);
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao verificar conclusão do curso:', error);
    }
  }, [userId, id, videos, progress, generateCertificate, quizState, quizCompleted, quizShown, checkCourseCompletion]);

  const handleQuizComplete = React.useCallback(async () => {
    setQuizCompleted(true);
    setShowQuizModal(false);
    setShowQuizNotification(false);
    
    // Marcar quiz como completado no banco de dados
    try {
      if (currentCategory && userProfile?.id) {
        // Buscar o quiz da categoria
        const { data: quizData } = await supabase
          .from('quizzes')
          .select('id')
          .eq('categoria', currentCategory)
          .eq('ativo', true)
          .single();

        if (quizData) {
          // Marcar como completado (mesmo que não tenha nota ainda)
          await supabase
            .from('progresso_quiz')
            .upsert({
              usuario_id: userProfile.id,
              quiz_id: quizData.id,
              respostas: {},
              nota: 0, // Será atualizada quando o quiz for realmente completado
              aprovado: false,
              data_conclusao: new Date().toISOString()
            });

          console.log('✅ Quiz marcado como completado no banco de dados');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao marcar quiz como completado:', error);
    }
    
    // Gerar certificado após conclusão do quiz (nota será definida pelo quiz)
    if (generateCertificate) {
      try {
        await generateCertificate(100); // Nota padrão para conclusão por quiz
        toast({
          title: "Parabéns!",
          description: "Quiz concluído com sucesso! Seu certificado foi gerado.",
        });
      } catch (error) {
        console.error('❌ Erro ao gerar certificado:', error);
      }
    }
  }, [generateCertificate, toast, currentCategory, userProfile?.id]);

  const fetchVideosAndProgress = async () => {
    setLoading(true);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 CursoDetalhe - Iniciando carregamento:', {
        cursoId: id,
        userId: userId,
        isAdmin: isAdmin
      });
    }
    
    let finalVideos: VideoWithModulo[] = [];
    
    try {
      if (!isAdmin) {
        // ========== DIAGNÓSTICO COMPLETO PARA ALUNOS ==========
        console.log('🔎 [ALUNO] Iniciando busca de vídeos...');
        console.log('🔎 [ALUNO] curso_id:', id);
        console.log('🔎 [ALUNO] currentCategory:', currentCategory);

        // Teste 1: Busca simples SEM filtros (verifica se RLS bloqueia tudo)
        const { data: allVideosTest, error: allVideosError } = await supabase
          .from('videos')
          .select('id, titulo, curso_id, categoria')
          .limit(5);
        
        console.log('🔎 [ALUNO] Teste RLS - SELECT sem filtro:', {
          count: allVideosTest?.length ?? 'null',
          error: allVideosError?.message ?? 'nenhum',
          errorCode: allVideosError?.code ?? 'nenhum',
          data: allVideosTest
        });

        // Teste 2: Busca por curso_id
        const { data: videosByCourse, error: courseError } = await supabase
          .from('videos')
          .select('*')
          .eq('curso_id', id)
          .order('data_criacao', { ascending: true });

        console.log('🔎 [ALUNO] Busca por curso_id:', {
          count: videosByCourse?.length ?? 'null',
          error: courseError?.message ?? 'nenhum',
          errorCode: courseError?.code ?? 'nenhum'
        });

        if (videosByCourse && videosByCourse.length > 0) {
          finalVideos = videosByCourse;
        } else if (currentCategory) {
          // Teste 3: Busca por categoria (sem restringir curso_id null)
          const { data: videosByCategory, error: catError } = await supabase
            .from('videos')
            .select('*')
            .eq('categoria', currentCategory)
            .order('data_criacao', { ascending: true });

          console.log('🔎 [ALUNO] Busca por categoria:', {
            categoria: currentCategory,
            count: videosByCategory?.length ?? 'null',
            error: catError?.message ?? 'nenhum',
            errorCode: catError?.code ?? 'nenhum'
          });
            
          if (!catError && videosByCategory) {
            finalVideos = videosByCategory;
          }
        }
        
        console.log('🔎 [ALUNO] Final - vídeos encontrados:', finalVideos.length);
        // ========== FIM DIAGNÓSTICO ==========
      } else {
        // Logica para ADMINS (com atualizacao de orfaos)
        const { data: videosData, error: videosError } = await supabase
          .from('videos')
          .select('*')
          .eq('curso_id', id)
          .order('data_criacao', { ascending: false });

        if (videosError) {
          console.error('❌ Erro ao buscar vídeos por curso_id:', videosError);
        }

        if (videosData && videosData.length > 0) {
          finalVideos = videosData;
        } else {
          console.log('🔍 CursoDetalhe - Nenhum vídeo encontrado por curso_id, verificando por categoria...');
          
          const { data: cursoData } = await supabase
            .from('cursos')
            .select('categoria')
            .eq('id', id)
            .single();

          if (cursoData?.categoria) {
            const { data: videosByCategory } = await supabase
              .from('videos')
              .select('*')
              .eq('categoria', cursoData.categoria)
              .is('curso_id', null)
              .order('data_criacao', { ascending: true });

            if (videosByCategory && videosByCategory.length > 0) {
              console.log('🔧 CursoDetalhe - Associando vídeos órfãos ao curso atual...');
              for (const video of videosByCategory) {
                await supabase.from('videos').update({ curso_id: id }).eq('id', video.id);
              }
              const { data: updatedVideos } = await supabase
                .from('videos')
                .select('*')
                .eq('curso_id', id)
                .order('data_criacao', { ascending: false });
              finalVideos = updatedVideos || [];
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar vídeos:', error);
    }

    // Definir vídeos encontrados
    if (finalVideos.length > 0) {
      console.log('✅ Vídeos carregados com sucesso:', finalVideos);
      setVideos(finalVideos);
    } else {
      console.log('📋 Nenhum vídeo encontrado para este curso');
      setVideos([]);
    }

    // Buscar progresso do usuário para cada vídeo
    const videoIds = finalVideos.map(v => v.id);
    const progressMap: Record<string, Database['public']['Tables']['video_progress']['Row']> = {};

    if (videoIds.length > 0) {
      const { data: progressData } = await supabase
        .from('video_progress')
        .select('*')
        .eq('user_id', userId)
        .in('video_id', videoIds);

      (progressData || []).forEach((p) => {
        if (p.video_id) progressMap[p.video_id] = p;
      });
    }

    setProgress(progressMap);

    // ── Auto-resume: seleccionar o primeiro vídeo não concluído ──────────────
    // Só auto-selecciona na primeira carga (quando ainda não há vídeo seleccionado)
    setSelectedVideo(prev => {
      if (prev) return prev; // já há um vídeo seleccionado, não interferir
      if (finalVideos.length === 0) return null;
      // 1º: vídeo em progresso (assistido mas não concluído)
      const inProgress = finalVideos.find(v => {
        const p = progressMap[v.id];
        return p && !p.concluido && (p.percentual_assistido ?? 0) > 0;
      });
      if (inProgress) return inProgress;
      // 2º: primeiro vídeo sem registo de progresso
      const notStarted = finalVideos.find(v => !progressMap[v.id]);
      if (notStarted) return notStarted;
      // 3º: se todos concluídos, voltar ao último
      return finalVideos[finalVideos.length - 1];
    });
    // ─────────────────────────────────────────────────────────────────────────

    setLoading(false);
  };

  React.useEffect(() => {
    if (!id || !userId) return;
    fetchVideosAndProgress();
  }, [id, userId, refresh]);

  // Filtrar vídeos do curso atual
  const filteredVideos = videos.filter(v => {
    // Verificar se o vídeo pertence ao curso atual
    // Ou se é um aluno e o vídeo é órfão da mesma categoria (carregado via fallback)
    return v.curso_id === id || (!isAdmin && !v.curso_id && v.categoria === currentCategory);
  });

  // Log apenas quando necessário para debug
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 CursoDetalhe - Vídeos filtrados:', {
      totalVideos: videos.length,
      filteredVideosCount: filteredVideos.length,
      currentCourseId: id,
      currentCategory: currentCategory
    });
  }

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

  // Criar módulos automáticos se necessário (para clientes)
  const createDefaultModules = async () => {
    if (!isAdmin && modules.length === 0 && videos.length > 0) {
      try {
        console.log('🔧 Criando módulos padrão para o curso...');
        
        // Criar módulo "Introdução"
        const { data: introModule, error: introError } = await supabase
          .from('modulos')
          .insert({
            curso_id: id,
            nome_modulo: 'Introdução',
            descricao: 'Vídeos introdutórios do curso',
            ordem: 1
          })
          .select()
          .single();

        if (introError) {
          console.error('❌ Erro ao criar módulo Introdução:', introError);
        } else {
          console.log('✅ Módulo Introdução criado:', introModule);
        }
      } catch (error) {
        console.error('❌ Erro ao criar módulos padrão:', error);
      }
    }
  };

  // Criar módulos automáticos quando necessário
  React.useEffect(() => {
    if (!isAdmin && modules.length === 0 && videos.length > 0 && !loading) {
      createDefaultModules();
    }
  }, [isAdmin, modules.length, videos.length, loading, id]);

  // Selecionar primeiro vídeo automaticamente
  React.useEffect(() => {
    if (filteredVideos.length > 0 && !selectedVideo) {
      setSelectedVideo(filteredVideos[0]);
    }
  }, [filteredVideos, selectedVideo]);

  // Calcular progresso total
  const totalProgress = Object.values(progress).reduce((acc, p) => acc + (p.percentual_assistido || 0), 0);
  const averageProgress = filteredVideos.length > 0 ? totalProgress / filteredVideos.length : 0;

  // Verificar se o curso está completo
  const isCourseComplete = filteredVideos.length > 0 && 
    filteredVideos.every(video => {
      const videoProgress = progress[video.id];
      return videoProgress?.concluido === true || videoProgress?.percentual_assistido >= 90;
    });

  return (
    <div className="min-h-screen" style={{ background: '#08111f' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className=""
              style={{ color: 'rgba(229,229,229,0.6)' }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>
                {currentCourseData?.nome || 'Carregando...'}
              </h1>
              <p style={{ color: '#FCA311' }}>
                {currentCourseData?.categoria || 'Categoria não definida'}
              </p>
            </div>
          </div>
          
          {isAdmin && (
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  console.log('🎯 Botão Adicionar Vídeo clicado!');
                  console.log('🎯 showVideoUpload antes:', showVideoUpload);
                  setShowVideoUpload(true);
                  console.log('🎯 showVideoUpload depois:', true);
                }}
                className=""
                style={{ background: '#FCA311', color: '#000000', fontWeight: 700 }}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Adicionar Vídeo
              </Button>
            </div>
          )}
        </div>

        {/* ── Admin: Final Quiz Configuration ───────────────────────── */}
        {isAdmin && (
          <div
            className="mb-6 p-5 rounded-2xl"
            style={{ background: '#14213D', border: '1px solid rgba(252,163,17,0.18)' }}
          >
            <h2 className="text-base font-bold mb-3" style={{ color: '#E5E5E5' }}>
              Configuração da Prova Final
            </h2>
            <div className="flex items-center gap-3">
              <select
                value={selectedFinalQuizId}
                onChange={e => setSelectedFinalQuizId(e.target.value)}
                className="flex-1 rounded-lg px-3 py-2 text-sm border"
                style={{
                  background: '#0d1828',
                  borderColor: 'rgba(252,163,17,0.25)',
                  color: '#E5E5E5',
                }}
              >
                <option value="">— Selecionar quiz —</option>
                {availableQuizzes.map(q => (
                  <option key={q.id} value={q.id}>
                    {q.titulo}
                  </option>
                ))}
              </select>
              <Button
                onClick={handleSaveFinalQuiz}
                disabled={savingQuiz || !selectedFinalQuizId}
                style={{ background: '#FCA311', color: '#000000', fontWeight: 700, whiteSpace: 'nowrap' }}
              >
                {savingQuiz ? 'Salvando...' : 'Salvar vínculo'}
              </Button>
            </div>
            {linkedQuizTitle && (
              <p className="mt-2 text-sm">
                <span style={{ color: 'rgba(229,229,229,0.5)' }}>Quiz atualmente vinculado: </span>
                <span className="font-semibold" style={{ color: '#FCA311' }}>{linkedQuizTitle}</span>
              </p>
            )}
          </div>
        )}
        {/* ─────────────────────────────────────────────────────── */}

        {/* Progress Bar */}
        {filteredVideos.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: '#E5E5E5' }}>
                Progresso do Curso
              </span>
              <span className="text-sm" style={{ color: '#FCA311', fontWeight: 700 }}>
                {Math.round(averageProgress)}% completo
              </span>
            </div>
            <div style={{ height: 4, background: 'rgba(252,163,17,0.15)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${averageProgress}%`, background: 'linear-gradient(90deg, #FCA311, #e8940f)', borderRadius: 99, transition: 'width 0.4s' }} />
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 mx-auto mb-4" style={{ border: '2px solid #FCA311', borderTopColor: 'transparent' }}></div>
              <p style={{ color: 'rgba(229,229,229,0.5)' }}>Carregando curso...</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Player e Comentários */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {selectedVideo ? (
                <div className="rounded-2xl shadow-lg p-6 mb-2" style={{ background: '#14213D', border: '1px solid rgba(252,163,17,0.12)' }}>
                  {/* Player de Vídeo */}
                  <VideoPlayerWithProgress
                    video={selectedVideo}
                    cursoId={id || ''}
                    moduloId={selectedModule?.id}
                    userId={userId}
                    onCourseComplete={handleCourseComplete}
                    onVideoCompleted={() => { fetchVideosAndProgress(); calculateCourseProgress(); }}
                    totalVideos={totalVideos}
                    completedVideos={completedVideos}
                    className="mb-6"
                  />
                  
                  {/* Informações do Vídeo */}
                  <VideoInfo
                    titulo={selectedVideo.titulo}
                    descricao={selectedVideo.descricao}
                    duracao={selectedVideo.duracao}
                    progresso={progress[selectedVideo.id]}
                  />
                  
                  {/* Prova Final (student: shows when all videos done + quiz mapped) */}
                  {isCourseComplete && linkedQuizId && (
                    <div className="mt-6 p-4 rounded-lg" style={{ background: 'rgba(252,163,17,0.08)', border: '1px solid rgba(252,163,17,0.25)' }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold mb-1" style={{ color: '#FFFFFF' }}>
                            🎯 Prova Final Disponível
                          </h3>
                          <p className="text-sm" style={{ color: 'rgba(229,229,229,0.45)' }}>
                            {quizConfig ? `${quizConfig.perguntas?.length || 0} perguntas • Nota mínima: ${quizConfig.nota_minima || 70}%` : 'Carregando quiz...'}
                          </p>
                        </div>
                        <Button
                          onClick={() => setShowQuizModal(true)}
                          style={{ background: '#FCA311', color: '#000000', fontWeight: 700 }}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Iniciar Prova Final
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl shadow-lg p-8 text-center" style={{ background: '#14213D', border: '1px solid rgba(252,163,17,0.12)' }}>
                  <Video className="h-12 w-12 mx-auto mb-4" style={{ color: 'rgba(229,229,229,0.3)' }} />
                  <h3 className="text-lg font-medium mb-2" style={{ color: '#E5E5E5' }}>
                    Nenhum vídeo selecionado
                  </h3>
                  <p style={{ color: 'rgba(229,229,229,0.45)' }}>
                    Selecione um vídeo da lista ao lado para começar a assistir.
                  </p>
                </div>
              )}

              {/* Comentários */}
              {selectedVideo && (
                <CommentsSection
                  videoId={selectedVideo.id}
                />
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Lista de Vídeos */}
              <div className="rounded-2xl shadow-lg p-6" style={{ background: '#000000', border: '1px solid rgba(252,163,17,0.12)' }}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: '#FFFFFF' }}>
                  <Video className="h-5 w-5" style={{ color: '#FCA311' }} />
                  Vídeos do Curso
                </h3>
                
                {filteredVideos.length === 0 ? (
                  <div className="text-center py-8">
                    <Video className="h-8 w-8 mx-auto mb-2" style={{ color: 'rgba(229,229,229,0.3)' }} />
                    <p className="text-sm" style={{ color: 'rgba(229,229,229,0.45)' }}>
                      Nenhum vídeo disponível para este curso.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredVideos.map((video, index) => {
                      const videoProgress = progress[video.id];
                      const isCompleted = videoProgress?.concluido === true || videoProgress?.percentual_assistido >= 90;
                      const isSelected = selectedVideo?.id === video.id;
                      
                      return (
                        <div
                          key={video.id}
                          className={`p-3 rounded-lg cursor-pointer transition-all duration-200`}
                          style={{
                            background: isSelected ? 'rgba(252,163,17,0.1)' : 'transparent',
                            border: isSelected ? '1px solid rgba(252,163,17,0.3)' : '1px solid rgba(255,255,255,0.04)',
                            borderLeft: isSelected ? '3px solid #FCA311' : '3px solid transparent',
                          }}
                          onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(252,163,17,0.05)'; }}
                          onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                          onClick={() => setSelectedVideo(video)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              {isCompleted ? (
                                <CheckCircle className="h-5 w-5" style={{ color: '#22c55e' }} />
                              ) : (
                                <Play className="h-5 w-5" style={{ color: 'rgba(229,229,229,0.4)' }} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium truncate" style={{ color: isSelected ? '#FCA311' : '#E5E5E5' }}>
                                {video.titulo}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Clock className="h-3 w-3" style={{ color: 'rgba(229,229,229,0.35)' }} />
                                <span className="text-xs" style={{ color: 'rgba(229,229,229,0.35)' }}>
                                  {video.duracao ? `${Math.round(video.duracao / 60)} min` : 'Duração não definida'}
                                </span>
                                {videoProgress && (
                                  <span className="text-xs font-medium" style={{ color: '#FCA311' }}>
                                    {Math.round(videoProgress.percentual_assistido || 0)}% completo
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Estatísticas */}
              {filteredVideos.length > 0 && (
                <div className="rounded-2xl shadow-lg p-6" style={{ background: '#14213D', border: '1px solid rgba(252,163,17,0.12)' }}>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: '#FFFFFF' }}>
                    <Award className="h-5 w-5" style={{ color: '#FCA311' }} />
                    Estatísticas
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm" style={{ color: 'rgba(229,229,229,0.45)' }}>Total de vídeos</span>
                      <span className="text-sm font-medium" style={{ color: '#FFFFFF' }}>{filteredVideos.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm" style={{ color: 'rgba(229,229,229,0.45)' }}>Vídeos concluídos</span>
                      <span className="text-sm font-medium" style={{ color: '#22c55e' }}>
                        {filteredVideos.filter(v => {
                          const videoProgress = progress[v.id];
                          return videoProgress?.concluido === true || videoProgress?.percentual_assistido >= 90;
                        }).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm" style={{ color: 'rgba(229,229,229,0.45)' }}>Progresso geral</span>
                      <span className="text-sm font-medium" style={{ color: '#FCA311' }}>{Math.round(averageProgress)}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Certificado */}
              {certificate && (
                <div className="rounded-2xl shadow-lg p-6" style={{ background: '#14213D', border: '1px solid rgba(252,163,17,0.12)' }}>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: '#FFFFFF' }}>
                    <FileText className="h-5 w-5" style={{ color: '#FCA311' }} />
                    Certificado
                  </h3>
                  <p className="text-sm mb-4" style={{ color: 'rgba(229,229,229,0.65)' }}>
                    Parabéns! Você concluiu este curso com sucesso.
                  </p>
                  <Button
                    onClick={handleViewCertificate}
                    className="w-full"
                    style={{ background: '#FCA311', color: '#000000', fontWeight: 700 }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Ver Certificado
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notificação de Quiz (Não-intrusiva) */}
        <QuizNotification
          courseId={id || ''}
          courseName={currentCourseData?.nome || ''}
          isVisible={showQuizNotification}
          onClose={() => setShowQuizNotification(false)}
          onQuizComplete={handleQuizComplete}
        />

        {/* Modal de Quiz */}
        <CourseQuizModal
          courseId={id || ''}
          courseName={currentCourseData?.nome || ''}
          isOpen={showQuizModal}
          onClose={() => setShowQuizModal(false)}
          onQuizComplete={handleQuizComplete}
        />

        {/* Video Upload Modal */}
        {showVideoUpload && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}>
            {console.log('🎯 Modal VideoUpload sendo renderizado!')}
            <VideoUpload
              onClose={() => {
                console.log('🎯 Fechando modal VideoUpload');
                setShowVideoUpload(false);
              }}
              onSuccess={() => {
                console.log('🎯 Sucesso no upload, fechando modal');
                setShowVideoUpload(false);
                setRefresh(prev => prev + 1);
              }}
              preSelectedCourseId={id}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CursoDetalhe; 