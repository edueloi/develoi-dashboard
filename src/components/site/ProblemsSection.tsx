// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { XCircle } from 'lucide-react';

const problems = [
  "Falta de organização nos processos do dia a dia.",
  "Perda de controle financeiro e dificuldade em ver o lucro.",
  "Muitos processos manuais que tomam o tempo da equipe.",
  "Falta de automação em tarefas repetitivas.",
  "Dificuldade tecnológica para escalar e crescer."
];

export default function ProblemsSection() {
  return (
    <section className="relative py-24 dash-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-black dash-text mb-6 tracking-tighter"
          >
            Seu negócio enfrenta <span className="text-gradient-green">esses problemas?</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="dash-text-2 text-lg"
          >
            Nós resolvemos isso com tecnologia aplicada à realidade do seu negócio. Simplificamos o complexo para você focar no que importa.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 justify-center">
          {problems.map((problem, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="dash-surface p-6 md:p-8 rounded-3xl flex items-start gap-4 border dash-border hover:border-red-500/30 transition-all duration-500 group shadow-sm"
            >
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-red-500/20 transition-colors">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <p className="dash-text font-medium text-lg leading-relaxed">
                {problem}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
