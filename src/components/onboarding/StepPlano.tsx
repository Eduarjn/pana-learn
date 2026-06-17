// src/components/onboarding/StepPlano.tsx
import { Button } from '@/components/ui/button';
import { CheckCircle2, Zap, Building2, Rocket } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const PLANOS = [
  {
    id: 'starter',
    nome: 'Starter',
    preco: 'R$ 100',
    periodo: '/mês',
    icon: Zap,
    cor: '#3b82f6',
    descricao: 'Para começar com solidez',
    features: ['Até 40 usuários ativos', 'Cursos limitados', 'Quizzes inclusos', 'Certificados automáticos', 'Painel básico de progresso'],
    destaque: false,
  },
  {
    id: 'pro',
    nome: 'Pro',
    preco: 'R$ 200',
    periodo: '/mês',
    icon: Rocket,
    cor: '#22c55e',
    descricao: 'O mais popular',
    features: ['Até 180 usuários ativos', 'Cursos ilimitados', 'Quizzes + certificados', 'Gestão de usuários', 'Suporte com SLA garantido'],
    destaque: true,
  },
  {
    id: 'enterprise',
    nome: 'Enterprise',
    preco: 'R$ 1.097',
    periodo: '/mês',
    icon: Building2,
    cor: '#8b5cf6',
    descricao: 'Para grandes operações',
    features: ['Até 500 usuários ativos', 'Cursos ilimitados', 'Quizzes + certificados', 'White-label completo', 'Integrações via API', 'Suporte prioritário', 'IA de suporte incluída'],
    destaque: false,
  },
];

interface Props {
  data: any;
  updateData: (d: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepPlano({ data, updateData, onNext, onBack }: Props) {

  const handleSelect = async (planoId: string) => {
    updateData({ planoSelecionado: planoId });
    if (data.organizationId) {
      await supabase.from('empresas').update({
        plan: planoId,
      }).eq('id', data.organizationId);
    }
  };

  return (
    <div>
      <h2 className="font-quicksand text-2xl font-bold text-pana-indigo mb-1">Escolha seu plano</h2>
      <p className="font-inter text-sm text-pana-text-secondary mb-8">Comece com 14 dias grátis em qualquer plano. Sem compromisso.</p>

      <div className="flex flex-col gap-3 mb-6">
        {PLANOS.map(plano => {
          const selected = data.planoSelecionado === plano.id;
          const Icon = plano.icon;
          return (
            <div
              key={plano.id}
              onClick={() => handleSelect(plano.id)}
              className={`relative rounded-2xl border-2 p-5 cursor-pointer transition-all flex items-start gap-4 ${
                selected
                  ? 'border-pana-teal shadow-lg bg-pana-teal-muted'
                  : plano.destaque
                  ? 'border-pana-grape bg-pana-grape-muted/40'
                  : 'border-pana-bone/60 hover:border-pana-grape bg-white'
              }`}
            >
              {plano.destaque && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-pana-grape text-pana-petal text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                  Mais popular
                </div>
              )}
              {selected && (
                <CheckCircle2 className="absolute top-4 right-4 w-5 h-5 text-pana-teal" />
              )}

              <Icon className="w-7 h-7 text-pana-teal shrink-0" />
              <div className="flex-1">
                <h3 className="font-quicksand font-bold text-pana-indigo text-lg">{plano.nome}</h3>
                <p className="text-xs text-pana-text-secondary mb-2">{plano.descricao}</p>

                <div className="mb-3">
                  <span className="text-2xl font-bold text-pana-teal">{plano.preco}</span>
                  <span className="text-sm text-pana-text-secondary">{plano.periodo}</span>
                </div>

                <ul className="space-y-1.5">
                  {plano.features.map(feat => (
                    <li key={feat} className="flex items-center gap-2 text-xs text-pana-indigo">
                      <CheckCircle2 className="w-3.5 h-3.5 text-pana-teal shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="border-pana-grape text-pana-grape hover:bg-pana-grape-muted">← Voltar</Button>
        <Button
          onClick={onNext}
          disabled={!data.planoSelecionado}
          className="bg-pana-teal hover:bg-pana-teal-dark text-white rounded-xl px-8 h-11 font-medium disabled:opacity-40"
        >
          Continuar →
        </Button>
      </div>
    </div>
  );
}
