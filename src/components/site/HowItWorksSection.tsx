// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { Search, Lightbulb, Code2, Rocket } from 'lucide-react';

const steps = [
  { 
    num: '01', 
    title: 'Imersão & Estratégia', 
    desc: 'Mergulhamos fundo no seu modelo de negócio para identificar dores e oportunidades reais.',
    icon: Search,
    color: 'from-blue-500 to-indigo-500'
  },
  { 
    num: '02', 
    title: 'Arquitetura de Solução', 
    desc: 'Desenhamos a infraestrutura ideal e a experiência do usuário focada em conversão.',
    icon: Lightbulb,
    color: 'from-indigo-500 to-violet-500'
  },
  { 
    num: '03', 
    title: 'Desenvolvimento',
    desc: 'Nossa equipe constrói seu projeto com as tecnologias mais modernas, seguras e eficientes do mercado.',
    icon: Code2,
    color: 'from-violet-500 to-purple-500'
  },
  { 
    num: '04', 
    title: 'Escala & Performance', 
    desc: 'Lançamos e otimizamos continuamente para garantir que seu negócio nunca pare de crescer.',
    icon: Rocket,
    color: 'from-purple-500 to-fuchsia-500'
  }
];

export default function HowItWorksSection() {
  return (
    <section className="relative py-24 sm:py-32 dash-bg transition-colors duration-300 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-[0.03] dark:opacity-[0.05]">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-indigo-500 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-purple-500 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-black uppercase tracking-widest text-indigo-600 mb-6"
          >
            Nossa Metodologia
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-black dash-text tracking-tighter mb-6"
          >
            Como criamos seu <span className="text-gradient">sucesso</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg dash-text-2 max-w-2xl mx-auto leading-relaxed"
          >
            Um processo refinado que transforma ideias complexas em plataformas de alta performance e escala global.
          </motion.p>
        </div>

        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent -translate-y-1/2" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 xl:gap-12">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                className="group relative"
              >
                {/* Step Number Background */}
                <div className="absolute -top-10 -right-4 text-9xl font-black dash-text opacity-[0.03] select-none pointer-events-none group-hover:opacity-[0.06] transition-opacity duration-700">
                  {step.num}
                </div>

                <div className="relative h-full flex flex-col items-center lg:items-start text-center lg:text-left">
                  {/* Icon Container */}
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-[2rem] bg-gradient-to-br ${step.color} p-[1px] mb-8 shadow-xl shadow-indigo-500/10 group-hover:scale-110 transition-transform duration-500`}>
                    <div className="w-full h-full rounded-[2rem] dash-surface flex items-center justify-center">
                      <step.icon className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-500" />
                    </div>
                  </div>

                  <div className="dash-surface p-8 rounded-[2.5rem] border dash-border shadow-sm hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-500 flex-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-4 block">
                      Fase {step.num}
                    </span>
                    <h4 className="text-xl sm:text-2xl font-black dash-text mb-4 tracking-tight leading-tight">
                      {step.title}
                    </h4>
                    <p className="dash-text-2 text-sm sm:text-base leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
