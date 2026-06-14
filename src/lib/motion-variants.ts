import type { Variants } from 'framer-motion';

const ease = [0.4, 0, 0.2, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, ease } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease } },
};

export const slideLeft: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease } },
};

export const slideRight: Variants = {
  hidden: { opacity: 0, x: 8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease } },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

// Hero — única exceção com y: 24 e duração 500ms (limite máximo)
export const heroEntrance: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

// Container que sequencia badge → headline → subtitle → CTAs → trust
export const heroStagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

// Hover: lift -2px + shadow-md — para cards interativos (whileHover)
export const liftOnHover = {
  y: -2,
  boxShadow: '0 4px 12px rgba(31,32,65,0.10)',
  transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
};

// Tap: scale 0.96 (whileTap)
export const pressEffect = {
  scale: 0.96,
  transition: { duration: 0.1 },
};

// Hover do botão primário teal — glow verde (whileHover)
export const ctaGlow = {
  y: -2,
  boxShadow: '0 8px 24px rgba(65,123,90,0.30)',
  transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
};
