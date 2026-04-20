import { ERALayout } from '@/components/ERALayout';
import { DashboardStats } from '@/components/DashboardStats';
import { CourseCard } from '@/components/CourseCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCourses } from '@/hooks/useCourses';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats, useRecentActivity, useCategoryProgress } from '@/hooks/useDashboardStats';
import {
  CheckCircle, Video, Award, Clock, BookOpen,
  TrendingUp, Settings, Users, ArrowRight
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
  if (type === 'course_completed')   return <CheckCircle className="h-4 w-4" style={{ color: '#3AB26A' }} />;
  if (type === 'course_started')     return <Video className="h-4 w-4" style={{ color: '#3B82F6' }} />;
  if (type === 'certificate_earned') return <Award className="h-4 w-4" style={{ color: '#F59E0B' }} />;
  return <Clock className="h-4 w-4 text-gray-400" />;
};

const getActivityText = (a: { type: string; user_name: string; course_name?: string; category_name?: string }) => {
  if (a.type === 'course_completed')   return `${a.user_name} completou o curso ${a.course_name}`;
  if (a.type === 'course_started')     return `${a.user_name} iniciou o curso ${a.course_name}`;
  if (a.type === 'certificate_earned') return `${a.user_name} conquistou certificado de ${a.category_name}`;
  return 'Atividade realizada';
};

const CATEGORY_COLORS: Record<string, string> = {
  PABX: '#2563EB', CALLCENTER: '#7C3AED', OMNICHANNEL: '#059669', VoIP: '#EA580C',
};

