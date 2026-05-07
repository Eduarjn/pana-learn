// src/context/TenantContext.tsx
// Provider global do tenant — envolve toda a app

import React, { createContext, useContext, useEffect } from 'react';
import { useTenant, TenantContext } from '@/hooks/useTenant';
import { useNavigate, useLocation } from 'react-router-dom';
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

// Rotas que não precisam de tenant (públicas / onboarding)
const PUBLIC_PATHS = ['/', '/login', '/onboarding', '/reset-password', '/index'];

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { data: tenant, isLoading } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (authLoading || isLoading) return;

    // Não redirecionar se estiver em rota pública
    const isPublicPath = PUBLIC_PATHS.some(p =>
      location.pathname === p || location.pathname.startsWith('/onboarding')
    );
    if (isPublicPath) return;

    // Usuário logado mas sem empresa → precisa completar onboarding
    if (user && !tenant) {
      navigate('/onboarding');
      return;
    }

    // Plano expirado ou cancelado → redirecionar para reativação
    if (tenant && !tenant.isPlanActive && tenant.planStatus !== 'pending') {
      navigate('/plano-expirado');
    }
  }, [user, tenant, authLoading, isLoading, navigate, location.pathname]);

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
