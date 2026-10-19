import React, { useRef } from 'react';
import { Reveal, Stagger, SplitReveal } from '../motion';
import { gsap, useGSAP, prefersReducedMotion } from '../../lib/gsap';
import { Search, Lightbulb, Code2, Rocket } from 'lucide-react';

const steps = [
  { num: '01', title: 'Imersão & Estratégia', desc: 'Mergulhamos fundo no seu modelo de negócio para identificar dores e oportunidades reais.', icon: Search },
  { num: '02', title: 'Arquitetura de Solução', desc: 'Desenhamos a infraestrutura ideal e a experiência do usuário focada em conversão.', icon: Lightbulb },
  { num: '03', title: 'Desenvolvimento', desc: 'Nossa equipe constrói seu projeto com as tecnologias mais modernas, seguras e eficientes do mercado.', icon: Code2 },
  { num: '04', title: 'Escala & Performance', desc: 'Lançamos e otimizamos continuamente para garantir que seu negócio nunca pare de crescer.', icon: Rocket },
];

export default function HowItWorksSection() {
  const gridRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  // Linha dourada conectando as fases, desenhada conforme o scroll (apenas desktop)
  useGSAP(() => {
    if (!gridRef.current || !lineRef.current || prefersReducedMotion()) return;
    gsap.matchMedia().add('(min-width: 1024px)', () => {
      gsap.fromTo(lineRef.current, { scaleX: 0 }, {
        scaleX: 1, ease: 'none', transformOrigin: 'left center',
        scrollTrigger: { trigger: gridRef.current, start: 'top 80%', end: 'bottom 60%', scrub: 0.6 },
      });
    });
  }, { scope: gridRef });

  return (
    <section className="relative py-20 md:py-28 overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">

        {/* Header */}
        <Reveal distance={16} className="text-center mb-14">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-5 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--brand-gold)' }}>Nossa metodologia</span>
            <span className="w-5 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
          </div>
          <SplitReveal as="h2" className="font-black tracking-tight mb-4" style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', color: 'var(--brand-navy)' }}>
            Como criamos seu sucesso
          </SplitReveal>
          <p className="text-sm max-w-xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Um processo refinado que transforma ideias complexas em plataformas de alta performance.
          </p>
        </Reveal>

        {/* Steps */}
        <div ref={gridRef} className="relative">
          <div ref={lineRef} aria-hidden className="hidden lg:block absolute left-0 right-0 top-[44px] h-[2px]" style={{ background: 'linear-gradient(90deg,var(--brand-gold),rgba(196,154,42,0.25))' }} />
        <Stagger className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5" stagger={0.1} distance={20}>
          {steps.map((step, idx) => (
            <div key={idx}
              className="lift-card rounded-2xl p-6 relative overflow-hidden"
            >
              {/* Step number watermark */}
              <div className="absolute -top-4 -right-2 text-8xl font-black select-none pointer-events-none" style={{ color: 'rgba(13,31,78,0.04)' }}>{step.num}</div>

              {/* Top accent */}
              <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl" style={{ background: 'linear-gradient(90deg,var(--brand-gold),rgba(196,154,42,0.2))' }} />

              <div className="icon-tile w-11 h-11 mb-5">
                <step.icon className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--brand-gold)' }}>Fase {step.num}</p>
              <h4 className="font-black text-sm leading-snug mb-3 tracking-tight" style={{ color: 'var(--brand-navy)' }}>{step.title}</h4>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{step.desc}</p>
            </div>
          ))}
        </Stagger>
        </div>
      </div>
    </section>
  );
}
