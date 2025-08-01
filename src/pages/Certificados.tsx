import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ERALayout } from '@/components/ERALayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CertificateCard } from '@/components/CertificateCard';
import { CertificateConfigModal } from '@/components/CertificateConfigModal';
import { CertificateEditModal } from '@/components/CertificateEditModal';
import { CourseCertificateCard } from '@/components/CourseCertificateCard';
import { CourseCertConfigModal } from '@/components/CourseCertConfigModal';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar,
  Trophy,
  User,
  Users,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  ArrowLeft,
  Target,
  Plus,
  Copy,
  Settings,
  Share2,
  Linkedin,
  Facebook
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Certificate {
  id: string;
  usuario_id: string;
  curso_id?: string;
  categoria: string;
  quiz_id?: string;
  nota_final: number;
  link_pdf_certificado?: string;
  numero_certificado: string;
  qr_code_url?: string;
  status: 'ativo' | 'revogado' | 'expirado';
  data_emissao: string;
  data_criacao: string;
  data_atualizacao: string;
  // Dados relacionados
  usuario_nome?: string;
  curso_nome?: string;
  quiz_titulo?: string;
}

interface CertificateStats {
  total: number;
  ativos: number;
  revogados: number;
  expirados: number;
  mediaNota: number;
}

interface CourseGroup {
  categoria: string;
  curso_nome?: string;
  certificados: Certificate[];
  mediaNota: number;
  ultimaEmissao: string;
  statusBreakdown: {
    ativos: number;
    revogados: number;
    expirados: number;
  };
}

interface Course {
  id: string;
  nome: string;
  categoria: string;
  certificados: Certificate[];
}

interface ProcessedCourse {
  id: string;
  nome: string;
  categoria: string;
  totalVideos: number;
  completedVideos: number;
  videosCompleted: boolean;
  quizPassed: boolean;
  certificateAvailable: boolean;
  certificate: Certificate | null;
  quizProgress: any;
}

