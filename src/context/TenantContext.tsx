// src/context/TenantContext.tsx
import React, { createContext, useContext } from 'react';
import { useTenant, TenantContext } from '@/hooks/useTenant';
import { useAuth } from '@/hooks/useAuth';

interface TenantProviderValue {
  tenant: TenantContext | null;
  isLoading: boolean;
  empresaId: string | null;
}

const TenantCtx = createContext<TenantProviderValue>({
  tenant: null,
  isLoading: true,
  empresaId: null,
});

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { loading: authLoading } = useAuth();
  const { data: tenant, isLoading } = useTenant();

  return (
    <TenantCtx.Provider value={{
      tenant: tenant ?? null,
      isLoading: authLoading || isLoading,
      empresaId: tenant?.empresaId ?? null,
    }}>
      {children}
    </TenantCtx.Provider>
  );
}

export const useTenantContext = () => useContext(TenantCtx);
