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
    <section className="relative py-16 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/[0.02] to-transparent pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="dash-surface border dash-border rounded-[2rem] p-8 md:p-12 relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 shimmer opacity-10 dark:opacity-20 pointer-events-none" />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-x dash-border">
            {metrics.map((metric, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="flex flex-col items-center justify-center text-center px-4"
              >
                <div className="text-4xl md:text-5xl font-black mb-2 tracking-tighter text-gradient-animated">
                  {metric.value}
                </div>
                <div className="text-sm md:text-base font-medium dash-text-2">
                  {metric.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
