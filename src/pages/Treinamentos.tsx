import { ERALayout } from '@/components/ERALayout';
import { CourseCard } from '@/components/CourseCard';
import { VideoUpload } from '@/components/VideoUpload';
import { useCourses } from '@/hooks/useCourses';
import type { Course } from '@/hooks/useCourses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Search, Filter, Plus, Video, Eye, BookOpen, Clock,
  Users, TrendingUp, Settings, ListOrdered, ArrowLeft,
  Play, Trash, ChevronRight, GraduationCap, Award, Zap,
  Edit, Loader2, MoreVertical, Tag, Palette
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import type { Database } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';

type VideoRow = Database['public']['Tables']['videos']['Row'] & {
  cursos?: { id: string; nome: string; categoria: string } | null;
};

interface CategoryGroup {
  categoria: string;
  cursos: Course[];
  totalHoras: number;
  niveis: string[];
  cursosAtivos: number;
}

interface CategoriaDB {
  id: string;
  nome: string;
  descricao: string | null;
  cor: string | null;
}

interface CategoryForm {
  nome: string;
  descricao: string;
  cor: string;
}

interface CourseForm {
  nome: string;
  descricao: string;
  categoria: string;
  categoria_id: string;
  status: 'ativo' | 'inativo' | 'em_breve';
  ordem: number;
  manualCategory: boolean;
}

// ─── Paleta por categoria ────────────────────────────────────────────────────
const CAT_STYLE: Record<string, { accent: string; bg: string; text: string }> = {
  PABX:        { accent: '#3B82F6', bg: '#EFF6FF', text: '#1D4ED8' },
  CALLCENTER:  { accent: '#8B5CF6', bg: '#F5F3FF', text: '#6D28D9' },
  OMNICHANNEL: { accent: '#3AB26A', bg: '#ECFDF5', text: '#065F46' },
  VoIP:        { accent: '#F97316', bg: '#FFF7ED', text: '#C2410C' },
  DEFAULT:     { accent: '#6366F1', bg: '#EEF2FF', text: '#4338CA' },
};
const getCatStyle = (cat: string) => CAT_STYLE[cat] ?? CAT_STYLE.DEFAULT;

const LEVEL_STYLE: Record<string, { bg: string; text: string }> = {
  'Iniciante':    { bg: '#ECFDF5', text: '#065F46' },
  'Intermediário':{ bg: '#FFFBEB', text: '#92400E' },
  'Avançado':     { bg: '#FFF1F2', text: '#9F1239' },
};

const COURSES_MOCK = [
  { nome: 'Fundamentos de PABX',         categoria: 'PABX',        level: 'Iniciante',     duration: '2–3h', modules: 5 },
  { nome: 'Fundamentos CALLCENTER',       categoria: 'CALLCENTER',  level: 'Iniciante',     duration: '2–3h', modules: 4 },
  { nome: 'Configurações Avançadas PABX', categoria: 'PABX',        level: 'Avançado',      duration: '3–4h', modules: 6 },
  { nome: 'OMNICHANNEL para Empresas',    categoria: 'OMNICHANNEL', level: 'Intermediário', duration: '4–5h', modules: 8 },
  { nome: 'Configurações Avançadas OMNI', categoria: 'OMNICHANNEL', level: 'Avançado',      duration: '5–6h', modules: 10 },
];

const CATEGORY_COLORS = ['#3B82F6','#8B5CF6','#3AB26A','#F97316','#EF4444','#06B6D4','#F59E0B','#EC4899'];

// ─── Ícone por categoria ─────────────────────────────────────────────────────
const CatIcon = ({ cat, size = 20 }: { cat: string; size?: number }) => {
  const c = getCatStyle(cat).accent;
  if (cat === 'PABX' || cat === 'VoIP')
    return <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><path d="M3 4a1 1 0 011-1h3l1.5 3.5L7 8s1 2 5 5l1.5-1.5L17 13v3a1 1 0 01-1 1C7 17 3 10 3 4z" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/></svg>;
  if (cat === 'CALLCENTER')
    return <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><path d="M10 2a6 6 0 016 6v2a2 2 0 01-2 2H6a2 2 0 01-2-2V8a6 6 0 016-6z" stroke={c} strokeWidth="1.5"/><path d="M7 18h6M10 14v4" stroke={c} strokeWidth="1.5" strokeLinecap="round"/></svg>;
  if (cat === 'OMNICHANNEL')
    return <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke={c} strokeWidth="1.5"/><path d="M3 10h14M10 3c-2 3-2 11 0 14M10 3c2 3 2 11 0 14" stroke={c} strokeWidth="1.5"/></svg>;
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="2" stroke={c} strokeWidth="1.5"/><path d="M7 10h6M10 7v6" stroke={c} strokeWidth="1.5" strokeLinecap="round"/></svg>;
};

