import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface QuizQuestion {
  id: string;
  pergunta: string;
  opcoes: string[];
  resposta_correta: number;
  explicacao?: string;
  ordem: number;
  audio_id?: string | null;
  audio_url?: string | null;
  audio_nome?: string | null;
}

interface QuizConfig {
  id: string;
  titulo: string;
  descricao?: string;
  categoria: string;
  nota_minima: number;
  perguntas: QuizQuestion[];
  mensagem_sucesso: string;
  mensagem_reprova: string;
}

interface CertificateData {
  id: string;
  usuario_id: string;
  curso_id: string;
  curso_nome: string;
  nota: number;
  data_conclusao: string;
  certificado_url?: string;
  qr_code_url?: string;
}

export function useQuiz(userId: string | undefined, courseId: string | undefined) {
  const [quizConfig, setQuizConfig] = useState<QuizConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isQuizAvailable, setIsQuizAvailable] = useState(false);
  const [userProgress, setUserProgress] = useState<any>(null);
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [isCourseCompleted, setIsCourseCompleted] = useState(false);

  // Carregar configuração do quiz a partir do final_quiz_id do curso
  const loadQuizByFinalQuizId = useCallback(async (quizId: string) => {
    try {
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (quizError || !quizData) return;

      const { data: questionsData, error: questionsError } = await supabase
        .from('quiz_perguntas')
        .select('*, quiz_audios(id, nome, audio_url)')
        .eq('quiz_id', quizId)
        .order('ordem');

      if (questionsError) return;

      // Progresso do usuário neste quiz
      let progressData = null;
      if (userId) {
        const { data: pr } = await supabase
          .from('progresso_quiz')
          .select('*')
          .eq('usuario_id', userId)
          .eq('quiz_id', quizId)
          .maybeSingle();
        progressData = pr;
      }

      // Certificado existente
      let certData = null;
      if (userId && courseId) {
        const { data: cd } = await supabase
          .from('certificados')
          .select('*')
          .eq('usuario_id', userId)
          .eq('curso_id', courseId)
          .maybeSingle();
        certData = cd;
      }

      const config: QuizConfig = {
        id: quizData.id,
        titulo: quizData.titulo,
        descricao: quizData.descricao,
        categoria: quizData.categoria,
        nota_minima: quizData.nota_minima,
        perguntas: (questionsData || []).map((q: any) => ({
          id: q.id,
          pergunta: q.pergunta,
          opcoes: q.opcoes,
          resposta_correta: q.resposta_correta,
          explicacao: q.explicacao,
          ordem: q.ordem,
          audio_id: q.audio_id,
          audio_url: q.quiz_audios?.audio_url || null,
          audio_nome: q.quiz_audios?.nome || null,
        })),
        mensagem_sucesso: 'Parabéns! Você concluiu o curso com sucesso!',
        mensagem_reprova: 'Continue estudando e tente novamente.'
      };

      setQuizConfig(config);
      setUserProgress(progressData);
      setCertificate(certData);
      setIsQuizAvailable(true);
    } catch (err) {
      console.error('Erro ao carregar quiz do curso:', err);
    }
  }, [userId, courseId]);

  // Verificar se todos os vídeos do curso foram concluídos e carregar quiz vinculado
  const checkQuizAvailability = useCallback(async () => {
    if (!userId || !courseId) return;

    try {
      setIsLoading(true);

      // 1. Buscar quiz vinculado via curso_quiz_mapping
      const { data: mapping } = await supabase
        .from('curso_quiz_mapping')
        .select('quiz_id')
        .eq('curso_id', courseId)
        .maybeSingle();

      if (!mapping?.quiz_id) {
        // Curso sem quiz vinculado — silently skip
        setIsQuizAvailable(false);
        return;
      }

      // 2. Verificar se todos os vídeos foram concluídos
      const { data: allVideos } = await supabase
        .from('videos')
        .select('id')
        .eq('curso_id', courseId);

      if (!allVideos || allVideos.length === 0) {
        setIsQuizAvailable(false);
        return;
      }

      const videoIds = allVideos.map(v => v.id);
      const { data: progressRows } = await supabase
        .from('video_progress')
        .select('video_id, concluido, percentual_assistido')
        .eq('user_id', userId)
        .in('video_id', videoIds);

      const completedCount = (progressRows || []).filter(
        p => p.concluido === true || (p.percentual_assistido ?? 0) >= 90
      ).length;

      const allDone = completedCount >= allVideos.length;
      setIsCourseCompleted(allDone);

      if (allDone) {
        await loadQuizByFinalQuizId(mapping.quiz_id);
      }
    } catch (err) {
      console.error('Erro ao verificar disponibilidade do quiz:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, courseId, loadQuizByFinalQuizId]);

  // Gerar certificado manualmente (chamado pelo componente pai)
  const generateCertificate = useCallback(async (nota: number) => {
    if (!userId || !courseId || !quizConfig) return;
    try {
      const { data: certId, error: certError } = await supabase
        .rpc('gerar_certificado_curso', {
          p_usuario_id: userId,
          p_curso_id: courseId,
          p_quiz_id: quizConfig.id,
          p_nota: nota
        });

      if (!certError && certId) {
        const { data: certData } = await supabase
          .from('certificados')
          .select('*')
          .eq('id', certId)
          .maybeSingle();
        if (certData) setCertificate(certData);
      }
    } catch (err) {
      console.error('Erro ao gerar certificado:', err);
    }
  }, [userId, courseId, quizConfig]);

  // Submeter respostas do quiz
  const submitQuiz = useCallback(async (respostas: Record<string, number>) => {
    if (!userId || !quizConfig) return null;

    try {
      setIsLoading(true);

      let acertos = 0;
      const totalPerguntas = quizConfig.perguntas.length;
      quizConfig.perguntas.forEach(pergunta => {
        if (respostas[pergunta.id] === pergunta.resposta_correta) acertos++;
      });

      const nota = Math.round((acertos / totalPerguntas) * 100);
      const aprovado = nota >= quizConfig.nota_minima;

      const { error: progressError } = await supabase
        .from('progresso_quiz')
        .upsert({
          usuario_id: userId,
          quiz_id: quizConfig.id,
          respostas: respostas,
          nota: nota,
          aprovado: aprovado,
          data_conclusao: new Date().toISOString()
        });

      if (progressError) throw progressError;

      if (aprovado && courseId) {
        await generateCertificate(nota);
      }

      setUserProgress({
        usuario_id: userId,
        quiz_id: quizConfig.id,
        respostas,
        nota,
        aprovado,
        data_conclusao: new Date().toISOString()
      });

      return { nota, aprovado };
    } catch (err) {
      console.error('Erro ao submeter quiz:', err);
      setError('Erro ao submeter respostas do quiz');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userId, quizConfig, courseId, generateCertificate]);

  // Verificar disponibilidade apenas ao montar (sem intervalo — evita abrir modal repetidamente)
  useEffect(() => {
    if (userId && courseId) {
      checkQuizAvailability();
    }
  }, [userId, courseId]);

  return {
    quizConfig,
    isLoading,
    error,
    isQuizAvailable,
    isCourseCompleted,
    userProgress,
    certificate,
    submitQuiz,
    generateCertificate,
    checkQuizAvailability
  };
}