import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type VideoProgress = Database['public']['Tables']['video_progress']['Row'];

export interface VideoProgressState {
  tempoAssistido: number;
  tempoTotal: number;
  percentualAssistido: number;
  concluido: boolean;
  dataConclusao: string | null;
  loading: boolean;
  error: string | null;
}

export function useVideoProgress(
  userId: string | undefined,
  videoId: string | undefined,
  cursoId: string | undefined,
  moduloId?: string
) {
  const [progress, setProgress] = useState<VideoProgressState>({
    tempoAssistido: 0,
    tempoTotal: 0,
    percentualAssistido: 0,
    concluido: false,
    dataConclusao: null,
    loading: true,
    error: null
  });

  const [videoProgressId, setVideoProgressId] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveTimeRef = useRef<number>(0);

  // Carregar progresso existente
  useEffect(() => {
    if (!userId || !videoId || !cursoId) {
      setProgress(prev => ({ ...prev, loading: false }));
      return;
    }

    const loadProgress = async () => {
      try {
        const { data, error } = await supabase
          .from('video_progress')
          .select('*')
          .eq('usuario_id', userId)
          .eq('video_id', videoId)
          .eq('curso_id', cursoId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao carregar progresso:', error);
          setProgress(prev => ({ ...prev, error: error.message, loading: false }));
          return;
        }

        if (data) {
          setVideoProgressId(data.id);
          setProgress({
            tempoAssistido: data.tempo_assistido || 0,
            tempoTotal: data.tempo_total || 0,
            percentualAssistido: data.percentual_assistido || 0,
            concluido: data.concluido || false,
            dataConclusao: data.data_conclusao,
            loading: false,
            error: null
          });
        } else {
          setProgress(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error('Erro ao carregar progresso:', error);
        setProgress(prev => ({ ...prev, error: 'Erro ao carregar progresso', loading: false }));
      }
    };

    loadProgress();
  }, [userId, videoId, cursoId]);

  // Salvar progresso com debounce
  const saveProgress = useCallback(async (
    tempoAssistido: number,
    tempoTotal: number,
    concluido?: boolean
  ) => {
    if (!userId || !videoId || !cursoId) return;

    // Debounce: salvar no máximo a cada 2 segundos
    const now = Date.now();
    if (now - lastSaveTimeRef.current < 2000) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        saveProgress(tempoAssistido, tempoTotal, concluido);
      }, 2000);
      return;
    }

    lastSaveTimeRef.current = now;

    try {
      const progressData = {
        usuario_id: userId,
        video_id: videoId,
        curso_id: cursoId,
        modulo_id: moduloId,
        tempo_assistido: tempoAssistido,
        tempo_total: tempoTotal,
        concluido: concluido ?? progress.concluido
      };

      let result;
      if (videoProgressId) {
        // Atualizar progresso existente
        result = await supabase
          .from('video_progress')
          .update(progressData)
          .eq('id', videoProgressId)
          .select()
          .single();
      } else {
        // Criar novo progresso
        result = await supabase
          .from('video_progress')
          .insert(progressData)
          .select()
          .single();
        
        if (result.data) {
          setVideoProgressId(result.data.id);
        }
      }

      if (result.error) {
        console.error('Erro ao salvar progresso:', result.error);
        setProgress(prev => ({ ...prev, error: result.error.message }));
        return;
      }

      if (result.data) {
        setProgress(prev => ({
          ...prev,
          tempoAssistido: result.data.tempo_assistido || 0,
          tempoTotal: result.data.tempo_total || 0,
          percentualAssistido: result.data.percentual_assistido || 0,
          concluido: result.data.concluido || false,
          dataConclusao: result.data.data_conclusao
        }));
      }
    } catch (error) {
      console.error('Erro ao salvar progresso:', error);
      setProgress(prev => ({ ...prev, error: 'Erro ao salvar progresso' }));
    }
  }, [userId, videoId, cursoId, moduloId, videoProgressId, progress.concluido]);

  // Marcar vídeo como concluído
  const markAsCompleted = useCallback(async () => {
    if (!userId || !videoId || !cursoId) return;

    try {
      const progressData = {
        usuario_id: userId,
        video_id: videoId,
        curso_id: cursoId,
        modulo_id: moduloId,
        concluido: true,
        data_conclusao: new Date().toISOString()
      };

      let result;
      if (videoProgressId) {
        result = await supabase
          .from('video_progress')
          .update(progressData)
          .eq('id', videoProgressId)
          .select()
          .single();
      } else {
        result = await supabase
          .from('video_progress')
          .insert(progressData)
          .select()
          .single();
        
        if (result.data) {
          setVideoProgressId(result.data.id);
        }
      }

      if (result.error) {
        console.error('Erro ao marcar como concluído:', result.error);
        return;
      }

      if (result.data) {
        setProgress(prev => ({
          ...prev,
          concluido: true,
          dataConclusao: result.data.data_conclusao
        }));
      }
    } catch (error) {
      console.error('Erro ao marcar como concluído:', error);
    }
  }, [userId, videoId, cursoId, moduloId, videoProgressId]);

  // Limpar timeout ao desmontar
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    progress,
    saveProgress,
    markAsCompleted,
    loading: progress.loading,
    error: progress.error
  };
} 