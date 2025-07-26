import { ERALayout } from '@/components/ERALayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Users, UserPlus, Edit } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import UsersFilters from '@/components/UsersFilters';

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
  const { toast } = useToast();
  const [showEmailValidationMsg, setShowEmailValidationMsg] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch users from API with filters
  const fetchUsers = async (search = searchTerm, role = selectedRole, status = selectedStatus) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (role) params.append('role', role);
    if (status) params.append('status', status);
    const res = await fetch(`/api/users?${params.toString()}`);
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  };

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [searchTerm, selectedRole, selectedStatus]);

  const handleNewUserSubmit = async () => {
    if (!newUser.nome || !newUser.email) {
      toast({ title: 'Preencha nome e email', variant: 'destructive' });
      return;
    }
    // Gerar senha aleatória
    const senha = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-2);
    try {
      // 1. Criar no Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: newUser.email,
        password: senha,
        options: {
          data: {
            nome: newUser.nome
            // tipo_usuario será definido pela trigger
          }
        }
      });
      if (error) throw error;
      toast({ title: 'Usuário cadastrado com sucesso!', description: `Senha provisória: ${senha}` });
      setShowNewUserForm(false);
      setNewUser({ nome: '', email: '', login: '', tipo: 'Cliente', status: 'Ativo' });
      setShowEmailValidationMsg(true);
      fetchUsers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({ title: 'Erro ao cadastrar usuário', description: message, variant: 'destructive' });
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-era-dark-blue">Usuários</h1>
          <p className="text-era-gray">Gerencie usuários e permissões do sistema</p>
        </div>

        {/* Search and Filters - Fixo no topo */}
        <div className="sticky top-0 z-10 bg-era-light-gray-2 pb-2">
          <UsersFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedRole={selectedRole}
            setSelectedRole={setSelectedRole}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            onNewUserClick={() => setShowNewUserForm(!showNewUserForm)}
          />
        </div>

        {/* New User Form */}
        {showNewUserForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-era-dark-blue">
                <UserPlus className="h-5 w-5" />
                Cadastrar Novo Usuário
              </CardTitle>
              <CardDescription>
                Preencha os dados abaixo para criar um novo usuário no sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    placeholder="Digite o nome completo"
                    value={newUser.nome}
                    onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@empresa.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="login">Login</Label>
                  <Input
                    id="login"
                    placeholder="nome.sobrenome"
                    value={newUser.login}
                    onChange={(e) => setNewUser({ ...newUser, login: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Usuário</Label>
                  <select
                    id="tipo"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={newUser.tipo}
                    onChange={(e) => setNewUser({ ...newUser, tipo: e.target.value })}
                  >
                    <option value="Cliente">Cliente</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={newUser.status}
                    onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="era-lime-button" onClick={handleNewUserSubmit}>
                  Cadastrar Usuário
                </Button>
                <Button variant="outline" onClick={() => setShowNewUserForm(false)}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {showEmailValidationMsg && (
          <div className="my-4 p-4 rounded-lg bg-yellow-50 border-l-4 border-yellow-400 text-yellow-900 font-medium shadow">
            Usuário cadastrado! Peça para o usuário verificar o e-mail informado para validar e ativar o acesso à plataforma.
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && editingUser && (
          <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Usuário</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-nome">Nome Completo</Label>
                  <Input
                    id="edit-nome"
                    value={editingUser.nome}
                    onChange={(e) => setEditingUser({ ...editingUser, nome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-tipo">Tipo de Usuário</Label>
                  <select
                    id="edit-tipo"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={editingUser.tipo_usuario}
                    onChange={(e) => setEditingUser({ ...editingUser, tipo_usuario: e.target.value as 'admin' | 'cliente' })}
                  >
                    <option value="cliente">Cliente</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <select
                    id="edit-status"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={editingUser.status}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as 'ativo' | 'inativo' | 'pendente' })}
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                    <option value="pendente">Pendente</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveEdit} className="era-lime-button">
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-era-dark-blue">Usuários Cadastrados ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Login</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Cadastro</TableHead>
                    <TableHead>Último Acesso</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <span className="text-era-gray">Carregando...</span>
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <span className="text-era-gray">Nenhum usuário encontrado.</span>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.nome}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.login || user.email}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.tipo_usuario === 'admin'
                              ? 'bg-blue-100 text-blue-800'
                              : user.tipo_usuario === 'admin_master'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {user.tipo_usuario === 'admin' ? 'Administrador' : user.tipo_usuario === 'admin_master' ? 'Admin Master' : 'Cliente'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.status === 'ativo'
                              ? 'bg-green-100 text-green-800'
                              : user.status === 'inativo'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell>{user.data_criacao ? new Date(user.data_criacao).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>{user.data_atualizacao ? new Date(user.data_atualizacao).toLocaleDateString() : '-'}</TableCell>
                        <TableCell className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditUser(user as UserListItem)}
                            title="Editar"
                          >
                            ✏️
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            title="Excluir"
                            onClick={async () => {
                              if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
                                await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
                                fetchUsers();
                              }
                            }}
                          >
                            🗑️
                          </Button>
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
    </ERALayout>
  );
};

export default Usuarios;
