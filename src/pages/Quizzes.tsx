import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ERALayout } from '@/components/ERALayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Search, Filter, Edit, Eye, Calendar, BookOpen,
  CheckCircle, XCircle, Clock, FileText, HelpCircle,
  Users, Target, Plus, Trash2, Save, Loader2,
  ArrowLeft, ArrowRight, MoreVertical, Link2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface QuizQuestion {
  id: string;
  pergunta: string;
  opcoes: string[];
  resposta_correta: number;
  explicacao?: string;
  ordem: number;
}

interface Quiz {
  id: string;
  categoria: string;
  titulo: string;
  descricao?: string;
  nota_minima: number;
  ativo: boolean;
  data_criacao: string;
  data_atualizacao: string;
  total_perguntas: number;
  total_tentativas: number;
  media_nota: number;
  total_aprovados: number;
  curso_id?: string;
}

interface QuizStats {
  total: number;
  ativos: number;
  inativos: number;
  total_perguntas: number;
  media_nota_geral: number;
  total_tentativas: number;
}

interface NewQuizQuestion {
  pergunta: string;
  opcoes: string[];
  resposta_correta: number;
  explicacao: string;
  ordem: number;
}

interface CursoDB {
  id: string;
  nome: string;
}

const getCategoryColor = (categoria: string) => {
  const cat = (categoria || '').toUpperCase();
  if (cat.includes('PABX')) return { border: '#3B82F6', bg: '#EFF6FF', text: '#1D4ED8', badge: 'bg-blue-100 text-blue-800' };
  if (cat.includes('CALLCENTER') || cat.includes('CALL')) return { border: '#7C3AED', bg: '#F5F3FF', text: '#5B21B6', badge: 'bg-violet-100 text-violet-800' };
  if (cat.includes('OMNI')) return { border: '#3AB26A', bg: '#F0FDF4', text: '#166534', badge: 'bg-green-100 text-green-800' };
  if (cat.includes('VOIP') || cat.includes('VOI')) return { border: '#F97316', bg: '#FFF7ED', text: '#9A3412', badge: 'bg-orange-100 text-orange-800' };
  return { border: '#2D2B6F', bg: '#F5F3FF', text: '#1E1B4B', badge: 'bg-indigo-100 text-indigo-800' };
};

const emptyNewQuestion = (): NewQuizQuestion => ({
  pergunta: '', opcoes: ['', '', '', ''], resposta_correta: 0, explicacao: '', ordem: 1,
});

