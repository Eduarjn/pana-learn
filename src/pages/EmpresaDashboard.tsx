import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ERALayout } from '@/components/ERALayout';
import { useAuth } from '@/hooks/useAuth';
import { useEmpresas } from '@/hooks/useEmpresas';
import { useEmpresaUsers } from '@/hooks/useEmpresaUsers';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { useMonthlyUsage } from '@/hooks/useMonthlyUsage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  BookOpen, 
  Award, 
  BarChart3, 
  Calendar,
  Eye,
  ExternalLink,
  Shield,
  AlertCircle,
  Plus,
  Settings,
  Database,
  UserPlus,
  Trash2,
  Edit,
  Copy,
  CheckCircle,
  XCircle,
  Zap,
  HardDrive,
  KeyRound
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PasswordStrengthMeter, gerarSenhaForte } from '@/components/PasswordStrengthMeter';
import type { Database as DatabaseType } from '@/integrations/supabase/types';

type Empresa = DatabaseType['public']['Tables']['empresas']['Row'];

const EmpresaDashboard: React.FC = () => {
  const { id: empresaId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { empresas, isAdminMaster, currentUserType } = useEmpresas();
  const { 
    users, 
    loading: usersLoading, 
    error: usersError,
    createUser,
    resetPassword,
    fetchUsersByEmpresa,
    setupDefaultUsers,
    deleteUser,
    updateUser
  } = useEmpresaUsers();
  
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('visao-geral');

  // Cursos e certificados do tenant visualizado. admin_master passa na RLS
  // (policies de cursos/certificados têm OR is_admin_master()), então a busca
  // escopada por empresa_id retorna os dados do cliente para suporte.
  const [cursos, setCursos] = useState<{ id: string; nome: string; categoria: string | null; descricao: string | null; status: string }[]>([]);
  const [cursosLoading, setCursosLoading] = useState(true);
  const [certCount, setCertCount] = useState(0);

  useEffect(() => {
    if (!empresaId) return;
    let mounted = true;
    (async () => {
      setCursosLoading(true);
      const [cursosRes, certRes] = await Promise.all([
        supabase.from('cursos').select('id, nome, categoria, descricao, status').eq('empresa_id', empresaId).order('nome'),
        supabase.from('certificados').select('id', { count: 'exact', head: true }).eq('empresa_id', empresaId),
      ]);
      if (!mounted) return;
      if (cursosRes.error) console.error('Erro ao carregar cursos do tenant:', cursosRes.error);
      setCursos(cursosRes.data || []);
      setCertCount(certRes.count || 0);
      setCursosLoading(false);
    })();
    return () => { mounted = false; };
  }, [empresaId]);

  const { data: planLimits } = usePlanLimits(empresa ? { id: empresa.id, plan: empresa.plan } : undefined);
  const { data: monthlyUsage } = useMonthlyUsage(empresa?.id);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [newUser, setNewUser] = useState({
    nome: '',
    email: '',
    tipo_usuario: 'cliente' as 'cliente' | 'admin' | 'admin_master',
    senha: ''
  });
  const [setupLoading, setSetupLoading] = useState(false);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [createdPasswordEmail, setCreatedPasswordEmail] = useState<string | null>(null);
  // Reset de senha
  const [resetTarget, setResetTarget] = useState<{ id: string; nome: string; email: string } | null>(null);
  const [resetPwd, setResetPwd] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    if (empresaId && empresas.length > 0) {
      const foundEmpresa = empresas.find(e => e.id === empresaId);
      setEmpresa(foundEmpresa || null);
      setLoading(false);
      
      // Carregar usuários da empresa (fetchUsersByEmpresa is stable via useCallback)
      if (foundEmpresa) {
        fetchUsersByEmpresa(empresaId);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId, empresas]);

  // Verificar se é admin_master (usando o tipo original)
  if (currentUserType !== 'admin_master') {
    return (
      <ERALayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Acesso Negado</h2>
            <p className="text-gray-500">Apenas administradores master podem acessar esta página.</p>
            <p className="text-sm text-gray-400 mt-2">Tipo de usuário: {currentUserType || 'Não identificado'}</p>
          </div>
        </div>
      </ERALayout>
    );
  }

  if (loading) {
    return (
      <ERALayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          <span className="ml-2 text-gray-600">Carregando dados da empresa...</span>
        </div>
      </ERALayout>
    );
  }

  if (!empresa) {
    return (
      <ERALayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Empresa não encontrada</h2>
            <p className="text-gray-500 mb-4">A empresa solicitada não foi encontrada.</p>
            <Button onClick={() => navigate('/empresas')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Empresas
            </Button>
          </div>
        </div>
      </ERALayout>
    );
  }

  const handleAccessClient = () => {
    // Usa o parâmetro de simulação no domínio atual para não quebrar em subdomínios e proteger a conta original do admin
    const clientUrl = `${window.location.origin}/dashboard?simular_empresa=${empresa.id}`;
    window.open(clientUrl, '_blank');
    toast({
      title: "🔗 Acessando Empresa",
      description: `Redirecionando para ${empresa.nome}...`,
    });
  };

  const handleSetupNewClient = async () => {
    setSetupLoading(true);
    const result = await setupDefaultUsers(empresa.id, empresa.nome);
    
    if (result.success) {
      toast({
        title: "✅ Empresa Configurada",
        description: result.message,
      });
      setShowSetupModal(false);
    } else {
      toast({
        title: "❌ Erro na Configuração",
        description: result.message,
        variant: "destructive"
      });
    }
    setSetupLoading(false);
  };

  const handleCreateUser = async () => {
    if (!newUser.nome || !newUser.email) {
      toast({
        title: "❌ Campos Obrigatórios",
        description: "Nome e email são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const result = await createUser(empresa.id, newUser);
    
    if (result.success) {
      toast({
        title: "✅ Usuário Criado",
        description: result.message,
      });
      
      if (result.password) {
        setCreatedPassword(result.password);
        setCreatedPasswordEmail(newUser.email);
      }

      setShowCreateUserModal(false);
      setNewUser({ nome: '', email: '', tipo_usuario: 'cliente', senha: '' });
    } else {
      toast({
        title: "❌ Erro ao Criar Usuário",
        description: result.message,
        variant: "destructive"
      });
    }
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    setResetLoading(true);
    const result = await resetPassword(resetTarget.id, resetPwd || undefined);
    setResetLoading(false);
    if (result.success && result.password) {
      setCreatedPassword(result.password);
      setCreatedPasswordEmail(resetTarget.email);
      toast({ title: '✅ Senha redefinida', description: `Nova senha de ${resetTarget.email} gerada.` });
      setResetTarget(null);
      setResetPwd('');
    } else {
      toast({ title: '❌ Erro', description: result.message, variant: 'destructive' });
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (confirm(`Tem certeza que deseja deletar o usuário "${userName}"?`)) {
      const result = await deleteUser(userId);
      
      if (result.success) {
        toast({
          title: "✅ Usuário Deletado",
          description: result.message,
        });
      } else {
        toast({
          title: "❌ Erro ao Deletar",
          description: result.message,
          variant: "destructive"
        });
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "📋 Copiado!",
      description: "Senha copiada para a área de transferência",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Dados simulados da empresa
  const clientStats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'ativo').length,
    totalCourses: cursos.length,
    completedCourses: 0,
    totalCertificates: certCount,
    averageProgress: 0
  };

  const isNewClient = clientStats.totalUsers === 0 && clientStats.totalCourses === 0;

  return (
    <ERALayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/empresas')}>
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Voltar
            </Button>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 500, color: '#1F2041' }}>Dashboard da empresa</h1>
              <div className="flex items-center gap-2 mt-1.5">
                <Building2 className="h-4 w-4" style={{ color: '#4B3F72' }} />
                <span className="text-[15px] font-medium" style={{ color: '#4B3F72' }}>{empresa.nome}</span>
                <Badge variant={isNewClient ? 'starter' : 'ativo'} className="ml-1">
                  {isNewClient ? 'Nova empresa' : 'Ativo'}
                </Badge>
                <Badge variant="principal" className="ml-1">Admin Master</Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleAccessClient}>
              <ExternalLink className="h-4 w-4 mr-1.5" />
              Acessar site
            </Button>
            {isNewClient && (
              <Dialog open={showSetupModal} onOpenChange={setShowSetupModal}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Configurar empresa
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Configurar Empresa</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p>Isso irá criar usuários padrão para a empresa {empresa.nome}:</p>
                    <ul className="list-disc list-inside space-y-2">
                      <li>admin (Administrador)</li>
                      <li>cliente (Usuário comum)</li>
                    </ul>
                    <Button 
                      onClick={handleSetupNewClient}
                      disabled={setupLoading}
                      className="w-full"
                    >
                      {setupLoading ? 'Configurando...' : 'Confirmar Configuração'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <Dialog open={showCreateUserModal} onOpenChange={setShowCreateUserModal}>
              <DialogTrigger asChild>
                <Button size="sm" variant="secondary">
                  <UserPlus className="h-4 w-4 mr-1.5" />
                  Novo usuário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Usuário</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input
                      id="nome"
                      value={newUser.nome}
                      onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })}
                      placeholder="Nome do usuário"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="usuario@exemplo.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tipo">Tipo de Usuário</Label>
                    <Select
                       value={newUser.tipo_usuario}
                       onValueChange={(value) => setNewUser({ ...newUser, tipo_usuario: value as 'cliente' | 'admin' | 'admin_master' })}
                     >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cliente">Cliente</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="senha">Senha (opcional)</Label>
                      <button
                        type="button"
                        onClick={() => setNewUser({ ...newUser, senha: gerarSenhaForte() })}
                        className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                      >
                        Gerar senha forte
                      </button>
                    </div>
                    <Input
                      id="senha"
                      type="text"
                      value={newUser.senha}
                      onChange={(e) => setNewUser({ ...newUser, senha: e.target.value })}
                      placeholder="Deixe em branco para gerar automaticamente"
                    />
                    {newUser.senha && <PasswordStrengthMeter senha={newUser.senha} hint={false} />}
                    <p className="text-xs text-gray-400 mt-1">
                      Em branco = senha forte gerada automaticamente. A senha aparece uma vez após criar — anote e repasse ao usuário.
                    </p>
                  </div>
                  <Button 
                    onClick={handleCreateUser}
                    className="w-full"
                  >
                    Criar Usuário
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              onClick={handleAccessClient}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Eye className="h-4 w-4 mr-2" />
              Modo Visualização
            </Button>
          </div>
        </div>

        {/* Banner para Empresa Nova */}
        {isNewClient && (
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-green-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Plus className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-900 mb-1">
                    Empresa Nova - Ambiente Limpo
                  </h3>
                  <p className="text-blue-700">
                    Este é um ambiente novo para {empresa.nome}. Clique em "Configurar Empresa" para 
                    criar usuários padrão e preparar o ambiente para uso.
                  </p>
                </div>
                <Button 
                  onClick={() => setShowSetupModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Configurar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Banner de Senha Criada */}
        {createdPassword && (
          <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-900 mb-1">
                    Senha de acesso{createdPasswordEmail ? ` — ${createdPasswordEmail}` : ''}
                  </h3>
                  <p className="text-green-700">
                    Senha: <strong className="font-mono">{createdPassword}</strong>
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Anote e repasse ao usuário agora — por segurança, ela não pode ser exibida de novo.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => copyToClipboard(createdPassword)}
                    variant="outline"
                    size="sm"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copiar
                  </Button>
                  <Button 
                    onClick={() => setCreatedPassword(null)}
                    variant="outline"
                    size="sm"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs: Visão Geral | Usuários | Cursos | Relatórios */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="visao-geral">Visão geral</TabsTrigger>
            <TabsTrigger value="usuarios">Usuários ({users.length})</TabsTrigger>
            <TabsTrigger value="cursos">Cursos</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="visao-geral" className="space-y-4 mt-4">
        {/* Informações da Empresa */}
        <Card style={{ border: '0.5px solid #e4e5f0', borderRadius: '12px' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informações da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Detalhes</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nome:</span>
                    <span className="font-medium">{empresa.nome}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subdomínio:</span>
                    <span className="font-medium">{empresa.subdominio || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Criada em:</span>
                    <span className="font-medium">{empresa.created_at ? formatDate(empresa.created_at) : '-'}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Status da Plataforma</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge variant={empresa.plan_status === 'active' ? 'ativo' : 'inativo'}>
                      {empresa.plan_status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Usuários:</span>
                    <span className="font-medium">{clientStats.totalUsers} cadastrados</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Versão:</span>
                    <span className="font-medium">v3.0.0</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Uso do Plano ───────────────────────────────────────── */}
        {planLimits && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" style={{ color: planLimits.planColor }} />
                  Uso do Plano — {planLimits.planName}
                </div>
                {(planLimits.isAtLimit || planLimits.isNearLimit) && (
                  <Badge variant={planLimits.isAtLimit ? 'destructive' : 'secondary'} className={planLimits.isNearLimit && !planLimits.isAtLimit ? 'bg-amber-100 text-amber-800' : ''}>
                    {planLimits.isAtLimit ? 'Limite Atingido' : `${planLimits.usagePercent}% Usado`}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                {/* Users usage */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="h-4 w-4" />
                      <span className="text-sm font-medium">Usuários</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {planLimits.maxUsers >= 9999 ? 'Ilimitado' : `${planLimits.remainingSlots} vagas restantes`}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900">{planLimits.currentUsers}</span>
                    <span className="text-sm text-gray-500">/ {planLimits.maxUsers >= 9999 ? '\u221e' : planLimits.maxUsers}</span>
                  </div>
                  {planLimits.maxUsers < 9999 && (
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${planLimits.usagePercent}%`,
                          background: planLimits.isAtLimit ? '#EF4444' : planLimits.isNearLimit ? '#F59E0B' : planLimits.planColor,
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Watch hours */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Zap className="h-4 w-4" />
                    <span className="text-sm font-medium">Horas assistidas ({monthlyUsage?.currentMonth})</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {monthlyUsage?.totalWatchHours ?? '—'}
                  </div>
                </div>

                {/* Bandwidth */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <HardDrive className="h-4 w-4" />
                    <span className="text-sm font-medium">Bandwidth de vídeo</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {monthlyUsage?.totalGb ?? '—'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {/* ───────────────────────────────────────────────────────── */}

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total de Usuários</p>
                  <p className="text-3xl font-bold text-gray-900">{clientStats.totalUsers}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {isNewClient ? 'Nenhum usuário cadastrado' : `${clientStats.activeUsers} ativos`}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Cursos Ativos</p>
                  <p className="text-3xl font-bold text-gray-900">{clientStats.totalCourses}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {isNewClient ? 'Nenhum curso cadastrado' : `${clientStats.completedCourses} concluídos`}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Certificados</p>
                  <p className="text-3xl font-bold text-gray-900">{clientStats.totalCertificates}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {isNewClient ? 'Nenhum certificado emitido' : '+0 esta semana'}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Progresso Médio</p>
                  <p className="text-3xl font-bold text-gray-900">{clientStats.averageProgress}%</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {isNewClient ? 'Sem dados disponíveis' : '+0% este mês'}
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Usuários Ativos</p>
                  <p className="text-3xl font-bold text-gray-900">{clientStats.activeUsers}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {isNewClient ? '0% do total' : `${clientStats.totalUsers > 0 ? Math.round((clientStats.activeUsers / clientStats.totalUsers) * 100) : 0}% do total`}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Última Atividade</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {isNewClient ? 'Nunca' : 'Hoje'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {isNewClient ? 'Empresa ainda não configurada' : 'Sem atividades recentes'}
                  </p>
                </div>
                <div className="bg-gray-100 p-3 rounded-full">
                  <Calendar className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

          </TabsContent>

          <TabsContent value="usuarios" className="mt-4">
        {/* Lista de Usuários */}
        <Card style={{ border: '0.5px solid #e4e5f0', borderRadius: '12px' }}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-[16px] font-medium" style={{ color: '#1F2041' }}>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" style={{ color: '#4B3F72' }} />
                Usuários da empresa
              </div>
              <Button 
                onClick={() => setShowCreateUserModal(true)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600">Carregando usuários...</span>
              </div>
            ) : usersError ? (
              <div className="text-center py-8 text-red-600">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>{usersError}</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum usuário cadastrado nesta empresa</p>
                <Button 
                  onClick={() => setShowCreateUserModal(true)}
                  className="mt-4"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Criar Primeiro Usuário
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Nome</th>
                      <th className="text-left py-3 px-4 font-medium">Email</th>
                      <th className="text-left py-3 px-4 font-medium">Tipo</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Criado em</th>
                      <th className="text-left py-3 px-4 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{user.nome}</td>
                        <td className="py-3 px-4">{user.email}</td>
                        <td className="py-3 px-4">
                          <Badge variant={user.tipo_usuario === 'admin' ? 'default' : 'secondary'}>
                            {user.tipo_usuario}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={user.status === 'ativo' ? 'default' : 'destructive'}>
                            {user.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {formatDate(user.data_criacao || '')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              title="Redefinir senha"
                              onClick={() => { setResetTarget({ id: user.id, nome: user.nome, email: user.email }); setResetPwd(''); }}
                            >
                              <KeyRound className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteUser(user.id, user.nome)}
                              className="text-red-600 hover:text-red-700"
                              title="Excluir usuário"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

          </TabsContent>

          <TabsContent value="cursos" className="mt-4">
            <Card style={{ border: '0.5px solid #e4e5f0', borderRadius: '12px' }}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-[16px] font-medium" style={{ color: '#1F2041' }}>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" style={{ color: '#4B3F72' }} />
                    Cursos da empresa
                  </div>
                  <Button size="sm" variant="secondary" onClick={handleAccessClient}>
                    <Eye className="h-4 w-4 mr-1.5" />
                    Modo Visualização
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cursosLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                    <span className="ml-2 text-gray-600">Carregando cursos...</span>
                  </div>
                ) : cursos.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <BookOpen className="h-10 w-10 mx-auto mb-3" style={{ color: '#e4e5f0' }} />
                    <p className="text-[14px]">Esta empresa ainda não criou nenhum curso.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Nome</th>
                          <th className="text-left py-3 px-4 font-medium">Categoria</th>
                          <th className="text-left py-3 px-4 font-medium">Status</th>
                          <th className="text-left py-3 px-4 font-medium">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cursos.map((curso) => (
                          <tr key={curso.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{curso.nome}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{curso.categoria || '—'}</td>
                            <td className="py-3 px-4">
                              <Badge variant={curso.status === 'ativo' ? 'ativo' : 'inativo'}>
                                {curso.status === 'ativo' ? 'Ativo' : curso.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`${window.location.origin}/curso/${curso.id}?simular_empresa=${empresa.id}`, '_blank')}
                              >
                                <ExternalLink className="h-3 w-3 mr-1.5" />
                                Abrir
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="relatorios" className="mt-4">
            <Card style={{ border: '0.5px solid #e4e5f0', borderRadius: '12px' }}>
              <CardContent className="py-12 text-center text-gray-400">
                <BarChart3 className="h-10 w-10 mx-auto mb-3" style={{ color: '#e4e5f0' }} />
                <p className="text-[14px]">Relatórios de uso e progresso em breve.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal: redefinir senha de um usuário (substituto seguro do "ver senha") */}
        <Dialog open={!!resetTarget} onOpenChange={(o) => { if (!o) { setResetTarget(null); setResetPwd(''); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Redefinir senha {resetTarget ? `de ${resetTarget.nome}` : ''}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                A senha atual não pode ser exibida (fica criptografada). Defina uma nova senha —
                ela aparecerá uma vez para você repassar a <strong>{resetTarget?.email}</strong>.
              </p>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="reset-pwd">Nova senha</Label>
                  <button
                    type="button"
                    onClick={() => setResetPwd(gerarSenhaForte())}
                    className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Gerar senha forte
                  </button>
                </div>
                <Input
                  id="reset-pwd"
                  type="text"
                  value={resetPwd}
                  onChange={(e) => setResetPwd(e.target.value)}
                  placeholder="Em branco = gerar automaticamente"
                />
                {resetPwd && <PasswordStrengthMeter senha={resetPwd} hint={false} />}
              </div>
              <Button onClick={handleResetPassword} disabled={resetLoading} className="w-full">
                {resetLoading ? 'Redefinindo...' : 'Redefinir senha'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ERALayout>
  );
};

export default EmpresaDashboard;
