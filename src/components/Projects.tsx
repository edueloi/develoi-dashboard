import { Reveal, Magnetic } from './motion';
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap';
import { ExternalLink, CheckCircle2, Zap, Shield, TrendingUp, Users } from 'lucide-react';
import { useRef } from 'react';

const solutions = [
  {
    title: 'Plaelo',
    subtitle: 'Sistema completo para saúde mental',
    description:
      'Agenda, prontuário, teleconsulta, financeiro e IA — tudo em uma plataforma criada para psicólogos e clínicas de saúde mental.',
    logo: 'https://plaelo.com.br/images/logo-sistema/logo-plaelo.png',
    url: 'https://plaelo.com.br/',
    features: ['Agenda Inteligente', 'Teleconsulta & IA', 'LGPD Compliant', 'Prontuário Digital'],
    stats: [
      { value: '2.000+', label: 'Profissionais' },
      { value: '98%', label: 'Satisfação' },
      { value: '150+', label: 'Clínicas' },
    ],
    color: 'from-blue-500 to-cyan-400',
    glow: 'rgba(59,130,246,0.15)',
    accent: '#3b82f6',
    tag: 'Saúde Mental',
  },
  {
    title: 'MecaERP',
    subtitle: 'O ecossistema definitivo de gestão automotiva',
    description:
      'Mais de 500 donos de oficinas já pararam de perder dinheiro com peças não cobradas e orçamentos esquecidos.',
    logo: 'https://mecaerp.com.br/assets/logo-mecaerp-CbIDGmjk.png',
    url: 'https://mecaerp.com.br/',
    features: ['OS Inteligente', 'Financeiro & Lucro Real', 'Automação WhatsApp', 'Checklist Digital HD'],
    stats: [
      { value: '500+', label: 'Oficinas' },
      { value: '+35%', label: 'Lucro Médio' },
      { value: 'SEFAZ', label: 'Integrado' },
    ],
    color: 'from-orange-500 to-red-500',
    glow: 'rgba(249,115,22,0.15)',
    accent: '#f97316',
    tag: 'ERP Automotivo',
  },
  {
    title: 'Agendelle',
    subtitle: 'A agenda elegante para o seu negócio de beleza',
    description:
      'Une organização inteligente com elegância — o sistema perfeito para salões e barbearias que querem crescer.',
    logo: 'https://agendelle.com.br/assets/imagem-agendele-a9t6taIM.png',
    url: 'https://agendelle.com.br/',
    features: ['Agendamento Online 24/7', 'Lembretes Automáticos', 'Gestão de Equipe', 'IA de Atendimento'],
    stats: [
      { value: '2.800+', label: 'Negócios' },
      { value: '1,2M+', label: 'Agendamentos' },
      { value: '+40%', label: 'Receita' },
    ],
    color: 'from-purple-500 to-pink-500',
    glow: 'rgba(168,85,247,0.15)',
    accent: '#a855f7',
    tag: 'Beleza & Estética',
  },
  {
    title: 'Receitas Milionárias',
    subtitle: 'Plataforma de Infoprodutos e Culinária',
    description:
      'O ecossistema digital completo para o Jefferson Pereira, transformando o mercado de receitas em um negócio de alta escala.',
    logo: 'https://receitasmilionarias.com.br/static/images/logo.png',
    url: 'https://receitasmilionarias.com.br/',
    features: ['Área de Membros', 'Checkout Integrado', 'Gestão de Conteúdo', 'Escalabilidade'],
    stats: [
      { value: '✦', label: 'Case de Sucesso' },
      { value: 'Alta', label: 'Conversão' },
      { value: '100%', label: 'Exclusivo' },
    ],
    color: 'from-green-500 to-emerald-400',
    glow: 'rgba(34,197,94,0.15)',
    accent: '#22c55e',
    tag: 'Infoprodutos',
  },
];

