import React from 'react';
import { motion } from 'framer-motion';
import { Heart, CheckCircle2, Target, Users } from 'lucide-react';

const cards = [
  { icon: Heart, title: 'Atendimento próximo', desc: 'Tratamos cada cliente como parceiro real.' },
  { icon: CheckCircle2, title: 'Compromisso real', desc: 'Entregamos o que prometemos, sempre.' },
  { icon: Target, title: 'Soluções sob medida', desc: 'Sistemas feitos para a sua realidade.' },
  { icon: Users, title: 'Foco em resultado', desc: 'O seu crescimento é o nosso sucesso.' },
];

export default function AboutSection() {
  return (
    <section className="relative py-20 md:py-28" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Esquerda */}
          <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 mb-5">
              <span className="w-5 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--brand-gold)' }}>Quem somos</span>
            </div>
            <h2 className="font-black tracking-tight leading-tight mb-6" style={{ fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', color: 'var(--brand-navy)' }}>
              Somos mais do que uma empresa de{' '}
              <span style={{ color: 'var(--brand-gold)' }}>tecnologia.</span>
            </h2>
            <div className="space-y-4 mb-8 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <p>A Develoi nasceu com uma essência familiar e um propósito claro: usar a tecnologia para ajudar pessoas e empresas a evoluírem de verdade.</p>
              <p>Não somos apenas fornecedores de código. Nós nos envolvemos de verdade nos projetos, entendemos suas dores, comemoramos suas vitórias e trabalhamos lado a lado para garantir resultados palpáveis.</p>
            </div>
            <div className="pl-4 py-3 text-sm font-semibold leading-relaxed" style={{ borderLeft: '3px solid var(--brand-gold)', color: 'var(--brand-navy)', background: 'rgba(196,154,42,0.05)' }}>
              "Não somos apenas uma empresa de tecnologia. Somos parceiros na construção do seu crescimento."
            </div>
          </motion.div>

          {/* Direita — cards */}
          <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cards.map((card, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="bg-white rounded-2xl p-6 border transition-all duration-250 hover:-translate-y-1"
                style={{ borderColor: 'var(--border-color)', boxShadow: '0 2px 12px rgba(13,31,78,0.05)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,154,42,0.35)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(13,31,78,0.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(13,31,78,0.05)'; }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: 'var(--bg-tertiary)' }}>
                  <card.icon className="w-5 h-5" style={{ color: 'var(--brand-navy)' }} />
                </div>
                <h4 className="font-black text-sm mb-1" style={{ color: 'var(--brand-navy)' }}>{card.title}</h4>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{card.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
