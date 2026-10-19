import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

// Registro único dos plugins — importe sempre daqui, nunca direto de 'gsap'
gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

gsap.defaults({ ease: 'power3.out', duration: 0.7 });

/** Easings do design system Develoi */
export const EASE = {
  out: 'power3.out',
  expo: 'expo.out',
  soft: 'power2.out',
  inOut: 'power2.inOut',
  spring: 'back.out(1.5)',
} as const;

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export { gsap, ScrollTrigger, SplitText, useGSAP };
