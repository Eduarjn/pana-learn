import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface QuizAudio {
  id: string;
  nome: string;
  descricao: string | null;
  audio_url: string;
  duracao_segundos: number | null;
  tamanho_bytes: number | null;
  tipo_mime: string | null;
  categoria: string | null;
  empresa_id: string | null;
  criado_por: string | null;
  data_criacao: string;
  data_atualizacao: string;
}

export interface CreateAudioInput {
  nome: string;
  descricao?: string;
  audio_url: string;
  duracao_segundos?: number;
  tamanho_bytes?: number;
  tipo_mime?: string;
  categoria?: string;
}

export function useQuizAudios() {
  const [audios, setAudios] = useState<QuizAudio[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadAudios = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase
        .from('quiz_audios' as any)
        .select('*')
        .order('data_criacao', { ascending: false }) as any);

      if (error) throw error;
      setAudios((data || []) as QuizAudio[]);
    } catch (err) {
      console.error('Erro ao carregar áudios:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadAudioFile = useCallback(async (file: File, metadata: { nome: string; descricao?: string; categoria?: string }) => {
    setUploading(true);
    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `audios/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('quiz-audio')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('quiz-audio')
        .getPublicUrl(filePath);

      const audioUrl = urlData.publicUrl;

      // Insert metadata into quiz_audios
      const { data, error } = await (supabase
        .from('quiz_audios' as any)
        .insert({
          nome: metadata.nome,
          descricao: metadata.descricao || null,
          audio_url: audioUrl,
          tamanho_bytes: file.size,
          tipo_mime: file.type,
          categoria: metadata.categoria || null,
        })
        .select()
        .single() as any);

      if (error) throw error;

      setAudios(prev => [data as QuizAudio, ...prev]);
      return data as QuizAudio;
    } catch (err) {
      console.error('Erro ao fazer upload:', err);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  const addAudioByUrl = useCallback(async (input: CreateAudioInput) => {
    try {
      const { data, error } = await (supabase
        .from('quiz_audios' as any)
        .insert({
          nome: input.nome,
          descricao: input.descricao || null,
          audio_url: input.audio_url,
          duracao_segundos: input.duracao_segundos || null,
          tamanho_bytes: input.tamanho_bytes || null,
          tipo_mime: input.tipo_mime || 'audio/mpeg',
          categoria: input.categoria || null,
        })
        .select()
        .single() as any);

      if (error) throw error;

      setAudios(prev => [data as QuizAudio, ...prev]);
      return data as QuizAudio;
    } catch (err) {
      console.error('Erro ao adicionar áudio:', err);
      throw err;
    }
  }, []);

  const deleteAudio = useCallback(async (audioId: string) => {
    try {
      const audio = audios.find(a => a.id === audioId);

      const { error } = await (supabase
        .from('quiz_audios' as any)
        .delete()
        .eq('id', audioId) as any);

      if (error) throw error;

      // Try to delete from storage if it's a Supabase URL
      if (audio?.audio_url?.includes('quiz-audio')) {
        const path = audio.audio_url.split('/quiz-audio/')[1];
        if (path) {
          await supabase.storage.from('quiz-audio').remove([path]);
        }
      }

      setAudios(prev => prev.filter(a => a.id !== audioId));
    } catch (err) {
      console.error('Erro ao excluir áudio:', err);
      throw err;
    }
  }, [audios]);

  const updateAudio = useCallback(async (audioId: string, updates: { nome?: string; descricao?: string; categoria?: string }) => {
    try {
      const { data, error } = await (supabase
        .from('quiz_audios' as any)
        .update(updates)
        .eq('id', audioId)
        .select()
        .single() as any);

      if (error) throw error;

      setAudios(prev => prev.map(a => a.id === audioId ? (data as QuizAudio) : a));
      return data as QuizAudio;
    } catch (err) {
      console.error('Erro ao atualizar áudio:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    loadAudios();
  }, [loadAudios]);

  return {
    audios,
    loading,
    uploading,
    loadAudios,
    uploadAudioFile,
    addAudioByUrl,
    deleteAudio,
    updateAudio,
  };
}
