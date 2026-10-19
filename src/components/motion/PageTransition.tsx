import React, { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from '../../lib/gsap';

/** Animação de entrada de página. Use `key` = rota para reexecutar a cada navegação. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (ref.current && !prefersReducedMotion()) {
      gsap.fromTo(ref.current, { opacity: 0, y: 14 }, {
        opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', clearProps: 'opacity,transform',
      });
    }
    // recalcula posições dos ScrollTriggers da nova página
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 150);
    return () => window.clearTimeout(id);
  }, { scope: ref });
  return <div ref={ref}>{children}</div>;
}
