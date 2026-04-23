// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';

const values = ['Dedicação', 'Evolução', 'Resultado', 'Humildade', 'Ajuda', 'Empresa familiar', 'Fé'];

export default function ValuesSection() {
  return (
    <section className="relative py-16 bg-[#030303] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center gap-4">
          {values.map((val, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="px-6 py-3 rounded-full glass-card border-white/10 text-neutral-300 font-semibold tracking-wide hover:text-white hover:border-aurora-blue/50 transition-all cursor-default"
            >
              {val}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
