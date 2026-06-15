// Carrossel de destaque da landing — imagem de um lado, texto do outro,
// trocando automaticamente a cada 4s. Respeita prefers-reduced-motion.
//
// ┌─────────────────────────────────────────────────────────────┐
// │  COMO EDITAR: troque os itens do array SLIDES abaixo.         │
// │  - image: caminho da imagem (coloque os arquivos em           │
// │    public/landing/ e referencie como '/landing/arquivo.png')  │
// │  - eyebrow / title / description: textos de cada slide        │
// │  A ORDEM do array = a ordem em que as imagens passam.         │
// └─────────────────────────────────────────────────────────────┘

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface Slide {
  image: string;        // ex: '/landing/dashboard.png'  (vazio = placeholder)
  eyebrow: string;      // rótulo curto acima do título
  title: string;        // título do slide
  description: string;  // descrição
}

// ⬇️ EDITE AQUI. Salve os 5 prints em public/landing/ com estes nomes exatos.
const SLIDES: Slide[] = [
  {
    image: '/landing/01-dashboard.jpg',
    eyebrow: 'Painel',
    title: 'Acompanhe o progresso em um só lugar',
    description: 'Cada aluno vê seus cursos, módulos concluídos e próximos passos. Administradores acompanham as métricas da organização em tempo real.',
  },
  {
    image: '/landing/02-treinamentos.jpg',
    eyebrow: 'Trilhas de aprendizado',
    title: 'Cursos organizados em trilhas',
    description: 'Crie categorias, importe vídeos e estruture treinamentos do básico ao avançado — tudo com poucos cliques.',
  },
  {
    image: '/landing/03-quizzes.jpg',
    eyebrow: 'Avaliação',
    title: 'Quizzes e avaliação automática',
    description: 'Gere quizzes de conclusão para cada curso e avalie o conhecimento dos alunos de forma automática.',
  },
  {
    image: '/landing/04-certificados.jpg',
    eyebrow: 'Certificação',
    title: 'Certificados emitidos automaticamente',
    description: 'Ao concluir um curso, o aluno recebe um certificado validável. Acompanhe todas as emissões em um painel único.',
  },
  {
    image: '/landing/05-usuarios.jpg',
    eyebrow: 'Gestão',
    title: 'Gerencie sua equipe com facilidade',
    description: 'Cadastre alunos e administradores, defina permissões e acompanhe os acessos — com isolamento total por organização.',
  },
];

const INTERVAL = 4000; // 4 segundos por slide

export default function FeatureCarousel() {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const prefersReduced = useReducedMotion();
  const count = SLIDES.length;

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  useEffect(() => {
    if (count <= 1) return;
    const id = setInterval(() => setIndex(i => (i + 1) % count), INTERVAL);
    return () => clearInterval(id);
  }, [count]);

  const slide = SLIDES[index];

  return (
    <section className="lp-sec" style={{ background: '#FFFFFF' }}>
      <div className="lp-container">
        <div className="lp-center lp-fade" style={{ marginBottom: 40 }}>
          <div className="lp-tag">Como funciona</div>
          <h2 className="lp-title">Tudo que sua organização precisa para ensinar</h2>
          <p className="lp-subtitle">Uma plataforma completa, da criação do curso ao certificado.</p>
        </div>

        <div className="fc-grid">
          {/* Lado da imagem */}
          <div className="fc-media">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                className="fc-media-inner"
                initial={prefersReduced ? false : { opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={prefersReduced ? undefined : { opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              >
                {slide.image && !failed[index] ? (
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="fc-img"
                    loading="lazy"
                    onError={() => setFailed(f => ({ ...f, [index]: true }))}
                  />
                ) : (
                  <div className="fc-placeholder">
                    <span>Imagem {index + 1}</span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Lado do texto */}
          <div className="fc-text">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={prefersReduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReduced ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              >
                <div className="fc-eyebrow">{slide.eyebrow}</div>
                <h3 className="fc-title">{slide.title}</h3>
                <p className="fc-desc">{slide.description}</p>
              </motion.div>
            </AnimatePresence>

            {/* Indicadores */}
            <div className="fc-dots" role="tablist" aria-label="Selecionar destaque">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Ir para o destaque ${i + 1}`}
                  onClick={() => go(i)}
                  className={`fc-dot ${i === index ? 'active' : ''}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .fc-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 48px;
          align-items: center;
        }
        .fc-media {
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 12px 28px rgba(31,32,65,0.16);
          background: #EDEDF4;
          border: 1px solid #E6E5EE;
          aspect-ratio: 16 / 10;
          padding: 10px;
        }
        .fc-media-inner { width: 100%; height: 100%; border-radius: 8px; overflow: hidden; }
        .fc-img { width: 100%; height: 100%; object-fit: cover; object-position: top center; display: block; }
        .fc-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #1F2041 0%, #4B3F72 100%);
          color: rgba(233,210,192,0.85);
          font-family: 'Quicksand', sans-serif; font-weight: 600; font-size: 1.1rem;
          letter-spacing: 0.04em;
        }
        .fc-eyebrow {
          display: inline-block;
          font-size: 0.72rem; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.08em; color: #417B5A; margin-bottom: 12px;
        }
        .fc-title {
          font-family: 'Quicksand', sans-serif; font-weight: 700;
          font-size: 1.8rem; line-height: 1.25; color: #1F2041; margin-bottom: 12px;
        }
        .fc-desc {
          font-size: 1.05rem; line-height: 1.65; color: #6B6B80; max-width: 460px;
        }
        .fc-dots { display: flex; gap: 8px; margin-top: 28px; }
        .fc-dot {
          width: 28px; height: 6px; border-radius: 999px; border: none;
          background: #E4E5F0; cursor: pointer; transition: background 0.2s, width 0.2s;
        }
        .fc-dot.active { background: #4B3F72; width: 40px; }
        @media (max-width: 860px) {
          .fc-grid { grid-template-columns: 1fr; gap: 28px; }
          .fc-title { font-size: 1.5rem; }
        }
      `}</style>
    </section>
  );
}
