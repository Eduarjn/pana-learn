// src/hooks/useTenant.ts
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
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      // Buscar organização do usuário
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('owner_id', user!.id)
        .single();

      // Buscar perfil do usuário
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (orgError || !org) {
        // Sem organização = ainda não fez onboarding
        return null;
      }

      return {
        empresaId: (org as any).id,
        organizationId: (org as any).id,
        subdominio: (org as any).domain || '',
        empresaNome: (org as any).name,
        plan: ((org as any).plan || 'trial') as TenantContext['plan'],
        planStatus: ((org as any).plan_status || 'pending') as TenantContext['planStatus'],
        corPrimaria: (org as any).primary_color || '#22c55e',
        logoUrl: (org as any).logo_url,
        onboardingCompleted: (org as any).onboarding_completed || false,
        trialEndDate: (org as any).trial_end_date,
        tipoUsuario: (usuario?.tipo_usuario || 'admin') as TenantContext['tipoUsuario'],
        usuarioInternoId: usuario?.id || user!.id,
        usuarioNome: usuario?.nome || user!.email || '',
        isAdmin: ['admin', 'admin_master'].includes(usuario?.tipo_usuario || 'admin'),
        isAdminMaster: usuario?.tipo_usuario === 'admin_master',
        isPlanActive: ['active', 'trial'].includes((org as any).plan_status || ''),
        isInTrial: (org as any).plan_status === 'trial',
      };
    },
  });
}
