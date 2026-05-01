import React from 'react';
import { motion } from 'framer-motion';

export default function EmotionalSection() {
  return (
    <section className="relative py-20 md:py-24 overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
      <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="w-5 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
            <span className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--brand-gold)' }}>Nossa Essência</span>
            <span className="w-5 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
          </div>
          <h2 className="font-black tracking-tight mb-5" style={{ fontSize: 'clamp(1.6rem,3.5vw,2.6rem)', color: 'var(--brand-navy)' }}>
            O propósito por trás de{' '}
            <span style={{ color: 'var(--brand-gold)' }}>cada pixel.</span>
          </h2>
          <p className="text-base leading-relaxed mb-12 max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Acreditamos que a tecnologia deve ser invisível, mas seus resultados devem ser extraordinários. Não entregamos apenas software — entregamos liberdade para você focar no que ama.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }}
          className="relative rounded-2xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#06112B 0%,#0D1F4E 100%)', boxShadow: '0 16px 48px rgba(13,31,78,0.2)' }}>
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg,var(--brand-gold),rgba(196,154,42,0.2) 70%,transparent)' }} />
          <div className="relative z-10 px-8 sm:px-16 py-12 sm:py-16">
            <p className="font-black text-white tracking-tight leading-tight mb-4" style={{ fontSize: 'clamp(1.3rem,2.5vw,2rem)' }}>
              "Construímos soluções que{' '}
              <span style={{ color: 'var(--brand-gold)' }}>transformam</span>{' '}
              negócios e impactam histórias reais."
            </p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <div className="h-px w-8" style={{ background: 'rgba(255,255,255,0.15)' }} />
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>Time Develoi</span>
              <div className="h-px w-8" style={{ background: 'rgba(255,255,255,0.15)' }} />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
