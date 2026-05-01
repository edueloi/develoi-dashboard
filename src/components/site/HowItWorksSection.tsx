import React from 'react';
import { motion } from 'framer-motion';
import { Search, Lightbulb, Code2, Rocket } from 'lucide-react';

const steps = [
  { num: '01', title: 'Imersão & Estratégia', desc: 'Mergulhamos fundo no seu modelo de negócio para identificar dores e oportunidades reais.', icon: Search },
  { num: '02', title: 'Arquitetura de Solução', desc: 'Desenhamos a infraestrutura ideal e a experiência do usuário focada em conversão.', icon: Lightbulb },
  { num: '03', title: 'Desenvolvimento', desc: 'Nossa equipe constrói seu projeto com as tecnologias mais modernas, seguras e eficientes do mercado.', icon: Code2 },
  { num: '04', title: 'Escala & Performance', desc: 'Lançamos e otimizamos continuamente para garantir que seu negócio nunca pare de crescer.', icon: Rocket },
];

export default function HowItWorksSection() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-5 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--brand-gold)' }}>Nossa metodologia</span>
            <span className="w-5 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
          </div>
          <h2 className="font-black tracking-tight mb-4" style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', color: 'var(--brand-navy)' }}>
            Como criamos seu sucesso
          </h2>
          <p className="text-sm max-w-xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Um processo refinado que transforma ideias complexas em plataformas de alta performance.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-white rounded-2xl p-6 border relative overflow-hidden transition-all duration-250 hover:-translate-y-1"
              style={{ borderColor: 'var(--border-color)', boxShadow: '0 2px 12px rgba(13,31,78,0.05)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,154,42,0.35)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(13,31,78,0.1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(13,31,78,0.05)'; }}
            >
              {/* Step number watermark */}
              <div className="absolute -top-4 -right-2 text-8xl font-black select-none pointer-events-none" style={{ color: 'rgba(13,31,78,0.04)' }}>{step.num}</div>

              {/* Top accent */}
              <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl" style={{ background: 'linear-gradient(90deg,var(--brand-gold),rgba(196,154,42,0.2))' }} />

              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ background: 'var(--bg-tertiary)' }}>
                <step.icon className="w-5 h-5" style={{ color: 'var(--brand-navy)' }} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--brand-gold)' }}>Fase {step.num}</p>
              <h4 className="font-black text-sm leading-snug mb-3 tracking-tight" style={{ color: 'var(--brand-navy)' }}>{step.title}</h4>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
