import React, { useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '../../lib/gsap';

export type RevealFrom = 'up' | 'down' | 'left' | 'right' | 'fade' | 'scale';

export function fromVars(from: RevealFrom, distance: number): gsap.TweenVars {
  switch (from) {
    case 'up': return { y: distance };
    case 'down': return { y: -distance };
    case 'left': return { x: -distance };
    case 'right': return { x: distance };
    case 'scale': return { scale: 0.92 };
    default: return {};
  }
}

interface RevealProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  from?: RevealFrom;
  delay?: number;
  duration?: number;
  distance?: number;
  /** posição do ScrollTrigger (padrão: topo do elemento a 88% da viewport) */
  start?: string;
  /** anima assim que monta, sem esperar scroll (para itens acima da dobra) */
  immediate?: boolean;
}

/** Revela o elemento com fade + deslocamento quando entra na viewport. */
export function Reveal({
  as: Tag = 'div', from = 'up', delay = 0, duration = 0.85, distance = 32,
  start = 'top 88%', immediate = false, children, ...rest
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(() => {
    if (!ref.current || prefersReducedMotion()) return;
    gsap.from(ref.current, {
      ...fromVars(from, distance), opacity: 0, duration, delay,
      clearProps: 'opacity,transform',
      scrollTrigger: immediate ? undefined : { trigger: ref.current, start, once: true },
    });
  }, { scope: ref });
  return <Tag ref={ref} {...rest}>{children}</Tag>;
}

interface StaggerProps extends RevealProps {
  /** seletor dos itens animados dentro do container (padrão: filhos diretos) */
  target?: string;
  stagger?: number;
}

/** Revela os filhos em cascata quando o container entra na viewport. */
export function Stagger({
  as: Tag = 'div', from = 'up', delay = 0, duration = 0.7, distance = 28, stagger = 0.09,
  start = 'top 85%', immediate = false, target, children, ...rest
}: StaggerProps) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(() => {
    if (!ref.current || prefersReducedMotion()) return;
    const items = target ? ref.current.querySelectorAll(target) : ref.current.children;
    if (!items.length) return;
    gsap.from(items, {
      ...fromVars(from, distance), opacity: 0, duration, delay, stagger,
      clearProps: 'opacity,transform',
      scrollTrigger: immediate ? undefined : { trigger: ref.current, start, once: true },
    });
  }, { scope: ref });
  return <Tag ref={ref} {...rest}>{children}</Tag>;
}
