import { ERALayout } from '@/components/ERALayout';
import { CourseCard } from '@/components/CourseCard';
import { VideoUpload } from '@/components/VideoUpload';
import { useCourses } from '@/hooks/useCourses';
import type { Course } from '@/hooks/useCourses';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Filter, Plus, Video, Eye, BookOpen, Clock, Users, Settings, ListOrdered, ArrowLeft, Play, Trash, ChevronRight, GraduationCap, Award, Edit, Loader2, MoreVertical, Tag } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import type { Database } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';

// ERA Brand Palette: #000000 Black | #14213D Prussian Blue | #FCA311 Orange | #E5E5E5 Alabaster | #FFFFFF White
const C = {
  black: '#000000', navy: '#14213D', navyDark: '#0d1828', navyMid: '#1a2d52',
  orange: '#FCA311', orangeDim: '#e8940f', alabaster: '#E5E5E5', white: '#FFFFFF',
  card: '#15243d', border: 'rgba(252,163,17,0.18)', borderSoft: 'rgba(252,163,17,0.1)',
  textMuted: 'rgba(229,229,229,0.45)', textSub: 'rgba(229,229,229,0.65)',
} as const;

type VideoRow = Database['public']['Tables']['videos']['Row'] & {
  cursos?: { id: string; nome: string; categoria: string } | null;
};
interface CategoryGroup { categoria: string; cursos: Course[]; totalHoras: number; niveis: string[]; cursosAtivos: number; }
interface CategoriaDB { id: string; nome: string; descricao: string | null; cor: string | null; }
interface CategoryForm { nome: string; descricao: string; cor: string; }
interface CourseForm { nome: string; descricao: string; categoria: string; categoria_id: string; status: 'ativo' | 'inativo' | 'em_breve'; ordem: number; manualCategory: boolean; }

const LEVEL_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  'Iniciante': { bg: 'rgba(252,163,17,0.12)', text: '#FCA311', border: 'rgba(252,163,17,0.3)' },
  'Intermediário': { bg: 'rgba(229,229,229,0.08)', text: '#E5E5E5', border: 'rgba(229,229,229,0.2)' },
  'Avancado': { bg: 'rgba(252,163,17,0.2)', text: '#fff', border: 'rgba(252,163,17,0.5)' },
};

const COURSES_MOCK = [
  { nome: 'Fundamentos de PABX', categoria: 'PABX', level: 'Iniciante', duration: '2-3h', modules: 5 },
  { nome: 'Fundamentos CALLCENTER', categoria: 'CALLCENTER', level: 'Iniciante', duration: '2-3h', modules: 4 },
  { nome: 'Configuracoes Avancadas PABX', categoria: 'PABX', level: 'Avancado', duration: '3-4h', modules: 6 },
  { nome: 'OMNICHANNEL para Empresas', categoria: 'OMNICHANNEL', level: 'Intermediario', duration: '4-5h', modules: 8 },
  { nome: 'Configuracoes Avancadas OMNI', categoria: 'OMNICHANNEL', level: 'Avancado', duration: '5-6h', modules: 10 },
];
const CAT_COLORS = ['#FCA311', '#e8940f', '#d4860e', '#f0b84a', '#14213D', '#1e3152', '#2a4070', '#0d1a2e'];

const CatIcon = ({ cat, size = 20 }: { cat: string; size?: number }) => {
  const c = C.orange;
  if (cat === 'PABX' || cat === 'VoIP')
    return <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><path d="M3 4a1 1 0 011-1h3l1.5 3.5L7 8s1 2 5 5l1.5-1.5L17 13v3a1 1 0 01-1 1C7 17 3 10 3 4z" stroke={c} strokeWidth="1.5" strokeLinejoin="round" /></svg>;
  if (cat === 'CALLCENTER')
    return <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><path d="M10 2a6 6 0 016 6v2a2 2 0 01-2 2H6a2 2 0 01-2-2V8a6 6 0 016-6z" stroke={c} strokeWidth="1.5" /><path d="M7 18h6M10 14v4" stroke={c} strokeWidth="1.5" strokeLinecap="round" /></svg>;
  if (cat === 'OMNICHANNEL')
    return <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke={c} strokeWidth="1.5" /><path d="M3 10h14M10 3c-2 3-2 11 0 14M10 3c2 3 2 11 0 14" stroke={c} strokeWidth="1.5" /></svg>;
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="2" stroke={c} strokeWidth="1.5" /><path d="M7 10h6M10 7v6" stroke={c} strokeWidth="1.5" strokeLinecap="round" /></svg>;
};

