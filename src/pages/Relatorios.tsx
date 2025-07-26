import { ERALayout } from '@/components/ERALayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, Download, Calendar, RefreshCw, BarChart3, User, GraduationCap, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Tipo para dados do relatório
interface ReportItem {
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
}

const Relatorios = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const isAdmin = userProfile?.tipo_usuario === 'admin' || userProfile?.tipo_usuario === 'admin_master';
  
  // Debug logs
  useEffect(() => {
    console.log('🔍 Relatórios - Componente carregado');
    console.log('👤 UserProfile:', userProfile);
    console.log('🔐 IsAdmin:', isAdmin);
  }, [userProfile, isAdmin]);
  
  // Filtros
  const [filters, setFilters] = useState({
    usuario: '',
    emailMatricula: '',
    curso: '',
    categoria: '',
    dataInicio: '',
    dataConclusao: '',
    status: '',
    progressoMinimo: '0'
  });

  // 1. Adicione o registro de demonstração ao estado inicial, mas remova quando houver dados reais
  const demoRecord: ReportItem = {
    id: 'demo-bianca',
    usuario: 'Bianca',
    email: 'biancacc2008@gmail.com',
    matricula: 'bianca2008',
    curso: 'OMNICHANNEL para Empresas',
    categoria: 'Avançado',
    dataInicio: '01/06/2025',
    dataConclusao: '15/06/2025',
    status: 'concluido',
    progresso: 100
  };

  const [reportData, setReportData] = useState<ReportItem[]>([demoRecord]);
  const [filteredData, setFilteredData] = useState<ReportItem[]>([demoRecord]);

  // 2. Quando carregar dados reais, remova o demoRecord do topo
  useEffect(() => {
    // Supondo que fetchReportData() carrega os dados reais do backend
    async function fetchReportData() {
      // ...fetch real data logic...
      // Exemplo:
      // const realData = await api.getReportData();
      // if (realData && realData.length > 0) {
      //   setReportData(realData);
      //   setFilteredData(realData);
      // } else {
      //   setReportData([demoRecord]);
      //   setFilteredData([demoRecord]);
      // }
    }
    fetchReportData();
  }, []);

  // Aplicar filtros
  const applyFilters = () => {
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
      filtered = filtered.filter(item => 
        item.dataInicio >= filters.dataInicio
      );
    }

    if (filters.dataConclusao) {
      filtered = filtered.filter(item => 
        item.dataConclusao <= filters.dataConclusao
      );
    }

    setFilteredData(filtered);
    toast({ 
      title: 'Filtros aplicados', 
      description: `${filtered.length} registros encontrados` 
    });
  };

  // Limpar filtros
  const clearFilters = () => {
    setFilters({
      usuario: '',
      emailMatricula: '',
      curso: '',
      categoria: '',
      dataInicio: '',
      dataConclusao: '',
      status: '',
      progressoMinimo: '0'
    });
    setFilteredData(reportData);
    toast({ 
      title: 'Filtros limpos', 
      description: 'Todos os filtros foram removidos' 
    });
  };

  // Exportar dados
  const exportData = () => {
    const csvContent = [
      ['Usuário', 'Email/Matrícula', 'Curso', 'Categoria', 'Data Início', 'Data Conclusão', 'Status', 'Progresso'],
      ...filteredData.map(item => [
        item.usuario,
        `${item.email} ${item.matricula}`,
        item.curso,
        item.categoria,
        item.dataInicio,
        item.dataConclusao,
        item.status === 'concluido' ? 'Concluído' : item.status === 'em_andamento' ? 'Em andamento' : 'Não iniciado',
        `${item.progresso}%`
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
    
    toast({ 
      title: 'Relatório exportado', 
      description: 'Arquivo CSV baixado com sucesso' 
    });
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Se não for admin, mostrar mensagem de acesso restrito
  if (!isAdmin) {
    return (
      <ERALayout>
        <div className="p-6">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8">
              <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h1>
              <p className="text-gray-600 mb-4">
                Esta página é destinada apenas a administradores. Entre em contato com o administrador do sistema para solicitar acesso.
              </p>
              <div className="text-sm text-gray-500">
                <p><strong>Usuário atual:</strong> {userProfile?.nome || 'N/A'}</p>
                <p><strong>Tipo:</strong> {userProfile?.tipo_usuario || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </ERALayout>
    );
  }

  return (
    <ERALayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="page-hero flex flex-col md:flex-row justify-between items-center gap-4 p-6 mb-8 rounded-2xl">
          <div>
            <h1 className="text-3xl font-bold">Relatórios</h1>
            <p className="text-lg">Análise detalhada do progresso dos usuários</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Filtros de Pesquisa */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Filter className="h-5 w-5" />
              Filtros de Pesquisa
            </CardTitle>
            <CardDescription className="text-gray-600">
              Use os filtros abaixo para refinar sua pesquisa
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Primeira linha de filtros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="usuario" className="text-sm font-medium text-gray-700">Usuário</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="usuario"
                    placeholder="Nome do usuário"
                    value={filters.usuario}
                    onChange={(e) => handleFilterChange('usuario', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailMatricula" className="text-sm font-medium text-gray-700">Email/Matrícula</Label>
                <Input
                  id="emailMatricula"
                  placeholder="email@exemplo.com ou matrícula"
                  value={filters.emailMatricula}
                  onChange={(e) => handleFilterChange('emailMatricula', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="curso" className="text-sm font-medium text-gray-700">Curso</Label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="curso"
                    placeholder="Nome do curso"
                    value={filters.curso}
                    onChange={(e) => handleFilterChange('curso', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Segunda linha de filtros */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="categoria" className="text-sm font-medium text-gray-700">Categoria</Label>
                <select
                  value={filters.categoria}
                  onChange={(e) => handleFilterChange('categoria', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Selecione</option>
                  <option value="Frontend">Frontend</option>
                  <option value="Backend">Backend</option>
                  <option value="Mobile">Mobile</option>
                  <option value="DevOps">DevOps</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataInicio" className="text-sm font-medium text-gray-700">Data de Início</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="dataInicio"
                    type="date"
                    value={filters.dataInicio}
                    onChange={(e) => handleFilterChange('dataInicio', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataConclusao" className="text-sm font-medium text-gray-700">Data de Conclusão</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="dataConclusao"
                    type="date"
                    value={filters.dataConclusao}
                    onChange={(e) => handleFilterChange('dataConclusao', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium text-gray-700">Status</Label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Selecione</option>
                  <option value="nao_iniciado">Não iniciado</option>
                  <option value="em_andamento">Em andamento</option>
                  <option value="concluido">Concluído</option>
                </select>
              </div>
            </div>

            {/* Terceira linha - Progresso Mínimo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="progressoMinimo" className="text-sm font-medium text-gray-700">% Progresso Mínimo</Label>
                <Input
                  id="progressoMinimo"
                  type="number"
                  min="0"
                  max="100"
                  value={filters.progressoMinimo}
                  onChange={(e) => handleFilterChange('progressoMinimo', e.target.value)}
                />
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex gap-2">
              <Button onClick={applyFilters} className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
                <Search className="h-4 w-4" />
                Aplicar Filtros
              </Button>
              <Button onClick={clearFilters} variant="outline" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Limpar Filtros
              </Button>
              <Button onClick={exportData} variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exportar Resultados
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultados da Pesquisa */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Search className="h-5 w-5" />
              Resultados da Pesquisa
            </CardTitle>
            <CardDescription className="text-gray-600">
              {filteredData.length} registros encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-medium text-gray-900">Usuário</TableHead>
                    <TableHead className="font-medium text-gray-900">Email/Matrícula</TableHead>
                    <TableHead className="font-medium text-gray-900">Curso</TableHead>
                    <TableHead className="font-medium text-gray-900">Categoria</TableHead>
                    <TableHead className="font-medium text-gray-900">Data Início</TableHead>
                    <TableHead className="font-medium text-gray-900">Data Conclusão</TableHead>
                    <TableHead className="font-medium text-gray-900">Status</TableHead>
                    <TableHead className="font-medium text-gray-900">Progresso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-gray-900">{item.usuario}</TableCell>
                      <TableCell className="text-gray-700">
                        {item.email} {item.matricula}
                      </TableCell>
                      <TableCell className="text-gray-700">{item.curso}</TableCell>
                      <TableCell className="text-gray-700">{item.categoria}</TableCell>
                      <TableCell className="text-gray-700">{item.dataInicio}</TableCell>
                      <TableCell className="text-gray-700">{item.dataConclusao}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          item.status === 'concluido' 
                            ? 'bg-green-100 text-green-800' 
                            : item.status === 'em_andamento'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.status === 'concluido' ? 'Concluído' :
                           item.status === 'em_andamento' ? 'Em andamento' :
                           'Não iniciado'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-2 bg-green-500 rounded-full" 
                              style={{ width: `${item.progresso}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{item.progresso}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </ERALayout>
  );
};

export default Relatorios;
