// src/hooks/useUsuariosTenant.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantContext } from '@/context/TenantContext';
import { useToast } from '@/hooks/use-toast';

export function useUsuariosTenant() {
  const { empresaId } = useTenantContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ['usuarios-tenant', empresaId],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, email, tipo_usuario, status, data_criacao, ultimo_login')
        .order('data_criacao', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const criarUsuario = useMutation({
    mutationFn: async (novoUsuario: { nome: string; email: string; senha: string; tipo_usuario: 'admin' | 'cliente'; }) => {
      const res = await fetch('/api/create-tenant-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...novoUsuario, empresa_id: empresaId }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Erro ao criar usuário'); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-tenant', empresaId] });
      toast({ title: '✅ Usuário criado com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  return { usuarios, isLoading, criarUsuario };
}
