import { useReducedMotion } from 'framer-motion';

export function useMotionSafe() {
  const prefersReduced = useReducedMotion();
  return {
    shouldAnimate: !prefersReduced,
    initial: (prefersReduced ? 'visible' : 'hidden') as 'visible' | 'hidden',
  };
}
