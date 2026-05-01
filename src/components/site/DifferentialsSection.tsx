// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ShieldCheck, Zap, Users2, Sparkles } from 'lucide-react';

const differentials = [
  {
    title: "Estratégia de Negócio",
    desc: "Não vendemos apenas código, construímos o motor que impulsiona seus resultados reais.",
    icon: Zap,
    color: "from-amber-500 to-orange-500"
  },
  {
    title: "Parceria Estratégica",
    desc: "Atuamos como seu CTO as a Service, pensando estrategicamente em cada decisão técnica.",
    icon: ShieldCheck,
    color: "from-indigo-500 to-blue-500"
  },
  {
    title: "Design de Conversão",
    desc: "Interfaces que encantam e convertem, unindo estética premium com usabilidade absoluta.",
    icon: Sparkles,
    color: "from-purple-500 to-indigo-500"
  },
  {
    title: "Suporte Pró-Ativo",
    desc: "Monitoramento constante e evolução contínua. Seu software nunca fica obsoleto.",
    icon: Users2,
    color: "from-emerald-500 to-teal-500"
  }
];

export default function DifferentialsSection() {
  return (
    <section className="relative py-24 sm:py-32 dash-bg overflow-hidden">
      {/* Decorative Circles */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/[0.02] blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-black dash-text mb-8 tracking-tighter"
          >
            Por que líderes escolhem a <span className="text-gradient">Develoi?</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="dash-text-2 text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed"
          >
            Diferente de agências tradicionais, somos seu braço tecnológico estratégico focado em organizar, escalar e gerar resultado real para o seu negócio.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {differentials.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group dash-surface p-8 rounded-[2.5rem] border dash-border hover:border-indigo-500/30 transition-all duration-500 shadow-sm flex flex-col sm:flex-row gap-6 items-start"
            >
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                <item.icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h4 className="text-xl sm:text-2xl font-black dash-text mb-3 tracking-tight">
                  {item.title}
                </h4>
                <p className="dash-text-2 text-sm sm:text-base leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Feature Banner */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 sm:mt-24 relative p-10 sm:p-16 rounded-[3rem] dash-surface border dash-border overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/[0.03] to-purple-500/[0.03]" />
          <div className="relative z-10 max-w-xl text-center md:text-left">
            <h3 className="text-3xl sm:text-4xl font-black dash-text tracking-tighter mb-4">
              Tecnologia que <span className="text-indigo-600">paga o investimento.</span>
            </h3>
            <p className="dash-text-2 text-base sm:text-lg">
              Nosso foco é o ROI. Se o software não gera mais lucro ou economiza tempo real, não faz sentido ser construído.
            </p>
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="text-6xl sm:text-8xl font-black text-indigo-600 tracking-tighter">100%</div>
            <div className="text-xs sm:text-sm font-black uppercase tracking-[0.3em] dash-text opacity-40">Comprometimento</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
