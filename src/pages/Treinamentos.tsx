import { ERALayout } from '@/components/ERALayout';
import { CourseCard } from '@/components/CourseCard';
import { VideoUpload } from '@/components/VideoUpload';
import { useCourses } from '@/hooks/useCourses';
import type { Course } from '@/hooks/useCourses';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Filter, Plus, Video, Eye, BookOpen, Clock, Users, Settings, ListOrdered, ArrowLeft, Play, Trash, ChevronRight, GraduationCap, Award, Edit, Loader2, MoreVertical, Tag } from 'lucide-react';
import { PanaLoader, PanaLoaderInline } from '@/components/ui/pana-loader';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cardHover } from '@/lib/animations';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import type { Database } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';



type VideoRow = Database['public']['Tables']['videos']['Row'] & {
  cursos?: { id: string; nome: string; categoria: string } | null;
};
interface CategoryGroup { categoria: string; cursos: Course[]; totalHoras: number; niveis: string[]; cursosAtivos: number; }
interface CategoriaDB { id: string; nome: string; descricao: string | null; cor: string | null; }
interface CategoryForm { nome: string; descricao: string; cor: string; }
interface CourseForm { nome: string; descricao: string; categoria: string; categoria_id: string; status: 'ativo' | 'inativo' | 'em_breve'; ordem: number; manualCategory: boolean; }

const LEVEL_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  'Iniciante': { bg: 'rgba(252,163,17,0.12)', text: '#E9D2C0', border: 'rgba(252,163,17,0.3)' },
  'Intermediário': { bg: 'rgba(229,229,229,0.08)', text: '#E5E5E5', border: 'rgba(229,229,229,0.2)' },
  'Avancado': { bg: 'rgba(75,63,114,0.18)', text: '#E9D2C0', border: 'rgba(75,63,114,0.4)' },
};

const CAT_COLORS = ['#E9D2C0', '#e8940f', '#d4860e', '#f0b84a', '#1F2041', '#1e3152', '#2a4070', '#0d1a2e'];

const CatIcon = ({ cat, size = 20 }: { cat: string; size?: number }) => {
  const c = 'hsl(var(--primary))';
  if (cat === 'PABX' || cat === 'VoIP')
    return <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><path d="M3 4a1 1 0 011-1h3l1.5 3.5L7 8s1 2 5 5l1.5-1.5L17 13v3a1 1 0 01-1 1C7 17 3 10 3 4z" stroke={c} strokeWidth="1.5" strokeLinejoin="round" /></svg>;
  if (cat === 'CALLCENTER')
    return <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><path d="M10 2a6 6 0 016 6v2a2 2 0 01-2 2H6a2 2 0 01-2-2V8a6 6 0 016-6z" stroke={c} strokeWidth="1.5" /><path d="M7 18h6M10 14v4" stroke={c} strokeWidth="1.5" strokeLinecap="round" /></svg>;
  if (cat === 'OMNICHANNEL')
    return <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke={c} strokeWidth="1.5" /><path d="M3 10h14M10 3c-2 3-2 11 0 14M10 3c2 3 2 11 0 14" stroke={c} strokeWidth="1.5" /></svg>;
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="2" stroke={c} strokeWidth="1.5" /><path d="M7 10h6M10 7v6" stroke={c} strokeWidth="1.5" strokeLinecap="round" /></svg>;
};

const emptyCF: CategoryForm = { nome: '', descricao: '', cor: 'hsl(var(--primary))' };
const emptyCoF: CourseForm = { nome: '', descricao: '', categoria: '', categoria_id: '', status: 'ativo', ordem: 0, manualCategory: false };
const IS: React.CSSProperties = { background: 'hsl(var(--background))', border: `1px solid ${'hsl(var(--border))'}`, color: 'hsl(var(--foreground))', borderRadius: 10, padding: '9px 13px', fontSize: 13, width: '100%', outline: 'none', fontFamily: 'inherit' };

