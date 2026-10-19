import React from 'react';
import { Reveal, Stagger, SplitReveal, CountUp } from '../motion';
import { Zap, ShieldCheck, Sparkles, Users2 } from 'lucide-react';

const differentials = [
  { title: "Estratégia de Negócio", desc: "Não vendemos apenas código, construímos o motor que impulsiona seus resultados reais.", icon: Zap },
  { title: "Parceria Estratégica", desc: "Atuamos como seu CTO as a Service, pensando estrategicamente em cada decisão técnica.", icon: ShieldCheck },
  { title: "Design de Conversão", desc: "Interfaces que encantam e convertem, unindo estética premium com usabilidade absoluta.", icon: Sparkles },
  { title: "Suporte Pró-Ativo", desc: "Monitoramento constante e evolução contínua. Seu software nunca fica obsoleto.", icon: Users2 },
];

export default function DifferentialsSection() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">

        {/* Header */}
        <Reveal distance={16} className="text-center mb-14">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-5 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--brand-gold)' }}>Nossos diferenciais</span>
            <span className="w-5 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
          </div>
          <SplitReveal as="h2" className="font-black tracking-tight mb-4" style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', color: 'var(--brand-navy)' }}>
            Por que líderes escolhem a Develoi?
          </SplitReveal>
          <p className="text-sm max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Diferente de agências tradicionais, somos seu braço tecnológico estratégico focado em organizar, escalar e gerar resultado real.
          </p>
        </Reveal>

        {/* Cards */}
        <Stagger className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12" stagger={0.08} distance={16}>
          {differentials.map((item, idx) => (
            <div key={idx}
              className="lift-card rounded-2xl p-6 flex gap-5 items-start"
            >
              <div className="icon-tile w-11 h-11 flex-shrink-0">
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-base mb-2 tracking-tight" style={{ color: 'var(--brand-navy)' }}>{item.title}</h4>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </Stagger>

        {/* Banner ROI */}
        <Reveal distance={24}
          className="relative rounded-2xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#06112B 0%,#0D1F4E 100%)', boxShadow: '0 16px 48px rgba(13,31,78,0.2)' }}>
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg,var(--brand-gold),rgba(196,154,42,0.2) 70%,transparent)' }} />
          <div aria-hidden className="absolute inset-0 bg-dots opacity-40" />
          <div aria-hidden className="absolute -right-16 -top-20 w-80 h-80 rounded-full blur-[110px]" style={{ background: 'rgba(196,154,42,0.18)' }} />
          <div className="relative z-10 px-8 sm:px-14 py-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="font-black text-white tracking-tight mb-2" style={{ fontSize: 'clamp(1.3rem,2.5vw,1.8rem)' }}>
                Tecnologia que{' '}
                <span style={{ color: 'var(--brand-gold)' }}>paga o investimento.</span>
              </h3>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Nosso foco é o ROI. Se o software não gera mais lucro ou economiza tempo real, não faz sentido ser construído.
              </p>
            </div>
            <div className="text-center flex-shrink-0">
              <div className="text-6xl font-black text-gold-grad"><CountUp value="100%" /></div>
              <div className="text-[10px] font-black uppercase tracking-widest mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Comprometimento</div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
