// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const differentials = [
  "Não vendemos sistema, resolvemos problemas.",
  "Atendimento próximo e humano.",
  "Pensamos junto com você e seu negócio.",
  "Foco em resultado real e mensurável.",
  "Soluções personalizadas para sua necessidade."
];

export default function DifferentialsSection() {
  return (
    <section className="relative py-24 bg-[#050505] overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-aurora-purple/5 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tighter">
              Por que escolher a <span className="text-gradient">Develoi?</span>
            </h2>
            <p className="text-neutral-400 text-lg mb-8 leading-relaxed">
              Diferente das fábricas de software tradicionais, nós atuamos como seu braço tecnológico estratégico. O seu problema é o nosso problema até ser resolvido.
            </p>

            <ul className="space-y-4">
              {differentials.map((item, idx) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center gap-4 p-4 rounded-2xl glass-card hover:bg-white/[0.05]"
                >
                  <div className="w-8 h-8 rounded-full bg-aurora-blue/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-aurora-blue" />
                  </div>
                  <span className="text-white font-medium">{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative lg:h-[500px] w-full rounded-[3rem] glass-strong border-white/10 overflow-hidden flex items-center justify-center p-8"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-aurora-blue/10 to-aurora-purple/10" />
            <div className="text-center relative z-10">
              <div className="text-6xl mb-4 text-gradient font-black tracking-tighter">100%</div>
              <div className="text-xl text-white font-bold">Comprometimento com seu Sucesso</div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
