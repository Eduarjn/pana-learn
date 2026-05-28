import React, { useState } from 'react';
import { ERALayout } from '@/components/ERALayout';
import { useEmpresas } from '@/hooks/useEmpresas';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Building2, 
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Shield,
  Eye,
  ExternalLink
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
import { useNavigate } from 'react-router-dom';
import { Label } from '@/components/ui/label';

type Empresa = Database['public']['Tables']['empresas']['Row'];

interface EmpresaFormData {
  nome: string;
  subdominio: string;
}

const Empresas: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const { 
    empresas, 
    loading, 
    error, 
    createEmpresa, 
    updateEmpresa, 
    deleteEmpresa, 
    isAdminMaster,
    fetchEmpresas
  } = useEmpresas();

  const [showModal, setShowModal] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);
  const [formData, setFormData] = useState<EmpresaFormData>({
    nome: '',
    subdominio: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Verificar se é admin_master
  if (!isAdminMaster) {
    return (
      <ERALayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Acesso Negado</h2>
            <p className="text-gray-500 mb-4">Apenas administradores master podem acessar esta página.</p>
            <p className="text-sm text-gray-400">Tipo de usuário atual: {userProfile?.tipo_usuario || 'Não identificado'}</p>
          </div>
        </div>
      </ERALayout>
    );
  }

  const handleOpenModal = (empresa?: Empresa) => {
    if (empresa) {
      setEditingEmpresa(empresa);
      setFormData({
        nome: empresa.nome,
        subdominio: empresa.subdominio || ''
      });
    } else {
      setEditingEmpresa(null);
      setFormData({ nome: '', subdominio: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEmpresa(null);
    setFormData({ nome: '', subdominio: '' });
    setSubmitting(false);
  };

  const validateForm = (): string | null => {
    if (!formData.nome.trim()) {
      return "O nome da empresa é obrigatório.";
    }
    
    // Verificar se já existe (por nome ou subdominio)
    const existingEmpresa = empresas.find(e => 
      (e.nome.toLowerCase() === formData.nome.trim().toLowerCase() || 
       (formData.subdominio && e.subdominio?.toLowerCase() === formData.subdominio.trim().toLowerCase())) && 
      e.id !== editingEmpresa?.id
    );
    if (existingEmpresa) {
      return "Uma empresa com este nome ou subdomínio já existe.";
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      toast({
        title: "Erro de validação",
        description: validationError,
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    
    try {
      if (editingEmpresa) {
        await updateEmpresa(editingEmpresa.id, {
          nome: formData.nome.trim(),
          subdominio: formData.subdominio.trim() || null
        });
        toast({
          title: "✅ Sucesso!",
          description: "Empresa atualizada com sucesso.",
        });
      } else {
        await createEmpresa({
          nome: formData.nome.trim(),
          subdominio: formData.subdominio.trim() || null,
          plan: 'free',
          plan_status: 'active'
        });
        toast({
          title: "✅ Sucesso!",
          description: "Empresa criada com sucesso.",
        });
      }
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar empresa:', error);
      toast({
        title: "❌ Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar empresa.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (empresa: Empresa) => {
    if (!window.confirm(`Tem certeza que deseja excluir a empresa "${empresa.nome}"?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await deleteEmpresa(empresa.id);
      toast({
        title: "✅ Sucesso!",
        description: "Empresa excluída com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao excluir empresa:', error);
      toast({
        title: "❌ Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir empresa.",
        variant: "destructive"
      });
    }
  };

  const handleRefresh = () => {
    fetchEmpresas();
    toast({
      title: "🔄 Atualizando...",
      description: "Lista de empresas atualizada.",
    });
  };

  const handleAccessClient = (empresa: Empresa) => {
    const clientUrl = empresa.subdominio 
      ? `https://${empresa.subdominio}.panalearn.com` 
      : window.location.origin;
    
    toast({
      title: "🔗 Acessando Empresa",
      description: `Redirecionando...`,
    });

    window.open(clientUrl, '_blank');
  };

  const handleViewClientDashboard = (empresa: Empresa) => {
    navigate(`/empresa/${empresa.id}`);
    toast({
      title: "👁️ Visualizando Empresa",
      description: `Abrindo dashboard de ${empresa.nome}...`,
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

  const sortedEmpresas = [...empresas].sort((a, b) => {
    if (a.nome.toLowerCase() === 'panalearn') return -1;
    if (b.nome.toLowerCase() === 'panalearn') return 1;
    return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
  });

  return (
    <ERALayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Empresas</h1>
            <p className="text-gray-600 mt-2">Gerencie as empresas (tenants) da plataforma</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
            <Button 
              onClick={() => handleOpenModal()}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              + Nova Empresa
            </Button>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total de Empresas</p>
                  <p className="text-3xl font-bold text-gray-900">{empresas.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Ativas</p>
                  <p className="text-3xl font-bold text-green-600">
                    {empresas.filter(e => e.plan_status === 'active').length}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Última Atualização</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {empresas.length > 0 && empresas[0].created_at ? formatDate(empresas[0].created_at) : 'Nunca'}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Empresas */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Empresas Cadastradas ({empresas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                <span className="ml-2 text-gray-600">Carregando empresas...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>{error}</p>
              </div>
            ) : empresas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhuma empresa cadastrada</p>
                <Button 
                  onClick={() => handleOpenModal()}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Empresa
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Nome da Empresa</th>
                      <th className="text-left py-3 px-4 font-medium">Subdomínio</th>
                      <th className="text-left py-3 px-4 font-medium">Status / Plano</th>
                      <th className="text-left py-3 px-4 font-medium">Data de Criação</th>
                      <th className="text-left py-3 px-4 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEmpresas.map((empresa) => (
                      <tr 
                        key={empresa.id} 
                        className={`border-b hover:bg-gray-50 ${
                          empresa.nome.toLowerCase() === 'panalearn' ? 'bg-green-50 border-l-4 border-l-green-500' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">{empresa.nome}</span>
                            {empresa.nome.toLowerCase() === 'panalearn' && (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                Principal
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {empresa.subdominio || 'Sem subdomínio'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm text-gray-600 capitalize">{empresa.plan || 'Free'}</span>
                            <Badge variant={empresa.plan_status === 'active' ? 'default' : 'secondary'} className="w-fit text-xs">
                              {empresa.plan_status === 'active' ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {empresa.created_at ? formatDate(empresa.created_at) : '-'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewClientDashboard(empresa)}
                              className="text-green-600 hover:text-green-700"
                              title="Visualizar Dashboard da Empresa"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAccessClient(empresa)}
                              className="text-blue-600 hover:text-blue-700"
                              title="Acessar Site da Empresa"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenModal(empresa)}
                              className="text-gray-600 hover:text-gray-700"
                              title="Editar Empresa"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            {empresa.nome.toLowerCase() !== 'panalearn' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(empresa)}
                                className="text-red-600 hover:text-red-700"
                                title="Excluir Empresa"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
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

        {/* Modal de Criação/Edição */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingEmpresa ? 'Editar Empresa' : 'Nova Empresa'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome da Empresa</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome da empresa"
                  required
                />
              </div>
              <div>
                <Label htmlFor="subdominio">Subdomínio (opcional)</Label>
                <Input
                  id="subdominio"
                  value={formData.subdominio}
                  onChange={(e) => setFormData({ ...formData, subdominio: e.target.value })}
                  placeholder="exemplo"
                />
                <p className="text-xs text-gray-500 mt-1">O subdomínio será usado para acessar a plataforma: subdomínio.panalearn.com</p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? 'Salvando...' : (editingEmpresa ? 'Atualizar Empresa' : 'Criar Empresa')}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </ERALayout>
  );
};

export default Empresas;
