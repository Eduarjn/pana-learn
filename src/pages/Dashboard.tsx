import { ERALayout } from '@/components/ERALayout';
import { DashboardStats } from '@/components/DashboardStats';
import { CourseCard } from '@/components/CourseCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCourses } from '@/hooks/useCourses';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats, useRecentActivity, useCategoryProgress } from '@/hooks/useDashboardStats';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { useMonthlyUsage } from '@/hooks/useMonthlyUsage';
import {
  CheckCircle, Video, Award, Clock, BookOpen,
  TrendingUp, Settings, Users, ArrowRight, BookMarked, MonitorPlay,
  Zap, HardDrive, BarChart3, ShieldAlert, PlayCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fadeInUp, fadeIn, staggerContainer, cardItem, cardHover, staggerFast } from '@/lib/animations';
import { RotatingWords } from '@/components/ui/animated-hero';
import { PanaLoader } from '@/components/ui/pana-loader';

const formatTimeAgo = (d: string) => {
  if (!d) return '—';
  const ts = new Date(d).getTime();
  if (isNaN(ts)) return '—';
  const diff = Math.floor((Date.now() - ts) / 60000);
  if (diff < 1) return 'agora mesmo';
  if (diff < 60) return `${diff} min atrás`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `${h}h atrás`;
  const days = Math.floor(h / 24);
  return `${days} dia${days > 1 ? 's' : ''} atrás`;
};

const getActivityIcon = (type: string) => {
  if (type === 'course_completed')   return <CheckCircle className="h-4 w-4 text-pana-teal" />;
  if (type === 'course_started')     return <Video className="h-4 w-4 text-pana-grape" />;
  if (type === 'certificate_earned') return <Award className="h-4 w-4 text-pana-teal" />;
  return <Clock className="h-4 w-4 text-muted-foreground" />;
};

const getActivityText = (a: { type: string; user_name: string; course_name?: string; category_name?: string }) => {
  if (a.type === 'course_completed')   return `${a.user_name} completou o curso ${a.course_name ?? 'desconhecido'}`;
  if (a.type === 'course_started')     return `${a.user_name} iniciou o curso ${a.course_name ?? 'desconhecido'}`;
  if (a.type === 'certificate_earned') return `${a.user_name} conquistou um certificado${a.category_name ? ` de ${a.category_name}` : ''}`;
  return 'Atividade realizada';
};

// Acento por categoria — restrito à paleta da marca
const CATEGORY_ACCENT: Record<string, string> = {
  PABX: '#4B3F72', CALLCENTER: '#1F2041', OMNICHANNEL: '#417B5A', VoIP: '#356649',
};
const accentFor = (cat: string) => CATEGORY_ACCENT[cat] ?? '#4B3F72';

