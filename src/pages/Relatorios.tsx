import { ERALayout } from '@/components/ERALayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, Download, Calendar, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

// Tipo para relatório com dados completos
interface ReportData {
  id: string;
  usuario: {
    nome: string;
    email: string;
    matricula: string | null;
  };
  curso: {
    nome: string;
    categoria: string;
  };
  progresso: {
    status: string;
    percentual_concluido: number | null;
    data_inicio: string | null;
    data_conclusao: string | null;
    tempo_total_assistido: number | null;
  };
  certificado?: {
    data_emissao: string;
    nota_final: number | null;
  };
  avaliacao?: {
    nota: number | null;
    comentario: string | null;
  };
}

// Tipo para dados do progresso retornados pelo Supabase
interface ProgressData {
  id: string;
  status: string;
  percentual_concluido: number | null;
  data_inicio: string | null;
  data_conclusao: string | null;
  tempo_total_assistido: number | null;
  usuario_id: string;
  curso_id: string;
  usuarios: {
    nome: string;
    email: string;
    matricula: string | null;
  };
  cursos: {
    nome: string;
    categoria: string;
  };
}

// Tipo para dados do progresso de vídeos
interface VideoProgressData {
  id: string;
  video_id: string;
  usuario_id: string;
  curso_id: string;
  modulo_id: string | null;
  tempo_assistido: number | null;
  tempo_total: number | null;
  percentual_assistido: number | null;
  concluido: boolean;
  data_conclusao: string | null;
  videos: {
    titulo: string;
    descricao: string | null;
  };
  usuarios: {
    nome: string;
    email: string;
  };
  cursos: {
    nome: string;
  };
}

