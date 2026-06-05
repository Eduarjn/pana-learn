import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Video, X, Youtube, Plus, Loader2, Tag, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useCourses, useCourseModules } from '@/hooks/useCourses';

// ── Proxy seguro para o Bunny Stream (Supabase Edge Function) ──────────────────
const BUNNY_PROXY  = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/super-endpoint`;
const CDN_HOSTNAME = import.meta.env.VITE_BUNNY_CDN_HOSTNAME as string;

interface VideoUploadProps {
  onClose: () => void;
  onSuccess: () => void;
  preSelectedCourseId?: string;
}

type VideoSource = 'upload' | 'youtube';

interface QuickCourse { nome: string; categoria: string; categoria_id: string; }
interface QuickCategory { nome: string; cor: string; }

const CAT_COLORS = ['#1F2041', '#4B3F72', '#417B5A', '#E9D2C0', '#e8940f', '#6366f1', '#10b981', '#ef4444'];

export function VideoUpload({ onClose, onSuccess, preSelectedCourseId }: VideoUploadProps) {
  const { userProfile } = useAuth();
  const { data: courses = [], isLoading: coursesLoading, refetch: refetchCourses } = useCourses();
  const [selectedCourseId, setSelectedCourseId] = useState(preSelectedCourseId || '');
  const { data: modules = [], isLoading: modulesLoading } = useCourseModules(selectedCourseId);
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<string>('');
  const [activeTab, setActiveTab] = useState<VideoSource>('upload');

  const [videoData, setVideoData] = useState({ titulo: '', descricao: '', duracao: 0 });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');

  // ── Estado para criar nova categoria inline ──────────────────────────────────
  const [categoriesDB, setCategoriesDB] = useState<{ id: string; nome: string; cor: string | null }[]>([]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [quickCategory, setQuickCategory] = useState<QuickCategory>({ nome: '', cor: '#4B3F72' });
  const [savingCategory, setSavingCategory] = useState(false);

  // ── Estado para criar novo curso inline ─────────────────────────────────────
  const [showNewCourse, setShowNewCourse] = useState(false);
  const [quickCourse, setQuickCourse] = useState<QuickCourse>({ nome: '', categoria: '', categoria_id: '' });
  const [savingCourse, setSavingCourse] = useState(false);

  // Obter categoria do curso selecionado
  const selectedCourse = courses.find(c => c.id === selectedCourseId);
  const courseCategory = selectedCourse?.categoria || '';

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (preSelectedCourseId) setSelectedCourseId(preSelectedCourseId);
  }, [preSelectedCourseId]);

  useEffect(() => {
    setSelectedModuleId('');
  }, [selectedCourseId]);

  const loadCategories = async () => {
    const { data } = await supabase.from('categorias').select('id,nome,cor').order('nome');
    if (data) setCategoriesDB(data);
  };

  // ── Criar categoria rapidamente ──────────────────────────────────────────────
  const handleCreateCategory = async () => {
    if (!quickCategory.nome.trim()) {
      toast({ title: 'Campo obrigatório', description: 'Informe o nome da categoria.', variant: 'destructive' });
      return;
    }
    setSavingCategory(true);
    try {
      const { data, error } = await supabase
        .from('categorias')
        .insert({ nome: quickCategory.nome.trim(), cor: quickCategory.cor })
        .select()
        .single();
      if (error) throw error;
      toast({ title: 'Categoria criada!', description: quickCategory.nome });
      await loadCategories();
      // Se estava a criar um curso, preencher a categoria automaticamente
      setQuickCourse(p => ({ ...p, categoria: data.nome, categoria_id: data.id }));
      setShowNewCategory(false);
      setQuickCategory({ nome: '', cor: '#4B3F72' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Erro ao criar categoria.', variant: 'destructive' });
    } finally {
      setSavingCategory(false);
    }
  };

  // ── Criar curso rapidamente ──────────────────────────────────────────────────
  const handleCreateCourse = async () => {
    if (!quickCourse.nome.trim()) {
      toast({ title: 'Campo obrigatório', description: 'Informe o nome do curso.', variant: 'destructive' });
      return;
    }
    if (!quickCourse.categoria.trim()) {
      toast({ title: 'Campo obrigatório', description: 'Selecione ou crie uma categoria.', variant: 'destructive' });
      return;
    }
    setSavingCourse(true);
    try {
      const { data, error } = await supabase
        .from('cursos')
        .insert({
          nome: quickCourse.nome.trim(),
          categoria: quickCourse.categoria.trim(),
          categoria_id: quickCourse.categoria_id || null,
          status: 'ativo',
        })
        .select()
        .single();
      if (error) throw error;
      toast({ title: 'Curso criado!', description: quickCourse.nome });
      await refetchCourses();
      setSelectedCourseId(data.id);
      setShowNewCourse(false);
      setQuickCourse({ nome: '', categoria: '', categoria_id: '' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Erro ao criar curso.', variant: 'destructive' });
    } finally {
      setSavingCourse(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'thumbnail') => {
    const file = event.target.files?.[0];
    if (file) {
      if (type === 'video') setVideoFile(file);
      else setThumbnailFile(file);
    }
  };

  // ── Supabase Storage: usado APENAS para thumbnails ──────────────────────────
  const uploadFile = async (file: File, bucket: string, path: string) => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return publicUrl;
  };

  // ── Bunny Stream: proxy via Supabase Edge Function ──────────────────────────
  const uploadToBunny = async (file: File, title: string): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession();
    const authHeader = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};

    setUploadStep('Criando registo no Bunny Stream…');
    const createRes = await fetch(BUNNY_PROXY, {
      method: 'POST',
      headers: { ...authHeader, 'Content-Type': 'application/json', 'x-action': 'create' },
      body: JSON.stringify({ title }),
    });
    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({ error: createRes.statusText }));
      throw new Error(`Criar vídeo falhou: ${err.error ?? createRes.statusText}`);
    }
    const { guid, cdnUrl } = await createRes.json() as { guid: string; cdnUrl: string };
    if (!guid) throw new Error('GUID não encontrado na resposta do servidor.');

    setUploadStep('A enviar vídeo para o Bunny Stream…');
    const uploadRes = await fetch(BUNNY_PROXY, {
      method: 'POST',
      headers: { ...authHeader, 'Content-Type': 'application/octet-stream', 'x-action': 'upload', 'x-video-guid': guid },
      body: file,
    });
    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({ error: uploadRes.statusText }));
      throw new Error(`Upload do vídeo falhou: ${err.error ?? uploadRes.statusText}`);
    }
    return cdnUrl ?? `https://${CDN_HOSTNAME}/${guid}/play_720p.mp4`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCourseId) {
      toast({ title: 'Erro', description: 'Selecione um curso.', variant: 'destructive' });
      return;
    }
    if (!videoData.titulo.trim()) {
      toast({ title: 'Erro', description: 'Digite o título do vídeo.', variant: 'destructive' });
      return;
    }
    if (videoData.duracao <= 0) {
      toast({ title: 'Erro', description: 'Digite a duração do vídeo em minutos.', variant: 'destructive' });
      return;
    }
    if (activeTab === 'upload' && !videoFile) {
      toast({ title: 'Erro', description: 'Selecione um arquivo de vídeo.', variant: 'destructive' });
      return;
    }
    if (activeTab === 'youtube' && (!youtubeUrl || (!youtubeUrl.includes('youtube.com') && !youtubeUrl.includes('youtu.be')))) {
      toast({ title: 'Erro', description: 'Insira uma URL válida do YouTube.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      let videoUrl = '';
      if (activeTab === 'upload') {
        videoUrl = await uploadToBunny(videoFile!, videoData.titulo);
      } else {
        videoUrl = youtubeUrl;
      }

      let thumbnailUrl = '';
      if (thumbnailFile) {
        thumbnailUrl = await uploadFile(thumbnailFile, 'training-videos', `thumbnails/${Date.now()}_${thumbnailFile.name}`);
      }

      const { data: nextOrderData, error: orderError } = await supabase.rpc('obter_proxima_ordem_video', { p_curso_id: selectedCourseId });
      if (orderError) throw new Error('Erro ao calcular ordem do vídeo');

      const { error: insertError } = await supabase.from('videos').insert({
        titulo: videoData.titulo,
        descricao: videoData.descricao,
        duracao: videoData.duracao,
        url_video: videoUrl,
        thumbnail_url: thumbnailUrl,
        categoria: courseCategory,
        curso_id: selectedCourseId,
        modulo_id: selectedModuleId || null,
        ordem: nextOrderData || 1,
      }).select().single();

      if (insertError) throw insertError;

      toast({ title: 'Sucesso', description: `Vídeo ${activeTab === 'upload' ? 'enviado' : 'importado'} com sucesso!` });

      setVideoData({ titulo: '', descricao: '', duracao: 0 });
      setVideoFile(null);
      setThumbnailFile(null);
      setYoutubeUrl('');
      setSelectedCourseId('');
      setSelectedModuleId('');

      onSuccess();
      onClose();
    } catch (error) {
      toast({ title: 'Erro', description: `Erro ao ${activeTab === 'upload' ? 'enviar' : 'importar'} o vídeo. Tente novamente.`, variant: 'destructive' });
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
        {/* Abas */}
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button type="button" onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'upload' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
            <Upload className="h-4 w-4" /> Upload
          </button>
          <button type="button" onClick={() => setActiveTab('youtube')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'youtube' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
            <Youtube className="h-4 w-4" /> YouTube
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ── Seleção de Curso ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="curso">Curso *</Label>
                <button type="button" onClick={() => setShowNewCourse(v => !v)}
                  className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline">
                  <Plus className="h-3 w-3" /> Novo curso
                </button>
              </div>
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder={coursesLoading ? 'Carregando...' : 'Selecione o curso'} />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      <span className="text-xs text-muted-foreground mr-1">[{course.categoria}]</span>
                      {course.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Mini-form: criar novo curso */}
              {showNewCourse && (
                <div className="mt-2 p-3 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
                  <p className="text-xs font-bold text-foreground flex items-center gap-1"><BookOpen className="w-3 h-3" /> Novo curso</p>
                  <input
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Nome do curso *"
                    value={quickCourse.nome}
                    onChange={e => setQuickCourse(p => ({ ...p, nome: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Select
                        value={quickCourse.categoria_id || '__manual__'}
                        onValueChange={val => {
                          if (val === '__nova__') { setShowNewCategory(true); return; }
                          if (val === '__manual__') { setQuickCourse(p => ({ ...p, categoria_id: '', categoria: '' })); return; }
                          const cat = categoriesDB.find(c => c.id === val);
                          setQuickCourse(p => ({ ...p, categoria_id: val, categoria: cat?.nome || '' }));
                        }}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Categoria *" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoriesDB.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full" style={{ background: cat.cor || '#ccc' }} />
                                {cat.nome}
                              </div>
                            </SelectItem>
                          ))}
                          <SelectItem value="__nova__">
                            <span className="text-primary font-semibold flex items-center gap-1"><Plus className="w-3 h-3" /> Nova categoria</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Mini-form: criar nova categoria (dentro do form de curso) */}
                  {showNewCategory && (
                    <div className="p-2.5 rounded-lg border border-border bg-background space-y-2">
                      <p className="text-xs font-bold text-foreground flex items-center gap-1"><Tag className="w-3 h-3" /> Nova categoria</p>
                      <input
                        className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Nome da categoria *"
                        value={quickCategory.nome}
                        onChange={e => setQuickCategory(p => ({ ...p, nome: e.target.value }))}
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Cor:</span>
                        <input type="color" value={quickCategory.cor} onChange={e => setQuickCategory(p => ({ ...p, cor: e.target.value }))} className="w-8 h-8 rounded cursor-pointer border border-border p-0.5 bg-background" />
                        <div className="flex gap-1">
                          {CAT_COLORS.map(col => (
                            <button key={col} type="button" onClick={() => setQuickCategory(p => ({ ...p, cor: col }))}
                              className={`w-5 h-5 rounded border-2 ${quickCategory.cor === col ? 'border-foreground' : 'border-transparent'}`}
                              style={{ background: col }} />
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={handleCreateCategory} disabled={savingCategory}
                          className="flex-1 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-70">
                          {savingCategory ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Criar'}
                        </button>
                        <button type="button" onClick={() => setShowNewCategory(false)} className="py-1.5 px-3 rounded-lg border border-border text-xs font-semibold hover:bg-muted">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button type="button" onClick={handleCreateCourse} disabled={savingCourse}
                      className="flex-1 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-70">
                      {savingCourse ? <><Loader2 className="w-3 h-3 animate-spin" /> Criando...</> : 'Criar curso'}
                    </button>
                    <button type="button" onClick={() => setShowNewCourse(false)} className="py-1.5 px-3 rounded-lg border border-border text-xs font-semibold hover:bg-muted">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Módulo */}
            <div className="space-y-2">
              <Label htmlFor="modulo">Módulo (opcional)</Label>
              <Select value={selectedModuleId} onValueChange={setSelectedModuleId} disabled={!selectedCourseId || modulesLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={
                    !selectedCourseId ? 'Selecione um curso primeiro' :
                    modulesLoading ? 'Carregando...' :
                    modules.length === 0 ? 'Nenhum módulo disponível' :
                    'Selecione o módulo (opcional)'
                  } />
                </SelectTrigger>
                <SelectContent>
                  {modules.map(modulo => (
                    <SelectItem key={modulo.id} value={modulo.id}>
                      {modulo.nome_modulo} ({modulo.duracao || 0} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCourseId && modules.length > 0 && (
                <p className="text-xs text-muted-foreground">{modules.length} módulo(s) disponível(is)</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="titulo">Título do Vídeo *</Label>
            <Input id="titulo" value={videoData.titulo} onChange={e => setVideoData(p => ({ ...p, titulo: e.target.value }))} placeholder="Digite o título do vídeo" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" value={videoData.descricao} onChange={e => setVideoData(p => ({ ...p, descricao: e.target.value }))} placeholder="Descreva o conteúdo do vídeo" rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duracao">Duração (em minutos) *</Label>
            <Input id="duracao" type="number" min="1" value={videoData.duracao} onChange={e => setVideoData(p => ({ ...p, duracao: parseInt(e.target.value) || 0 }))} placeholder="Ex: 15" required />
          </div>

          {/* Upload */}
          {activeTab === 'upload' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="video">Arquivo de Vídeo *</Label>
                <div className="flex items-center gap-2">
                  <Input id="video" type="file" accept="video/*" onChange={e => handleFileChange(e, 'video')} required />
                  {videoFile && <span className="text-sm text-green-600">✓</span>}
                </div>
                <p className="text-xs text-gray-500">Formatos aceitos: MP4, MOV, AVI, etc.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="thumbnail">Thumbnail (opcional)</Label>
                <div className="flex items-center gap-2">
                  <Input id="thumbnail" type="file" accept="image/*" onChange={e => handleFileChange(e, 'thumbnail')} />
                  {thumbnailFile && <span className="text-sm text-green-600">✓</span>}
                </div>
                <p className="text-xs text-gray-500">Imagem de capa do vídeo</p>
              </div>
            </div>
          )}

          {/* YouTube */}
          {activeTab === 'youtube' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="youtube-url">URL do Vídeo do YouTube *</Label>
                <Input id="youtube-url" type="url" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." required />
                <p className="text-xs text-gray-500">Cole a URL completa do vídeo do YouTube</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="thumbnail-youtube">Thumbnail (opcional)</Label>
                <div className="flex items-center gap-2">
                  <Input id="thumbnail-youtube" type="file" accept="image/*" onChange={e => handleFileChange(e, 'thumbnail')} />
                  {thumbnailFile && <span className="text-sm text-green-600">✓</span>}
                </div>
                <p className="text-xs text-gray-500">Imagem de capa personalizada (opcional)</p>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="submit"
              disabled={uploading || !selectedCourseId || !videoData.titulo || !videoData.duracao || (activeTab === 'upload' && !videoFile) || (activeTab === 'youtube' && !youtubeUrl)}
              className="era-green-button flex-1"
            >
              {uploading ? (uploadStep || 'Enviando…') : (
                activeTab === 'upload'
                  ? <><Upload className="mr-2 h-4 w-4" /> Importar Vídeo</>
                  : <><Youtube className="mr-2 h-4 w-4" /> Importar do YouTube</>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={uploading}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
