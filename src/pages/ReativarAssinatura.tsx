// src/pages/ReativarAssinatura.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PanaLoader } from '@/components/ui/pana-loader';
import { CheckCircle2, Zap, Rocket, Building2, Gift, CreditCard, Loader2, ShieldCheck, ExternalLink, AlertCircle } from 'lucide-react';

type PlanId = 'starter' | 'pro' | 'enterprise';

const PLANOS: Array<{
  id: PlanId;
  nome: string;
  preco: string;
  precoLabel: string;
  periodo: string;
  icon: typeof Zap;
  descricao: string;
  features: string[];
  destaque: boolean;
}> = [
  { id: 'starter', nome: 'Starter', preco: 'R$ 597', precoLabel: 'R$ 597,00/mês', periodo: '/mês', icon: Zap, descricao: 'Para começar com solidez', features: ['Até 40 usuários ativos', 'Cursos limitados', 'Quizzes inclusos', 'Certificados automáticos'], destaque: false },
  { id: 'pro', nome: 'Pro', preco: 'R$ 897', precoLabel: 'R$ 897,00/mês', periodo: '/mês', icon: Rocket, descricao: 'O mais popular', features: ['Até 180 usuários ativos', 'Cursos ilimitados', 'Quizzes + certificados', 'Suporte com SLA'], destaque: true },
  { id: 'enterprise', nome: 'Enterprise', preco: 'R$ 1.097', precoLabel: 'R$ 1.097,00/mês', periodo: '/mês', icon: Building2, descricao: 'Para grandes operações', features: ['Até 500 usuários ativos', 'White-label completo', 'Integrações via API', 'IA de suporte incluída'], destaque: false },
];

type Gate =
  | { state: 'loading' }
  | { state: 'redirect'; to: string }
  | { state: 'ready'; empresa: EmpresaData };

interface EmpresaData {
  id: string;
  nome: string;
  plan: string | null;
  plan_status: string | null;
}

