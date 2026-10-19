import React, { useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '../../lib/gsap';

interface CountUpProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** texto com número: "+50", "98%", "+10k", "R$ 1.200" */
  value: string;
  duration?: number;
}

/** Conta de 0 até o número contido em `value`, preservando prefixo/sufixo. */
export function CountUp({ value, duration = 1.8, ...rest }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  useGSAP(() => {
    const el = ref.current;
    const m = value.match(/^(\D*)(\d[\d.,]*)(.*)$/);
    if (!el || !m || prefersReducedMotion()) return;
    const [, prefix, num, suffix] = m;
    const target = parseFloat(num.replace(/\./g, '').replace(',', '.'));
    if (Number.isNaN(target)) return;
    const state = { n: 0 };
    el.textContent = `${prefix}0${suffix}`;
    gsap.to(state, {
      n: target, duration, ease: 'power2.out',
      onUpdate: () => {
        el.textContent = `${prefix}${Math.round(state.n).toLocaleString('pt-BR')}${suffix}`;
      },
      onComplete: () => { el.textContent = value; },
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  }, { scope: ref, dependencies: [value] });
  return <span ref={ref} {...rest}>{value}</span>;
}
