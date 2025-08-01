import { ERALayout } from '@/components/ERALayout';
import { CourseCard } from '@/components/CourseCard';
import { VideoUpload } from '@/components/VideoUpload';
import { YouTubeEmbed } from '@/components/YouTubeEmbed';
import { useCourses } from '@/hooks/useCourses';
import type { Course } from '@/hooks/useCourses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Plus, Video, Eye, Download, Youtube, Trash, BookOpen, Clock, Users, TrendingUp, Star, Award, Zap, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Dialog } from '@/components/ui/dialog';
import type { Database } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

type Video = Database['public']['Tables']['videos']['Row'] & {
  cursos?: {
    id: string;
    nome: string;
    categoria: string;
  };
  modulos?: {
    id: string;
    nome_modulo: string;
  };
};

interface CategoryGroup {
  categoria: string;
  cursos: Array<{
    id: string;
    nome: string;
    descricao?: string;
    categoria: string;
    status: string;
    imagem_url?: string | null;
    categorias?: { nome: string; cor: string };
    categoria_id?: string;
    ordem?: number;
  }>;
  totalHoras: number;
  niveis: string[];
  cursosAtivos: number;
}

const Treinamentos = () => {
  const { data: courses = [], isLoading, error, refetch } = useCourses();
  const { userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showUpload, setShowUpload] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const navigate = useNavigate();

  const isAdmin = userProfile?.tipo_usuario === 'admin' || userProfile?.tipo_usuario === 'admin_master';

  // Carregar vídeos para qualquer usuário autenticado
  useEffect(() => {
    if (userProfile) {
      loadVideos();
    }
  }, [userProfile]);

  const loadVideos = async () => {
    setLoadingVideos(true);
    console.log('🔍 Carregando vídeos...');
    console.log('👤 Usuário:', userProfile?.email, 'Tipo:', userProfile?.tipo_usuario);
    
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('data_criacao', { ascending: false });

      if (error) {
        console.error('❌ Erro ao carregar vídeos:', error);
        throw error;
      }

      console.log('✅ Vídeos carregados:', data?.length || 0);
      console.log('📋 Dados dos vídeos:', data);
      
      setVideos(data || []);
      console.log('Vídeos recebidos do Supabase:', data);
    } catch (error) {
      console.error('❌ Erro inesperado ao carregar vídeos:', error);
    } finally {
      setLoadingVideos(false);
    }
  };

  // Dados mock dos cinco cursos principais com cores vibrantes
  const cursosPrincipaisMock = [
    {
      nome: 'Fundamentos de PABX',
      descricao: 'Curso introdutório sobre sistemas PABX e suas funcionalidades básicas',
      categoria: 'PABX',
      status: 'ativo',
      imagem_url: null,
      categorias: { nome: 'PABX', cor: '#3B82F6' },
      gradient: 'from-blue-500 to-blue-600',
      icon: '📞',
      duration: '2-3 horas',
      modules: '5 módulos',
      level: 'Iniciante'
    },
    {
      nome: 'Fundamentos CALLCENTER',
      descricao: 'Introdução aos sistemas de call center e suas funcionalidades',
      categoria: 'CALLCENTER',
      status: 'ativo',
      imagem_url: null,
      categorias: { nome: 'CALLCENTER', cor: '#6366F1' },
      gradient: 'from-indigo-500 to-purple-600',
      icon: '🎧',
      duration: '2-3 horas',
      modules: '4 módulos',
      level: 'Iniciante'
    },
    {
      nome: 'Configurações Avançadas PABX',
      descricao: 'Configurações avançadas para otimização do sistema PABX',
      categoria: 'PABX',
      status: 'ativo',
      imagem_url: null,
      categorias: { nome: 'PABX', cor: '#3B82F6' },
      gradient: 'from-blue-600 to-cyan-500',
      icon: '⚙️',
      duration: '3-4 horas',
      modules: '6 módulos',
      level: 'Avançado'
    },
    {
      nome: 'OMNICHANNEL para Empresas',
      descricao: 'Implementação de soluções omnichannel em ambientes empresariais',
      categoria: 'OMNICHANNEL',
      status: 'ativo',
      imagem_url: null,
      categorias: { nome: 'OMNICHANNEL', cor: '#10B981' },
      gradient: 'from-emerald-500 to-teal-600',
      icon: '🌐',
      duration: '4-5 horas',
      modules: '8 módulos',
      level: 'Intermediário'
    },
    {
      nome: 'Configurações Avançadas OMNI',
      descricao: 'Configurações avançadas para sistemas omnichannel',
      categoria: 'OMNICHANNEL',
      status: 'ativo',
      imagem_url: null,
      categorias: { nome: 'OMNICHANNEL', cor: '#10B981' },
      gradient: 'from-teal-500 to-green-600',
      icon: '🚀',
      duration: '5-6 horas',
      modules: '10 módulos',
      level: 'Avançado'
    },
  ];

  // IDs ou nomes dos cinco cursos principais
  const cursosPrincipaisNomes = cursosPrincipaisMock.map(c => c.nome);

  // Buscar cursos do banco que são principais
  const cursosPrincipaisBanco = courses.filter(course => cursosPrincipaisNomes.includes(course.nome));

  // Gerar lista final: usar curso real se existir, senão mock
  const filteredCourses = cursosPrincipaisNomes.map(nome => {
    const real = courses.find(c => c.nome === nome);
    if (real) return real;
    // Adiciona id mock para o CourseCard saber que é mock
    const mock = cursosPrincipaisMock.find(m => m.nome === nome);
    return { ...mock, id: `mock-${mock.nome.replace(/\s+/g, '-').toLowerCase()}` };
  }).filter(course => {
    const matchesSearch = course.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Função utilitária para pegar propriedade visual de mock ou valor padrão
  function getVisualProp(course, prop, fallback) {
    // Se for mock, tem a prop
    if (course.id && course.id.startsWith('mock-')) return course[prop] || fallback;
    // Para cursos reais, retorna fallback
    return fallback;
  }

  // Debug logs para verificar cursos reais vs mockados
  console.log('🔍 Treinamentos - Debug dos cursos:', {
    totalCursosBanco: courses.length,
    cursosPrincipaisBanco: cursosPrincipaisBanco.length,
    cursosPrincipaisNomes: cursosPrincipaisNomes,
    filteredCourses: filteredCourses.map(c => ({
      nome: c.nome,
      id: c.id,
      isMock: c.id.startsWith('mock-')
    }))
  });

  // Obter categorias únicas
  const categories = Array.from(new Set(courses.map(course => course.categoria)));

  const getCoursesByCategory = (): CategoryGroup[] => {
    const categoryGroups: { [key: string]: CategoryGroup } = {};

    filteredCourses.forEach(course => {
      if (!categoryGroups[course.categoria]) {
        categoryGroups[course.categoria] = {
          categoria: course.categoria,
          cursos: [],
          totalHoras: 0,
          niveis: [],
          cursosAtivos: 0
        };
      }

      categoryGroups[course.categoria].cursos.push(course);
      
      // Calcular horas estimadas baseado no nível
      const level = getVisualProp(course, 'level', 'Iniciante');
      const horas = level === 'Avançado' ? 5 : level === 'Intermediário' ? 3 : 2;
      categoryGroups[course.categoria].totalHoras += horas;

      // Adicionar nível se não existir
      if (!categoryGroups[course.categoria].niveis.includes(level)) {
        categoryGroups[course.categoria].niveis.push(level);
      }

      // Contar cursos ativos
      if (course.status === 'ativo') {
        categoryGroups[course.categoria].cursosAtivos++;
      }
    });

    return Object.values(categoryGroups).sort((a, b) => 
      b.cursos.length - a.cursos.length
    );
  };

  const handleViewCategoryCourses = (categoryGroup: CategoryGroup) => {
    // Filtrar cursos apenas desta categoria
    setSelectedCategory(categoryGroup.categoria);
    setSearchTerm('');
    
    // Removido o scroll automático para deixar a transição mais suave
  };

  const handleStartCourse = (courseId: string) => {
    // Se for um curso mock, não navegar
    if (courseId.startsWith('mock-')) {
      toast({
        title: "Curso não disponível",
        description: "Este curso ainda não foi configurado no sistema.",
        variant: "destructive"
      });
      return;
    }
    navigate(`/curso/${courseId}`);
  };

  const handleUploadSuccess = () => {
    loadVideos();
    refetch();
  };

  // Função de debug para testar consulta de vídeos
  const testVideoQuery = async () => {
    console.log('🧪 Testando consulta de vídeos...');
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .limit(5);

      console.log('📊 Resultado da consulta:', { data, error });
      
      if (error) {
        toast({
          title: "Erro na consulta",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Consulta bem-sucedida",
          description: `${data?.length || 0} vídeos encontrados`,
        });
      }
    } catch (err) {
      console.error('❌ Erro no teste:', err);
      toast({
        title: "Erro no teste",
        description: "Erro inesperado ao testar consulta",
        variant: "destructive"
      });
    }
  };

  // Função para inserir cursos no banco
  const insertCoursesToDatabase = async () => {
    console.log('🔧 Inserindo cursos no banco...');
    try {
      // Primeiro inserir categorias
      const { data: categorias, error: catError } = await supabase
        .from('categorias')
        .upsert([
          { nome: 'PABX', descricao: 'Treinamentos sobre sistemas PABX', cor: '#3B82F6' },
          { nome: 'CALLCENTER', descricao: 'Treinamentos sobre sistemas de call center', cor: '#6366F1' },
          { nome: 'VoIP', descricao: 'Treinamentos sobre tecnologias VoIP', cor: '#8B5F6' },
          { nome: 'Omnichannel', descricao: 'Treinamentos sobre plataformas Omnichannel', cor: '#10B981' }
        ], { onConflict: 'nome' });

      if (catError) {
        console.error('❌ Erro ao inserir categorias:', catError);
        throw catError;
      }

      // Agora inserir cursos
      const { data: cursos, error: cursosError } = await supabase
        .from('cursos')
        .upsert([
          {
            nome: 'Fundamentos de PABX',
            categoria: 'PABX',
            descricao: 'Curso introdutório sobre sistemas PABX e suas funcionalidades básicas',
            status: 'ativo',
            ordem: 1
          },
          {
            nome: 'Fundamentos CALLCENTER',
            categoria: 'CALLCENTER',
            descricao: 'Introdução aos sistemas de call center e suas funcionalidades',
            status: 'ativo',
            ordem: 2
          },
          {
            nome: 'Configurações Avançadas PABX',
            categoria: 'PABX',
            descricao: 'Configurações avançadas para otimização do sistema PABX',
            status: 'ativo',
            ordem: 3
          },
          {
            nome: 'OMNICHANNEL para Empresas',
            categoria: 'Omnichannel',
            descricao: 'Implementação de soluções omnichannel em ambientes empresariais',
            status: 'ativo',
            ordem: 4
          },
          {
            nome: 'Configurações Avançadas OMNI',
            categoria: 'Omnichannel',
            descricao: 'Configurações avançadas para sistemas omnichannel',
            status: 'ativo',
            ordem: 5
          }
        ], { onConflict: 'nome' });

      if (cursosError) {
        console.error('❌ Erro ao inserir cursos:', cursosError);
        throw cursosError;
      }

      console.log('✅ Cursos inseridos com sucesso:', cursos);
      toast({
        title: "Sucesso!",
        description: "Cursos inseridos no banco de dados. Recarregue a página para ver as mudanças.",
      });

      // Recarregar dados
      refetch();
    } catch (error) {
      console.error('❌ Erro ao inserir cursos:', error);
      toast({
        title: "Erro",
        description: "Erro ao inserir cursos no banco de dados.",
        variant: "destructive"
      });
    }
  };

  const handleViewVideo = (video: Video) => {
    setSelectedVideo(video);
    setShowVideoModal(true);
  };

  const handleCloseVideoModal = () => {
    setShowVideoModal(false);
    setSelectedVideo(null);
  };

  const handleDownloadVideo = (video: Video) => {
    if (video.url_video) {
      const link = document.createElement('a');
      link.href = video.url_video;
      link.download = video.titulo || 'video.mp4';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDeleteVideo = async (video) => {
    if (!window.confirm('Tem certeza que deseja deletar este vídeo?')) return;
    // 1. Remover do Storage
    let storageError = null;
    if (video.storage_path) {
      const { error } = await supabase.storage.from('training-videos').remove([video.storage_path]);
      storageError = error;
    } else {
      alert('storage_path não encontrado para este vídeo!');
      return;
    }
    // 2. Remover do banco
    const { error: dbError } = await supabase.from('videos').delete().eq('id', video.id);
    // 3. Feedback e atualização de estado
    if (!dbError && !storageError) {
      toast({ title: 'Sucesso', description: 'Vídeo deletado com sucesso!' });
      setVideos(prev => prev.filter(v => v.id !== video.id));
    } else {
      toast({ title: 'Erro', description: 'Erro ao deletar vídeo.', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <ERALayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 lg:h-12 lg:w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-3 lg:mb-4"></div>
            <p className="text-gray-600 text-sm lg:text-base">Carregando treinamentos...</p>
          </div>
        </div>
      </ERALayout>
    );
  }

  if (error) {
    return (
      <ERALayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50 flex items-center justify-center p-4">
          <div className="text-center py-6 lg:py-8">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 lg:h-10 lg:w-10 text-red-500" />
            </div>
            <p className="text-red-500 text-sm lg:text-base mb-2">Erro ao carregar treinamentos.</p>
            <p className="text-gray-500 text-xs lg:text-sm">Tente recarregar a página ou entre em contato com o suporte.</p>
          </div>
        </div>
      </ERALayout>
    );
  }

  return (
    <ERALayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
        {showUpload && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <VideoUpload 
              onClose={() => setShowUpload(false)}
              onSuccess={handleUploadSuccess}
            />
          </div>
        )}

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
                    Treinamentos
                  </h1>
                  <p className="text-sm sm:text-base lg:text-lg md:text-xl text-blue-100 max-w-2xl">
                    Explore nossos cursos de PABX e Omnichannel com conteúdo exclusivo e atualizado
                  </p>
                  <div className="flex flex-wrap items-center gap-2 lg:gap-4 mt-3 lg:mt-4">
                    <div className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm">
                      <BookOpen className="h-3 w-3 lg:h-4 lg:w-4 text-yellow-300" />
                      <span>{filteredCourses.length} cursos disponíveis</span>
                    </div>
                    <div className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm">
                      <Clock className="h-3 w-3 lg:h-4 lg:w-4 text-yellow-300" />
                      <span>+50 horas de conteúdo</span>
                    </div>
                    <div className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm">
                      <Users className="h-3 w-3 lg:h-4 lg:w-4 text-yellow-300" />
                      <span>1000+ alunos</span>
                    </div>
                  </div>
                </div>
                {isAdmin && (
                  <Button 
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm font-medium px-4 lg:px-6 py-2 lg:py-3 rounded-lg lg:rounded-xl text-sm lg:text-base transition-all duration-300 hover:scale-105 shadow-lg w-full sm:w-auto"
                    onClick={() => setShowUpload(true)}
                  >
                    <Plus className="h-4 w-4 lg:h-5 lg:w-5 mr-1 lg:mr-2" />
                    Importar Vídeo
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 lg:px-6 py-6 lg:py-8">
          <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
            {/* Tabs com design melhorado */}
            <Tabs defaultValue="courses" className="w-full">
              <TabsList className="w-full lg:w-auto bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg lg:rounded-xl p-1 shadow-lg">
                <TabsTrigger 
                  value="courses" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-md lg:rounded-lg transition-all duration-300 text-sm lg:text-base"
                >
                  <BookOpen className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                  Cursos Disponíveis
                </TabsTrigger>
              </TabsList>

              <TabsContent value="courses" className="space-y-4 lg:space-y-6 mt-4 lg:mt-6">
                {/* Filtros com design melhorado */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 lg:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 lg:h-5 lg:w-5" />
                        <Input
                          placeholder="Pesquisar cursos..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 lg:pl-12 h-10 lg:h-12 text-sm lg:text-base border-2 border-gray-200 focus:border-blue-500 rounded-lg lg:rounded-xl transition-all duration-300"
                        />
                      </div>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-full sm:w-48 lg:w-56 h-10 lg:h-12 border-2 border-gray-200 focus:border-blue-500 rounded-lg lg:rounded-xl transition-all duration-300">
                          <Filter className="h-4 w-4 lg:h-5 lg:w-5 mr-2 text-gray-400" />
                          <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas as categorias</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Lista de vídeos para administrador */}
                {isAdmin && (
                  <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-3 text-white font-bold text-xl">
                            <div className="p-2 bg-white/20 rounded-lg">
                              <Video className="h-6 w-6" />
                            </div>
                            <span className="flex items-center gap-3">
                              <span>Vídeos Importados</span>
                              <Badge className="bg-yellow-400 text-black font-bold px-3 py-1 rounded-full text-sm">
                                {videos.length}
                              </Badge>
                            </span>
                          </CardTitle>
                          <CardDescription className="text-blue-100 mt-2">
                            Gerencie os vídeos de treinamento da plataforma
                          </CardDescription>
                        </div>
                        {/* Debug section - apenas para desenvolvimento */}
                        {process.env.NODE_ENV === 'development' && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={testVideoQuery}
                              className="text-xs bg-white/20 border-white/30 text-white hover:bg-white/30"
                            >
                              Testar Consulta
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={insertCoursesToDatabase}
                              className="text-xs bg-white/20 border-white/30 text-white hover:bg-white/30"
                            >
                              Inserir Cursos
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                console.log('🔄 Recarregando vídeos...');
                                loadVideos();
                              }}
                              className="text-xs bg-white/20 border-white/30 text-white hover:bg-white/30"
                            >
                              Recarregar
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      {/* Modal de visualização de vídeo */}
                      {showVideoModal && selectedVideo && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full relative">
                            <button className="absolute top-4 right-4 text-2xl font-bold text-gray-500 hover:text-gray-700" onClick={handleCloseVideoModal}>&times;</button>
                            <h2 className="text-xl font-semibold mb-4">{selectedVideo.titulo}</h2>
                            <video
                              id={`video-player-${selectedVideo.id}`}
                              src={selectedVideo.url_video}
                              controls
                              className="w-full rounded-lg shadow-lg"
                            />
                          </div>
                        </div>
                      )}
                      {loadingVideos ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                        </div>
                      ) : videos.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Video className="h-10 w-10 text-gray-400" />
                          </div>
                          <p className="text-gray-500 text-lg">Nenhum vídeo importado ainda.</p>
                          <p className="text-gray-400 text-sm mt-2">Comece importando seu primeiro vídeo de treinamento</p>
                        </div>
                      ) : (
                        <div className="overflow-y-auto max-h-[300px] flex flex-col gap-3">
                          {videos.map((video) => (
                            <div key={video.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-blue-200/50 gap-4 hover:shadow-md transition-all duration-300">
                              <div className="flex-1 min-w-0">
                                <h5 className="font-semibold text-gray-900 truncate">{video.titulo}</h5>
                                <p className="text-sm text-gray-600 truncate flex items-center gap-2">
                                  <Clock className="h-3 w-3" />
                                  {video.duracao} min • {new Date(video.data_criacao).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewVideo(video)}
                                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg"
                                  title="Visualizar"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteVideo(video)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg"
                                  title="Excluir"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Resumo inferior */}
                      <div className="mt-6 flex justify-end">
                        <span className="text-sm text-gray-600 font-medium bg-gray-100 px-3 py-1 rounded-full">
                          Vídeos Importados: {videos.length}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Cursos agrupados por categoria */}
                {filteredCourses.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="h-10 w-10 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-base mb-2">
                      {courses.length === 0 
                        ? 'Nenhum curso disponível no momento.' 
                        : 'Nenhum curso encontrado com os filtros aplicados.'}
                    </p>
                    <p className="text-gray-400 text-sm">Tente ajustar os filtros de pesquisa</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                    {getCoursesByCategory().map((categoryGroup) => (
                      <Card key={categoryGroup.categoria} className="hover:shadow-lg transition-shadow h-full">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base lg:text-lg font-semibold text-gray-900 mb-2 truncate">
                                {categoryGroup.categoria}
                              </CardTitle>
                              <div className="flex flex-wrap items-center gap-1 mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {categoryGroup.cursos.length} curso{categoryGroup.cursos.length !== 1 ? 's' : ''}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {categoryGroup.totalHoras}+ horas
                                </Badge>
                              </div>
                            </div>
                            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                              <BookOpen className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-3">
                          <div className="space-y-2">
                            <div className="flex items-center text-xs lg:text-sm text-gray-600">
                              <BookOpen className="h-3 w-3 lg:h-4 lg:w-4 mr-2 flex-shrink-0" />
                              <span className="font-medium">Categoria:</span>
                              <span className="ml-1 truncate">{categoryGroup.categoria}</span>
                            </div>

                            <div className="flex items-center text-xs lg:text-sm text-gray-600">
                              <Clock className="h-3 w-3 lg:h-4 lg:w-4 mr-2 flex-shrink-0" />
                              <span className="font-medium">Total de horas:</span>
                              <span className="ml-1">{categoryGroup.totalHoras}+ horas</span>
                            </div>

                            <div className="flex items-center text-xs lg:text-sm text-gray-600">
                              <Users className="h-3 w-3 lg:h-4 lg:w-4 mr-2 flex-shrink-0" />
                              <span className="font-medium">Níveis:</span>
                              <span className="ml-1 truncate">{categoryGroup.niveis.join(', ')}</span>
                            </div>

                            <div className="flex items-center text-xs lg:text-sm text-gray-600">
                              <Star className="h-3 w-3 lg:h-4 lg:w-4 mr-2 flex-shrink-0" />
                              <span className="font-medium">Status:</span>
                              <span className="ml-1">{categoryGroup.cursosAtivos} ativos</span>
                            </div>
                          </div>

                          {/* Lista de cursos da categoria */}
                          <div className="bg-gray-50 p-2 lg:p-3 rounded-lg">
                            <div className="text-xs lg:text-sm font-medium text-gray-700 mb-2">Cursos disponíveis:</div>
                            <div className="space-y-1 lg:space-y-2">
                              {categoryGroup.cursos.slice(0, 3).map((course) => (
                                <div key={course.id} className="flex items-center justify-between text-xs lg:text-sm">
                                  <span className="text-gray-600 truncate flex-1 mr-2">{course.nome}</span>
                                  <Badge className="text-xs flex-shrink-0" variant="outline">
                                    {getVisualProp(course, 'level', 'Iniciante')}
                                  </Badge>
                                </div>
                              ))}
                              {categoryGroup.cursos.length > 3 && (
                                <div className="text-xs text-gray-500 text-center pt-1">
                                  +{categoryGroup.cursos.length - 3} mais cursos
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewCategoryCourses(categoryGroup)}
                              className="w-full text-xs lg:text-sm"
                            >
                              <Eye className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                              Ver Cursos
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {/* Card para Adicionar Novo Curso - Apenas para admins */}
                    {isAdmin && (
                      <Card className="hover:shadow-lg transition-shadow border-2 border-dashed border-gray-300 bg-gray-50 h-full">
                        <CardContent className="p-6 lg:p-8 text-center">
                          <div className="flex flex-col items-center justify-center h-full">
                            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-green-100 rounded-full flex items-center justify-center mb-3 lg:mb-4">
                              <Plus className="h-6 w-6 lg:h-8 lg:w-8 text-green-600" />
                            </div>
                            <h3 className="text-sm lg:text-lg font-semibold text-gray-900 mb-2">
                              Adicionar Novo Curso
                            </h3>
                            <p className="text-xs lg:text-sm text-gray-600 mb-3 lg:mb-4">
                              Crie um novo curso de treinamento
                            </p>
                            <Button
                              variant="outline"
                              className="border-green-300 text-green-700 hover:bg-green-50 text-xs lg:text-sm"
                              disabled
                            >
                              <Plus className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                              Criar Curso
                            </Button>
                            <p className="text-xs text-gray-500 mt-2">
                              Disponível para administradores
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Cursos individuais quando categoria está filtrada */}
                {selectedCategory !== 'all' && filteredCourses.length > 0 && (
                  <div className="mt-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                      <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
                        Cursos - {selectedCategory}
                      </h2>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedCategory('all');
                          setSearchTerm('');
                        }}
                        className="flex items-center gap-2 w-full sm:w-auto"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar para Categorias
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                      {filteredCourses.map((course, index) => (
                        <CourseCard
                          key={course.id}
                          course={course as unknown as Course}
                          onStartCourse={handleStartCourse}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Estatísticas com design melhorado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-xl">
                <CardContent className="p-4 lg:p-6 text-center">
                  <div className="w-12 h-12 lg:w-16 lg:h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 lg:mb-4">
                    <BookOpen className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
                  </div>
                  <div className="text-2xl lg:text-3xl font-bold text-yellow-300 mb-1 lg:mb-2">{courses.length}</div>
                  <p className="text-blue-100 font-medium text-sm lg:text-base">Cursos Disponíveis</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-xl">
                <CardContent className="p-4 lg:p-6 text-center">
                  <div className="w-12 h-12 lg:w-16 lg:h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 lg:mb-4">
                    <TrendingUp className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
                  </div>
                  <div className="text-2xl lg:text-3xl font-bold text-yellow-300 mb-1 lg:mb-2">{categories.length}</div>
                  <p className="text-purple-100 font-medium text-sm lg:text-base">Categorias</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-xl sm:col-span-2 lg:col-span-1">
                <CardContent className="p-4 lg:p-6 text-center">
                  <div className="w-12 h-12 lg:w-16 lg:h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 lg:mb-4">
                    <Clock className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
                  </div>
                  <div className="text-2xl lg:text-3xl font-bold text-yellow-300 mb-1 lg:mb-2">{isAdmin ? videos.length : '50+'}</div>
                  <p className="text-green-100 font-medium text-sm lg:text-base">
                    {isAdmin ? 'Vídeos Importados' : 'Horas de Conteúdo'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ERALayout>
  );
};

export default Treinamentos;
