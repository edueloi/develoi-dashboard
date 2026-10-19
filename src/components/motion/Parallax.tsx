import React, { useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '../../lib/gsap';

interface ParallaxProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  /** deslocamento total em px ao longo do scroll (negativo sobe mais rápido) */
  y?: number;
}

/** Desloca o elemento durante o scroll (scrub). */
export function Parallax({ as: Tag = 'div', y = -60, children, ...rest }: ParallaxProps) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(() => {
    if (!ref.current || prefersReducedMotion()) return;
    gsap.fromTo(ref.current, { y: -y / 2 }, {
      y: y / 2, ease: 'none',
      scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
    });
  }, { scope: ref });
  return <Tag ref={ref} {...rest}>{children}</Tag>;
}
