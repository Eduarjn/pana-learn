import { useAuth } from '@/hooks/useAuth';
import { ERALayout } from '@/components/ERALayout';
import { AuthForm } from '@/components/AuthForm';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserBadges } from '@/hooks/useUserBadges';
import { useCourses } from '@/hooks/useCourses';
import { useUserProgress } from '@/hooks/useUserProgress';
import { Badge as BadgeUI } from '@/components/ui/badge';

const Index = () => {
  const { user, loading, userProfile } = useAuth();
  const navigate = useNavigate();
  const { badges, loading: loadingBadges } = useUserBadges(userProfile?.id, userProfile?.empresa_id, userProfile?.tipo_usuario);
  const { data: courses, loading: loadingCourses } = useCourses(userProfile?.empresa_id, userProfile?.tipo_usuario);
  const { data: progress, loading: loadingProgress } = useUserProgress(userProfile?.empresa_id, userProfile?.tipo_usuario);

  useEffect(() => {
    if (user && userProfile && !loading) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, userProfile, navigate]);

  if (loading) {
    return (
      <div className="era-login-bg min-h-screen flex items-center justify-center">
        <div className="text-pana-bone text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pana-teal mx-auto mb-4"></div>
          <p className="text-lg font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return <AuthForm />;
  }

  return (
    <ERALayout>
      <div className="space-y-6">
        <div className="text-center">
          <div className="page-hero flex flex-col items-center justify-center gap-3 mb-4 py-8 rounded-xl">
            <div className="w-12 h-12 bg-pana-teal rounded-xl flex items-center justify-center">
              <img
                src="/lovable-uploads/92441561-a944-48ee-930e-7e3b16318673.png"
                alt="PanaLearn"
                className="w-8 h-8"
              />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold text-pana-bone">
                Bem-vindo ao PanaLearn
              </h1>
              <p className="text-pana-bone/80 text-lg">
                Sua plataforma de treinamento corporativo
              </p>
            </div>
          </div>
          <p className="text-sm text-pana-text-secondary mt-2">
            Olá, {userProfile.nome}! Você está logado como {userProfile.tipo_usuario}.
          </p>
          {/* Badges */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {loadingBadges ? (
              <span className="text-pana-text-secondary text-sm">Carregando conquistas...</span>
            ) : badges.length === 0 ? (
              <span className="text-pana-text-secondary text-sm">Nenhuma conquista ainda.</span>
            ) : (
              badges.map((userBadge) => (
                <div key={userBadge.id} title={userBadge.badge.descricao} className="flex items-center gap-1">
                  {userBadge.badge.icone_url && (
                    <img src={userBadge.badge.icone_url} alt={userBadge.badge.nome} className="w-6 h-6 rounded-full border border-gray-200 bg-white" />
                  )}
                  <BadgeUI className="bg-pana-teal text-white font-semibold px-3 py-1">
                    {userBadge.badge.nome}
                  </BadgeUI>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="card-title mb-2">Treinamentos disponíveis</h3>
            <p className="card-description mb-4">Acesse os vídeos de treinamento organizados por categoria</p>
            <div className="text-2xl font-heading font-bold text-pana-teal">15</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="card-title mb-2">Progresso geral</h3>
            <p className="card-description mb-4">Seu progresso nos treinamentos</p>
            <div className="text-2xl font-heading font-bold text-pana-teal">78%</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="card-title mb-2">Certificados</h3>
            <p className="card-description mb-4">Certificados conquistados</p>
            <div className="text-2xl font-heading font-bold text-pana-teal">3</div>
          </div>
        </div>
      </div>
    </ERALayout>
  );
};

export default Index;
