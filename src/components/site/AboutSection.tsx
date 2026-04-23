// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Users, Target, CheckCircle2 } from 'lucide-react';

export default function AboutSection() {
  return (
    <section className="relative py-24 bg-[#030303]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-aurora-blue font-black uppercase tracking-widest text-sm mb-4">Quem somos</h2>
            <h3 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tighter leading-tight">
              Somos mais do que uma empresa de <span className="text-gradient">tecnologia.</span>
            </h3>
            
            <div className="space-y-6 text-neutral-400 text-lg leading-relaxed mb-8">
              <p>
                A Develoi nasceu com uma essência familiar e um propósito claro: usar a tecnologia para ajudar pessoas e empresas a evoluírem de verdade. 
              </p>
              <p>
                Não somos apenas fornecedores de código ou sistemas de prateleira. Nós nos envolvemos de verdade nos projetos, entendemos suas dores, comemoramos suas vitórias e trabalhamos lado a lado para garantir que cada solução traga resultados palpáveis. Valorizamos as relações antes de qualquer venda.
              </p>
              <p className="font-semibold text-white text-xl border-l-4 border-aurora-blue pl-4 py-2 bg-white/[0.02]">
                "Não somos apenas uma empresa de tecnologia. Somos parceiros na construção do seu crescimento."
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {[
              { icon: Heart, title: 'Atendimento próximo', desc: 'Tratamos cada cliente como parceiro.' },
              { icon: CheckCircle2, title: 'Compromisso real', desc: 'Entregamos o que prometemos, sempre.' },
              { icon: Target, title: 'Soluções sob medida', desc: 'Sistemas feitos para a sua realidade.' },
              { icon: Users, title: 'Foco em resultado', desc: 'O seu crescimento é o nosso sucesso.' }
            ].map((card, idx) => (
              <div key={idx} className="glass-card p-6 rounded-2xl flex flex-col gap-4 border-white/[0.05] hover:bg-white/[0.03]">
                <div className="w-12 h-12 rounded-xl bg-aurora-blue/10 flex items-center justify-center">
                  <card.icon className="w-6 h-6 text-aurora-blue" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg mb-1">{card.title}</h4>
                  <p className="text-neutral-500 text-sm">{card.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
          
        </div>
      </div>
    </section>
  );
}