const Quizzes: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([]);
  const [stats, setStats] = useState<QuizStats>({
    total: 0, ativos: 0, inativos: 0, total_perguntas: 0, media_nota_geral: 0, total_tentativas: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todos');

  // Existing question viewing/editing
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // New quiz creation
  const [showNewQuizModal, setShowNewQuizModal] = useState(false);
  const [newQuizStep, setNewQuizStep] = useState<1 | 2>(1);
  const [newQuizForm, setNewQuizForm] = useState({ titulo: '', descricao: '', categoria: '', nota_minima: 70, ativo: true });
  const [newQuizQuestions, setNewQuizQuestions] = useState<NewQuizQuestion[]>([emptyNewQuestion()]);
  const [savingNewQuiz, setSavingNewQuiz] = useState(false);

  // Course linking
  const [cursosDB, setCursosDB] = useState<CursoDB[]>([]);
  const [quizCursoMap, setQuizCursoMap] = useState<Record<string, string>>({});
  const [showLinkCursoModal, setShowLinkCursoModal] = useState(false);
  const [linkingQuiz, setLinkingQuiz] = useState<Quiz | null>(null);
  const [selectedCursoId, setSelectedCursoId] = useState('');
  const [savingLink, setSavingLink] = useState(false);

  // Adding new question to existing quiz
  const [addingNewQuestion, setAddingNewQuestion] = useState(false);
  const [newQuestionForExisting, setNewQuestionForExisting] = useState<NewQuizQuestion>(emptyNewQuestion());

  const isAdmin = userProfile?.tipo_usuario === 'admin' || userProfile?.tipo_usuario === 'admin_master';

  useEffect(() => { if (userProfile) { loadQuizzes(); loadCursos(); } }, [userProfile]);
  useEffect(() => { filterQuizzes(); }, [quizzes, searchTerm, statusFilter, categoriaFilter]);

  const loadCursos = async () => {
    try {
      const { data } = await supabase.from('cursos').select('id, nome').order('nome');
      setCursosDB(data || []);
    } catch { /* silencioso */ }
  };

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      let quizzesData, quizzesError;

      if (isAdmin) {
        const { data, error } = await supabase
          .from('quizzes')
          .select(`*, quiz_perguntas(count), progresso_quiz(count)`)
          .order('data_criacao', { ascending: false });
        quizzesData = data; quizzesError = error;
      } else {
        const cursosPermitidos = [
          'Fundamentos CALLCENTER', 'Fundamentos de PABX', 'Omnichannel para Empresas',
          'Configuracoes Avancadas OMNI', 'Configuracoes Avancadas PABX'
        ];
        const { data: cursosPermitidosData, error: cursosError } = await supabase
          .from('cursos').select('id, nome, categoria').in('nome', cursosPermitidos);
        if (cursosError) throw cursosError;
        const cursoIds = cursosPermitidosData?.map(c => c.id) || [];
        if (cursoIds.length === 0) { setQuizzes([]); calculateStats([], []); return; }
        const { data, error } = await supabase
          .from('quizzes')
          .select(`*, quiz_perguntas(count), progresso_quiz(count)`)
          .in('curso_id', cursoIds)
          .order('data_criacao', { ascending: false });
        quizzesData = data; quizzesError = error;
      }

      if (quizzesError) throw quizzesError;

      const quizIds = quizzesData?.map(q => q.id) || [];
      let progressData: any[] = [];
      if (quizIds.length > 0) {
        const { data: progress, error: progressError } = await supabase
          .from('progresso_quiz').select('nota, aprovado').in('quiz_id', quizIds);
        if (!progressError) progressData = progress || [];
      }

      // Load curso mappings
      if (quizIds.length > 0) {
        const { data: mappings } = await supabase
          .from('curso_quiz_mapping').select('quiz_id, curso_id').in('quiz_id', quizIds);
        const map: Record<string, string> = {};
        (mappings || []).forEach((m: any) => { map[m.quiz_id] = m.curso_id; });
        setQuizCursoMap(map);
      }

      const quizzesWithStats = (quizzesData || []).map((quiz: any) => {
        const quizProgress = progressData?.filter((p: any) => p.nota !== null) || [];
        const mediaNota = quizProgress.length > 0
          ? quizProgress.reduce((sum: number, p: any) => sum + p.nota, 0) / quizProgress.length : 0;
        const totalAprovados = quizProgress.filter((p: any) => p.aprovado).length;
        return {
          ...quiz,
          categoria: quiz.categoria || ('Curso ID: ' + quiz.curso_id),
          total_perguntas: quiz.quiz_perguntas?.[0]?.count || 0,
          total_tentativas: quiz.progresso_quiz?.[0]?.count || 0,
          media_nota: Math.round(mediaNota * 100) / 100,
          total_aprovados: totalAprovados
        };
      });

      setQuizzes(quizzesWithStats);
      calculateStats(quizzesWithStats, progressData);
    } catch {
      toast({ title: "Erro", description: "Nao foi possivel carregar os quizzes.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const calculateStats = (quizzesData: Quiz[], progressData: { nota: number; aprovado: boolean }[]) => {
    const total = quizzesData.length;
    const ativos = quizzesData.filter(q => q.ativo).length;
    const total_perguntas = quizzesData.reduce((sum, q) => sum + q.total_perguntas, 0);
    const total_tentativas = quizzesData.reduce((sum, q) => sum + q.total_tentativas, 0);
    const media_nota_geral = progressData.length > 0
      ? Math.round((progressData.reduce((sum, p) => sum + p.nota, 0) / progressData.length) * 100) / 100 : 0;
    setStats({ total, ativos, inativos: total - ativos, total_perguntas, media_nota_geral, total_tentativas });
  };

  const filterQuizzes = () => {
    let filtered = quizzes;
    if (searchTerm) {
      filtered = filtered.filter(q =>
        q.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'todos') filtered = filtered.filter(q => statusFilter === 'ativo' ? q.ativo : !q.ativo);
    if (categoriaFilter !== 'todos') filtered = filtered.filter(q => q.categoria === categoriaFilter);
    setFilteredQuizzes(filtered);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getUniqueCategories = () => [...new Set(quizzes.map(q => q.categoria))].sort();

  // ─── View/Edit questions ─────────────────────────────────────────────────
  const handleViewQuestions = async (quiz: Quiz) => {
    try {
      setSelectedQuiz(quiz); setShowQuestionsModal(true); setIsEditing(false); setEditingQuestion(null);
      setAddingNewQuestion(false);
      const { data, error } = await supabase.from('quiz_perguntas').select('*').eq('quiz_id', quiz.id).order('ordem');
      if (error) throw error;
      setQuestions(data || []);
    } catch {
      toast({ title: "Erro", description: "Nao foi possivel carregar as perguntas.", variant: "destructive" });
    }
  };

  const handleEditQuestion = (question: QuizQuestion) => {
    setEditingQuestion({ ...question }); setIsEditing(true);
  };

  const handleSaveQuestion = async () => {
    if (!editingQuestion || !selectedQuiz) return;
    try {
      setSaving(true);
      const { error } = await supabase.from('quiz_perguntas').update({
        pergunta: editingQuestion.pergunta, opcoes: editingQuestion.opcoes,
        resposta_correta: editingQuestion.resposta_correta,
        explicacao: editingQuestion.explicacao, ordem: editingQuestion.ordem
      }).eq('id', editingQuestion.id);
      if (error) throw error;
      setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? editingQuestion : q));
      toast({ title: "Sucesso", description: "Pergunta atualizada com sucesso!" });
      setEditingQuestion(null); setIsEditing(false);
    } catch {
      toast({ title: "Erro", description: "Nao foi possivel salvar a pergunta.", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleAddOption = (questionIndex: number) => {
    if (!editingQuestion) return;
    setEditingQuestion({ ...editingQuestion, opcoes: [...editingQuestion.opcoes, ''] });
  };

  const handleUpdateOption = (questionIndex: number, optionIndex: number, value: string) => {
    if (!editingQuestion) return;
    const newOptions = [...editingQuestion.opcoes];
    newOptions[optionIndex] = value;
    setEditingQuestion({ ...editingQuestion, opcoes: newOptions });
  };

  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    if (!editingQuestion || editingQuestion.opcoes.length <= 2) return;
    const newOptions = editingQuestion.opcoes.filter((_, i) => i !== optionIndex);
    const newResposta = editingQuestion.resposta_correta >= optionIndex
      ? Math.max(0, editingQuestion.resposta_correta - 1) : editingQuestion.resposta_correta;
    setEditingQuestion({ ...editingQuestion, opcoes: newOptions, resposta_correta: newResposta });
  };

  // ─── Delete question ─────────────────────────────────────────────────────
  const handleDeleteQuestion = async (question: QuizQuestion) => {
    if (!window.confirm('Excluir esta pergunta?')) return;
    try {
      const { error } = await supabase.from('quiz_perguntas').delete().eq('id', question.id);
      if (error) throw error;
      setQuestions(prev => prev.filter(q => q.id !== question.id));
      toast({ title: "Sucesso", description: "Pergunta excluída!" });
    } catch {
      toast({ title: "Erro", description: "Erro ao excluir pergunta.", variant: "destructive" });
    }
  };

  // ─── Add new question to existing quiz ────────────────────────────────────
  const handleSaveNewQuestionToExisting = async () => {
    if (!selectedQuiz) return;
    if (!newQuestionForExisting.pergunta.trim()) {
      toast({ title: 'Erro', description: 'Informe a pergunta.', variant: 'destructive' }); return;
    }
    const validOptions = newQuestionForExisting.opcoes.filter(o => o.trim());
    if (validOptions.length < 2) {
      toast({ title: 'Erro', description: 'Mínimo 2 opções.', variant: 'destructive' }); return;
    }
    try {
      setSaving(true);
      const { data, error } = await supabase.from('quiz_perguntas').insert({
        quiz_id: selectedQuiz.id,
        pergunta: newQuestionForExisting.pergunta.trim(),
        opcoes: newQuestionForExisting.opcoes.filter(o => o.trim()),
        resposta_correta: newQuestionForExisting.resposta_correta,
        explicacao: newQuestionForExisting.explicacao.trim() || null,
        ordem: questions.length + 1,
      }).select().single();
      if (error) throw error;
      setQuestions(prev => [...prev, data]);
      setNewQuestionForExisting(emptyNewQuestion());
      setAddingNewQuestion(false);
      toast({ title: "Sucesso", description: "Pergunta adicionada!" });
    } catch {
      toast({ title: "Erro", description: "Erro ao adicionar pergunta.", variant: "destructive" });
    } finally { setSaving(false); }
  };

  // ─── New Quiz creation ───────────────────────────────────────────────────
  const openNewQuizDialog = () => {
    setNewQuizForm({ titulo: '', descricao: '', categoria: '', nota_minima: 70, ativo: true });
    setNewQuizQuestions([emptyNewQuestion()]);
    setNewQuizStep(1);
    setShowNewQuizModal(true);
  };

  const handleSaveNewQuiz = async () => {
    if (!newQuizForm.titulo.trim()) {
      toast({ title: 'Erro', description: 'Informe o título.', variant: 'destructive' }); return;
    }
    const validQuestions = newQuizQuestions.filter(q => q.pergunta.trim() && q.opcoes.filter(o => o.trim()).length >= 2);
    if (validQuestions.length === 0) {
      toast({ title: 'Erro', description: 'Adicione pelo menos 1 pergunta válida.', variant: 'destructive' }); return;
    }

    setSavingNewQuiz(true);
    try {
      // 1. Insert quiz
      const { data: quizData, error: quizError } = await supabase.from('quizzes').insert({
        titulo: newQuizForm.titulo.trim(),
        descricao: newQuizForm.descricao.trim() || null,
        categoria: newQuizForm.categoria.trim() || null,
        nota_minima: newQuizForm.nota_minima,
        ativo: newQuizForm.ativo,
      }).select().single();
      if (quizError) throw quizError;

      // 2. Insert questions
      const questionsPayload = validQuestions.map((q, i) => ({
        quiz_id: quizData.id,
        pergunta: q.pergunta.trim(),
        opcoes: q.opcoes.filter(o => o.trim()),
        resposta_correta: q.resposta_correta,
        explicacao: q.explicacao.trim() || null,
        ordem: i + 1,
      }));
      const { error: qErr } = await supabase.from('quiz_perguntas').insert(questionsPayload);
      if (qErr) throw qErr;

      toast({ title: 'Sucesso', description: `Quiz "${quizData.titulo}" criado com ${questionsPayload.length} perguntas!` });
      setShowNewQuizModal(false);
      loadQuizzes();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Erro ao criar quiz.', variant: 'destructive' });
    } finally { setSavingNewQuiz(false); }
  };

  // ─── Delete quiz ─────────────────────────────────────────────────────────
  const handleDeleteQuiz = async (quiz: Quiz) => {
    if (!window.confirm(`Excluir o quiz "${quiz.titulo}"? Todas as perguntas e progresso serão removidos.`)) return;
    try {
      // Delete questions first
      await supabase.from('quiz_perguntas').delete().eq('quiz_id', quiz.id);
      await supabase.from('progresso_quiz').delete().eq('quiz_id', quiz.id);
      const { error } = await supabase.from('quizzes').delete().eq('id', quiz.id);
      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Quiz excluído!' });
      loadQuizzes();
    } catch {
      toast({ title: 'Erro', description: 'Erro ao excluir quiz.', variant: 'destructive' });
    }
  };

  // ─── Link quiz to curso ──────────────────────────────────────────────────
  const openLinkCursoDialog = (quiz: Quiz) => {
    setLinkingQuiz(quiz);
    setSelectedCursoId(quizCursoMap[quiz.id] || '');
    setShowLinkCursoModal(true);
  };

  const handleSaveCursoLink = async () => {
    if (!linkingQuiz || !selectedCursoId) return;
    setSavingLink(true);
    try {
      const { error } = await supabase.from('curso_quiz_mapping').upsert({
        curso_id: selectedCursoId,
        quiz_id: linkingQuiz.id,
        quiz_categoria: linkingQuiz.categoria || null,
      }, { onConflict: 'curso_id' });
      if (error) throw error;
      setQuizCursoMap(prev => ({ ...prev, [linkingQuiz.id]: selectedCursoId }));
      toast({ title: 'Sucesso', description: 'Quiz vinculado ao curso!' });
      setShowLinkCursoModal(false);
    } catch {
      toast({ title: 'Erro', description: 'Erro ao vincular quiz.', variant: 'destructive' });
    } finally { setSavingLink(false); }
  };

  const getCursoNameForQuiz = (quizId: string) => {
    const cursoId = quizCursoMap[quizId];
    if (!cursoId) return null;
    return cursosDB.find(c => c.id === cursoId)?.nome || null;
  };

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F7FF' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#2D2B6F' }}></div>
          <p style={{ color: '#2D2B6F' }} className="font-medium">Carregando quizzes...</p>
        </div>
      </div>
    );
  }

  return (
    <ERALayout>
      <div className="min-h-screen" style={{ background: '#F8F7FF' }}>

        {/* Hero */}
        <div className="w-full rounded-xl lg:rounded-2xl mb-6 lg:mb-8 shadow-md overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #2D2B6F 60%, #3D3A8F 100%)' }}>
          <div className="px-6 lg:px-10 py-8 lg:py-12">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#3AB26A' }}></div>
                  <span className="text-xs lg:text-sm font-medium text-white/80">Plataforma de Ensino</span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">Quizzes</h1>
                <p className="text-sm sm:text-base lg:text-lg text-white/80 max-w-2xl mb-4">
                  Visualize e gerencie todos os quizzes de conclusao de cursos
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  {[
                    { icon: HelpCircle, label: 'Avaliacoes interativas' },
                    { icon: Target, label: 'Certificacao automatica' },
                    { icon: Users, label: 'Progresso dos alunos' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2 text-xs lg:text-sm text-white/80">
                      <Icon className="h-4 w-4" style={{ color: '#3AB26A' }} />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {/* Stats inline */}
                <div className="flex gap-3">
                  {[
                    { label: 'Total', value: stats.total, icon: <BookOpen className="h-4 w-4" /> },
                    { label: 'Ativos', value: stats.ativos, icon: <CheckCircle className="h-4 w-4" /> },
                    { label: 'Perguntas', value: stats.total_perguntas, icon: <HelpCircle className="h-4 w-4" /> },
                  ].map((s) => (
                    <div key={s.label}
                      className="flex flex-col items-center justify-center rounded-xl px-4 py-3 text-center min-w-[72px]"
                      style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}>
                      <div style={{ color: '#3AB26A' }}>{s.icon}</div>
                      <span className="text-xl font-bold text-white mt-1">{s.value}</span>
                      <span className="text-xs text-white/70">{s.label}</span>
                    </div>
                  ))}
                </div>
                {isAdmin && (
                  <Button onClick={openNewQuizDialog}
                    className="text-white font-semibold rounded-xl flex items-center gap-2 justify-center transition-all hover:scale-105"
                    style={{ background: '#3AB26A' }}>
                    <Plus className="h-4 w-4" />
                    Novo Quiz
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 lg:px-6 pb-10">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total de Quizzes', value: stats.total, icon: <BookOpen className="h-6 w-6" />, color: '#2D2B6F' },
                { label: 'Quizzes Ativos', value: stats.ativos, icon: <CheckCircle className="h-6 w-6" />, color: '#3AB26A' },
                { label: 'Total Perguntas', value: stats.total_perguntas, icon: <HelpCircle className="h-6 w-6" />, color: '#7C3AED' },
                { label: 'Media Geral', value: `${stats.media_nota_geral}%`, icon: <Target className="h-6 w-6" />, color: '#F97316' },
              ].map((card) => (
                <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm flex items-center gap-4"
                  style={{ border: '1px solid #EDE9FE' }}>
                  <div className="rounded-lg p-2 flex-shrink-0" style={{ background: card.color + '18', color: card.color }}>
                    {card.icon}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                    <p className="text-2xl font-bold" style={{ color: '#1E1B4B' }}>{card.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ border: '1px solid #EDE9FE' }}>
              <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid #EDE9FE' }}>
                <div className="p-2 rounded-lg" style={{ background: '#EDE9FE' }}>
                  <Filter className="h-4 w-4" style={{ color: '#2D2B6F' }} />
                </div>
                <span className="font-semibold" style={{ color: '#1E1B4B' }}>Buscar Quizzes</span>
              </div>
              <div className="p-5">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Buscar por titulo ou categoria..."
                      value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-10 border-2 rounded-lg" style={{ borderColor: '#EDE9FE' }} />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-44 h-10 border-2 rounded-lg" style={{ borderColor: '#EDE9FE' }}>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Status</SelectItem>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                    <SelectTrigger className="w-full md:w-52 h-10 border-2 rounded-lg" style={{ borderColor: '#EDE9FE' }}>
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas as Categorias</SelectItem>
                      {getUniqueCategories().map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Quizzes Grid */}
            {filteredQuizzes.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center" style={{ border: '1px solid #EDE9FE' }}>
                <FileText className="h-12 w-12 mx-auto mb-4" style={{ color: '#A5B4FC' }} />
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#1E1B4B' }}>Nenhum quiz encontrado</h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== 'todos' || categoriaFilter !== 'todos'
                    ? 'Tente ajustar os filtros de busca.' : 'Ainda nao ha quizzes configurados.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredQuizzes.map((quiz) => {
                  const colors = getCategoryColor(quiz.categoria);
                  const linkedCurso = getCursoNameForQuiz(quiz.id);
                  return (
                    <div key={quiz.id}
                      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 relative group"
                      style={{ border: '1px solid #EDE9FE', borderTop: `4px solid ${colors.border}` }}>

                      {/* Admin action menu */}
                      {isAdmin && (
                        <div className="absolute top-3 right-3 z-10">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/90 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white">
                                <MoreVertical className="h-4 w-4 text-slate-500"/>
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem onClick={() => handleViewQuestions(quiz)}>
                                <Edit className="h-3.5 w-3.5 mr-2"/>Ver / Editar perguntas
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openLinkCursoDialog(quiz)}>
                                <Link2 className="h-3.5 w-3.5 mr-2"/>Vincular a curso
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteQuiz(quiz)} className="text-red-600 focus:text-red-600">
                                <Trash2 className="h-3.5 w-3.5 mr-2"/>Excluir quiz
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}

                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0 pr-8">
                            <h3 className="font-bold text-base mb-2 truncate" style={{ color: '#1E1B4B' }}>
                              {quiz.titulo}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                                style={{ background: colors.bg, color: colors.text }}>
                                {quiz.categoria}
                              </span>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${quiz.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                {quiz.ativo ? 'Ativo' : 'Inativo'}
                              </span>
                              {linkedCurso && (
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                                  📚 {linkedCurso}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: colors.bg }}>
                            <HelpCircle className="h-5 w-5" style={{ color: colors.border }} />
                          </div>
                        </div>

                        <div className="rounded-lg p-3 space-y-2 mb-4"
                          style={{ background: '#F8F7FF', border: '1px solid #EDE9FE' }}>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <HelpCircle className="h-3.5 w-3.5 flex-shrink-0" style={{ color: colors.border }} />
                            <span className="font-medium">Perguntas:</span><span>{quiz.total_perguntas}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Target className="h-3.5 w-3.5 flex-shrink-0" style={{ color: colors.border }} />
                            <span className="font-medium">Media:</span><span>{quiz.media_nota}%</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-3.5 w-3.5 flex-shrink-0" style={{ color: colors.border }} />
                            <span className="font-medium">Criado:</span><span>{formatDate(quiz.data_criacao)}</span>
                          </div>
                        </div>

                        {quiz.descricao && (
                          <p className="text-xs text-gray-500 mb-4 line-clamp-2">{quiz.descricao}</p>
                        )}

                        <Button size="sm" onClick={() => handleViewQuestions(quiz)}
                          className="w-full text-white font-medium transition-all duration-200 hover:opacity-90"
                          style={{ background: 'linear-gradient(135deg, #1E1B4B, #2D2B6F)' }}>
                          <Eye className="h-4 w-4 mr-1.5" />
                          {isAdmin ? 'Ver / Editar Perguntas' : 'Ver Perguntas'}
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {/* Add new quiz card */}
                {isAdmin && (
                  <div className="bg-white rounded-xl overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer"
                    style={{ border: '2px dashed #A5B4FC' }}
                    onClick={openNewQuizDialog}>
                    <div className="p-8 flex flex-col items-center justify-center text-center h-full min-h-[220px]">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ background: '#EDE9FE' }}>
                        <Plus className="h-7 w-7" style={{ color: '#2D2B6F' }} />
                      </div>
                      <h3 className="font-bold text-base mb-1" style={{ color: '#1E1B4B' }}>Adicionar Novo Quiz</h3>
                      <p className="text-sm text-gray-500">Crie um novo quiz para um curso</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══ MODAL: Perguntas (View/Edit) ══════════════════════════════════ */}
            <Dialog open={showQuestionsModal} onOpenChange={setShowQuestionsModal}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <DialogTitle className="flex items-center gap-2" style={{ color: '#1E1B4B' }}>
                      <div className="p-2 rounded-lg" style={{ background: '#EDE9FE' }}>
                        <HelpCircle className="h-5 w-5" style={{ color: '#2D2B6F' }} />
                      </div>
                      <span>Perguntas: {selectedQuiz?.titulo}</span>
                    </DialogTitle>
                    <Button size="sm" onClick={() => setShowQuestionsModal(false)}
                      className="text-white" style={{ background: 'linear-gradient(135deg, #1E1B4B, #2D2B6F)' }}>
                      <ArrowLeft className="h-4 w-4 mr-1" />Voltar
                    </Button>
                  </div>
                </DialogHeader>

                <div className="space-y-5 mt-2">
                  {questions.length === 0 && !addingNewQuestion ? (
                    <div className="text-center py-10">
                      <HelpCircle className="h-12 w-12 mx-auto mb-4" style={{ color: '#A5B4FC' }} />
                      <p className="text-gray-500">Nenhuma pergunta configurada para este quiz.</p>
                    </div>
                  ) : (
                    questions.map((question, index) => (
                      <div key={question.id} className="bg-white rounded-xl overflow-hidden shadow-sm"
                        style={{ border: '1px solid #EDE9FE' }}>
                        <div className="px-5 py-4 flex items-center justify-between"
                          style={{ background: 'linear-gradient(135deg, #1E1B4B, #2D2B6F)' }}>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                              style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                              {index + 1}
                            </span>
                            <h3 className="text-sm font-semibold text-white">
                              {isEditing && editingQuestion?.id === question.id ? 'Editando Pergunta' : question.pergunta}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1">
                            {!isEditing && isAdmin && (
                              <>
                                <Button size="sm" onClick={() => handleEditQuestion(question)}
                                  className="text-white border-white/30 hover:bg-white/20"
                                  style={{ background: 'rgba(255,255,255,0.15)' }}>
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="sm" onClick={() => handleDeleteQuestion(question)}
                                  className="text-white border-white/30 hover:bg-red-500/20"
                                  style={{ background: 'rgba(255,255,255,0.10)' }}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                            {!isEditing && !isAdmin && (
                              <Button size="sm" onClick={() => handleEditQuestion(question)}
                                className="text-white border-white/30 hover:bg-white/20"
                                style={{ background: 'rgba(255,255,255,0.15)' }}>
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="p-5">
                          {isEditing && editingQuestion?.id === question.id ? (
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Pergunta</label>
                                <Textarea value={editingQuestion.pergunta}
                                  onChange={(e) => setEditingQuestion({ ...editingQuestion, pergunta: e.target.value })}
                                  placeholder="Digite a pergunta..." rows={3} />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Opcoes</label>
                                <div className="space-y-2">
                                  {editingQuestion.opcoes.map((option, optionIndex) => (
                                    <div key={optionIndex} className="flex items-center gap-2">
                                      <Input value={option}
                                        onChange={(e) => handleUpdateOption(index, optionIndex, e.target.value)}
                                        placeholder={`Opcao ${optionIndex + 1}`} className="flex-1" />
                                      <input type="radio" name={`resposta_${question.id}`}
                                        checked={editingQuestion.resposta_correta === optionIndex}
                                        onChange={() => setEditingQuestion({ ...editingQuestion, resposta_correta: optionIndex })}
                                        className="ml-1" />
                                      <Button size="sm" variant="outline"
                                        onClick={() => handleRemoveOption(index, optionIndex)}
                                        disabled={editingQuestion.opcoes.length <= 2}>
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                  <Button size="sm" variant="outline" onClick={() => handleAddOption(index)} className="w-full">
                                    <Plus className="h-4 w-4 mr-1" />Adicionar Opcao
                                  </Button>
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Explicacao (opcional)</label>
                                <Textarea value={editingQuestion.explicacao || ''}
                                  onChange={(e) => setEditingQuestion({ ...editingQuestion, explicacao: e.target.value })}
                                  placeholder="Explicacao da resposta correta..." rows={2} />
                              </div>
                              <div className="flex gap-2 pt-2">
                                <Button onClick={handleSaveQuestion} disabled={saving}
                                  className="flex-1 text-white" style={{ background: 'linear-gradient(135deg, #1E1B4B, #2D2B6F)' }}>
                                  {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</>
                                    : <><Save className="h-4 w-4 mr-2" />Salvar</>}
                                </Button>
                                <Button variant="outline" onClick={() => { setEditingQuestion(null); setIsEditing(false); }}
                                  className="flex-1">Cancelar</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {question.opcoes.map((option, optionIndex) => (
                                <div key={optionIndex} className="p-3 rounded-lg flex items-center gap-2"
                                  style={{
                                    background: optionIndex === question.resposta_correta ? '#F0FDF4' : '#F8F7FF',
                                    border: `1px solid ${optionIndex === question.resposta_correta ? '#BBF7D0' : '#EDE9FE'}`
                                  }}>
                                  <span className="text-sm font-semibold" style={{ color: '#2D2B6F' }}>
                                    {String.fromCharCode(65 + optionIndex)}.
                                  </span>
                                  <span className="text-sm flex-1">{option}</span>
                                  {optionIndex === question.resposta_correta && (
                                    <CheckCircle className="h-4 w-4 flex-shrink-0" style={{ color: '#3AB26A' }} />
                                  )}
                                </div>
                              ))}
                              {question.explicacao && (
                                <div className="mt-3 p-3 rounded-lg" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                                  <p className="text-sm text-blue-800"><strong>Explicacao:</strong> {question.explicacao}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  {/* Add new question to existing quiz (admin only) */}
                  {isAdmin && !addingNewQuestion && (
                    <Button variant="outline" className="w-full flex items-center gap-2 border-dashed border-slate-300 rounded-xl"
                      onClick={() => { setAddingNewQuestion(true); setNewQuestionForExisting(emptyNewQuestion()); }}>
                      <Plus className="h-4 w-4" />Nova pergunta
                    </Button>
                  )}

                  {isAdmin && addingNewQuestion && (
                    <div className="bg-white rounded-xl shadow-sm p-5 space-y-4" style={{ border: '1px solid #EDE9FE' }}>
                      <p className="text-sm font-semibold" style={{ color: '#1E1B4B' }}>Nova Pergunta</p>
                      <div>
                        <Label className="text-xs font-medium text-gray-700 mb-1.5 block">Pergunta *</Label>
                        <Textarea value={newQuestionForExisting.pergunta}
                          onChange={e => setNewQuestionForExisting(p => ({ ...p, pergunta: e.target.value }))}
                          placeholder="Digite a pergunta..." rows={2} />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-700 mb-1.5 block">Opções</Label>
                        <div className="space-y-2">
                          {newQuestionForExisting.opcoes.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <Input value={opt}
                                onChange={e => {
                                  const upd = [...newQuestionForExisting.opcoes]; upd[i] = e.target.value;
                                  setNewQuestionForExisting(p => ({ ...p, opcoes: upd }));
                                }}
                                placeholder={`Opção ${i + 1}`} className="flex-1" />
                              <input type="radio" name="new_q_resposta"
                                checked={newQuestionForExisting.resposta_correta === i}
                                onChange={() => setNewQuestionForExisting(p => ({ ...p, resposta_correta: i }))} />
                              {newQuestionForExisting.opcoes.length > 2 && (
                                <Button size="sm" variant="outline"
                                  onClick={() => {
                                    const upd = newQuestionForExisting.opcoes.filter((_, j) => j !== i);
                                    setNewQuestionForExisting(p => ({ ...p, opcoes: upd, resposta_correta: Math.min(p.resposta_correta, upd.length - 1) }));
                                  }}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button size="sm" variant="outline" className="w-full"
                            onClick={() => setNewQuestionForExisting(p => ({ ...p, opcoes: [...p.opcoes, ''] }))}>
                            <Plus className="h-4 w-4 mr-1" />Adicionar opção
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-700 mb-1.5 block">Explicação (opcional)</Label>
                        <Input value={newQuestionForExisting.explicacao}
                          onChange={e => setNewQuestionForExisting(p => ({ ...p, explicacao: e.target.value }))}
                          placeholder="Explicação da resposta..." />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleSaveNewQuestionToExisting} disabled={saving}
                          className="flex-1 text-white" style={{ background: '#3AB26A' }}>
                          {saving ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Salvando...</> : 'Salvar pergunta'}
                        </Button>
                        <Button variant="outline" onClick={() => setAddingNewQuestion(false)} className="flex-1">Cancelar</Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-center pt-4 border-t mt-4">
                  <Button variant="outline" onClick={() => setShowQuestionsModal(false)} className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />Voltar para Quizzes
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* ══ MODAL: Novo Quiz (2 etapas) ═══════════════════════════════════ */}
            <Dialog open={showNewQuizModal} onOpenChange={setShowNewQuizModal}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2" style={{ color: '#1E1B4B' }}>
                    <div className="p-2 rounded-lg" style={{ background: '#EDE9FE' }}>
                      <Plus className="h-5 w-5" style={{ color: '#2D2B6F' }} />
                    </div>
                    Novo Quiz — Etapa {newQuizStep} de 2
                  </DialogTitle>
                </DialogHeader>

                {/* Progress indicator */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: '#3AB26A' }} />
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: newQuizStep === 2 ? '#3AB26A' : '#E5E7EB' }} />
                </div>

                {newQuizStep === 1 ? (
                  /* ── Etapa 1: Dados do quiz ─── */
                  <div className="space-y-4 mt-2">
                    <div>
                      <Label className="text-xs font-medium text-gray-700 mb-1.5 block">Título *</Label>
                      <Input value={newQuizForm.titulo}
                        onChange={e => setNewQuizForm(p => ({ ...p, titulo: e.target.value }))}
                        placeholder="Ex: Quiz PABX — Módulo 1" />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700 mb-1.5 block">Descrição</Label>
                      <Textarea value={newQuizForm.descricao}
                        onChange={e => setNewQuizForm(p => ({ ...p, descricao: e.target.value }))}
                        placeholder="Descrição do quiz..." rows={3} />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700 mb-1.5 block">Categoria</Label>
                      <Input value={newQuizForm.categoria}
                        onChange={e => setNewQuizForm(p => ({ ...p, categoria: e.target.value }))}
                        placeholder="Ex: PABX, CALLCENTER, PYTHON..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-gray-700 mb-1.5 block">Nota mínima (%)</Label>
                        <Input type="number" value={newQuizForm.nota_minima}
                          onChange={e => setNewQuizForm(p => ({ ...p, nota_minima: parseInt(e.target.value) || 70 }))}
                          min={0} max={100} />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-700 mb-1.5 block">Status</Label>
                        <button
                          onClick={() => setNewQuizForm(p => ({ ...p, ativo: !p.ativo }))}
                          className={`w-full h-10 rounded-lg border-2 text-sm font-medium transition-all ${
                            newQuizForm.ativo
                              ? 'bg-green-50 border-green-300 text-green-800'
                              : 'bg-gray-50 border-gray-200 text-gray-500'
                          }`}>
                          {newQuizForm.ativo ? '✓ Ativo' : '✗ Inativo'}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button onClick={() => {
                        if (!newQuizForm.titulo.trim()) {
                          toast({ title: 'Erro', description: 'Informe o título.', variant: 'destructive' }); return;
                        }
                        setNewQuizStep(2);
                      }}
                        className="text-white flex items-center gap-2"
                        style={{ background: 'linear-gradient(135deg, #1E1B4B, #2D2B6F)' }}>
                        Próximo: Adicionar perguntas <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* ── Etapa 2: Perguntas ─── */
                  <div className="space-y-4 mt-2">
                    {newQuizQuestions.map((q, qIndex) => (
                      <div key={qIndex} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-700">Pergunta {qIndex + 1}</p>
                          {newQuizQuestions.length > 1 && (
                            <button onClick={() => setNewQuizQuestions(p => p.filter((_, i) => i !== qIndex))}
                              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors">
                              <Trash2 className="h-3.5 w-3.5 text-red-400" />
                            </button>
                          )}
                        </div>
                        <Textarea value={q.pergunta}
                          onChange={e => {
                            const upd = [...newQuizQuestions]; upd[qIndex] = { ...upd[qIndex], pergunta: e.target.value };
                            setNewQuizQuestions(upd);
                          }}
                          placeholder="Digite a pergunta..." rows={2} />
                        <div className="space-y-2">
                          {q.opcoes.map((opt, oIndex) => (
                            <div key={oIndex} className="flex items-center gap-2">
                              <Input value={opt}
                                onChange={e => {
                                  const updQ = [...newQuizQuestions];
                                  const updO = [...updQ[qIndex].opcoes]; updO[oIndex] = e.target.value;
                                  updQ[qIndex] = { ...updQ[qIndex], opcoes: updO };
                                  setNewQuizQuestions(updQ);
                                }}
                                placeholder={`Opção ${oIndex + 1}`} className="flex-1" />
                              <input type="radio" name={`nq_resp_${qIndex}`}
                                checked={q.resposta_correta === oIndex}
                                onChange={() => {
                                  const upd = [...newQuizQuestions]; upd[qIndex] = { ...upd[qIndex], resposta_correta: oIndex };
                                  setNewQuizQuestions(upd);
                                }} />
                              {q.opcoes.length > 2 && (
                                <button onClick={() => {
                                  const updQ = [...newQuizQuestions];
                                  updQ[qIndex] = { ...updQ[qIndex], opcoes: updQ[qIndex].opcoes.filter((_, j) => j !== oIndex), resposta_correta: Math.min(updQ[qIndex].resposta_correta, updQ[qIndex].opcoes.length - 2) };
                                  setNewQuizQuestions(updQ);
                                }} className="w-7 h-7 rounded flex items-center justify-center hover:bg-red-50">
                                  <Trash2 className="h-3 w-3 text-red-400" />
                                </button>
                              )}
                            </div>
                          ))}
                          <Button size="sm" variant="outline" className="w-full"
                            onClick={() => {
                              const upd = [...newQuizQuestions];
                              upd[qIndex] = { ...upd[qIndex], opcoes: [...upd[qIndex].opcoes, ''] };
                              setNewQuizQuestions(upd);
                            }}>
                            <Plus className="h-3.5 w-3.5 mr-1" />Opção
                          </Button>
                        </div>
                        <Input value={q.explicacao}
                          onChange={e => {
                            const upd = [...newQuizQuestions]; upd[qIndex] = { ...upd[qIndex], explicacao: e.target.value };
                            setNewQuizQuestions(upd);
                          }}
                          placeholder="Explicação (opcional)" />
                      </div>
                    ))}

                    <Button variant="outline" className="w-full border-dashed border-slate-300 rounded-xl flex items-center gap-2"
                      onClick={() => setNewQuizQuestions(p => [...p, { ...emptyNewQuestion(), ordem: p.length + 1 }])}>
                      <Plus className="h-4 w-4" />Adicionar pergunta
                    </Button>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" onClick={() => setNewQuizStep(1)}
                        className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />Voltar
                      </Button>
                      <Button onClick={handleSaveNewQuiz} disabled={savingNewQuiz}
                        className="flex-1 text-white" style={{ background: '#3AB26A' }}>
                        {savingNewQuiz
                          ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Salvando...</>
                          : <><Save className="h-4 w-4 mr-1" />Salvar quiz</>}
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* ══ MODAL: Vincular quiz a curso ══════════════════════════════════ */}
            <Dialog open={showLinkCursoModal} onOpenChange={setShowLinkCursoModal}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2" style={{ color: '#1E1B4B' }}>
                    <Link2 className="h-5 w-5" style={{ color: '#3AB26A' }} />
                    Vincular a curso
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <p className="text-sm text-slate-600">
                    Vincular <strong>{linkingQuiz?.titulo}</strong> a um curso:
                  </p>
                  <Select value={selectedCursoId} onValueChange={setSelectedCursoId}>
                    <SelectTrigger className="w-full rounded-lg border-slate-200">
                      <SelectValue placeholder="Selecione um curso" />
                    </SelectTrigger>
                    <SelectContent>
                      {cursosDB.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveCursoLink} disabled={savingLink || !selectedCursoId}
                      className="flex-1 text-white" style={{ background: '#3AB26A' }}>
                      {savingLink ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Salvando...</> : 'Vincular'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowLinkCursoModal(false)}>Cancelar</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

          </div>
        </div>
      </div>
    </ERALayout>
  );
};

export default Quizzes;
