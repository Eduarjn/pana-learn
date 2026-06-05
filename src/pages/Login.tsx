import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AuthForm } from '@/components/AuthForm';
import { motion } from 'framer-motion';

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
      <div className="min-h-screen flex items-center justify-center bg-[#1F2041]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="text-white text-center"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E9D2C0] mx-auto mb-4"></div>
          <p className="text-lg font-medium text-white/80">Carregando...</p>
        </motion.div>
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
