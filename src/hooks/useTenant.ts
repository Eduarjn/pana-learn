// src/hooks/useTenant.ts
// Hook central que provê o contexto do tenant para toda a aplicação

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface TenantContext {
  empresaId: string;
  organizationId: string;
  subdominio: string;
  empresaNome: string;
  plan: 'trial' | 'starter' | 'pro' | 'enterprise';
  planStatus: 'pending' | 'trial' | 'active' | 'cancelled' | 'expired';
  corPrimaria: string;
  logoUrl: string | null;
  onboardingCompleted: boolean;
  trialEndDate: string | null;
  tipoUsuario: 'admin_master' | 'admin' | 'comercial' | 'cliente';
  usuarioInternoId: string;
  usuarioNome: string;
  isAdmin: boolean;
  isAdminMaster: boolean;
  isPlanActive: boolean;
  isInTrial: boolean;
}

export function useTenant() {
  const { user } = useAuth();

  return useQuery<TenantContext | null>({
    queryKey: ['tenant', user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos
    queryFn: async () => {
      const { data, error } = await supabase
        .from('current_tenant')
        .select('*')
        .single();

      if (error || !data) return null;

      const row = data as any;

      return {
        empresaId: row.empresa_id,
        organizationId: row.organization_id,
        subdominio: row.subdominio,
        empresaNome: row.empresa_nome,
        plan: row.plan as TenantContext['plan'],
        planStatus: row.plan_status as TenantContext['planStatus'],
        corPrimaria: row.cor_primaria || '#22c55e',
        logoUrl: row.logo_url,
        onboardingCompleted: row.onboarding_completed,
        trialEndDate: row.trial_end_date,
        tipoUsuario: row.tipo_usuario as TenantContext['tipoUsuario'],
        usuarioInternoId: row.usuario_interno_id,
        usuarioNome: row.usuario_nome,
        isAdmin: ['admin', 'admin_master'].includes(row.tipo_usuario),
        isAdminMaster: row.tipo_usuario === 'admin_master',
        isPlanActive: ['active', 'trial'].includes(row.plan_status),
        isInTrial: row.plan_status === 'trial',
      };
    },
  });
}
