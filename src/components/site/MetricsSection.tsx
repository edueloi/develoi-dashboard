// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';

const metrics = [
  { value: '+50', label: 'Projetos entregues' },
  { value: '98%', label: 'Satisfação dos clientes' },
  { value: '+40%', label: 'Crescimento médio' },
  { value: '+10k', label: 'Horas de código' },
];

export default function MetricsSection() {
  return (
    <section className="relative pt-20 pb-12 md:pt-24 md:pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="rounded-2xl p-8 md:p-12 relative overflow-hidden"
          style={{
            background: 'var(--brand-navy)',
            boxShadow: '0 20px 60px rgba(13,31,78,0.2)',
          }}
        >
          {/* Gold accent line */}
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{ background: 'linear-gradient(90deg, transparent, var(--brand-gold), transparent)' }}
          />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {metrics.map((metric, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="flex flex-col items-center justify-center text-center relative"
              >
                <div
                  className="text-4xl md:text-5xl font-black mb-2 tracking-tighter"
                  style={{ color: 'var(--brand-gold)' }}
                >
                  {metric.value}
                </div>
                <div className="text-xs font-semibold uppercase tracking-[0.15em] text-white/60">
                  {metric.label}
                </div>

                {idx < metrics.length - 1 && (
                  <div
                    className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-px h-10"
                    style={{ background: 'rgba(255,255,255,0.12)' }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
