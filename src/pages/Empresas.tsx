import React, { useState } from 'react';
import { ERALayout } from '@/components/ERALayout';
import { useEmpresas } from '@/hooks/useEmpresas';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Building2, 
  Calendar,
  Clock,
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

  const [activeTab, setActiveTab] = useState('todas');
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

  const filteredEmpresas = sortedEmpresas.filter(e => {
    if (activeTab === 'ativas')  return e.plan_status === 'active';
    if (activeTab === 'inativas') return e.plan_status !== 'active' && e.plan_status !== 'trial';
    if (activeTab === 'trial')   return e.plan_status === 'trial';
    return true;
  });

  const getPlanBadgeVariant = (plan: string | null) => {
    if (plan === 'enterprise') return 'enterprise' as const;
    if (plan === 'pro')        return 'pro' as const;
    if (plan === 'starter')    return 'starter' as const;
    return 'starter' as const;
  };

  return (
    <ERALayout>
      <div className="p-6 space-y-6 min-h-screen" style={{ background: '#1F2041' }}>
        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6"
             style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div>
            <h1 className="text-[22px] font-medium text-white">Empresas</h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Gerencie as empresas (tenants) da plataforma
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all"
              style={{
                color: 'rgba(255,255,255,0.6)',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-all"
              style={{ background: '#417B5A' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#4e9168'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#417B5A'; }}
            >
              <Plus className="w-4 h-4" />
              Nova empresa
            </button>
          </div>
        </div>

        {/* ── Stat Cards ─────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total de Empresas */}
          <div className="flex items-center justify-between p-5 rounded-xl transition-all"
               style={{
                 background: 'rgba(255,255,255,0.04)',
                 border: '1px solid rgba(255,255,255,0.08)'
               }}
               onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
               onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          >
            <div>
              <p className="text-xs font-medium uppercase tracking-wider mb-2"
                 style={{ color: 'rgba(255,255,255,0.4)' }}>
                Total de Empresas
              </p>
              <p className="text-3xl font-medium text-white">{empresas.length}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                cadastradas na plataforma
              </p>
            </div>
            <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
                 style={{ background: 'rgba(75,63,114,0.3)' }}>
              <Building2 className="w-5 h-5" style={{ color: '#9b8fd4' }} />
            </div>
          </div>

          {/* Ativas */}
          <div className="flex items-center justify-between p-5 rounded-xl transition-all"
               style={{
                 background: 'rgba(255,255,255,0.04)',
                 border: '1px solid rgba(255,255,255,0.08)'
               }}
               onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
               onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          >
            <div>
              <p className="text-xs font-medium uppercase tracking-wider mb-2"
                 style={{ color: 'rgba(255,255,255,0.4)' }}>
                Ativas
              </p>
              <p className="text-3xl font-medium" style={{ color: '#4ade80' }}>
                {empresas.filter(e => e.plan_status === 'active').length}
              </p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                empresas em operação
              </p>
            </div>
            <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
                 style={{ background: 'rgba(65,123,90,0.25)' }}>
              <CheckCircle className="w-5 h-5" style={{ color: '#417B5A' }} />
            </div>
          </div>

          {/* Última Atualização */}
          <div className="flex items-center justify-between p-5 rounded-xl transition-all"
               style={{
                 background: 'rgba(255,255,255,0.04)',
                 border: '1px solid rgba(255,255,255,0.08)'
               }}
               onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
               onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          >
            <div>
              <p className="text-xs font-medium uppercase tracking-wider mb-2"
                 style={{ color: 'rgba(255,255,255,0.4)' }}>
                Última Atualização
              </p>
              <p className="text-lg font-medium text-white">
                {empresas.length > 0 && empresas[0].created_at ? formatDate(empresas[0].created_at) : 'Nunca'}
              </p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                última modificação
              </p>
            </div>
            <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
                 style={{ background: 'rgba(31,32,65,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Clock className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.5)' }} />
            </div>
          </div>
        </div>

        {/* ── Table Container ────────────────────────────── */}
        <div className="rounded-xl overflow-hidden"
             style={{
               background: 'rgba(255,255,255,0.03)',
               border: '1px solid rgba(255,255,255,0.08)'
             }}>

          {/* Custom Tabs */}
          <div className="flex gap-1 px-4 pt-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {[
              { key: 'todas', label: 'Todas', count: empresas.length },
              { key: 'ativas', label: 'Ativas', count: empresas.filter(e => e.plan_status === 'active').length },
              { key: 'inativas', label: 'Inativas', count: empresas.filter(e => e.plan_status !== 'active' && e.plan_status !== 'trial').length },
              { key: 'trial', label: 'Trial', count: empresas.filter(e => e.plan_status === 'trial').length },
            ].map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="px-4 py-2.5 text-sm font-medium transition-all"
                  style={{
                    borderBottom: `2px solid ${isActive ? '#4B3F72' : 'transparent'}`,
                    marginBottom: '-1px',
                    color: isActive ? '#9b8fd4' : 'rgba(255,255,255,0.4)',
                  }}
                  onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.borderBottomColor = 'rgba(255,255,255,0.2)'; } }}
                  onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.borderBottomColor = 'transparent'; } }}
                >
                  {tab.label}
                  <span
                    className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
                    style={{
                      background: isActive ? 'rgba(75,63,114,0.5)' : 'rgba(255,255,255,0.1)',
                      color: isActive ? '#c4b9e8' : 'rgba(255,255,255,0.3)',
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Table Body */}
          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8" style={{ borderBottom: '2px solid #417B5A' }}></div>
                <span className="ml-2 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Carregando empresas...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8" style={{ color: '#f87171' }}>
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>{error}</p>
              </div>
            ) : filteredEmpresas.length === 0 ? (
              <div className="text-center py-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
                <Building2 className="h-12 w-12 mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.2)' }} />
                <p className="text-sm">Nenhuma empresa cadastrada</p>
                <button
                  onClick={() => handleOpenModal()}
                  className="mt-4 px-4 py-2 text-sm font-medium text-white rounded-lg transition-all"
                  style={{ background: '#417B5A' }}
                >
                  <Plus className="h-4 w-4 mr-1.5 inline-block" />
                  Criar primeira empresa
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider"
                          style={{ color: 'rgba(255,255,255,0.4)' }}>
                        Nome da Empresa
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider"
                          style={{ color: 'rgba(255,255,255,0.4)' }}>
                        Subdomínio
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider"
                          style={{ color: 'rgba(255,255,255,0.4)' }}>
                        Status / Plano
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider"
                          style={{ color: 'rgba(255,255,255,0.4)' }}>
                        Criação
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-medium uppercase tracking-wider"
                          style={{ color: 'rgba(255,255,255,0.4)' }}>
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmpresas.map((empresa) => {
                      const isPrincipal = empresa.nome.toLowerCase() === 'panalearn';
                      const planLabel = empresa.plan ? empresa.plan.charAt(0).toUpperCase() + empresa.plan.slice(1) : 'Free';
                      const statusLabel = empresa.plan_status === 'active' ? 'Ativo' : empresa.plan_status === 'trial' ? 'Trial' : 'Inativo';
                      const isActive = empresa.plan_status === 'active';

                      // Plan badge colors
                      const planColors = empresa.plan === 'enterprise'
                        ? { bg: 'rgba(65,123,90,0.3)', color: '#86c9a4' }
                        : empresa.plan === 'pro'
                        ? { bg: 'rgba(75,63,114,0.4)', color: '#c4b9e8' }
                        : empresa.plan === 'trial'
                        ? { bg: 'rgba(233,210,192,0.15)', color: '#E9D2C0' }
                        : { bg: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' };

                      return (
                        <tr
                          key={empresa.id}
                          className="group transition-colors"
                          style={{
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            borderLeft: isPrincipal ? '3px solid #417B5A' : '3px solid transparent',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          {/* Nome */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                   style={{ background: 'rgba(75,63,114,0.3)' }}>
                                <Building2 className="w-4 h-4" style={{ color: '#9b8fd4' }} />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{empresa.nome}</p>
                                {isPrincipal && (
                                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                                        style={{ color: '#9b8fd4', background: 'rgba(75,63,114,0.3)' }}>
                                    Principal
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Subdomínio */}
                          <td className="py-4 px-4">
                            {empresa.subdominio ? (
                              <code className="text-sm px-2 py-1 rounded font-mono"
                                    style={{ color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.06)' }}>
                                {empresa.subdominio}
                              </code>
                            ) : (
                              <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>
                            )}
                          </td>

                          {/* Status / Plano */}
                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-1.5">
                              {/* Plan Badge */}
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium w-fit"
                                    style={{ background: planColors.bg, color: planColors.color }}>
                                {planLabel}
                              </span>
                              {/* Status Badge */}
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium w-fit"
                                    style={{
                                      background: isActive ? 'rgba(65,123,90,0.25)' : 'rgba(255,255,255,0.07)',
                                      color: isActive ? '#86c9a4' : 'rgba(255,255,255,0.4)',
                                    }}>
                                <span className="w-1.5 h-1.5 rounded-full"
                                      style={{ background: isActive ? '#4ade80' : 'rgba(255,255,255,0.3)' }} />
                                {statusLabel}
                              </span>
                            </div>
                          </td>

                          {/* Data de Criação */}
                          <td className="py-4 px-4">
                            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                              {empresa.created_at ? formatDate(empresa.created_at) : '-'}
                            </p>
                          </td>

                          {/* Ações */}
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end gap-1.5"
                                 style={{ opacity: 0.6, transition: 'opacity 0.2s' }}
                                 onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                                 onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; }}
                            >
                              <button
                                onClick={() => handleViewClientDashboard(empresa)}
                                title="Visualizar"
                                className="p-2 rounded-lg transition-all"
                                style={{ color: 'rgba(255,255,255,0.6)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'transparent'; }}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleAccessClient(empresa)}
                                title="Acessar site"
                                className="p-2 rounded-lg transition-all"
                                style={{ color: 'rgba(255,255,255,0.6)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'transparent'; }}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenModal(empresa)}
                                title="Editar"
                                className="p-2 rounded-lg transition-all"
                                style={{ color: 'rgba(255,255,255,0.6)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'transparent'; }}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {!isPrincipal && (
                                <button
                                  onClick={() => handleDelete(empresa)}
                                  title="Excluir"
                                  className="p-2 rounded-lg transition-all"
                                  style={{ color: 'rgba(248,113,113,0.6)' }}
                                  onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(248,113,113,0.6)'; e.currentTarget.style.background = 'transparent'; }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Modal de Criação/Edição ─────────────────────── */}
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
