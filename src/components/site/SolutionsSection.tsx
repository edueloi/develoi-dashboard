// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Calendar, HeartPulse, Code, ArrowRight } from 'lucide-react';

const products = [
  {
    icon: Settings,
    name: 'MecaERP',
    tag: 'Para Oficinas',
    desc: 'Organiza serviços, controla peças e mostra seu lucro real sem complicações.',
    color: 'from-blue-500 to-cyan-400'
  },
  {
    icon: HeartPulse,
    name: 'PsiFlux',
    tag: 'Para Clínicas',
    desc: 'Controle completo, organização de pacientes e gestão financeira segura.',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: Calendar,
    name: 'Agendelle',
    tag: 'Para Salões',
    desc: 'Agenda inteligente, lembretes automáticos e gestão de profissionais.',
    color: 'from-emerald-400 to-teal-500'
  },
  {
    icon: Code,
    name: 'Sob Medida',
    tag: 'Para Sua Empresa',
    desc: 'Criamos a solução ideal e exclusiva para os desafios únicos do seu negócio.',
    color: 'from-orange-400 to-red-500'
  }
];

export default function SolutionsSection() {
  return (
    <section id="solucoes" className="relative py-24 overflow-hidden bg-[#030303]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-16">
          <h2 className="text-aurora-blue font-black uppercase tracking-widest text-sm mb-4">Nossos Produtos</h2>
          <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
            Soluções para <span className="text-gradient">gerar resultados.</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {products.map((prod, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="glass-card rounded-[2rem] p-8 relative overflow-hidden group hover:border-white/20"
            >
              <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${prod.color} opacity-5 blur-3xl group-hover:opacity-10 transition-opacity duration-500`} />
              
              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${prod.color} bg-opacity-10 flex items-center justify-center p-[1px]`}>
                  <div className="w-full h-full bg-[#0a0a0a] rounded-2xl flex items-center justify-center">
                    <prod.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <span className="tag-pill">{prod.tag}</span>
              </div>

              <div className="relative z-10">
                <h4 className="text-2xl font-black text-white mb-3">{prod.name}</h4>
                <p className="text-neutral-400 text-lg mb-8 line-clamp-2">
                  {prod.desc}
                </p>
                <button className="flex items-center gap-2 text-white font-bold hover:text-aurora-blue transition-colors group/btn">
                  Conhecer solução 
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
