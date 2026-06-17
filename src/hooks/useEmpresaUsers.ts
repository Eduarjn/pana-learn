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
  resetPassword: (targetUserId: string, senha?: string) => Promise<{ success: boolean; message: string; password?: string }>;
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

  // admin_master gerencia qualquer empresa; admin gerencia só a própria
  const isAdminMaster = userProfile?.tipo_usuario === 'admin_master';
  const isAdmin = userProfile?.tipo_usuario === 'admin' || isAdminMaster;
  const myEmpresaId = (userProfile as any)?.empresa_id as string | undefined;
  // true se pode gerenciar a empresa alvo (master = qualquer; admin = a sua)
  const canManage = (empresaId: string) => isAdminMaster || (isAdmin && empresaId === myEmpresaId);

  const fetchUsersByEmpresa = useCallback(async (empresaId: string) => {
    if (!canManage(empresaId)) {
      setError('Sem permissão para gerenciar usuários desta empresa');
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
  }, [isAdminMaster, isAdmin, myEmpresaId]);

  const createUser = useCallback(async (empresaId: string, userData: CreateUserData): Promise<{ success: boolean; message: string; password?: string }> => {
    if (!canManage(empresaId)) {
      return { success: false, message: 'Sem permissão para criar usuários nesta empresa' };
    }
    // admin de empresa não pode criar admin_master
    if (!isAdminMaster && userData.tipo_usuario === 'admin_master') {
      return { success: false, message: 'Apenas admin_master pode criar outro admin_master' };
    }

    setLoading(true);
    setError(null);

    try {
      // Endpoint serverless (service role) cria o usuário SEM trocar a sessão
      // do admin — elimina o bug de usuário órfão e a fragilidade do signUp.
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error('Sessão expirada. Faça login novamente.');

      const res = await fetch('/api/admin-create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nome: userData.nome,
          email: userData.email,
          senha: userData.senha || undefined,
          tipo_usuario: userData.tipo_usuario,
          empresa_id: empresaId,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erro ao criar usuário');

      // Atualizar lista de usuários
      await fetchUsersByEmpresa(empresaId);

      return {
        success: true,
        message: `Usuário ${userData.nome} criado com sucesso!`,
        password: result.password,
      };

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar usuário';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [isAdminMaster, fetchUsersByEmpresa]);

  const resetPassword = useCallback(async (targetUserId: string, senha?: string): Promise<{ success: boolean; message: string; password?: string }> => {
    if (!isAdmin) {
      return { success: false, message: 'Sem permissão para redefinir senhas' };
    }
    setLoading(true);
    setError(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error('Sessão expirada. Faça login novamente.');

      const res = await fetch('/api/admin-reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ target_user_id: targetUserId, senha: senha || undefined }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erro ao redefinir senha');

      return { success: true, message: 'Senha redefinida com sucesso!', password: result.password };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao redefinir senha';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const setupDefaultUsers = useCallback(async (empresaId: string, empresaNome?: string): Promise<{ success: boolean; message: string }> => {
    if (!isAdminMaster) {
      return { success: false, message: 'Apenas admin_master pode configurar usuários padrão' };
    }

    setLoading(true);
    setError(null);

    try {
      // RPC setup_tenant_environment removida: referenciava tabela
      // 'organizations' que nao existe, e o fluxo de onboarding novo
      // ja cria empresa + usuarios via create_empresa_for_user.
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
    if (!isAdmin) {
      return { success: false, message: 'Sem permissão para deletar usuários' };
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
    if (!isAdmin) {
      return { success: false, message: 'Sem permissão para atualizar usuários' };
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
    resetPassword,
    fetchUsersByEmpresa,
    setupDefaultUsers,
    deleteUser,
    updateUser
  };
}
