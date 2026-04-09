import { motion, useScroll, useTransform } from 'framer-motion';
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
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section
      ref={ref}
      id="home"
      className="relative min-h-[100svh] flex flex-col items-center justify-center pt-24 sm:pt-28 md:pt-32 pb-16 md:pb-20 overflow-hidden"
    >
      {/* Aurora Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], x: [0, 60, 0], y: [0, -30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="aurora-blur w-[400px] sm:w-[600px] md:w-[700px] h-[400px] sm:h-[600px] md:h-[700px] bg-aurora-blue/20 -top-1/4 -left-1/4"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], x: [0, -60, 0], y: [0, 30, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="aurora-blur w-[400px] sm:w-[600px] md:w-[700px] h-[400px] sm:h-[600px] md:h-[700px] bg-aurora-purple/20 -bottom-1/4 -right-1/4"
        />
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
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

      <motion.div
        style={{ y, opacity }}
        className="container mx-auto px-4 sm:px-6 relative z-10 text-center w-full max-w-6xl"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full bg-white/[0.04] border border-aurora-blue/30 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-aurora-blue mb-8 sm:mb-10 relative overflow-hidden max-w-full"
        >
          <div className="absolute inset-0 shimmer" />
          <span className="relative flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-aurora-green shadow-[0_0_8px_rgba(0,255,135,0.8)] animate-pulse flex-shrink-0" />
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
            <span className="truncate">A Elite do Desenvolvimento Digital</span>
          </span>
        </motion.div>

        {/* Headline — fluid type: clamp from 2.8rem (mobile) to 9rem (4k) */}
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="font-black leading-[0.88] tracking-[-0.04em] mb-6 sm:mb-8 md:mb-10"
          style={{ fontSize: 'clamp(2.8rem, 10vw, 9.5rem)' }}
        >
          DESIGN <br />
          <span className="text-gradient-animated">EXTRAORDINÁRIO</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="text-base sm:text-lg md:text-xl lg:text-2xl text-neutral-400 max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto mb-10 sm:mb-12 md:mb-14 leading-relaxed px-2"
        >
          Não vendemos software. Vendemos a{' '}
          <span className="text-white font-semibold">solução definitiva</span> para o seu negócio.
          Transformamos visões complexas em experiências digitais de elite.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 md:gap-6 px-4"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
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
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
            <Link
              to="/#projetos"
              className="group flex items-center justify-center gap-3 sm:gap-4 text-sm sm:text-base md:text-lg font-black uppercase tracking-widest text-white hover:text-aurora-blue transition-colors duration-300 w-full sm:w-auto"
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl glass flex items-center justify-center group-hover:border-aurora-blue/50 group-hover:shadow-[0_0_20px_rgba(0,210,255,0.2)] transition-all duration-300 flex-shrink-0">
                <MousePointer2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              </div>
              Ver Portfólio
            </Link>
          </motion.div>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 mt-12 sm:mt-16 md:mt-20 px-2"
        >
          {[
            { value: '50+', label: 'Projetos Entregues' },
            { value: '98%', label: 'Satisfação' },
            { value: '4', label: 'SaaS Ativos' },
            { value: '5+', label: 'Anos de Exp.' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.1 }}
              className="flex flex-col items-center gap-1 px-4 sm:px-5 md:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl glass-card flex-1 sm:flex-none"
            >
              <span className="text-xl sm:text-2xl md:text-3xl font-black text-gradient">{stat.value}</span>
              <span className="text-[10px] sm:text-xs text-neutral-500 font-semibold uppercase tracking-wider text-center whitespace-nowrap">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Floating cards — only on very large screens to avoid overlap */}
      <div className="hidden 2xl:block">
        {floatingCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 + i * 0.2, duration: 0.8 }}
            className={`absolute ${card.pos}`}
          >
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: card.delay }}
              className="glass rounded-2xl px-5 py-4 border-white/10"
            >
              <div className="flex items-center gap-3">
                <card.icon className={`w-5 h-5 ${card.color}`} />
                <div>
                  <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">{card.label}</p>
                  <p className="text-base font-black text-white">{card.value}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 sm:bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 sm:gap-3"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-5 h-9 sm:w-6 sm:h-10 rounded-full border-2 border-white/10 flex items-start justify-center pt-1.5 sm:pt-2"
        >
          <div className="w-1 h-2 sm:h-2.5 rounded-full bg-aurora-blue/60" />
        </motion.div>
        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-neutral-600">Scroll</span>
      </motion.div>

      <WaveEffect />
    </section>
  );
}
