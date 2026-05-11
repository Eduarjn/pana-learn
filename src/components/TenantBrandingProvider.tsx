// src/components/TenantBrandingProvider.tsx
import React from 'react';
import { useBrandingTenant } from '@/hooks/useBrandingTenant';
import { useTenantContext } from '@/context/TenantContext';

export function TenantBrandingProvider({ children }: { children: React.ReactNode }) {
  const { empresaId, isLoading } = useTenantContext();
  useBrandingTenant();

  if (empresaId && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
