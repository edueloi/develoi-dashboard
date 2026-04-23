// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';

const steps = [
  { num: '01', title: 'Entendemos seu negócio', desc: 'Mergulhamos na sua realidade para entender as reais necessidades.' },
  { num: '02', title: 'Identificamos os problemas', desc: 'Mapeamos os gargalos e as oportunidades de crescimento.' },
  { num: '03', title: 'Criamos a solução', desc: 'Desenvolvemos a tecnologia sob medida com foco em performance.' },
  { num: '04', title: 'Acompanhamos resultados', desc: 'Garantimos que a solução realmente traga o retorno esperado.' }
];

export default function HowItWorksSection() {
  return (
    <section className="relative py-24 bg-[#030303]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-aurora-blue font-black uppercase tracking-widest text-sm mb-4">Processo</h2>
          <h3 className="text-3xl md:text-5xl font-black text-white tracking-tighter">Como funciona</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="relative"
            >
              <div className="text-6xl md:text-8xl font-black text-white/[0.03] absolute -top-8 -left-4 select-none pointer-events-none">
                {step.num}
              </div>
              <div className="glass p-8 rounded-[2rem] relative z-10 h-full flex flex-col border-white/5 hover:border-aurora-blue/30 transition-colors duration-500">
                <h4 className="text-xl font-bold text-white mb-4">{step.title}</h4>
                <p className="text-neutral-400 leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
