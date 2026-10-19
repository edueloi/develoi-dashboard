import { Reveal, Magnetic } from './motion';
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap';
import { ArrowRight, Sparkles, MousePointer2, Zap, Code2, Globe } from 'lucide-react';
import WaveEffect from './WaveEffect';
import { Link } from 'react-router-dom';
import { useRef } from 'react';

const floatingCards = [
  { icon: Zap, label: 'Performance', value: '99/100', color: 'text-yellow-400', delay: 0, pos: 'left-4 xl:left-8 top-1/3' },
  { icon: Globe, label: 'Projetos', value: '50+', color: 'text-aurora-blue', delay: 0.5, pos: 'right-4 xl:right-8 top-1/4' },
  { icon: Code2, label: 'Uptime', value: '99.9%', color: 'text-aurora-green', delay: 1, pos: 'left-4 xl:left-12 bottom-1/3' },
];

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    // aurora flutuante (loops contínuos)
    gsap.to('[data-aurora="1"]', { scale: 1.2, x: 60, y: -30, duration: 10, ease: 'sine.inOut', repeat: -1, yoyo: true });
    gsap.fromTo('[data-aurora="2"]', { scale: 1.2 }, { scale: 1, x: -60, y: 30, duration: 12.5, ease: 'sine.inOut', repeat: -1, yoyo: true });
    gsap.fromTo('[data-aurora="3"]', { scale: 1, opacity: 0.05 }, { scale: 1.4, opacity: 0.15, duration: 7.5, ease: 'sine.inOut', repeat: -1, yoyo: true });
    gsap.to('[data-float]', {
      y: -12, duration: (i: number) => 2 + i * 0.5, ease: 'sine.inOut', repeat: -1, yoyo: true,
      delay: (i: number) => i * 0.5,
    });
    gsap.to('[data-bob]', { y: 8, duration: 0.75, ease: 'sine.inOut', repeat: -1, yoyo: true });
    // parallax + fade do conteúdo ao rolar
    gsap.timeline({
      scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom top', scrub: true },
    })
      .to(contentRef.current, { yPercent: 25, ease: 'none', duration: 1 }, 0)
      .to(contentRef.current, { opacity: 0, ease: 'none', duration: 0.5 }, 0);
  }, { scope: ref });

  return (
    <section
      ref={ref}
      id="home"
      className="relative min-h-[100svh] flex flex-col items-center justify-center pt-24 sm:pt-28 md:pt-32 pb-16 md:pb-20 overflow-hidden"
    >
      {/* Aurora Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div
          data-aurora="1"
          className="aurora-blur w-[400px] sm:w-[600px] md:w-[700px] h-[400px] sm:h-[600px] md:h-[700px] bg-aurora-blue/20 -top-1/4 -left-1/4"
        />
        <div
          data-aurora="2"
          className="aurora-blur w-[400px] sm:w-[600px] md:w-[700px] h-[400px] sm:h-[600px] md:h-[700px] bg-aurora-purple/20 -bottom-1/4 -right-1/4"
        />
        <div
          data-aurora="3"
          className="aurora-blur w-[600px] sm:w-[800px] md:w-[900px] h-[600px] sm:h-[800px] md:h-[900px] bg-aurora-pink/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,210,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,210,255,0.5) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(0,210,255,0.06),transparent)]" />
      </div>

      <div ref={contentRef} className="container mx-auto px-4 sm:px-6 relative z-10 text-center w-full max-w-6xl">
        {/* Badge */}
        <Reveal from="scale" duration={0.7} immediate className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full bg-white/[0.04] border border-aurora-blue/30 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-aurora-blue mb-8 sm:mb-10 relative overflow-hidden max-w-full">
          <div className="absolute inset-0 shimmer" />
          <span className="relative flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-aurora-green shadow-[0_0_8px_rgba(0,255,135,0.8)] animate-pulse flex-shrink-0" />
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
            <span className="truncate">A Elite do Desenvolvimento Digital</span>
          </span>
        </Reveal>

        {/* Headline — fluid type: clamp from 2.8rem (mobile) to 9rem (4k) */}
        <Reveal as="h1" distance={50} delay={0.15} duration={1} immediate className="font-black leading-[0.88] tracking-[-0.04em] mb-6 sm:mb-8 md:mb-10" style={{ fontSize: 'clamp(2.8rem, 10vw, 9.5rem)' }}>
          DESIGN <br />
          <span className="text-gradient-animated">EXTRAORDINÁRIO</span>
        </Reveal>

        {/* Subtitle */}
        <Reveal as="p" distance={30} delay={0.35} duration={0.8} immediate className="text-base sm:text-lg md:text-xl lg:text-2xl text-neutral-400 max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto mb-10 sm:mb-12 md:mb-14 leading-relaxed px-2">
          Não vendemos software. Vendemos a{' '}
          <span className="text-white font-semibold">solução definitiva</span> para o seu negócio.
          Transformamos visões complexas em experiências digitais de elite.
        </Reveal>

        {/* CTA Buttons */}
        <Reveal distance={20} delay={0.5} duration={0.8} immediate className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 md:gap-6 px-4">
          <Magnetic className="w-full sm:w-auto transition-transform duration-200 hover:scale-105 active:scale-95">
            <Link
              to="/#contato"
              className="group relative w-full sm:w-auto px-8 sm:px-10 md:px-14 py-4 sm:py-5 md:py-6 bg-white text-black font-black rounded-2xl overflow-hidden transition-all text-center block text-sm sm:text-base md:text-lg"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-aurora-blue via-aurora-purple to-aurora-pink opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3 group-hover:text-white transition-colors duration-300">
                INICIAR PROJETO
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-2 transition-transform duration-300" />
              </span>
            </Link>
          </Magnetic>

          <Magnetic className="w-full sm:w-auto transition-transform duration-200 hover:scale-105 active:scale-95">
            <Link
              to="/#projetos"
              className="group flex items-center justify-center gap-3 sm:gap-4 text-sm sm:text-base md:text-lg font-black uppercase tracking-widest text-white hover:text-aurora-blue transition-colors duration-300 w-full sm:w-auto"
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl glass flex items-center justify-center group-hover:border-aurora-blue/50 group-hover:shadow-[0_0_20px_rgba(0,210,255,0.2)] transition-all duration-300 flex-shrink-0">
                <MousePointer2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              </div>
              Ver Portfólio
            </Link>
          </Magnetic>
        </Reveal>

        {/* Stats Row */}
        <Reveal distance={30} delay={0.7} duration={0.8} immediate className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 mt-12 sm:mt-16 md:mt-20 px-2">
          {[
            { value: '50+', label: 'Projetos Entregues' },
            { value: '98%', label: 'Satisfação' },
            { value: '4', label: 'SaaS Ativos' },
            { value: '5+', label: 'Anos de Exp.' },
          ].map((stat, i) => (
            <Reveal distance={20} delay={0.7 + i * 0.1} immediate key={stat.label} className="flex flex-col items-center gap-1 px-4 sm:px-5 md:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl glass-card flex-1 sm:flex-none">
              <span className="text-xl sm:text-2xl md:text-3xl font-black text-gradient">{stat.value}</span>
              <span className="text-[10px] sm:text-xs text-neutral-500 font-semibold uppercase tracking-wider text-center whitespace-nowrap">{stat.label}</span>
            </Reveal>
          ))}
        </Reveal>
      </div>

      {/* Floating cards — only on very large screens to avoid overlap */}
      <div className="hidden 2xl:block">
        {floatingCards.map((card, i) => (
          <Reveal
            key={card.label}
            from={i % 2 === 0 ? 'left' : 'right'}
            distance={40}
            delay={1 + i * 0.2}
            duration={0.8}
            immediate
            className={`absolute ${card.pos}`}
          >
            <div
              data-float
              className="glass rounded-2xl px-5 py-4 border-white/10"
            >
              <div className="flex items-center gap-3">
                <card.icon className={`w-5 h-5 ${card.color}`} />
                <div>
                  <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">{card.label}</p>
                  <p className="text-base font-black text-white">{card.value}</p>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Scroll indicator */}
      <Reveal from="fade" delay={1.5} immediate className="absolute bottom-8 sm:bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 sm:gap-3">
        <div
          data-bob
          className="w-5 h-9 sm:w-6 sm:h-10 rounded-full border-2 border-white/10 flex items-start justify-center pt-1.5 sm:pt-2"
        >
          <div className="w-1 h-2 sm:h-2.5 rounded-full bg-aurora-blue/60" />
        </div>
        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-neutral-600">Scroll</span>
      </Reveal>

      <WaveEffect />
    </section>
  );
}
