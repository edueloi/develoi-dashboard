import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, XCircle } from 'lucide-react';

const problems = [
  "Processos manuais que travam o crescimento",
  "Dificuldade em visualizar lucros e métricas reais",
  "Equipe sobrecarregada com tarefas repetitivas",
  "Falta de integração entre setores e ferramentas",
  "Incerteza tecnológica para escalar o negócio",
];

export default function ProblemsSection() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Esquerda */}
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 mb-5">
              <AlertCircle className="w-4 h-4" style={{ color: '#dc2626' }} />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: '#dc2626' }}>O custo da ineficiência</span>
            </div>
            <h2 className="font-black tracking-tight leading-tight mb-6" style={{ fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', color: 'var(--brand-navy)' }}>
              Seu negócio está{' '}
              <span style={{ color: '#dc2626' }}>estagnado</span>{' '}
              por tecnologia defasada?
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Muitas empresas perdem tempo e dinheiro tentando adaptar seus processos a ferramentas limitadas. Nós fazemos o contrário: criamos a tecnologia que se adapta à sua ambição.
            </p>
          </motion.div>

          {/* Direita — lista de problemas */}
          <div className="grid grid-cols-1 gap-3 w-full">
            {problems.map((problem, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className="bg-white rounded-2xl border p-5 flex items-center gap-4 transition-all duration-250"
                style={{ borderColor: 'var(--border-color)', boxShadow: '0 2px 8px rgba(13,31,78,0.04)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(220,38,38,0.3)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)'; }}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(220,38,38,0.08)' }}>
                  <XCircle className="w-4 h-4" style={{ color: '#dc2626' }} />
                </div>
                <p className="font-semibold text-sm" style={{ color: 'var(--brand-navy)' }}>{problem}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
