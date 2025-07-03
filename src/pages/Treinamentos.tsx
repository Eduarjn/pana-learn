import { ERALayout } from '@/components/ERALayout';
import { CourseCard } from '@/components/CourseCard';
import { VideoUpload } from '@/components/VideoUpload';
import { YouTubeEmbed } from '@/components/YouTubeEmbed';
import { useCourses } from '@/hooks/useCourses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Plus, Video, Eye, Download, Youtube, Trash } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Dialog } from '@/components/ui/dialog';
import type { Database } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
type Video = Database['public']['Tables']['videos']['Row'];

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

  const isAdmin = userProfile?.tipo_usuario === 'admin';

  // Carregar vídeos se for administrador
  useEffect(() => {
    if (isAdmin) {
      loadVideos();
    }
  }, [isAdmin]);

  const loadVideos = async () => {
    setLoadingVideos(true);
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('data_criacao', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Erro ao carregar vídeos:', error);
    } finally {
      setLoadingVideos(false);
    }
  };

  // Filtrar cursos internos (sem YouTube)
  const filteredCourses = courses.filter(course => {
    const isInternal = !course.link_video || (!course.link_video.includes('youtube.com') && !course.link_video.includes('youtu.be'));
    const matchesSearch = course.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.categoria === selectedCategory;
    return isInternal && matchesSearch && matchesCategory;
  });

  // Obter categorias únicas
  const categories = Array.from(new Set(courses.map(course => course.categoria)));

  const handleStartCourse = (courseId: string) => {
    navigate(`/curso/${courseId}`);
  };

  const handleUploadSuccess = () => {
    loadVideos();
    refetch();
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
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pana-purple"></div>
        </div>
      </ERALayout>
    );
  }

  if (error) {
    return (
      <ERALayout>
        <div className="text-center py-8">
          <p className="text-red-500">Erro ao carregar treinamentos. Tente novamente.</p>
        </div>
      </ERALayout>
    );
  }

  return (
    <ERALayout>
      <div className="space-y-4 md:space-y-6 p-4 md:p-0 bg-era-light-gray-2 min-h-screen">
        {showUpload && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <VideoUpload 
              onClose={() => setShowUpload(false)}
              onSuccess={handleUploadSuccess}
            />
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-era-blue">Treinamentos</h1>
            <p className="text-sm md:text-base text-era-gray">Explore nossos cursos de PABX e Omnichannel</p>
          </div>
          {isAdmin && (
            <Button 
              className="bg-era-blue hover:bg-era-dark-green text-white font-medium px-4 md:px-6 py-2 rounded-full text-sm md:text-base w-full sm:w-auto transition-colors"
              onClick={() => setShowUpload(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Importar Vídeo
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="courses" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="courses">Cursos Disponíveis</TabsTrigger>
            <TabsTrigger value="youtube">YouTube Player</TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-4">
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pana-text-secondary h-4 w-4" />
                <Input
                  placeholder="Pesquisar cursos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm md:text-base"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
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

            {/* Lista de vídeos para administrador */}
            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-era-blue">
                    <Video className="h-5 w-5" />
                    Vídeos Importados ({videos.length})
                  </CardTitle>
                  <CardDescription>
                    Gerencie os vídeos de treinamento da plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Modal de visualização de vídeo */}
                  {showVideoModal && selectedVideo && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                      <div className="bg-white rounded-lg shadow-lg p-4 max-w-2xl w-full relative">
                        <button className="absolute top-2 right-2 text-xl font-bold" onClick={handleCloseVideoModal}>&times;</button>
                        <h2 className="text-lg font-semibold mb-2">{selectedVideo.titulo}</h2>
                        <video
                          id={`video-player-${selectedVideo.id}`}
                          src={selectedVideo.url_video}
                          controls
                          className="w-full rounded-md shadow"
                        />
                      </div>
                    </div>
                  )}
                  {loadingVideos ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pana-purple"></div>
                    </div>
                  ) : videos.length === 0 ? (
                    <p className="text-center py-8 text-pana-text-secondary">
                      Nenhum vídeo importado ainda. Use o botão "Importar Vídeo" para começar.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Título</TableHead>
                            <TableHead className="hidden md:table-cell">Descrição</TableHead>
                            <TableHead className="hidden sm:table-cell">Duração</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {videos.map((video, index) => (
                            <TableRow key={video.id} className={index % 2 === 0 ? 'bg-white' : 'bg-era-light-gray-2'}>
                              <TableCell className="font-medium">
                                <div className="max-w-[200px] truncate">
                                  {video.titulo}
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <div className="max-w-[300px] truncate">
                                  {video.descricao || 'Sem descrição'}
                                </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                {video.duracao ? `${video.duracao} min` : 'N/A'}
                              </TableCell>
                              <TableCell>
                                {new Date(video.data_criacao).toLocaleDateString('pt-BR')}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="sm" onClick={() => handleViewVideo(video)}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleDownloadVideo(video)}>
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  {isAdmin && (
                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteVideo(video)}>
                                      <Trash className="h-4 w-4 text-red-500" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Cursos */}
            {filteredCourses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-pana-text-secondary">
                  {courses.length === 0 
                    ? 'Nenhum curso disponível no momento.' 
                    : 'Nenhum curso encontrado com os filtros aplicados.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onStartCourse={handleStartCourse}
                  >
                    {/* Botão iniciar/continuar curso */}
                    <Button
                      className="bg-era-yellow text-era-dark-blue px-4 py-1 rounded font-bold hover:bg-era-dark-green hover:text-white transition-colors"
                      onClick={() => handleStartCourse(course.id)}
                    >
                      {course.progresso < 100 ? (course.progresso > 0 ? 'Continuar curso' : 'Iniciar curso') : 'Rever curso'}
                    </Button>
                  </CourseCard>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="youtube" className="space-y-4">
            <YouTubeEmbed 
              title="Player de Vídeo YouTube"
              onUrlChange={(url) => console.log('URL alterada:', url)}
            />
          </TabsContent>
        </Tabs>

        {/* Estatísticas */}
        <div className="bg-gradient-to-r from-era-purple to-era-blue rounded-lg p-4 md:p-6 text-white border-t-4 border-era-yellow">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 text-center">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-era-yellow">{courses.length}</div>
              <p className="text-xs md:text-sm text-white/80">Cursos Disponíveis</p>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-era-dark-green">{categories.length}</div>
              <p className="text-xs md:text-sm text-white/80">Categorias</p>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-era-yellow">{isAdmin ? videos.length : '100+'}</div>
              <p className="text-xs md:text-sm text-white/80">
                {isAdmin ? 'Vídeos Importados' : 'Horas de Conteúdo'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </ERALayout>
  );
};

export default Treinamentos;
