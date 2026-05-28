import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresa } from '@/context/EmpresaContext';

export interface MonthlyUsage {
  totalMb: number;
  totalGb: string;        // formatted string e.g. "1.24 GB"
  totalWatchSeconds: number;
  totalWatchHours: string; // formatted string e.g. "12.5h"
  currentMonth: string;   // "Maio 2025"
}

/**
 * Aggregates video_usage_logs for the current calendar month.
 * Falls back to live aggregation when no pre-computed summary exists.
 */
export function useMonthlyUsage(targetEmpresaId?: string): { data: MonthlyUsage | null; isLoading: boolean } {
  const { empresa } = useEmpresa();
  const empresaId = targetEmpresaId ?? empresa?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['monthly-usage', empresaId],
    enabled: !!empresaId,
    staleTime: 120_000, // 2 minute cache
    queryFn: async (): Promise<MonthlyUsage> => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

      // Live aggregate from logs for current month
      const { data: logs } = await supabase
        .from('video_usage_logs')
        .select('watched_seconds, estimated_mb')
        .eq('empresa_id', empresaId!)
        .gte('created_at', monthStart)
        .lt('created_at', monthEnd);

      const totalMb = (logs ?? []).reduce((sum, r) => sum + (Number(r.estimated_mb) || 0), 0);
      const totalWatchSeconds = (logs ?? []).reduce((sum, r) => sum + (Number(r.watched_seconds) || 0), 0);
      const totalGb = totalMb < 1024
        ? `${totalMb.toFixed(0)} MB`
        : `${(totalMb / 1024).toFixed(2)} GB`;
      const hours = totalWatchSeconds / 3600;
      const totalWatchHours = hours < 1
        ? `${Math.round(totalWatchSeconds / 60)} min`
        : `${hours.toFixed(1)}h`;

      const monthName = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      const currentMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

      return { totalMb, totalGb, totalWatchSeconds, totalWatchHours, currentMonth };
    },
  });

  return { data: data ?? null, isLoading };
}
