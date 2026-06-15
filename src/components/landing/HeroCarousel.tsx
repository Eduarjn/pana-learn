// Carrossel do hero — screenshots reais da plataforma girando numa moldura
// de "janela de app", trocando a cada 4s, com legenda que muda junto.
// Respeita prefers-reduced-motion.
import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface Slide { image: string; eyebrow: string; title: string; }

const SLIDES: Slide[] = [
  { image: '/landing/01-dashboard.jpg',    eyebrow: 'Painel',                title: 'Acompanhe o progresso em um só lugar' },
  { image: '/landing/02-treinamentos.jpg', eyebrow: 'Trilhas de aprendizado', title: 'Cursos organizados em trilhas' },
  { image: '/landing/03-quizzes.jpg',      eyebrow: 'Avaliação',             title: 'Quizzes e avaliação automática' },
  { image: '/landing/04-certificados.jpg', eyebrow: 'Certificação',          title: 'Certificados emitidos automaticamente' },
  { image: '/landing/05-usuarios.jpg',     eyebrow: 'Gestão',                title: 'Gerencie sua equipe com facilidade' },
];

const INTERVAL = 4000;

export default function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const prefersReduced = useReducedMotion();
  const count = SLIDES.length;

  useEffect(() => {
    if (count <= 1) return;
    const id = setInterval(() => setIndex(i => (i + 1) % count), INTERVAL);
    return () => clearInterval(id);
  }, [count]);

  const slide = SLIDES[index];

  return (
    <div className="hc-frame">
      {/* Barra de janela */}
      <div className="hc-hdr">
        <span className="hc-dot" /><span className="hc-dot" /><span className="hc-dot" />
        <div className="hc-bar" />
      </div>

      {/* Imagem */}
      <div className="hc-media">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            className="hc-media-inner"
            initial={prefersReduced ? false : { opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={prefersReduced ? undefined : { opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            {slide.image && !failed[index] ? (
              <img
                src={slide.image}
                alt={slide.title}
                className="hc-img"
                // Imagem do hero é o LCP (acima da dobra): carrega eager.
                // A primeira recebe prioridade alta para reduzir o LCP.
                loading="eager"
                // @ts-expect-error fetchpriority é valido em HTML, faltam tipos
                fetchpriority={index === 0 ? 'high' : 'auto'}
                onError={() => setFailed(f => ({ ...f, [index]: true }))}
              />
            ) : (
              <div className="hc-placeholder"><span>Imagem {index + 1}</span></div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Legenda + indicadores */}
      <div className="hc-cap">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={prefersReduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="hc-eyebrow">{slide.eyebrow}</div>
            <div className="hc-title">{slide.title}</div>
          </motion.div>
        </AnimatePresence>
        <div className="hc-dots">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              aria-label={`Ir para o destaque ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`hc-pdot ${i === index ? 'active' : ''}`}
            />
          ))}
        </div>
      </div>

      <style>{`
        .hc-frame {
          width: 100%;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 24px 60px rgba(0,0,0,0.35);
          backdrop-filter: blur(4px);
        }
        .hc-hdr {
          display: flex; align-items: center; gap: 6px;
          padding: 12px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.10);
        }
        .hc-dot { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.25); }
        .hc-dot:nth-child(1) { background: #ff5f57; }
        .hc-dot:nth-child(2) { background: #febc2e; }
        .hc-dot:nth-child(3) { background: #28c840; }
        .hc-bar { flex: 1; height: 8px; margin-left: 10px; border-radius: 999px; background: rgba(255,255,255,0.10); }
        .hc-media {
          aspect-ratio: 16 / 10;
          background: #1a1b38;
        }
        .hc-media-inner { width: 100%; height: 100%; }
        .hc-img { width: 100%; height: 100%; object-fit: cover; object-position: top center; display: block; }
        .hc-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #1F2041 0%, #4B3F72 100%);
          color: rgba(233,210,192,0.85);
          font-family: 'Quicksand', sans-serif; font-weight: 600;
        }
        .hc-cap {
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; padding: 16px 18px;
          border-top: 1px solid rgba(255,255,255,0.10);
        }
        .hc-eyebrow {
          font-size: 0.66rem; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.08em; color: #5C9A77; margin-bottom: 4px;
        }
        .hc-title {
          font-family: 'Quicksand', sans-serif; font-weight: 600;
          font-size: 0.98rem; color: #fff; line-height: 1.3;
        }
        .hc-dots { display: flex; gap: 6px; flex-shrink: 0; }
        .hc-pdot {
          width: 7px; height: 7px; border-radius: 50%; border: none;
          background: rgba(255,255,255,0.25); cursor: pointer; transition: background 0.2s, transform 0.2s;
        }
        .hc-pdot.active { background: #5C9A77; transform: scale(1.25); }
      `}</style>
    </div>
  );
}
