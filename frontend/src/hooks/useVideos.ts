import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VideoFile {
  id: string;
  title: string;
  /** Mantido por compatibilidade – agora contém o guid Bunny ou vazio. */
  path: string;
  thumbnailUrl: string;
  duration: number;
  /** URL de reprodução: Bunny CDN (novos) ou URL legada do Supabase Storage. */
  url: string;
}

/**
 * Busca vídeos directamente da tabela `videos` do Supabase.
 *
 * Os ficheiros de vídeo já não residem no Supabase Storage; o campo
 * `url_video` da tabela contém a URL definitiva (Bunny CDN ou legada).
 * O campo `thumbnail_url` continua a ser uma URL pública do Supabase Storage.
 */
export function useVideos(cursoId?: string) {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVideos() {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("videos")
        .select("id, titulo, url_video, thumbnail_url, duracao, curso_id")
        .order("ordem", { ascending: true });

      // Filtro opcional por curso
      if (cursoId) {
        query = query.eq("curso_id", cursoId);
      }

      const { data, error: dbError } = await query;

      if (dbError) {
        setError(dbError.message);
        console.error("❌ useVideos – erro na query:", dbError);
        setLoading(false);
        return;
      }

      const mapped: VideoFile[] = (data ?? []).map((row) => ({
        id: row.id,
        title: row.titulo ?? "",
        path: row.url_video ?? "",  // mantido por compatibilidade
        thumbnailUrl: row.thumbnail_url ?? "",
        duration: row.duracao ?? 0,
        url: row.url_video ?? "",
      }));

      setVideos(mapped);
      setLoading(false);
    }

    fetchVideos();
  }, [cursoId]);

  return { videos, loading, error };
}