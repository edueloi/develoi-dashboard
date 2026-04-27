// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';

const metrics = [
  { value: '+50', label: 'Projetos entregues' },
  { value: '98%', label: 'Satisfação dos clientes' },
  { value: '+40%', label: 'Crescimento médio' },
  { value: '+10k', label: 'Horas de código' }
];

export default function MetricsSection() {
  return (
    <section className="relative py-12 md:py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="dash-surface border dash-border rounded-[2.5rem] p-10 md:p-16 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20" />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
            {metrics.map((metric, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="flex flex-col items-center justify-center text-center relative group"
              >
                <div className="text-5xl md:text-6xl font-black mb-3 tracking-tighter text-gradient-animated group-hover:scale-110 transition-transform duration-500">
                  {metric.value}
                </div>
                <div className="text-xs md:text-sm font-black uppercase tracking-[0.2em] dash-text-2 opacity-60">
                  {metric.label}
                </div>
                {/* Visual Connector for Desktop */}
                {idx < metrics.length - 1 && (
                  <div className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 w-px h-12 bg-gradient-to-b from-transparent via-dash-border to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
