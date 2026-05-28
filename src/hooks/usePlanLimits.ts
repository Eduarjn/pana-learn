import { useCallback, useMemo } from 'react';
import { useEmpresa } from '@/context/EmpresaContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ── Plan configuration ────────────────────────────────────────────────────────
export const PLAN_CONFIG: Record<string, { label: string; maxUsers: number; color: string }> = {
  trial:      { label: 'Trial',      maxUsers: 5,    color: '#6B7280' },
  starter:    { label: 'Starter',    maxUsers: 40,   color: '#3B82F6' },
  pro:        { label: 'Pro',        maxUsers: 180,  color: '#7C3AED' },
  enterprise: { label: 'Enterprise', maxUsers: 9999, color: '#059669' },
};

export interface PlanLimits {
  planKey: string;
  planName: string;
  planColor: string;
  maxUsers: number;
  currentUsers: number;
  usagePercent: number;    // 0-100
  isAtLimit: boolean;      // >= 100%
  isNearLimit: boolean;    // >= 80% but < 100%
  remainingSlots: number;
}

export function usePlanLimits(overrideEmpresa?: { id: string; plan?: string | null }): { data: PlanLimits | null; isLoading: boolean } {
  const { empresa: contextEmpresa } = useEmpresa();
  const targetEmpresa = overrideEmpresa ?? contextEmpresa;

  const { data, isLoading } = useQuery({
    queryKey: ['plan-limits', targetEmpresa?.id, targetEmpresa?.plan],
    enabled: !!targetEmpresa?.id,
    staleTime: 60_000, // refresh every minute
    queryFn: async (): Promise<PlanLimits> => {
      const planKey = (targetEmpresa?.plan ?? 'trial').toLowerCase();
      const config = PLAN_CONFIG[planKey] ?? PLAN_CONFIG.trial;

      // Count active users for this empresa
      const { count } = await supabase
        .from('usuarios')
        .select('id', { count: 'exact', head: true })
        .eq('empresa_id', targetEmpresa!.id)
        .eq('status', 'ativo');

      const currentUsers = count ?? 0;
      const maxUsers = config.maxUsers;
      const usagePercent = maxUsers >= 9999 ? 0 : Math.min(100, Math.round((currentUsers / maxUsers) * 100));

      return {
        planKey,
        planName: config.label,
        planColor: config.color,
        maxUsers,
        currentUsers,
        usagePercent,
        isAtLimit: maxUsers < 9999 && currentUsers >= maxUsers,
        isNearLimit: maxUsers < 9999 && usagePercent >= 80 && currentUsers < maxUsers,
        remainingSlots: Math.max(0, maxUsers - currentUsers),
      };
    },
  });

  return { data: data ?? null, isLoading };
}