export const Treinamentos = () => {
  const { data: courses = [], isLoading, error, refetch } = useCourses();
  const { userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showUpload, setShowUpload] = useState(false);
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoRow | null>(null);
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);
  const navigate = useNavigate();
  const isAdmin = userProfile?.tipo_usuario === 'admin' || userProfile?.tipo_usuario === 'admin_master';

  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [categoriesDB, setCategoriesDB] = useState<CategoriaDB[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>({ ...emptyCF });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [courseForm, setCourseForm] = useState<CourseForm>({ ...emptyCoF });
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [savingCourse, setSavingCourse] = useState(false);

  useEffect(() => { if (userProfile) loadVideos(); }, [userProfile?.id]);
  useEffect(() => { if (isAdmin) loadCategories(); }, [isAdmin]);

  const loadVideos = async () => {
    setLoadingVideos(true);
    try {
      // Join direto — elimina o N+1 (era: query videos + query cursos separada)
      const { data: vd, error: vErr } = await supabase
        .from('videos')
        .select('id, titulo, duracao, storage_path, url_video, curso_id, data_criacao, cursos!videos_curso_id_fkey(id, nome, categoria)')
        .order('data_criacao', { ascending: false });
      if (vErr) throw vErr;
      setVideos(vd || []);
    } catch { } finally { setLoadingVideos(false); }
  };

  const searchLower = useMemo(() => searchTerm.toLowerCase(), [searchTerm]);

  const allFilteredCourses = useMemo(() =>
    courses.filter(c =>
      (c.nome.toLowerCase().includes(searchLower) || c.categoria.toLowerCase().includes(searchLower)) &&
      (selectedCategory === 'all' || c.categoria === selectedCategory)
    ),
  [courses, searchLower, selectedCategory]);

  const categories = useMemo(
    () => Array.from(new Set(courses.map(c => c.categoria))),
    [courses]
  );

  const catGroups = useMemo((): CategoryGroup[] => {
    const map: Record<string, CategoryGroup> = {};
    allFilteredCourses.forEach(c => {
      if (!map[c.categoria]) map[c.categoria] = { categoria: c.categoria, cursos: [], totalHoras: 0, niveis: [], cursosAtivos: 0 };
      map[c.categoria].cursos.push(c as Course);
      map[c.categoria].totalHoras += 2;
      if (c.status === 'ativo') map[c.categoria].cursosAtivos++;
    });
    return Object.values(map).sort((a, b) => b.cursos.length - a.cursos.length);
  }, [allFilteredCourses]);

  const handleStartCourse = (courseId: string) => {
    if (!courseId) { toast({ title: 'Erro', description: 'ID invalido.', variant: 'destructive' }); return; }
    navigate(`/curso/${courseId}`);
  };

  const handleDeleteVideo = async (video: VideoRow) => {
    if (!window.confirm('Tem certeza que deseja deletar este video?')) return;
    setDeletingVideoId(video.id);
    try {
      if (video.storage_path) await supabase.storage.from('training-videos').remove([video.storage_path]);
      const { error: dbErr } = await supabase.from('videos').delete().eq('id', video.id);
      if (dbErr) throw dbErr;
      setVideos(prev => prev.filter(v => v.id !== video.id));
      toast({ title: 'Sucesso', description: 'Video deletado!' });
    } catch { toast({ title: 'Erro', description: 'Erro ao deletar video.', variant: 'destructive' }); }
    finally { setDeletingVideoId(null); }
  };

  const loadCategories = useCallback(async () => {
    setLoadingCategories(true);
    try { const { data, error } = await supabase.from('categorias').select('id,nome,descricao,cor').order('nome'); if (error) throw error; setCategoriesDB(data || []); }
    catch { toast({ title: 'Erro', description: 'Erro ao carregar categorias.', variant: 'destructive' }); }
    finally { setLoadingCategories(false); }
  }, []);

  const handleSaveCategory = async () => {
    if (!categoryForm.nome.trim()) { toast({ title: 'Campo obrigatorio', description: 'Informe o nome.', variant: 'destructive' }); return; }
    setSavingCategory(true);
    try {
      if (editingCategoryId) {
        const { error } = await supabase.from('categorias').update({ nome: categoryForm.nome.trim(), descricao: categoryForm.descricao.trim() || null, cor: categoryForm.cor }).eq('id', editingCategoryId);
        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Categoria atualizada.' });
      } else {
        const empresaId = (userProfile as any)?.empresa_id;
        if (!empresaId) {
          toast({ title: 'Empresa não identificada', description: 'Faça login novamente.', variant: 'destructive' });
          return;
        }
        const { error } = await supabase.from('categorias').insert({ nome: categoryForm.nome.trim(), descricao: categoryForm.descricao.trim() || null, cor: categoryForm.cor, empresa_id: empresaId });
        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Categoria criada.' });
      }
      setCategoryForm({ ...emptyCF }); setEditingCategoryId(null); setShowCategoryForm(false); await loadCategories();
    } catch (err: any) { toast({ title: 'Erro', description: err.message || 'Erro ao salvar.', variant: 'destructive' }); }
    finally { setSavingCategory(false); }
  };

  const handleEditCategory = (cat: CategoriaDB) => { setCategoryForm({ nome: cat.nome, descricao: cat.descricao || '', cor: cat.cor || 'hsl(var(--primary))' }); setEditingCategoryId(cat.id); setShowCategoryForm(true); };
  const handleDeleteCategory = async (cat: CategoriaDB) => {
    if (!window.confirm(`Excluir "${cat.nome}"?`)) return;
    try { const { error } = await supabase.from('categorias').delete().eq('id', cat.id); if (error) throw error; toast({ title: 'Sucesso', description: 'Categoria excluida!' }); await loadCategories(); }
    catch { toast({ title: 'Erro', description: 'Erro ao excluir.', variant: 'destructive' }); }
  };

  const openNewCourse = () => { setCourseForm({ ...emptyCoF }); setEditingCourseId(null); setShowCourseDialog(true); };
  const openEditCourse = (course: Course) => {
    setCourseForm({ nome: course.nome, descricao: course.descricao || '', categoria: course.categoria, categoria_id: course.categoria_id || '', status: course.status, ordem: course.ordem || 0, manualCategory: !categoriesDB.some(c => c.id === course.categoria_id) });
    setEditingCourseId(course.id); setShowCourseDialog(true);
  };
  const handleSaveCourse = async () => {
    if (!courseForm.nome.trim()) { toast({ title: 'Campo obrigatório', description: 'Informe o nome.', variant: 'destructive' }); return; }
    if (!courseForm.categoria.trim()) { toast({ title: 'Campo obrigatório', description: 'Informe a categoria.', variant: 'destructive' }); return; }
    if (!editingCourseId && !(userProfile as any)?.empresa_id) {
      toast({ title: 'Empresa não identificada', description: 'Faça login novamente.', variant: 'destructive' });
      return;
    }
    setSavingCourse(true);
    try {
      const payload: any = { nome: courseForm.nome.trim(), descricao: courseForm.descricao.trim() || null, categoria: courseForm.categoria.trim(), categoria_id: courseForm.categoria_id || null, status: courseForm.status, ordem: courseForm.ordem || null };
      if (editingCourseId) { const { error } = await supabase.from('cursos').update(payload).eq('id', editingCourseId); if (error) throw error; toast({ title: 'Sucesso', description: 'Curso atualizado.' }); }
      else {
        payload.empresa_id = (userProfile as any).empresa_id;
        const { error } = await supabase.from('cursos').insert(payload);
        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Curso criado.' });
      }
      setShowCourseDialog(false); setCourseForm({ ...emptyCoF }); setEditingCourseId(null); refetch();
    } catch (err: any) { toast({ title: 'Erro', description: err.message || 'Erro ao salvar.', variant: 'destructive' }); }
    finally { setSavingCourse(false); }
  };
  const handleDeleteCourse = async (course: Course) => {
    if (!window.confirm(`Excluir "${course.nome}"?`)) return;
    try { const { error } = await supabase.from('cursos').delete().eq('id', course.id); if (error) throw error; toast({ title: 'Sucesso', description: 'Curso excluido!' }); refetch(); }
    catch { toast({ title: 'Erro', description: 'Erro ao excluir.', variant: 'destructive' }); }
  };

  if (isLoading) return (
    <ERALayout>
      <div className="flex items-center justify-center bg-pana-bg" style={{ minHeight: '60vh' }}>
        <PanaLoader label="Carregando treinamentos..." />
      </div>
    </ERALayout>
  );
  if (error) return (
    <ERALayout>
      <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <BookOpen className="h-10 w-10 mx-auto mb-3 text-destructive" />
          <p className="text-sm text-destructive">Erro ao carregar treinamentos.</p>
        </div>
      </div>
    </ERALayout>
  );


  return (
    <ERALayout>
      {showUpload && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <VideoUpload onClose={() => setShowUpload(false)} onSuccess={() => { loadVideos(); refetch(); setShowUpload(false); }} />
        </div>
      )}
      
      {showVideoModal && selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="bg-background border border-border rounded-2xl p-6 max-w-3xl w-full relative">
            <button className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 transition-colors"
              onClick={() => { setShowVideoModal(false); setSelectedVideo(null); }}>x</button>
            <h2 className="text-lg font-bold text-foreground mb-4 pr-10">{selectedVideo.titulo}</h2>
            <video src={selectedVideo.url_video ?? undefined} controls className="w-full rounded-xl bg-black" />
          </div>
        </div>
      )}

      <div className="min-h-screen bg-pana-bg pb-10 font-inter">

        {/* Header de marca — sóbrio, sólido indigo */}
        <motion.header
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full rounded-2xl mb-6 lg:mb-8 overflow-hidden bg-pana-indigo"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 rounded-full opacity-[0.07] bg-pana-teal" />
          <div className="pointer-events-none absolute right-24 -bottom-24 w-72 h-72 rounded-full opacity-[0.05] bg-pana-grape" />

          <div className="relative px-6 lg:px-10 py-8 lg:py-10">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">

              <motion.div
                className="flex-1"
                initial="hidden" animate="visible"
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
              >
                <motion.div
                  variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22,1,0.36,1] } } }}
                  className="flex items-center gap-2 mb-3"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-pana-teal" />
                  <span className="text-[11px] font-medium uppercase tracking-[0.07em] text-pana-bone/80">
                    Plataforma de ensino
                  </span>
                </motion.div>
                <motion.h1
                  variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22,1,0.36,1] } } }}
                  className="font-quicksand font-bold text-3xl lg:text-4xl text-white mb-2"
                >
                  Treinamentos
                </motion.h1>
                <motion.p
                  variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22,1,0.36,1] } } }}
                  className="text-sm text-pana-bone/80 max-w-xl mb-4"
                >
                  Cursos estruturados em trilhas de aprendizado, do básico ao avançado, com certificação.
                </motion.p>
                <motion.div
                  variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
                  className="flex flex-wrap items-center gap-4"
                >
                  {[
                    { icon: BookOpen, label: `${allFilteredCourses.length} cursos` },
                    { icon: Clock, label: '50+ horas' },
                    { icon: Users, label: '1.000+ alunos' },
                    { icon: Award, label: 'Certificados' }
                  ].map(({ icon: Icon, label }) => (
                    <motion.div
                      key={label}
                      variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
                      className="flex items-center gap-2 text-xs lg:text-sm text-pana-bone/80"
                    >
                      <Icon className="h-4 w-4 text-pana-bone" />
                      <span>{label}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col gap-3 w-full sm:w-auto"
              >
                <motion.div
                  initial="hidden" animate="visible"
                  variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
                  className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar"
                >
                  {[
                    { value: courses.length, label: 'Cursos' },
                    { value: categories.length, label: 'Categorias' },
                    { value: isAdmin ? videos.length : '50+', label: isAdmin ? 'Vídeos' : 'Horas' }
                  ].map(({ value, label }) => (
                    <motion.div key={label}
                      variants={{ hidden: { opacity: 0, scale: 0.92 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } } }}
                      className="flex flex-col items-center justify-center rounded-lg px-4 py-2.5 text-center min-w-[78px] bg-white/[0.08] border border-white/10">
                      <span className="font-quicksand font-bold text-lg text-white leading-tight">{value}</span>
                      <span className="text-[10px] text-pana-bone/70 uppercase tracking-wider font-medium mt-0.5">{label}</span>
                    </motion.div>
                  ))}
                </motion.div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowUpload(true)}
                      className="flex-1 py-2.5 px-4 text-sm text-white font-medium rounded-lg flex items-center justify-center transition-colors bg-pana-teal hover:bg-pana-teal-dark"
                    >
                      <Settings className="w-4 h-4 mr-2" /> Novo treinamento
                    </button>
                    <button
                      onClick={() => { setShowCategoryDialog(true); loadCategories(); }}
                      className="px-3 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors"
                    >
                      <Tag className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate('/admin/gerenciar-ordem-videos')}
                      className="px-3 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors"
                    >
                      <ListOrdered className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </motion.div>

            </div>
          </div>
        </motion.header>

        <div className="max-w-7xl mx-auto px-4 lg:px-6 space-y-6">
          {/* SAAS FILTER HEADER */}
          <div className="bg-background/60 backdrop-blur-md rounded-2xl shadow-sm border border-border p-4 mb-6">
            <div className="flex flex-col gap-4">
              <div className="relative w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input 
                  className="w-full bg-background/50 border border-border text-foreground rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all shadow-sm"
                  placeholder="Buscar treinamentos..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                />
              </div>
              
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide hide-scrollbar w-full">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`relative px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors z-10 ${selectedCategory === 'all' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                >
                  {selectedCategory === 'all' && (
                    <motion.div layoutId="activeChip" className="absolute inset-0 bg-primary rounded-full -z-10" transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                  )}
                  Tudo
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`relative px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors z-10 ${selectedCategory === cat ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                  >
                    {selectedCategory === cat && (
                      <motion.div layoutId="activeChip" className="absolute inset-0 bg-primary rounded-full -z-10" transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                    )}
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* VIDEOS ADMIN */}
          {isAdmin && (
            <div className="bg-card rounded-xl shadow-sm overflow-hidden border border-border flex flex-col">
              <div className="px-5 py-4 flex items-center justify-between border-b border-pana-grape/10 bg-pana-grape-muted/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white shadow-sm">
                    <Video className="h-4 w-4 text-pana-grape" />
                  </div>
                  <div>
                    <h3 className="font-quicksand font-semibold text-foreground">Vídeos importados</h3>
                    <p className="text-xs text-muted-foreground">Gerencie os vídeos de treinamento</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  {videos.length} vídeos
                </span>
              </div>
              <div className="p-5">
                {loadingVideos ? (
                  <div className="flex justify-center py-6">
                    <PanaLoader />
                  </div>
                ) : videos.length === 0 ? (
                  <div className="text-center py-8">
                    <Video className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhum vídeo importado ainda.</p>
                  </div>
                ) : (
                  <div className="max-h-[240px] overflow-y-auto space-y-2 pr-2">
                    {videos.map(video => (
                      <div key={video.id} className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border hover:bg-muted/50 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
                          <Play className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ml-0.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{video.titulo}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{video.duracao} min</span>
                            <span>{new Date(video.data_criacao).toLocaleDateString('pt-BR')}</span>
                            {video.cursos && <span className="text-indigo-600 dark:text-indigo-400 font-medium">{video.cursos.nome}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setSelectedVideo(video); setShowVideoModal(true); }} className="w-8 h-8 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors">
                            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <button onClick={() => handleDeleteVideo(video)} disabled={deletingVideoId === video.id} className="w-8 h-8 rounded-md border border-red-200 dark:border-red-900/50 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            {deletingVideoId === video.id ? <Loader2 className="w-3.5 h-3.5 text-red-500 animate-spin" /> : <Trash className="w-3.5 h-3.5 text-red-500" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* COURSES */}
          {allFilteredCourses.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-xl border border-border">
              <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="font-medium text-foreground">Nenhum curso encontrado.</p>
              <p className="text-sm text-muted-foreground mt-1">Tente ajustar os filtros.</p>
            </div>
          ) : selectedCategory === 'all' ? (
            <motion.div 
              initial="hidden" animate="visible"
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
              className="flex flex-col gap-10"
            >
              {catGroups.map(group => (
                <motion.div 
                  key={group.categoria} 
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}
                  className="flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary border border-primary/20">
                        <CatIcon cat={group.categoria} size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-foreground tracking-tight">{group.categoria}</h3>
                        <p className="text-xs text-muted-foreground font-medium">{group.cursos.length} treinamento{group.cursos.length !== 1 ? 's' : ''} • {group.totalHoras}+ horas</p>
                      </div>
                    </div>
                    <button onClick={() => { setSelectedCategory(group.categoria); setSearchTerm(''); }} className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 hidden sm:flex">
                      Ver todos <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex overflow-x-auto pb-6 pt-2 px-1 -mx-1 gap-5 snap-x snap-mandatory scrollbar-hide hide-scrollbar w-full">
                    {group.cursos.map(c => (
                      <motion.div
                        key={c.id}
                        whileHover={{ scale: 1.03, y: -4 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="snap-start flex-shrink-0 w-[280px] sm:w-[320px] relative group"
                      >
                        <div className="h-full rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300">
                          <CourseCard course={c as unknown as Course} onStartCourse={handleStartCourse} />
                        </div>
                        {isAdmin && (
                          <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="w-8 h-8 rounded-lg bg-background/90 backdrop-blur-md border border-border shadow-md flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors">
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40 rounded-xl">
                                <DropdownMenuItem onClick={() => openEditCourse(c as Course)} className="rounded-lg"><Edit className="w-3.5 h-3.5 mr-2" />Editar</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteCourse(c as Course)} className="text-red-500 focus:bg-red-50 dark:focus:bg-red-900/20 rounded-lg"><Trash className="w-3.5 h-3.5 mr-2" />Excluir</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </motion.div>
                    ))}
                    {isAdmin && (
                      <div className="snap-start flex-shrink-0 w-[280px] sm:w-[320px] pb-2">
                        <div onClick={openNewCourse} className="h-full bg-card border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group min-h-[240px]">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors group-hover:scale-110 duration-300">
                            <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <p className="font-bold text-foreground mb-1 group-hover:text-primary transition-colors">Adicionar treinamento</p>
                          <span className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-sm mt-2">
                            Criar Novo
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                    <CatIcon cat={selectedCategory} size={24} />
                  </div>
                  <div>
                    <h2 className="font-bold text-2xl text-foreground leading-tight">{selectedCategory}</h2>
                    <p className="text-sm font-medium text-muted-foreground">{allFilteredCourses.length} treinamento{allFilteredCourses.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  {isAdmin && (
                    <button onClick={openNewCourse} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-md">
                      <Plus className="w-4 h-4" /> Novo Curso
                    </button>
                  )}
                  <button onClick={() => { setSelectedCategory('all'); setSearchTerm(''); }} className="px-5 py-2.5 rounded-xl border border-border text-foreground text-sm font-bold flex items-center gap-2 hover:bg-muted transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Voltar
                  </button>
                </div>
              </div>
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                initial="hidden" animate="visible"
                variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
              >
                {allFilteredCourses.map(c => (
                  <motion.div 
                    key={c.id} 
                    className="relative group"
                    variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } }}
                    whileHover={{ y: -6 }}
                  >
                    <div className="h-full rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300">
                      <CourseCard course={c as unknown as Course} onStartCourse={handleStartCourse} />
                    </div>
                    {isAdmin && (
                      <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="w-8 h-8 rounded-lg bg-background/90 backdrop-blur-md border border-border shadow-md flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 rounded-xl">
                            <DropdownMenuItem onClick={() => openEditCourse(c as Course)} className="rounded-lg"><Edit className="w-3.5 h-3.5 mr-2" />Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteCourse(c as Course)} className="text-red-500 focus:bg-red-50 dark:focus:bg-red-900/20 rounded-lg"><Trash className="w-3.5 h-3.5 mr-2" />Excluir</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>

      {/* DIALOG CATEGORIAS */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Tag className="w-4 h-4 text-primary" />
              </div>
              Gerenciar Categorias
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            {loadingCategories ? (
              <div className="flex justify-center py-6"><PanaLoader /></div>
            ) : categoriesDB.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma categoria cadastrada.</p>
              </div>
            ) : (
              categoriesDB.map(cat => (
                <div key={cat.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                  <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ background: cat.cor || 'hsl(var(--primary))' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{cat.nome}</p>
                    {cat.descricao && <p className="text-xs text-muted-foreground truncate">{cat.descricao}</p>}
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => handleEditCategory(cat)} className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors"><Edit className="w-3 h-3 text-muted-foreground" /></button>
                    <button onClick={() => handleDeleteCategory(cat)} className="w-7 h-7 rounded-md border border-red-200 dark:border-red-900/50 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash className="w-3 h-3 text-red-500" /></button>
                  </div>
                </div>
              ))
            )}
            
            {!showCategoryForm ? (
              <button onClick={() => { setCategoryForm({ ...emptyCF }); setEditingCategoryId(null); setShowCategoryForm(true); }} className="w-full py-2.5 rounded-xl border-2 border-dashed border-border text-primary text-sm font-semibold flex items-center justify-center gap-2 hover:bg-muted transition-colors mt-2">
                <Plus className="w-4 h-4" /> Nova Categoria
              </button>
            ) : (
              <div className="p-4 rounded-xl border border-border bg-muted/30 flex flex-col gap-3 mt-2">
                <p className="text-sm font-bold text-foreground">{editingCategoryId ? 'Editar Categoria' : 'Nova Categoria'}</p>
                <div>
                  <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1.5 block">Nome *</label>
                  <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" value={categoryForm.nome} onChange={e => setCategoryForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: PABX..." />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1.5 block">Descrição</label>
                  <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" value={categoryForm.descricao} onChange={e => setCategoryForm(p => ({ ...p, descricao: e.target.value }))} placeholder="Opcional" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1.5 block">Cor</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={categoryForm.cor} onChange={e => setCategoryForm(p => ({ ...p, cor: e.target.value }))} className="w-9 h-9 rounded-md border border-border cursor-pointer p-0.5 bg-background" />
                    <div className="flex gap-1 flex-wrap">
                      {CAT_COLORS.map(col => (
                        <button key={col} onClick={() => setCategoryForm(p => ({ ...p, cor: col }))} className={`w-7 h-7 rounded-md border-2 ${categoryForm.cor === col ? 'border-foreground' : 'border-transparent'}`} style={{ background: col }} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={handleSaveCategory} disabled={savingCategory} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-70 transition-colors">
                    {savingCategory ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Salvando...</> : 'Salvar'}
                  </button>
                  <button onClick={() => { setShowCategoryForm(false); setEditingCategoryId(null); }} className="py-2 px-4 rounded-lg border border-border text-sm font-semibold hover:bg-muted transition-colors">Cancelar</button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG CURSO */}
      <Dialog open={showCourseDialog} onOpenChange={setShowCourseDialog}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="w-4 h-4 text-primary" />
              </div>
              {editingCourseId ? 'Editar Curso' : 'Novo Curso'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <div>
              <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1.5 block">Nome *</label>
              <input className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" value={courseForm.nome} onChange={e => setCourseForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Fundamentos de PABX" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1.5 block">Descrição</label>
              <textarea className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" rows={3} value={courseForm.descricao} onChange={e => setCourseForm(p => ({ ...p, descricao: e.target.value }))} placeholder="Descrição..." />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1.5 block">Categoria</label>
              {!courseForm.manualCategory ? (
                <Select value={courseForm.categoria_id || 'manual'} onValueChange={(val) => { if (val === 'manual') { setCourseForm(p => ({ ...p, manualCategory: true, categoria_id: '', categoria: '' })); } else { const cat = categoriesDB.find(c => c.id === val); setCourseForm(p => ({ ...p, categoria_id: val, categoria: cat?.nome || '' })); } }}>
                  <SelectTrigger className="w-full bg-background border border-border rounded-lg">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesDB.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: cat.cor || 'hsl(var(--primary))' }} />
                          {cat.nome}
                        </div>
                      </SelectItem>
                    ))}
                    <SelectItem value="manual">Digitar manualmente</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex gap-2">
                  <input className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" value={courseForm.categoria} onChange={e => setCourseForm(p => ({ ...p, categoria: e.target.value }))} placeholder="Digite a categoria" />
                  <button onClick={() => setCourseForm(p => ({ ...p, manualCategory: false }))} className="px-3 py-2 rounded-lg border border-border text-xs font-semibold hover:bg-muted transition-colors whitespace-nowrap">Usar lista</button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1.5 block">Status</label>
                <Select value={courseForm.status} onValueChange={(val: 'ativo' | 'inativo' | 'em_breve') => setCourseForm(p => ({ ...p, status: val }))}>
                  <SelectTrigger className="w-full bg-background border border-border rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="em_breve">Em breve</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1.5 block">Ordem</label>
                <input type="number" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" value={courseForm.ordem} onChange={e => setCourseForm(p => ({ ...p, ordem: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={handleSaveCourse} disabled={savingCourse} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-70 transition-colors">
                {savingCourse ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Salvando...</> : editingCourseId ? 'Salvar alterações' : 'Criar curso'}
              </button>
              <button onClick={() => setShowCourseDialog(false)} className="py-2 px-4 rounded-lg border border-border text-sm font-semibold hover:bg-muted transition-colors">Cancelar</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ERALayout>
  );
};

export default Treinamentos;
