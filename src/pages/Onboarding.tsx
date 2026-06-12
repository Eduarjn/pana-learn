// src/pages/Onboarding.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState({
    // Etapa 1
    nome: '', email: initialEmail, senha: '', organizacaoNome: '',
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
      // Buscar a empresa DO usuário logado (não a primeira do banco)
      supabase.from('usuarios')
        .select('empresa_id, empresas:empresa_id (id, plan, plan_status)')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          const raw = (data as any)?.empresas;
          const empData = Array.isArray(raw) ? raw[0] : raw;
          if (empData?.plan_status === 'active' || empData?.plan_status === 'trial') {
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
    <div className="min-h-screen bg-pana-bg font-inter flex flex-col">
      {/* Header fixo com logo */}
      <header className="bg-pana-indigo py-5 px-6 flex items-center justify-center">
        <img
          src="/brand/panalearn-horizontal-white.png"
          alt="PanaLearn"
          className="h-8 w-auto"
        />
      </header>

      {/* Stepper */}
      <div className="w-full max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-center font-quicksand text-3xl font-bold text-pana-indigo mb-2">
          Configure e comece em minutos
        </h1>
        <p className="text-center text-sm text-pana-text-secondary mb-10">
          Primeiros passos
        </p>

        {/* Progress bar linear */}
        <div className="relative mb-12">
          <div className="absolute top-4 left-4 right-4 h-1 bg-pana-bone/30 rounded-full z-0" />
          <div
            className="absolute top-4 left-4 h-1 bg-pana-teal rounded-full z-0 transition-all duration-500 ease-out"
            style={{ width: `calc(${((currentStep - 1) / (STEPS.length - 1)) * 100}% - 1rem)` }}
          />

          <div className="relative z-10 flex items-start justify-between">
            {STEPS.map((step) => {
              const isDone = step.number < currentStep;
              const isCurrent = step.number === currentStep;
              return (
                <div key={step.number} className="flex flex-col items-center gap-2 flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                      isDone
                        ? 'bg-pana-teal text-white shadow-md'
                        : isCurrent
                        ? 'bg-pana-grape text-pana-petal ring-4 ring-pana-grape/20 shadow-lg'
                        : 'bg-pana-bone/30 text-pana-text-secondary'
                    }`}
                  >
                    {isDone ? '✓' : step.number}
                  </div>
                  <span
                    className={`font-inter text-sm text-center leading-tight ${
                      step.number <= currentStep ? 'text-pana-indigo font-medium' : 'text-pana-text-secondary'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card central — animação fade + slide-up por step */}
        <div
          key={currentStep}
          className="bg-white rounded-2xl shadow-lg max-w-xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
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
