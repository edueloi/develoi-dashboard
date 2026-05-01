import React from 'react';
import { motion } from 'framer-motion';
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
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-5 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--brand-gold)' }}>Nossos diferenciais</span>
            <span className="w-5 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
          </div>
          <h2 className="font-black tracking-tight mb-4" style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', color: 'var(--brand-navy)' }}>
            Por que líderes escolhem a Develoi?
          </h2>
          <p className="text-sm max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Diferente de agências tradicionais, somos seu braço tecnológico estratégico focado em organizar, escalar e gerar resultado real.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
          {differentials.map((item, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="bg-white rounded-2xl p-6 border flex gap-5 items-start transition-all duration-250 hover:-translate-y-1"
              style={{ borderColor: 'var(--border-color)', boxShadow: '0 2px 12px rgba(13,31,78,0.05)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,154,42,0.35)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(13,31,78,0.1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(13,31,78,0.05)'; }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-tertiary)' }}>
                <item.icon className="w-5 h-5" style={{ color: 'var(--brand-navy)' }} />
              </div>
              <div>
                <h4 className="font-black text-base mb-2 tracking-tight" style={{ color: 'var(--brand-navy)' }}>{item.title}</h4>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Banner ROI */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="relative rounded-2xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#06112B 0%,#0D1F4E 100%)', boxShadow: '0 16px 48px rgba(13,31,78,0.2)' }}>
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg,var(--brand-gold),rgba(196,154,42,0.2) 70%,transparent)' }} />
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
              <div className="text-5xl font-black" style={{ color: 'var(--brand-gold)' }}>100%</div>
              <div className="text-[10px] font-black uppercase tracking-widest mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Comprometimento</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
