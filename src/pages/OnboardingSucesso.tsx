// src/pages/OnboardingSucesso.tsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OnboardingSucesso() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const status = params.get('status');

  useEffect(() => {
    if (status === 'approved') {
      // Webhook já processou, aguardar 3s e redirecionar
      const t = setTimeout(() => navigate('/dashboard'), 3000);
      return () => clearTimeout(t);
    }
  }, [status, navigate]);

  return (
    <div className="min-h-screen bg-[#f8f7ff] flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Pagamento aprovado! 🎉</h1>
        <p className="text-gray-500 mb-8">
          Sua assinatura está ativa. Você será redirecionado para o dashboard em instantes.
        </p>
        <Button onClick={() => navigate('/dashboard')} className="bg-green-500 hover:bg-green-600 text-white px-10">
          Acessar minha plataforma →
        </Button>
      </div>
    </div>
  );
}
