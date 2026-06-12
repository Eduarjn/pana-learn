import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, staggerFast, cardItem, cardHover } from '@/lib/animations';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ERALayout } from '@/components/ERALayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download, Eye, Trophy, FileText, Award, Filter, LayoutTemplate } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { generateCertificatePDFFromData, openCertificateFromRow, certRowToCertificateData } from '@/utils/generateCertificatePDF';
import { getDefaultTemplate } from '@/services/certificateService';
import type { Certificate, CertificateTemplate } from '@/types/certificate';

interface CertificateStats { total: number; ativos: number; revogados: number; expirados: number; mediaNota: number; }

const CATEGORY_ACCENT: Record<string, string> = {
  PABX: '#3B82F6', CALLCENTER: '#4B3F72', OMNICHANNEL: '#417B5A', VoIP: '#F97316',
};
const getCatAccent = (c: string) => CATEGORY_ACCENT[c] ?? '#4B3F72';

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  ativo:    { bg: '#F0FDF4', text: '#166534', label: 'Ativo' },
  revogado: { bg: '#FFF1F2', text: '#9F1239', label: 'Revogado' },
  expirado: { bg: '#FFFBEB', text: '#92400E', label: 'Expirado' },
};

const Certificados: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const canManageTemplates =
    userProfile?.tipo_usuario === 'admin' || userProfile?.tipo_usuario === 'admin_master';
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [filteredCertificates, setFilteredCertificates] = useState<Certificate[]>([]);
  const [stats, setStats] = useState<CertificateStats>({ total: 0, ativos: 0, revogados: 0, expirados: 0, mediaNota: 0 });
  const [defaultTemplate, setDefaultTemplate] = useState<CertificateTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [categoriaFilter, setCategoriaFilter] = useState('todos');

  useEffect(() => { loadCertificates(); getDefaultTemplate().then(setDefaultTemplate).catch(() => {}); }, [userProfile]);
  useEffect(() => { filterCertificates(); }, [certificates, searchTerm, statusFilter, categoriaFilter]);

  const loadCertificates = async () => {
    if (!userProfile) return;
    setLoading(true);
    try {
      const isAdmin = userProfile.tipo_usuario === 'admin' || userProfile.tipo_usuario === 'admin_master';
      const query = supabase.from('certificados')
        .select('*, usuarios!certificados_usuario_id_fkey(nome,email), cursos!certificados_curso_id_fkey(nome,categoria), certificate_templates(*)')
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

  // Garante que o certificado tenha um template: usa o vinculado ou o padrão como fallback
  const certWithTemplate = (cert: Certificate) => ({
    ...cert,
    certificate_templates: (cert.certificate_templates as CertificateTemplate) ?? defaultTemplate ?? undefined,
  });

  const handleDownload = async (cert: Certificate) => {
    toast({ title: 'Gerando PDF...', description: cert.cursos?.nome || cert.curso_nome });
    try {
      // Renderiza SEMPRE com o template (vinculado ou padrão) — layout único em todos os pontos
      await generateCertificatePDFFromData(certRowToCertificateData(certWithTemplate(cert)));
    } catch {
      toast({ title: 'Erro', description: 'Falha ao gerar PDF.', variant: 'destructive' });
    }
  };

  const handleView = async (cert: Certificate) => {
    try {
      // Mesmo renderizador da geração/download — layout consistente
      openCertificateFromRow(certWithTemplate(cert));
    } catch {
      toast({ title: 'Erro', description: 'Erro ao abrir certificado.', variant: 'destructive' });
    }
  };

  if (loading) return (
    <ERALayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: '#4B3F72', borderTopColor: 'transparent' }} />
          <p className="text-sm text-gray-500">Carregando certificados...</p>
        </div>
      </div>
    </ERALayout>
  );

  return (
    <ERALayout>
      <div className="min-h-screen" style={{ background: '#F6F6FA' }}>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="w-full rounded-xl lg:rounded-2xl mb-6 overflow-hidden shadow-md"
          style={{ background: 'linear-gradient(135deg, #1F2041 0%, #4B3F72 60%, #417B5A 100%)' }}
        >
          <div className="px-6 lg:px-10 py-8 lg:py-10">
            <div className="flex items-start justify-between gap-6">
              <motion.div
                variants={staggerContainer} initial="hidden" animate="visible"
              >
                <motion.div variants={fadeInUp} className="flex items-center gap-2 mb-3">
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full"
                    style={{ background: 'rgba(233,210,192,0.12)', border: '1px solid rgba(233,210,192,0.25)', color: '#E9D2C0' }}
                  >
                    <Award className="w-3 h-3" />
                    Certificações
                  </span>
                </motion.div>
                <motion.h1 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-white mb-2">Certificados</motion.h1>
                <motion.p variants={fadeInUp} className="text-white/70 text-sm md:text-base max-w-xl">
                  Visualize e gerencie todos os certificados emitidos pela plataforma.
                </motion.p>
              </motion.div>

              {/* Gerenciar Templates — visível só para admin */}
              {canManageTemplates && (
                <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="flex-shrink-0 mt-1">
                  <button
                    type="button"
                    onClick={() => navigate('/admin/certificados/templates')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.03]"
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.18)',
                      color: '#E9D2C0',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <LayoutTemplate className="w-4 h-4" />
                    <span className="hidden sm:inline">Gerenciar templates</span>
                    <span className="sm:hidden">Templates</span>
                  </button>
                </motion.div>
              )}
            </div>
          </div>

          {/* Stats bar */}
          <motion.div
            variants={staggerFast} initial="hidden" animate="visible"
            className="px-6 md:px-10 py-4 grid grid-cols-4 gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
          >
            {[
              { value: stats.total,   label: 'Total emitidos' },
              { value: stats.ativos,  label: 'Ativos' },
              { value: `${stats.mediaNota}%`, label: 'Média geral' },
              { value: certificates.length > 0 ? new Date(certificates[0].data_emissao).toLocaleDateString('pt-BR') : '—', label: 'Última emissão' },
            ].map(({ value, label }) => (
              <motion.div key={label} variants={cardItem} className="text-center">
                <div className="text-xl md:text-2xl font-bold text-white">{value}</div>
                <div className="text-xs text-white/50 mt-0.5">{label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <div className="px-1 pb-8 space-y-5">

          {/* Filtros */}
          <div className="bg-white rounded-xl p-4" style={{ border: '1px solid #e4e5f0' }}>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Pesquisar certificados..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 border-2 rounded-lg text-sm"
                  style={{ borderColor: '#e4e5f0' }}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-44 border-2 rounded-lg text-sm" style={{ borderColor: '#e4e5f0' }}>
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
                <SelectTrigger className="w-full sm:w-48 border-2 rounded-lg text-sm" style={{ borderColor: '#e4e5f0' }}>
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
            <div className="text-center py-16 bg-white rounded-xl" style={{ border: '1px solid #e4e5f0' }}>
              <FileText className="h-10 w-10 mx-auto mb-3" style={{ color: '#C4B5FD' }} />
              <p className="font-medium text-sm" style={{ color: '#1F2041' }}>Nenhum certificado encontrado</p>
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
                    style={{ border: '1px solid #e4e5f0', borderTop: `4px solid ${accent}` }}
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
                              <h3 className="font-semibold text-sm" style={{ color: '#1F2041' }}>{courseName}</h3>
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
                                cert.validation_code ? { label: 'Código', value: cert.validation_code } : null,
                                cert.carga_horaria ? { label: 'Carga horária', value: `${cert.carga_horaria}h` } : null,
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
                            style={{ borderColor: '#e4e5f0', color: '#4B3F72' }}
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