const Relatorios = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const isAdmin = userProfile?.tipo_usuario === 'admin';
  
  const [filters, setFilters] = useState({
    usuario: '',
    email: '',
    curso: '',
    categoria: '',
    dataInicio: '',
    dataConclusao: '',
    status: '',
    progresso: '',
    nota: ''
  });

  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filteredData, setFilteredData] = useState<ReportData[]>([]);

  // Buscar dados reais do banco
  const fetchReportData = async () => {
    if (!isAdmin) {
      toast({ title: 'Acesso negado', description: 'Apenas administradores podem acessar relatórios', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      // Buscar progresso de usuários com joins para cursos e usuários
      const { data: progressData, error: progressError } = await supabase
        .from('progresso_usuario')
        .select(`
          id,
          status,
          percentual_concluido,
          data_inicio,
          data_conclusao,
          tempo_total_assistido,
          usuario_id,
          curso_id,
          usuarios!inner (
            nome,
            email,
            matricula
          ),
          cursos!inner (
            nome,
            categoria
          )
        `)
        .order('data_criacao', { ascending: false });

      if (progressError) {
        console.error('Erro ao buscar progresso:', progressError);
        toast({ title: 'Erro', description: 'Erro ao carregar dados de progresso', variant: 'destructive' });
        return;
      }

      // Buscar certificados
      const { data: certificatesData, error: certificatesError } = await supabase
        .from('certificados')
        .select(`
          usuario_id,
          curso_id,
          data_emissao,
          nota_final
        `);

      if (certificatesError) {
        console.error('Erro ao buscar certificados:', certificatesError);
      }

      // Buscar avaliações
      const { data: evaluationsData, error: evaluationsError } = await supabase
        .from('avaliacoes')
        .select(`
          usuario_id,
          curso_id,
          nota,
          comentario
        `);

      if (evaluationsError) {
        console.error('Erro ao buscar avaliações:', evaluationsError);
      }

      // Buscar progresso de vídeos
      const { data: videoProgressData, error: videoProgressError } = await supabase
        .from('video_progress')
        .select(`
          id,
          video_id,
          usuario_id,
          curso_id,
          modulo_id,
          tempo_assistido,
          tempo_total,
          percentual_assistido,
          concluido,
          data_conclusao,
          videos!inner (
            titulo,
            descricao
          ),
          usuarios!inner (
            nome,
            email
          ),
          cursos!inner (
            nome
          )
        `)
        .order('data_criacao', { ascending: false });

      if (videoProgressError) {
        console.error('Erro ao buscar progresso de vídeos:', videoProgressError);
      }

      // Combinar dados
      const combinedData: ReportData[] = (progressData || []).map((progress: Record<string, any>) => {
        const certificado = certificatesData?.find(c => 
          c.usuario_id === progress.usuario_id && c.curso_id === progress.curso_id
        );
        
        const avaliacao = evaluationsData?.find(a => 
          a.usuario_id === progress.usuario_id && a.curso_id === progress.curso_id
        );

        return {
          id: progress.id,
          usuario: {
            nome: progress.usuarios?.nome || 'Usuário',
            email: progress.usuarios?.email || '',
            matricula: progress.usuarios?.matricula || ''
          },
          curso: {
            nome: progress.cursos?.nome || 'Curso',
            categoria: progress.cursos?.categoria || ''
          },
          progresso: {
            status: progress.status,
            percentual_concluido: progress.percentual_concluido,
            data_inicio: progress.data_inicio,
            data_conclusao: progress.data_conclusao,
            tempo_total_assistido: progress.tempo_total_assistido
          },
          certificado: certificado ? {
            data_emissao: certificado.data_emissao,
            nota_final: certificado.nota_final
          } : undefined,
          avaliacao: avaliacao ? {
            nota: avaliacao.nota,
            comentario: avaliacao.comentario
          } : undefined
        };
      });

      setReportData(combinedData);
      setFilteredData(combinedData);
      
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({ title: 'Erro', description: 'Erro inesperado ao carregar relatórios', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Aplicar filtros
  const applyFilters = () => {
    let filtered = [...reportData];

    if (filters.usuario) {
      filtered = filtered.filter(item => 
        item.usuario.nome.toLowerCase().includes(filters.usuario.toLowerCase())
      );
    }

    if (filters.email) {
      filtered = filtered.filter(item => 
        item.usuario.email.toLowerCase().includes(filters.email.toLowerCase()) ||
        (item.usuario.matricula && item.usuario.matricula.toLowerCase().includes(filters.email.toLowerCase()))
      );
    }

    if (filters.curso) {
      filtered = filtered.filter(item => 
        item.curso.nome.toLowerCase().includes(filters.curso.toLowerCase())
      );
    }

    if (filters.categoria) {
      filtered = filtered.filter(item => 
        item.curso.categoria.toLowerCase().includes(filters.categoria.toLowerCase())
      );
    }

    if (filters.status) {
      filtered = filtered.filter(item => 
        item.progresso.status === filters.status
      );
    }

    if (filters.progresso) {
      const minProgress = parseInt(filters.progresso);
      filtered = filtered.filter(item => 
        (item.progresso.percentual_concluido || 0) >= minProgress
      );
    }

    if (filters.dataInicio) {
      filtered = filtered.filter(item => 
        item.progresso.data_inicio && item.progresso.data_inicio >= filters.dataInicio
      );
    }

    if (filters.dataConclusao) {
      filtered = filtered.filter(item => 
        item.progresso.data_conclusao && item.progresso.data_conclusao <= filters.dataConclusao
      );
    }

    setFilteredData(filtered);
    toast({ title: 'Filtros aplicados', description: `${filtered.length} registros encontrados` });
  };

  // Limpar filtros
  const clearFilters = () => {
    setFilters({
      usuario: '',
      email: '',
      curso: '',
      categoria: '',
      dataInicio: '',
      dataConclusao: '',
      status: '',
      progresso: '',
      nota: ''
    });
    setFilteredData(reportData);
    toast({ title: 'Filtros limpos', description: 'Todos os filtros foram removidos' });
  };

  // Exportar dados
  const exportData = () => {
    const csvContent = [
      ['Usuário', 'Email', 'Matrícula', 'Curso', 'Categoria', 'Status', 'Progresso (%)', 'Data Início', 'Data Conclusão', 'Tempo Assistido (min)', 'Certificado', 'Nota Final', 'Avaliação'],
      ...filteredData.map(item => [
        item.usuario.nome,
        item.usuario.email,
        item.usuario.matricula || '',
        item.curso.nome,
        item.curso.categoria,
        item.progresso.status,
        item.progresso.percentual_concluido?.toString() || '0',
        item.progresso.data_inicio || '',
        item.progresso.data_conclusao || '',
        item.progresso.tempo_total_assistido?.toString() || '0',
        item.certificado ? 'Sim' : 'Não',
        item.certificado?.nota_final?.toString() || '',
        item.avaliacao?.nota?.toString() || ''
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
    
    toast({ title: 'Relatório exportado', description: 'Arquivo CSV baixado com sucesso' });
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Validação de filtros antes de aplicar
  const validateFilters = () => {
    // Validação de datas (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (filters.dataInicio && !dateRegex.test(filters.dataInicio)) {
      toast({ title: 'Data de início inválida', description: 'Use o formato AAAA-MM-DD', variant: 'destructive' });
      return false;
    }
    if (filters.dataConclusao && !dateRegex.test(filters.dataConclusao)) {
      toast({ title: 'Data de conclusão inválida', description: 'Use o formato AAAA-MM-DD', variant: 'destructive' });
      return false;
    }
    // Validação de progresso
    if (filters.progresso) {
      const prog = Number(filters.progresso);
      if (isNaN(prog) || prog < 0 || prog > 100) {
        toast({ title: 'Progresso inválido', description: 'Digite um valor entre 0 e 100', variant: 'destructive' });
        return false;
      }
    }
    return true;
  };

  // Substituir chamada direta por função com validação
  const handleApplyFilters = () => {
    if (validateFilters()) applyFilters();
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, reportData]);

  if (!isAdmin) {
    return (
      <ERALayout>
        <div className="p-6">
          <h1 className="text-3xl font-bold text-era-dark-blue">Relatórios</h1>
          <p className="text-era-gray">Acesso restrito a administradores</p>
        </div>
      </ERALayout>
    );
  }

  return (
    <ERALayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-era-dark-blue">Relatórios</h1>
            <p className="text-era-gray">Relatórios de usuários, progresso e rastreabilidade</p>
          </div>
          <Button onClick={fetchReportData} disabled={isLoading} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Filters Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-era-dark-blue">
              <Filter className="h-5 w-5" />
              Filtros de Pesquisa
            </CardTitle>
            <CardDescription>
              Utilize os filtros abaixo para personalizar seus relatórios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="usuario">Usuário</Label>
                <Input
                  id="usuario"
                  placeholder="Nome completo"
                  value={filters.usuario}
                  onChange={(e) => handleFilterChange('usuario', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email / Matrícula</Label>
                <Input
                  id="email"
                  placeholder="Email ou matrícula"
                  value={filters.email}
                  onChange={(e) => handleFilterChange('email', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="curso">Curso</Label>
                <Input
                  id="curso"
                  placeholder="Nome do curso"
                  value={filters.curso}
                  onChange={(e) => handleFilterChange('curso', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Input
                  id="categoria"
                  placeholder="Categoria do curso"
                  value={filters.categoria}
                  onChange={(e) => handleFilterChange('categoria', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataInicio">Data de Início</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={filters.dataInicio}
                  onChange={(e) => handleFilterChange('dataInicio', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataConclusao">Data de Conclusão</Label>
                <Input
                  id="dataConclusao"
                  type="date"
                  value={filters.dataConclusao}
                  onChange={(e) => handleFilterChange('dataConclusao', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="nao_iniciado">Não iniciado</option>
                  <option value="em_andamento">Em andamento</option>
                  <option value="concluido">Concluído</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="progresso">% Progresso Mínimo</Label>
                <Input
                  id="progresso"
                  type="number"
                  placeholder="0-100"
                  min={0}
                  max={100}
                  value={filters.progresso}
                  onChange={(e) => handleFilterChange('progresso', e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleApplyFilters} className="era-lime-button">
                <Search className="mr-2 h-4 w-4" />
                Aplicar Filtros
              </Button>
              <Button onClick={clearFilters} variant="outline">
                Limpar Filtros
              </Button>
              <Button onClick={exportData} variant="outline" disabled={filteredData.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Exportar ({filteredData.length})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Results */}
        <Card>
          <CardHeader>
            <CardTitle className="text-era-dark-blue">
              Relatório de Usuários e Treinamentos ({filteredData.length} registros)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-era-dark-blue" />
                <span className="ml-2">Carregando dados...</span>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum registro encontrado com os filtros aplicados
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Email/Matrícula</TableHead>
                      <TableHead>Curso</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progresso</TableHead>
                      <TableHead>Data Início</TableHead>
                      <TableHead>Data Conclusão</TableHead>
                      <TableHead>Tempo Assistido</TableHead>
                      <TableHead>Certificado</TableHead>
                      <TableHead>Nota Final</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.usuario.nome}</TableCell>
                        <TableCell>
                          <div>
                            <div>{item.usuario.email}</div>
                            {item.usuario.matricula && (
                              <div className="text-xs text-gray-500">Mat: {item.usuario.matricula}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{item.curso.nome}</TableCell>
                        <TableCell>{item.curso.categoria}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            item.progresso.status === 'concluido' 
                              ? 'bg-green-100 text-green-800'
                              : item.progresso.status === 'em_andamento'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {item.progresso.status === 'concluido' ? 'Concluído' :
                             item.progresso.status === 'em_andamento' ? 'Em andamento' :
                             'Não iniciado'}
                          </span>
                        </TableCell>
                        <TableCell>{item.progresso.percentual_concluido || 0}%</TableCell>
                        <TableCell>
                          {item.progresso.data_inicio ? 
                            new Date(item.progresso.data_inicio).toLocaleDateString('pt-BR') : 
                            '-'
                          }
                        </TableCell>
                        <TableCell>
                          {item.progresso.data_conclusao ? 
                            new Date(item.progresso.data_conclusao).toLocaleDateString('pt-BR') : 
                            '-'
                          }
                        </TableCell>
                        <TableCell>
                          {item.progresso.tempo_total_assistido ? 
                            `${item.progresso.tempo_total_assistido} min` : 
                            '-'
                          }
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            item.certificado 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {item.certificado ? 'Sim' : 'Não'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {item.certificado?.nota_final || item.avaliacao?.nota || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ERALayout>
  );
};

export default Relatorios;