function ProjectCard({ solution, index }: { solution: typeof solutions[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isEven = index % 2 === 0;

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    gsap.fromTo('[data-scan]', { yPercent: -100 }, { yPercent: 200, duration: 3, ease: 'none', repeat: -1, repeatDelay: 2 });
    gsap.fromTo('[data-pulse]', { opacity: 0.1 }, { opacity: 0.2, duration: 1.5, ease: 'sine.inOut', repeat: -1, yoyo: true });
    gsap.utils.toArray<HTMLElement>('[data-float]').forEach((el, i) => {
      const amp = Number(el.dataset.float) || 12;
      gsap.to(el, { y: amp, duration: 2 + i * 0.3, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: i * 0.5 });
    });
  }, { scope: ref });

  return (
    <div ref={ref} className="contents">
    <Reveal distance={50} duration={0.9} className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 sm:gap-10 md:gap-14 lg:gap-16 items-center`}>
      {/* Content */}
      <div className="flex-1 space-y-5 sm:space-y-6 md:space-y-7 w-full">
        {/* Tag + Logo */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <span
            className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.25em] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border"
            style={{ color: solution.accent, borderColor: `${solution.accent}40`, background: `${solution.accent}10` }}
          >
            {solution.tag}
          </span>
          <div className="logo-container h-9 sm:h-10 px-2 sm:px-3">
            <img
              src={solution.logo}
              alt={solution.title}
              className="max-h-full max-w-[100px] sm:max-w-[120px] object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className={`h-[2px] flex-1 max-w-[50px] sm:max-w-[60px] bg-gradient-to-r ${solution.color} rounded-full`} />
        </div>

        <h3
          className="font-black tracking-tighter leading-[1.05]"
          style={{ fontSize: 'clamp(1.5rem, 4vw, 3rem)' }}
        >
          {solution.subtitle}
        </h3>

        <p className="text-neutral-400 text-sm sm:text-base md:text-lg leading-relaxed">{solution.description}</p>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {solution.features.map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-neutral-300">
              <CheckCircle2 className="w-4 h-4 text-aurora-green flex-shrink-0" />
              <span className="font-medium text-sm sm:text-base">{feature}</span>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
          {solution.stats.map((stat) => (
            <div
              key={stat.label}
              className="px-3 sm:px-4 md:px-5 py-2 sm:py-3 glass-card rounded-xl sm:rounded-2xl border border-white/[0.06] text-center"
            >
              <p className="text-base sm:text-lg md:text-xl font-black text-white">{stat.value}</p>
              <p className="text-[9px] sm:text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Magnetic className="w-fit">
        <a
          href={solution.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`hover:scale-[1.04] active:scale-[0.97] inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r ${solution.color} text-white font-black rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-shadow text-sm sm:text-base`}
        >
          Explorar {solution.title} <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
        </a>
        </Magnetic>
      </div>

      {/* Visual Mockup */}
      <div className="flex-1 w-full">
        <div className="relative aspect-video group hover:scale-[1.02] transition-transform duration-[400ms]">
          <div
            className="absolute inset-0 blur-[40px] sm:blur-[60px] rounded-[2rem] sm:rounded-[3rem] opacity-25 group-hover:opacity-40 transition-opacity duration-700"
            style={{ background: `radial-gradient(ellipse, ${solution.glow}, transparent)` }}
          />

          <div className="relative h-full w-full glass rounded-[2rem] sm:rounded-[3rem] overflow-hidden border border-white/[0.06] group-hover:border-white/[0.12] transition-colors duration-500 flex items-center justify-center">
            <div className={`absolute inset-0 bg-gradient-to-br ${solution.color} opacity-5 group-hover:opacity-10 transition-opacity duration-500`} />

            {/* Scan line */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div
                data-scan
                className="absolute inset-x-0 h-[2px] opacity-20"
                style={{ background: `linear-gradient(90deg, transparent, ${solution.accent}, transparent)` }}
              />
            </div>

            {/* Center content */}
            <div className="relative text-center p-6 sm:p-10 z-10">
              <div data-pulse>
                <img
                  src={solution.logo}
                  alt={solution.title}
                  className="w-32 sm:w-48 md:w-64 mx-auto mb-4 sm:mb-6 brightness-0 invert opacity-15"
                  referrerPolicy="no-referrer"
                />
              </div>
              <p className="text-neutral-600 font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em]">
                Interface de Alta Performance
              </p>
            </div>

            {/* Floating badges — hidden on very small screens to avoid clutter */}
            <div
              data-float="-12"
              className="absolute top-4 sm:top-6 right-4 sm:right-6 glass rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border-white/15 flex items-center gap-1.5 sm:gap-2"
            >
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
              <span className="text-[10px] sm:text-xs font-black text-white">99/100</span>
            </div>

            <div
              data-float="12"
              className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 glass rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border-white/15 flex items-center gap-1.5 sm:gap-2"
            >
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-aurora-blue" />
              <span className="text-[10px] sm:text-xs font-black text-white">Seguro</span>
            </div>

            <div
              data-float="-8"
              className="absolute top-4 sm:top-6 left-4 sm:left-6 glass rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border-white/15 hidden sm:flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-aurora-green" />
              <span className="text-[10px] sm:text-xs font-black text-white">+40%</span>
            </div>

            <div
              data-float="10"
              className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 glass rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border-white/15 hidden sm:flex items-center gap-2"
            >
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-aurora-purple" />
              <span className="text-[10px] sm:text-xs font-black text-white">500+</span>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
    </div>
  );
}

export default function Projects() {
  return (
    <section id="projetos" className="py-16 sm:py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </div>

      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-14 sm:mb-20 md:mb-28">
          <Reveal distance={20} className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-aurora-purple/10 border border-aurora-purple/20 text-[10px] sm:text-xs font-black uppercase tracking-widest text-aurora-purple mb-4 sm:mb-6">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Nosso Portfólio</span>
          </Reveal>

          <Reveal as="h2" distance={25} delay={0.1} duration={0.8} className="font-black mb-4 sm:mb-6 tracking-tighter" style={{ fontSize: 'clamp(2rem, 6vw, 4.5rem)' }}>
            Nossas <span className="text-gradient">Soluções</span> de Elite
          </Reveal>
          <Reveal as="p" distance={20} delay={0.2} className="text-neutral-400 max-w-xl sm:max-w-2xl mx-auto text-sm sm:text-base md:text-xl px-4">
            Desenvolvemos ecossistemas completos que transformam indústrias inteiras. Tecnologia de
            ponta para resultados reais.
          </Reveal>
        </div>

        {/* Projects list */}
        <div className="space-y-16 sm:space-y-24 md:space-y-36">
          {solutions.map((solution, index) => (
            <ProjectCard key={solution.title} solution={solution} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
