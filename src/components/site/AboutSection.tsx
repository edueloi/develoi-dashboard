import React from 'react';
import { Reveal, Stagger, SplitReveal } from '../motion';
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
          <Reveal from="left" distance={24} duration={0.7}>
            <div className="inline-flex items-center gap-2 mb-5">
              <span className="w-5 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--brand-gold)' }}>Quem somos</span>
            </div>
            <SplitReveal as="h2" className="font-black tracking-tight leading-tight mb-6" style={{ fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', color: 'var(--brand-navy)' }}>
              Somos mais do que uma empresa de{' '}
              <span style={{ color: 'var(--brand-gold)' }}>tecnologia.</span>
            </SplitReveal>
            <div className="space-y-4 mb-8 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <p>A Develoi nasceu com uma essência familiar e um propósito claro: usar a tecnologia para ajudar pessoas e empresas a evoluírem de verdade.</p>
              <p>Não somos apenas fornecedores de código. Nós nos envolvemos de verdade nos projetos, entendemos suas dores, comemoramos suas vitórias e trabalhamos lado a lado para garantir resultados palpáveis.</p>
            </div>
            <div className="pl-5 pr-4 py-4 rounded-r-xl text-base font-semibold leading-relaxed" style={{ borderLeft: '4px solid var(--brand-gold)', color: 'var(--brand-navy)', background: 'rgba(196,154,42,0.07)' }}>
              "Não somos apenas uma empresa de tecnologia. Somos parceiros na construção do seu crescimento."
            </div>
            <div className="flex flex-wrap gap-3 mt-8">
              <a href="/valores" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity" style={{ background: 'var(--brand-navy)' }}>Missão, visão e valores →</a>
              <a href="/#contato" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border hover:bg-white transition-colors" style={{ borderColor: 'var(--border-color)', color: 'var(--brand-navy)' }}>Fale com a gente</a>
            </div>
          </Reveal>

          {/* Direita — cards */}
          <Stagger from="right" distance={24} stagger={0.1} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cards.map((card, idx) => (
              <div key={idx}
                className="lift-card rounded-2xl p-6"
              >
                <div className="icon-tile w-11 h-11 mb-4">
                  <card.icon className="w-5 h-5" />
                </div>
                <h4 className="font-black text-sm mb-1" style={{ color: 'var(--brand-navy)' }}>{card.title}</h4>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{card.desc}</p>
              </div>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}
