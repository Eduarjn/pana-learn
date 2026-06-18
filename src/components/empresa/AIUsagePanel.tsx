// Painel de gerenciamento do uso de IA por empresa (admin_master / admin).
// Mostra consumo do mês atual, limite efetivo, histórico (6 meses) e permite
// ajustar limite custom e zerar o consumo do mês.
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bot, RefreshCw, RotateCcw, Save, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const PLAN_TOKEN_LIMITS: Record<string, number> = {
  trial: 20000, starter: 50000, pro: 200000, enterprise: 1000000,
};

interface Props {
  empresaId: string;
  empresaNome: string;
  empresaPlan?: string | null;
}

interface MonthRow { period_month: string; tokens_used: number }

export function AIUsagePanel({ empresaId, empresaNome, empresaPlan }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [override, setOverride] = useState<number | null>(null);
  const [tokensUsed, setTokensUsed] = useState(0);
  const [history, setHistory] = useState<MonthRow[]>([]);
  const [limitInput, setLimitInput] = useState('');

  const planLimit = PLAN_TOKEN_LIMITS[(empresaPlan || 'trial').toLowerCase()] ?? PLAN_TOKEN_LIMITS.trial;
  const effectiveLimit = override ?? planLimit;
  const pct = effectiveLimit > 0 ? Math.min(100, (tokensUsed / effectiveLimit) * 100) : 0;
  const period = new Date().toISOString().slice(0, 7);

  const barColor = pct >= 90 ? '#DC2626' : pct >= 75 ? '#F59E0B' : '#417B5A';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: emp }, { data: cur }, { data: hist }] = await Promise.all([
        supabase.from('empresas').select('ai_tokens_limit_override').eq('id', empresaId).maybeSingle(),
        supabase.from('ai_token_usage').select('tokens_used').eq('empresa_id', empresaId).eq('period_month', period).maybeSingle(),
        supabase.from('ai_token_usage').select('period_month, tokens_used').eq('empresa_id', empresaId).order('period_month', { ascending: false }).limit(6),
      ]);
      const ov = (emp as any)?.ai_tokens_limit_override;
      setOverride(ov === null || ov === undefined ? null : Number(ov));
      setTokensUsed(Number((cur as any)?.tokens_used || 0));
      setHistory((hist as any) || []);
    } catch (e) {
      console.error('[AIUsagePanel] load error', e);
    } finally {
      setLoading(false);
    }
  }, [empresaId, period]);

  useEffect(() => { load(); }, [load]);

  const callAdmin = async (action: 'set_limit' | 'clear_limit' | 'reset_usage', value?: number) => {
    setSaving(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error('Sessão expirada.');
      const res = await fetch('/api/admin-ai-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ empresa_id: empresaId, action, value }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Erro');
      toast({ title: '✅ Sucesso', description: j.message });
      await load();
    } catch (e: any) {
      toast({ title: '❌ Erro', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const onSetLimit = () => {
    const n = Number(limitInput.replace(/\D/g, ''));
    if (!Number.isFinite(n) || n < 0) {
      toast({ title: 'Valor inválido', description: 'Digite um número de tokens (ex.: 100000)', variant: 'destructive' });
      return;
    }
    callAdmin('set_limit', n);
    setLimitInput('');
  };

  const onClearLimit = () => callAdmin('clear_limit');

  const onResetUsage = () => {
    if (!confirm(`Zerar o consumo de tokens da IA de ${empresaNome} no mês atual? Esta ação não pode ser desfeita.`)) return;
    callAdmin('reset_usage');
  };

  const fmt = (n: number) => n.toLocaleString('pt-BR');

  return (
    <div className="space-y-4">
      <Card style={{ border: '0.5px solid #e4e5f0', borderRadius: '12px' }}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="h-4 w-4 text-purple-600" />
              Suporte IA — {empresaNome}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={load} disabled={loading} title="Recarregar">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...
            </div>
          ) : (
            <>
              {/* Uso no mês atual */}
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-xs text-gray-500">Uso em {period}</span>
                  <span className="text-xs text-gray-500">{pct.toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-gray-900">{fmt(tokensUsed)} <span className="text-gray-400 font-normal">tokens</span></span>
                  <span className="text-sm text-gray-500">limite: <strong className="text-gray-900">{fmt(effectiveLimit)}</strong></span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Plano <strong>{(empresaPlan || 'trial').toLowerCase()}</strong> = {fmt(planLimit)} tokens/mês
                  {override !== null && <span className="ml-1 text-purple-600">· override custom ativo</span>}
                </div>
                {pct >= 90 && (
                  <div className="mt-2 flex items-start gap-2 text-xs text-red-700 bg-red-50 rounded-lg p-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Empresa está a {(100 - pct).toFixed(1)}% do limite mensal. A IA para de responder ao atingir 100%.</span>
                  </div>
                )}
              </div>

              {/* Ajustar limite custom */}
              <div className="border-t pt-4">
                <Label className="text-xs font-medium">Definir limite custom (sobrescreve o plano)</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    placeholder={`Atual: ${fmt(effectiveLimit)}`}
                    value={limitInput}
                    onChange={(e) => setLimitInput(e.target.value)}
                    disabled={saving}
                    inputMode="numeric"
                  />
                  <Button onClick={onSetLimit} disabled={saving || !limitInput} size="sm">
                    <Save className="h-4 w-4 mr-1" /> Salvar
                  </Button>
                  {override !== null && (
                    <Button onClick={onClearLimit} disabled={saving} size="sm" variant="outline" title="Voltar a usar o limite padrão do plano">
                      Padrão do plano
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1.5">Use 0 para bloquear totalmente o uso de IA desta empresa.</p>
              </div>

              {/* Reset do mês */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-medium">Zerar consumo do mês atual</Label>
                    <p className="text-xs text-gray-500 mt-0.5">Útil em caso de bug ou cortesia ao cliente.</p>
                  </div>
                  <Button onClick={onResetUsage} disabled={saving} variant="outline" size="sm" className="text-orange-600 hover:text-orange-700">
                    <RotateCcw className="h-4 w-4 mr-1" /> Zerar mês
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Histórico */}
      {!loading && history.length > 0 && (
        <Card style={{ border: '0.5px solid #e4e5f0', borderRadius: '12px' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Histórico (últimos meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {history.map((h) => (
                <div key={h.period_month} className="flex justify-between items-center text-sm py-1.5 border-b last:border-0">
                  <span className="text-gray-600">{h.period_month}</span>
                  <span className="font-medium text-gray-900">{fmt(Number(h.tokens_used))} <span className="text-gray-400 text-xs">tokens</span></span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
