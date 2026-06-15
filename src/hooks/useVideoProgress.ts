import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useVideoUsageLogger } from '@/hooks/useVideoUsageLogger';

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
  moduloId?: string,
  empresaId?: string   // optional — enables usage logging when present
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
  const lastLoggedSecondsRef = useRef<number>(0); // tracks usage delta for logging

  const { logUsage } = useVideoUsageLogger();

  // Carregar progresso existente
  useEffect(() => {
    if (!userId || !videoId || !cursoId) {
      setProgress(prev => ({ ...prev, loading: false }));
      return;
    }

    const loadProgress = async () => {
      try {
        console.log('🔍 Carregando progresso para:', { userId, videoId, cursoId });
        
        const { data, error } = await supabase
          .from('video_progress')
          .select('*')
          .eq('user_id', userId)
          .eq('video_id', videoId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('❌ Erro ao carregar progresso:', error);
          setProgress(prev => ({ ...prev, error: error.message, loading: false }));
          return;
        }

        if (data) {
          console.log('✅ Progresso carregado:', data);
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
          console.log('ℹ️ Nenhum progresso encontrado, criando novo...');
          setProgress(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error('❌ Erro ao carregar progresso:', error);
        setProgress(prev => ({ ...prev, error: 'Erro ao carregar progresso', loading: false }));
      }
    };

    loadProgress();
  }, [userId, videoId, cursoId]);

  // Salvar progresso do vídeo
  const saveProgress = useCallback(async (tempoAssistido: number, tempoTotal: number, concluido?: boolean) => {
    if (!userId || !videoId || !cursoId) {
      console.log('⚠️ Dados insuficientes para salvar progresso:', { userId, videoId, cursoId });
      return;
    }

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
      console.log('💾 Salvando progresso:', { tempoAssistido, tempoTotal, concluido });
      
      const progressData: Record<string, any> = {
        user_id: userId,
        video_id: videoId,
        curso_id: cursoId,
        tempo_assistido: Math.round(tempoAssistido),
        tempo_total: Math.round(tempoTotal),
        percentual_assistido: tempoTotal > 0 ? (tempoAssistido / tempoTotal) * 100 : 0,
        concluido: concluido ?? progress.concluido
      };
      // empresa_id para visibilidade do admin e integridade multi-tenant
      if (empresaId) progressData.empresa_id = empresaId;

      // Usar UPSERT (INSERT OR UPDATE) para evitar chave duplicada
      const result = await supabase
        .from('video_progress')
        .upsert(progressData, {
          onConflict: 'user_id,video_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (result.error) {
        console.error('❌ Erro ao salvar progresso:', result.error);
        setProgress(prev => ({ ...prev, error: result.error.message }));
        return;
      }

      if (result.data) {
        console.log('✅ Progresso salvo com sucesso:', result.data);
        setVideoProgressId(result.data.id);
        setProgress(prev => ({
          ...prev,
          tempoAssistido: result.data.tempo_assistido || 0,
          tempoTotal: result.data.tempo_total || 0,
          percentualAssistido: result.data.percentual_assistido || 0,
          concluido: result.data.concluido || false,
          dataConclusao: result.data.data_conclusao
        }));

        // ── Usage logging (fire-and-forget) ──────────────────────────
        if (empresaId && userId && videoId) {
          const currentSeconds = result.data.tempo_assistido || 0;
          const delta = currentSeconds - lastLoggedSecondsRef.current;
          if (delta >= 30) {
            lastLoggedSecondsRef.current = currentSeconds;
            logUsage({
              empresaId,
              userId,
              videoId,
              cursoId,
              watchedSeconds: delta,
            });
          }
        }
        // ─────────────────────────────────────────────────────────────
      }
    } catch (error) {
      console.error('❌ Erro ao salvar progresso:', error);
      setProgress(prev => ({ ...prev, error: 'Erro ao salvar progresso' }));
    }
  }, [userId, videoId, cursoId, progress.concluido, empresaId, logUsage]);

  // Marcar vídeo como concluído
  const markAsCompleted = useCallback(async () => {
    if (!userId || !videoId || !cursoId) return;

    try {
      console.log('🏁 Marcando vídeo como concluído');
      
      const result = await supabase
        .from('video_progress')
        .upsert({
          user_id: userId,
          video_id: videoId,
          curso_id: cursoId,
          concluido: true,
          data_conclusao: new Date().toISOString()
        }, {
          onConflict: 'user_id,video_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (result.error) {
        console.error('❌ Erro ao marcar como concluído:', result.error);
        return;
      }

      if (result.data) {
        console.log('✅ Vídeo marcado como concluído:', result.data);
        setProgress(prev => ({
          ...prev,
          concluido: true,
          dataConclusao: result.data.data_conclusao
        }));
      }
    } catch (error) {
      console.error('❌ Erro ao marcar como concluído:', error);
    }
  }, [userId, videoId, cursoId]);

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