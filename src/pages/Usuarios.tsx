import { ERALayout } from '@/components/ERALayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Search, Plus, Users, Edit, Trash2,
  Clock, Download, MoreHorizontal, Award, Activity
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

interface UserListItem {
  id: string; nome: string; email: string; user_id: string;
  tipo_usuario: string; status: string; data_criacao: string;
  data_atualizacao: string; ultimo_login?: string | null; login?: string;
}
interface UserStats { total: number; ativos: number; administradores: number; novosEstaSemana: number; }

const formatLastLogin = (d: string | null | undefined) => {
  if (!d) return 'Nunca';
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 3600000);
  if (diff < 1) return 'Agora mesmo';
  if (diff < 24) return `${diff}h atrás`;
  if (diff < 168) { const days = Math.floor(diff / 24); return `${days}d atrás`; }
  return new Date(d).toLocaleDateString('pt-BR');
};

const USER_TYPE_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  admin_master: { bg: '#EDE9FE', text: '#5B21B6', label: 'Admin Master' },
  admin:        { bg: '#F0FDF4', text: '#166534', label: 'Admin' },
  cliente:      { bg: '#F1F5F9', text: '#475569', label: 'Cliente' },
};
const getUserTypeStyle = (t: string) => USER_TYPE_STYLE[t] ?? USER_TYPE_STYLE.cliente;

