import { useEffect } from 'react';
import { prefersReducedMotion } from '../../lib/gsap';

/**
 * Faz o brilho dourado dos cards `.lift-card` seguir o cursor.
 * Um único listener delegado no documento; escreve --mx/--my via rAF.
 * Monte uma vez (App). Não renderiza nada.
 */
export function Spotlight() {
  useEffect(() => {
    if (prefersReducedMotion() || !window.matchMedia('(hover: hover)').matches) return;
    let frame = 0;
    let target: HTMLElement | null = null;
    let x = 0;
    let y = 0;

    const apply = () => {
      frame = 0;
      if (!target) return;
      target.style.setProperty('--mx', `${x}px`);
      target.style.setProperty('--my', `${y}px`);
    };

    const onMove = (e: PointerEvent) => {
      const card = (e.target as HTMLElement | null)?.closest?.('.lift-card') as HTMLElement | null;
      if (!card) return;
      const r = card.getBoundingClientRect();
      target = card;
      x = e.clientX - r.left;
      y = e.clientY - r.top;
      if (!frame) frame = requestAnimationFrame(apply);
    };

    document.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      document.removeEventListener('pointermove', onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
