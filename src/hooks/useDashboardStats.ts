import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalCertificates: number;
  completionRate: number;
}

export const useDashboardStats = () => {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // 1. Total de Usuários Ativos
      const { count: userCount, error: userError } = await supabase
        .from('usuarios')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'ativo');
      if (userError) throw userError;

      // 2. Total de Cursos Ativos
      const { count: courseCount, error: courseError } = await supabase
        .from('cursos')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'ativo');
      if (courseError) throw courseError;

      // 3. Total de Certificados Emitidos (todos os tempos)
      const { count: certCount, error: certError } = await supabase
        .from('certificados')
        .select('id', { count: 'exact', head: true });
      if (certError) throw certError;

      // 4. Taxa de Conclusão: cursos concluídos / cursos iniciados
      const { data: progressData, error: progressError } = await supabase
        .from('progresso_usuario')
        .select('status');
      if (progressError) throw progressError;
      const totalStarted = progressData?.filter(p => p.status !== 'nao_iniciado').length || 0;
      const totalCompleted = progressData?.filter(p => p.status === 'concluido').length || 0;
      const completionRate = totalStarted > 0 ? Math.round((totalCompleted / totalStarted) * 100) : 0;

      return {
        totalUsers: userCount || 0,
        totalCourses: courseCount || 0,
        totalCertificates: certCount || 0,
        completionRate,
      };
    },
    refetchInterval: 10000, // Atualiza a cada 10s
  });
}; 