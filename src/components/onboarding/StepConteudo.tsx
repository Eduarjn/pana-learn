// src/components/onboarding/StepConteudo.tsx
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Video, FileText, HelpCircle, BookOpen, CheckCircle2 } from 'lucide-react';

const TIPOS = [
  { id: 'video',  label: 'Vídeos',    icon: Video,       desc: 'Aulas e treinamentos em vídeo' },
  { id: 'pdf',    label: 'PDFs',       icon: FileText,    desc: 'Materiais, apostilas e documentos' },
  { id: 'quiz',   label: 'Quizzes',    icon: HelpCircle,  desc: 'Avaliações e testes de conhecimento' },
  { id: 'trilha', label: 'Trilhas',    icon: BookOpen,    desc: 'Sequências de aprendizado completas' },
];

interface Props {
  data: any;
  updateData: (d: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepConteudo({ data, updateData, onNext, onBack }: Props) {
  const toggle = (id: string) => {
    const atual = data.contentTypes as string[];
    const novo = atual.includes(id) ? atual.filter((t: string) => t !== id) : [...atual, id];
    updateData({ contentTypes: novo });
  };

  const handleNext = async () => {
    if (data.organizationId) {
      // Progresso do onboarding (silencioso — colunas podem não existir)
      try {
        await supabase.from('empresas').update({
          updated_at: new Date().toISOString(),
        }).eq('id', data.organizationId);
      } catch { /* ignore */ }
    }
    onNext();
  };

  return (
    <div>
      <h2 className="font-quicksand text-2xl font-bold text-pana-indigo mb-1">Que tipo de conteúdo você vai usar?</h2>
      <p className="font-inter text-sm text-pana-text-secondary mb-8">Suba vídeos, PDFs, quizzes e monte trilhas de aprendizado completas.</p>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {TIPOS.map(tipo => {
          const selected = (data.contentTypes as string[]).includes(tipo.id);
          const Icon = tipo.icon;
          return (
            <button
              key={tipo.id}
              onClick={() => toggle(tipo.id)}
              className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                selected
                  ? 'border-pana-teal bg-pana-teal-muted'
                  : 'border-pana-bone/60 hover:border-pana-grape bg-white'
              }`}
            >
              {selected && (
                <CheckCircle2 className="absolute top-3 right-3 w-4 h-4 text-pana-teal" />
              )}
              <Icon className={`w-6 h-6 mb-2 ${selected ? 'text-pana-teal' : 'text-pana-text-secondary'}`} />
              <p className="font-semibold text-sm text-pana-indigo">
                {tipo.label}
              </p>
              <p className="text-xs text-pana-text-secondary mt-0.5">{tipo.desc}</p>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-pana-text-secondary text-center mb-6">
        Você poderá adicionar e gerenciar todo o conteúdo depois de finalizar a configuração.
      </p>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="border-pana-grape text-pana-grape hover:bg-pana-grape-muted">← Voltar</Button>
        <Button onClick={handleNext} className="bg-pana-teal hover:bg-pana-teal-dark text-white rounded-xl px-8 h-11 font-medium">
          Continuar →
        </Button>
      </div>
    </div>
  );
}
