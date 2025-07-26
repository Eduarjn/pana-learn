import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Video, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useCourses, useCourseModules } from '@/hooks/useCourses';

interface VideoUploadProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function VideoUpload({ onClose, onSuccess }: VideoUploadProps) {
  const { userProfile } = useAuth();
  const { data: courses = [], isLoading: coursesLoading, error: coursesError } = useCourses();
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const { data: modules = [], isLoading: modulesLoading } = useCourseModules(selectedCourseId);
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [videoData, setVideoData] = useState({
    titulo: '',
    descricao: '',
    duracao: 0,
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  // Debug logs
  console.log('🔍 VideoUpload - Estado dos cursos:', {
    coursesLoading,
    coursesError,
    coursesCount: courses.length,
    courses: courses
  });

  // Função para inserir dados de teste
  const insertTestData = async () => {
    try {
      console.log('🔧 Inserindo dados de teste...');
      
      // Verificar se o usuário está autenticado
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Usuário autenticado:', user?.email);
      
      if (!user) {
        console.error('❌ Usuário não autenticado');
        toast({
          title: "Erro",
          description: "Você precisa estar logado para inserir dados de teste.",
          variant: "destructive"
        });
        return;
      }

      // Inserir categorias primeiro
      console.log('📝 Inserindo categorias...');
      const { data: categorias, error: catError } = await supabase
        .from('categorias')
        .upsert([
          { nome: 'PABX', descricao: 'Treinamentos sobre sistemas PABX', cor: '#3B82F6' },
          { nome: 'VoIP', descricao: 'Treinamentos sobre tecnologias VoIP', cor: '#10B981' },
          { nome: 'Omnichannel', descricao: 'Treinamentos sobre plataformas Omnichannel', cor: '#8B5CF6' },
          { nome: 'CALLCENTER', descricao: 'Treinamentos sobre call center', cor: '#6366F1' },
          { nome: 'Básico', descricao: 'Treinamentos introdutórios', cor: '#F59E0B' },
          { nome: 'Avançado', descricao: 'Treinamentos avançados', cor: '#EF4444' },
          { nome: 'Intermediário', descricao: 'Treinamentos de nível intermediário', cor: '#6B7280' }
        ], { onConflict: 'nome' });

      if (catError) {
        console.error('❌ Erro ao inserir categorias:', catError);
        toast({
          title: "Erro",
          description: `Erro ao inserir categorias: ${catError.message}`,
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Categorias inseridas:', categorias);

      // Inserir cursos completos (todos os que aparecem na página de Treinamentos)
      console.log('📝 Inserindo cursos...');
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
          },
          {
            nome: 'Configuração VoIP Avançada',
            categoria: 'VoIP',
            descricao: 'Configurações avançadas para sistemas VoIP corporativos',
            status: 'ativo',
            ordem: 6
          },
          {
            nome: 'Telefonia Básica',
            categoria: 'Básico',
            descricao: 'Conceitos fundamentais de telefonia e comunicação',
            status: 'ativo',
            ordem: 7
          },
          {
            nome: 'Sistemas de Comunicação',
            categoria: 'Intermediário',
            descricao: 'Sistemas intermediários de comunicação empresarial',
            status: 'ativo',
            ordem: 8
          }
        ], { onConflict: 'nome' });

      if (cursosError) {
        console.error('❌ Erro ao inserir cursos:', cursosError);
        toast({
          title: "Erro",
          description: `Erro ao inserir cursos: ${cursosError.message}`,
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Cursos inseridos:', cursos);
      
      toast({
        title: "Sucesso",
        description: "Dados de teste inseridos com sucesso! Recarregando...",
      });
      
      // Recarregar dados após 1 segundo
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('❌ Erro ao inserir dados de teste:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao inserir dados de teste.",
        variant: "destructive"
      });
    }
  };

  // Reset módulo quando curso muda
  useEffect(() => {
    setSelectedModuleId('');
  }, [selectedCourseId]);

  // Obter categoria do curso selecionado
  const selectedCourse = courses.find(c => c.id === selectedCourseId);
  const courseCategory = selectedCourse?.categoria || '';

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'thumbnail') => {
    const file = event.target.files?.[0];
    if (file) {
      if (type === 'video') {
        setVideoFile(file);
      } else {
        setThumbnailFile(file);
      }
    }
  };

  const uploadFile = async (file: File, bucket: string, path: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!videoFile) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo de vídeo.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedCourseId) {
      toast({
        title: "Erro",
        description: "Selecione um curso.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      // Upload do vídeo
      const videoPath = `videos/${Date.now()}_${videoFile.name}`;
      const videoUrl = await uploadFile(videoFile, 'training-videos', videoPath);

      // Upload da thumbnail (se fornecida)
      let thumbnailUrl = '';
      if (thumbnailFile) {
        const thumbnailPath = `thumbnails/${Date.now()}_${thumbnailFile.name}`;
        thumbnailUrl = await uploadFile(thumbnailFile, 'training-videos', thumbnailPath);
      }

      // Salvar informações do vídeo no banco
      const { error: insertError } = await supabase
        .from('videos')
        .insert({
          titulo: videoData.titulo,
          descricao: videoData.descricao,
          duracao: videoData.duracao,
          url_video: videoUrl,
          thumbnail_url: thumbnailUrl,
          categoria: courseCategory,
          curso_id: selectedCourseId,
          modulo_id: selectedModuleId || null,
          storage_path: videoPath
        });

      if (insertError) throw insertError;

      toast({
        title: "Sucesso",
        description: "Vídeo enviado com sucesso!",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar o vídeo. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Importar Vídeo de Treinamento
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Faça upload de novos vídeos de treinamento para a plataforma
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="curso">Curso *</Label>
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder={coursesLoading ? "Carregando..." : "Selecione o curso"} />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="modulo">Módulo (opcional)</Label>
              <Select 
                value={selectedModuleId} 
                onValueChange={setSelectedModuleId} 
                disabled={!selectedCourseId || modulesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !selectedCourseId ? "Selecione um curso primeiro" :
                    modulesLoading ? "Carregando..." :
                    "Selecione o módulo (opcional)"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {modules.map(modulo => (
                    <SelectItem key={modulo.id} value={modulo.id}>
                      {modulo.nome_modulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="titulo">Título do Vídeo *</Label>
            <Input
              id="titulo"
              value={videoData.titulo}
              onChange={(e) => setVideoData(prev => ({ ...prev, titulo: e.target.value }))}
              placeholder="Digite o título do vídeo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={videoData.descricao}
              onChange={(e) => setVideoData(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Descreva o conteúdo do vídeo"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duracao">Duração (em minutos) *</Label>
            <Input
              id="duracao"
              type="number"
              min="1"
              value={videoData.duracao}
              onChange={(e) => setVideoData(prev => ({ ...prev, duracao: parseInt(e.target.value) || 0 }))}
              placeholder="Ex: 15"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="video">Arquivo de Vídeo *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="video"
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFileChange(e, 'video')}
                  required
                />
                {videoFile && (
                  <span className="text-sm text-green-600">✓</span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="thumbnail">Thumbnail (opcional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="thumbnail"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'thumbnail')}
                />
                {thumbnailFile && (
                  <span className="text-sm text-green-600">✓</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={uploading || !selectedCourseId || !videoData.titulo || !videoData.duracao || !videoFile}
              className="era-lime-button flex-1"
            >
              {uploading ? (
                <>Enviando...</>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar Vídeo
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={uploading}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
