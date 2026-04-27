// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';

export default function EmotionalSection() {
  return (
    <section className="relative py-24 sm:py-32 dash-bg transition-colors duration-300 overflow-hidden">
      {/* Aurora Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none opacity-[0.03]">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500 rounded-full blur-[120px] animate-pulse-slow" />
      </div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="space-y-10 md:space-y-16"
        >
          <div>
            <span className="text-xs font-black uppercase tracking-[0.4em] text-indigo-600 mb-4 block">Nossa Essência</span>
            <h2 className="text-4xl md:text-6xl font-black dash-text tracking-tighter mb-8 leading-[1.1]">
              O propósito por trás de <span className="text-gradient">cada pixel.</span>
            </h2>
            <p className="text-xl md:text-3xl dash-text-2 leading-relaxed max-w-3xl mx-auto font-medium opacity-80">
              Acreditamos que a tecnologia deve ser invisível, mas seus resultados devem ser extraordinários. Não entregamos apenas software, entregamos liberdade para você focar no que ama.
            </p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <blockquote className="text-2xl md:text-4xl font-black dash-text italic p-12 sm:p-20 dash-surface border dash-border rounded-[3rem] sm:rounded-[4rem] relative shadow-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] to-transparent pointer-events-none" />
              <div className="text-indigo-600/10 text-9xl absolute -top-10 -left-6 select-none group-hover:scale-110 transition-transform duration-700">“</div>
              <span className="relative z-10 block">
                Construímos soluções que <span className="text-indigo-600">transformam</span> negócios e impactam histórias reais.
              </span>
              <div className="text-indigo-600/10 text-9xl absolute -bottom-24 -right-6 select-none rotate-180 group-hover:scale-110 transition-transform duration-700">“</div>
            </blockquote>
            
            <div className="mt-8 flex items-center justify-center gap-4">
              <div className="w-12 h-[1px] bg-indigo-500/30" />
              <span className="text-sm font-black uppercase tracking-widest dash-text opacity-40">Time Develoi</span>
              <div className="w-12 h-[1px] bg-indigo-500/30" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
