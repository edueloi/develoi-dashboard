// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Monitor, Smartphone, TrendingUp } from 'lucide-react';

const featureCards = [
  {
    icon: Monitor,
    title: 'Design Moderno',
    desc: 'Layouts elegantes e focados na experiência do usuário.',
  },
  {
    icon: Smartphone,
    title: 'Totalmente Responsivo',
    desc: 'Seu site perfeito em qualquer dispositivo.',
  },
  {
    icon: TrendingUp,
    title: 'Focado em Resultados',
    desc: 'Sites estratégicos para gerar credibilidade e novos clientes.',
  },
];

export default function HeroRedesign() {
  return (
    <>
      {/* ─── HERO PRINCIPAL ─── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">

        {/* Fundo navy escuro full */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, #06112B 0%, #0D1F4E 55%, #0A1840 100%)' }}
        />

        {/* Capa header personalizada Develoi */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'url(/capa-header.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center right',
            }}
          />
          {/* Overlay gradiente para legibilidade do texto à esquerda */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, rgba(6,17,43,0.96) 0%, rgba(6,17,43,0.88) 35%, rgba(6,17,43,0.55) 60%, rgba(6,17,43,0.15) 100%)',
            }}
          />
          {/* Overlay escuro topo e base */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(180deg, rgba(6,17,43,0.4) 0%, transparent 20%, transparent 80%, rgba(6,17,43,0.6) 100%)',
            }}
          />
        </div>

        {/* Linha dourada decorativa no topo */}
        <div
          className="absolute top-0 left-0 right-0 h-[3px] z-10"
          style={{ background: 'linear-gradient(90deg, var(--brand-gold), rgba(196,154,42,0.3) 60%, transparent)' }}
        />

        {/* Conteúdo */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-32 pb-52 sm:pb-48 md:pb-40">
          <div className="max-w-xl lg:max-w-2xl">

            {/* Badge topo */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 mb-8"
            >
              <span
                className="w-6 h-[2px] rounded-full"
                style={{ background: 'var(--brand-gold)' }}
              />
              <span
                className="text-[11px] font-bold uppercase tracking-[0.22em]"
                style={{ color: 'var(--brand-gold)' }}
              >
                Develoi — Soluções Digitais
              </span>
            </motion.div>

            {/* Título principal */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="font-black leading-[1.05] tracking-tight mb-6 text-white"
              style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4rem)' }}
            >
              SOLUÇÕES PARA{' '}
              <br className="hidden sm:block" />
              IMPULSIONAR{' '}
              <br />
              <span style={{ color: 'var(--brand-gold)' }}>O SEU NEGÓCIO</span>
            </motion.h1>

            {/* Subtítulo */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="text-base sm:text-lg leading-relaxed mb-10 max-w-md"
              style={{ color: 'rgba(255,255,255,0.65)' }}
            >
              Desenvolvemos soluções digitais sob medida para alavancar seu negócio e gerar resultados reais e sustentáveis.
            </motion.p>

            {/* Botões */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.38 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <a
                href="#contato"
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 hover:-translate-y-0.5 group"
                style={{
                  background: 'var(--brand-gold)',
                  color: '#06112B',
                  boxShadow: '0 6px 24px rgba(196,154,42,0.35)',
                }}
              >
                SAIBA MAIS
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </a>

              <a
                href="/cases"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 hover:-translate-y-0.5 border"
                style={{
                  color: 'rgba(255,255,255,0.85)',
                  borderColor: 'rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.05)',
                }}
              >
                VER PROJETOS
              </a>
            </motion.div>

            {/* Métricas inline */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="flex flex-wrap gap-8 mt-12"
            >
              {[
                { value: '+150', label: 'Projetos Entregues' },
                { value: '98%', label: 'Clientes Satisfeitos' },
                { value: 'Resultados', label: 'que Geram Crescimento' },
              ].map((m, i) => (
                <div key={i} className="flex flex-col">
                  <span
                    className="text-xl font-black leading-none"
                    style={{ color: 'var(--brand-gold)' }}
                  >
                    {m.value}
                  </span>
                  <span className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {m.label}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── CARDS DE SERVIÇOS (flutuam sobre o hero) ─── */}
      <section className="relative z-20 -mt-24 sm:-mt-20 pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {featureCards.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="bg-white rounded-2xl p-6 flex flex-col items-center text-center gap-3 border"
                style={{
                  borderColor: 'var(--border-color)',
                  boxShadow: '0 8px 32px rgba(13,31,78,0.1)',
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-1"
                  style={{ background: 'var(--bg-tertiary)' }}
                >
                  <card.icon className="w-6 h-6" style={{ color: 'var(--brand-navy)' }} />
                </div>
                <h3
                  className="font-black text-sm leading-snug"
                  style={{ color: 'var(--brand-navy)' }}
                >
                  {card.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {card.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
