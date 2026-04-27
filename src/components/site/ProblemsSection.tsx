// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowDown } from 'lucide-react';

const problems = [
  "Processos manuais que travam o crescimento",
  "Dificuldade em visualizar lucros e métricas reais",
  "Equipe sobrecarregada com tarefas repetitivas",
  "Falta de integração entre setores e ferramentas",
  "Incerteza tecnológica para escalar o negócio"
];

export default function ProblemsSection() {
  return (
    <section className="relative py-24 sm:py-32 dash-bg overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/[0.02] blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
          <div className="lg:w-1/2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-black uppercase tracking-widest text-red-600 mb-6"
            >
              <AlertCircle className="w-3 h-3" />
              O Custo da Ineficiência
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-6xl font-black dash-text mb-8 tracking-tighter leading-tight"
            >
              Seu negócio está <span className="text-red-500">estagnado</span> por tecnologia defasada?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="dash-text-2 text-lg lg:text-xl leading-relaxed mb-8"
            >
              Muitas empresas perdem tempo e dinheiro tentando adaptar seus processos a ferramentas limitadas. Nós fazemos o contrário: criamos a tecnologia que se adapta à sua ambição.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-4 text-sm font-bold dash-text-2"
            >
              <div className="w-12 h-12 rounded-full border dash-border flex items-center justify-center animate-bounce">
                <ArrowDown className="w-5 h-5" />
              </div>
              Identifique se você enfrenta esses desafios
            </motion.div>
          </div>

          <div className="lg:w-1/2 grid grid-cols-1 gap-4 w-full">
            {problems.map((problem, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="dash-surface p-6 rounded-2xl border dash-border hover:border-red-500/30 transition-all duration-500 group flex items-center gap-4 shadow-sm"
              >
                <div className="w-2 h-2 rounded-full bg-red-500 group-hover:scale-150 transition-transform" />
                <p className="dash-text font-bold text-base sm:text-lg">
                  {problem}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
