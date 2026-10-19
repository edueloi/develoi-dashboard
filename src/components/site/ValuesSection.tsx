import React from 'react';
import { Reveal, Stagger, SplitReveal } from '../motion';
import { Flame, Zap, TrendingUp, Heart, Users, Shield, Compass } from 'lucide-react';

const principles = [
  { label: 'Dedicação', icon: Flame, desc: 'Entregamos 100% em cada projeto.' },
  { label: 'Evolução', icon: TrendingUp, desc: 'Sempre aprendendo, sempre crescendo.' },
  { label: 'Resultado', icon: Zap, desc: 'Código que transforma negócios.' },
  { label: 'Humildade', icon: Heart, desc: 'Ouvimos antes de criar.' },
  { label: 'Ajuda', icon: Users, desc: 'Sucesso do cliente é nosso sucesso.' },
  { label: 'Empresa Familiar', icon: Shield, desc: 'Cuidamos de cada detalhe como nosso.' },
  { label: 'Fé', icon: Compass, desc: 'Confiança no propósito que nos guia.' },
];

export default function ValuesSection() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">

        {/* Header */}
        <Reveal distance={16} className="text-center mb-14">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-5 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--brand-gold)' }}>O que nos define</span>
            <span className="w-5 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
          </div>
          <SplitReveal as="h2" className="font-black tracking-tight mb-4" style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', color: 'var(--brand-navy)' }}>
            Nossos Princípios
          </SplitReveal>
          <p className="text-sm max-w-lg mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Não são regras em uma parede — são a alma de cada entrega, cada reunião e cada linha de código que produzimos.
          </p>
        </Reveal>

        {/* Grid */}
        <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-14" stagger={0.07} distance={16}>
          {principles.map((p, i) => (
            <div key={p.label}
              className="lift-card rounded-2xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="icon-tile w-10 h-10 flex-shrink-0 mt-0.5">
                  <p.icon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="font-black text-sm leading-snug mb-1" style={{ color: 'var(--brand-navy)' }}>{p.label}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{p.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </Stagger>

        {/* Quote */}
        <Reveal distance={16} className="text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-10" style={{ background: 'var(--border-color)' }} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: 'var(--text-muted)' }}>Develoi Soluções Digitais</span>
            <div className="h-px w-10" style={{ background: 'var(--border-color)' }} />
          </div>
          <p className="font-black tracking-tight leading-tight" style={{ fontSize: 'clamp(1.1rem,2.5vw,1.8rem)', color: 'var(--brand-navy)' }}>
            "Não entregamos apenas software.{' '}
            <span style={{ color: 'var(--brand-gold)' }}>Entregamos propósito com precisão."</span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