const Usuarios = () => {
  const { userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<Database['public']['Tables']['usuarios']['Row'] | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [newUser, setNewUser] = useState({ nome: '', email: '', tipo: 'Cliente', status: 'Ativo' });
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({ total: 0, ativos: 0, administradores: 0, novosEstaSemana: 0 });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [sortField, setSortField] = useState<'nome' | 'email' | 'ultimo_login' | 'tipo_usuario' | 'data_criacao'>('data_criacao');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showCertificatesModal, setShowCertificatesModal] = useState(false);
  const [selectedUserCertificates, setSelectedUserCertificates] = useState<Database['public']['Tables']['certificados']['Row'][]>([]);
  const [selectedUserProgress, setSelectedUserProgress] = useState<{ userId: string; userName: string; progress: Database['public']['Tables']['progresso_usuario']['Row'][] } | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const fetchUsers = async (search = searchTerm) => {
    setLoading(true);
    try {
      const { data } = await supabase.from('usuarios').select('*', { count: 'exact' }).order(sortField, { ascending: sortDirection === 'asc' });
      const all = data || [];
      const filtered = search.trim()
        ? all.filter(u => u.nome?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
        : all;
      setUsers(filtered);
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 3600000);
      setUserStats({
        total: all.length,
        ativos: all.filter(u => u.status === 'ativo').length,
        administradores: all.filter(u => u.tipo_usuario === 'admin').length,
        novosEstaSemana: all.filter(u => new Date(u.data_criacao) >= oneWeekAgo).length
      });
    } catch {
      toast({ title: 'Erro ao carregar usuários', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  useEffect(() => { if (userProfile) fetchUsers(); }, [userProfile]);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchUsers(), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchTerm, sortField, sortDirection]);

  const handleSort = (field: typeof sortField) => {
    sortField === field ? setSortDirection(d => d === 'asc' ? 'desc' : 'asc') : (setSortField(field), setSortDirection('asc'));
  };

  const handleSelectAll = (checked: boolean) => { setSelectAll(checked); setSelectedUsers(checked ? users.map(u => u.id) : []); };
  const handleSelectUser = (id: string, checked: boolean) => setSelectedUsers(prev => checked ? [...prev, id] : prev.filter(x => x !== id));

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (!selectedUsers.length) { toast({ title: 'Selecione usuários', variant: 'destructive' }); return; }
    if (!window.confirm('Tem certeza?')) return;
    try {
      if (action === 'delete') { await supabase.from('usuarios').delete().in('id', selectedUsers); }
      else { await supabase.from('usuarios').update({ status: action === 'activate' ? 'ativo' : 'inativo' }).in('id', selectedUsers); }
      toast({ title: 'Ação realizada!' });
      setSelectedUsers([]); setSelectAll(false); fetchUsers();
    } catch { toast({ title: 'Erro na ação em massa', variant: 'destructive' }); }
  };

  const exportUsers = (format: 'csv' | 'json') => {
    const data = users.map(u => ({ Nome: u.nome, Email: u.email, Tipo: u.tipo_usuario, Status: u.status, Criação: new Date(u.data_criacao).toLocaleDateString('pt-BR') }));
    const content = format === 'csv'
      ? [Object.keys(data[0] || {}).join(','), ...data.map(r => Object.values(r).map(v => `"${v}"`).join(','))].join('\n')
      : JSON.stringify(data, null, 2);
    const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `usuarios.${format}` });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    toast({ title: 'Exportação concluída' });
  };

  const handleNewUserSubmit = async () => {
    if (!newUser.nome || !newUser.email) { toast({ title: 'Nome e email obrigatórios', variant: 'destructive' }); return; }
    const { error } = await supabase.from('usuarios').insert({
      nome: newUser.nome, email: newUser.email,
      tipo_usuario: (newUser.tipo === 'Cliente' ? 'cliente' : 'admin') as any,
      status: (newUser.status === 'Ativo' ? 'ativo' : 'inativo') as any
    });
    if (error) { toast({ title: 'Erro ao criar usuário', description: error.code === '23505' ? 'Email já existe' : error.message, variant: 'destructive' }); return; }
    toast({ title: 'Usuário criado!' }); setNewUser({ nome: '', email: '', tipo: 'Cliente', status: 'Ativo' }); setShowNewUserForm(false); fetchUsers();
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    const { error } = await supabase.from('usuarios').update({
      nome: editingUser.nome, email: editingUser.email,
      tipo_usuario: editingUser.tipo_usuario as any, status: editingUser.status as any,
      data_atualizacao: new Date().toISOString()
    }).eq('id', editingUser.id);
    if (error) { toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Usuário atualizado!' }); setShowEditModal(false); setEditingUser(null); fetchUsers();
  };

  const handleChangeUserPassword = async () => {
    if (!editingUser || newPassword.length < 6) { toast({ title: 'Senha deve ter ao menos 6 caracteres', variant: 'destructive' }); return; }
    if (newPassword !== confirmPassword) { toast({ title: 'Senhas não coincidem', variant: 'destructive' }); return; }
    setChangingPassword(true);
    const { error } = await supabase.auth.admin.updateUserById(editingUser.id, { password: newPassword });
    setChangingPassword(false);
    if (error) { toast({ title: 'Erro ao alterar senha', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Senha alterada!' }); setNewPassword(''); setConfirmPassword('');
  };

  const handleViewCertificates = async (userId: string) => {
    const { data, error } = await supabase.from('certificados').select('*, cursos(id,nome,categoria)').eq('usuario_id', userId).order('data_emissao', { ascending: false });
    if (error) { toast({ title: 'Erro ao carregar certificados', variant: 'destructive' }); return; }
    setSelectedUserCertificates(data || []); setShowCertificatesModal(true);
  };

  const handleViewProgress = async (userId: string, userName: string) => {
    const { data, error } = await supabase.from('progresso_usuario').select('*, cursos(id,nome,categoria)').eq('usuario_id', userId).order('data_atualizacao', { ascending: false });
    if (error) { toast({ title: 'Erro ao carregar progresso', variant: 'destructive' }); return; }
    setSelectedUserProgress({ userId, userName, progress: data || [] });
  };

  const SortIcon = ({ field }: { field: typeof sortField }) =>
    sortField === field ? <span className="ml-1" style={{ color: '#3AB26A' }}>{sortDirection === 'asc' ? '↑' : '↓'}</span> : null;

  return (
    <ERALayout>
      <div className="min-h-screen" style={{ background: '#F8F7FF' }}>

        {/* Hero */}
        <div
          className="w-full rounded-xl lg:rounded-2xl mb-6 overflow-hidden shadow-md"
          style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #2D2B6F 60%, #3D3A8F 100%)' }}
        >
          <div className="px-6 lg:px-10 py-8 lg:py-10">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full"
                    style={{ background: 'rgba(58,178,106,0.15)', border: '1px solid rgba(58,178,106,0.3)', color: '#3AB26A' }}
                  >
                    <Users className="w-3 h-3" />
                    Gestão de Usuários
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Usuários</h1>
                <p className="text-white/70 text-sm md:text-base">Gerencie usuários e permissões da plataforma.</p>
              </div>
            </div>
          </div>
          <div className="px-6 md:px-10 py-4 grid grid-cols-4 gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            {[
              { value: userStats.total,          label: 'Total' },
              { value: userStats.ativos,          label: 'Ativos' },
              { value: userStats.administradores, label: 'Admins' },
              { value: userStats.novosEstaSemana, label: 'Novos esta semana' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-xl md:text-2xl font-bold text-white">{value}</div>
                <div className="text-xs text-white/50 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-1 pb-8 space-y-5">

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-2 flex-1 max-w-md w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nome ou e-mail..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 text-sm rounded-lg border-2"
                  style={{ borderColor: '#EDE9FE' }}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="text-sm flex items-center gap-1.5" style={{ borderColor: '#EDE9FE', color: '#2D2B6F' }}>
                    <Download className="h-4 w-4" /> Exportar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => exportUsers('csv')}>Exportar CSV</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportUsers('json')}>Exportar JSON</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                onClick={() => setShowNewUserForm(!showNewUserForm)}
                className="text-white text-sm flex items-center gap-1.5 px-4"
                style={{ background: 'linear-gradient(135deg, #1E1B4B, #2D2B6F)' }}
              >
                <Plus className="h-4 w-4" /> Novo Usuário
              </Button>
            </div>
          </div>

          {/* Bulk actions */}
          {selectedUsers.length > 0 && (
            <div className="rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ background: '#EDE9FE', border: '1px solid #C4B5FD' }}>
              <span className="text-sm font-medium" style={{ color: '#2D2B6F' }}>{selectedUsers.length} usuário(s) selecionado(s)</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('activate')} className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 text-xs">Ativar</Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('deactivate')} className="text-amber-700 border-amber-300 hover:bg-amber-50 text-xs">Desativar</Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('delete')} className="text-rose-700 border-rose-300 hover:bg-rose-50 text-xs">Excluir</Button>
              </div>
            </div>
          )}

          {/* Formulário novo usuário */}
          {showNewUserForm && (
            <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #EDE9FE' }}>
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: '#1E1B4B' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#EDE9FE' }}>
                  <Plus className="h-3.5 w-3.5" style={{ color: '#2D2B6F' }} />
                </div>
                Novo usuário
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {[
                  { id: 'nome', label: 'Nome *', type: 'text', val: newUser.nome, fn: (v: string) => setNewUser(p => ({ ...p, nome: v })) },
                  { id: 'email', label: 'Email *', type: 'email', val: newUser.email, fn: (v: string) => setNewUser(p => ({ ...p, email: v })) },
                ].map(f => (
                  <div key={f.id}>
                    <Label className="text-xs font-medium text-gray-600 mb-1.5 block">{f.label}</Label>
                    <Input type={f.type} value={f.val} onChange={e => f.fn(e.target.value)} className="border-2 text-sm rounded-lg" style={{ borderColor: '#EDE9FE' }} />
                  </div>
                ))}
                <div>
                  <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Tipo</Label>
                  <select value={newUser.tipo} onChange={e => setNewUser(p => ({ ...p, tipo: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border-2 bg-white text-sm" style={{ borderColor: '#EDE9FE' }}>
                    <option>Cliente</option><option>Admin</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Status</Label>
                  <select value={newUser.status} onChange={e => setNewUser(p => ({ ...p, status: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border-2 bg-white text-sm" style={{ borderColor: '#EDE9FE' }}>
                    <option>Ativo</option><option>Inativo</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleNewUserSubmit} className="text-white text-sm px-4" style={{ background: 'linear-gradient(135deg, #1E1B4B, #2D2B6F)' }}>Criar usuário</Button>
                <Button variant="outline" onClick={() => setShowNewUserForm(false)} className="text-sm" style={{ borderColor: '#EDE9FE', color: '#2D2B6F' }}>Cancelar</Button>
              </div>
            </div>
          )}

          {/* Tabela */}
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #EDE9FE' }}>
            <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid #EDE9FE' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#EDE9FE' }}>
                <Users className="h-4 w-4" style={{ color: '#2D2B6F' }} />
              </div>
              <h3 className="text-sm font-semibold" style={{ color: '#1E1B4B' }}>Lista de usuários</h3>
              <span className="ml-auto text-xs text-gray-400">{users.length} registros</span>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent" style={{ background: '#F8F7FF' }}>
                    <TableHead className="w-10 pl-5">
                      <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} />
                    </TableHead>
                    {([['nome','Nome'],['email','Email'],['ultimo_login','Último login'],['tipo_usuario','Tipo'],['data_criacao','Criação']] as [typeof sortField, string][]).map(([field, label]) => (
                      <TableHead key={field} className="text-xs font-medium text-gray-500 cursor-pointer select-none" onClick={() => handleSort(field)}>
                        {label}<SortIcon field={field} />
                      </TableHead>
                    ))}
                    <TableHead className="text-xs font-medium text-gray-500 pr-5">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-12">
                      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: '#2D2B6F', borderTopColor: 'transparent' }} />
                    </TableCell></TableRow>
                  ) : users.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-12">
                      <Users className="h-8 w-8 mx-auto mb-2" style={{ color: '#C4B5FD' }} />
                      <p className="text-gray-400 text-sm">Nenhum usuário encontrado</p>
                    </TableCell></TableRow>
                  ) : users.map(user => {
                    const typeStyle = getUserTypeStyle(user.tipo_usuario);
                    return (
                      <TableRow key={user.id} className="hover:bg-[#F8F7FF] transition-colors">
                        <TableCell className="pl-5">
                          <Checkbox checked={selectedUsers.includes(user.id)} onCheckedChange={v => handleSelectUser(user.id, v as boolean)} />
                        </TableCell>
                        <TableCell className="font-medium text-sm" style={{ color: '#1E1B4B' }}>{user.nome}</TableCell>
                        <TableCell className="text-gray-500 text-sm">{user.email}</TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{formatLastLogin(user.ultimo_login)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: typeStyle.bg, color: typeStyle.text }}>
                            {typeStyle.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-500 text-sm">{new Date(user.data_criacao).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="pr-5">
                          {isMobile ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleViewCertificates(user.id)}><Award className="h-4 w-4 mr-2" />Certificados</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewProgress(user.id, user.nome)}><Activity className="h-4 w-4 mr-2" />Progresso</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setEditingUser(user as any); setShowEditModal(true); }}><Edit className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <div className="flex gap-1">
                              {[
                                { icon: Award,    fn: () => handleViewCertificates(user.id), title: 'Certificados', color: '#F59E0B' },
                                { icon: Activity, fn: () => handleViewProgress(user.id, user.nome), title: 'Progresso', color: '#3AB26A' },
                                { icon: Edit,     fn: () => { setEditingUser(user as any); setShowEditModal(true); }, title: 'Editar', color: '#2D2B6F' },
                                { icon: Trash2,   fn: async () => { if (window.confirm('Excluir usuário?')) { await supabase.from('usuarios').delete().eq('id', user.id); toast({ title: 'Usuário excluído' }); fetchUsers(); } }, title: 'Excluir', color: '#EF4444' },
                              ].map(({ icon: Icon, fn, title, color }) => (
                                <Button key={title} variant="ghost" size="sm" onClick={fn} title={title}
                                  className="h-7 w-7 p-0 hover:bg-[#F8F7FF]" style={{ color }}>
                                  <Icon className="h-3.5 w-3.5" />
                                </Button>
                              ))}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal edição */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base" style={{ color: '#1E1B4B' }}>Editar usuário</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4 py-2">
              {[['nome','Nome',editingUser.nome],['email','Email',editingUser.email]].map(([id, label, val]) => (
                <div key={id}>
                  <Label className="text-xs font-medium text-gray-600 mb-1.5 block">{label}</Label>
                  <Input value={val as string} onChange={e => setEditingUser({ ...editingUser, [id]: e.target.value })}
                    className="border-2 text-sm rounded-lg" style={{ borderColor: '#EDE9FE' }} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Tipo</Label>
                  <select value={editingUser.tipo_usuario} onChange={e => setEditingUser({ ...editingUser, tipo_usuario: e.target.value as any })}
                    className="w-full h-9 px-3 rounded-lg border-2 bg-white text-sm" style={{ borderColor: '#EDE9FE' }}>
                    <option value="cliente">Cliente</option><option value="admin">Admin</option><option value="admin_master">Admin Master</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Status</Label>
                  <select value={editingUser.status} onChange={e => setEditingUser({ ...editingUser, status: e.target.value as any })}
                    className="w-full h-9 px-3 rounded-lg border-2 bg-white text-sm" style={{ borderColor: '#EDE9FE' }}>
                    <option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="pendente">Pendente</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 space-y-3" style={{ borderTop: '1px solid #EDE9FE' }}>
                <p className="text-xs font-semibold" style={{ color: '#2D2B6F' }}>Alterar senha</p>
                <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Nova senha (mín. 6 caracteres)" className="border-2 text-sm rounded-lg" style={{ borderColor: '#EDE9FE' }} />
                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirmar nova senha" className="border-2 text-sm rounded-lg" style={{ borderColor: '#EDE9FE' }} />
                <Button onClick={handleChangeUserPassword} disabled={changingPassword || !newPassword || newPassword !== confirmPassword}
                  className="w-full text-white text-xs px-4" style={{ background: '#DC2626' }}>
                  {changingPassword ? 'Alterando...' : 'Alterar senha'}
                </Button>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowEditModal(false); setNewPassword(''); setConfirmPassword(''); }}
              className="text-sm" style={{ borderColor: '#EDE9FE', color: '#2D2B6F' }}>Cancelar</Button>
            <Button onClick={handleSaveEdit} className="text-white text-sm" style={{ background: 'linear-gradient(135deg, #1E1B4B, #2D2B6F)' }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal certificados */}
      <Dialog open={showCertificatesModal} onOpenChange={setShowCertificatesModal}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base" style={{ color: '#1E1B4B' }}>
              <Award className="h-5 w-5" style={{ color: '#F59E0B' }} />
              Certificados do usuário
            </DialogTitle>
          </DialogHeader>
          {selectedUserCertificates.length === 0 ? (
            <div className="text-center py-10">
              <Award className="h-8 w-8 mx-auto mb-2" style={{ color: '#C4B5FD' }} />
              <p className="text-gray-400 text-sm">Nenhum certificado encontrado</p>
            </div>
          ) : selectedUserCertificates.map((cert, i) => (
            <div key={i} className="rounded-xl p-4 mb-2" style={{ background: '#F8F7FF', border: '1px solid #EDE9FE' }}>
              <p className="font-medium text-sm mb-2" style={{ color: '#1E1B4B' }}>{cert.cursos?.nome || cert.categoria || 'Curso'}</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                <span>Nº {cert.numero_certificado || i + 1}</span>
                <span>Emissão: {new Date(cert.data_emissao).toLocaleDateString('pt-BR')}</span>
                <span style={{ color: cert.status === 'ativo' ? '#3AB26A' : undefined }}>{cert.status === 'ativo' ? 'Ativo' : 'Inativo'}</span>
                {cert.nota_final && <span>Nota: {cert.nota_final}/100</span>}
              </div>
            </div>
          ))}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCertificatesModal(false)} className="text-sm" style={{ borderColor: '#EDE9FE', color: '#2D2B6F' }}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal progresso */}
      <Dialog open={!!selectedUserProgress} onOpenChange={() => setSelectedUserProgress(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base" style={{ color: '#1E1B4B' }}>
              <Activity className="h-5 w-5" style={{ color: '#3AB26A' }} />
              Progresso — {selectedUserProgress?.userName}
            </DialogTitle>
          </DialogHeader>
          {selectedUserProgress?.progress.length === 0 ? (
            <div className="text-center py-10">
              <Activity className="h-8 w-8 mx-auto mb-2" style={{ color: '#C4B5FD' }} />
              <p className="text-gray-400 text-sm">Nenhum progresso registrado</p>
            </div>
          ) : selectedUserProgress?.progress.map((item, i) => (
            <div key={i} className="rounded-xl p-4 mb-2" style={{ background: '#F8F7FF', border: '1px solid #EDE9FE' }}>
              <div className="flex justify-between items-center mb-2">
                <p className="font-medium text-sm" style={{ color: '#1E1B4B' }}>{item.cursos?.nome || 'Curso'}</p>
                <span className="text-xs font-semibold" style={{ color: '#3AB26A' }}>{item.percentual_concluido || 0}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: '#EDE9FE' }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.percentual_concluido || 0}%`, background: '#3AB26A' }} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                <span>Status: {item.status || 'Não iniciado'}</span>
                <span>Tempo: {item.tempo_total_assistido || 0} min</span>
              </div>
            </div>
          ))}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUserProgress(null)} className="text-sm" style={{ borderColor: '#EDE9FE', color: '#2D2B6F' }}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ERALayout>
  );
};

export default Usuarios;
