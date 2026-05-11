// src/hooks/useBrandingTenant.ts
import { useEffect } from 'react';
import { useTenantContext } from '@/context/TenantContext';

export function useBrandingTenant() {
  const { tenant } = useTenantContext();

  useEffect(() => {
    if (!tenant) return;
    const root = document.documentElement;
    root.style.setProperty('--color-primary', tenant.corPrimaria || '#22c55e');
    if (tenant.empresaNome) {
      document.title = tenant.empresaNome;
    }
  }, [tenant]);

  return tenant ? {
    primary_color: tenant.corPrimaria,
    logo_url: tenant.logoUrl,
    company_name: tenant.empresaNome,
  } : null;
}