const emptyCF: CategoryForm = { nome: '', descricao: '', cor: C.orange };
const emptyCoF: CourseForm = { nome: '', descricao: '', categoria: '', categoria_id: '', status: 'ativo', ordem: 0, manualCategory: false };
const IS: React.CSSProperties = { background: C.navyDark, border: `1px solid ${C.border}`, color: C.alabaster, borderRadius: 10, padding: '9px 13px', fontSize: 13, width: '100%', outline: 'none', fontFamily: 'inherit' };

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

  useEffect(() => { if (userProfile) loadVideos(); }, [userProfile]);
  useEffect(() => { if (isAdmin) loadCategories(); }, [isAdmin]);

  const loadVideos = async () => {
    setLoadingVideos(true);
    try {
      const { data: vd, error: vErr } = await supabase.from('videos').select('*').order('data_criacao', { ascending: false });
      if (vErr) throw vErr;
      if (vd && vd.length > 0) {
        const ids = [...new Set(vd.map((v: any) => v.curso_id).filter(Boolean))];
        if (ids.length > 0) {
          const { data: cd } = await supabase.from('cursos').select('id,nome,categoria').in('id', ids);
          setVideos(vd.map((v: any) => ({ ...v, cursos: cd?.find((c: any) => c.id === v.curso_id) || null })));
          return;
        }
      }
      setVideos(vd || []);
    } catch { } finally { setLoadingVideos(false); }
  };

  const mergedNames = COURSES_MOCK.map(m => m.nome);
  const filteredCourses = mergedNames.map(nome =>
    courses.find(c => c.nome === nome) ?? {
      ...COURSES_MOCK.find(m => m.nome === nome)!,
      id: `mock-${nome.replace(/\s+/g, '-').toLowerCase()}`,
      status: 'ativo' as const, imagem_url: null, categoria_id: null, ordem: null, descricao: null,
    }
  ).filter(c => {
    const s = searchTerm.toLowerCase();
    return (c.nome.toLowerCase().includes(s) || c.categoria.toLowerCase().includes(s)) &&
      (selectedCategory === 'all' || c.categoria === selectedCategory);
  });
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
      const lvl = getLevel(c); const h = lvl === 'Avancado' ? 5 : lvl === 'Intermediario' ? 4 : 2;
      map[c.categoria].totalHoras += h;
      if (!map[c.categoria].niveis.includes(lvl)) map[c.categoria].niveis.push(lvl);
      if (c.status === 'ativo') map[c.categoria].cursosAtivos++;
    });
    return Object.values(map).sort((a, b) => b.cursos.length - a.cursos.length);
  };

  const handleStartCourse = (courseId: string) => {
    if (courseId.startsWith('mock-')) { toast({ title: 'Curso em breve', description: 'Este curso ainda nao esta disponivel.', variant: 'destructive' }); return; }
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
      if (editingCategoryId) { const { error } = await supabase.from('categorias').update({ nome: categoryForm.nome.trim(), descricao: categoryForm.descricao.trim() || null, cor: categoryForm.cor }).eq('id', editingCategoryId); if (error) throw error; toast({ title: 'Sucesso', description: 'Categoria atualizada!' }); }
      else { const { error } = await supabase.from('categorias').insert({ nome: categoryForm.nome.trim(), descricao: categoryForm.descricao.trim() || null, cor: categoryForm.cor }); if (error) throw error; toast({ title: 'Sucesso', description: 'Categoria criada!' }); }
      setCategoryForm({ ...emptyCF }); setEditingCategoryId(null); setShowCategoryForm(false); await loadCategories();
    } catch (err: any) { toast({ title: 'Erro', description: err.message || 'Erro ao salvar.', variant: 'destructive' }); }
    finally { setSavingCategory(false); }
  };

  const handleEditCategory = (cat: CategoriaDB) => { setCategoryForm({ nome: cat.nome, descricao: cat.descricao || '', cor: cat.cor || C.orange }); setEditingCategoryId(cat.id); setShowCategoryForm(true); };
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
    if (!courseForm.nome.trim()) { toast({ title: 'Campo obrigatorio', description: 'Informe o nome.', variant: 'destructive' }); return; }
    if (!courseForm.categoria.trim()) { toast({ title: 'Campo obrigatorio', description: 'Informe a categoria.', variant: 'destructive' }); return; }
    setSavingCourse(true);
    try {
      const payload = { nome: courseForm.nome.trim(), descricao: courseForm.descricao.trim() || null, categoria: courseForm.categoria.trim(), categoria_id: courseForm.categoria_id || null, status: courseForm.status, ordem: courseForm.ordem || null };
      if (editingCourseId) { const { error } = await supabase.from('cursos').update(payload).eq('id', editingCourseId); if (error) throw error; toast({ title: 'Sucesso', description: 'Curso atualizado!' }); }
      else { const { error } = await supabase.from('cursos').insert(payload); if (error) throw error; toast({ title: 'Sucesso', description: 'Curso criado!' }); }
      setShowCourseDialog(false); setCourseForm({ ...emptyCoF }); setEditingCourseId(null); refetch();
    } catch (err: any) { toast({ title: 'Erro', description: err.message || 'Erro ao salvar.', variant: 'destructive' }); }
    finally { setSavingCourse(false); }
  };
  const handleDeleteCourse = async (course: Course) => {
    if (!window.confirm(`Excluir "${course.nome}"?`)) return;
    try { const { error } = await supabase.from('cursos').delete().eq('id', course.id); if (error) throw error; toast({ title: 'Sucesso', description: 'Curso excluido!' }); refetch(); }
    catch { toast({ title: 'Erro', description: 'Erro ao excluir.', variant: 'destructive' }); }
  };

  if (isLoading) return (<ERALayout><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', background: C.navyDark }}><div style={{ textAlign: 'center' }}><div style={{ width: 40, height: 40, border: `3px solid ${C.orange}`, borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 12px', animation: 'era-spin 0.8s linear infinite' }} /><p style={{ color: C.textSub, fontSize: 13 }}>Carregando treinamentos...</p></div></div></ERALayout>);
  if (error) return (<ERALayout><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><div style={{ textAlign: 'center' }}><BookOpen style={{ width: 40, height: 40, color: '#ef4444', margin: '0 auto 8px' }} /><p style={{ color: '#f87171', fontSize: 13 }}>Erro ao carregar treinamentos.</p></div></div></ERALayout>);

  const catGroups = getCoursesByCategory();

  return (
    <ERALayout>
      <style>{`
        @keyframes era-spin { to { transform: rotate(360deg) } }
        @keyframes era-fade { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        .ef { animation: era-fade 0.4s ease both }
        .ef1 { animation-delay: 0.06s } .ef2 { animation-delay: 0.12s } .ef3 { animation-delay: 0.18s }
        .ecard { transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s }
        .ecard:hover { transform: translateY(-3px); box-shadow: 0 16px 48px rgba(252,163,17,0.12) !important; border-color: rgba(252,163,17,0.4) !important }
        .ebtn { transition: background 0.15s, box-shadow 0.15s, transform 0.15s }
        .ebtn:hover { transform: translateY(-1px); box-shadow: 0 4px 18px rgba(252,163,17,0.3) }
        .einput:focus { border-color: #FCA311 !important; box-shadow: 0 0 0 3px rgba(252,163,17,0.12) !important; outline: none }
        .escroll::-webkit-scrollbar { width: 4px }
        .escroll::-webkit-scrollbar-track { background: #0d1828 }
        .escroll::-webkit-scrollbar-thumb { background: rgba(252,163,17,0.25); border-radius: 99px }
        .evrow { transition: background 0.15s, border-color 0.15s }
        .evrow:hover { background: rgba(252,163,17,0.05) !important; border-color: rgba(252,163,17,0.2) !important }
        .ecrow { transition: background 0.12s }
        .ecrow:hover { background: rgba(252,163,17,0.06) !important }
      `}</style>

      {showUpload && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <VideoUpload onClose={() => setShowUpload(false)} onSuccess={() => { loadVideos(); refetch(); setShowUpload(false); }} />
        </div>
      )}
      {showVideoModal && selectedVideo && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.92)', padding: 16 }}>
          <div style={{ background: C.navy, border: `1px solid ${C.border}`, borderRadius: 20, padding: 24, maxWidth: 680, width: '100%', position: 'relative' }}>
            <button style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: '50%', background: 'rgba(252,163,17,0.1)', border: `1px solid ${C.border}`, color: C.orange, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => { setShowVideoModal(false); setSelectedVideo(null); }}>x</button>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: C.white, marginBottom: 16, paddingRight: 40 }}>{selectedVideo.titulo}</h2>
            <video src={selectedVideo.url_video ?? undefined} controls style={{ width: '100%', borderRadius: 12, background: '#000' }} />
          </div>
        </div>
      )}

      <div style={{ minHeight: '100vh', background: C.navyDark, paddingBottom: 40 }}>
        {/* HERO */}
        <div className="ef" style={{ background: `linear-gradient(135deg, ${C.black} 0%, ${C.navy} 55%, ${C.navyMid} 100%)`, border: `1px solid ${C.borderSoft}`, borderRadius: 20, marginBottom: 24, overflow: 'hidden', position: 'relative', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${C.orange}, rgba(252,163,17,0.15) 70%, transparent)` }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(252,163,17,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(252,163,17,0.03) 1px, transparent 1px)`, backgroundSize: '40px 40px', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1, padding: '36px 40px 28px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
              <div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 99, background: 'rgba(252,163,17,0.1)', border: `1px solid rgba(252,163,17,0.3)`, color: C.orange, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.orange }} />
                  Plataforma de Ensino
                </span>
                <h1 style={{ fontSize: 36, fontWeight: 900, color: C.white, marginBottom: 10, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                  Treinamentos <span style={{ color: C.orange }}>ERA</span>
                </h1>
                <p style={{ fontSize: 14, color: C.textSub, maxWidth: 480, marginBottom: 20, lineHeight: 1.65 }}>
                  Cursos estruturados em trilhas de aprendizado - do basico ao avancado, com certificacao ao final.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                  {[{ icon: BookOpen, label: `${allFilteredCourses.length} cursos` }, { icon: Clock, label: '50+ horas' }, { icon: Users, label: '1.000+ alunos' }, { icon: Award, label: 'Certificados' }].map(({ icon: Icon, label }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.textMuted }}>
                      <Icon style={{ width: 14, height: 14, color: C.orange }} />{label}
                    </div>
                  ))}
                </div>
              </div>
              {isAdmin && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
                  <button className="ebtn" onClick={() => setShowUpload(true)} style={{ background: C.orange, color: C.black, border: 'none', borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><Settings style={{ width: 14, height: 14 }} />Novo treinamento</button>
                  <button className="ebtn" onClick={() => { setShowCategoryDialog(true); loadCategories(); }} style={{ background: 'rgba(252,163,17,0.08)', color: C.orange, border: `1px solid rgba(252,163,17,0.25)`, borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><Tag style={{ width: 14, height: 14 }} />Categorias</button>
                  <button className="ebtn" onClick={() => navigate('/admin/gerenciar-ordem-videos')} style={{ background: 'rgba(252,163,17,0.08)', color: C.orange, border: `1px solid rgba(252,163,17,0.25)`, borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><ListOrdered style={{ width: 14, height: 14 }} />Ordem</button>
                </div>
              )}
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${C.borderSoft}`, background: 'rgba(0,0,0,0.35)', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', padding: '16px 40px' }}>
            {[{ value: courses.length, label: 'Cursos disponiveis' }, { value: categories.length, label: 'Categorias' }, { value: isAdmin ? videos.length : '50+', label: isAdmin ? 'Videos importados' : 'Horas de conteudo' }].map(({ value, label }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: C.orange }}>{value}</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* SEARCH */}
        <div className="ef ef1" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: C.textMuted, pointerEvents: 'none' }} />
              <input className="einput" placeholder="Pesquisar cursos..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ ...IS, paddingLeft: 36 }} />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger style={{ ...IS, width: 200 }}>
                <Filter style={{ width: 13, height: 13, marginRight: 6, color: C.textMuted }} /><SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent style={{ background: C.navy, border: `1px solid ${C.border}`, color: C.alabaster }}>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* VIDEOS ADMIN */}
        {isAdmin && (
          <div className="ef ef2" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, marginBottom: 16, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: `1px solid ${C.borderSoft}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(252,163,17,0.1)', border: `1px solid rgba(252,163,17,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Video style={{ width: 15, height: 15, color: C.orange }} />
                </div>
                <div><p style={{ fontSize: 13, fontWeight: 600, color: C.white }}>Videos importados</p><p style={{ fontSize: 11, color: C.textMuted }}>Gerencie os videos de treinamento</p></div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: 'rgba(252,163,17,0.1)', color: C.orange, border: `1px solid rgba(252,163,17,0.2)` }}>{videos.length} videos</span>
            </div>
            <div style={{ padding: 14 }}>
              {loadingVideos ? (<div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}><div style={{ width: 24, height: 24, border: `2px solid ${C.orange}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'era-spin 0.8s linear infinite' }} /></div>)
                : videos.length === 0 ? (<div style={{ textAlign: 'center', padding: '32px 0' }}><Video style={{ width: 28, height: 28, color: C.textMuted, margin: '0 auto 8px' }} /><p style={{ fontSize: 13, color: C.textMuted }}>Nenhum video importado ainda.</p></div>)
                  : (<div className="escroll" style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {videos.map(video => (
                      <div key={video.id} className="evrow" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.borderSoft}`, background: C.navyDark }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(252,163,17,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Play style={{ width: 13, height: 13, color: C.orange }} /></div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, color: C.white, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{video.titulo}</p>
                          <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                            <span style={{ fontSize: 11, color: C.textMuted }}>{video.duracao} min</span>
                            <span style={{ fontSize: 11, color: C.textMuted }}>{new Date(video.data_criacao).toLocaleDateString('pt-BR')}</span>
                            {video.cursos && <span style={{ fontSize: 11, color: C.orange, fontWeight: 500 }}>{video.cursos.nome}</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => { setSelectedVideo(video); setShowVideoModal(true); }} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.borderSoft}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Eye style={{ width: 13, height: 13, color: C.textSub }} /></button>
                          <button onClick={() => handleDeleteVideo(video)} disabled={deletingVideoId === video.id} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(239,68,68,0.2)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: deletingVideoId === video.id ? 0.5 : 1 }}>
                            {deletingVideoId === video.id ? <div style={{ width: 12, height: 12, border: '2px solid #ef4444', borderTopColor: 'transparent', borderRadius: '50%', animation: 'era-spin 0.8s linear infinite' }} /> : <Trash style={{ width: 12, height: 12, color: '#f87171' }} />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>)}
            </div>
          </div>
        )}

        {/* COURSES */}
        {allFilteredCourses.length === 0 ? (
          <div className="ef ef3" style={{ textAlign: 'center', padding: '64px 20px', background: C.card, borderRadius: 16, border: `1px solid ${C.border}` }}>
            <BookOpen style={{ width: 40, height: 40, color: C.textMuted, margin: '0 auto 12px' }} />
            <p style={{ fontWeight: 600, color: C.textSub }}>Nenhum curso encontrado.</p>
            <p style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>Tente ajustar os filtros.</p>
          </div>
        ) : selectedCategory === 'all' ? (
          <div className="ef ef3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {catGroups.map(group => (
              <div key={group.categoria} className="ecard" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                <div style={{ padding: '18px 20px 14px', background: `linear-gradient(135deg, ${C.navyDark}, ${C.navy})`, borderBottom: `1px solid rgba(252,163,17,0.12)` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(252,163,17,0.1)', border: `1.5px solid rgba(252,163,17,0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CatIcon cat={group.categoria} size={22} />
                      </div>
                      <div>
                        <h3 style={{ fontWeight: 800, fontSize: 15, color: C.white }}>{group.categoria}</h3>
                        <p style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{group.cursos.length} curso{group.cursos.length !== 1 ? 's' : ''} - {group.totalHoras}+ horas</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                      {group.niveis.slice(0, 2).map(n => (
                        <span key={n} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, fontWeight: 600, background: LEVEL_STYLE[n]?.bg ?? 'rgba(255,255,255,0.08)', color: LEVEL_STYLE[n]?.text ?? C.alabaster, border: `1px solid ${LEVEL_STYLE[n]?.border ?? 'transparent'}` }}>{n}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ padding: '14px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {group.cursos.slice(0, 3).map(c => {
                    const lvl = getLevel(c); const mock = COURSES_MOCK.find(m => m.nome === c.nome);
                    return (
                      <div key={c.id} className="ecrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 8px', borderRadius: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.orange, flexShrink: 0 }} />
                          <span style={{ fontSize: 13, color: C.alabaster, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nome}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: LEVEL_STYLE[lvl]?.text ?? C.textMuted, flexShrink: 0 }}>{mock?.modules ?? ''}m</span>
                          {isAdmin && !c.id.startsWith('mock-') && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><button style={{ width: 22, height: 22, borderRadius: 5, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MoreVertical style={{ width: 13, height: 13, color: C.textMuted }} /></button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end" style={{ background: C.navy, border: `1px solid ${C.border}`, color: C.alabaster }}>
                                <DropdownMenuItem onClick={() => openEditCourse(c)}><Edit style={{ width: 13, height: 13, marginRight: 6 }} />Editar</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteCourse(c)} style={{ color: '#f87171' }}><Trash style={{ width: 13, height: 13, marginRight: 6 }} />Excluir</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {group.cursos.length > 3 && <p style={{ fontSize: 11, textAlign: 'center', color: C.textMuted, paddingTop: 4 }}>+{group.cursos.length - 3} mais</p>}
                </div>
                <div style={{ padding: '0 20px 20px' }}>
                  <button className="ebtn" onClick={() => { setSelectedCategory(group.categoria); setSearchTerm(''); }} style={{ width: '100%', padding: '11px', borderRadius: 12, border: 'none', background: C.orange, color: C.black, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                    <Eye style={{ width: 14, height: 14 }} />Ver cursos<ChevronRight style={{ width: 13, height: 13, marginLeft: 'auto' }} />
                  </button>
                </div>
              </div>
            ))}
            {isAdmin && (
              <div onClick={openNewCourse}
                style={{ background: 'transparent', border: `2px dashed rgba(252,163,17,0.2)`, borderRadius: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center', minHeight: 220, cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.orange; (e.currentTarget as HTMLDivElement).style.background = 'rgba(252,163,17,0.04)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(252,163,17,0.2)'; (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(252,163,17,0.1)', border: `1px solid rgba(252,163,17,0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}><Plus style={{ width: 22, height: 22, color: C.orange }} /></div>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.white, marginBottom: 4 }}>Adicionar novo curso</p>
                <p style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>Crie um novo treinamento</p>
                <span style={{ padding: '8px 18px', borderRadius: 10, background: C.orange, color: C.black, fontSize: 12, fontWeight: 700 }}>+ Criar curso</span>
              </div>
            )}
          </div>
        ) : (
          <div className="ef ef3">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(252,163,17,0.1)', border: `1px solid rgba(252,163,17,0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CatIcon cat={selectedCategory} size={18} /></div>
                <div><h2 style={{ fontSize: 16, fontWeight: 800, color: C.white }}>Cursos</h2><p style={{ fontSize: 13, fontWeight: 600, color: C.orange }}>{selectedCategory}</p></div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {isAdmin && <button className="ebtn" onClick={openNewCourse} style={{ background: C.orange, color: C.black, border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}><Plus style={{ width: 13, height: 13 }} />Novo Curso</button>}
                <button onClick={() => { setSelectedCategory('all'); setSearchTerm(''); }} style={{ background: 'transparent', color: C.orange, border: `1px solid rgba(252,163,17,0.3)`, borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}><ArrowLeft style={{ width: 13, height: 13 }} />Voltar</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {allFilteredCourses.map(c => (
                <div key={c.id} style={{ position: 'relative' }}>
                  <CourseCard course={c as unknown as Course} onStartCourse={handleStartCourse} />
                  {isAdmin && !c.id.startsWith('mock-') && (
                    <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><button style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(20,33,61,0.9)', border: `1px solid ${C.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MoreVertical style={{ width: 14, height: 14, color: C.orange }} /></button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" style={{ background: C.navy, border: `1px solid ${C.border}`, color: C.alabaster }}>
                          <DropdownMenuItem onClick={() => openEditCourse(c as Course)}><Edit style={{ width: 13, height: 13, marginRight: 6 }} />Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteCourse(c as Course)} style={{ color: '#f87171' }}><Trash style={{ width: 13, height: 13, marginRight: 6 }} />Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginTop: 20 }}>
          {[{ icon: BookOpen, value: courses.length, label: 'Cursos disponiveis' }, { icon: GraduationCap, value: categories.length, label: 'Categorias' }, { icon: isAdmin ? Video : Clock, value: isAdmin ? videos.length : '50+', label: isAdmin ? 'Videos importados' : 'Horas de conteudo' }].map(({ icon: Icon, value, label }) => (
            <div key={label} className="ecard" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(252,163,17,0.08)', border: `1px solid rgba(252,163,17,0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon style={{ width: 20, height: 20, color: C.orange }} /></div>
              <div><div style={{ fontSize: 24, fontWeight: 900, color: C.white }}>{value}</div><div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{label}</div></div>
            </div>
          ))}
        </div>
      </div>

      {/* DIALOG CATEGORIAS */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent style={{ background: C.navy, border: `1px solid ${C.border}`, borderRadius: 18, maxWidth: 480, maxHeight: '85vh', overflowY: 'auto' }}>
          <DialogHeader><DialogTitle style={{ color: C.white, display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ padding: 8, borderRadius: 9, background: 'rgba(252,163,17,0.1)', border: `1px solid rgba(252,163,17,0.2)` }}><Tag style={{ width: 16, height: 16, color: C.orange }} /></div>Gerenciar Categorias</DialogTitle></DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            {loadingCategories ? (<div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}><Loader2 style={{ width: 22, height: 22, color: C.orange, animation: 'era-spin 0.8s linear infinite' }} /></div>)
              : categoriesDB.length === 0 ? (<div style={{ textAlign: 'center', padding: '20px 0', color: C.textMuted }}><Tag style={{ width: 28, height: 28, margin: '0 auto 8px' }} /><p style={{ fontSize: 13 }}>Nenhuma categoria cadastrada.</p></div>)
                : categoriesDB.map(cat => (
                  <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.borderSoft}`, background: C.navyDark }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: cat.cor || C.orange, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}><p style={{ fontSize: 13, fontWeight: 600, color: C.white, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.nome}</p>{cat.descricao && <p style={{ fontSize: 11, color: C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.descricao}</p>}</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => handleEditCategory(cat)} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.borderSoft}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit style={{ width: 13, height: 13, color: C.textSub }} /></button>
                      <button onClick={() => handleDeleteCategory(cat)} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(239,68,68,0.2)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash style={{ width: 12, height: 12, color: '#f87171' }} /></button>
                    </div>
                  </div>
                ))}
            {!showCategoryForm ? (
              <button onClick={() => { setCategoryForm({ ...emptyCF }); setEditingCategoryId(null); setShowCategoryForm(true); }} style={{ width: '100%', padding: '10px', borderRadius: 10, border: `1.5px dashed rgba(252,163,17,0.25)`, background: 'transparent', color: C.orange, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Plus style={{ width: 14, height: 14 }} />Nova Categoria</button>
            ) : (
              <div style={{ padding: 14, borderRadius: 12, border: `1px solid ${C.border}`, background: C.navyDark, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.white }}>{editingCategoryId ? 'Editar Categoria' : 'Nova Categoria'}</p>
                <div><label style={{ fontSize: 11, color: C.textSub, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Nome *</label><input className="einput" value={categoryForm.nome} onChange={e => setCategoryForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: PABX..." style={IS} /></div>
                <div><label style={{ fontSize: 11, color: C.textSub, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Descricao</label><input className="einput" value={categoryForm.descricao} onChange={e => setCategoryForm(p => ({ ...p, descricao: e.target.value }))} placeholder="Opcional" style={IS} /></div>
                <div>
                  <label style={{ fontSize: 11, color: C.textSub, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cor</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="color" value={categoryForm.cor} onChange={e => setCategoryForm(p => ({ ...p, cor: e.target.value }))} style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${C.border}`, cursor: 'pointer', padding: 2, background: 'transparent' }} />
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{CAT_COLORS.map(col => <button key={col} onClick={() => setCategoryForm(p => ({ ...p, cor: col }))} style={{ width: 26, height: 26, borderRadius: 6, background: col, border: `2px solid ${categoryForm.cor === col ? C.white : 'transparent'}`, cursor: 'pointer' }} />)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="ebtn" onClick={handleSaveCategory} disabled={savingCategory} style={{ flex: 1, padding: '9px', borderRadius: 9, border: 'none', background: C.orange, color: C.black, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: savingCategory ? 0.7 : 1 }}>
                    {savingCategory ? <><Loader2 style={{ width: 13, height: 13, animation: 'era-spin 0.8s linear infinite' }} />Salvando...</> : 'Salvar'}
                  </button>
                  <button onClick={() => { setShowCategoryForm(false); setEditingCategoryId(null); }} style={{ padding: '9px 16px', borderRadius: 9, border: `1px solid ${C.border}`, background: 'transparent', color: C.textSub, fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG CURSO */}
      <Dialog open={showCourseDialog} onOpenChange={setShowCourseDialog}>
        <DialogContent style={{ background: C.navy, border: `1px solid ${C.border}`, borderRadius: 18, maxWidth: 480, maxHeight: '85vh', overflowY: 'auto' }}>
          <DialogHeader><DialogTitle style={{ color: C.white, display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ padding: 8, borderRadius: 9, background: 'rgba(252,163,17,0.1)', border: `1px solid rgba(252,163,17,0.2)` }}><BookOpen style={{ width: 16, height: 16, color: C.orange }} /></div>{editingCourseId ? 'Editar Curso' : 'Novo Curso'}</DialogTitle></DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
            <div><label style={{ fontSize: 11, color: C.textSub, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Nome *</label><input className="einput" value={courseForm.nome} onChange={e => setCourseForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Fundamentos de PABX" style={IS} /></div>
            <div><label style={{ fontSize: 11, color: C.textSub, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Descricao</label><textarea className="einput" value={courseForm.descricao} onChange={e => setCourseForm(p => ({ ...p, descricao: e.target.value }))} placeholder="Descricao..." rows={3} style={{ ...IS, resize: 'none' }} /></div>
            <div>
              <label style={{ fontSize: 11, color: C.textSub, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Categoria</label>
              {!courseForm.manualCategory ? (
                <Select value={courseForm.categoria_id || 'manual'} onValueChange={(val) => { if (val === 'manual') { setCourseForm(p => ({ ...p, manualCategory: true, categoria_id: '', categoria: '' })); } else { const cat = categoriesDB.find(c => c.id === val); setCourseForm(p => ({ ...p, categoria_id: val, categoria: cat?.nome || '' })); } }}>
                  <SelectTrigger style={IS}><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger>
                  <SelectContent style={{ background: C.navy, border: `1px solid ${C.border}`, color: C.alabaster }}>
                    {categoriesDB.map(cat => <SelectItem key={cat.id} value={cat.id}><div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: cat.cor || C.orange }} />{cat.nome}</div></SelectItem>)}
                    <SelectItem value="manual">Digitar manualmente</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="einput" value={courseForm.categoria} onChange={e => setCourseForm(p => ({ ...p, categoria: e.target.value }))} placeholder="Digite a categoria" style={{ ...IS, flex: 1 }} />
                  <button onClick={() => setCourseForm(p => ({ ...p, manualCategory: false }))} style={{ padding: '9px 12px', borderRadius: 9, border: `1px solid ${C.border}`, background: 'transparent', color: C.textSub, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>Usar lista</button>
                </div>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: C.textSub, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</label>
                <Select value={courseForm.status} onValueChange={(val: 'ativo' | 'inativo' | 'em_breve') => setCourseForm(p => ({ ...p, status: val }))}>
                  <SelectTrigger style={IS}><SelectValue /></SelectTrigger>
                  <SelectContent style={{ background: C.navy, border: `1px solid ${C.border}`, color: C.alabaster }}>
                    <SelectItem value="ativo">Ativo</SelectItem><SelectItem value="inativo">Inativo</SelectItem><SelectItem value="em_breve">Em breve</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><label style={{ fontSize: 11, color: C.textSub, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Ordem</label><input className="einput" type="number" value={courseForm.ordem} onChange={e => setCourseForm(p => ({ ...p, ordem: parseInt(e.target.value) || 0 }))} style={IS} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
              <button className="ebtn" onClick={handleSaveCourse} disabled={savingCourse} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: C.orange, color: C.black, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: savingCourse ? 0.7 : 1 }}>
                {savingCourse ? <><Loader2 style={{ width: 13, height: 13, animation: 'era-spin 0.8s linear infinite' }} />Salvando...</> : editingCourseId ? 'Salvar alteracoes' : 'Criar curso'}
              </button>
              <button onClick={() => setShowCourseDialog(false)} style={{ padding: '10px 18px', borderRadius: 10, border: `1px solid ${C.border}`, background: 'transparent', color: C.textSub, fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ERALayout>
  );
};

export default Treinamentos;
