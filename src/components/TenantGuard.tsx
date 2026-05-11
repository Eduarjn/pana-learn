// src/components/TenantGuard.tsx
import { Navigate } from 'react-router-dom';
import { useTenantContext } from '@/context/TenantContext';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function TenantGuard({ children, requireAdmin = false }: Props) {
  const { user, loading } = useAuth();
  const { tenant, isLoading } = useTenantContext();

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!tenant) return <Navigate to="/onboarding" replace />;
  if (!tenant.isPlanActive && tenant.planStatus !== 'pending') {
    return <Navigate to="/plano-expirado" replace />;
  }
  if (requireAdmin && !tenant.isAdmin) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