const Certificados: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [courses, setCourses] = useState<ProcessedCourse[]>([]);
  const [filteredCertificates, setFilteredCertificates] = useState<Certificate[]>([]);
  const [stats, setStats] = useState<CertificateStats>({
    total: 0,
    ativos: 0,
    revogados: 0,
    expirados: 0,
    mediaNota: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todos');
  
  // Estados para o modal de configuração
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedCertificateId, setSelectedCertificateId] = useState<string>('');

  // Estados para o modal de edição
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCertificateToEdit, setSelectedCertificateToEdit] = useState<Certificate | null>(null);

  // Estados para visualização por curso
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showCourseCertificates, setShowCourseCertificates] = useState(false);

  // Estados para configuração de curso
  const [showCourseConfigModal, setShowCourseConfigModal] = useState(false);
  const [selectedCourseForConfig, setSelectedCourseForConfig] = useState<Course | null>(null);

  useEffect(() => {
    loadCertificates();
  }, []);

  useEffect(() => {
    filterCertificates();
  }, [certificates, searchTerm, statusFilter, categoriaFilter]);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      console.log('🔍 Iniciando carregamento de certificados...');

      // Verificar se é admin
      const isAdmin = userProfile?.tipo_usuario === 'admin' || userProfile?.tipo_usuario === 'admin_master';
      console.log('👤 Tipo de usuário:', userProfile?.tipo_usuario, 'É admin:', isAdmin);

      // Se não for admin, filtrar apenas certificados do usuário
      if (!isAdmin && userProfile?.id) {
        try {
          // Para clientes, buscar apenas os cursos permitidos
          const cursosPermitidos = [
            'Fundamentos CALLCENTER',
            'Fundamentos de PABX', 
            'Omnichannel para Empresas',
            'Configurações Avançadas OMNI',
            'Configurações Avançadas PABX'
          ];

          const { data: courses, error: coursesError } = await supabase
            .from('cursos')
            .select('id, nome, categoria')
            .in('nome', cursosPermitidos)
            .order('nome', { ascending: true });

          if (coursesError) {
            throw coursesError;
          }

          // Buscar progresso de vídeos para o usuário com detalhes dos vídeos
          const { data: videoProgress, error: videoError } = await supabase
            .from('video_progress')
            .select(`
              video_id,
              videos!inner(
                id,
                titulo,
                curso_id,
                duracao
              )
            `)
            .eq('usuario_id', userProfile.id)
            .eq('concluido', true);

          if (videoError) {
            console.log('Erro ao buscar progresso de vídeos:', videoError);
          }

          // Buscar todos os vídeos para contar o total por curso
          const { data: allVideos, error: videosError } = await supabase
            .from('videos')
            .select('id, curso_id, titulo');

          if (videosError) {
            console.log('Erro ao buscar vídeos:', videosError);
          }

          // Buscar progresso de quiz para o usuário
          const { data: quizProgress, error: quizError } = await supabase
            .from('progresso_quiz')
            .select('categoria, nota, aprovado, data_conclusao')
            .eq('usuario_id', userProfile.id);

          if (quizError) {
            console.log('Erro ao buscar progresso de quiz:', quizError);
          }

          // Buscar certificados do usuário
          const { data: userCertificates, error: certError } = await supabase
            .from('certificados')
            .select('categoria, numero_certificado, nota_final, status, data_emissao, link_pdf_certificado')
            .eq('usuario_id', userProfile.id);

          if (certError) {
            console.log('Erro ao buscar certificados:', certError);
          }

          // Processar os dados dos cursos
          const processedCourses = (courses || []).map(course => {
            // Contar vídeos completados para este curso específico
            const courseVideos = (allVideos || []).filter(video => video.curso_id === course.id);
            const totalVideos = courseVideos.length;
            
            const completedVideos = (videoProgress || []).filter(vp => 
              vp.videos && vp.videos.curso_id === course.id
            ).length;
            
            const videosCompleted = totalVideos > 0 && completedVideos >= totalVideos;
            
            // Buscar progresso de quiz para esta categoria
            const courseQuizProgress = (quizProgress || []).find(qp => 
              qp.categoria === course.categoria
            );
            const quizPassed = courseQuizProgress?.aprovado === true;
            
            // Buscar certificado para esta categoria
            const courseCertificate = (userCertificates || []).find(cert => 
              cert.categoria === course.categoria
            );
            const certificateAvailable = !!courseCertificate?.numero_certificado;

            return {
              id: course.id,
              nome: course.nome,
              categoria: course.categoria,
              totalVideos,
              completedVideos,
              videosCompleted,
              quizPassed,
              certificateAvailable,
              certificate: courseCertificate,
              quizProgress: courseQuizProgress
            };
          });

          setCourses(processedCourses);
          setCertificates([]); // Não usar certificados individuais para clientes
        } catch (error) {
          console.error('Erro ao carregar dados do cliente:', error);
          // Em caso de erro, mostrar pelo menos os cursos básicos permitidos
          const cursosPermitidos = [
            'Fundamentos CALLCENTER',
            'Fundamentos de PABX', 
            'Omnichannel para Empresas',
            'Configurações Avançadas OMNI',
            'Configurações Avançadas PABX'
          ];
          const basicProcessedCourses = cursosPermitidos.map((nome, index) => ({
            id: `curso-${index}`,
            nome: nome,
            categoria: nome.includes('CALLCENTER') ? 'CALLCENTER' : 
                      nome.includes('PABX') ? 'PABX' : 
                      nome.includes('OMNI') ? 'Omnichannel' : 'Geral',
            totalVideos: 0,
            completedVideos: 0,
            videosCompleted: false,
            quizPassed: false,
            certificateAvailable: false,
            certificate: null,
            quizProgress: null
          }));
          setCourses(basicProcessedCourses);
        }
      } else {
        // Para administradores: buscar TODOS os cursos com seus certificados
        console.log('🔍 Buscando TODOS os cursos e certificados (admin)...');
        
        const { data: courses, error: coursesError } = await supabase
          .from('cursos')
          .select(`
            id,
            nome,
            categoria,
            certificados:certificados(
              id,
              usuario_id,
              curso_id,
              categoria,
              quiz_id,
              nota_final,
              link_pdf_certificado,
              numero_certificado,
              qr_code_url,
              status,
              data_emissao,
              data_criacao,
              data_atualizacao
            )
          `)
          .order('nome');

        if (coursesError) {
          throw coursesError;
        }

        console.log('✅ Cursos encontrados:', courses);

        // Processar os dados dos cursos e certificados
        const processedCourses = await Promise.all((courses || []).map(async (course) => {
          // Buscar dados relacionados para cada certificado
          const certificatesWithRelations = await Promise.all((course.certificados || []).map(async (cert) => {
            let usuario_nome = 'Usuário não encontrado';
            let quiz_titulo = 'Quiz não encontrado';

            // Buscar nome do usuário se usuario_id existir
            if (cert.usuario_id && cert.usuario_id !== 'undefined') {
              try {
                const { data: userData } = await supabase
                  .from('usuarios')
                  .select('nome')
                  .eq('id', cert.usuario_id)
                  .single();
                
                if (userData?.nome) {
                  usuario_nome = userData.nome;
                }
              } catch (userError) {
                console.log('Erro ao buscar usuário:', userError);
              }
            }

            // Buscar título do quiz se quiz_id existir
            if (cert.quiz_id) {
              try {
                const { data: quizData } = await supabase
                  .from('quizzes')
                  .select('titulo')
                  .eq('id', cert.quiz_id)
                  .single();
                
                if (quizData?.titulo) {
                  quiz_titulo = quizData.titulo;
                }
              } catch (quizError) {
                console.log('Erro ao buscar quiz:', quizError);
              }
            }

            return {
              ...cert,
              usuario_nome,
              curso_nome: course.nome, // Usar o nome do curso diretamente
              quiz_titulo
            };
          }));

          return {
            id: course.id,
            nome: course.nome,
            categoria: course.categoria,
            certificados: certificatesWithRelations
          };
        }));

        console.log('📊 Cursos processados:', processedCourses);
        setCertificates(processedCourses.flatMap(course => course.certificados));
        calculateStats(processedCourses.flatMap(course => course.certificados));
        setCourses(processedCourses);
      }
    } catch (error) {
      console.error('Erro ao carregar certificados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar certificados. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (certs: Certificate[]) => {
    const total = certs.length;
    const ativos = certs.filter(c => c.status === 'ativo').length;
    const revogados = certs.filter(c => c.status === 'revogado').length;
    const expirados = certs.filter(c => c.status === 'expirado').length;
    const mediaNota = total > 0 ? certs.reduce((sum, c) => sum + c.nota_final, 0) / total : 0;

    setStats({
      total,
      ativos,
      revogados,
      expirados,
      mediaNota: Math.round(mediaNota * 100) / 100
    });
  };

  const filterCertificates = () => {
    let filtered = certificates;

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(cert =>
        cert.numero_certificado.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.usuario_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.curso_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.categoria.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por status
    if (statusFilter !== 'todos') {
      filtered = filtered.filter(cert => cert.status === statusFilter);
    }

    // Filtro por categoria
    if (categoriaFilter !== 'todos') {
      filtered = filtered.filter(cert => cert.categoria === categoriaFilter);
    }

    setFilteredCertificates(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case 'revogado':
        return <Badge className="bg-red-100 text-red-800">Revogado</Badge>;
      case 'expirado':
        return <Badge className="bg-yellow-100 text-yellow-800">Expirado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleDownload = async (certificate: Certificate) => {
    if (certificate.link_pdf_certificado) {
      window.open(certificate.link_pdf_certificado, '_blank');
    } else {
      toast({
        title: "PDF não disponível",
        description: "O certificado ainda não foi gerado.",
        variant: "destructive"
      });
    }
  };

  const handleViewQR = (certificate: Certificate) => {
    if (certificate.qr_code_url) {
      window.open(certificate.qr_code_url, '_blank');
    } else {
      toast({
        title: "QR Code não disponível",
        description: "O QR Code ainda não foi gerado.",
        variant: "destructive"
      });
    }
  };

  const handleViewDetails = (certificate: Certificate) => {
    // Implementar visualização de detalhes
    console.log('Visualizar detalhes:', certificate);
  };

  const handleEditCertificate = (certificate: Certificate) => {
    setSelectedCertificateToEdit(certificate);
    setShowEditModal(true);
  };

  const handleCopyNumber = (certificate: Certificate) => {
    navigator.clipboard.writeText(certificate.numero_certificado);
    toast({
      title: "Copiado!",
      description: "Número do certificado copiado para a área de transferência.",
      variant: "default"
    });
  };

  const handleConfigSave = () => {
    loadCertificates(); // Recarregar certificados após salvar
  };

  const handleEditSave = (updatedCertificate: Certificate) => {
    // Atualizar o certificado na lista local
    setCertificates(prev => 
      prev.map(cert => 
        cert.id === updatedCertificate.id ? updatedCertificate : cert
      )
    );
    
    // Atualizar certificados filtrados também
    setFilteredCertificates(prev => 
      prev.map(cert => 
        cert.id === updatedCertificate.id ? updatedCertificate : cert
      )
    );
    
    setShowEditModal(false);
    setSelectedCertificateToEdit(null);
  };

  const getUniqueCategories = () => {
    const categories = [...new Set(certificates.map(c => c.categoria))];
    return categories.sort();
  };

  const getCertificatesByCourse = (): CourseGroup[] => {
    const courseGroups: { [key: string]: CourseGroup } = {};

    filteredCertificates.forEach(cert => {
      if (!courseGroups[cert.categoria]) {
        courseGroups[cert.categoria] = {
          categoria: cert.categoria,
          curso_nome: cert.curso_nome,
          certificados: [],
          mediaNota: 0,
          ultimaEmissao: cert.data_emissao,
          statusBreakdown: {
            ativos: 0,
            revogados: 0,
            expirados: 0
          }
        };
      }

      courseGroups[cert.categoria].certificados.push(cert);
      
      // Atualizar última emissão
      if (new Date(cert.data_emissao) > new Date(courseGroups[cert.categoria].ultimaEmissao)) {
        courseGroups[cert.categoria].ultimaEmissao = cert.data_emissao;
      }

      // Atualizar status breakdown
      switch (cert.status) {
        case 'ativo':
          courseGroups[cert.categoria].statusBreakdown.ativos++;
          break;
        case 'revogado':
          courseGroups[cert.categoria].statusBreakdown.revogados++;
          break;
        case 'expirado':
          courseGroups[cert.categoria].statusBreakdown.expirados++;
          break;
      }
    });

    // Calcular média de nota para cada curso
    Object.values(courseGroups).forEach(group => {
      const totalNota = group.certificados.reduce((sum, cert) => sum + cert.nota_final, 0);
      group.mediaNota = group.certificados.length > 0 
        ? Math.round((totalNota / group.certificados.length) * 100) / 100 
        : 0;
    });

    return Object.values(courseGroups).sort((a, b) => 
      new Date(b.ultimaEmissao).getTime() - new Date(a.ultimaEmissao).getTime()
    );
  };

  const handleViewCourseCertificates = (courseGroup: CourseGroup) => {
    // Filtrar certificados apenas desta categoria
    setCategoriaFilter(courseGroup.categoria);
    setSearchTerm('');
    setStatusFilter('todos');
    
    // Scroll para o topo da página
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewCourse = (course: Course) => {
    console.log('Visualizando curso:', course);
    console.log('Certificados do curso:', course.certificados);
    setSelectedCourse(course);
    setShowCourseCertificates(true);
  };

  const handleBackToCourses = () => {
    setSelectedCourse(null);
    setShowCourseCertificates(false);
  };

  const handleEditCourseConfig = (course: Course) => {
    setSelectedCourseForConfig(course);
    setShowCourseConfigModal(true);
  };

  const handleCourseConfigSave = (courseId: string, config: any) => {
    // Atualizar a configuração do curso
    console.log('Configuração salva:', { courseId, config });
    setShowCourseConfigModal(false);
    setSelectedCourseForConfig(null);
    
    // Recarregar os dados para refletir as mudanças
    loadCertificates();
    
    toast({
      title: "Sucesso!",
      description: "Configuração do certificado salva com sucesso.",
      variant: "default"
    });
  };

  // Funções de compartilhamento social
  const handleShareLinkedIn = (certificate: Certificate) => {
    const shareText = `Acabei de obter meu certificado no curso "${certificate.curso_nome}" com nota ${certificate.nota_final}%! 🎉 #ERALearn #Certificado #Educação`;
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}&title=${encodeURIComponent(shareText)}`;
    window.open(shareUrl, '_blank');
  };

  const handleShareFacebook = (certificate: Certificate) => {
    const shareText = `Acabei de obter meu certificado no curso "${certificate.curso_nome}" com nota ${certificate.nota_final}%! 🎉`;
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}&quote=${encodeURIComponent(shareText)}`;
    window.open(shareUrl, '_blank');
  };

  const handleShareCertificate = (certificate: Certificate) => {
    const shareData = {
      title: `Certificado - ${certificate.curso_nome}`,
      text: `Acabei de obter meu certificado no curso "${certificate.curso_nome}" com nota ${certificate.nota_final}%! 🎉`,
      url: window.location.origin
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      // Fallback para copiar para clipboard
      const shareText = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
      navigator.clipboard.writeText(shareText);
      toast({
        title: "Link copiado!",
        description: "O link do certificado foi copiado para a área de transferência.",
        variant: "default"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando certificados...</p>
        </div>
      </div>
    );
  }

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
                    {userProfile?.tipo_usuario === 'cliente' ? 'Meus Certificados' : 'Certificados'}
                  </h1>
                  <p className="text-sm sm:text-base lg:text-lg md:text-xl text-blue-100 max-w-2xl">
                    {userProfile?.tipo_usuario === 'cliente' 
                      ? 'Visualize e compartilhe seus certificados conquistados'
                      : 'Visualize e gerencie todos os certificados emitidos'
                    }
                  </p>
                  <div className="flex flex-wrap items-center gap-2 lg:gap-4 mt-3 lg:mt-4">
                    <div className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm">
                      <Trophy className="h-3 w-3 lg:h-4 lg:w-4 text-yellow-300" />
                      <span>Certificação oficial</span>
                    </div>
                    <div className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm">
                      <Share2 className="h-3 w-3 lg:h-4 lg:w-4 text-yellow-300" />
                      <span>Compartilhamento</span>
                    </div>
                    <div className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm">
                      <Target className="h-3 w-3 lg:h-4 lg:w-4 text-yellow-300" />
                      <span>Validação QR Code</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm font-medium px-4 lg:px-6 py-2 lg:py-3 rounded-lg lg:rounded-xl text-sm lg:text-base transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  <ArrowLeft className="h-4 w-4 lg:h-5 lg:w-5 mr-1 lg:mr-2" />
                  Voltar
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 lg:px-6 py-6 lg:py-8">
          <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">

        {/* Stats Cards - Apenas para admins */}
        {userProfile?.tipo_usuario !== 'cliente' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Trophy className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Ativos</p>
                    <p className="text-2xl font-bold text-green-600">{stats.ativos}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <XCircle className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Revogados</p>
                    <p className="text-2xl font-bold text-red-600">{stats.revogados}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Expirados</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.expirados}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Target className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Média</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.mediaNota}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros - Apenas para admins */}
        {userProfile?.tipo_usuario !== 'cliente' && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar certificados..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Status</SelectItem>
                    <SelectItem value="ativo">Ativos</SelectItem>
                    <SelectItem value="revogado">Revogados</SelectItem>
                    <SelectItem value="expirado">Expirados</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as Categorias</SelectItem>
                    {getUniqueCategories().map(categoria => (
                      <SelectItem key={categoria} value={categoria}>
                        {categoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Certificates by Course Grid */}
        {userProfile?.tipo_usuario === 'cliente' ? (
          // Interface para clientes - cursos com progresso no esquema de grid
          <div>
            {courses.length === 0 ? (
              <Card>
                <CardContent className="p-6 sm:p-8 text-center">
                  <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                    Nenhum curso encontrado
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-3">
                    Não há cursos disponíveis no momento.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {courses.map((course) => (
                  <Card key={course.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 mb-1 truncate">
                            {course.nome}
                          </CardTitle>
                          <div className="flex flex-wrap items-center gap-1 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {course.categoria}
                            </Badge>
                            {course.certificateAvailable && (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                Certificado
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ml-2 ${
                          course.certificateAvailable 
                            ? 'bg-gradient-to-r from-green-500 to-blue-600' 
                            : course.videosCompleted 
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-600'
                            : 'bg-gradient-to-r from-gray-400 to-gray-500'
                        }`}>
                          {course.certificateAvailable ? (
                            <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                          ) : course.videosCompleted ? (
                            <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                          ) : (
                            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4 pb-4">
                      {/* Estatísticas do curso */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 font-medium">Progresso:</span>
                          <span className="font-semibold text-gray-900">
                            {course.completedVideos}/{course.totalVideos} vídeos
                          </span>
                        </div>
                        
                        {course.quizProgress && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 font-medium">Quiz:</span>
                            <span className={`font-semibold ${
                              course.quizPassed ? 'text-green-600' : 'text-orange-600'
                            }`}>
                              {course.quizPassed ? `Aprovado (${course.quizProgress.nota}%)` : `${course.quizProgress.nota}%`}
                            </span>
                          </div>
                        )}

                        {course.certificate && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 font-medium">Emitido:</span>
                            <span className="font-semibold text-gray-900">
                              {formatDate(course.certificate.data_emissao)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Barra de progresso */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>Progresso do curso</span>
                          <span>{Math.round((course.completedVideos / Math.max(course.totalVideos, 1)) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              course.certificateAvailable 
                                ? 'bg-gradient-to-r from-green-500 to-blue-600' 
                                : course.videosCompleted 
                                ? 'bg-gradient-to-r from-yellow-500 to-orange-600'
                                : 'bg-gradient-to-r from-blue-500 to-purple-600'
                            }`}
                            style={{ 
                              width: `${Math.min((course.completedVideos / Math.max(course.totalVideos, 1)) * 100, 100)}%` 
                            }}
                          />
                        </div>
                      </div>

                      {/* Botão principal de ação */}
                      <div className="pt-2">
                        {course.certificateAvailable ? (
                          <div className="space-y-2">
                            <Button
                              size="sm"
                              onClick={() => handleDownload(course.certificate)}
                              className="w-full bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Baixar Certificado
                            </Button>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleShareCertificate(course.certificate)}
                                className="flex-1 text-xs"
                              >
                                <Share2 className="h-3 w-3 mr-1" />
                                Compartilhar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleShareLinkedIn(course.certificate)}
                                className="flex-1 text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                              >
                                <Linkedin className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ) : course.videosCompleted ? (
                          <Button
                            size="sm"
                            onClick={() => navigate(`/curso/${course.id}`)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Fazer Quiz
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => navigate(`/curso/${course.id}`)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <BookOpen className="h-4 w-4 mr-2" />
                            Continuar Vídeos
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Interface para admins - agrupamento por curso
          <div>
            {showCourseCertificates && selectedCourse ? (
              // Visualização dos certificados de um curso específico
              <div>
                <div className="mb-6">
                  <Button
                    variant="outline"
                    onClick={handleBackToCourses}
                    className="flex items-center gap-2 mb-4 w-full sm:w-auto"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar para Cursos
                  </Button>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                    Certificados - {selectedCourse.nome}
                  </h2>
                </div>

                {selectedCourse.certificados.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 sm:p-12 text-center">
                      <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                        Nenhum certificado emitido ainda
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 mb-4">
                        Este curso ainda não possui certificados emitidos. Os certificados aparecerão aqui quando os alunos completarem o curso e o quiz.
                      </p>
                      <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Button
                          variant="outline"
                          onClick={handleBackToCourses}
                          className="flex items-center gap-2"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Voltar para Cursos
                        </Button>
                        {userProfile?.tipo_usuario === 'admin' || userProfile?.tipo_usuario === 'admin_master' ? (
                          <Button
                            onClick={() => handleEditCourseConfig(selectedCourse)}
                            className="flex items-center gap-2"
                          >
                            <Settings className="h-4 w-4" />
                            Configurar Certificado
                          </Button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {selectedCourse.certificados.map((certificate) => (
                      <CertificateCard
                        key={certificate.id}
                        certificate={certificate}
                        onViewDetails={handleViewDetails}
                        onEdit={handleEditCertificate}
                        onCopyNumber={handleCopyNumber}
                        onDownload={handleDownload}
                        isAdmin={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Lista de cursos com certificados
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {courses.map((course) => (
                  <CourseCertificateCard
                    key={course.id}
                    course={course}
                    onViewCertificates={handleViewCourse}
                    onEditConfig={handleEditCourseConfig}
                    isAdmin={true}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Certificados individuais quando categoria está filtrada */}
        {categoriaFilter !== 'todos' && filteredCertificates.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Certificados - {categoriaFilter}
              </h2>
              <Button
                variant="outline"
                onClick={() => {
                  setCategoriaFilter('todos');
                  setSearchTerm('');
                  setStatusFilter('todos');
                }}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para Cursos
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {filteredCertificates.map((certificate) => (
                <CertificateCard
                  key={certificate.id}
                  certificate={certificate}
                  onViewDetails={handleViewDetails}
                  onDownload={handleDownload}
                  onEdit={handleEditCertificate}
                  onCopyNumber={handleCopyNumber}
                />
              ))}
              
              {/* Card para Adicionar Novo Certificado */}
              <Card className="hover:shadow-lg transition-shadow border-2 border-dashed border-gray-300 bg-gray-50">
                <CardContent className="p-8 text-center">
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <Plus className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Adicionar Novo Certificado
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Emitir um novo certificado
                    </p>
                    <Button
                      variant="outline"
                      className="border-green-300 text-green-700 hover:bg-green-50"
                      disabled
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Emitir Certificado
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      Funcionalidade será implementada em breve
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>

      {/* Modal de Configuração de Certificado */}
      <CertificateConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        certificateId={selectedCertificateId}
        onSave={handleConfigSave}
      />

      {/* Modal de Edição de Certificado */}
      <CertificateEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        certificateId={selectedCertificateToEdit?.id || ''}
        onSave={handleEditSave}
      />

      {/* Modal de Configuração de Curso */}
      <CourseCertConfigModal
        isOpen={showCourseConfigModal}
        onClose={() => setShowCourseConfigModal(false)}
        course={selectedCourseForConfig}
        onSave={handleCourseConfigSave}
      />
    </ERALayout>
  );
};

export default Certificados;