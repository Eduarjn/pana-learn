import { ERALayout } from '@/components/ERALayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Plus, Users, UserCheck, Shield, Edit, Trash2, Mail, Calendar, Clock, User, Download, MoreHorizontal, Smartphone } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface UserListItem {
  id: string;
  nome: string;
  email: string;
  user_id: string;
  tipo_usuario: string;
  status: string;
  data_criacao: string;
  data_atualizacao: string;
  login?: string;
}

interface UserStats {
  total: number;
  ativos: number;
  administradores: number;
  novosEstaSemana: number;
}

const Usuarios = () => {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.tipo_usuario === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<Database['public']['Tables']['usuarios']['Row'] | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newUser, setNewUser] = useState({
    nome: '',
    email: '',
    login: '',
    tipo: 'Cliente',
    status: 'Ativo'
  });
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [allUsers, setAllUsers] = useState<UserListItem[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    total: 0,
    ativos: 0,
    administradores: 0,
    novosEstaSemana: 0
  });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const { toast } = useToast();
  const [showEmailValidationMsg, setShowEmailValidationMsg] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Detectar se é mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch users from API
  const fetchUsers = async (search = searchTerm) => {
    setLoading(true);
    try {
      // Buscar todos os usuários do Supabase com contagem exata
      const { data: usersData, count, error } = await supabase
        .from('usuarios')
        .select('*', { count: 'exact' })
        .order('data_criacao', { ascending: false });

      if (error) {
        console.error('Erro ao buscar usuários:', error);
        toast({ title: 'Erro ao carregar usuários', description: error.message, variant: 'destructive' });
        setLoading(false);
        return;
      }

      const allUsersData = usersData || [];
      setAllUsers(allUsersData);

      // Filtrar localmente se houver termo de busca
      let filteredUsers = allUsersData;
      if (search.trim()) {
        filteredUsers = allUsersData.filter(user => 
          user.nome?.toLowerCase().includes(search.toLowerCase()) ||
          user.email?.toLowerCase().includes(search.toLowerCase()) ||
          user.login?.toLowerCase().includes(search.toLowerCase())
        );
      }

      setUsers(filteredUsers);

      // Calcular estatísticas
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const stats: UserStats = {
        total: allUsersData.length,
        ativos: allUsersData.filter(user => user.status === 'ativo').length,
        administradores: allUsersData.filter(user => user.tipo_usuario === 'admin').length,
        novosEstaSemana: allUsersData.filter(user => 
          new Date(user.data_criacao) >= oneWeekAgo
        ).length
      };

      setUserStats(stats);
    } catch (error) {
      console.error('Erro inesperado ao buscar usuários:', error);
      toast({ title: 'Erro ao carregar usuários', description: 'Erro interno do servidor', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Carregar usuários quando o componente montar
  useEffect(() => {
    if (userProfile) {
      fetchUsers();
    }
  }, [userProfile]);

  // Debounce para busca
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm]);

  const handleSearch = () => {
    fetchUsers();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.map(user => user.id));
      setSelectAll(true);
    } else {
      setSelectedUsers([]);
      setSelectAll(false);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedUsers.length === 0) {
      toast({ title: 'Nenhum usuário selecionado', description: 'Selecione pelo menos um usuário', variant: 'destructive' });
      return;
    }

    const actionText = {
      activate: 'ativar',
      deactivate: 'desativar',
      delete: 'excluir'
    }[action];

    if (!window.confirm(`Tem certeza que deseja ${actionText} ${selectedUsers.length} usuário(s)?`)) {
      return;
    }

    try {
      let updateData: any = {};
      
      if (action === 'activate') {
        updateData = { status: 'ativo' };
      } else if (action === 'deactivate') {
        updateData = { status: 'inativo' };
      }

      if (action === 'delete') {
        const { error } = await supabase
          .from('usuarios')
          .delete()
          .in('id', selectedUsers);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('usuarios')
          .update(updateData)
          .in('id', selectedUsers);

        if (error) throw error;
      }

      toast({ title: `Usuários ${actionText} com sucesso!` });
      setSelectedUsers([]);
      setSelectAll(false);
      fetchUsers();
    } catch (error) {
      console.error(`Erro ao ${actionText} usuários:`, error);
      toast({ title: `Erro ao ${actionText} usuários`, description: 'Erro interno do servidor', variant: 'destructive' });
    }
  };

  const exportUsers = (format: 'csv' | 'json') => {
    const data = users.map(user => ({
      Nome: user.nome,
      Email: user.email,
      Login: user.login || '',
      Tipo: user.tipo_usuario,
      Status: user.status,
      'Data de Criação': new Date(user.data_criacao).toLocaleDateString('pt-BR')
    }));

    if (format === 'csv') {
      const headers = Object.keys(data[0] || {});
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `usuarios_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `usuarios_${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    toast({ title: 'Exportação concluída', description: `Arquivo ${format.toUpperCase()} baixado com sucesso` });
  };

  const handleNewUserSubmit = async () => {
    if (!newUser.nome || !newUser.email) {
      toast({ title: 'Campos obrigatórios', description: 'Nome e email são obrigatórios', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase
        .from('usuarios')
        .insert({
          nome: newUser.nome,
          email: newUser.email,
          login: newUser.login || newUser.email,
          tipo_usuario: newUser.tipo === 'Cliente' ? 'cliente' : 'admin',
          status: newUser.status === 'Ativo' ? 'ativo' : 'inativo'
        });

      if (error) throw error;

      toast({ title: 'Usuário criado com sucesso!' });
      setNewUser({ nome: '', email: '', login: '', tipo: 'Cliente', status: 'Ativo' });
      setShowNewUserForm(false);
      fetchUsers();
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      toast({ title: 'Erro ao criar usuário', description: 'Erro interno do servidor', variant: 'destructive' });
    }
  };

  const handleEditUser = (user: UserListItem) => {
    setEditingUser(user as Database['public']['Tables']['usuarios']['Row']);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('usuarios')
        .update({
          nome: editingUser.nome,
          email: editingUser.email,
          login: editingUser.login,
          tipo_usuario: editingUser.tipo_usuario,
          status: editingUser.status,
          data_atualizacao: new Date().toISOString()
        })
        .eq('id', editingUser.id);

      if (error) throw error;
      
      toast({ title: 'Usuário atualizado com sucesso!' });
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({ title: 'Erro ao atualizar usuário', description: message, variant: 'destructive' });
    }
  };

  return (
    <ERALayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
        {/* Hero Section com gradiente */}
        <div className="page-hero w-full rounded-xl lg:rounded-2xl flex flex-col md:flex-row justify-between items-center p-4 lg:p-8 mb-6 lg:mb-8 shadow-md" style={{background: 'linear-gradient(90deg, #7C3AED 0%, #2563EB 40%, #CCFF00 100%)'}}>
          <div className="px-4 lg:px-6 py-6 lg:py-8 md:py-12 w-full">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 lg:gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <span className="text-xs lg:text-sm font-medium text-yellow-200">Plataforma de Ensino</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 lg:mb-3 bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">
                    Usuários
                  </h1>
                  <p className="text-sm sm:text-base lg:text-lg md:text-xl text-blue-100 max-w-2xl">
                    Gerencie usuários e permissões da plataforma
                  </p>
                  <div className="flex flex-wrap items-center gap-2 lg:gap-4 mt-3 lg:mt-4">
                    <div className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm">
                      <Users className="h-3 w-3 lg:h-4 lg:w-4 text-yellow-300" />
                      <span>Gestão completa</span>
                    </div>
                    <div className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm">
                      <Shield className="h-3 w-3 lg:h-4 lg:w-4 text-yellow-300" />
                      <span>Controle de acesso</span>
                    </div>
                    <div className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm">
                      <UserCheck className="h-3 w-3 lg:h-4 lg:w-4 text-yellow-300" />
                      <span>Status dos usuários</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 lg:px-6 py-6 lg:py-8">
          <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl md:text-2xl font-bold text-gray-900">{userStats.total}</p>
                      <p className="text-xs md:text-sm text-gray-600">+{userStats.novosEstaSemana} novos esta semana</p>
                    </div>
                    <div className="p-2 md:p-3 bg-blue-100 rounded-full">
                      <Users className="h-4 w-4 md:h-6 md:w-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-sm md:text-lg font-semibold text-gray-900 mt-2">Total de Usuários</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl md:text-2xl font-bold text-gray-900">{userStats.ativos}</p>
                      <p className="text-xs md:text-sm text-gray-600">{userStats.total > 0 ? Math.round((userStats.ativos / userStats.total) * 100) : 0}% do total</p>
                    </div>
                    <div className="p-2 md:p-3 bg-green-100 rounded-full">
                      <UserCheck className="h-4 w-4 md:h-6 md:w-6 text-green-600" />
                    </div>
                  </div>
                  <p className="text-sm md:text-lg font-semibold text-gray-900 mt-2">Usuários Ativos</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl md:text-2xl font-bold text-gray-900">{userStats.administradores}</p>
                      <p className="text-xs md:text-sm text-gray-600">{userStats.total > 0 ? Math.round((userStats.administradores / userStats.total) * 100) : 0}% do total</p>
                    </div>
                    <div className="p-2 md:p-3 bg-purple-100 rounded-full">
                      <Shield className="h-4 w-4 md:h-6 md:w-6 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-sm md:text-lg font-semibold text-gray-900 mt-2">Administradores</p>
                </CardContent>
              </Card>
            </div>

            {/* Barra de Busca + Botão */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, login ou e-mail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 h-10 lg:h-12 text-sm lg:text-base border-2 border-gray-200 focus:border-blue-500 rounded-lg lg:rounded-xl transition-all duration-300"
                />
                <Button 
                  variant="outline"
                  onClick={handleSearch}
                  className="px-3 h-10 lg:h-12 border-2 border-gray-200 hover:border-blue-500 text-gray-700 hover:text-blue-700 rounded-lg transition-all duration-300 hover:scale-105"
                >
                  Buscar
                </Button>
              </div>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-10 lg:h-12 border-2 border-gray-200 hover:border-green-500 text-gray-700 hover:text-green-700 rounded-lg transition-all duration-300 hover:scale-105">
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => exportUsers('csv')}>
                      Exportar CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportUsers('json')}>
                      Exportar JSON
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white h-10 lg:h-12 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
                  onClick={() => setShowNewUserForm(!showNewUserForm)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {isMobile ? 'Novo' : '+ Novo Usuário'}
                </Button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-blue-800">
                        {selectedUsers.length} usuário(s) selecionado(s)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkAction('activate')}
                        className="text-green-700 border-green-300 hover:bg-green-50"
                      >
                        Ativar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkAction('deactivate')}
                        className="text-yellow-700 border-yellow-300 hover:bg-yellow-50"
                      >
                        Desativar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkAction('delete')}
                        className="text-red-700 border-red-300 hover:bg-red-50"
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Formulário de Novo Usuário */}
            {showNewUserForm && (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  <CardTitle className="flex items-center gap-3 text-white font-bold text-xl">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Plus className="h-6 w-6" />
                    </div>
                    <span>Novo Usuário</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nome">Nome *</Label>
                      <Input
                        id="nome"
                        value={newUser.nome}
                        onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })}
                        className="h-10 lg:h-12 text-sm lg:text-base border-2 border-gray-200 focus:border-blue-500 rounded-lg lg:rounded-xl transition-all duration-300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        className="h-10 lg:h-12 text-sm lg:text-base border-2 border-gray-200 focus:border-blue-500 rounded-lg lg:rounded-xl transition-all duration-300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="login">Login</Label>
                      <Input
                        id="login"
                        value={newUser.login}
                        onChange={(e) => setNewUser({ ...newUser, login: e.target.value })}
                        placeholder="Deixe vazio para usar o email"
                        className="h-10 lg:h-12 text-sm lg:text-base border-2 border-gray-200 focus:border-blue-500 rounded-lg lg:rounded-xl transition-all duration-300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tipo">Tipo</Label>
                      <select
                        id="tipo"
                        value={newUser.tipo}
                        onChange={(e) => setNewUser({ ...newUser, tipo: e.target.value })}
                        className="flex h-10 lg:h-12 w-full rounded-lg lg:rounded-xl border-2 border-gray-200 focus:border-blue-500 bg-background px-3 py-2 text-sm lg:text-base transition-all duration-300"
                      >
                        <option value="Cliente">Cliente</option>
                        <option value="Admin">Administrador</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <select
                        id="status"
                        value={newUser.status}
                        onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
                        className="flex h-10 lg:h-12 w-full rounded-lg lg:rounded-xl border-2 border-gray-200 focus:border-blue-500 bg-background px-3 py-2 text-sm lg:text-base transition-all duration-300"
                      >
                        <option value="Ativo">Ativo</option>
                        <option value="Inativo">Inativo</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      onClick={handleNewUserSubmit}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
                    >
                      Criar Usuário
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setShowNewUserForm(false)}
                      className="border-2 border-gray-200 hover:border-red-500 text-gray-700 hover:text-red-700 rounded-lg transition-all duration-300 hover:scale-105"
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabela de Usuários */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <CardTitle className="flex items-center gap-3 text-white font-bold text-xl">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Users className="h-6 w-6" />
                  </div>
                  <span>Lista de Usuários</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectAll}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead className="font-medium text-gray-900">Nome</TableHead>
                        <TableHead className="font-medium text-gray-900">Email</TableHead>
                        <TableHead className="font-medium text-gray-900">Login</TableHead>
                        <TableHead className="font-medium text-gray-900">Tipo</TableHead>
                        <TableHead className="font-medium text-gray-900">Status</TableHead>
                        <TableHead className="font-medium text-gray-900">Data Criação</TableHead>
                        <TableHead className="font-medium text-gray-900">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                              <span className="ml-2 text-gray-600">Carregando usuários...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <div className="text-gray-500">
                              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                              <p className="text-lg font-medium">Nenhum usuário encontrado</p>
                              <p className="text-sm">Tente ajustar os filtros de busca</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedUsers.includes(user.id)}
                                onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                              />
                            </TableCell>
                            <TableCell className="font-medium text-gray-900">{user.nome}</TableCell>
                            <TableCell className="text-gray-700">{user.email}</TableCell>
                            <TableCell className="text-gray-700">{user.login || '-'}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                user.tipo_usuario === 'admin' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {user.tipo_usuario === 'admin' ? 'Admin' : 'Cliente'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                user.status === 'ativo' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {user.status === 'ativo' ? 'Ativo' : 'Inativo'}
                              </span>
                            </TableCell>
                            <TableCell className="text-gray-700">
                              {new Date(user.data_criacao).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell>
                              {isMobile ? (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleEditUser(user as UserListItem)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={async () => {
                                        if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
                                          try {
                                            const { error } = await supabase
                                              .from('usuarios')
                                              .delete()
                                              .eq('id', user.id);
                                            
                                            if (error) {
                                              toast({ title: 'Erro ao excluir usuário', description: error.message, variant: 'destructive' });
                                              return;
                                            }
                                            
                                            toast({ title: 'Usuário excluído com sucesso!' });
                                            fetchUsers();
                                          } catch (error) {
                                            console.error('Erro ao excluir usuário:', error);
                                            toast({ title: 'Erro ao excluir usuário', description: 'Erro interno do servidor', variant: 'destructive' });
                                          }
                                        }
                                      }}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Excluir
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              ) : (
                                <div className="flex gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleEditUser(user as UserListItem)}
                                    title="Editar"
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                    title="Excluir"
                                    onClick={async () => {
                                      if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
                                        try {
                                          const { error } = await supabase
                                            .from('usuarios')
                                            .delete()
                                            .eq('id', user.id);
                                          
                                          if (error) {
                                            toast({ title: 'Erro ao excluir usuário', description: error.message, variant: 'destructive' });
                                            return;
                                          }
                                          
                                          toast({ title: 'Usuário excluído com sucesso!' });
                                          fetchUsers();
                                        } catch (error) {
                                          console.error('Erro ao excluir usuário:', error);
                                          toast({ title: 'Erro ao excluir usuário', description: 'Erro interno do servidor', variant: 'destructive' });
                                        }
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de Edição */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-nome" className="text-right">
                  Nome
                </Label>
                <Input
                  id="edit-nome"
                  value={editingUser.nome}
                  onChange={(e) => setEditingUser({ ...editingUser, nome: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">
                  Email
                </Label>
                <Input
                  id="edit-email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-login" className="text-right">
                  Login
                </Label>
                <Input
                  id="edit-login"
                  value={editingUser.login || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, login: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-tipo" className="text-right">
                  Tipo
                </Label>
                <select
                  id="edit-tipo"
                  value={editingUser.tipo_usuario}
                  onChange={(e) => setEditingUser({ ...editingUser, tipo_usuario: e.target.value })}
                  className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="cliente">Cliente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-status" className="text-right">
                  Status
                </Label>
                <select
                  id="edit-status"
                  value={editingUser.status}
                  onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                  className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ERALayout>
  );
};

export default Usuarios;
