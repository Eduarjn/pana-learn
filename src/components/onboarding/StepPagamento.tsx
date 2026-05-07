// src/components/onboarding/StepPagamento.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CreditCard, Gift, ShieldCheck } from 'lucide-react';

const PLANO_INFO: Record<string, { nome: string; preco: string }> = {
  starter:    { nome: 'Starter',    preco: 'R$ 297,00/mês' },
  pro:        { nome: 'Pro',        preco: 'R$ 497,00/mês' },
  enterprise: { nome: 'Enterprise', preco: 'R$ 697,00/mês' },
};

interface Props {
  data: any;
  updateData: (d: any) => void;
  onBack: () => void;
}

export default function StepPagamento({ data, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const [trialLoading, setTrialLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const plano = PLANO_INFO[data.planoSelecionado] || { nome: '', preco: '' };

  // Opção 1: Iniciar trial grátis de 14 dias
  const handleStartTrial = async () => {
    setTrialLoading(true);
    try {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);

      // 1. Chamar função SQL que cria empresa + branding + usuario admin
      const { data: empresaId, error: setupError } = await supabase.rpc(
        'setup_tenant_environment',
        {
          p_organization_id: data.organizationId,
          p_owner_auth_id: data.userId,
          p_company_name: data.organizacaoNome,
          p_platform_name: data.nomePlataforma || data.organizacaoNome,
          p_primary_color: data.corPrimaria || '#22c55e',
          p_logo_url: null,
          p_subdominio: null,
        }
      );

      if (setupError) throw setupError;

      // 2. Atualizar organization com status trial
      await supabase.from('organizations').update({
        plan: data.planoSelecionado,
        plan_status: 'trial',
        trial_end_date: trialEnd.toISOString(),
        onboarding_completed: true,
      }).eq('id', data.organizationId);

      // 3. Criar subscription
      await supabase.from('subscriptions').insert({
        organization_id: data.organizationId,
        empresa_id: empresaId,
        user_id: data.userId,
        plan: data.planoSelecionado,
        status: 'trial',
        trial_end_date: trialEnd.toISOString(),
      });

      // 4. Atualizar empresa com plan_status trial
      if (empresaId) {
        await supabase.from('empresas').update({
          plan: data.planoSelecionado,
          plan_status: 'trial',
        }).eq('id', empresaId);
      }

      toast({
        title: '🎉 Seu ambiente está pronto!',
        description: `Bem-vindo ao Plano ${plano.nome}. 14 dias grátis começando agora.`,
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setTrialLoading(false);
    }
  };

  // Opção 2: Ir para checkout do Mercado Pago
  const handlePagar = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: data.planoSelecionado,
          user_id: data.userId,
          organization_id: data.organizationId,
          user_email: data.email,
          user_name: data.nome,
        }),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.error || 'Erro ao iniciar pagamento');

      // Em sandbox: usar sandbox_init_point; em produção: init_point
      window.location.href = result.sandbox_init_point || result.init_point;

    } catch (error: any) {
      toast({ title: 'Erro no pagamento', description: error.message, variant: 'destructive' });
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Confirme e comece agora</h2>
      <p className="text-gray-500 mb-8">Alunos recebem acesso e começam a aprender imediatamente.</p>

      {/* Resumo do plano */}
      <div className="bg-gray-50 rounded-xl p-5 mb-6">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">Resumo da assinatura</p>
        <div className="flex justify-between items-center">
          <div>
            <p className="font-bold text-gray-900">Plano {plano.nome}</p>
            <p className="text-xs text-gray-500 mt-0.5">Cobrança mensal recorrente</p>
          </div>
          <p className="text-xl font-extrabold text-gray-900">{plano.preco}</p>
        </div>
      </div>

      {/* Opção Trial Grátis */}
      <div className="border-2 border-dashed border-green-300 rounded-xl p-5 mb-4 bg-green-50/50">
        <div className="flex items-start gap-3">
          <Gift className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-gray-900">Testar 14 dias grátis</p>
            <p className="text-xs text-gray-500 mt-0.5 mb-3">
              Sem cartão de crédito. Cancele quando quiser. Após o trial, assinatura ativa.
            </p>
            <Button
              onClick={handleStartTrial}
              disabled={trialLoading}
              className="w-full bg-green-500 hover:bg-green-600 text-white"
            >
              {trialLoading
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Iniciando...</>
                : '🎁 Iniciar teste gratuito de 14 dias'
              }
            </Button>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-gray-200" />
        <p className="text-xs text-gray-400 font-medium">ou pague agora com desconto</p>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Botão pagamento MP */}
      <Button
        onClick={handlePagar}
        disabled={loading}
        variant="outline"
        className="w-full border-2 border-gray-300 text-gray-700 h-12 font-semibold"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Redirecionando para pagamento...</>
          : <><CreditCard className="w-4 h-4 mr-2" />Pagar com Mercado Pago</>
        }
      </Button>

      {/* Selos de segurança */}
      <div className="flex items-center justify-center gap-4 mt-4">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          Pagamento seguro
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          Dados criptografados
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack}>← Voltar</Button>
      </div>
    </div>
  );
}
