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
  const { data: courses = [] } = useCourses();
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const { data: modules = [] } = useCourseModules(selectedCourseId);
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [videoData, setVideoData] = useState({
    titulo: '',
    descricao: '',
    categoria: '',
    duracao: 0,
    url_video: '',
    thumbnail_url: ''
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  useEffect(() => {
    if (selectedCourseId) {
      const course = courses.find(c => c.id === selectedCourseId);
      if (course) setVideoData(prev => ({ ...prev, categoria: course.categoria }));
    }
  }, [selectedCourseId, courses]);

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
    
    if (!userProfile || userProfile.tipo_usuario !== 'admin') {
      toast({
        title: "Erro",
        description: "Apenas administradores podem fazer upload de vídeos",
        variant: "destructive"
      });
      return;
    }

    if (!videoFile) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo de vídeo",
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
          categoria: videoData.categoria,
          curso_id: selectedCourseId,
          modulo_id: selectedModuleId || null
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
              <Label htmlFor="curso">Curso</Label>
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o curso" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>{course.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="modulo">Módulo (opcional)</Label>
              <Select value={selectedModuleId} onValueChange={setSelectedModuleId} disabled={!selectedCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o módulo (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map(modulo => (
                    <SelectItem key={modulo.id} value={modulo.id}>{modulo.nome_modulo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="titulo">Título do Vídeo</Label>
            <Input
              id="titulo"
              placeholder="Digite o título do vídeo"
              value={videoData.titulo}
              onChange={(e) => setVideoData(prev => ({ ...prev, titulo: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              placeholder="Descreva o conteúdo do vídeo"
              value={videoData.descricao}
              onChange={(e) => setVideoData(prev => ({ ...prev, descricao: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duracao">Duração (em minutos)</Label>
            <Input
              id="duracao"
              type="number"
              placeholder="Ex: 15"
              value={videoData.duracao || ''}
              onChange={(e) => setVideoData(prev => ({ ...prev, duracao: parseInt(e.target.value) || 0 }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Select
              id="categoria"
              value={videoData.categoria}
              onValueChange={value => setVideoData(prev => ({ ...prev, categoria: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PABX">PABX</SelectItem>
                <SelectItem value="VoIP">VoIP</SelectItem>
                <SelectItem value="Omnichannel">Omnichannel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="video">Arquivo de Vídeo</Label>
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
              disabled={uploading}
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
