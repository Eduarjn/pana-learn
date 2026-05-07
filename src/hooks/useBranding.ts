// src/hooks/useBranding.ts
// Carrega o branding do tenant atual e aplica CSS vars globais

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantContext } from '@/context/TenantContext';

export function useBranding() {
  const { empresaId } = useTenantContext();

  const { data: branding } = useQuery({
    queryKey: ['branding', empresaId],
    enabled: !!empresaId,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('branding_config')
        .select('*')
        .eq('empresa_id', empresaId!)
        .single();
      return data as any;
    },
  });

  // Aplicar CSS vars globais quando o branding carregar
  useEffect(() => {
    if (!branding) return;
    const root = document.documentElement;
    root.style.setProperty('--color-primary', branding.primary_color || '#22c55e');
    root.style.setProperty('--color-secondary', branding.secondary_color || '#14213D');

    // Atualizar favicon dinamicamente
    if (branding.favicon_url) {
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (link) link.href = branding.favicon_url;
    }

    // Atualizar title da página
    if (branding.company_name) {
      document.title = branding.company_name;
    }
  }, [branding]);

  return branding;
}
