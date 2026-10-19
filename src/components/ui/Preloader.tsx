import React, { useRef, useState } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '../../lib/gsap';

export default function Preloader() {
  const [done, setDone] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (prefersReducedMotion()) { setDone(true); return; }
    gsap.set('[data-pl="logo"]', { opacity: 0, scale: 0.88, y: 10 });
    gsap.set('[data-pl="bar-wrap"]', { opacity: 0 });
    gsap.set('[data-pl="bar"]', { scaleX: 0 });

    gsap.timeline({ onComplete: () => setDone(true) })
      .to('[data-pl="glow"]', { scale: 1.25, duration: 2.2, ease: 'sine.inOut' }, 0)
      .to('[data-pl="logo"]', { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'expo.out' }, 0)
      .to('[data-pl="bar-wrap"]', { opacity: 1, duration: 0.4 }, 0.4)
      .to('[data-pl="bar"]', { scaleX: 1, duration: 1.6, ease: 'power2.inOut' }, 0.5)
      .to('[data-pl="content"]', { opacity: 0, y: -16, duration: 0.4, ease: 'power2.in' }, 2.2)
      // cortina sobe revelando o site
      .to(root.current, { yPercent: -100, duration: 0.7, ease: 'power4.inOut' }, 2.4);
  }, { scope: root });

  if (done) return null;

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      style={{ background: '#F8F9FC' }}
    >
      <div
        data-pl="glow"
        className="absolute w-[420px] h-[420px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(196,154,42,0.12) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          marginTop: -210,
          marginLeft: -210,
        }}
      />

      <div data-pl="content" className="relative flex flex-col items-center gap-8">
        <div data-pl="logo" className="w-56 md:w-72">
          <img src="/LOGO-MENU.png" alt="Develoi" className="w-full h-auto object-contain" />
        </div>

        <div data-pl="bar-wrap" className="w-48 h-[3px] rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
          <div
            data-pl="bar"
            className="h-full w-full rounded-full origin-left"
            style={{ background: 'linear-gradient(90deg, var(--brand-navy), var(--brand-gold))' }}
          />
        </div>
      </div>
    </div>
  );
}
