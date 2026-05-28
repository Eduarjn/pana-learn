import { useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ── Bandwidth estimates per resolution ───────────────────────────────────────
// MB per minute of video
const MB_PER_MINUTE: Record<string, number> = {
  '480p':  2,   //  ~2 MB/min
  '720p':  4,   //  ~4 MB/min
  '1080p': 8,   //  ~8 MB/min
  default: 4,   // assume 720p when unknown
};

function estimateMb(watchedSeconds: number, resolution = 'default'): number {
  const mbPerMin = MB_PER_MINUTE[resolution] ?? MB_PER_MINUTE.default;
  return (watchedSeconds / 60) * mbPerMin;
}

interface LogUsageParams {
  empresaId: string;
  userId: string;
  videoId: string;
  cursoId?: string;
  watchedSeconds: number;
  resolution?: string;
}

/**
 * Lightweight fire-and-forget hook for logging video usage.
 * Debounced: only fires when ≥30 seconds have elapsed since last log.
 * Never throws — errors are swallowed to avoid impacting the player.
 */
export function useVideoUsageLogger() {
  const lastLogTimeRef = useRef<Record<string, number>>({});  // keyed by videoId

  const logUsage = useCallback(async ({
    empresaId,
    userId,
    videoId,
    cursoId,
    watchedSeconds,
    resolution = 'default',
  }: LogUsageParams) => {
    if (!empresaId || !userId || !videoId || watchedSeconds <= 0) return;

    // Debounce: skip if last log for this video was < 30 seconds ago
    const key = `${userId}-${videoId}`;
    const now = Date.now();
    const lastLog = lastLogTimeRef.current[key] ?? 0;
    if (now - lastLog < 30_000) return;
    lastLogTimeRef.current[key] = now;

    const estimated_mb = estimateMb(watchedSeconds, resolution);

    // Fire and forget — no await in calling code
    supabase
      .from('video_usage_logs')
      .insert({
        empresa_id: empresaId,
        user_id: userId,
        video_id: videoId,
        curso_id: cursoId ?? null,
        watched_seconds: Math.round(watchedSeconds),
        estimated_mb: Math.round(estimated_mb * 100) / 100,
      })
      .then(({ error }) => {
        if (error) console.warn('[useVideoUsageLogger] log failed silently:', error.message);
      });
  }, []);

  return { logUsage };
}
