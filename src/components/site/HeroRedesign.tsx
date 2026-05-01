// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Globe, Settings, Bot, Package } from 'lucide-react';

const serviceCards = [
  {
    icon: Globe,
    title: 'Sites e Landing Pages',
    desc: 'Presença digital profissional para atrair, apresentar e vender melhor.',
  },
  {
    icon: Settings,
    title: 'Sistemas Sob Medida',
    desc: 'Ferramentas exclusivas para organizar cadastros, processos e operações.',
  },
  {
    icon: Bot,
    title: 'Chatbots e Automações',
    desc: 'Atendimento, triagem, vendas e agendamentos funcionando de forma mais inteligente.',
  },
  {
    icon: Package,
    title: 'Sistemas Prontos',
    desc: 'Produtos Develoi por assinatura para negócios que querem começar agora.',
  },
];

export default function HeroRedesign() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center pt-28 sm:pt-32 pb-16 overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-[-15%] right-[-8%] w-[600px] h-[600px] rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, var(--brand-navy) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-[5%] left-[-5%] w-[400px] h-[400px] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, var(--brand-gold) 0%, transparent 70%)' }}
        />
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--brand-navy) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-16 items-center">

          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-start text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-8 border"
              style={{
                background: 'var(--brand-gold-pale)',
                borderColor: 'rgba(196,154,42,0.3)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: 'var(--brand-gold)' }}
              />
              <span
                className="text-[10px] font-black uppercase tracking-[0.2em]"
                style={{ color: 'var(--brand-navy)' }}
              >
                Soluções Digitais
              </span>
            </motion.div>

            <h1
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.0] tracking-tighter mb-7"
              style={{ color: 'var(--brand-navy)' }}
            >
              Transformamos ideias, processos e desafios em{' '}
              <span className="text-gradient-gold">soluções digitais</span>{' '}
              que fazem empresas crescerem.
            </h1>

            <p
              className="text-base sm:text-lg lg:text-xl mb-10 max-w-lg leading-relaxed font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              A Develoi cria <strong style={{ color: 'var(--brand-navy)', fontWeight: 700 }}>sites, sistemas sob medida, chatbots, dashboards e plataformas prontas</strong> para negócios que querem mais presença, organização e resultado.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <motion.a
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                href="#contato"
                className="btn-primary inline-flex items-center justify-center gap-3 px-8 py-4 text-sm font-black group"
              >
                QUERO UMA SOLUÇÃO PARA MEU NEGÓCIO
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.a>

              <motion.a
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                href="/cases"
                className="btn-outline-navy inline-flex items-center justify-center gap-3 px-8 py-4 text-sm font-black"
              >
                CONHECER PRODUTOS DEVELOI
              </motion.a>
            </div>

            {/* Trust line */}
            <p
              className="mt-8 text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'var(--brand-gold)' }}
            >
              Do pequeno negócio à grande empresa — tecnologia com propósito.
            </p>
          </motion.div>

          {/* Right — service cards */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-2 gap-4"
          >
            {serviceCards.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="brand-card card-gold-top p-5 flex flex-col gap-3"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--bg-tertiary)' }}
                >
                  <card.icon className="w-5 h-5" style={{ color: 'var(--brand-navy)' }} />
                </div>
                <div>
                  <h3
                    className="text-sm font-black leading-tight mb-1"
                    style={{ color: 'var(--brand-navy)' }}
                  >
                    {card.title}
                  </h3>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {card.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bottom tagline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="mt-16 pt-10 border-t"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <p
            className="text-base sm:text-lg font-black tracking-tight text-center"
            style={{ color: 'var(--brand-navy)' }}
          >
            Tecnologia com estratégia, beleza e resultado.{' '}
            <span style={{ color: 'var(--brand-gold)' }}>Do seu jeito. Para o tamanho do seu negócio.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
