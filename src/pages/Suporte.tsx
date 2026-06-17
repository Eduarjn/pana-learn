import { useState } from 'react';
import { ERALayout } from '@/components/ERALayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Headset, Send, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const ASSUNTOS = [
  'Problema técnico',
  'Dúvida sobre funcionalidade',
  'Solicitação de recurso',
  'Problema de pagamento',
  'Configuração de ambiente',
  'Outro',
];

const SLA_INFO = [
  { icon: AlertTriangle, label: 'Crítico', tempo: 'Até 2h', color: '#ef4444' },
  { icon: Clock, label: 'Normal', tempo: 'Até 24h', color: '#f59e0b' },
  { icon: CheckCircle, label: 'Baixo', tempo: 'Até 48h', color: '#22c55e' },
];

export default function Suporte() {
  const { userProfile } = useAuth();
  const [assunto, setAssunto] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState('normal');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleEnviar = async () => {
    if (!assunto || !titulo.trim() || !descricao.trim()) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha todos os campos.', variant: 'destructive' });
      return;
    }

    setEnviando(true);

    // Construir o corpo do e-mail
    const corpo = [
      `Assunto: ${assunto}`,
      `Prioridade: ${prioridade}`,
      `Título: ${titulo}`,
      '',
      `Descrição:`,
      descricao,
      '',
      `---`,
      `Enviado por: ${userProfile?.nome || 'N/A'} (${userProfile?.email || 'N/A'})`,
      `Tipo: ${userProfile?.tipo_usuario || 'N/A'}`,
      `Data: ${new Date().toLocaleString('pt-BR')}`,
    ].join('\n');

    // Usar mailto como fallback (funciona em qualquer ambiente)
    const mailtoUrl = `mailto:mipanalearn@gmail.com?subject=${encodeURIComponent(`[SLA ${prioridade.toUpperCase()}] ${titulo}`)}&body=${encodeURIComponent(corpo)}`;
    window.open(mailtoUrl, '_blank');

    setEnviado(true);
    setEnviando(false);

    toast({
      title: 'Ticket enviado!',
      description: 'Nosso time vai responder dentro do prazo SLA do seu plano.',
    });

    // Reset após 3s
    setTimeout(() => {
      setEnviado(false);
      setAssunto('');
      setTitulo('');
      setDescricao('');
      setPrioridade('normal');
    }, 3000);
  };

  return (
    <ERALayout>
      <div className="min-h-screen bg-pana-bg pb-10 font-inter">
        {/* Header de marca — sóbrio, sólido indigo */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full rounded-2xl mb-6 lg:mb-8 overflow-hidden bg-pana-indigo"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 rounded-full opacity-[0.07] bg-pana-teal" />
          <div className="pointer-events-none absolute right-24 -bottom-24 w-72 h-72 rounded-full opacity-[0.05] bg-pana-grape" />
          <div className="relative px-6 lg:px-10 py-8 lg:py-10">
            <div className="max-w-4xl mx-auto flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                <Headset className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-pana-teal" />
                  <span className="text-[11px] font-medium uppercase tracking-[0.07em] text-pana-bone/80">
                    Atendimento
                  </span>
                </div>
                <h1 className="font-quicksand font-bold text-2xl lg:text-3xl text-white">Suporte SLA</h1>
                <p className="text-sm text-pana-bone/80 mt-1">Envie uma solicitação e receba atendimento dentro do prazo garantido.</p>
              </div>
            </div>
          </div>
        </motion.header>

        <div className="max-w-4xl mx-auto px-4 lg:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulário */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2"
            >
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assunto *</Label>
                  <Select value={assunto} onValueChange={setAssunto}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecione o assunto" /></SelectTrigger>
                    <SelectContent>
                      {ASSUNTOS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Título *</Label>
                  <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Resuma o problema em uma frase" className="mt-1.5" />
                </div>

                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prioridade</Label>
                  <Select value={prioridade} onValueChange={setPrioridade}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critico">Crítico (SLA 2h)</SelectItem>
                      <SelectItem value="normal">Normal (SLA 24h)</SelectItem>
                      <SelectItem value="baixo">Baixo (SLA 48h)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descrição *</Label>
                  <Textarea
                    value={descricao}
                    onChange={e => setDescricao(e.target.value)}
                    placeholder="Descreva o problema ou dúvida em detalhes..."
                    rows={5}
                    className="mt-1.5 resize-none"
                  />
                </div>

                <Button
                  onClick={handleEnviar}
                  disabled={enviando || enviado}
                  className="w-full py-3 font-semibold"
                  style={{ background: enviado ? '#22c55e' : '#417B5A', color: '#fff' }}
                >
                  {enviado ? (
                    <><CheckCircle className="w-4 h-4 mr-2" /> Ticket enviado!</>
                  ) : enviando ? (
                    'Enviando...'
                  ) : (
                    <><Send className="w-4 h-4 mr-2" /> Enviar ticket de suporte</>
                  )}
                </Button>
              </div>
            </motion.div>

            {/* SLA Info */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                <h3 className="font-bold text-foreground mb-4 text-sm">Tempos de resposta SLA</h3>
                <div className="space-y-3">
                  {SLA_INFO.map(sla => (
                    <div key={sla.label} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                      <sla.icon className="w-5 h-5 flex-shrink-0" style={{ color: sla.color }} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{sla.label}</p>
                        <p className="text-xs text-muted-foreground">{sla.tempo}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                <h3 className="font-bold text-foreground mb-2 text-sm">Precisa de ajuda imediata?</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Para urgências, entre em contato direto pelo e-mail.
                </p>
                <a
                  href="mailto:mipanalearn@gmail.com"
                  className="text-sm font-semibold flex items-center gap-1.5"
                  style={{ color: '#417B5A' }}
                >
                  <Headset className="w-4 h-4" />
                  mipanalearn@gmail.com
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </ERALayout>
  );
}
