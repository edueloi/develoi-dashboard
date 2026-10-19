import React, { useRef } from 'react';
import { gsap, SplitText, useGSAP, prefersReducedMotion } from '../../lib/gsap';

interface SplitRevealProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  /** words (padrão) ou lines */
  by?: 'words' | 'lines';
  delay?: number;
  stagger?: number;
  immediate?: boolean;
  start?: string;
}

/** Títulos que sobem palavra por palavra, com máscara (SplitText). */
export function SplitReveal({
  as: Tag = 'h2', by = 'words', delay = 0, stagger = 0.06, immediate = false,
  start = 'top 85%', children, ...rest
}: SplitRevealProps) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    SplitText.create(el, {
      type: by === 'lines' ? 'lines' : 'lines,words',
      mask: 'lines',
      autoSplit: true,
      onSplit(self) {
        const targets = by === 'lines' ? self.lines : self.words;
        return gsap.from(targets, {
          yPercent: 110, opacity: 0, duration: 0.9, delay, stagger, ease: 'power4.out',
          scrollTrigger: immediate ? undefined : { trigger: el, start, once: true },
        });
      },
    });
  }, { scope: ref });
  return <Tag ref={ref} {...rest}>{children}</Tag>;
}
