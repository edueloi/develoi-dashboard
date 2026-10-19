import React, { useRef } from 'react';
import { gsap, useGSAP } from '../../lib/gsap';

/** Barra de progresso de leitura no topo da página. */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    gsap.fromTo(ref.current, { scaleX: 0 }, {
      scaleX: 1, ease: 'none',
      scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
    });
  }, { scope: ref });
  return (
    <div
      ref={ref}
      className="fixed top-0 left-0 right-0 h-[3px] z-[60] origin-left"
      style={{ transform: 'scaleX(0)', background: 'linear-gradient(90deg, var(--brand-navy), var(--brand-gold))' }}
    />
  );
}
