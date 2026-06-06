// src/pages/Onboarding.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import StepConta from '@/components/onboarding/StepConta';
import StepPersonalize from '@/components/onboarding/StepPersonalize';
import StepConteudo from '@/components/onboarding/StepConteudo';
import StepPlano from '@/components/onboarding/StepPlano';
import StepPagamento from '@/components/onboarding/StepPagamento';

const STEPS = [
  { number: 1, label: 'Criar conta' },
  { number: 2, label: 'Personalizar' },
  { number: 3, label: 'Conteúdo' },
  { number: 4, label: 'Plano' },
  { number: 5, label: 'Pagamento' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState({
    // Etapa 1
    nome: '', email: '', senha: '', organizacaoNome: '',
    // Etapa 2
    logo: null as File | null, corPrimaria: '#22c55e', nomePlataforma: '', subdominio: '',
    // Etapa 3
    contentTypes: [] as string[],
    // Etapa 4
    planoSelecionado: '' as '' | 'trial' | 'starter' | 'pro' | 'enterprise',
    // IDs gerados
    userId: '', organizationId: '',
  });

  // Se já logado e com org ativa, redirecionar
  useEffect(() => {
    if (user) {
      supabase.from('empresas')
        .select('id, plan, plan_status')
        .limit(1)
        .maybeSingle()
        .then(({ data: empData }) => {
          if (empData?.plan_status === 'active') {
            navigate('/dashboard');
          } else if (empData) {
            setCurrentStep(2);
            setOnboardingData(prev => ({ ...prev, userId: user.id, organizationId: empData.id }));
          }
          // Se não tem empresa, fica no step 1 (criar conta)
        });
    }
  }, [user, navigate]);

  const updateData = (newData: Partial<typeof onboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...newData }));
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 5));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen bg-[#f8f7ff] flex flex-col">
      {/* Header com logo */}
      <header className="py-6 px-8 flex items-center gap-3">
        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">P</div>
        <span className="font-semibold text-gray-800 text-lg">Panalearn</span>
      </header>

      {/* Stepper */}
      <div className="w-full max-w-3xl mx-auto px-6 py-8">
        <p className="text-center text-sm font-semibold text-green-600 tracking-widest uppercase mb-3">
          PRIMEIROS PASSOS
        </p>
        <h1 className="text-center text-3xl font-extrabold text-gray-900 mb-10">
          Configure e comece em minutos
        </h1>

        {/* Linha de progresso com círculos numerados */}
        <div className="relative flex items-start justify-between mb-12">
          {/* Linha de conexão (background) */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 z-0" />
          {/* Linha de progresso (ativa) */}
          <div
            className="absolute top-5 left-0 h-0.5 bg-green-500 z-0 transition-all duration-500"
            style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
          />

          {STEPS.map((step) => (
            <div key={step.number} className="relative z-10 flex flex-col items-center gap-2 flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  step.number < currentStep
                    ? 'bg-green-500 text-white shadow-md'
                    : step.number === currentStep
                    ? 'bg-green-500 text-white ring-4 ring-green-100 shadow-lg'
                    : 'bg-white border-2 border-gray-200 text-gray-400'
                }`}
              >
                {step.number < currentStep ? '✓' : step.number}
              </div>
              <span className={`text-xs font-medium text-center leading-tight ${
                step.number <= currentStep ? 'text-gray-700' : 'text-gray-400'
              }`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* Conteúdo da etapa atual */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {currentStep === 1 && (
            <StepConta data={onboardingData} updateData={updateData} onNext={nextStep} />
          )}
          {currentStep === 2 && (
            <StepPersonalize data={onboardingData} updateData={updateData} onNext={nextStep} onBack={prevStep} />
          )}
          {currentStep === 3 && (
            <StepConteudo data={onboardingData} updateData={updateData} onNext={nextStep} onBack={prevStep} />
          )}
          {currentStep === 4 && (
            <StepPlano data={onboardingData} updateData={updateData} onNext={nextStep} onBack={prevStep} />
          )}
          {currentStep === 5 && (
            <StepPagamento data={onboardingData} updateData={updateData} onBack={prevStep} />
          )}
        </div>
      </div>
    </div>
  );
}
