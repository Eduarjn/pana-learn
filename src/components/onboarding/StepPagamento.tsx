// src/components/onboarding/StepPagamento.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CreditCard, Gift, ShieldCheck } from 'lucide-react';

const PLANO_INFO: Record<string, { nome: string; preco: string }> = {
  starter:    { nome: 'Starter',    preco: 'R$ 297,00/mês' },
  pro:        { nome: 'Pro',        preco: 'R$ 497,00/mês' },
  enterprise: { nome: 'Enterprise', preco: 'R$ 897,00/mês' },
};

interface Props {
  data: any;
  updateData: (d: any) => void;
  onBack: () => void;
}

export default function StepPagamento({ data, updateData, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const [trialLoading, setTrialLoading] = useState(false);
  const [cpfCnpj, setCpfCnpj] = useState(data.cpfCnpj || '');
  const { toast } = useToast();
  const navigate = useNavigate();
  const plano = PLANO_INFO[data.planoSelecionado] || { nome: '', preco: '' };

  const handleStartTrial = async () => {
    setTrialLoading(true);
    try {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);

      try {
        await supabase.rpc('setup_tenant_environment', {
          p_organization_id: data.organizationId,
          p_owner_auth_id: data.userId,
          p_company_name: data.organizacaoNome,
          p_platform_name: data.nomePlataforma || data.organizacaoNome,
          p_primary_color: data.corPrimaria || '#22c55e',
          p_logo_url: null,
          p_subdominio: null,
        });
      } catch {
        console.warn('setup_tenant_environment não disponível');
      }

      await supabase.from('empresas').update({
        plan: data.planoSelecionado,
        plan_status: 'trial',
      }).eq('id', data.organizationId);

      await supabase.from('subscriptions').insert({
        organization_id: data.organizationId,
        user_id: data.userId,
        plan: data.planoSelecionado,
        status: 'trial',
        trial_end_date: trialEnd.toISOString(),
      });

      toast({
        title: 'Seu ambiente está pronto!',
        description: `Bem-vindo ao Plano ${plano.nome}. 14 dias grátis começando agora.`,
      });
      navigate('/dashboard');
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setTrialLoading(false);
    }
  };

  const handlePagar = async () => {
    if (!cpfCnpj || cpfCnpj.replace(/\D/g, '').length < 11) {
      toast({ title: 'CPF/CNPJ obrigatório', description: 'Informe um CPF ou CNPJ válido para a cobrança.', variant: 'destructive' });
      return;
    }
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
          cpf_cnpj: cpfCnpj,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erro ao iniciar pagamento');

      // Redirecionar para o checkout do Asaas
      window.location.href = result.paymentUrl;
    } catch (error: any) {
      toast({ title: 'Erro no pagamento', description: error.message, variant: 'destructive' });
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Confirme e comece agora</h2>
      <p className="text-gray-500 mb-8">Alunos recebem acesso e começam a aprender imediatamente.</p>

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

      {/* Trial gratuito */}
      <div className="border-2 border-dashed border-green-300 rounded-xl p-5 mb-4 bg-green-50/50">
        <div className="flex items-start gap-3">
          <Gift className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-gray-900">Testar 14 dias grátis</p>
            <p className="text-xs text-gray-500 mt-0.5 mb-3">Sem cartão de crédito. Cancele quando quiser.</p>
            <Button onClick={handleStartTrial} disabled={trialLoading} className="w-full bg-green-500 hover:bg-green-600 text-white">
              {trialLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Iniciando...</> : 'Iniciar teste gratuito de 14 dias'}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-gray-200" />
        <p className="text-xs text-gray-400 font-medium">ou pague agora com desconto</p>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* CPF/CNPJ */}
      <div className="mb-4">
        <Label htmlFor="cpfCnpj" className="text-sm font-medium text-gray-700">CPF ou CNPJ *</Label>
        <Input
          id="cpfCnpj"
          value={cpfCnpj}
          onChange={e => { setCpfCnpj(e.target.value); updateData({ cpfCnpj: e.target.value }); }}
          placeholder="000.000.000-00 ou 00.000.000/0001-00"
          className="mt-1"
        />
        <p className="text-xs text-gray-400 mt-1">Necessário para emissão de cobrança via Asaas</p>
      </div>

      <Button onClick={handlePagar} disabled={loading} variant="outline" className="w-full border-2 border-gray-300 text-gray-700 h-12 font-semibold">
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Redirecionando para pagamento...</>
          : <><CreditCard className="w-4 h-4 mr-2" />Pagar agora</>
        }
      </Button>

      <div className="flex items-center justify-center gap-4 mt-4">
        <div className="flex items-center gap-1.5 text-xs text-gray-400"><ShieldCheck className="w-3.5 h-3.5" />Pagamento seguro</div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400"><ShieldCheck className="w-3.5 h-3.5" />Boleto, PIX ou cartão</div>
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack}>Voltar</Button>
      </div>
    </div>
  );
}
