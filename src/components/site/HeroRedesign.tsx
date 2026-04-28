// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, ShieldCheck } from 'lucide-react';

export default function HeroRedesign() {
  return (
    <section className="relative min-h-screen flex items-center pt-24 sm:pt-32 pb-16 sm:pb-20 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 dash-bg noise-overlay opacity-[0.15]" />
        
        {/* Dynamic Aurora Blurs */}
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.15, 0.25, 0.15] 
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-[10%] -left-[10%] w-[100vw] h-[100vw] bg-indigo-500/10 blur-[120px] rounded-full"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
            opacity: [0.1, 0.2, 0.1] 
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-[20%] -right-[10%] w-[80vw] h-[80vw] bg-purple-500/10 blur-[150px] rounded-full"
        />
        
        {/* Modern Grid */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
             style={{
               backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)',
               backgroundSize: '32px 32px'
             }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-12 items-center">
          
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-start text-left"
          >
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full dash-surface-2 border dash-border shadow-2xl mb-8"
            >
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] dash-text opacity-70">Sistemas de Alta Performance</span>
            </motion.div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black leading-[0.95] tracking-tighter mb-8 dash-text">
              Transformamos ideias em <span className="text-gradient-animated">Software de Elite.</span>
            </h1>

            <p className="text-lg sm:text-xl lg:text-2xl dash-text-2 mb-12 max-w-xl leading-relaxed font-medium opacity-80">
              Engenharia de software sob medida para empresas que não aceitam o básico. Criamos soluções que escalam, automatizam e dominam o mercado.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto">
              <motion.a
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                href="#contato"
                className="inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-indigo-600 text-white font-black text-lg shadow-2xl shadow-indigo-500/40 hover:bg-indigo-700 transition-all group"
              >
                INICIAR PROJETO
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.a>

              <motion.a
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                href="/cases"
                className="inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl dash-surface border dash-border dash-text font-black text-lg hover:dash-surface-2 transition-all shadow-xl"
              >
                VER CASES
              </motion.a>
            </div>
            
            <div className="mt-16 flex flex-wrap items-center gap-8 text-neutral-500">
              <div className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-widest dash-text">Segurança</span>
                  <span className="text-[10px] font-medium opacity-60">Padrão Bancário</span>
                </div>
              </div>
              <div className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-widest dash-text">Velocidade</span>
                  <span className="text-[10px] font-medium opacity-60">SLA 99.9%</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Premium Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative perspective-1000 hidden sm:block"
          >
            <div className="relative group">
              {/* Glow Backlight */}
              <div className="absolute -inset-10 bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-transparent rounded-[4rem] blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-700" />
              
              <div className="relative dash-surface border-[1.5rem] border-[#1a1a24] rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden aspect-[4/3] w-full max-w-[600px] animate-float">
                {/* Internal Browser UI */}
                <div className="h-12 bg-[#1a1a24] border-b border-white/5 flex items-center px-6 gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/50" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                  <div className="ml-4 h-6 w-48 bg-white/5 rounded-full" />
                </div>
                
                {/* Content Mockup */}
                <div className="p-8 h-full bg-gradient-to-br from-indigo-500/5 to-transparent flex flex-col gap-6">
                   <div className="grid grid-cols-3 gap-4">
                     <div className="h-32 rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col justify-between">
                       <div className="w-8 h-8 rounded-lg bg-indigo-500/20" />
                       <div className="w-12 h-4 bg-white/10 rounded-full" />
                     </div>
                     <div className="h-32 rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col justify-between">
                       <div className="w-8 h-8 rounded-lg bg-purple-500/20" />
                       <div className="w-12 h-4 bg-white/10 rounded-full" />
                     </div>
                     <div className="h-32 rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col justify-between">
                       <div className="w-8 h-8 rounded-lg bg-emerald-500/20" />
                       <div className="w-12 h-4 bg-white/10 rounded-full" />
                     </div>
                   </div>
                   <div className="flex-1 rounded-2xl bg-white/5 border border-white/10 overflow-hidden relative p-6">
                      <div className="w-1/2 h-8 bg-white/10 rounded-full mb-4" />
                      <div className="w-3/4 h-4 bg-white/5 rounded-full mb-8" />
                      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-indigo-500/10 to-transparent flex items-end p-6">
                         <svg className="w-full h-full text-indigo-500" viewBox="0 0 100 40" preserveAspectRatio="none">
                            <motion.path 
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 2, repeat: Infinity }}
                              d="M0 40 Q 25 10 50 25 T 100 5" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="3" 
                            />
                         </svg>
                      </div>
                   </div>
                </div>
              </div>
              
              {/* Floating Element */}
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -right-8 top-1/4 dash-surface border dash-border rounded-2xl p-5 shadow-2xl backdrop-blur-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-indigo-500/30">
                    99%
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-50">Efficiency</div>
                    <div className="text-sm font-black dash-text">High Growth</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
