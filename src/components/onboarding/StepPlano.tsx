// src/components/onboarding/StepPlano.tsx
import { Button } from '@/components/ui/button';
import { CheckCircle2, Zap, Building2, Rocket } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const PLANOS = [
  {
    id: 'starter',
    nome: 'Starter',
    preco: 'R$ 297',
    periodo: '/mês',
    icon: Zap,
    cor: '#3b82f6',
    descricao: 'Para começar com solidez',
    features: ['Até 40 usuários ativos', 'Cursos limitados', 'Quizzes inclusos', 'Certificados automáticos', 'Painel básico de progresso', 'Sem white-label'],
    destaque: false,
  },
  {
    id: 'pro',
    nome: 'Pro',
    preco: 'R$ 497',
    periodo: '/mês',
    icon: Rocket,
    cor: '#22c55e',
    descricao: 'O mais popular',
    features: ['Até 180 usuários ativos', 'Cursos ilimitados', 'Quizzes + certificados', 'White-label habilitado', 'Relatórios e analytics', 'Gestão de usuários'],
    destaque: true,
  },
  {
    id: 'enterprise',
    nome: 'Enterprise',
    preco: 'R$ 897',
    periodo: '/mês',
    icon: Building2,
    cor: '#8b5cf6',
    descricao: 'Para grandes operações',
    features: ['Até 500 usuários ativos', 'Cursos ilimitados', 'Quizzes + certificados', 'White-label completo', 'Integrações via API', 'Suporte prioritário', 'IA de suporte incluída 🤖'],
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
      await supabase.from('organizations').update({
        plan: planoId,
        onboarding_step: 5,
      }).eq('id', data.organizationId);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Escolha seu plano</h2>
      <p className="text-gray-500 mb-8">Comece com 14 dias grátis em qualquer plano. Sem compromisso.</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {PLANOS.map(plano => {
          const selected = data.planoSelecionado === plano.id;
          const Icon = plano.icon;
          return (
            <div
              key={plano.id}
              onClick={() => handleSelect(plano.id)}
              className={`relative rounded-2xl border-2 p-5 cursor-pointer transition-all ${
                selected
                  ? 'border-green-500 shadow-lg scale-[1.03]'
                  : plano.destaque
                  ? 'border-green-300 bg-green-50/50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {plano.destaque && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  🔥 Mais popular
                </div>
              )}
              {selected && (
                <CheckCircle2 className="absolute top-4 right-4 w-5 h-5 text-green-500" />
              )}

              <Icon className="w-7 h-7 mb-3" style={{ color: plano.cor }} />
              <h3 className="font-bold text-gray-900 text-lg">{plano.nome}</h3>
              <p className="text-xs text-gray-500 mb-3">{plano.descricao}</p>

              <div className="mb-4">
                <span className="text-2xl font-extrabold text-gray-900">{plano.preco}</span>
                <span className="text-sm text-gray-500">{plano.periodo}</span>
              </div>

              <ul className="space-y-1.5">
                {plano.features.map(feat => (
                  <li key={feat} className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full mt-4 text-sm ${
                  selected ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={(e) => { e.stopPropagation(); handleSelect(plano.id); }}
              >
                {selected ? '✓ Selecionado' : 'Selecionar'}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>← Voltar</Button>
        <Button
          onClick={onNext}
          disabled={!data.planoSelecionado}
          className="bg-green-500 hover:bg-green-600 text-white px-8 disabled:opacity-40"
        >
          Continuar →
        </Button>
      </div>
    </div>
  );
}
