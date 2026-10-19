import React, { useEffect, useRef, useState } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '../../lib/gsap';

interface PresenceProps {
  open: boolean;
  children: React.ReactNode;
  /** monta a animação de entrada; `root` é o wrapper (use root.querySelector('[data-p="panel"]')) */
  enter: (root: HTMLElement) => gsap.core.Animation;
  /** animação de saída; o conteúdo só é desmontado quando ela termina */
  exit: (root: HTMLElement) => gsap.core.Animation;
}

/**
 * Substitui o AnimatePresence: mantém o conteúdo montado até a animação de
 * saída do GSAP terminar. O wrapper usa display:contents (não afeta layout).
 */
export function Presence({ open, children, enter, exit }: PresenceProps) {
  const [mounted, setMounted] = useState(open);
  const ref = useRef<HTMLDivElement>(null);
  const anim = useRef<gsap.core.Animation | null>(null);

  useEffect(() => { if (open) setMounted(true); }, [open]);

  useGSAP(() => {
    const root = ref.current;
    anim.current?.kill();
    if (!root) return;
    if (prefersReducedMotion()) { if (!open) setMounted(false); return; }
    if (open) {
      anim.current = enter(root);
    } else {
      anim.current = exit(root).eventCallback('onComplete', () => setMounted(false));
    }
  }, { dependencies: [open, mounted], scope: ref });

  if (!mounted && !open) return null;
  return <div ref={ref} style={{ display: 'contents' }}>{children}</div>;
}
