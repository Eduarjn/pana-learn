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
  Zap, HardDrive, BarChart3, ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const formatTimeAgo = (d: string) => {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (diff < 1) return 'agora mesmo';
  if (diff < 60) return `${diff} min atrás`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `${h}h atrás`;
  const days = Math.floor(h / 24);
  return `${days} dia${days > 1 ? 's' : ''} atrás`;
};

const getActivityIcon = (type: string) => {
  if (type === 'course_completed')   return <CheckCircle className="h-4 w-4 text-green-600" />;
  if (type === 'course_started')     return <Video className="h-4 w-4 text-blue-600" />;
  if (type === 'certificate_earned') return <Award className="h-4 w-4 text-orange-600" />;
  return <Clock className="h-4 w-4 text-gray-400" />;
};

const getActivityText = (a: { type: string; user_name: string; course_name?: string; category_name?: string }) => {
  if (a.type === 'course_completed')   return `${a.user_name} completou o curso ${a.course_name}`;
  if (a.type === 'course_started')     return `${a.user_name} iniciou o curso ${a.course_name}`;
  if (a.type === 'certificate_earned') return `${a.user_name} conquistou certificado de ${a.category_name}`;
  return 'Atividade realizada';
};

const CATEGORY_COLORS: Record<string, string> = {
  PABX: '#3B82F6', CALLCENTER: '#7C3AED', OMNICHANNEL: '#3AB26A', VoIP: '#F97316',
};

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
  const userName = userProfile?.nome?.split(' ')[0] || 'Usuário';

  return (
    <ERALayout>
      <div className="min-h-screen bg-background">
        
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
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">
                  Olá, {userName}!
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-white/80 max-w-2xl mb-4">
                  Você tem {courses.length} cursos disponíveis. Continue aprendendo!
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  {[
                    { icon: BookOpen, label: 'Cursos disponíveis' },
                    { icon: Clock,    label: 'Progresso contínuo' },
                    { icon: Award,    label: 'Certificações' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2 text-xs lg:text-sm text-white/80">
                      <Icon className="h-4 w-4" style={{ color: '#3AB26A' }} />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {stats && (
                  <div className="flex gap-3 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
                    {[
                      { value: stats.totalUsers ?? 0,                   label: 'Usuários' },
                      { value: stats.totalCourses ?? courses.length,    label: 'Cursos' },
                      { value: stats.totalCertificates ?? 0,             label: 'Certificados' },
                      { value: `${stats.completionRate ?? 0}%`,          label: 'Taxa' },
                    ].map(({ value, label }) => (
                      <div key={label}
                        className="flex flex-col items-center justify-center rounded-xl px-4 py-3 text-center min-w-[76px]"
                        style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}>
                        <span className="text-xl font-bold text-white leading-tight">{value}</span>
                        <span className="text-[11px] text-white/70 uppercase tracking-wider font-semibold mt-1">{label}</span>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  onClick={() => navigate('/treinamentos')}
                  className="text-white font-semibold rounded-xl flex items-center gap-2 justify-center transition-all hover:scale-105 h-11"
                  style={{ background: '#3AB26A' }}
                >
                  <MonitorPlay className="h-4 w-4" />
                  Acessar Meus Cursos
                </Button>
              </div>

            </div>
          </div>
        </div>

        <div className="px-4 lg:px-6 pb-10">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Dashboard Stats & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Atividade recente */}
              <div className="bg-card rounded-xl shadow-sm overflow-hidden border border-border flex flex-col h-full">
                <div className="px-5 py-4 flex items-center gap-3 border-b border-border bg-muted/30">
                  <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
                    <Clock className="h-4 w-4 text-indigo-700 dark:text-indigo-400" />
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Atividade Recente</span>
                    <p className="text-xs text-muted-foreground">Últimas ações na plataforma</p>
                  </div>
                </div>
                <div className="p-5 flex-1">
                  {recentActivities && recentActivities.length > 0 ? (
                    <div className="space-y-3">
                      {recentActivities.map(activity => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                          <div className="mt-0.5 flex-shrink-0 bg-background p-1.5 rounded-md shadow-sm border border-border">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground font-medium leading-snug">{getActivityText(activity)}</p>
                            <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(activity.created_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                      <Clock className="h-10 w-10 mb-3 text-muted-foreground/30" />
                      <p className="text-sm font-medium text-muted-foreground">Nenhuma atividade recente</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Progresso por categoria */}
              <div className="bg-card rounded-xl shadow-sm overflow-hidden border border-border flex flex-col h-full">
                <div className="px-5 py-4 flex items-center gap-3 border-b border-border bg-muted/30">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/40">
                    <TrendingUp className="h-4 w-4 text-green-700 dark:text-green-400" />
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Progresso por Categoria</span>
                    <p className="text-xs text-muted-foreground">Acompanhe seu avanço nos cursos</p>
                  </div>
                </div>
                <div className="p-5 flex-1">
                  {categoryProgress && categoryProgress.length > 0 ? (
                    <div className="space-y-5">
                      {categoryProgress.map(cat => {
                        const accent = CATEGORY_COLORS[cat.categoria] ?? '#2D2B6F';
                        return (
                          <div key={cat.categoria} className="group">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{cat.categoria}</span>
                              <span className="text-sm font-bold" style={{ color: accent }}>{cat.progress}%</span>
                            </div>
                            <div className="h-2.5 rounded-full overflow-hidden bg-muted border border-border/50">
                              <div
                                className="h-full rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${cat.progress}%`, background: accent }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                      <TrendingUp className="h-10 w-10 mb-3 text-muted-foreground/30" />
                      <p className="text-sm font-medium text-muted-foreground">Nenhum progresso disponível</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Tabs de estatísticas detalhadas */}
            <div className="bg-card rounded-xl shadow-sm overflow-hidden border border-border">
              <Tabs defaultValue="user" className="w-full">
                <div className="px-5 py-3 border-b border-border bg-muted/20">
                  <TabsList className="h-10 p-1 rounded-lg bg-muted border border-border/50">
                    <TabsTrigger
                      value="user"
                      className="text-sm px-5 rounded-md font-medium"
                    >
                      Meu Painel
                    </TabsTrigger>
                    {isAdmin && (
                      <TabsTrigger
                        value="admin"
                        className="text-sm px-5 rounded-md font-medium"
                      >
                        Administração
                      </TabsTrigger>
                    )}
                  </TabsList>
                </div>

                <TabsContent value="user" className="p-5 outline-none m-0">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { icon: <BookMarked className="h-6 w-6" />, label: 'Disponíveis', value: courses.length, sub: 'Cursos ativos',       color: '#3B82F6' },
                      { icon: <Award className="h-6 w-6" />,      label: 'Concluídos',   value: 0,              sub: 'Certificados',         color: '#3AB26A' },
                      { icon: <TrendingUp className="h-6 w-6" />, label: 'Seu Progresso', value: '0%',           sub: 'Média geral',          color: '#7C3AED' },
                      { icon: <Clock className="h-6 w-6" />,      label: 'Em Andamento',  value: 0,              sub: 'Cursos em progresso',  color: '#F97316' },
                    ].map(({ icon, label, value, sub, color }) => (
                      <div key={label} className="bg-background rounded-xl p-5 shadow-sm border border-border flex items-center gap-4 hover:border-primary/50 transition-colors group">
                        <div className="rounded-lg p-2.5 flex-shrink-0 transition-colors" style={{ background: color + '15', color: color }}>
                          {icon}
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-foreground leading-tight group-hover:text-primary transition-colors">{value}</p>
                          <p className="text-[13px] text-muted-foreground font-medium mt-0.5">{label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {isAdmin && (
                  <TabsContent value="admin" className="p-5 outline-none m-0">
                    <DashboardStats />
                  </TabsContent>
                )}
              </Tabs>
            </div>

            {/* ── Admin: Uso do Plano ───────────────────────────────────────── */}
            {isAdmin && planLimits && (
              <div className="bg-card rounded-xl shadow-sm overflow-hidden border border-border">
                <div className="px-5 py-4 flex items-center justify-between border-b border-border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ background: planLimits.planColor + '20' }}>
                      <BarChart3 className="h-4 w-4" style={{ color: planLimits.planColor }} />
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">Uso do Plano</span>
                      <p className="text-xs text-muted-foreground">Plano {planLimits.planName} · {monthlyUsage?.currentMonth}</p>
                    </div>
                  </div>
                  {(planLimits.isAtLimit || planLimits.isNearLimit) && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{
                        background: planLimits.isAtLimit ? '#FEE2E2' : '#FEF3C7',
                        color: planLimits.isAtLimit ? '#DC2626' : '#D97706',
                      }}>
                      {planLimits.isAtLimit ? 'Limite atingido' : `${planLimits.usagePercent}% usado`}
                    </span>
                  )}
                </div>

                <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {/* Users usage */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Usuários</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-foreground">{planLimits.currentUsers}</span>
                      <span className="text-sm text-muted-foreground">/ {planLimits.maxUsers >= 9999 ? '\u221e' : planLimits.maxUsers}</span>
                    </div>
                    {planLimits.maxUsers < 9999 && (
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${planLimits.usagePercent}%`,
                            background: planLimits.isAtLimit ? '#EF4444' : planLimits.isNearLimit ? '#F59E0B' : planLimits.planColor,
                          }}
                        />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {planLimits.maxUsers >= 9999 ? 'Ilimitado' : `${planLimits.remainingSlots} vagas restantes`}
                    </p>
                  </div>

                  {/* Watch hours */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Horas assistidas</span>
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                      {monthlyUsage?.totalWatchHours ?? '—'}
                    </div>
                    <p className="text-xs text-muted-foreground">No mês atual</p>
                  </div>

                  {/* Bandwidth */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Bandwidth estimado</span>
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                      {monthlyUsage?.totalGb ?? '—'}
                    </div>
                    <p className="text-xs text-muted-foreground">Consumo de vídeo</p>
                  </div>
                </div>

                {planLimits.isAtLimit && (
                  <div className="px-5 pb-5">
                    <div className="flex items-center gap-3 p-3 rounded-lg"
                      style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                      <ShieldAlert className="h-4 w-4 flex-shrink-0" style={{ color: '#DC2626' }} />
                      <p className="text-sm" style={{ color: '#991B1B' }}>
                        Limite de usuários atingido. Entre em contato para fazer upgrade do seu plano.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* ────────────────────────────────────────────────────────────── */}

            {/* Cursos recomendados */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <div className="w-1.5 h-6 rounded-full bg-primary"></div>
                  Cursos Recomendados
                </h2>
                <Button
                  variant="outline"
                  onClick={() => navigate('/treinamentos')}
                  className="text-sm flex items-center gap-2 h-9"
                >
                  Ver Catálogo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              {coursesLoading ? (
                <div className="flex justify-center py-16">
                  <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#2D2B6F', borderTopColor: 'transparent' }} />
                </div>
              ) : courses.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-xl border border-border">
                  <MonitorPlay className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-foreground font-medium">Nenhum curso disponível.</p>
                  <p className="text-muted-foreground text-sm mt-1">Sua lista de cursos recomendados aparecerá aqui.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {courses.slice(0, 4).map(course => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onStartCourse={(id) => navigate(`/curso/${id}`)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Admin Management Button Bottom */}
            {isAdmin && (
              <div className="flex justify-center pt-6 pb-2">
                <Button
                  variant="secondary"
                  onClick={() => navigate('/treinamentos')}
                  className="flex items-center gap-2 shadow-sm"
                >
                  <Settings className="h-4 w-4" />
                  Gerenciar Treinamentos
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
