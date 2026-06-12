import { useAuth } from '@/hooks/useAuth';
import { AuthForm } from '@/components/AuthForm';
import { Loader2 } from 'lucide-react';
import { useLocation, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

type TenantGate =
  | { state: 'loading' }
  | { state: 'no-tenant' }              // user sem empresa → onboarding
  | { state: 'onboarding-pending' }     // tem empresa mas não completou
  | { state: 'payment-pending' }        // completou mas sem trial/active
  | { state: 'ok' };

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const [gate, setGate] = useState<TenantGate>({ state: 'loading' });

  // Tentar usar useAuth com tratamento de erro
  let user = null;
  let userProfile = null;
  let loading = true;

  try {
    const auth = useAuth();
    user = auth.user;
    userProfile = auth.userProfile;
    loading = auth.loading;
  } catch (error) {
    console.log('AuthProvider ainda não está disponível, aguardando...');
    // Retornar loading enquanto o AuthProvider não estiver disponível
    return (
      <div className="min-h-screen flex items-center justify-center hero-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-era-green" />
          <p className="text-white">Carregando...</p>
        </div>
      </div>
    );
  }

  console.log('🛡️ ProtectedRoute - Estado:', {
    user: user?.email,
    userProfile: userProfile?.nome,
    loading,
    pathname: location.pathname,
    status: user ? 'authenticated' : 'unauthenticated'
  });

  const isAdminMaster = userProfile?.tipo_usuario === 'admin_master';
  const isOnboardingPath = location.pathname.startsWith('/onboarding');

  // Verificar status do tenant (onboarding + plano)
  useEffect(() => {
    if (!user || isAdminMaster || isOnboardingPath) {
      setGate({ state: 'ok' });
      return;
    }

    let cancelled = false;
    (async () => {
      setGate({ state: 'loading' });
      const { data, error } = await supabase
        .from('usuarios')
        .select('empresa_id, empresas:empresa_id (onboarding_completed, plan_status)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cancelled) return;

      // Supabase pode devolver o relacionamento como objeto ou array de 1
      const raw = (data as any)?.empresas;
      const empresa = Array.isArray(raw) ? raw[0] : raw;

      if (error || !data?.empresa_id || !empresa) {
        setGate({ state: 'no-tenant' });
        return;
      }
      if (!empresa.onboarding_completed) {
        setGate({ state: 'onboarding-pending' });
        return;
      }
      if (empresa.plan_status !== 'trial' && empresa.plan_status !== 'active') {
        setGate({ state: 'payment-pending' });
        return;
      }
      setGate({ state: 'ok' });
    })();

    return () => { cancelled = true; };
  }, [user?.id, isAdminMaster, isOnboardingPath]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center hero-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-era-green" />
          <p className="text-white">Carregando...</p>
        </div>
      </div>
    );
  }

  // Permitir acesso se houver usuário autenticado
  if (!user && !userProfile) {
    return (
      <div className="hero-background min-h-screen relative">
        <div className="absolute inset-0 bg-black/20"></div>
        <AuthForm />
      </div>
    );
  }

  // Verificar permissões para páginas restritas a administradores
  const adminOnlyPaths = ['/usuarios']; // Removido /relatorios para permitir acesso
  const isAdminOnlyPath = adminOnlyPaths.includes(location.pathname);
  const isAdmin = userProfile?.tipo_usuario === 'admin' || userProfile?.tipo_usuario === 'admin_master';

  if (isAdminOnlyPath && !isAdmin) {
    console.log('🚫 Acesso negado - Usuário não é admin para', location.pathname);
    return <Navigate to="/dashboard" replace />;
  }

  // Gate de onboarding/pagamento (admin_master e rotas /onboarding/* já saem como 'ok' acima)
  if (gate.state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center hero-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-era-green" />
          <p className="text-white">Carregando...</p>
        </div>
      </div>
    );
  }
  if (gate.state === 'no-tenant' || gate.state === 'onboarding-pending') {
    return <Navigate to="/onboarding" replace />;
  }
  if (gate.state === 'payment-pending') {
    return <Navigate to="/onboarding/pagamento" replace />;
  }

  return <>{children}</>;
}
