import React from 'react';
import { Reveal, Stagger, SplitReveal, CountUp, Magnetic, Parallax } from '../motion';
import { ArrowRight, Globe, Settings, Bot, Package } from 'lucide-react';

// 4 serviços conforme plano de negócio
const services = [
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
    desc: 'Atendimento, triagem, vendas e agendamentos funcionando de forma inteligente.',
  },
  {
    icon: Package,
    title: 'Sistemas Prontos',
    desc: 'Produtos Develoi por assinatura para negócios que querem começar agora.',
  },
];

export default function HeroRedesign() {
  return (
    <>
      {/* ─── HERO PRINCIPAL ─── */}
      <section className="relative min-h-[100dvh] flex items-center overflow-hidden">
        {/* Fundo navy */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #06112B 0%, #0D1F4E 55%, #0A1840 100%)' }} />

        {/* Imagem de fundo direita */}
        <div className="absolute inset-0">
          <Parallax y={60} className="absolute -inset-y-8 inset-x-0" style={{ backgroundImage: 'url(/capa-header.png)', backgroundSize: 'cover', backgroundPosition: 'center right' }} />
          {/* Overlay legibilidade esquerda */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(6,17,43,0.97) 0%, rgba(6,17,43,0.92) 40%, rgba(6,17,43,0.6) 65%, rgba(6,17,43,0.1) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(6,17,43,0.45) 0%, transparent 18%, transparent 78%, rgba(6,17,43,0.7) 100%)' }} />
        </div>

        {/* Textura de pontos + brilho dourado */}
        <div aria-hidden className="absolute inset-0 bg-dots opacity-60" />
        <div aria-hidden className="absolute -left-40 top-1/3 w-[560px] h-[560px] rounded-full blur-[140px]" style={{ background: 'rgba(196,154,42,0.16)' }} />

        {/* Linha dourada topo */}
        <div className="absolute top-0 left-0 right-0 h-[3px] z-10" style={{ background: 'linear-gradient(90deg, var(--brand-gold), rgba(196,154,42,0.3) 60%, transparent)' }} />

        {/* Conteúdo */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-32 pb-56 sm:pb-52 md:pb-44">
          <div className="max-w-2xl">

            {/* Badge */}
            <Reveal immediate distance={12} duration={0.6} className="inline-flex items-center gap-2.5 mb-7 pl-2.5 pr-4 py-1.5 rounded-full glass-dark">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex w-full h-full rounded-full animate-ping-slow" style={{ background: 'var(--brand-gold)', opacity: 0.6 }} />
                <span className="relative inline-flex w-2 h-2 rounded-full" style={{ background: 'var(--brand-gold)' }} />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--brand-gold-pale)' }}>
                Develoi — Soluções Digitais
              </span>
            </Reveal>

            {/* Título principal — conforme briefing */}
            <SplitReveal as="h1" immediate delay={0.1}
              className="font-black leading-[1.04] tracking-tight mb-6 text-white"
              style={{ fontSize: 'clamp(2.3rem, 5.4vw, 4rem)' }}>
              Transformamos ideias, processos e desafios em{' '}
              <span style={{ color: 'var(--brand-gold)' }}>soluções digitais</span>{' '}
              que fazem empresas crescerem.
            </SplitReveal>

            {/* Subtítulo */}
            <Reveal as="p" immediate distance={16} duration={0.7} delay={0.45}
              className="text-sm sm:text-base leading-relaxed mb-10 max-w-lg"
              style={{ color: 'rgba(255,255,255,0.62)' }}>
              A Develoi cria <strong className="text-white font-semibold">sites, sistemas sob medida, chatbots, dashboards e plataformas prontas para uso</strong> para negócios que querem mais presença, organização e resultado.
              <br /><br />
              Do pequeno negócio à grande empresa, construímos tecnologia com clareza, propósito e visão de futuro.
            </Reveal>

            {/* Botões — conforme briefing */}
            <Reveal immediate distance={12} duration={0.6} delay={0.6}
              className="flex flex-col sm:flex-row gap-3">
              <Magnetic className="flex" strength={0.2}>
              <a href="/#contato"
                className="btn-shine flex-1 inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-sm transition-[transform,opacity,color,background-color,border-color,box-shadow] duration-200 hover:-translate-y-0.5 group"
                style={{ background: 'var(--brand-gold)', color: '#06112B', boxShadow: '0 6px 24px rgba(196,154,42,0.35)' }}>
                QUERO TRANSFORMAR MEU NEGÓCIO
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </a>
              </Magnetic>
              <Magnetic className="flex" strength={0.2}>
              <a href="/projetos"
                className="glass-dark flex-1 inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm transition-[transform,opacity,color,background-color,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-white/30"
                style={{ color: 'rgba(255,255,255,0.9)' }}>
                VER SOLUÇÕES DEVELOI
              </a>
              </Magnetic>
            </Reveal>

            {/* Métricas */}
            <Reveal immediate from="fade" delay={0.8} className="glass-dark inline-flex flex-wrap gap-x-9 gap-y-4 mt-12 px-6 py-4 rounded-2xl">
              {[
                { value: '+50', label: 'Projetos entregues' },
                { value: '98%', label: 'Clientes satisfeitos' },
                { value: '3', label: 'Produtos prontos no ar' },
              ].map((m, i) => (
                <div key={i} className="flex flex-col">
                  <span className="text-2xl font-black leading-none text-gold-grad"><CountUp value={m.value} /></span>
                  <span className="text-[11px] mt-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{m.label}</span>
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── 4 CARDS DE SERVIÇOS (flutuam sobre o hero) ─── */}
      <section className="relative z-20 -mt-28 sm:-mt-24 pb-0">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" stagger={0.08} start="top 95%">
            {services.map((card) => (
              <div key={card.title}
                className="lift-card rounded-2xl p-6 flex flex-col gap-3 border"
              >
                <div className="icon-tile w-11 h-11">
                  <card.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm leading-snug mb-1" style={{ color: 'var(--brand-navy)' }}>{card.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{card.desc}</p>
                </div>
              </div>
            ))}
          </Stagger>

          {/* ─── Frase de impacto final da dobra ─── */}
          <Reveal delay={0.2} className="mt-10 text-center pb-2">
            <p className="font-black tracking-tight" style={{ fontSize: 'clamp(0.95rem, 2vw, 1.3rem)', color: 'var(--brand-navy)' }}>
              Tecnologia com estratégia, beleza e resultado.{' '}
              <span style={{ color: 'var(--brand-gold)' }}>Do seu jeito. Para o tamanho do seu negócio.</span>
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
