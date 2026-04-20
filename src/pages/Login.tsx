import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AuthForm } from '@/components/AuthForm';

const Login = () => {
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && userProfile && !loading) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, userProfile, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1E1B4B]">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-lg font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hero-background min-h-screen relative">
      <AuthForm />
    </div>
  );
};

export default Login;
