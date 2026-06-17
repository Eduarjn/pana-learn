import { useAuth } from '@/hooks/useAuth';
import { AuthForm } from '@/components/AuthForm';
import { PanaLoader } from '@/components/ui/pana-loader';
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
  | { state: 'suspended' }              // empresa desativada pelo admin_master
  | { state: 'ok' };

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const [gate, setGate] = useState<TenantGate>({ state: 'loading' });
  const { user, userProfile, loading } = useAuth();

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
        .select('empresa_id, empresas:empresa_id (onboarding_completed, plan_status, active)')
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
      // Empresa desativada pelo admin_master → bloqueia o acesso de todos os
      // usuários dela (exceto admin_master, que já saiu como 'ok' no topo).
      if (empresa.active === false) {
        setGate({ state: 'suspended' });
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
      <div className="min-h-screen flex items-center justify-center bg-pana-bg">
        <PanaLoader label="Carregando..." />
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
    return <Navigate to="/dashboard" replace />;
  }

  // Gate de onboarding/pagamento (admin_master e rotas /onboarding/* já saem como 'ok' acima)
  if (gate.state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pana-bg">
        <PanaLoader label="Carregando..." />
      </div>
    );
  }
  if (gate.state === 'suspended') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pana-bg font-inter px-6">
        <div className="max-w-md text-center">
          <div className="w-14 h-14 rounded-2xl bg-pana-petal-soft mx-auto mb-5 flex items-center justify-center">
            <span className="text-2xl">🔒</span>
          </div>
          <h1 className="font-quicksand font-bold text-2xl text-pana-indigo mb-2">Acesso suspenso</h1>
          <p className="text-sm text-muted-foreground mb-6">
            O acesso da sua organização à plataforma foi temporariamente desativado.
            Entre em contato com o suporte para regularizar.
          </p>
          <a
            href="mailto:mipanalearn@gmail.com"
            className="inline-flex items-center justify-center h-11 px-6 rounded-lg bg-pana-teal text-white font-medium hover:bg-pana-teal-dark transition-colors"
          >
            Falar com o suporte
          </a>
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
