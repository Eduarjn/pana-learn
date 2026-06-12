import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';

type Empresa = Database['public']['Tables']['empresas']['Row'];
type EmpresaInsert = Database['public']['Tables']['empresas']['Insert'];
type EmpresaUpdate = Database['public']['Tables']['empresas']['Update'];

export function useEmpresas() {
  const { userProfile } = useAuth();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmpresas = async () => {
    if (!userProfile) {
      console.log('❌ useEmpresas: userProfile não encontrado');
      return;
    }
    
    console.log('🔄 useEmpresas: Carregando empresas...', { userType: userProfile.tipo_usuario });
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ useEmpresas: Erro ao buscar empresas:', error);
        throw error;
      }

      console.log('✅ useEmpresas: Empresas carregadas:', data);
      setEmpresas(data || []);
    } catch (err) {
      console.error('❌ useEmpresas: Erro ao carregar empresas:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const createEmpresa = async (empresaData: EmpresaInsert) => {
    if (!userProfile) {
      throw new Error('Usuário não autenticado');
    }

    if (userProfile.tipo_usuario !== 'admin_master') {
      throw new Error('Apenas admin_master pode criar empresas');
    }

    console.log('🔄 useEmpresas: Criando empresa...', { empresaData, userId: userProfile.id });
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('empresas')
        .insert({
          ...empresaData
        })
        .select()
        .single();

      if (error) {
        console.error('❌ useEmpresas: Erro ao criar empresa:', error);
        throw error;
      }

      console.log('✅ useEmpresas: Empresa criada:', data);
      setEmpresas(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('❌ useEmpresas: Erro ao criar empresa:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateEmpresa = async (id: string, empresaData: EmpresaUpdate) => {
    if (!userProfile) {
      throw new Error('Usuário não autenticado');
    }

    if (userProfile.tipo_usuario !== 'admin_master') {
      throw new Error('Apenas admin_master pode editar empresas');
    }

    console.log('🔄 useEmpresas: Atualizando empresa...', { id, empresaData });
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('empresas')
        .update(empresaData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ useEmpresas: Erro ao atualizar empresa:', error);
        throw error;
      }

      console.log('✅ useEmpresas: Empresa atualizada:', data);
      setEmpresas(prev => prev.map(empresa => empresa.id === id ? data : empresa));
      return data;
    } catch (err) {
      console.error('❌ useEmpresas: Erro ao atualizar empresa:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteEmpresa = async (id: string) => {
    if (!userProfile) {
      throw new Error('Usuário não autenticado');
    }

    if (userProfile.tipo_usuario !== 'admin_master') {
      throw new Error('Apenas admin_master pode deletar empresas');
    }

    console.log('🔄 useEmpresas: Deletando empresa...', { id });
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('empresas')
        .delete()
        .eq('id', id)
        .select();

      if (error) {
        console.error('❌ useEmpresas: Erro ao deletar empresa:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error(
          'Empresa não foi deletada. Possíveis causas: permissão insuficiente (RLS) ou registros vinculados (usuários, cursos).'
        );
      }

      console.log('✅ useEmpresas: Empresa deletada:', id);
      setEmpresas(prev => prev.filter(empresa => empresa.id !== id));
    } catch (err) {
      console.error('❌ useEmpresas: Erro ao deletar empresa:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile) {
      console.log('🔄 useEmpresas: useEffect triggered', { userType: userProfile.tipo_usuario });
      fetchEmpresas();
    }
  }, [userProfile]);

  return {
    empresas,
    loading,
    error,
    fetchEmpresas,
    createEmpresa,
    updateEmpresa,
    deleteEmpresa,
    isAdminMaster: userProfile?.tipo_usuario === 'admin_master',
    currentUserType: userProfile?.tipo_usuario || ''
  };
}
