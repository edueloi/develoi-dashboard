import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function CTASection() {
  return (
    <section id="contato" className="relative py-20 md:py-24" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="rounded-2xl overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg,#06112B 0%,#0D1F4E 100%)', boxShadow: '0 20px 60px rgba(13,31,78,0.2)' }}>
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg,var(--brand-gold),rgba(196,154,42,0.2) 70%,transparent)' }} />
          <div className="relative z-10 px-8 sm:px-16 py-14 sm:py-16 flex flex-col sm:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="font-black text-white tracking-tight mb-2" style={{ fontSize: 'clamp(1.5rem,3vw,2.2rem)' }}>
                Vamos construir algo{' '}
                <span style={{ color: 'var(--brand-gold)' }}>juntos?</span>
              </h2>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Se você quer organizar seu negócio, crescer com mais controle e ter uma solução que realmente funcione, fale com a gente.
              </p>
            </div>
            <a href="https://wa.me/5515997026791" target="_blank" rel="noopener noreferrer"
              className="flex-shrink-0 inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 hover:opacity-90 hover:-translate-y-px group"
              style={{ background: 'var(--brand-gold)', color: '#06112B', boxShadow: '0 6px 20px rgba(196,154,42,0.35)' }}>
              FALAR COM A DEVELOI
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
