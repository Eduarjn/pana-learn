import { ERALayout } from '@/components/ERALayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Users, UserPlus, Edit } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface UserListItem {
  id: string;
  nome: string;
  email: string;
  user_id: string;
  tipo_usuario: string;
  status: string;
  data_criacao: string;
  data_atualizacao: string;
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

  useEffect(() => {
    fetchUsers();
    // Atualiza a cada 1 hora
    const interval = setInterval(fetchUsers, 3600000);
    return () => clearInterval(interval);
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('usuarios').select('*').order('data_criacao', { ascending: false });
    if (!error && data) {
      setUsers(data as UserListItem[]);
    }
  };

  // Exibir todos os usuários (clientes e administradores) para o admin
  const filteredUsers = users.filter(user =>
    user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

        {/* Search and Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-era-dark-blue">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Lista de Usuários
              </span>
              <Button 
                className="era-lime-button"
                onClick={() => setShowNewUserForm(!showNewUserForm)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-era-gray" />
              <Input
                placeholder="Buscar por nome, login ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardContent>
        </Card>

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
            <CardTitle className="text-era-dark-blue">Usuários Cadastrados ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
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
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.nome}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.tipo_usuario === 'admin'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {user.tipo_usuario === 'admin' ? 'Administrador' : 'Cliente'}
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
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditUser(user as UserListItem)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
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

export default Usuarios;
