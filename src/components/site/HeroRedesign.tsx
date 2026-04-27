// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, ShieldCheck } from 'lucide-react';

export default function HeroRedesign() {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 dash-bg noise-overlay opacity-10" />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="aurora-blur w-[800px] h-[800px] bg-aurora-blue/20 -top-[20%] -left-[10%]"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="aurora-blur w-[600px] h-[600px] bg-aurora-purple/20 top-[20%] right-[0%]"
        />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.03]"
             style={{
               backgroundImage: 'linear-gradient(rgba(99,102,241,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.2) 1px, transparent 1px)',
               backgroundSize: '40px 40px'
             }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full py-12 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-start"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full dash-surface border border-indigo-500/10 shadow-sm mb-8">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse-slow shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
              <span className="text-sm font-semibold tracking-wide dash-text-2">Tecnologia com propósito</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tighter mb-6 dash-text">
              Soluções digitais que ajudam seu negócio a <span className="text-gradient-animated">crescer de verdade.</span>
            </h1>

            <p className="text-lg md:text-xl dash-text-2 mb-10 max-w-2xl leading-relaxed">
              Organizamos, automatizamos e escalamos empresas com sistemas e soluções sob medida que realmente funcionam e resolvem problemas reais.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href="#contato"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-indigo-600 text-white font-black text-lg shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all duration-300 group"
              >
                Falar com a gente
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.a>

              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href="#solucoes"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl dash-surface border dash-border dash-text font-bold text-lg hover:dash-surface-2 transition-all duration-300 shadow-sm"
              >
                Ver soluções
              </motion.a>
            </div>
            
            <div className="mt-12 flex items-center gap-6 text-neutral-500 text-sm font-medium">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-aurora-green" />
                <span>Resultados reais</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-aurora-blue" />
                <span>Alta performance</span>
              </div>
            </div>
          </motion.div>

          {/* Abstract / Dashboard Mockup Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative lg:h-[600px] w-full flex items-center justify-center"
          >
            <div className="relative w-full aspect-square md:aspect-auto md:h-full max-h-[500px]">
              <div className="absolute inset-0 bg-gradient-to-tr from-aurora-blue/20 via-aurora-purple/10 to-transparent rounded-[3rem] blur-3xl animate-pulse-slow" />
              <div className="dash-surface border dash-border rounded-[2.5rem] p-4 absolute inset-4 shadow-2xl flex flex-col gap-4 overflow-hidden animate-float">
                <div className="w-full h-12 dash-surface-2 border dash-border rounded-xl flex items-center px-4 gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/50" />
                </div>
                <div className="flex-1 w-full flex gap-4">
                  <div className="w-1/3 h-full dash-surface-2 border dash-border rounded-xl p-4 flex flex-col gap-3">
                    <div className="w-full h-24 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20" />
                    <div className="w-3/4 h-4 rounded-full bg-indigo-500/10" />
                    <div className="w-1/2 h-4 rounded-full bg-indigo-500/5" />
                  </div>
                  <div className="w-2/3 h-full dash-surface-2 border dash-border rounded-xl p-4 flex flex-col gap-4">
                    <div className="w-full h-8 rounded-full bg-indigo-500/5" />
                    <div className="flex-1 w-full rounded-lg bg-gradient-to-tr from-aurora-pink/10 to-aurora-blue/10 flex items-end p-4">
                       <svg className="w-full h-full text-indigo-500/50" viewBox="0 0 100 50" preserveAspectRatio="none">
                         <path d="M0 50 Q 25 30 50 40 T 100 10 L 100 50 Z" fill="currentColor" opacity="0.3" />
                         <path d="M0 50 Q 25 30 50 40 T 100 10" fill="none" stroke="currentColor" strokeWidth="2" />
                       </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
