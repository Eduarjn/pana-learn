// Layout compartilhado das páginas legais (Privacidade, Termos).
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface LegalLayoutProps {
  titulo: string;
  atualizadoEm: string;
  children: React.ReactNode;
}

export default function LegalLayout({ titulo, atualizadoEm, children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-pana-bg font-inter text-pana-indigo">
      {/* Header */}
      <header className="bg-pana-indigo">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-pana-bone/80 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao site
          </Link>
          <img src="/brand/panalearn-horizontal-on-indigo.png" alt="PanaLearn" className="h-7 w-auto" />
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="font-quicksand font-bold text-3xl lg:text-4xl mb-2">{titulo}</h1>
        <p className="text-sm text-muted-foreground mb-10">Última atualização: {atualizadoEm}</p>

        <article className="legal-prose space-y-6 text-[15px] leading-relaxed text-foreground/90">
          {children}
        </article>

        <div className="mt-14 pt-6 border-t border-pana-bone/50 text-sm text-muted-foreground">
          <p>
            Dúvidas sobre este documento? Escreva para{' '}
            <a href="mailto:privacidade@panalearn.com" className="text-pana-teal hover:underline">
              privacidade@panalearn.com
            </a>.
          </p>
        </div>
      </main>

      <style>{`
        .legal-prose h2 {
          font-family: 'Quicksand', sans-serif;
          font-weight: 700;
          font-size: 1.25rem;
          color: #1F2041;
          margin-top: 2rem;
          margin-bottom: 0.5rem;
        }
        .legal-prose h3 {
          font-family: 'Quicksand', sans-serif;
          font-weight: 600;
          font-size: 1.05rem;
          color: #1F2041;
          margin-top: 1.25rem;
          margin-bottom: 0.4rem;
        }
        .legal-prose p { margin-bottom: 0.75rem; }
        .legal-prose ul { list-style: disc; padding-left: 1.4rem; margin-bottom: 0.75rem; }
        .legal-prose li { margin-bottom: 0.35rem; }
        .legal-prose a { color: #417B5A; }
        .legal-prose a:hover { text-decoration: underline; }
        .legal-prose strong { color: #1F2041; font-weight: 600; }
      `}</style>
    </div>
  );
}
