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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
        {/* Hero Section com gradiente */}
        <div className="page-hero w-full rounded-xl lg:rounded-2xl flex flex-col md:flex-row justify-between items-center p-4 lg:p-8 mb-6 lg:mb-8 shadow-md" style={{background: 'linear-gradient(90deg, #7C3AED 0%, #2563EB 40%, #CCFF00 100%)'}}>
          <div className="px-4 lg:px-6 py-6 lg:py-8 md:py-12 w-full">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 lg:gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <span className="text-xs lg:text-sm font-medium text-yellow-200">Plataforma de Ensino</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 lg:mb-3 bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">
                    Bem-vindo de volta!
                  </h1>
                  <p className="text-sm sm:text-base lg:text-lg md:text-xl text-blue-100 max-w-2xl">
                    Você tem {featuredCourses.length} cursos em andamento. Continue aprendendo!
                  </p>
                  <div className="flex flex-wrap items-center gap-2 lg:gap-4 mt-3 lg:mt-4">
                    <div className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm">
                      <BookOpen className="h-3 w-3 lg:h-4 lg:w-4 text-yellow-300" />
                      <span>Cursos disponíveis</span>
                    </div>
                    <div className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm">
                      <Clock className="h-3 w-3 lg:h-4 lg:w-4 text-yellow-300" />
                      <span>Progresso contínuo</span>
                    </div>
                    <div className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm">
                      <Award className="h-3 w-3 lg:h-4 lg:w-4 text-yellow-300" />
                      <span>Certificações</span>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={handleViewAllCourses}
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm font-medium px-4 lg:px-6 py-2 lg:py-3 rounded-lg lg:rounded-xl text-sm lg:text-base transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  <BookOpen className="h-4 w-4 lg:h-5 lg:w-5 mr-1 lg:mr-2" />
                  Ver meus cursos
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 lg:px-6 py-6 lg:py-8">
          <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">

            {/* Navegação e Botão Novo Treinamento */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <Tabs defaultValue="relatorios" className="w-full sm:w-auto">
                <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-lg">
                  <TabsTrigger 
                    value="relatorios"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                  >
                    Relatórios
                  </TabsTrigger>
                  <TabsTrigger 
                    value="estatisticas"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                  >
                    Estatísticas
                  </TabsTrigger>
                  <TabsTrigger 
                    value="treinamentos"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                  >
                    Próximos Treinamentos
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              {isAdmin && (
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-6 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 hover:scale-105 shadow-lg">
                  <Settings className="h-4 w-4" />
                  Novo Treinamento
                </Button>
              )}
            </div>

            {/* Conteúdo Principal */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Atividade Recente */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  <CardTitle className="flex items-center gap-3 text-white font-bold text-xl">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Clock className="h-6 w-6" />
                    </div>
                    <span>Atividade Recente</span>
                  </CardTitle>
                  <CardDescription className="text-blue-100 mt-2">
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
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  <CardTitle className="flex items-center gap-3 text-white font-bold text-xl">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <span>Progresso por Categoria</span>
                  </CardTitle>
                  <CardDescription className="text-blue-100 mt-2">
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
              <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-3 bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-lg">
                <TabsTrigger 
                  value="overview"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                >
                  Visão Geral
                </TabsTrigger>
                <TabsTrigger 
                  value="tests"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                >
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
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
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
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  <CardTitle className="flex items-center gap-3 text-white font-bold text-xl">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <User className="h-6 w-6" />
                    </div>
                    <span>Seu Progresso</span>
                  </CardTitle>
                  <CardDescription className="text-blue-100 mt-2">
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

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  <CardTitle className="flex items-center gap-3 text-white font-bold text-xl">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <span>Categorias Disponíveis</span>
                  </CardTitle>
                  <CardDescription className="text-blue-100 mt-2">
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
        </div>
      </div>
    </ERALayout>
  );
};

export default Dashboard;
