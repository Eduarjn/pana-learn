import { ERALayout } from '@/components/ERALayout';
import { DashboardStats } from '@/components/DashboardStats';
import { CourseCard } from '@/components/CourseCard';
import { TestDashboard } from '@/components/TestDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCourses } from '@/hooks/useCourses';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats, useRecentActivity, useCategoryProgress, useGrowthStats } from '@/hooks/useDashboardStats';
import { CheckCircle, Video, Award, Clock, ArrowRight, Settings, Users, GraduationCap, FileText, TrendingUp, BookOpen, MessageCircle, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { data: courses = [], isLoading: coursesLoading, error: coursesError } = useCourses();
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  // Hooks para dados reais
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentActivities, isLoading: activitiesLoading } = useRecentActivity();
  const { data: categoryProgress, isLoading: progressLoading } = useCategoryProgress(userProfile?.id);
  const { data: growthStats, isLoading: growthLoading } = useGrowthStats();

  const isAdmin = userProfile?.tipo_usuario === 'admin';
  const featuredCourses = courses;

  console.log('🔍 Dashboard - Estado dos cursos:', {
    coursesLoading,
    coursesError,
    coursesCount: courses.length,
    isAdmin,
    userProfile: userProfile?.email,
    userType: userProfile?.tipo_usuario
  });

  const handleStartCourse = (courseId: string) => {
    navigate(`/curso/${courseId}`);
  };

  const handleViewAllCourses = () => {
    navigate('/treinamentos');
  };

  const categories = Array.from(new Set(courses.map(course => course.categoria)));

  const testCoursesLoading = () => {
    console.log('🧪 Testando carregamento de cursos...');
    console.log('📊 Cursos carregados:', courses.length);
    console.log('📋 Dados dos cursos:', courses);
    console.log('🏷️ Categorias:', categories);
    console.log('👤 Usuário:', userProfile?.email, 'Tipo:', userProfile?.tipo_usuario);
    
    const message = `Cursos carregados: ${courses.length}\nCategorias: ${categories.join(', ')}\nUsuário: ${userProfile?.email}\nTipo: ${userProfile?.tipo_usuario}`;
    alert(message);
  };

  // Função para formatar tempo relativo
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'agora mesmo';
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hora${diffInHours > 1 ? 's' : ''} atrás`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} dia${diffInDays > 1 ? 's' : ''} atrás`;
  };

  // Função para obter ícone baseado no tipo de atividade
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'course_completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'course_started':
        return <Video className="h-5 w-5 text-blue-500" />;
      case 'certificate_earned':
        return <Award className="h-5 w-5 text-purple-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  // Função para obter texto da atividade
  const getActivityText = (activity: { type: string; user_name: string; course_name?: string; category_name?: string }) => {
    switch (activity.type) {
      case 'course_completed':
        return `${activity.user_name} completou o curso ${activity.course_name}`;
      case 'course_started':
        return `${activity.user_name} iniciou o curso ${activity.course_name}`;
      case 'certificate_earned':
        return `${activity.user_name} conquistou certificado de ${activity.category_name}`;
      default:
        return 'Atividade realizada';
    }
  };

  return (
    <ERALayout>
      <div className="space-y-6 p-6">
        {/* Banner de Boas-vindas Verde */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">Bem-vindo de volta!</h1>
              <p className="text-green-100 text-lg mb-6">
                Você tem {featuredCourses.length} cursos em andamento. Continue aprendendo!
              </p>
              <Button 
                onClick={handleViewAllCourses}
                className="bg-white text-green-600 hover:bg-green-50 font-semibold px-6 py-3 rounded-lg flex items-center gap-2"
              >
                <BookOpen className="h-5 w-5" />
                Ver meus cursos
              </Button>
            </div>
            <div className="hidden md:block">
              <GraduationCap className="h-32 w-32 text-white/20" />
            </div>
          </div>
        </div>

        {/* Navegação e Botão Novo Treinamento */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Tabs defaultValue="relatorios" className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
              <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
              <TabsTrigger value="treinamentos">Próximos Treinamentos</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {isAdmin && (
            <Button className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2 rounded-lg flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Novo Treinamento
            </Button>
          )}
        </div>

        {/* Conteúdo Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Atividade Recente */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-600" />
                Atividade Recente
              </CardTitle>
              <CardDescription className="text-gray-600">
                Últimas ações dos usuários na plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activitiesLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Carregando atividades...</p>
                  </div>
                ) : recentActivities && recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      {getActivityIcon(activity.type)}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {getActivityText(activity)}
                        </p>
                        <p className="text-xs text-gray-500">{formatTimeAgo(activity.created_at)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">Nenhuma atividade recente</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Progresso por Categoria */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-gray-600" />
                Progresso por Categoria
              </CardTitle>
              <CardDescription className="text-gray-600">
                Acompanhe o progresso dos seus cursos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {progressLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Carregando progresso...</p>
                  </div>
                ) : categoryProgress && categoryProgress.length > 0 ? (
                  categoryProgress.slice(0, 3).map((category) => (
                    <div key={category.categoria}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-gray-900">{category.categoria}</span>
                        <span className="font-bold text-green-600">{category.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-green-500 h-3 rounded-full transition-all duration-300" 
                          style={{ width: `${category.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {category.modules_completed} de {category.total_modules} módulos completos
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">Nenhum progresso disponível</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conteúdo específico para Admin */}
        {isAdmin && (
          <div className="space-y-6">
            <DashboardStats />
            
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-3">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="tests">
                  <Settings className="h-4 w-4 mr-2" />
                  Testes
                </TabsTrigger>
              </TabsList>

              {/* Removido o bloco duplicado de Visão Geral para admin */}

              <TabsContent value="tests">
                <TestDashboard />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Conteúdo específico para Cliente */}
        {!isAdmin && (
          <div className="space-y-6">
            {/* Cursos em Destaque */}
            {featuredCourses.length > 0 ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <h2 className="text-xl font-semibold text-gray-900">Cursos Recomendados</h2>
                  <Button 
                    variant="ghost" 
                    onClick={handleViewAllCourses}
                    className="text-green-600 hover:text-green-700"
                  >
                    Ver todos
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onStartCourse={handleStartCourse}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-6 text-center">
                  <div className="text-gray-600">
                    {coursesLoading ? (
                      <div>Carregando cursos...</div>
                    ) : coursesError ? (
                      <div>Erro ao carregar cursos. Tente novamente.</div>
                    ) : (
                      <div>Nenhum curso disponível no momento.</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Progresso do Cliente */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-gray-900">Seu Progresso</CardTitle>
                  <CardDescription className="text-gray-600">
                    Acompanhe seu desenvolvimento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Clock className="h-4 w-4 text-green-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Continue de onde parou
                        </p>
                        <p className="text-xs text-gray-500">
                          {featuredCourses.length > 0 
                            ? `${featuredCourses.length} cursos disponíveis`
                            : 'Nenhum curso iniciado'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Award className="h-4 w-4 text-purple-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Próximo certificado
                        </p>
                        <p className="text-xs text-gray-500">Complete um curso para ganhar</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-gray-900">Categorias Disponíveis</CardTitle>
                  <CardDescription className="text-gray-600">
                    Explore diferentes áreas de conhecimento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categories.map(category => (
                      <div key={category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-900 font-medium">{category}</span>
                          <span className="text-green-600 font-bold">
                            {courses.filter(c => c.categoria === category).length} cursos
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Debug Info - apenas para desenvolvimento */}
        {process.env.NODE_ENV === 'development' && isAdmin && (
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" onClick={testCoursesLoading} className="bg-yellow-100 text-yellow-800">
              🧪 Testar Cursos
            </Button>
          </div>
        )}
      </div>
    </ERALayout>
  );
};

export default Dashboard;