export default function ReativarAssinatura() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [gate, setGate] = useState<Gate>({ state: 'loading' });
  const [planoSelecionado, setPlanoSelecionado] = useState<PlanId | ''>('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [trialLoading, setTrialLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [waitingPayment, setWaitingPayment] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const pollRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  // Verificar elegibilidade
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setGate({ state: 'redirect', to: '/login' });
      return;
    }
    if (userProfile?.tipo_usuario === 'admin_master') {
      setGate({ state: 'redirect', to: '/dashboard' });
      return;
    }

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('usuarios')
        .select('empresa_id, empresas:empresa_id (id, nome, plan, plan_status, onboarding_completed, active)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cancelled) return;

      const raw = (data as any)?.empresas;
      const empresa = Array.isArray(raw) ? raw[0] : raw;

      if (error || !data?.empresa_id || !empresa) {
        setGate({ state: 'redirect', to: '/onboarding' });
        return;
      }
      if (empresa.active === false) {
        setGate({ state: 'redirect', to: '/dashboard' });
        return;
      }
      if (empresa.onboarding_completed !== true) {
        setGate({ state: 'redirect', to: '/onboarding' });
        return;
      }
      if (empresa.plan_status === 'trial' || empresa.plan_status === 'active') {
        setGate({ state: 'redirect', to: '/dashboard' });
        return;
      }
      const empresaData: EmpresaData = {
        id: empresa.id,
        nome: empresa.nome,
        plan: empresa.plan,
        plan_status: empresa.plan_status,
      };
      setGate({ state: 'ready', empresa: empresaData });
      const planAtual = empresa.plan as PlanId | undefined;
      if (planAtual && PLANOS.some(p => p.id === planAtual)) {
        setPlanoSelecionado(planAtual);
      }
    })();

    return () => { cancelled = true; };
  }, [authLoading, user?.id, userProfile?.tipo_usuario]);

  const empresa = gate.state === 'ready' ? gate.empresa : null;
  const planoInfo = useMemo(() => PLANOS.find(p => p.id === planoSelecionado), [planoSelecionado]);

  // Polling pós-redirect para Asaas
  useEffect(() => {
    if (!waitingPayment || !empresa?.id) return;
    setPollTimedOut(false);
    const tick = async () => {
      try {
        const { data: emp } = await supabase
          .from('empresas')
          .select('plan_status')
          .eq('id', empresa.id)
          .maybeSingle();
        if (emp?.plan_status === 'active' || emp?.plan_status === 'trial') {
          if (pollRef.current) window.clearInterval(pollRef.current);
          if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
          toast({ title: 'Pagamento confirmado', description: 'Redirecionando…' });
          navigate('/dashboard');
        }
      } catch (e) {
        console.warn('polling plan_status falhou:', e);
      }
    };
    pollRef.current = window.setInterval(tick, 4000);
    timeoutRef.current = window.setTimeout(() => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      setPollTimedOut(true);
    }, 10 * 60 * 1000);
    tick();
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [waitingPayment, empresa?.id, navigate, toast]);

  const handleStartTrial = async () => {
    if (!planoSelecionado || !empresa) return;
    setTrialLoading(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error('Sessão expirada. Faça login novamente.');
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          plan: planoSelecionado,
          user_id: user!.id,
          organization_id: empresa.id,
          user_email: user!.email,
          user_name: userProfile?.nome || user!.email,
          cpf_cnpj: null,
          trial: true,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erro ao reativar trial');

      toast({
        title: 'Plataforma reativada',
        description: `Bem-vindo de volta. 14 dias grátis no plano ${planoInfo?.nome}.`,
      });
      navigate('/dashboard');
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setTrialLoading(false);
    }
  };

  const handlePagar = async () => {
    if (!planoSelecionado || !empresa) return;
    if (!cpfCnpj || cpfCnpj.replace(/\D/g, '').length < 11) {
      toast({ title: 'CPF/CNPJ obrigatório', description: 'Informe um CPF ou CNPJ válido para a cobrança.', variant: 'destructive' });
      return;
    }
    setPaymentLoading(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error('Sessão expirada. Faça login novamente.');
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          plan: planoSelecionado,
          user_id: user!.id,
          organization_id: empresa.id,
          user_email: user!.email,
          user_name: userProfile?.nome || user!.email,
          cpf_cnpj: cpfCnpj,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erro ao iniciar pagamento');

      setPaymentUrl(result.paymentUrl);
      setWaitingPayment(true);
      window.open(result.paymentUrl, '_blank', 'noopener,noreferrer');
    } catch (error: any) {
      toast({ title: 'Erro no pagamento', description: error.message, variant: 'destructive' });
    } finally {
      setPaymentLoading(false);
    }
  };

  if (gate.state === 'loading' || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pana-bg">
        <PanaLoader label="Carregando..." />
      </div>
    );
  }
  if (gate.state === 'redirect') {
    return <Navigate to={gate.to} replace />;
  }

  return (
    <div className="min-h-screen bg-pana-bg font-inter flex flex-col">
      <header className="bg-pana-indigo py-5 px-6 flex items-center justify-center">
        <img src="/brand/panalearn-horizontal-white.png" alt="PanaLearn" className="h-8 w-auto" />
      </header>

      <div className="w-full max-w-3xl mx-auto px-6 py-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-pana-petal-soft mx-auto mb-5 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-pana-grape" />
          </div>
          <h1 className="font-quicksand text-3xl font-bold text-pana-indigo mb-2">
            Reative sua plataforma
          </h1>
          <p className="text-sm text-pana-text-secondary">
            Sua plataforma <span className="font-semibold text-pana-indigo">{empresa!.nome}</span> está pausada.
            Escolha um plano para continuar de onde parou — seus cursos, alunos e configurações estão intactos.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {waitingPayment ? (
            <div className="text-center py-4">
              {!pollTimedOut ? (
                <>
                  <Loader2 className="w-10 h-10 animate-spin text-pana-teal mx-auto mb-4" />
                  <h2 className="font-quicksand text-2xl font-bold text-pana-indigo mb-2">Aguardando confirmação</h2>
                  <p className="text-sm text-pana-text-secondary mb-6">
                    Finalize o pagamento na aba que abrimos. Esta tela atualiza sozinha quando o Asaas confirmar.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="font-quicksand text-2xl font-bold text-pana-indigo mb-2">A confirmação está demorando</h2>
                  <p className="text-sm text-pana-text-secondary mb-6">
                    Seu pagamento pode ainda estar sendo processado pelo Asaas. Se já pagou, aguarde alguns minutos e atualize a página.
                  </p>
                  <a href="mailto:mipanalearn@gmail.com" className="inline-flex items-center gap-2 text-sm text-pana-teal hover:underline font-medium">
                    Falar com o suporte
                  </a>
                </>
              )}
              {paymentUrl && !pollTimedOut && (
                <a href={paymentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-pana-teal hover:underline font-medium">
                  <ExternalLink className="w-4 h-4" />
                  Abrir página de pagamento novamente
                </a>
              )}
              <div className="mt-8 pt-6 border-t border-pana-bone/40">
                <Button variant="outline" onClick={() => { setWaitingPayment(false); setPollTimedOut(false); }} className="border-pana-grape text-pana-grape hover:bg-pana-grape-muted">
                  Cancelar e voltar
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="font-quicksand text-xl font-bold text-pana-indigo mb-1">Escolha seu plano</h2>
              <p className="text-sm text-pana-text-secondary mb-6">
                Plano anterior: <span className="font-medium text-pana-indigo">{empresa!.plan || 'nenhum'}</span>
                {empresa!.plan_status && (
                  <> · status: <span className="font-medium text-pana-indigo">{empresa!.plan_status}</span></>
                )}
              </p>

              <div className="flex flex-col gap-3 mb-6">
                {PLANOS.map(plano => {
                  const selected = planoSelecionado === plano.id;
                  const Icon = plano.icon;
                  return (
                    <div
                      key={plano.id}
                      onClick={() => setPlanoSelecionado(plano.id)}
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
                      {selected && <CheckCircle2 className="absolute top-4 right-4 w-5 h-5 text-pana-teal" />}
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

              <Button
                onClick={handleStartTrial}
                disabled={!planoSelecionado || trialLoading}
                className="w-full bg-pana-teal hover:bg-pana-teal-dark text-white rounded-xl h-12 font-medium mb-3 disabled:opacity-40"
              >
                {trialLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Reativando...</>
                  : <><Gift className="w-4 h-4 mr-2" />Reativar com 14 dias grátis</>}
              </Button>
              <p className="text-xs text-pana-text-secondary text-center mb-6">Sem cartão de crédito. Cancele quando quiser.</p>

              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-pana-bone/40" />
                <p className="text-xs text-pana-text-secondary font-medium">ou pague agora</p>
                <div className="flex-1 h-px bg-pana-bone/40" />
              </div>

              <div className="mb-4">
                <Label htmlFor="cpfCnpj" className="text-sm font-medium text-pana-indigo">CPF ou CNPJ *</Label>
                <Input
                  id="cpfCnpj"
                  value={cpfCnpj}
                  onChange={e => setCpfCnpj(e.target.value)}
                  placeholder="000.000.000-00 ou 00.000.000/0001-00"
                  className="mt-1"
                />
                <p className="text-xs text-pana-text-secondary mt-1">Necessário para emissão de cobrança via Asaas</p>
              </div>

              <Button
                onClick={handlePagar}
                disabled={!planoSelecionado || paymentLoading}
                variant="outline"
                className="w-full border border-pana-grape text-pana-grape hover:bg-pana-grape-muted rounded-xl h-12 font-medium disabled:opacity-40"
              >
                {paymentLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Redirecionando para pagamento...</>
                  : <><CreditCard className="w-4 h-4 mr-2" />Pagar agora — {planoInfo?.precoLabel || ''}</>}
              </Button>

              <div className="flex items-center justify-center gap-4 mt-4">
                <div className="flex items-center gap-1.5 text-xs text-pana-text-secondary"><ShieldCheck className="w-3.5 h-3.5" />Pagamento seguro</div>
                <div className="flex items-center gap-1.5 text-xs text-pana-text-secondary"><ShieldCheck className="w-3.5 h-3.5" />Boleto, PIX ou cartão</div>
              </div>

              <div className="mt-8 pt-6 border-t border-pana-bone/40 text-center">
                <button
                  onClick={async () => { await supabase.auth.signOut(); navigate('/login'); }}
                  className="text-xs text-pana-text-secondary hover:text-pana-grape underline"
                >
                  Sair da conta
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
