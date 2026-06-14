// Palavras rotativas animadas — adaptado do animated-hero (21st.dev)
// para a marca PanaLearn: framer-motion (não motion/react), tokens da paleta.
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface RotatingWordsProps {
  /** Palavras que se alternam, ex: ['novo', 'prático', 'útil'] */
  words: string[];
  /** Intervalo entre trocas em ms (default 2200) */
  interval?: number;
  className?: string;
}

/**
 * Renderiza uma palavra que troca com animação de slide vertical.
 * Reserva a largura da maior palavra para não causar "pulo" no layout.
 */
export function RotatingWords({ words, interval = 2200, className }: RotatingWordsProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (words.length <= 1) return;
    const id = setTimeout(() => setIndex(i => (i + 1) % words.length), interval);
    return () => clearTimeout(id);
  }, [index, words.length, interval]);

  const longest = words.reduce((a, b) => (a.length >= b.length ? a : b), '');

  return (
    <span className={`relative inline-block align-bottom ${className ?? ''}`}>
      {/* spacer invisível reserva largura/altura */}
      <span className="invisible">{longest}</span>
      {words.map((word, i) => (
        <motion.span
          key={word}
          className="absolute inset-0 flex items-center justify-center font-semibold whitespace-nowrap"
          initial={{ opacity: 0, y: 24 }}
          transition={{ type: 'spring', stiffness: 60, damping: 14 }}
          animate={
            index === i
              ? { y: 0, opacity: 1 }
              : { y: index > i ? -28 : 28, opacity: 0 }
          }
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}
