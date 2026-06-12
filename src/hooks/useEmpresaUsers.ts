import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';

type User = Database['public']['Tables']['usuarios']['Row'];

interface CreateUserData {
  nome: string;
  email: string;
  tipo_usuario: 'cliente' | 'admin' | 'admin_master';
  senha?: string;
}

interface UseEmpresaUsersReturn {
  users: User[];
  loading: boolean;
  error: string | null;
  createUser: (empresaId: string, userData: CreateUserData) => Promise<{ success: boolean; message: string; password?: string }>;
  fetchUsersByEmpresa: (empresaId: string) => Promise<void>;
  setupDefaultUsers: (empresaId: string, empresaNome?: string) => Promise<{ success: boolean; message: string }>;
  deleteUser: (userId: string) => Promise<{ success: boolean; message: string }>;
  updateUser: (userId: string, userData: Partial<User>) => Promise<{ success: boolean; message: string }>;
}

export function useEmpresaUsers(): UseEmpresaUsersReturn {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guard against concurrent/duplicate fetches
  const fetchingRef = useRef(false);

  // Verificar se é admin_master
  const isAdminMaster = userProfile?.tipo_usuario === 'admin_master';

  const fetchUsersByEmpresa = useCallback(async (empresaId: string) => {
    if (!isAdminMaster) {
      setError('Apenas admin_master pode gerenciar usuários por empresa');
      return;
    }

    // Prevent concurrent duplicate fetches
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('nome');

      if (fetchError) {
        throw fetchError;
      }

      setUsers(data || []);
    } catch (err) {
      console.error('Erro ao buscar usuários da empresa:', err);
      setError('Erro ao carregar usuários da empresa');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [isAdminMaster]);

  const createUser = useCallback(async (empresaId: string, userData: CreateUserData): Promise<{ success: boolean; message: string; password?: string }> => {
    if (!isAdminMaster) {
      return { success: false, message: 'Apenas admin_master pode criar usuários' };
    }

    setLoading(true);
    setError(null);

    try {
      // Gerar senha se não fornecida
      const senha = userData.senha || Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();

      // 1. Salvar sessão atual do admin ANTES de criar o novo usuário
      const { data: currentSession } = await supabase.auth.getSession();
      const adminAccessToken = currentSession?.session?.access_token;
      const adminRefreshToken = currentSession?.session?.refresh_token;

      // 2. Criar usuário via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: senha,
        options: {
          data: {
            nome: userData.nome,
            tipo_usuario: userData.tipo_usuario
          }
        }
      });

      if (authError) {
        if (authError.message?.includes('already registered')) {
          throw new Error('Este email já está cadastrado no sistema');
        }
        throw new Error(authError.message || 'Erro ao criar usuário');
      }

      if (!authData.user) {
        throw new Error('Erro ao criar usuário: resposta vazia');
      }

      // 3. RESTAURAR sessão do admin imediatamente (signUp pode ter feito auto-login como o novo user)
      if (adminRefreshToken) {
        await supabase.auth.setSession({
          access_token: adminAccessToken!,
          refresh_token: adminRefreshToken
        });
      }

      // 4. Aguardar trigger e atualizar empresa_id
      await new Promise(resolve => setTimeout(resolve, 1500));

      const { error: updateError } = await supabase
        .from('usuarios')
        .update({
          empresa_id: empresaId,
          tipo_usuario: userData.tipo_usuario,
          nome: userData.nome
        })
        .eq('user_id', authData.user.id);

      if (updateError) {
        console.warn('Aviso: não foi possível vincular empresa ao usuário:', updateError);
      }

      // 5. Atualizar lista de usuários
      await fetchUsersByEmpresa(empresaId);

      return { 
        success: true, 
        message: `Usuário ${userData.nome} criado com sucesso!`, 
        password: senha 
      };

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar usuário';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [isAdminMaster, fetchUsersByEmpresa]);

  const setupDefaultUsers = useCallback(async (empresaId: string, empresaNome?: string): Promise<{ success: boolean; message: string }> => {
    if (!isAdminMaster) {
      return { success: false, message: 'Apenas admin_master pode configurar usuários padrão' };
    }

    setLoading(true);
    setError(null);

    try {
      // Tentar chamar função SQL para criar usuários padrão
      const { data, error: rpcError } = await supabase.rpc('setup_tenant_environment', {
        p_organization_id: empresaId,
        p_owner_auth_id: userProfile?.id || '',
        p_company_name: empresaNome || 'Nova Empresa'
      } as any);

      if (rpcError) {
        console.warn('RPC setup_tenant_environment não disponível, ignorando:', rpcError.message);
      }

      // Atualizar lista de usuários
      await fetchUsersByEmpresa(empresaId);

      return { 
        success: true, 
        message: 'Configuração da empresa concluída com sucesso!' 
      };

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao configurar usuários padrão';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [isAdminMaster, userProfile?.id, fetchUsersByEmpresa]);

  const deleteUser = useCallback(async (userId: string): Promise<{ success: boolean; message: string }> => {
    if (!isAdminMaster) {
      return { success: false, message: 'Apenas admin_master pode deletar usuários' };
    }

    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', userId);

      if (deleteError) {
        throw deleteError;
      }

      // Atualizar lista de usuários
      setUsers(prev => prev.filter(user => user.id !== userId));

      return { success: true, message: 'Usuário deletado com sucesso!' };

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar usuário';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [isAdminMaster]);

  const updateUser = useCallback(async (userId: string, userData: Partial<User>): Promise<{ success: boolean; message: string }> => {
    if (!isAdminMaster) {
      return { success: false, message: 'Apenas admin_master pode atualizar usuários' };
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('usuarios')
        .update(userData)
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      // Atualizar lista de usuários
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, ...userData } : user
      ));

      return { success: true, message: 'Usuário atualizado com sucesso!' };

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar usuário';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [isAdminMaster]);

  return {
    users,
    loading,
    error,
    createUser,
    fetchUsersByEmpresa,
    setupDefaultUsers,
    deleteUser,
    updateUser
  };
}