const Dashboard = () => {
  const { data: courses = [], isLoading: coursesLoading } = useCourses();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const { data: stats } = useDashboardStats();
  const { data: recentActivities } = useRecentActivity();
  const { data: categoryProgress } = useCategoryProgress(userProfile?.id);

  const isAdmin = userProfile?.tipo_usuario === 'admin' || userProfile?.tipo_usuario === 'admin_master';
  const userName = userProfile?.nome?.split(' ')[0] || 'Usuário';

  return (
    <ERALayout>
      <div className="min-h-screen" style={{ background: '#F8F7FF' }}>

        {/* Hero */}
        <div
          className="w-full rounded-xl lg:rounded-2xl mb-6 overflow-hidden shadow-md"
          style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #2D2B6F 60%, #3D3A8F 100%)' }}
        >
          <div className="px-6 lg:px-10 py-8 lg:py-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full"
                    style={{ background: 'rgba(58,178,106,0.15)', border: '1px solid rgba(58,178,106,0.3)', color: '#3AB26A' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#3AB26A' }} />
                    Plataforma de Ensino
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  Olá, {userName}!
                </h1>
                <p className="text-white/70 text-sm md:text-base max-w-xl">
                  Você tem {courses.length} cursos disponíveis. Continue aprendendo!
                </p>
                <div className="flex flex-wrap gap-5 mt-4">
                  {[
                    { icon: BookOpen, label: 'Cursos disponíveis' },
                    { icon: Clock,    label: 'Progresso contínuo' },
                    { icon: Award,    label: 'Certificações' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-1.5 text-white/70 text-sm">
                      <Icon className="h-4 w-4" style={{ color: '#3AB26A' }} />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                onClick={() => navigate('/treinamentos')}
                className="text-white flex items-center gap-2 text-sm px-5 py-2.5 rounded-lg flex-shrink-0"
                style={{ background: '#3AB26A' }}
              >
                <BookOpen className="h-4 w-4" />
                Ver meus cursos
              </Button>
            </div>
          </div>

          {/* Stats bar */}
          {stats && (
            <div className="px-6 md:px-10 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              {[
                { value: stats.totalUsers ?? 0,                   label: 'Usuários' },
                { value: stats.totalCourses ?? courses.length,    label: 'Cursos' },
                { value: stats.totalCertificates ?? 0,             label: 'Certificados' },
                { value: `${stats.completionRate ?? 0}%`,          label: 'Taxa conclusão' },
              ].map(({ value, label }) => (
                <div key={label} className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-white">{value}</div>
                  <div className="text-xs text-white/50 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-1 pb-8 space-y-6">

          {/* Cards de info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Atividade recente */}
            <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #EDE9FE' }}>
              <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid #EDE9FE' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#EDE9FE' }}>
                  <Clock className="h-4 w-4" style={{ color: '#2D2B6F' }} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: '#1E1B4B' }}>Atividade recente</h3>
                  <p className="text-xs text-gray-400">Últimas ações na plataforma</p>
                </div>
              </div>
              <div className="p-4">
                {recentActivities && recentActivities.length > 0 ? (
                  <div className="space-y-2">
                    {recentActivities.map(activity => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: '#F8F7FF' }}>
                        <div className="mt-0.5 flex-shrink-0">{getActivityIcon(activity.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 leading-snug">{getActivityText(activity)}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{formatTimeAgo(activity.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Clock className="h-8 w-8 mx-auto mb-2" style={{ color: '#C4B5FD' }} />
                    <p className="text-gray-400 text-sm">Nenhuma atividade recente</p>
                  </div>
                )}
              </div>
            </div>

            {/* Progresso por categoria */}
            <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #EDE9FE' }}>
              <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid #EDE9FE' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#F0FDF4' }}>
                  <TrendingUp className="h-4 w-4" style={{ color: '#3AB26A' }} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: '#1E1B4B' }}>Progresso por categoria</h3>
                  <p className="text-xs text-gray-400">Acompanhe seu avanço nos cursos</p>
                </div>
              </div>
              <div className="p-4">
                {categoryProgress && categoryProgress.length > 0 ? (
                  <div className="space-y-4">
                    {categoryProgress.map(cat => {
                      const accent = CATEGORY_COLORS[cat.categoria] ?? '#2D2B6F';
                      return (
                        <div key={cat.categoria}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-sm font-medium text-gray-700">{cat.categoria}</span>
                            <span className="text-sm font-semibold" style={{ color: accent }}>{cat.progress}%</span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: '#EDE9FE' }}>
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${cat.progress}%`, background: accent }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2" style={{ color: '#C4B5FD' }} />
                    <p className="text-gray-400 text-sm">Nenhum progresso disponível</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs de estatísticas */}
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #EDE9FE' }}>
            <Tabs defaultValue="admin">
              <div className="px-5 pt-4 pb-0" style={{ borderBottom: '1px solid #EDE9FE' }}>
                <TabsList className="h-9 p-0.5 rounded-lg" style={{ background: '#F8F7FF' }}>
                  <TabsTrigger
                    value="admin"
                    className="text-xs px-4 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-gray-500"
                    style={{ ['--tw-ring-color' as string]: '#2D2B6F' }}
                  >
                    Admin
                  </TabsTrigger>
                  <TabsTrigger
                    value="user"
                    className="text-xs px-4 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-gray-500"
                  >
                    Usuário
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="admin" className="p-5">
                <DashboardStats />
              </TabsContent>

              <TabsContent value="user" className="p-5">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { icon: BookOpen,   label: 'Cursos disponíveis', value: courses.length, sub: 'Cursos ativos',       color: '#2563EB', bg: '#EFF6FF' },
                    { icon: Award,      label: 'Cursos concluídos',   value: 0,              sub: 'Certificados',         color: '#3AB26A', bg: '#F0FDF4' },
                    { icon: TrendingUp, label: 'Seu progresso',       value: '0%',           sub: 'Média geral',          color: '#7C3AED', bg: '#F5F3FF' },
                    { icon: Clock,      label: 'Em andamento',         value: 0,              sub: 'Cursos em progresso',  color: '#EA580C', bg: '#FFF7ED' },
                  ].map(({ icon: Icon, label, value, sub, color, bg }) => (
                    <div key={label} className="rounded-xl p-4" style={{ background: bg, border: '1px solid ' + color + '20' }}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: color + '20' }}>
                        <Icon className="h-4 w-4" style={{ color }} />
                      </div>
                      <div className="text-2xl font-bold mb-0.5" style={{ color: '#1E1B4B' }}>{value}</div>
                      <div className="text-xs font-medium text-gray-700">{label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Cursos recomendados */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: '#1E1B4B' }}>Cursos recomendados</h2>
              <Button
                variant="ghost"
                onClick={() => navigate('/treinamentos')}
                className="text-sm flex items-center gap-1.5 h-8 px-3"
                style={{ color: '#3AB26A' }}
              >
                Ver todos
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>

            {coursesLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#2D2B6F', borderTopColor: 'transparent' }} />
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl" style={{ border: '1px solid #EDE9FE' }}>
                <BookOpen className="h-8 w-8 mx-auto mb-2" style={{ color: '#C4B5FD' }} />
                <p className="text-gray-400 text-sm">Nenhum curso disponível no momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.slice(0, 3).map(course => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onStartCourse={(id) => navigate(`/curso/${id}`)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Botão admin */}
          {isAdmin && (
            <div className="flex justify-center pt-2">
              <Button
                onClick={() => navigate('/treinamentos')}
                className="text-white flex items-center gap-2 text-sm px-5"
                style={{ background: 'linear-gradient(135deg, #1E1B4B, #2D2B6F)' }}
              >
                <Settings className="h-4 w-4" />
                Gerenciar treinamentos
              </Button>
            </div>
          )}
        </div>
      </div>
    </ERALayout>
  );
};

export default Dashboard;
