import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEmpresa } from '@/context/EmpresaContext';

// Tipo para dados do relatório
export interface ReportItem {
  id: string;
  usuario: string;
  email: string;
  matricula: string;
  curso: string;
  categoria: string;
  dataInicio: string;
  dataConclusao: string;
  status: 'concluido' | 'em_andamento' | 'nao_iniciado';
  progresso: number;
  nota?: number;
  certificado?: boolean;
}

// Tipo para filtros
export interface ReportFilters {
  usuario: string;
  emailMatricula: string;
  curso: string;
  categoria: string;
  dataInicio: string;
  dataConclusao: string;
  status: string;
  progressoMinimo: string;
}

export function useReports() {
  const { userProfile } = useAuth();
  const { empresa } = useEmpresa();
  const [reportData, setReportData] = useState<ReportItem[]>([]);
  const [filteredData, setFilteredData] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar dados reais do relatório
  const fetchReportData = useCallback(async () => {
    if (!userProfile) return;

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Buscando dados do relatório...');

      // Query principal que junta progresso_usuario com usuários, cursos e certificados
      let query = supabase
        .from('progresso_usuario')
        .select(`
          *,
          usuarios!progresso_usuario_usuario_id_fkey!inner (
            nome,
            email,
            matricula,
            empresa_id
          ),
          cursos!progresso_usuario_curso_id_fkey (
            nome,
            categoria
          )
        `)
        .order('data_conclusao', { ascending: false });

      if (empresa?.id && userProfile?.tipo_usuario !== 'admin_master') {
        query = query.eq('usuarios.empresa_id', empresa.id);
      }

      const { data, error } = await query;

      // Buscar certificados separadamente
      let certsQuery = supabase
        .from('certificados')
        .select('*')
        .order('data_emissao', { ascending: false });
        
      if (empresa?.id && userProfile?.tipo_usuario !== 'admin_master') {
        certsQuery = certsQuery.eq('empresa_id', empresa.id);
      }

      const { data: certificadosData, error: certError } = await certsQuery;

      if (error) {
        console.error('❌ Erro ao buscar dados do relatório:', error);
        throw error;
      }

      if (certError) {
        console.error('❌ Erro ao buscar certificados:', certError);
        // Não falhar se não conseguir buscar certificados
      }

      console.log('✅ Dados do relatório encontrados:', data?.length || 0);

      // Transformar dados para o formato do relatório
      const transformedData: ReportItem[] = (data || []).map((item: any) => {
        const usuario = item.usuarios;
        const curso = item.cursos;
        
        // Buscar certificado correspondente
        const certificado = certificadosData?.find((cert: any) => 
          cert.usuario_id === item.usuario_id && cert.curso_id === item.curso_id
        );

        return {
          id: item.id,
          usuario: usuario?.nome || 'Usuário não identificado',
          email: usuario?.email || '',
          matricula: usuario?.matricula || '',
          curso: curso?.nome || 'Curso não identificado',
          categoria: curso?.categoria || 'Sem categoria',
          dataInicio: item.data_inicio ? new Date(item.data_inicio).toLocaleDateString('pt-BR') : 'N/A',
          dataConclusao: item.data_conclusao ? new Date(item.data_conclusao).toLocaleDateString('pt-BR') : 'N/A',
          status: item.status || 'nao_iniciado',
          progresso: item.percentual_concluido || 0,
          nota: certificado?.nota_final || undefined,
          certificado: !!certificado
        };
      });

      setReportData(transformedData);
      setFilteredData(transformedData);

    } catch (err) {
      console.error('❌ Erro inesperado ao buscar dados do relatório:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      
      // Em caso de erro, usar dados de demonstração
      const demoData: ReportItem[] = [
        {
          id: 'demo-1',
          usuario: 'Bianca Silva',
          email: 'biancacc2008@gmail.com',
          matricula: 'bianca2008',
          curso: 'OMNICHANNEL para Empresas',
          categoria: 'Avançado',
          dataInicio: '01/06/2025',
          dataConclusao: '15/06/2025',
          status: 'concluido',
          progresso: 100,
          nota: 85,
          certificado: true
        },
        {
          id: 'demo-2',
          usuario: 'João Santos',
          email: 'joao.santos@empresa.com',
          matricula: 'joao001',
          curso: 'PABX Básico',
          categoria: 'Básico',
          dataInicio: '10/06/2025',
          dataConclusao: '',
          status: 'em_andamento',
          progresso: 65,
          nota: undefined,
          certificado: false
        }
      ];
      
      setReportData(demoData);
      setFilteredData(demoData);
    } finally {
      setLoading(false);
    }
  }, [userProfile, empresa]);

  // Aplicar filtros
  const applyFilters = useCallback((filters: ReportFilters) => {
    let filtered = [...reportData];

    if (filters.usuario) {
      filtered = filtered.filter(item => 
        item.usuario.toLowerCase().includes(filters.usuario.toLowerCase())
      );
    }

    if (filters.emailMatricula) {
      filtered = filtered.filter(item => 
        item.email.toLowerCase().includes(filters.emailMatricula.toLowerCase()) ||
        item.matricula.toLowerCase().includes(filters.emailMatricula.toLowerCase())
      );
    }

    if (filters.curso) {
      filtered = filtered.filter(item => 
        item.curso.toLowerCase().includes(filters.curso.toLowerCase())
      );
    }

    if (filters.categoria) {
      filtered = filtered.filter(item => 
        item.categoria.toLowerCase().includes(filters.categoria.toLowerCase())
      );
    }

    if (filters.status) {
      filtered = filtered.filter(item => 
        item.status === filters.status
      );
    }

    if (filters.progressoMinimo) {
      const minProgress = parseInt(filters.progressoMinimo);
      filtered = filtered.filter(item => 
        item.progresso >= minProgress
      );
    }

    if (filters.dataInicio) {
      filtered = filtered.filter(item => {
        if (item.dataInicio === 'N/A') return false;
        const itemDate = new Date(item.dataInicio.split('/').reverse().join('-'));
        const filterDate = new Date(filters.dataInicio);
        return itemDate >= filterDate;
      });
    }

    if (filters.dataConclusao) {
      filtered = filtered.filter(item => {
        if (item.dataConclusao === 'N/A') return false;
        const itemDate = new Date(item.dataConclusao.split('/').reverse().join('-'));
        const filterDate = new Date(filters.dataConclusao);
        return itemDate <= filterDate;
      });
    }

    setFilteredData(filtered);
    return filtered;
  }, [reportData]);

  // Limpar filtros
  const clearFilters = useCallback(() => {
    setFilteredData(reportData);
  }, [reportData]);

  // Exportar dados
  const exportData = useCallback((data: ReportItem[]) => {
    const csvContent = [
      ['Usuário', 'Email', 'Matrícula', 'Curso', 'Categoria', 'Data Início', 'Data Conclusão', 'Status', 'Progresso', 'Nota', 'Certificado'],
      ...data.map(item => [
        item.usuario,
        item.email,
        item.matricula,
        item.curso,
        item.categoria,
        item.dataInicio,
        item.dataConclusao,
        item.status === 'concluido' ? 'Concluído' : item.status === 'em_andamento' ? 'Em andamento' : 'Não iniciado',
        `${item.progresso}%`,
        item.nota ? item.nota.toString() : 'N/A',
        item.certificado ? 'Sim' : 'Não'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_usuarios_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // Carregar dados quando o componente montar
  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  return {
    reportData,
    filteredData,
    loading,
    error,
    applyFilters,
    clearFilters,
    exportData,
    refetch: fetchReportData
  };
} 