import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ERALayout } from '@/components/ERALayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download, Eye, Trophy, FileText, Award, Filter } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { downloadCertificateAsPDF, openCertificateInNewWindow } from '@/utils/certificateGenerator';
import type { Certificate } from '@/types/certificate';

interface CertificateStats { total: number; ativos: number; revogados: number; expirados: number; mediaNota: number; }

const CATEGORY_ACCENT: Record<string, string> = {
  PABX: '#2563EB', CALLCENTER: '#7C3AED', OMNICHANNEL: '#059669', VoIP: '#EA580C',
};
const getCatAccent = (c: string) => CATEGORY_ACCENT[c] ?? '#2D2B6F';

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  ativo:    { bg: '#F0FDF4', text: '#166534', label: 'Ativo' },
  revogado: { bg: '#FFF1F2', text: '#9F1239', label: 'Revogado' },
  expirado: { bg: '#FFFBEB', text: '#92400E', label: 'Expirado' },
};

const Certificados: React.FC = () => {
  const { userProfile } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [filteredCertificates, setFilteredCertificates] = useState<Certificate[]>([]);
  const [stats, setStats] = useState<CertificateStats>({ total: 0, ativos: 0, revogados: 0, expirados: 0, mediaNota: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [categoriaFilter, setCategoriaFilter] = useState('todos');

  useEffect(() => { loadCertificates(); }, [userProfile]);
  useEffect(() => { filterCertificates(); }, [certificates, searchTerm, statusFilter, categoriaFilter]);

  const loadCertificates = async () => {
    if (!userProfile) return;
    setLoading(true);
    try {
      const isAdmin = userProfile.tipo_usuario === 'admin' || userProfile.tipo_usuario === 'admin_master';
      const query = supabase.from('certificados')
        .select('*, usuarios!certificados_usuario_id_fkey(nome,email), cursos!certificados_curso_id_fkey(nome,categoria)')
        .order('data_emissao', { ascending: false });
      const { data, error } = isAdmin ? await query : await query.eq('usuario_id', userProfile.id);
      if (error) throw error;
      const certs = data || [];
      setCertificates(certs);
      const total = certs.length;
      const ativos = certs.filter(c => c.status === 'ativo').length;
      const mediaNota = total > 0
        ? Math.round((certs.reduce((s, c) => s + (c.nota_final || c.nota || 0), 0) / total) * 100) / 100
        : 0;
      setStats({ total, ativos, revogados: certs.filter(c => c.status === 'revogado').length, expirados: certs.filter(c => c.status === 'expirado').length, mediaNota });
    } catch {
      toast({ title: 'Erro', description: 'Erro ao carregar certificados.', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const filterCertificates = () => {
    let f = certificates;
    if (searchTerm) f = f.filter(c =>
      c.numero_certificado?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.usuarios?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cursos?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (statusFilter !== 'todos') f = f.filter(c => c.status === statusFilter);
    if (categoriaFilter !== 'todos') f = f.filter(c => c.categoria === categoriaFilter);
    setFilteredCertificates(f);
  };

  const handleDownload = async (cert: Certificate) => {
    toast({ title: 'Gerando PDF...', description: cert.cursos?.nome || cert.curso_nome });
    const ok = await downloadCertificateAsPDF(cert);
    if (!ok) toast({ title: 'Erro', description: 'Falha ao gerar PDF.', variant: 'destructive' });
  };

  const handleView = async (cert: Certificate) => {
    const ok = await openCertificateInNewWindow(cert);
    if (!ok) toast({ title: 'Erro', description: 'Erro ao abrir certificado.', variant: 'destructive' });
  };

  if (loading) return (
    <ERALayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: '#2D2B6F', borderTopColor: 'transparent' }} />
          <p className="text-sm text-gray-500">Carregando certificados...</p>
        </div>
      </div>
    </ERALayout>
  );

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
                    style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#FCD34D' }}
                  >
                    <Award className="w-3 h-3" />
                    Certificações
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Certificados</h1>
                <p className="text-white/70 text-sm md:text-base max-w-xl">
                  Visualize e gerencie todos os certificados emitidos pela plataforma.
                </p>
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="px-6 md:px-10 py-4 grid grid-cols-4 gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            {[
              { value: stats.total,   label: 'Total emitidos' },
              { value: stats.ativos,  label: 'Ativos' },
              { value: `${stats.mediaNota}%`, label: 'Média geral' },
              { value: certificates.length > 0 ? new Date(certificates[0].data_emissao).toLocaleDateString('pt-BR') : '—', label: 'Última emissão' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-xl md:text-2xl font-bold text-white">{value}</div>
                <div className="text-xs text-white/50 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-1 pb-8 space-y-5">

          {/* Filtros */}
          <div className="bg-white rounded-xl p-4" style={{ border: '1px solid #EDE9FE' }}>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Pesquisar certificados..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 border-2 rounded-lg text-sm"
                  style={{ borderColor: '#EDE9FE' }}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-44 border-2 rounded-lg text-sm" style={{ borderColor: '#EDE9FE' }}>
                  <Filter className="h-4 w-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="revogado">Revogado</SelectItem>
                  <SelectItem value="expirado">Expirado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                <SelectTrigger className="w-full sm:w-48 border-2 rounded-lg text-sm" style={{ borderColor: '#EDE9FE' }}>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as categorias</SelectItem>
                  <SelectItem value="PABX">PABX</SelectItem>
                  <SelectItem value="OMNICHANNEL">OMNICHANNEL</SelectItem>
                  <SelectItem value="CALLCENTER">CALLCENTER</SelectItem>
                  <SelectItem value="VoIP">VoIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lista de certificados */}
          {filteredCertificates.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl" style={{ border: '1px solid #EDE9FE' }}>
              <FileText className="h-10 w-10 mx-auto mb-3" style={{ color: '#C4B5FD' }} />
              <p className="font-medium text-sm" style={{ color: '#1E1B4B' }}>Nenhum certificado encontrado</p>
              <p className="text-gray-400 text-xs mt-1">
                {searchTerm || statusFilter !== 'todos' || categoriaFilter !== 'todos'
                  ? 'Tente ajustar os filtros.'
                  : 'Você ainda não possui certificados emitidos.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCertificates.map(cert => {
                const accent = getCatAccent(cert.categoria);
                const statusStyle = STATUS_STYLE[cert.status] ?? STATUS_STYLE.ativo;
                const courseName = cert.curso_nome || cert.cursos?.nome || 'Curso';
                return (
                  <div
                    key={cert.id}
                    className="bg-white rounded-xl overflow-hidden hover:shadow-md transition-all duration-200"
                    style={{ border: '1px solid #EDE9FE', borderTop: `4px solid ${accent}` }}
                  >
                    <div className="p-5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: accent + '18' }}
                          >
                            <Trophy className="h-5 w-5" style={{ color: accent }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="font-semibold text-sm" style={{ color: '#1E1B4B' }}>{courseName}</h3>
                              <span
                                className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ background: statusStyle.bg, color: statusStyle.text }}
                              >
                                {statusStyle.label}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{ background: accent }}>
                                {cert.categoria}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                              {[
                                { label: 'Número', value: cert.numero_certificado },
                                { label: 'Nota', value: `${cert.nota_final || cert.nota || 0}%` },
                                { label: 'Emissão', value: new Date(cert.data_emissao).toLocaleDateString('pt-BR') },
                                cert.usuarios ? { label: 'Usuário', value: cert.usuarios.nome } : null,
                              ].filter(Boolean).map(item => (
                                <div key={item!.label}>
                                  <p className="text-xs text-gray-400">{item!.label}</p>
                                  <p className="text-xs font-medium text-gray-700 truncate">{item!.value}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            variant="outline" size="sm" onClick={() => handleView(cert)}
                            className="flex items-center gap-1.5 text-xs"
                            style={{ borderColor: '#EDE9FE', color: '#2D2B6F' }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Visualizar
                          </Button>
                          <Button
                            size="sm" onClick={() => handleDownload(cert)}
                            className="text-white flex items-center gap-1.5 text-xs"
                            style={{ background: accent }}
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ERALayout>
  );
};

export default Certificados;