const Dashboard = () => {
  const { data: courses = [], isLoading: coursesLoading } = useCourses();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const { data: stats } = useDashboardStats();
  const { data: recentActivities } = useRecentActivity();
  const { data: categoryProgress } = useCategoryProgress(userProfile?.id);
  const { data: planLimits } = usePlanLimits();
  const { data: monthlyUsage } = useMonthlyUsage();

  const isAdmin = userProfile?.tipo_usuario === 'admin' || userProfile?.tipo_usuario === 'admin_master';
  const userName = userProfile?.nome?.split(' ')[0] || 'aluno';

  // Bloco "continuar de onde parou": categoria em progresso com maior avanço
  const inProgress = (categoryProgress ?? [])
    .filter(c => c.progress > 0 && c.progress < 100)
    .sort((a, b) => b.progress - a.progress);
  const continueItem = inProgress[0] ?? null;

  const courseIdFor = (name?: string, cat?: string) => {
    const match = courses.find(c => c.nome === name) ?? courses.find(c => c.categoria === cat);
    return match?.id;
  };
  const goToContinue = () => {
    const id = continueItem ? courseIdFor(continueItem.course_name, continueItem.categoria) : courses[0]?.id;
    navigate(id ? `/curso/${id}` : '/treinamentos');
  };

  const avgProgress = categoryProgress?.length
    ? Math.round(categoryProgress.reduce((s, c) => s + c.progress, 0) / categoryProgress.length)
    : 0;
  const modulesDone = categoryProgress?.reduce((s, c) => s + c.modules_completed, 0) ?? 0;

  const learnerStats = [
    { icon: BookMarked, label: 'Cursos disponíveis', value: courses.length,    accent: '#1F2041', bg: 'bg-pana-indigo-muted', border: 'border-pana-indigo/10' },
    { icon: Award,      label: 'Módulos concluídos', value: modulesDone,        accent: '#417B5A', bg: 'bg-pana-teal-muted',   border: 'border-pana-teal/15' },
    { icon: TrendingUp, label: 'Progresso médio',    value: `${avgProgress}%`,  accent: '#4B3F72', bg: 'bg-pana-grape-muted',  border: 'border-pana-grape/15' },
    { icon: Clock,      label: 'Em andamento',       value: inProgress.length,  accent: '#7a5840', bg: 'bg-pana-petal/50',     border: 'border-pana-petal' },
  ];

  return (
    <ERALayout>
      <div className="min-h-screen bg-pana-bg font-inter">

        {/* Header de marca — sóbrio, sólido indigo */}
        <motion.header
          initial="hidden" animate="visible" variants={fadeIn}
          className="relative w-full rounded-2xl mb-6 lg:mb-8 overflow-hidden bg-pana-indigo"
        >
          {/* Acento decorativo discreto (sem gradiente flashy) */}
          <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 rounded-full opacity-[0.07] bg-pana-teal" />
          <div className="pointer-events-none absolute right-24 -bottom-24 w-72 h-72 rounded-full opacity-[0.05] bg-pana-grape" />

          <div className="relative px-6 lg:px-10 py-8 lg:py-10">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
              <motion.div variants={staggerContainer} initial="hidden" animate="visible">
                <motion.div variants={fadeInUp} className="flex items-center gap-2 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-pana-teal" />
                  <span className="text-[11px] font-medium uppercase tracking-[0.07em] text-pana-bone/80">
                    Plataforma de ensino
                  </span>
                </motion.div>
                <motion.h1 variants={fadeInUp} className="font-quicksand font-bold text-3xl lg:text-4xl text-white mb-1">
                  Olá, {userName}
                </motion.h1>
                <motion.div variants={fadeInUp} className="font-quicksand font-semibold text-lg lg:text-xl text-white/90 mb-2 flex items-center gap-2">
                  <span>Vamos aprender algo</span>
                  <RotatingWords words={['novo', 'prático', 'útil', 'marcante']} className="text-pana-petal" />
                </motion.div>
                <motion.p variants={fadeInUp} className="text-sm text-pana-bone/80 max-w-xl">
                  {courses.length > 0
                    ? `Você tem ${courses.length} curso${courses.length > 1 ? 's' : ''} disponíve${courses.length > 1 ? 'is' : 'l'}. Bons estudos.`
                    : 'Seus cursos aparecerão aqui assim que forem publicados.'}
                </motion.p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-stretch gap-3 w-full sm:w-auto"
              >
                {isAdmin && stats && (
                  <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
                    {[
                      { value: stats.totalUsers ?? 0,                label: 'Usuários' },
                      { value: stats.totalCourses ?? courses.length, label: 'Cursos' },
                      { value: stats.totalCertificates ?? 0,         label: 'Certificados' },
                      { value: `${stats.completionRate ?? 0}%`,      label: 'Conclusão' },
                    ].map(({ value, label }) => (
                      <div key={label}
                        className="flex flex-col items-center justify-center rounded-lg px-4 py-2.5 text-center min-w-[78px] bg-white/[0.08] border border-white/10">
                        <span className="font-quicksand font-bold text-lg text-white leading-tight">{value}</span>
                        <span className="text-[10px] text-pana-bone/70 uppercase tracking-wider font-medium mt-0.5">{label}</span>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  onClick={() => navigate('/treinamentos')}
                  className="bg-pana-teal hover:bg-pana-teal-dark text-white font-medium rounded-lg h-11 gap-2"
                >
                  <MonitorPlay className="h-4 w-4" />
                  Acessar meus cursos
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.header>

        <div className="px-4 lg:px-6 pb-10">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Continuar de onde parou — destaque educativo */}
            {!coursesLoading && courses.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-xl shadow-sm overflow-hidden border"
                style={{
                  background: (continueItem ? accentFor(continueItem.categoria) : '#417B5A') + '0C',
                  borderColor: (continueItem ? accentFor(continueItem.categoria) : '#417B5A') + '26',
                }}
              >
                <div className="flex flex-col sm:flex-row items-stretch">
                  <div
                    className="flex items-center justify-center px-6 py-5 sm:py-0 sm:w-16 flex-shrink-0"
                    style={{ background: (continueItem ? accentFor(continueItem.categoria) : '#417B5A') + '1F' }}
                  >
                    <PlayCircle
                      className="h-8 w-8"
                      style={{ color: continueItem ? accentFor(continueItem.categoria) : '#417B5A' }}
                    />
                  </div>
                  <div className="flex-1 px-6 py-5">
                    <p className="text-[11px] font-medium uppercase tracking-[0.07em] text-muted-foreground mb-1">
                      {continueItem ? 'Continue de onde parou' : 'Comece por aqui'}
                    </p>
                    <h3 className="font-quicksand font-semibold text-lg text-foreground">
                      {continueItem ? continueItem.course_name || continueItem.categoria : courses[0].nome}
                    </h3>
                    {continueItem && (
                      <div className="mt-3 max-w-md">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs text-muted-foreground">
                            {continueItem.modules_completed} de {continueItem.total_modules} módulos
                          </span>
                          <span className="text-xs font-semibold" style={{ color: accentFor(continueItem.categoria) }}>
                            {continueItem.progress}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden bg-muted">
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: `${continueItem.progress}%` }}
                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            className="h-full rounded-full"
                            style={{ background: accentFor(continueItem.categoria) }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center px-6 py-5 sm:py-0">
                    <Button onClick={goToContinue} className="bg-pana-grape hover:bg-pana-grape-dark text-pana-petal font-medium rounded-lg h-10 gap-2 w-full sm:w-auto">
                      {continueItem ? 'Continuar' : 'Começar'}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.section>
            )}

            {/* Métricas resumidas do aluno */}
            <motion.div
              variants={staggerFast} initial="hidden" whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {learnerStats.map(({ icon: Icon, label, value, accent, bg, border }) => (
                <motion.div key={label} variants={cardItem} whileHover={cardHover}
                  className={`${bg} ${border} rounded-xl p-5 shadow-sm border flex items-center gap-4`}
                >
                  <div className="rounded-lg p-2.5 flex-shrink-0 bg-white/70" style={{ color: accent }}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-quicksand font-bold text-2xl leading-tight" style={{ color: accent }}>{value}</p>
                    <p className="text-[13px] text-foreground/70 mt-0.5 truncate">{label}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Atividade recente + progresso por categoria */}
            <motion.div
              variants={staggerFast} initial="hidden" whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Atividade recente */}
              <motion.div variants={cardItem}
                className="bg-card rounded-xl shadow-sm overflow-hidden border border-border flex flex-col"
              >
                <div className="px-5 py-4 flex items-center gap-3 border-b border-pana-grape/10 bg-pana-grape-muted/40">
                  <div className="p-2 rounded-lg bg-white shadow-sm">
                    <Clock className="h-4 w-4 text-pana-grape" />
                  </div>
                  <div>
                    <h3 className="font-quicksand font-semibold text-foreground">Atividade recente</h3>
                    <p className="text-xs text-muted-foreground">Últimas ações na plataforma</p>
                  </div>
                </div>
                <div className="p-5 flex-1">
                  {recentActivities && recentActivities.length > 0 ? (
                    <div className="space-y-3">
                      {recentActivities.map(activity => (
                        <div key={activity.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border/50"
                        >
                          <div className="mt-0.5 flex-shrink-0 bg-card p-1.5 rounded-md shadow-sm border border-border">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground leading-snug">{getActivityText(activity)}</p>
                            <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(activity.created_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <Clock className="h-9 w-9 mb-3 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">Nenhuma atividade recente</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Progresso por categoria */}
              <motion.div variants={cardItem}
                className="bg-card rounded-xl shadow-sm overflow-hidden border border-border flex flex-col"
              >
                <div className="px-5 py-4 flex items-center gap-3 border-b border-pana-teal/10 bg-pana-teal-muted/40">
                  <div className="p-2 rounded-lg bg-white shadow-sm">
                    <TrendingUp className="h-4 w-4 text-pana-teal" />
                  </div>
                  <div>
                    <h3 className="font-quicksand font-semibold text-foreground">Progresso por categoria</h3>
                    <p className="text-xs text-muted-foreground">Acompanhe seu avanço nos cursos</p>
                  </div>
                </div>
                <div className="p-5 flex-1">
                  {categoryProgress && categoryProgress.length > 0 ? (
                    <div className="space-y-5">
                      {categoryProgress.map(cat => {
                        const accent = accentFor(cat.categoria);
                        return (
                          <div key={cat.categoria}>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-foreground">{cat.categoria}</span>
                              <span className="text-sm font-semibold" style={{ color: accent }}>{cat.progress}%</span>
                            </div>
                            <div className="h-2 rounded-full overflow-hidden bg-muted">
                              <motion.div
                                initial={{ width: 0 }} whileInView={{ width: `${cat.progress}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                className="h-full rounded-full"
                                style={{ background: accent }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <TrendingUp className="h-9 w-9 mb-3 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">Nenhum progresso disponível</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>

            {/* Painel detalhado (abas) */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="bg-card rounded-xl shadow-sm overflow-hidden border border-border"
            >
              <Tabs defaultValue="user" className="w-full">
                <div className="px-5 py-3 border-b border-pana-indigo/10 bg-pana-indigo-muted/30">
                  <TabsList>
                    <TabsTrigger value="user">Meu painel</TabsTrigger>
                    {isAdmin && <TabsTrigger value="admin">Administração</TabsTrigger>}
                  </TabsList>
                </div>

                <TabsContent value="user" className="p-5 outline-none m-0">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Cursos disponíveis</p>
                      <p className="font-quicksand font-bold text-2xl text-foreground">{courses.length}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Módulos concluídos</p>
                      <p className="font-quicksand font-bold text-2xl text-foreground">{modulesDone}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Progresso médio</p>
                      <p className="font-quicksand font-bold text-2xl text-foreground">{avgProgress}%</p>
                    </div>
                  </div>
                </TabsContent>

                {isAdmin && (
                  <TabsContent value="admin" className="p-5 outline-none m-0">
                    <DashboardStats />
                  </TabsContent>
                )}
              </Tabs>
            </motion.div>

            {/* Uso do plano */}
            {isAdmin && planLimits && (
              <motion.div
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                className="bg-card rounded-xl shadow-sm overflow-hidden border border-border"
              >
                <div className="px-5 py-4 flex items-center justify-between border-b" style={{ background: planLimits.planColor + '0C', borderColor: planLimits.planColor + '1F' }}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white shadow-sm" style={{ color: planLimits.planColor }}>
                      <BarChart3 className="h-4 w-4" style={{ color: planLimits.planColor }} />
                    </div>
                    <div>
                      <h3 className="font-quicksand font-semibold text-foreground">Uso do plano</h3>
                      <p className="text-xs text-muted-foreground">Plano {planLimits.planName} · {monthlyUsage?.currentMonth}</p>
                    </div>
                  </div>
                  {(planLimits.isAtLimit || planLimits.isNearLimit) && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{
                        background: planLimits.isAtLimit ? '#FEE2E2' : '#FEF3C7',
                        color: planLimits.isAtLimit ? '#DC2626' : '#D97706',
                      }}>
                      {planLimits.isAtLimit ? 'Limite atingido' : `${planLimits.usagePercent}% usado`}
                    </span>
                  )}
                </div>

                <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Usuários</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-quicksand font-bold text-2xl text-foreground">{planLimits.currentUsers}</span>
                      <span className="text-sm text-muted-foreground">/ {planLimits.maxUsers >= 9999 ? '∞' : planLimits.maxUsers}</span>
                    </div>
                    {planLimits.maxUsers < 9999 && (
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }} whileInView={{ width: `${planLimits.usagePercent}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                          className="h-full rounded-full"
                          style={{
                            background: planLimits.isAtLimit ? '#EF4444' : planLimits.isNearLimit ? '#F59E0B' : planLimits.planColor,
                          }}
                        />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {planLimits.maxUsers >= 9999 ? 'Ilimitado' : `${planLimits.remainingSlots} vagas restantes`}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Horas assistidas</span>
                    </div>
                    <div className="font-quicksand font-bold text-2xl text-foreground">{monthlyUsage?.totalWatchHours ?? '—'}</div>
                    <p className="text-xs text-muted-foreground">No mês atual</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Bandwidth estimado</span>
                    </div>
                    <div className="font-quicksand font-bold text-2xl text-foreground">{monthlyUsage?.totalGb ?? '—'}</div>
                    <p className="text-xs text-muted-foreground">Consumo de vídeo</p>
                  </div>
                </div>

                {planLimits.isAtLimit && (
                  <div className="px-5 pb-5">
                    <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                      <ShieldAlert className="h-4 w-4 flex-shrink-0" style={{ color: '#DC2626' }} />
                      <p className="text-sm" style={{ color: '#991B1B' }}>
                        Limite de usuários atingido. Entre em contato para fazer upgrade do seu plano.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Cursos recomendados */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="pt-2"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-quicksand font-bold text-xl text-foreground flex items-center gap-2.5">
                  <span className="w-1 h-5 rounded-full bg-pana-grape" />
                  Cursos recomendados
                </h2>
                <Button variant="outline" onClick={() => navigate('/treinamentos')} className="text-sm gap-2 h-9 border-pana-grape text-pana-grape hover:bg-pana-grape-muted">
                  Ver catálogo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              {coursesLoading ? (
                <div className="flex justify-center py-16">
                  <PanaLoader label="Carregando cursos..." />
                </div>
              ) : courses.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-xl border border-border">
                  <MonitorPlay className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-foreground font-medium">Nenhum curso disponível</p>
                  <p className="text-muted-foreground text-sm mt-1">Sua lista de cursos recomendados aparecerá aqui.</p>
                </div>
              ) : (
                <motion.div
                  variants={staggerFast} initial="hidden" whileInView="visible"
                  viewport={{ once: true }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                  {courses.slice(0, 4).map(course => (
                    <motion.div key={course.id} variants={cardItem} whileHover={cardHover}>
                      <CourseCard course={course} onStartCourse={(id) => navigate(`/curso/${id}`)} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>

            {isAdmin && (
              <div className="flex justify-center pt-6 pb-2">
                <Button variant="outline" onClick={() => navigate('/treinamentos')} className="gap-2 border-pana-grape text-pana-grape hover:bg-pana-grape-muted">
                  <Settings className="h-4 w-4" />
                  Gerenciar treinamentos
                </Button>
              </div>
            )}

          </div>
        </div>
      </div>
    </ERALayout>
  );
};

export default Dashboard;
