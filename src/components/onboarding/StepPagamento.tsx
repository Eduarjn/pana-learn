// src/components/onboarding/StepPagamento.tsx
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CreditCard, Gift, ShieldCheck, ExternalLink } from 'lucide-react';

const PLANO_INFO: Record<string, { nome: string; preco: string }> = {
  starter:    { nome: 'Starter',    preco: 'R$ 397,00/mês' },
  pro:        { nome: 'Pro',        preco: 'R$ 697,00/mês' },
  enterprise: { nome: 'Enterprise', preco: 'R$ 1.097,00/mês' },
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
  const [waitingPayment, setWaitingPayment] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const plano = PLANO_INFO[data.planoSelecionado] || { nome: '', preco: '' };

  // Polling: enquanto aguarda pagamento, checa plan_status a cada 4s.
  // Quando virar 'active' (webhook PAYMENT_RECEIVED), redireciona p/ dashboard.
  useEffect(() => {
    if (!waitingPayment || !data.organizationId) return;
    const tick = async () => {
      const { data: emp } = await supabase
        .from('empresas')
        .select('plan_status')
        .eq('id', data.organizationId)
        .maybeSingle();
      if (emp?.plan_status === 'active' || emp?.plan_status === 'trial') {
        if (pollRef.current) window.clearInterval(pollRef.current);
        toast({ title: 'Pagamento confirmado', description: 'Redirecionando…' });
        navigate('/dashboard');
      }
    };
    pollRef.current = window.setInterval(tick, 4000);
    tick();
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [waitingPayment, data.organizationId, navigate, toast]);

  const handleStartTrial = async () => {
    setTrialLoading(true);
    try {
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

      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: data.planoSelecionado,
          user_id: data.userId,
          organization_id: data.organizationId,
          user_email: data.email,
          user_name: data.nome,
          cpf_cnpj: null,
          trial: true,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erro ao iniciar trial');

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

      // Abre Asaas em nova aba e ativa polling local; quando o webhook
      // confirmar, o useEffect redireciona para /dashboard automaticamente.
      setPaymentUrl(result.paymentUrl);
      setWaitingPayment(true);
      window.open(result.paymentUrl, '_blank', 'noopener,noreferrer');
    } catch (error: any) {
      toast({ title: 'Erro no pagamento', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (waitingPayment) {
    return (
      <div className="text-center py-4">
        <Loader2 className="w-10 h-10 animate-spin text-pana-teal mx-auto mb-4" />
        <h2 className="font-quicksand text-2xl font-bold text-pana-indigo mb-2">Aguardando confirmação</h2>
        <p className="font-inter text-sm text-pana-text-secondary mb-6">
          Finalize o pagamento na aba que abrimos. Esta tela atualiza sozinha quando o Asaas confirmar.
        </p>
        {paymentUrl && (
          <a
            href={paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-pana-teal hover:underline font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir página de pagamento novamente
          </a>
        )}
        <div className="mt-8 pt-6 border-t border-pana-bone/40">
          <Button
            variant="outline"
            onClick={() => setWaitingPayment(false)}
            className="border-pana-grape text-pana-grape hover:bg-pana-grape-muted"
          >
            Cancelar e voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-quicksand text-2xl font-bold text-pana-indigo mb-1">Confirme e comece agora</h2>
      <p className="font-inter text-sm text-pana-text-secondary mb-8">Alunos recebem acesso e começam a aprender imediatamente.</p>

      {/* Card de resumo do plano */}
      <div className="bg-pana-bg rounded-2xl border border-pana-bone/40 p-6 mb-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-pana-text-secondary mb-1">Plano selecionado</p>
            <p className="font-quicksand font-bold text-pana-indigo text-lg">{plano.nome}</p>
          </div>
          <span className="bg-pana-petal text-pana-indigo text-xs rounded-full px-3 py-1 font-medium">
            14 dias grátis
          </span>
        </div>
        <p className="text-3xl font-bold text-pana-teal">{plano.preco}</p>
        <p className="text-xs text-pana-text-secondary mt-1">Cobrança mensal recorrente após o período de teste</p>
      </div>

      {/* Botão principal — trial */}
      <Button
        onClick={handleStartTrial}
        disabled={trialLoading}
        className="w-full bg-pana-teal hover:bg-pana-teal-dark text-white rounded-xl h-12 font-medium mb-3"
      >
        {trialLoading
          ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Iniciando...</>
          : <><Gift className="w-4 h-4 mr-2" />Iniciar 14 dias grátis</>
        }
      </Button>
      <p className="text-xs text-pana-text-secondary text-center mb-6">Sem cartão de crédito. Cancele quando quiser.</p>

      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-pana-bone/40" />
        <p className="text-xs text-pana-text-secondary font-medium">ou pague agora</p>
        <div className="flex-1 h-px bg-pana-bone/40" />
      </div>

      {/* CPF/CNPJ */}
      <div className="mb-4">
        <Label htmlFor="cpfCnpj" className="text-sm font-medium text-pana-indigo">CPF ou CNPJ *</Label>
        <Input
          id="cpfCnpj"
          value={cpfCnpj}
          onChange={e => { setCpfCnpj(e.target.value); updateData({ cpfCnpj: e.target.value }); }}
          placeholder="000.000.000-00 ou 00.000.000/0001-00"
          className="mt-1"
        />
        <p className="text-xs text-pana-text-secondary mt-1">Necessário para emissão de cobrança via Asaas</p>
      </div>

      <Button onClick={handlePagar} disabled={loading} variant="outline" className="w-full border border-pana-grape text-pana-grape hover:bg-pana-grape-muted rounded-xl h-12 font-medium">
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Redirecionando para pagamento...</>
          : <><CreditCard className="w-4 h-4 mr-2" />Pagar agora</>
        }
      </Button>

      <div className="flex items-center justify-center gap-4 mt-4">
        <div className="flex items-center gap-1.5 text-xs text-pana-text-secondary"><ShieldCheck className="w-3.5 h-3.5" />Pagamento seguro</div>
        <div className="flex items-center gap-1.5 text-xs text-pana-text-secondary"><ShieldCheck className="w-3.5 h-3.5" />Boleto, PIX ou cartão</div>
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack} className="border-pana-grape text-pana-grape hover:bg-pana-grape-muted">Voltar</Button>
      </div>
    </div>
  );
}
