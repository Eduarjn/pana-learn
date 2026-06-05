import { motion } from 'framer-motion';
import { fadeInUp, staggerFast, cardItem, cardHover } from '@/lib/animations';
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
import { useReports, type ReportItem, type ReportFilters } from '@/hooks/useReports';

const Relatorios = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const isAdmin = userProfile?.tipo_usuario === 'admin' || userProfile?.tipo_usuario === 'admin_master';
  
  // Hook para relatórios
  const { 
    filteredData, 
    loading, 
    error, 
    applyFilters, 
    clearFilters, 
    exportData 
  } = useReports();
  
  // Debug logs
  useEffect(() => {
    console.log('🔍 Relatórios - Componente carregado');
    console.log('👤 UserProfile:', userProfile);
    console.log('🔐 IsAdmin:', isAdmin);
  }, [userProfile, isAdmin]);
  
  // Filtros
  const [filters, setFilters] = useState<ReportFilters>({
    usuario: '',
    emailMatricula: '',
    curso: '',
    categoria: '',
    dataInicio: '',
    dataConclusao: '',
    status: '',
    progressoMinimo: '0'
  });

  // Aplicar filtros
  const handleApplyFilters = () => {
    const filtered = applyFilters(filters);
    toast({ 
      title: 'Filtros aplicados', 
      description: `${filtered.length} registros encontrados` 
    });
  };

  // Limpar filtros
  const handleClearFilters = () => {
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
    clearFilters();
    toast({ 
      title: 'Filtros limpos', 
      description: 'Todos os filtros foram removidos' 
    });
  };

  // Exportar dados
  const handleExportData = () => {
    exportData(filteredData);
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
      <div className="min-h-screen bg-gradient-to-br bg-pana-bg">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="w-full rounded-xl lg:rounded-2xl mb-6 lg:mb-8 shadow-md overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1F2041 0%, #2d2f5e 60%, #4B3F72 100%)' }}
        >
          <div className="px-6 lg:px-10 py-8 lg:py-12">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <motion.div variants={staggerFast} initial="hidden" animate="visible" className="flex-1">
                <motion.div variants={fadeInUp} className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-pana-bone animate-pulse"></div>
                  <span className="text-xs lg:text-sm font-medium text-white/90">Plataforma de Ensino</span>
                </motion.div>
                <motion.h1 variants={fadeInUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 lg:mb-3 text-white">
                  Relatórios
                </motion.h1>
                <motion.p variants={fadeInUp} className="text-sm sm:text-base lg:text-lg text-white/80 max-w-2xl">
                  Análise detalhada do progresso dos usuários e certificados emitidos
                </motion.p>
                <motion.div variants={staggerFast} className="flex flex-wrap items-center gap-4 mt-4">
                  {[
                    { icon: BarChart3, label: 'Análise completa' },
                    { icon: Download,  label: 'Exportação de dados' },
                    { icon: Filter,    label: 'Filtros avançados' },
                  ].map(({ icon: Icon, label }) => (
                    <motion.div key={label} variants={fadeInUp} className="flex items-center gap-2 text-xs lg:text-sm text-white/80">
                      <Icon className="h-4 w-4" style={{ color: '#D0CEBA' }} />
                      <span>{label}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex gap-2"
              >
                <Button variant="ghost">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <Button variant="default" onClick={() => setShowExportModal(true)}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Dados
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        <div className="px-4 lg:px-6 py-6 lg:py-8">
          <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">

            {/* Filtros de Pesquisa */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            >
            <Card className="border border-[#e4e5f0] shadow-sm">
              <CardHeader style={{ background: '#1F2041', borderRadius: '12px 12px 0 0' }}>
                <CardTitle className="flex items-center gap-3 text-white font-semibold text-base">
                  <div className="p-2 rounded-lg" style={{ background: 'rgba(75,63,114,0.35)' }}>
                    <Filter className="h-4 w-4" style={{ color: '#E9D2C0' }} />
                  </div>
                  <span>Filtros de Pesquisa</span>
                </CardTitle>
                <CardDescription className="text-white/60 mt-1 text-sm">
                  Use os filtros abaixo para refinar sua pesquisa
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
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
                    className="pl-10 h-10 lg:h-12 text-sm lg:text-base border-2 border-gray-200 focus:border-blue-500 rounded-lg lg:rounded-xl transition-all duration-300"
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
                  className="h-10 lg:h-12 text-sm lg:text-base border-2 border-gray-200 focus:border-blue-500 rounded-lg lg:rounded-xl transition-all duration-300"
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
                    className="pl-10 h-10 lg:h-12 text-sm lg:text-base border-2 border-gray-200 focus:border-blue-500 rounded-lg lg:rounded-xl transition-all duration-300"
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
                  className="flex h-10 lg:h-12 w-full rounded-lg lg:rounded-xl border-2 border-gray-200 focus:border-blue-500 bg-background px-3 py-2 text-sm lg:text-base transition-all duration-300"
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
                    className="pl-10 h-10 lg:h-12 text-sm lg:text-base border-2 border-gray-200 focus:border-blue-500 rounded-lg lg:rounded-xl transition-all duration-300"
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
                    className="pl-10 h-10 lg:h-12 text-sm lg:text-base border-2 border-gray-200 focus:border-blue-500 rounded-lg lg:rounded-xl transition-all duration-300"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium text-gray-700">Status</Label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="flex h-10 lg:h-12 w-full rounded-lg lg:rounded-xl border-2 border-gray-200 focus:border-blue-500 bg-background px-3 py-2 text-sm lg:text-base transition-all duration-300"
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
                  className="h-10 lg:h-12 text-sm lg:text-base border-2 border-gray-200 focus:border-blue-500 rounded-lg lg:rounded-xl transition-all duration-300"
                />
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex gap-2">
              <Button onClick={handleApplyFilters} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white flex items-center gap-2 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg">
                <Search className="h-4 w-4" />
                Aplicar Filtros
              </Button>
              <Button onClick={handleClearFilters} variant="outline" className="border-2 border-gray-200 hover:border-blue-500 text-gray-700 hover:text-blue-700 flex items-center gap-2 rounded-lg transition-all duration-300 hover:scale-105">
                <RefreshCw className="h-4 w-4" />
                Limpar Filtros
              </Button>
              <Button onClick={handleExportData} variant="outline" className="border-2 border-gray-200 hover:border-green-500 text-gray-700 hover:text-green-700 flex items-center gap-2 rounded-lg transition-all duration-300 hover:scale-105">
                <Download className="h-4 w-4" />
                Exportar Resultados
              </Button>
            </div>
          </CardContent>
        </Card>
        </motion.div>

            {/* Resultados da Pesquisa */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            >
            <Card className="border border-[#e4e5f0] shadow-sm overflow-hidden">
              <CardHeader style={{ background: '#1F2041', borderRadius: '12px 12px 0 0' }}>
                <CardTitle className="flex items-center gap-3 text-white font-semibold text-base">
                  <div className="p-2 rounded-lg" style={{ background: 'rgba(75,63,114,0.35)' }}>
                    <Search className="h-4 w-4" style={{ color: '#E9D2C0' }} />
                  </div>
                  <span>Resultados da Pesquisa</span>
                </CardTitle>
                <CardDescription className="text-white/90 mt-2 font-medium">
                  {loading ? 'Carregando...' : error ? 'Erro ao carregar dados' : `${filteredData.length} registros encontrados`}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <span className="ml-2 text-gray-600">Carregando dados...</span>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-red-700">Erro ao carregar dados: {error}</span>
                </div>
              </div>
            )}
            
            {!loading && !error && (
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
                    <TableHead className="font-medium text-gray-900">Nota</TableHead>
                    <TableHead className="font-medium text-gray-900">Certificado</TableHead>
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
                      <TableCell className="text-gray-700">
                        {item.nota ? `${item.nota}%` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          item.certificado 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.certificado ? 'Sim' : 'Não'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            )}
          </CardContent>
        </Card>
        </motion.div>
          </div>
        </div>
      </div>
    </ERALayout>
  );
};

export default Relatorios;
