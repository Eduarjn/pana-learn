import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';

type Empresa = Database['public']['Tables']['empresas']['Row'];

interface EmpresaContextType {
  empresa: Empresa | null; // A empresa atual no contexto (do usuário ou simulada pelo admin)
  loading: boolean;
  isViewingClient: boolean;
  currentUserType: string;
  refreshEmpresa: () => void;
}

const EmpresaContext = createContext<EmpresaContextType | undefined>(undefined);

export function EmpresaProvider({ children }: { children: ReactNode }) {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [isViewingClient, setIsViewingClient] = useState(false);
  const [currentUserType, setCurrentUserType] = useState<string>('');
  
  const location = useLocation();
  const auth = useAuth(); // para escutar mudanças de login

  const fetchEmpresaData = async (empresaId: string) => {
    try {
      const { data } = await supabase.from('empresas').select('*').eq('id', empresaId).single();
      if (data) {
        setEmpresa(data);
      } else {
        setEmpresa(null);
      }
    } catch (e) {
      console.error('Erro ao carregar empresa:', e);
      setEmpresa(null);
    }
  };

  const refreshEmpresa = () => {
    if (empresa?.id) {
      fetchEmpresaData(empresa.id);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initEmpresaContext = async () => {
      if (mounted) setLoading(true);

      try {
        const isClientRoute = location.pathname.includes('/empresa/');
        if (mounted) setIsViewingClient(isClientRoute);

        // 1. Obter o auth.user atual diretamente do Supabase para garantir a sessão mais fresca
        const { data: authData } = await supabase.auth.getUser();
        const authUser = authData.user;

        if (!authUser) {
          if (mounted) {
            setEmpresa(null);
            setLoading(false);
          }
          return;
        }

        // 2. Buscar dados do usuário (obrigatoriamente cobrindo user_id e id conforme solicitado)
        const { data: usuario } = await supabase
          .from('usuarios')
          .select('empresa_id, tipo_usuario')
          .or(`user_id.eq.${authUser.id},id.eq.${authUser.id}`)
          .single();

        if (mounted && usuario?.tipo_usuario) {
          setCurrentUserType(usuario.tipo_usuario);
        }

        // 3. Determinar qual empresa carregar
        if (isClientRoute && usuario?.tipo_usuario === 'admin_master') {
          // Admin master simulando visão de cliente
          const empresaIdDaRota = location.pathname.split('/empresa/')[1];
          if (empresaIdDaRota) {
            await fetchEmpresaData(empresaIdDaRota);
          }
        } else if (usuario?.empresa_id) {
          // Usuário padrão ou admin na própria empresa
          await fetchEmpresaData(usuario.empresa_id);
        } else {
          if (mounted) setEmpresa(null);
        }

      } catch (e) {
        console.error('Erro ao inicializar contexto de empresa:', e);
        if (mounted) setEmpresa(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initEmpresaContext();

    return () => {
      mounted = false;
    };
  }, [location.pathname, auth.session]); // re-executar quando a rota muda ou a sessão de login muda

  const value: EmpresaContextType = {
    empresa,
    loading,
    isViewingClient,
    currentUserType,
    refreshEmpresa,
  };

  return (
    <EmpresaContext.Provider value={value}>
      {children}
    </EmpresaContext.Provider>
  );
}

export function useEmpresa() {
  const context = useContext(EmpresaContext);
  if (context === undefined) {
    throw new Error('useEmpresa must be used within an EmpresaProvider');
  }
  return context;
}
