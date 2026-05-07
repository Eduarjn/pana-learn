// src/components/TenantBrandingProvider.tsx
// Wrapper que aplica branding do tenant assim que usuário loga

import React from 'react';
import { useBranding } from '@/hooks/useBranding';
import { useTenantContext } from '@/context/TenantContext';

export function TenantBrandingProvider({ children }: { children: React.ReactNode }) {
  const { empresaId } = useTenantContext();
  const branding = useBranding();

  // Enquanto carrega o branding, mostrar spinner
  if (empresaId && !branding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
