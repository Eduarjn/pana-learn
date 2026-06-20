import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourseModules, useCourses } from '@/hooks/useCourses';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Module, Course } from '@/hooks/useCourses';
import type { Database } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, Play, Clock, PlusCircle, Video, BookOpen, FileText, Award, Target } from 'lucide-react';
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
    <div className="p-2 border rounded mb-2" style={{ background: '#14213D', borderColor: 'rgba(75,63,114,0.28)' }}>
      <label className="block mb-1 font-semibold" style={{ color: '#E5E5E5' }}>Link do vídeo</label>
      <input
        className="border px-2 py-1 w-full mb-2"
        style={{ background: '#0d1828', borderColor: 'rgba(75,63,114,0.28)', color: '#E5E5E5', borderRadius: 8 }}
        value={link}
        onChange={e => setLink(e.target.value)}
        placeholder="https://youtu.be/..."
      />
      <button
        className="px-3 py-1 rounded font-bold"
        style={{ background: '#417B5A', color: '#fff' }}
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

  // ── Quiz binding (admin) — suporta múltiplos quizzes ─────────
  const [availableQuizzes, setAvailableQuizzes] = React.useState<{ id: string; titulo: string; categoria: string }[]>([]);
  const [selectedFinalQuizId, setSelectedFinalQuizId] = React.useState<string>('');
  const [linkedQuizzes, setLinkedQuizzes] = React.useState<{ id: string; titulo: string }[]>([]);
  const [savingQuiz, setSavingQuiz] = React.useState(false);
  const [activeQuizId, setActiveQuizId] = React.useState<string>('');
  const [completedQuizIds, setCompletedQuizIds] = React.useState<Set<string>>(new Set());

  // ── Template de certificado (admin) ─────────
  const [availableTemplates, setAvailableTemplates] = React.useState<{ id: string; name: string; is_default: boolean }[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string>('');
  const [currentTemplateId, setCurrentTemplateId] = React.useState<string>('');
  const [savingTemplate, setSavingTemplate] = React.useState(false);

  // Atalhos de compatibilidade
  const linkedQuizId = linkedQuizzes.length > 0 ? linkedQuizzes[0].id : '';

  // Load available quizzes and current mappings on mount
  React.useEffect(() => {
    const fetchQuizData = async () => {
      const { data: quizList } = await supabase
        .from('quizzes')
        .select('id, titulo, categoria')
        .eq('ativo', true)
        .order('titulo');
      if (quizList) setAvailableQuizzes(quizList);

      // Load ALL mappings from curso_quiz_mapping
      if (id) {
        const { data: mappings } = await supabase
          .from('curso_quiz_mapping')
          .select('quiz_id')
          .eq('curso_id', id);
        if (mappings && mappings.length > 0 && quizList) {
          const linked = mappings
            .map(m => {
              const q = quizList.find(quiz => quiz.id === m.quiz_id);
              return q ? { id: q.id, titulo: q.titulo } : null;
            })
            .filter(Boolean) as { id: string; titulo: string }[];
          setLinkedQuizzes(linked);

          // Buscar progresso individual de cada quiz vinculado para o usuário atual
          if (userId) {
            const quizIds = linked.map(q => q.id);
            const { data: quizProgressData } = await supabase
              .from('progresso_quiz')
              .select('quiz_id, aprovado')
              .eq('usuario_id', userId)
              .in('quiz_id', quizIds);
            if (quizProgressData) {
              const completed = new Set(
                quizProgressData.filter(p => p.aprovado === true).map(p => p.quiz_id)
              );
              setCompletedQuizIds(completed);
            }
          }
        }
      }
    };
    fetchQuizData();
  }, [id]);

  // Load templates de certificado (admin)
  React.useEffect(() => {
    if (!isAdmin) return;
    const fetchTemplates = async () => {
      const { data: templates } = await supabase
        .from('certificate_templates')
        .select('id, name, is_default')
        .order('is_default', { ascending: false });
      if (templates) setAvailableTemplates(templates);

      // Verificar template vinculado: (1) banco → (2) localStorage → (3) padrão
      if (id) {
        let bound: string | null = null;

        // Tenta ler do banco (cursos.template_id)
        const { data: cursoRow, error: cursoErr } = await supabase
          .from('cursos')
          .select('template_id')
          .eq('id', id)
          .single();
        if (!cursoErr && (cursoRow as any)?.template_id) {
          bound = (cursoRow as any).template_id;
        }

        // Fallback: localStorage
        if (!bound) bound = localStorage.getItem(`curso_template_${id}`);

        if (bound) {
          setCurrentTemplateId(bound);
          setSelectedTemplateId(bound);
        } else if (templates && templates.length > 0) {
          const defaultT = templates.find(t => t.is_default);
          if (defaultT) {
            setCurrentTemplateId(defaultT.id);
            setSelectedTemplateId(defaultT.id);
          }
        }
      }
    };
    fetchTemplates();
  }, [id, isAdmin]);

  const handleSaveTemplate = async () => {
    if (!id || !selectedTemplateId) return;
    setSavingTemplate(true);

    // Persistir no banco (cursos.template_id) — é a fonte da verdade e vale para
    // TODOS os usuários (o aluno precisa dela para emitir o certificado).
    // Usa .select() para confirmar que a linha foi realmente atualizada: um UPDATE
    // bloqueado por RLS retorna 0 linhas SEM erro, então checar só `dbError` daria
    // um falso sucesso.
    const { data: updated, error: dbError } = await supabase
      .from('cursos')
      .update({ template_id: selectedTemplateId } as any)
      .eq('id', id)
      .select('id');

    setSavingTemplate(false);

    if (dbError || !updated || updated.length === 0) {
      console.error('Falha ao vincular template ao curso:', dbError?.message);
      toast({
        title: 'Não foi possível vincular o template',
        description: dbError?.message
          || 'O curso não foi atualizado (verifique suas permissões). Tente novamente.',
        variant: 'destructive',
      });
      return;
    }

    setCurrentTemplateId(selectedTemplateId);
    localStorage.setItem(`curso_template_${id}`, selectedTemplateId); // cache opcional para a UI do admin
    toast({ title: 'Template vinculado', description: 'O template de certificado foi vinculado a este curso.' });
  };

  const handleSaveFinalQuiz = async () => {
    if (!id || !selectedFinalQuizId) return;
    // Verificar se já está vinculado
    if (linkedQuizzes.find(q => q.id === selectedFinalQuizId)) {
      toast({ title: 'Aviso', description: 'Este quiz já está vinculado ao curso.', variant: 'destructive' });
      return;
    }
    setSavingQuiz(true);
    const { error } = await supabase
      .from('curso_quiz_mapping')
      .insert({ curso_id: id, quiz_id: selectedFinalQuizId });
    setSavingQuiz(false);
    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível vincular o quiz.', variant: 'destructive' });
    } else {
      const linked = availableQuizzes.find(q => q.id === selectedFinalQuizId);
      if (linked) {
        setLinkedQuizzes(prev => [...prev, { id: linked.id, titulo: linked.titulo }]);
      }
      setSelectedFinalQuizId('');
      toast({ title: 'Quiz vinculado!', description: `"${linked?.titulo}" adicionado ao curso.` });
    }
  };

  const handleRemoveQuiz = async (quizId: string) => {
    if (!id) return;
    setSavingQuiz(true);
    const { error } = await supabase
      .from('curso_quiz_mapping')
      .delete()
      .eq('curso_id', id)
      .eq('quiz_id', quizId);
    setSavingQuiz(false);
    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível remover o quiz.', variant: 'destructive' });
    } else {
      setLinkedQuizzes(prev => prev.filter(q => q.id !== quizId));
      toast({ title: 'Quiz removido', description: 'Quiz desvinculado do curso.' });
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
    userProgress: quizUserProgress,
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

  // ── Lógica centralizada de certificado ──────────────────────────
  // Certificado é gerado APENAS quando:
  // 1. Vídeos + Quizzes → todos vídeos concluídos E todos quizzes aprovados
  // 2. Só vídeos (sem quizzes) → todos vídeos concluídos
  // 3. Só quizzes (sem vídeos) → todos quizzes aprovados
  const checkAndGenerateCertificate = React.useCallback(async () => {
    if (!userId || !id || !generateCertificate) return;

    try {
      // ── Buscar TUDO diretamente do banco (evita estado React desatualizado) ──

      // 1. Vídeos vinculados ao curso
      const { data: courseVideos } = await supabase
        .from('videos')
        .select('id')
        .eq('curso_id', id);
      const videoIds = (courseVideos || []).map(v => v.id);
      const hasVideos = videoIds.length > 0;

      // 2. Quizzes vinculados ao curso — considera APENAS os quizzes que o aluno
      //    realmente pode ver (RLS = mesmo tenant) e que estão ativos. Isso evita
      //    que um mapeamento órfão/cross-tenant em curso_quiz_mapping bloqueie o
      //    certificado para sempre (allQuizzesOk nunca ficaria true).
      const { data: courseMappings } = await supabase
        .from('curso_quiz_mapping')
        .select('quiz_id')
        .eq('curso_id', id);
      const mappedQuizIds = (courseMappings || []).map(m => m.quiz_id);
      let quizIds: string[] = [];
      if (mappedQuizIds.length > 0) {
        const { data: validQuizzes } = await supabase
          .from('quizzes')
          .select('id')
          .in('id', mappedQuizIds)
          .eq('ativo', true);
        quizIds = (validQuizzes || []).map(q => q.id);
      }
      const hasQuizzes = quizIds.length > 0;

      // Sem conteúdo = sem certificado
      if (!hasVideos && !hasQuizzes) return;

      // 3. Verificar progresso dos vídeos
      let allVideosOk = true;
      if (hasVideos) {
        const { data: videoProgressData } = await supabase
          .from('video_progress')
          .select('video_id, concluido, percentual_assistido')
          .eq('user_id', userId)
          .in('video_id', videoIds);

        allVideosOk = videoIds.every(vid =>
          (videoProgressData || []).some(
            p => p.video_id === vid && (p.concluido === true || (p.percentual_assistido ?? 0) >= 90)
          )
        );
      }

      // 4. Verificar progresso dos quizzes
      let allQuizzesOk = true;
      if (hasQuizzes) {
        const { data: quizProgressData } = await supabase
          .from('progresso_quiz')
          .select('quiz_id, aprovado')
          .eq('usuario_id', userId)
          .in('quiz_id', quizIds);

        allQuizzesOk = quizIds.every(qid =>
          (quizProgressData || []).some(p => p.quiz_id === qid && p.aprovado === true)
        );
      }

      // 5. Decidir se gera certificado
      const shouldGenerate =
        (hasVideos && hasQuizzes && allVideosOk && allQuizzesOk) ||  // caso 1
        (hasVideos && !hasQuizzes && allVideosOk) ||                  // caso 2
        (!hasVideos && hasQuizzes && allQuizzesOk);                   // caso 3

      console.log('🎓 Verificação de certificado (DB):', {
        hasVideos, hasQuizzes, allVideosOk, allQuizzesOk, shouldGenerate,
        videoIds, quizIds
      });

      if (shouldGenerate) {
        const certId = await generateCertificate(100);
        if (certId) {
          console.log('✅ Certificado gerado com sucesso!');
          toast({
            title: "Parabéns!",
            description: "Você concluiu todo o conteúdo do curso! Seu certificado foi gerado.",
          });
        } else {
          // Conteúdo concluído mas certificado não emitido — quase sempre porque o
          // curso não tem template de certificado atrelado (cursos.template_id).
          console.warn('Conteúdo concluído, mas certificado não emitido (curso sem template atrelado?).');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao verificar/gerar certificado:', error);
    }
  }, [userId, id, generateCertificate, toast]);

  // Verificação retroativa: ao carregar o curso, se o aluno já completou
  // todo o conteúdo numa sessão anterior, emite o certificado pendente.
  // (generateCertificate tem proteção anti-duplicata, então é seguro.)
  const retroCheckDone = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!userId || !id || isAdmin || loading) return;
    if (retroCheckDone.current === id) return;
    retroCheckDone.current = id;
    checkAndGenerateCertificate();
  }, [userId, id, isAdmin, loading, checkAndGenerateCertificate]);

  const handleCourseComplete = React.useCallback(async (courseId: string) => {
    if (!userId || !id) return;

    try {
      const allVideosCompleted = videos.every(video => {
        const videoProgress = progress[video.id];
        const isCompleted = videoProgress?.concluido === true || videoProgress?.percentual_assistido >= 90;
        return isCompleted;
      });

      if (allVideosCompleted) {
        console.log('🎉 Todos os vídeos foram concluídos!');

        await checkCourseCompletion();

        if (quizState.shouldShowQuiz && !quizCompleted && !quizShown) {
          console.log('🎯 Mostrando quiz imediatamente após conclusão do curso!');
          setShowQuizNotification(true);
          setQuizShown(true);
        }

        // Verificar se pode gerar certificado (lógica centralizada)
        await checkAndGenerateCertificate();
      }
    } catch (error) {
      console.error('❌ Erro ao verificar conclusão do curso:', error);
    }
  }, [userId, id, videos, progress, quizState, quizCompleted, quizShown, checkCourseCompletion, checkAndGenerateCertificate]);

  const handleQuizComplete = React.useCallback(async () => {
    setQuizCompleted(true);
    setShowQuizModal(false);
    setShowQuizNotification(false);

    // Marcar o quiz ativo como concluído na sidebar
    if (activeQuizId) {
      setCompletedQuizIds(prev => new Set([...prev, activeQuizId]));
    }

    console.log('✅ Quiz completado! Verificando se pode gerar certificado...');

    // Verificar se pode gerar certificado (lógica centralizada)
    // Pequeno delay para garantir que o progresso do quiz foi salvo no banco
    setTimeout(async () => {
      await checkAndGenerateCertificate();
    }, 1000);
  }, [checkAndGenerateCertificate, activeQuizId]);

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
        // Aluno: buscar apenas vídeos vinculados ao curso (mesmo comportamento do admin)
        const { data: videosByCourse, error: courseError } = await supabase
          .from('videos')
          .select('*')
          .eq('curso_id', id)
          .order('data_criacao', { ascending: true });

        if (courseError) {
          console.error('❌ Erro ao buscar vídeos do curso:', courseError);
        }

        if (videosByCourse && videosByCourse.length > 0) {
          finalVideos = videosByCourse;
        }
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
    return v.curso_id === id;
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

  // Mostrar modal do quiz apenas 1 vez: curso concluído + sem certificado +
  // quiz não aprovado ainda + existe pelo menos um quiz pendente
  React.useEffect(() => {
    const hasPendingQuiz = linkedQuizzes.some(q => !completedQuizIds.has(q.id));
    if (
      isCourseCompleted &&
      !certificate &&
      quizConfig &&
      !quizCompleted &&
      !quizShown &&
      !quizUserProgress?.aprovado &&
      hasPendingQuiz
    ) {
      setShowQuizModal(true);
      setQuizShown(true);
    }
  }, [isCourseCompleted, certificate, quizConfig, quizCompleted, quizShown, quizUserProgress, linkedQuizzes, completedQuizIds]);

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
              <p style={{ color: '#D0CEBA' }}>
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
                style={{ background: '#417B5A', color: '#fff', fontWeight: 700 }}
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
            style={{ background: '#14213D', border: '1px solid rgba(75,63,114,0.28)' }}
          >
            <h2 className="text-base font-bold mb-3" style={{ color: '#E5E5E5' }}>
              Configuração de Quizzes
            </h2>
            <div className="flex items-center gap-3">
              <select
                value={selectedFinalQuizId}
                onChange={e => setSelectedFinalQuizId(e.target.value)}
                className="flex-1 rounded-lg px-3 py-2 text-sm border"
                style={{
                  background: '#0d1828',
                  borderColor: 'rgba(65,123,90,0.35)',
                  color: '#E5E5E5',
                }}
              >
                <option value="">— Selecionar quiz —</option>
                {availableQuizzes
                  .filter(q => !linkedQuizzes.find(lq => lq.id === q.id))
                  .map(q => (
                    <option key={q.id} value={q.id}>
                      {q.titulo}
                    </option>
                  ))}
              </select>
              <Button
                onClick={handleSaveFinalQuiz}
                disabled={savingQuiz || !selectedFinalQuizId}
                style={{ background: '#417B5A', color: '#fff', fontWeight: 700, whiteSpace: 'nowrap' }}
              >
                {savingQuiz ? 'Adicionando...' : 'Adicionar quiz'}
              </Button>
            </div>
            {linkedQuizzes.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs" style={{ color: 'rgba(229,229,229,0.5)' }}>
                  Quizzes vinculados ({linkedQuizzes.length}):
                </p>
                {linkedQuizzes.map(q => (
                  <div key={q.id} className="flex items-center justify-between px-3 py-2 rounded-lg"
                    style={{ background: 'rgba(65,123,90,0.08)', border: '1px solid rgba(65,123,90,0.2)' }}>
                    <span className="text-sm font-medium" style={{ color: '#D0CEBA' }}>{q.titulo}</span>
                    <button
                      onClick={() => handleRemoveQuiz(q.id)}
                      disabled={savingQuiz}
                      className="text-xs px-2 py-1 rounded hover:opacity-80 transition-opacity"
                      style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* ─────────────────────────────────────────────────────── */}

        {/* ── Admin: Template de Certificado ───────────────────── */}
        {isAdmin && availableTemplates.length > 0 && (
          <div
            className="mb-6 p-5 rounded-2xl"
            style={{ background: '#14213D', border: '1px solid rgba(75,63,114,0.28)' }}
          >
            <h2 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: '#E5E5E5' }}>
              <Award className="h-4 w-4" style={{ color: '#D0CEBA' }} />
              Template de certificado
            </h2>
            <div className="flex items-center gap-3">
              <select
                value={selectedTemplateId}
                onChange={e => setSelectedTemplateId(e.target.value)}
                className="flex-1 rounded-lg px-3 py-2 text-sm border"
                style={{
                  background: '#0d1828',
                  borderColor: 'rgba(65,123,90,0.35)',
                  color: '#E5E5E5',
                }}
              >
                <option value="">— Selecionar template —</option>
                {availableTemplates.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.is_default ? '(padrão)' : ''}
                  </option>
                ))}
              </select>
              <Button
                onClick={handleSaveTemplate}
                disabled={savingTemplate || !selectedTemplateId || selectedTemplateId === currentTemplateId}
                style={{ background: '#417B5A', color: '#fff', fontWeight: 700, whiteSpace: 'nowrap' }}
              >
                {savingTemplate ? 'Salvando...' : 'Vincular template'}
              </Button>
            </div>
            {currentTemplateId && (
              <p className="mt-2 text-xs" style={{ color: 'rgba(229,229,229,0.5)' }}>
                Template atual: {availableTemplates.find(t => t.id === currentTemplateId)?.name || 'Desconhecido'}
              </p>
            )}
          </div>
        )}
        {/* ─────────────────────────────────────────────────────── */}

        {/* Progress Bar */}
        {filteredVideos.length > 0 && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: '#E5E5E5' }}>Progresso do Curso</span>
              <span className="text-sm" style={{ color: '#D0CEBA', fontWeight: 700 }}>
                {completedVideos}/{totalVideos} vídeos · {Math.round(averageProgress)}%
              </span>
            </div>
            <div style={{ height: 5, background: 'rgba(75,63,114,0.25)', borderRadius: 99, overflow: 'hidden' }}>
              <motion.div
                style={{ height: '100%', background: 'linear-gradient(90deg, #417B5A, #55a070)', borderRadius: 99 }}
                initial={{ width: 0 }}
                animate={{ width: `${averageProgress}%` }}
                transition={{ duration: 0.7, ease: 'easeOut', delay: 0.25 }}
              />
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 mx-auto mb-4" style={{ border: '2px solid #417B5A', borderTopColor: 'transparent' }}></div>
              <p style={{ color: 'rgba(229,229,229,0.5)' }}>Carregando curso...</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!loading && (
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Player e Comentários */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <AnimatePresence mode="wait">
              {selectedVideo ? (
                <motion.div
                  key={selectedVideo.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="rounded-2xl shadow-lg p-6 mb-2"
                  style={{ background: '#14213D', border: '1px solid rgba(75,63,114,0.22)' }}
                >
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
                  
                  {/* Prova Final — só aparece se houver quiz pendente (não concluído) */}
                  {isCourseComplete && linkedQuizzes.length > 0 && (() => {
                    const pendingQuizzes = linkedQuizzes.filter(q => !completedQuizIds.has(q.id));
                    const allQuizzesDone = pendingQuizzes.length === 0;

                    if (allQuizzesDone) {
                      // Todos os quizzes concluídos — mostrar estado finalizado, sem botão
                      return (
                        <div className="mt-6 p-4 rounded-lg" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.35)' }}>
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-6 w-6" style={{ color: '#22c55e' }} />
                            <div>
                              <h3 className="text-lg font-semibold mb-0.5" style={{ color: '#FFFFFF' }}>
                                Prova final concluída
                              </h3>
                              <p className="text-sm" style={{ color: 'rgba(229,229,229,0.45)' }}>
                                Você concluiu todas as provas deste curso. Seu certificado está disponível na aba Certificados.
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Ainda há prova(s) pendente(s)
                    return (
                      <div className="mt-6 p-4 rounded-lg" style={{ background: 'rgba(65,123,90,0.1)', border: '1px solid rgba(65,123,90,0.35)' }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold mb-1" style={{ color: '#FFFFFF' }}>
                              🎯 Prova Final Disponível
                            </h3>
                            <p className="text-sm" style={{ color: 'rgba(229,229,229,0.45)' }}>
                              {pendingQuizzes.length} prova{pendingQuizzes.length !== 1 ? 's' : ''} pendente{pendingQuizzes.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <Button
                            onClick={() => {
                              setActiveQuizId(pendingQuizzes[0].id);
                              setShowQuizModal(true);
                            }}
                            style={{ background: '#417B5A', color: '#fff', fontWeight: 700 }}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Iniciar Prova Final
                          </Button>
                        </div>
                      </div>
                    );
                  })()}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl shadow-lg p-8 text-center"
                  style={{ background: '#14213D', border: '1px solid rgba(75,63,114,0.22)' }}
                >
                  <Video className="h-12 w-12 mx-auto mb-4" style={{ color: 'rgba(229,229,229,0.3)' }} />
                  <h3 className="text-lg font-medium mb-2" style={{ color: '#E5E5E5' }}>Nenhum vídeo selecionado</h3>
                  <p style={{ color: 'rgba(229,229,229,0.45)' }}>Selecione um vídeo da lista ao lado para começar a assistir.</p>
                </motion.div>
              )}
              </AnimatePresence>

              {/* Comentários */}
              {selectedVideo && (
                <CommentsSection
                  videoId={selectedVideo.id}
                />
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Lista de Conteúdo (Vídeos + Quizzes) */}
              <div className="rounded-2xl shadow-lg p-6" style={{ background: '#000000', border: '1px solid rgba(75,63,114,0.22)' }}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: '#FFFFFF' }}>
                  <BookOpen className="h-5 w-5" style={{ color: '#D0CEBA' }} />
                  Conteúdo do Curso
                </h3>

                {filteredVideos.length === 0 && linkedQuizzes.length === 0 ? (
                  <div className="text-center py-8">
                    <Video className="h-8 w-8 mx-auto mb-2" style={{ color: 'rgba(229,229,229,0.3)' }} />
                    <p className="text-sm" style={{ color: 'rgba(229,229,229,0.45)' }}>
                      Nenhum conteúdo disponível para este curso.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Vídeos */}
                    {filteredVideos.map((video, index) => {
                      const videoProgress = progress[video.id];
                      const isCompleted = videoProgress?.concluido === true || videoProgress?.percentual_assistido >= 90;
                      const isSelected = selectedVideo?.id === video.id;

                      return (
                        <motion.div
                          key={video.id}
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.25, delay: index * 0.05 }}
                          className="p-3 rounded-xl cursor-pointer transition-colors duration-150"
                          style={{
                            background: isSelected ? 'rgba(65,123,90,0.12)' : 'transparent',
                            border: isSelected ? '1px solid rgba(65,123,90,0.45)' : '1px solid rgba(75,63,114,0.15)',
                            borderLeft: isSelected ? '3px solid #417B5A' : '3px solid transparent',
                          }}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
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
                              <h4 className="text-sm font-medium truncate" style={{ color: isSelected ? '#D0CEBA' : '#E5E5E5' }}>
                                {video.titulo}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Clock className="h-3 w-3" style={{ color: 'rgba(229,229,229,0.35)' }} />
                                <span className="text-xs" style={{ color: 'rgba(229,229,229,0.35)' }}>
                                  {video.duracao ? `${Math.round(video.duracao / 60)} min` : 'Duração não definida'}
                                </span>
                                {isCompleted && (
                                  <span className="text-xs font-semibold" style={{ color: '#417B5A' }}>
                                    Concluído
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}

                    {/* Quizzes vinculados ao curso */}
                    {linkedQuizzes.map((quiz, qIndex) => (
                      <motion.div
                        key={`quiz-${quiz.id}`}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, delay: (filteredVideos.length + qIndex) * 0.05 }}
                        className="p-3 rounded-xl cursor-pointer transition-colors duration-150"
                        style={{
                          background: activeQuizId === quiz.id ? 'rgba(65,123,90,0.12)' : 'rgba(65,123,90,0.06)',
                          border: activeQuizId === quiz.id ? '1px solid rgba(65,123,90,0.45)' : '1px solid rgba(65,123,90,0.25)',
                          borderLeft: '3px solid #417B5A',
                        }}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => {
                          setActiveQuizId(quiz.id);
                          setShowQuizModal(true);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {completedQuizIds.has(quiz.id) ? (
                              <CheckCircle className="h-5 w-5" style={{ color: '#22c55e' }} />
                            ) : (
                              <Target className="h-5 w-5" style={{ color: '#417B5A' }} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium truncate" style={{ color: '#D0CEBA' }}>
                              {quiz.titulo}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className="text-xs font-medium px-1.5 py-0.5 rounded"
                                style={{
                                  background: 'rgba(65,123,90,0.15)',
                                  color: '#417B5A',
                                }}
                              >
                                Quiz
                              </span>
                              {completedQuizIds.has(quiz.id) ? (
                                <span className="text-xs font-semibold" style={{ color: '#417B5A' }}>
                                  Concluído
                                </span>
                              ) : (
                                <span className="text-xs font-semibold" style={{ color: '#D0CEBA' }}>
                                  Iniciar prova
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Contadores */}
                {(filteredVideos.length > 0 || linkedQuizzes.length > 0) && (
                  <div className="mt-4 pt-3 flex gap-4 text-xs" style={{ borderTop: '1px solid rgba(75,63,114,0.2)' }}>
                    <span style={{ color: 'rgba(229,229,229,0.45)' }}>
                      <Video className="h-3 w-3 inline mr-1" />
                      {filteredVideos.length} vídeo{filteredVideos.length !== 1 ? 's' : ''}
                    </span>
                    {linkedQuizzes.length > 0 && (
                      <span style={{ color: '#417B5A' }}>
                        <Target className="h-3 w-3 inline mr-1" />
                        {linkedQuizzes.length} quiz{linkedQuizzes.length !== 1 ? 'zes' : ''}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Estatísticas */}
              {filteredVideos.length > 0 && (
                <div className="rounded-2xl shadow-lg p-6" style={{ background: '#14213D', border: '1px solid rgba(75,63,114,0.22)' }}>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: '#FFFFFF' }}>
                    <Award className="h-5 w-5" style={{ color: '#D0CEBA' }} />
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
                      <span className="text-sm font-medium" style={{ color: '#D0CEBA' }}>{Math.round(averageProgress)}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Certificado */}
              {certificate && (
                <div className="rounded-2xl shadow-lg p-6" style={{ background: '#14213D', border: '1px solid rgba(75,63,114,0.22)' }}>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: '#FFFFFF' }}>
                    <FileText className="h-5 w-5" style={{ color: '#D0CEBA' }} />
                    Certificado
                  </h3>
                  <p className="text-sm mb-4" style={{ color: 'rgba(229,229,229,0.65)' }}>
                    Parabéns! Você concluiu este curso com sucesso.
                  </p>
                  <Button
                    onClick={handleViewCertificate}
                    className="w-full"
                    style={{ background: '#417B5A', color: '#fff', fontWeight: 700 }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Ver Certificado
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
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
          quizId={activeQuizId || undefined}
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