// ─── Empty form defaults ─────────────────────────────────────────────────────
const emptyCategoryForm: CategoryForm = { nome: '', descricao: '', cor: '#3B82F6' };
const emptyCourseForm: CourseForm = { nome: '', descricao: '', categoria: '', categoria_id: '', status: 'ativo', ordem: 0, manualCategory: false };

// ─── Componente principal ────────────────────────────────────────────────────
const Treinamentos = () => {
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

  // ─── Category management state ───────────────────────────────────────────
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [categoriesDB, setCategoriesDB] = useState<CategoriaDB[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>({ ...emptyCategoryForm });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  // ─── Course management state ─────────────────────────────────────────────
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [courseForm, setCourseForm] = useState<CourseForm>({ ...emptyCourseForm });
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [savingCourse, setSavingCourse] = useState(false);

  useEffect(() => { if (userProfile) loadVideos(); }, [userProfile]);
  useEffect(() => { if (isAdmin) loadCategories(); }, [isAdmin]);

  // ─── Existing functions ──────────────────────────────────────────────────
  const loadVideos = async () => {
    setLoadingVideos(true);
    try {
      const { data: videosData, error: vErr } = await supabase
        .from('videos').select('*').order('data_criacao', { ascending: false });
      if (vErr) throw vErr;
      if (videosData && videosData.length > 0) {
        const cursoIds = [...new Set(videosData.map(v => v.curso_id).filter(Boolean))];
        if (cursoIds.length > 0) {
          const { data: cursosData } = await supabase.from('cursos').select('id, nome, categoria').in('id', cursoIds);
          setVideos(videosData.map(v => ({ ...v, cursos: cursosData?.find(c => c.id === v.curso_id) || null })));
          return;
        }
      }
      setVideos(videosData || []);
    } catch { /* silencioso */ }
    finally { setLoadingVideos(false); }
  };

  // Lista mesclada: real + mock
  const mergedNames = COURSES_MOCK.map(m => m.nome);
  const filteredCourses = mergedNames
    .map(nome => courses.find(c => c.nome === nome) ?? { ...COURSES_MOCK.find(m => m.nome === nome)!, id: `mock-${nome.replace(/\s+/g, '-').toLowerCase()}`, status: 'ativo' as const, imagem_url: null, categoria_id: null, ordem: null, descricao: null })
    .filter(c => {
      const s = searchTerm.toLowerCase();
      return (c.nome.toLowerCase().includes(s) || c.categoria.toLowerCase().includes(s)) &&
        (selectedCategory === 'all' || c.categoria === selectedCategory);
    });

  // Include real courses that aren't in the mock list
  const realOnlyCourses = courses.filter(c => !mergedNames.includes(c.nome)).filter(c => {
    const s = searchTerm.toLowerCase();
    return (c.nome.toLowerCase().includes(s) || c.categoria.toLowerCase().includes(s)) &&
      (selectedCategory === 'all' || c.categoria === selectedCategory);
  });
  const allFilteredCourses = [...filteredCourses, ...realOnlyCourses];

  const getLevel = (c: any) => COURSES_MOCK.find(m => m.nome === c.nome)?.level ?? 'Iniciante';

  const categories = Array.from(new Set(courses.map(c => c.categoria)));

  const getCoursesByCategory = (): CategoryGroup[] => {
    const map: Record<string, CategoryGroup> = {};
    allFilteredCourses.forEach(c => {
      if (!map[c.categoria]) map[c.categoria] = { categoria: c.categoria, cursos: [], totalHoras: 0, niveis: [], cursosAtivos: 0 };
      map[c.categoria].cursos.push(c as Course);
      const lvl = getLevel(c);
      const h = lvl === 'Avançado' ? 5 : lvl === 'Intermediário' ? 4 : 2;
      map[c.categoria].totalHoras += h;
      if (!map[c.categoria].niveis.includes(lvl)) map[c.categoria].niveis.push(lvl);
      if (c.status === 'ativo') map[c.categoria].cursosAtivos++;
    });
    return Object.values(map).sort((a, b) => b.cursos.length - a.cursos.length);
  };

  const handleStartCourse = (courseId: string) => {
    if (courseId.startsWith('mock-')) {
      toast({ title: 'Curso em breve', description: 'Este curso ainda não está disponível.', variant: 'destructive' });
      return;
    }
    if (!courseId) { toast({ title: 'Erro', description: 'ID inválido.', variant: 'destructive' }); return; }
    navigate(`/curso/${courseId}`);
  };

  const handleDeleteVideo = async (video: VideoRow) => {
    if (!window.confirm('Tem certeza que deseja deletar este vídeo?')) return;
    setDeletingVideoId(video.id);
    try {
      if (video.storage_path) await supabase.storage.from('training-videos').remove([video.storage_path]);
      const { error: dbErr } = await supabase.from('videos').delete().eq('id', video.id);
      if (dbErr) throw dbErr;
      setVideos(prev => prev.filter(v => v.id !== video.id));
      toast({ title: 'Sucesso', description: 'Vídeo deletado!' });
    } catch {
      toast({ title: 'Erro', description: 'Erro ao deletar vídeo.', variant: 'destructive' });
    } finally { setDeletingVideoId(null); }
  };

  // ─── Category CRUD ───────────────────────────────────────────────────────
  const loadCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const { data, error } = await supabase.from('categorias').select('id, nome, descricao, cor').order('nome');
      if (error) throw error;
      setCategoriesDB(data || []);
    } catch {
      toast({ title: 'Erro', description: 'Erro ao carregar categorias.', variant: 'destructive' });
    } finally { setLoadingCategories(false); }
  }, []);

  const handleSaveCategory = async () => {
    if (!categoryForm.nome.trim()) {
      toast({ title: 'Campo obrigatório', description: 'Informe o nome da categoria.', variant: 'destructive' });
      return;
    }
    setSavingCategory(true);
    try {
      if (editingCategoryId) {
        const { error } = await supabase.from('categorias').update({
          nome: categoryForm.nome.trim(),
          descricao: categoryForm.descricao.trim() || null,
          cor: categoryForm.cor,
        }).eq('id', editingCategoryId);
        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Categoria atualizada!' });
      } else {
        const { error } = await supabase.from('categorias').insert({
          nome: categoryForm.nome.trim(),
          descricao: categoryForm.descricao.trim() || null,
          cor: categoryForm.cor,
        });
        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Categoria criada!' });
      }
      setCategoryForm({ ...emptyCategoryForm });
      setEditingCategoryId(null);
      setShowCategoryForm(false);
      await loadCategories();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Erro ao salvar categoria.', variant: 'destructive' });
    } finally { setSavingCategory(false); }
  };

  const handleEditCategory = (cat: CategoriaDB) => {
    setCategoryForm({ nome: cat.nome, descricao: cat.descricao || '', cor: cat.cor || '#3B82F6' });
    setEditingCategoryId(cat.id);
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = async (cat: CategoriaDB) => {
    if (!window.confirm(`Excluir a categoria "${cat.nome}"? Cursos vinculados terão a categoria removida.`)) return;
    try {
      const { error } = await supabase.from('categorias').delete().eq('id', cat.id);
      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Categoria excluída!' });
      await loadCategories();
    } catch {
      toast({ title: 'Erro', description: 'Erro ao excluir categoria.', variant: 'destructive' });
    }
  };

  // ─── Course CRUD ─────────────────────────────────────────────────────────
  const openNewCourseDialog = () => {
    setCourseForm({ ...emptyCourseForm });
    setEditingCourseId(null);
    setShowCourseDialog(true);
  };

  const openEditCourseDialog = (course: Course) => {
    setCourseForm({
      nome: course.nome,
      descricao: course.descricao || '',
      categoria: course.categoria,
      categoria_id: course.categoria_id || '',
      status: course.status,
      ordem: course.ordem || 0,
      manualCategory: !categoriesDB.some(c => c.id === course.categoria_id),
    });
    setEditingCourseId(course.id);
    setShowCourseDialog(true);
  };

  const handleSaveCourse = async () => {
    if (!courseForm.nome.trim()) {
      toast({ title: 'Campo obrigatório', description: 'Informe o nome do curso.', variant: 'destructive' });
      return;
    }
    if (!courseForm.categoria.trim()) {
      toast({ title: 'Campo obrigatório', description: 'Informe a categoria.', variant: 'destructive' });
      return;
    }
    setSavingCourse(true);
    try {
      const payload = {
        nome: courseForm.nome.trim(),
        descricao: courseForm.descricao.trim() || null,
        categoria: courseForm.categoria.trim(),
        categoria_id: courseForm.categoria_id || null,
        status: courseForm.status,
        ordem: courseForm.ordem || null,
      };

      if (editingCourseId) {
        const { error } = await supabase.from('cursos').update(payload).eq('id', editingCourseId);
        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Curso atualizado!' });
      } else {
        const { error } = await supabase.from('cursos').insert(payload);
        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Curso criado!' });
      }
      setShowCourseDialog(false);
      setCourseForm({ ...emptyCourseForm });
      setEditingCourseId(null);
      refetch();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Erro ao salvar curso.', variant: 'destructive' });
    } finally { setSavingCourse(false); }
  };

  const handleDeleteCourse = async (course: Course) => {
    if (!window.confirm(`Excluir o curso "${course.nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      const { error } = await supabase.from('cursos').delete().eq('id', course.id);
      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Curso excluído!' });
      refetch();
    } catch {
      toast({ title: 'Erro', description: 'Erro ao excluir curso.', variant: 'destructive' });
    }
  };

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (isLoading) return (
    <ERALayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{borderColor:'#3AB26A',borderTopColor:'transparent'}}/>
          <p className="text-sm text-slate-500">Carregando treinamentos...</p>
        </div>
      </div>
    </ERALayout>
  );

  if (error) return (
    <ERALayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <BookOpen className="h-10 w-10 mx-auto" style={{color:'#ef4444'}}/>
          <p className="text-sm text-red-500">Erro ao carregar treinamentos.</p>
        </div>
      </div>
    </ERALayout>
  );

  const catGroups = getCoursesByCategory();

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <ERALayout>
      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <VideoUpload onClose={() => setShowUpload(false)} onSuccess={() => { loadVideos(); refetch(); setShowUpload(false); }}/>
        </div>
      )}

      {/* Video preview modal */}
      {showVideoModal && selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full relative">
            <button className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-lg transition-colors"
              onClick={() => { setShowVideoModal(false); setSelectedVideo(null); }}>×</button>
            <h2 className="text-lg font-semibold mb-4 pr-10" style={{color:'#1E1B4B'}}>{selectedVideo.titulo}</h2>
            <video src={selectedVideo.url_video ?? undefined} controls className="w-full rounded-xl shadow"/>
          </div>
        </div>
      )}

      <div className="min-h-screen" style={{background:'#F8F7FF'}}>

        {/* ══ HERO ══════════════════════════════════════════════════════════ */}
        <div className="rounded-2xl overflow-hidden mb-6 mx-0" style={{background:'linear-gradient(135deg,#1E1B4B 0%,#2D2B6F 60%,#3D3B8F 100%)'}}>
          {/* dot pattern */}
          <div style={{backgroundImage:'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize:'28px 28px', position:'absolute', inset:0, pointerEvents:'none', borderRadius:'inherit'}}/>
          <div className="relative z-10 px-6 py-8 md:px-10 md:py-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{background:'rgba(58,178,106,0.2)',border:'1px solid rgba(58,178,106,0.4)',color:'#7EE8A2'}}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background:'#3AB26A'}}/>
                    Plataforma de Ensino
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">Treinamentos</h1>
                <p className="text-base text-white/70 max-w-lg mb-5">
                  Cursos estruturados em trilhas de aprendizado — do básico ao avançado, com certificação ao final.
                </p>
                <div className="flex flex-wrap gap-6">
                  {[
                    { icon: BookOpen, label: `${allFilteredCourses.length} cursos` },
                    { icon: Clock,    label: '50+ horas' },
                    { icon: Users,    label: '1.000+ alunos' },
                    { icon: Award,    label: 'Certificados' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-1.5 text-sm" style={{color:'rgba(255,255,255,0.6)'}}>
                      <Icon className="h-4 w-4" style={{color:'#3AB26A'}}/>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {isAdmin && (
                <div className="flex gap-2 flex-shrink-0 flex-wrap">
                  <Button onClick={() => setShowUpload(true)}
                    className="text-white font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-200 hover:scale-105"
                    style={{background:'#3AB26A',border:'none'}}>
                    <Settings className="h-4 w-4"/>
                    Novo treinamento
                  </Button>
                  <Button onClick={() => { setShowCategoryDialog(true); loadCategories(); }} variant="outline"
                    className="font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-200 hover:scale-105"
                    style={{borderColor:'rgba(255,255,255,0.3)',color:'#fff',background:'rgba(255,255,255,0.08)'}}>
                    <Tag className="h-4 w-4"/>
                    Gerenciar Categorias
                  </Button>
                  <Button onClick={() => navigate('/admin/gerenciar-ordem-videos')} variant="outline"
                    className="font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-200 hover:scale-105"
                    style={{borderColor:'rgba(255,255,255,0.3)',color:'#fff',background:'rgba(255,255,255,0.08)'}}>
                    <ListOrdered className="h-4 w-4"/>
                    Gerenciar ordem
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Stats bar */}
          <div style={{borderTop:'1px solid rgba(255,255,255,0.1)'}} className="px-6 md:px-10 py-4 grid grid-cols-3 gap-4">
            {[
              { value: courses.length,    label: 'Cursos disponíveis' },
              { value: categories.length, label: 'Categorias' },
              { value: isAdmin ? videos.length : '50+', label: isAdmin ? 'Vídeos importados' : 'Horas de conteúdo' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-black text-white">{value}</div>
                <div className="text-xs mt-0.5" style={{color:'rgba(255,255,255,0.45)'}}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="pb-10 space-y-5">

          {/* ══ FILTROS ═══════════════════════════════════════════════════════ */}
          <div className="bg-white rounded-2xl border p-4" style={{borderColor:'#E5E7EB',boxShadow:'0 2px 12px rgba(45,43,111,0.06)'}}>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{color:'#9CA3AF'}}/>
                <Input placeholder="Pesquisar cursos..."
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 rounded-xl border-slate-200 focus:ring-2 text-sm"
                  style={{'--tw-ring-color':'rgba(58,178,106,0.25)'} as any}/>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-52 rounded-xl border-slate-200 text-sm">
                  <Filter className="h-4 w-4 mr-2" style={{color:'#9CA3AF'}}/>
                  <SelectValue placeholder="Categoria"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ══ VÍDEOS ADMIN ══════════════════════════════════════════════════ */}
          {isAdmin && (
            <div className="bg-white rounded-2xl border overflow-hidden" style={{borderColor:'#E5E7EB',boxShadow:'0 2px 12px rgba(45,43,111,0.06)'}}>
              {/* header */}
              <div className="flex items-center justify-between px-5 py-4" style={{borderBottom:'1px solid #F3F4F6'}}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:'rgba(45,43,111,0.08)'}}>
                    <Video className="h-4 w-4" style={{color:'#2D2B6F'}}/>
                  </div>
                  <div>
                    <p className="text-sm font-700 font-semibold" style={{color:'#1E1B4B'}}>Vídeos importados</p>
                    <p className="text-xs" style={{color:'#9CA3AF'}}>Gerencie os vídeos de treinamento</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{background:'rgba(45,43,111,0.08)',color:'#2D2B6F'}}>
                  {videos.length} vídeos
                </span>
              </div>

              <div className="p-4">
                {loadingVideos ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{borderColor:'#3AB26A',borderTopColor:'transparent'}}/>
                  </div>
                ) : videos.length === 0 ? (
                  <div className="text-center py-10">
                    <Video className="h-8 w-8 mx-auto mb-2" style={{color:'#D1D5DB'}}/>
                    <p className="text-sm" style={{color:'#9CA3AF'}}>Nenhum vídeo importado ainda.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {videos.map(video => (
                      <div key={video.id} className="flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 hover:shadow-sm"
                        style={{background:'#FAFAFA',borderColor:'#F3F4F6'}}>
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:'rgba(58,178,106,0.1)'}}>
                          <Play className="h-4 w-4" style={{color:'#3AB26A'}}/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{color:'#1E1B4B'}}>{video.titulo}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs" style={{color:'#9CA3AF'}}>{video.duracao} min</span>
                            <span className="text-xs" style={{color:'#D1D5DB'}}>·</span>
                            <span className="text-xs" style={{color:'#9CA3AF'}}>{new Date(video.data_criacao).toLocaleDateString('pt-BR')}</span>
                            {video.cursos && (
                              <>
                                <span className="text-xs" style={{color:'#D1D5DB'}}>·</span>
                                <span className="text-xs font-medium" style={{color:'#3AB26A'}}>{video.cursos.nome}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setSelectedVideo(video); setShowVideoModal(true); }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-slate-100"
                            title="Visualizar">
                            <Eye className="h-3.5 w-3.5" style={{color:'#6B7280'}}/>
                          </button>
                          <button onClick={() => handleDeleteVideo(video)} disabled={deletingVideoId === video.id}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50 disabled:opacity-40"
                            title="Excluir">
                            {deletingVideoId === video.id
                              ? <div className="w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin" style={{borderColor:'#ef4444',borderTopColor:'transparent'}}/>
                              : <Trash className="h-3.5 w-3.5 text-red-400"/>
                            }
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ CATEGORIAS (vista agrupada) ════════════════════════════════════ */}
          {allFilteredCourses.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border" style={{borderColor:'#E5E7EB'}}>
              <BookOpen className="h-10 w-10 mx-auto mb-3" style={{color:'#D1D5DB'}}/>
              <p className="font-medium" style={{color:'#6B7280'}}>Nenhum curso encontrado.</p>
              <p className="text-sm mt-1" style={{color:'#9CA3AF'}}>Tente ajustar os filtros de pesquisa.</p>
            </div>
          ) : selectedCategory === 'all' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {catGroups.map(group => {
                const cs = getCatStyle(group.categoria);
                return (
                  <div key={group.categoria}
                    className="bg-white rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 flex flex-col"
                    style={{borderColor:'#E5E7EB',boxShadow:'0 2px 8px rgba(45,43,111,0.06)'}}>

                    {/* Card header */}
                    <div className="px-5 pt-5 pb-4" style={{background:cs.bg,borderBottom:`2px solid ${cs.accent}20`}}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{background:`${cs.accent}18`,border:`1.5px solid ${cs.accent}30`}}>
                            <CatIcon cat={group.categoria} size={22}/>
                          </div>
                          <div>
                            <h3 className="font-bold text-base" style={{color:'#1E1B4B'}}>{group.categoria}</h3>
                            <p className="text-xs mt-0.5" style={{color:'#6B7280'}}>
                              {group.cursos.length} curso{group.cursos.length!==1?'s':''} · {group.totalHoras}+ horas
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          {group.niveis.slice(0,2).map(n => (
                            <span key={n} className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{background:LEVEL_STYLE[n]?.bg??'#F3F4F6',color:LEVEL_STYLE[n]?.text??'#374151'}}>
                              {n}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Cursos list */}
                    <div className="px-5 py-4 flex-1 space-y-2">
                      {group.cursos.slice(0,3).map(c => {
                        const lvl = getLevel(c);
                        const mock = COURSES_MOCK.find(m => m.nome === c.nome);
                        return (
                          <div key={c.id} className="flex items-center justify-between py-1.5 rounded-lg group">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background:cs.accent}}/>
                              <span className="text-sm truncate" style={{color:'#374151'}}>{c.nome}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-medium flex-shrink-0" style={{color:LEVEL_STYLE[lvl]?.text??'#6B7280'}}>
                                {mock?.modules ?? ''}m
                              </span>
                              {isAdmin && !c.id.startsWith('mock-') && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100">
                                      <MoreVertical className="h-3.5 w-3.5 text-slate-400"/>
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-36">
                                    <DropdownMenuItem onClick={() => openEditCourseDialog(c)}>
                                      <Edit className="h-3.5 w-3.5 mr-2"/>Editar curso
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDeleteCourse(c)} className="text-red-600 focus:text-red-600">
                                      <Trash className="h-3.5 w-3.5 mr-2"/>Excluir curso
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {group.cursos.length > 3 && (
                        <p className="text-xs text-center pt-1" style={{color:'#9CA3AF'}}>
                          +{group.cursos.length-3} mais
                        </p>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-5 pb-5">
                      <button onClick={() => { setSelectedCategory(group.categoria); setSearchTerm(''); }}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 hover:scale-[1.02]"
                        style={{background:cs.accent,color:'#fff'}}>
                        <Eye className="h-4 w-4"/>
                        Ver cursos
                        <ChevronRight className="h-3.5 w-3.5 ml-auto"/>
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Adicionar novo (admin) */}
              {isAdmin && (
                <div onClick={openNewCourseDialog}
                  className="bg-white rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-8 text-center min-h-[200px] transition-colors duration-200 cursor-pointer hover:border-green-400 hover:shadow-md"
                  style={{borderColor:'#E5E7EB'}}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{background:'rgba(58,178,106,0.1)'}}>
                    <Plus className="h-6 w-6" style={{color:'#3AB26A'}}/>
                  </div>
                  <p className="font-semibold text-sm mb-1" style={{color:'#1E1B4B'}}>Adicionar novo curso</p>
                  <p className="text-xs mb-4" style={{color:'#9CA3AF'}}>Crie um novo treinamento</p>
                  <span className="px-4 py-2 rounded-xl text-xs font-semibold text-white" style={{background:'#3AB26A'}}>
                    <Plus className="h-3.5 w-3.5 inline mr-1"/>Criar curso
                  </span>
                </div>
              )}
            </div>

          ) : (
            /* ══ CURSOS INDIVIDUAIS (categoria filtrada) ═══════════════════ */
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:getCatStyle(selectedCategory).bg}}>
                    <CatIcon cat={selectedCategory} size={20}/>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold" style={{color:'#1E1B4B'}}>Cursos</h2>
                    <p className="text-sm font-semibold" style={{color:getCatStyle(selectedCategory).accent}}>{selectedCategory}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <Button onClick={openNewCourseDialog}
                      className="text-white font-semibold px-4 py-2 rounded-xl flex items-center gap-2 text-sm"
                      style={{background:'#3AB26A'}}>
                      <Plus className="h-4 w-4"/>Novo Curso
                    </Button>
                  )}
                  <Button onClick={() => { setSelectedCategory('all'); setSearchTerm(''); }}
                    variant="outline" className="flex items-center gap-2 text-sm rounded-xl"
                    style={{borderColor:'#E5E7EB',color:'#374151'}}>
                    <ArrowLeft className="h-4 w-4"/>
                    Voltar
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allFilteredCourses.map(c => (
                  <div key={c.id} className="relative group">
                    <CourseCard course={c as unknown as Course} onStartCourse={handleStartCourse}/>
                    {isAdmin && !c.id.startsWith('mock-') && (
                      <div className="absolute top-3 right-3 z-10">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/90 backdrop-blur shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white">
                              <MoreVertical className="h-4 w-4 text-slate-600"/>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => openEditCourseDialog(c as Course)}>
                              <Edit className="h-3.5 w-3.5 mr-2"/>Editar curso
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteCourse(c as Course)} className="text-red-600 focus:text-red-600">
                              <Trash className="h-3.5 w-3.5 mr-2"/>Excluir curso
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ STATS ═════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {[
              { icon: BookOpen,    value: courses.length,    label: 'Cursos disponíveis',  accent: '#2D2B6F' },
              { icon: GraduationCap, value: categories.length, label: 'Categorias',         accent: '#3AB26A' },
              { icon: isAdmin ? Video : Clock,
                value: isAdmin ? videos.length : '50+',
                label: isAdmin ? 'Vídeos importados' : 'Horas de conteúdo',
                accent: '#8B5CF6'
              },
            ].map(({ icon: Icon, value, label, accent }) => (
              <div key={label} className="bg-white rounded-2xl border p-5 flex items-center gap-4 transition-all duration-200 hover:shadow-md"
                style={{borderColor:'#E5E7EB',boxShadow:'0 2px 8px rgba(45,43,111,0.05)'}}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:`${accent}12`}}>
                  <Icon className="h-6 w-6" style={{color:accent}}/>
                </div>
                <div>
                  <div className="text-2xl font-black" style={{color:'#1E1B4B'}}>{value}</div>
                  <div className="text-xs font-medium mt-0.5" style={{color:'#9CA3AF'}}>{label}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ══ DIALOG: Gerenciar Categorias ══════════════════════════════════════ */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{color:'#1E1B4B'}}>
              <div className="p-2 rounded-lg" style={{background:'rgba(58,178,106,0.1)'}}>
                <Tag className="h-5 w-5" style={{color:'#3AB26A'}}/>
              </div>
              Gerenciar Categorias
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Lista de categorias */}
            {loadingCategories ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" style={{color:'#3AB26A'}}/>
              </div>
            ) : categoriesDB.length === 0 ? (
              <div className="text-center py-6">
                <Tag className="h-8 w-8 mx-auto mb-2 text-slate-300"/>
                <p className="text-sm text-slate-500">Nenhuma categoria cadastrada.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {categoriesDB.map(cat => (
                  <div key={cat.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="w-4 h-4 rounded-full flex-shrink-0" style={{background: cat.cor || '#6366F1'}}/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{cat.nome}</p>
                      {cat.descricao && <p className="text-xs text-slate-400 truncate">{cat.descricao}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEditCategory(cat)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors">
                        <Edit className="h-3.5 w-3.5 text-slate-500"/>
                      </button>
                      <button onClick={() => handleDeleteCategory(cat)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors">
                        <Trash className="h-3.5 w-3.5 text-red-400"/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Botão para abrir formulário */}
            {!showCategoryForm ? (
              <Button onClick={() => { setCategoryForm({...emptyCategoryForm}); setEditingCategoryId(null); setShowCategoryForm(true); }}
                variant="outline" className="w-full flex items-center gap-2 rounded-xl border-dashed border-slate-300 text-slate-600">
                <Plus className="h-4 w-4"/>
                Nova Categoria
              </Button>
            ) : (
              /* Formulário inline */
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <p className="text-sm font-semibold text-slate-700">
                  {editingCategoryId ? 'Editar Categoria' : 'Nova Categoria'}
                </p>
                <div>
                  <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Nome *</Label>
                  <Input value={categoryForm.nome} onChange={e => setCategoryForm(p => ({...p, nome: e.target.value}))}
                    placeholder="Ex: PABX, CALLCENTER..." className="rounded-lg border-slate-200 text-sm"/>
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Descrição</Label>
                  <Input value={categoryForm.descricao} onChange={e => setCategoryForm(p => ({...p, descricao: e.target.value}))}
                    placeholder="Descrição opcional" className="rounded-lg border-slate-200 text-sm"/>
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Cor</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={categoryForm.cor}
                      onChange={e => setCategoryForm(p => ({...p, cor: e.target.value}))}
                      className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5"/>
                    <div className="flex gap-1 flex-wrap">
                      {CATEGORY_COLORS.map(c => (
                        <button key={c} onClick={() => setCategoryForm(p => ({...p, cor: c}))}
                          className="w-7 h-7 rounded-md border-2 transition-transform hover:scale-110"
                          style={{background:c, borderColor: categoryForm.cor === c ? '#1e293b' : 'transparent'}}/>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button onClick={handleSaveCategory} disabled={savingCategory}
                    className="flex-1 text-white text-sm rounded-lg" style={{background:'#3AB26A'}}>
                    {savingCategory ? <><Loader2 className="h-4 w-4 mr-1 animate-spin"/>Salvando...</> : 'Salvar'}
                  </Button>
                  <Button variant="outline" onClick={() => { setShowCategoryForm(false); setEditingCategoryId(null); }}
                    className="text-sm rounded-lg">Cancelar</Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ DIALOG: Criar/Editar Curso ════════════════════════════════════════ */}
      <Dialog open={showCourseDialog} onOpenChange={setShowCourseDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{color:'#1E1B4B'}}>
              <div className="p-2 rounded-lg" style={{background:'rgba(58,178,106,0.1)'}}>
                <BookOpen className="h-5 w-5" style={{color:'#3AB26A'}}/>
              </div>
              {editingCourseId ? 'Editar Curso' : 'Novo Curso'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Nome do curso *</Label>
              <Input value={courseForm.nome} onChange={e => setCourseForm(p => ({...p, nome: e.target.value}))}
                placeholder="Ex: Fundamentos de PABX" className="rounded-lg border-slate-200 text-sm"/>
            </div>

            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Descrição</Label>
              <Textarea value={courseForm.descricao} onChange={e => setCourseForm(p => ({...p, descricao: e.target.value}))}
                placeholder="Descrição do curso..." rows={3} className="rounded-lg border-slate-200 text-sm"/>
            </div>

            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Categoria</Label>
              <div className="space-y-2">
                {!courseForm.manualCategory ? (
                  <div className="flex gap-2">
                    <Select value={courseForm.categoria_id || 'manual'}
                      onValueChange={(val) => {
                        if (val === 'manual') {
                          setCourseForm(p => ({...p, manualCategory: true, categoria_id: '', categoria: ''}));
                        } else {
                          const cat = categoriesDB.find(c => c.id === val);
                          setCourseForm(p => ({...p, categoria_id: val, categoria: cat?.nome || ''}));
                        }
                      }}>
                      <SelectTrigger className="w-full rounded-lg border-slate-200 text-sm">
                        <SelectValue placeholder="Selecione uma categoria"/>
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesDB.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{background: cat.cor || '#6366F1'}}/>
                              {cat.nome}
                            </div>
                          </SelectItem>
                        ))}
                        <SelectItem value="manual">✏️ Digitar manualmente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input value={courseForm.categoria}
                      onChange={e => setCourseForm(p => ({...p, categoria: e.target.value}))}
                      placeholder="Digite a categoria" className="rounded-lg border-slate-200 text-sm flex-1"/>
                    <Button variant="outline" size="sm" onClick={() => setCourseForm(p => ({...p, manualCategory: false}))}
                      className="text-xs rounded-lg px-3 whitespace-nowrap">Usar lista</Button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Status</Label>
                <Select value={courseForm.status} onValueChange={(val: 'ativo' | 'inativo' | 'em_breve') => setCourseForm(p => ({...p, status: val}))}>
                  <SelectTrigger className="w-full rounded-lg border-slate-200 text-sm">
                    <SelectValue/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="em_breve">Em breve</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Ordem</Label>
                <Input type="number" value={courseForm.ordem}
                  onChange={e => setCourseForm(p => ({...p, ordem: parseInt(e.target.value) || 0}))}
                  className="rounded-lg border-slate-200 text-sm"/>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSaveCourse} disabled={savingCourse}
                className="flex-1 text-white text-sm rounded-lg" style={{background:'#3AB26A'}}>
                {savingCourse
                  ? <><Loader2 className="h-4 w-4 mr-1 animate-spin"/>Salvando...</>
                  : editingCourseId ? 'Salvar alterações' : 'Criar curso'
                }
              </Button>
              <Button variant="outline" onClick={() => setShowCourseDialog(false)} className="text-sm rounded-lg">
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </ERALayout>
  );
};

export default Treinamentos;
