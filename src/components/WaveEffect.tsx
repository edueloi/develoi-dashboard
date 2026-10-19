import { useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap';

const WAVE1 = ["M0,50 C150,100 350,0 500,50 C650,100 850,0 1000,50 L1000,100 L0,100 Z", "M0,50 C150,0 350,100 500,50 C650,0 850,100 1000,50 L1000,100 L0,100 Z"];
const WAVE2 = ["M0,60 C150,10 350,110 500,60 C650,10 850,110 1000,60 L1000,100 L0,100 Z", "M0,60 C150,110 350,10 500,60 C650,110 850,10 1000,60 L1000,100 L0,100 Z"];

export default function WaveEffect() {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (prefersReducedMotion()) return;
    gsap.to('[data-wave="1"]', { attr: { d: WAVE1[1] }, duration: 4, ease: 'sine.inOut', repeat: -1, yoyo: true });
    gsap.to('[data-wave="2"]', { attr: { d: WAVE2[1] }, duration: 6, ease: 'sine.inOut', repeat: -1, yoyo: true });
  }, { scope: ref });

  return (
    <div ref={ref} className="absolute bottom-0 left-0 right-0 h-[300px] overflow-hidden pointer-events-none">
      <svg
        className="absolute bottom-0 w-[200%] h-full translate-x-[-25%] opacity-40"
        viewBox="0 0 1000 100"
        preserveAspectRatio="none"
      >
        <path
          data-wave="1"
          d={WAVE1[0]}
          fill="url(#gradient1)"
        />
        <path
          data-wave="2"
          d={WAVE2[0]}
          fill="url(#gradient2)"
        />
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00d2ff" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#9d50bb" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#00d2ff" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff00cc" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#00ff87" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#ff00cc" stopOpacity="0.1" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050505] to-transparent" />
    </div>
  );
}
