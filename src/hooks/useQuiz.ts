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
  nota_final: number | null;
  numero_certificado: string | null;
  data_emissao: string;
  data_criacao: string;
  link_pdf_certificado: string | null;
  empresa_id: string | null;
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

      // 1. Buscar quizzes vinculados via curso_quiz_mapping
      const { data: mappings } = await supabase
        .from('curso_quiz_mapping')
        .select('quiz_id')
        .eq('curso_id', courseId);

      if (!mappings || mappings.length === 0) {
        // Curso sem quiz vinculado — silently skip
        setIsQuizAvailable(false);
        return;
      }

      // Usar o primeiro quiz como padrão
      const mapping = mappings[0];

      // 2. Verificar progresso dos vídeos (para informação, mas não bloquear quiz)
      const { data: allVideos } = await supabase
        .from('videos')
        .select('id')
        .eq('curso_id', courseId);

      if (allVideos && allVideos.length > 0) {
        const videoIds = allVideos.map(v => v.id);
        const { data: progressRows } = await supabase
          .from('video_progress')
          .select('video_id, concluido, percentual_assistido')
          .eq('user_id', userId)
          .in('video_id', videoIds);

        const completedCount = (progressRows || []).filter(
          p => p.concluido === true || (p.percentual_assistido ?? 0) >= 90
        ).length;

        setIsCourseCompleted(completedCount >= allVideos.length);
      } else {
        setIsCourseCompleted(false);
      }

      // 3. Sempre carregar o quiz quando vinculado (sem bloquear por vídeos)
      await loadQuizByFinalQuizId(mapping.quiz_id);
    } catch (err) {
      console.error('Erro ao verificar disponibilidade do quiz:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, courseId, loadQuizByFinalQuizId]);

  // Gerar certificado — insere directamente na tabela certificados
  const generateCertificate = useCallback(async (nota: number) => {
    if (!userId || !courseId) return;
    try {
      // Evitar duplicata: verificar se já existe
      const { data: existing } = await supabase
        .from('certificados')
        .select('id')
        .eq('usuario_id', userId)
        .eq('curso_id', courseId)
        .maybeSingle();

      if (existing) {
        // Já existe — recarregar e retornar
        const { data: certData } = await supabase
          .from('certificados')
          .select('*')
          .eq('id', existing.id)
          .single();
        if (certData) setCertificate(certData as any);
        return;
      }

      // Buscar empresa_id do usuário (necessário para RLS multi-tenant)
      const { data: userData } = await supabase
        .from('usuarios')
        .select('empresa_id, nome')
        .eq('id', userId)
        .single();

      // Buscar nome, categoria e template do curso (campos NOT NULL no banco)
      // Tenta incluir template_id; se a coluna não existir, faz fallback sem ela.
      let cursoData: any = null;
      let cursoTemplateId: string | null = null;
      {
        const withTemplate = await supabase
          .from('cursos')
          .select('nome, categoria, template_id')
          .eq('id', courseId)
          .single();
        if (!withTemplate.error) {
          cursoData = withTemplate.data;
          cursoTemplateId = (withTemplate.data as any)?.template_id || null;
        } else {
          // Coluna template_id ainda não existe — buscar só os campos básicos
          const basic = await supabase
            .from('cursos')
            .select('nome, categoria')
            .eq('id', courseId)
            .single();
          cursoData = basic.data;
        }
      }

      // Prioridade do template: (1) coluna do curso no banco → (2) localStorage → (3) padrão
      let templateId: string | null = cursoTemplateId;
      if (!templateId && courseId) {
        const savedTemplateId = localStorage.getItem(`curso_template_${courseId}`);
        if (savedTemplateId) templateId = savedTemplateId;
      }
      if (!templateId) {
        const { data: defaultTemplate } = await supabase
          .from('certificate_templates')
          .select('id')
          .eq('is_default', true)
          .maybeSingle();
        templateId = defaultTemplate?.id || null;
      }

      // Gerar número único: CERT-YYYYMMDD-XXXXX
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
      const numeroCertificado = `CERT-${dateStr}-${rand}`;

      const insertPayload: Record<string, any> = {
        usuario_id: userId,
        curso_id: courseId,
        nota_final: nota,
        nota: nota,
        numero_certificado: numeroCertificado,
        data_emissao: now.toISOString(),
        empresa_id: userData?.empresa_id || null,
        curso_nome: cursoData?.nome || 'Curso',
        categoria: cursoData?.categoria || 'Geral',
        status: 'ativo',
        template_id: templateId,
        carga_horaria: 0,
        aproveitamento: nota,
      };

      const { data: newCert, error: insertError } = await supabase
        .from('certificados')
        .insert(insertPayload as any)
        .select()
        .single();

      if (insertError) {
        console.error('Erro ao inserir certificado:', insertError);
        return;
      }

      if (newCert) {
        setCertificate(newCert as any);
        console.log('✅ Certificado gerado:', newCert);
      }
    } catch (err) {
      console.error('Erro ao gerar certificado:', err);
    }
  }, [userId, courseId]);

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

      // NÃO gerar certificado aqui — a lógica centralizada em
      // checkAndGenerateCertificate (CursoDetalhe) verifica se TODOS
      // os quizzes foram aprovados antes de emitir o certificado.

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
    checkQuizAvailability,
    loadQuizByFinalQuizId
  };
}