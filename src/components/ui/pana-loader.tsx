// Loader da marca PanaLearn — adaptado do unique-loader-components (21st.dev)
// para framer-motion e a paleta da marca (grape / teal / indigo).
import { motion } from 'framer-motion';

const DOT_COLORS = ['#4B3F72', '#417B5A', '#1F2041']; // grape, teal, indigo

interface PanaLoaderProps {
  /** Texto opcional abaixo dos pontos */
  label?: string;
  /** Tamanho dos pontos em px (default 10) */
  size?: number;
  className?: string;
}

/** Loader centralizado com 3 pontos saltitantes nas cores da marca. */
export function PanaLoader({ label, size = 10, className }: PanaLoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className ?? ''}`}>
      <div className="flex items-center" style={{ gap: size * 0.6 }}>
        {DOT_COLORS.map((color, i) => (
          <motion.span
            key={i}
            className="rounded-full"
            style={{ width: size, height: size, background: color }}
            initial={{ y: 0, opacity: 0.6 }}
            animate={{ y: [0, -size * 0.8, 0], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 0.9, repeat: Infinity, repeatType: 'loop', delay: i * 0.15, ease: 'easeInOut' }}
          />
        ))}
      </div>
      {label && <p className="text-sm text-muted-foreground font-inter">{label}</p>}
    </div>
  );
}

/** Versão compacta inline para botões e áreas pequenas. */
export function PanaLoaderInline({ size = 7, className }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center ${className ?? ''}`} style={{ gap: size * 0.6 }}>
      {DOT_COLORS.map((color, i) => (
        <motion.span
          key={i}
          className="rounded-full"
          style={{ width: size, height: size, background: color }}
          animate={{ y: [0, -size * 0.7, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
        />
      ))}
    </span>
  );
}
