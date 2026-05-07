// src/pages/PlanoExpirado.tsx
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export default function PlanoExpirado() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8f7ff] flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Seu plano expirou</h1>
        <p className="text-gray-500 mb-8">
          O período de teste ou sua assinatura chegou ao fim.
          Renove agora para continuar acessando sua plataforma.
        </p>
        <Button
          onClick={() => navigate('/onboarding/pagamento')}
          className="bg-green-500 hover:bg-green-600 text-white px-10"
        >
          Renovar assinatura
        </Button>
      </div>
    </div>
  );
}
