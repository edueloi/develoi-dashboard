import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, MousePointer2 } from 'lucide-react';
import WaveEffect from './WaveEffect';
import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section id="home" className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-20 overflow-hidden">
      {/* Aurora Background Effects */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="aurora-blur w-[800px] h-[800px] bg-aurora-blue/20 -top-1/4 -left-1/4"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -100, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="aurora-blur w-[800px] h-[800px] bg-aurora-purple/20 -bottom-1/4 -right-1/4"
        />
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="aurora-blur w-[1000px] h-[1000px] bg-aurora-pink/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        />
      </div>

      <div className="container mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-black uppercase tracking-[0.3em] text-aurora-blue mb-12"
        >
          <Sparkles className="w-4 h-4" />
          <span>A Elite do Desenvolvimento Digital</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-7xl md:text-[10rem] font-black leading-[0.85] tracking-[-0.05em] mb-12"
        >
          DESIGN <br />
          <span className="text-gradient">EXTRAORDINÁRIO</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl md:text-3xl text-neutral-400 max-w-4xl mx-auto mb-16 font-medium leading-tight"
        >
          Não vendemos software. Vendemos a <span className="text-white">solução definitiva</span> para o seu negócio. Transformamos visões complexas em experiências digitais de elite.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 md:gap-8"
        >
          <Link
            to="/#contato"
            className="group relative w-full sm:w-auto px-10 md:px-12 py-5 md:py-6 bg-white text-black font-black rounded-2xl overflow-hidden transition-all hover:scale-105 active:scale-95 text-center"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-aurora-blue via-aurora-purple to-aurora-pink opacity-0 group-hover:opacity-10 transition-opacity" />
            <span className="relative flex items-center justify-center gap-3 text-base md:text-lg">
              INICIAR PROJETO <ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-2 transition-transform" />
            </span>
          </Link>
          
          <Link
            to="/#projetos"
            className="group flex items-center justify-center gap-4 text-base md:text-lg font-black uppercase tracking-widest text-white hover:text-aurora-blue transition-colors w-full sm:w-auto"
          >
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl glass flex items-center justify-center group-hover:border-aurora-blue/50 transition-all">
              <MousePointer2 className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            Ver Portfólio
          </Link>
        </motion.div>
      </div>

      {/* Floating Decorative Elements */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-30">
        <div className="w-[1px] h-24 bg-gradient-to-b from-white to-transparent" />
        <span className="text-[10px] font-black uppercase tracking-[0.5em] vertical-text">Scroll</span>
      </div>

      <WaveEffect />
    </section>
  );
}

