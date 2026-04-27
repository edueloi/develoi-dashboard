import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Zap, TrendingUp, Heart, Users, Star, Compass, Shield } from 'lucide-react';

const principles = [
  { label: 'Dedicação', icon: Flame, grad: 'from-orange-500 to-red-500', phrase: 'Entregamos 100% em cada projeto.' },
  { label: 'Evolução', icon: TrendingUp, grad: 'from-aurora-blue to-aurora-purple', phrase: 'Sempre aprendendo, sempre crescendo.' },
  { label: 'Resultado', icon: Zap, grad: 'from-yellow-400 to-orange-500', phrase: 'Código que transforma negócios.' },
  { label: 'Humildade', icon: Heart, grad: 'from-aurora-pink to-aurora-purple', phrase: 'Ouvimos antes de criar.' },
  { label: 'Ajuda', icon: Users, grad: 'from-aurora-green to-aurora-blue', phrase: 'Sucesso do cliente é nosso sucesso.' },
  { label: 'Empresa Familiar', icon: Shield, grad: 'from-aurora-purple to-aurora-blue', phrase: 'Cuidamos de cada detalhe como nosso.' },
  { label: 'Fé', icon: Compass, grad: 'from-aurora-blue to-aurora-green', phrase: 'Confiança no propósito que nos guia.' },
];

export default function ValuesSection() {
  return (
    <section className="relative py-24 sm:py-32 dash-bg transition-colors duration-300 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/[0.03] rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14 sm:mb-20"
        >
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-[10px] sm:text-xs font-black uppercase tracking-[0.35em] text-neutral-600 mb-4"
          >
            O que nos define
          </motion.p>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tighter mb-5 leading-tight dash-text">
            Nossos{' '}
            <span className="text-gradient">Princípios</span>
          </h2>

          <p className="text-sm sm:text-base md:text-lg dash-text-2 max-w-xl mx-auto leading-relaxed">
            Não são regras em uma parede — são a alma de cada entrega, cada reunião e cada linha de código que produzimos.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 mb-16 sm:mb-20">
          {principles.map((p, i) => (
            <motion.div
              key={p.label}
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.4, ease: 'easeOut' }}
              whileHover={{ y: -5 }}
              className="group relative p-6 sm:p-7 rounded-[1.75rem] dash-surface border dash-border overflow-hidden cursor-default shadow-sm hover:shadow-xl transition-all"
            >
              {/* Top gradient line */}
              <div className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r ${p.grad} opacity-20 group-hover:opacity-100 transition-all duration-500`} />

              {/* Corner glow */}
              <div className={`absolute -top-10 -right-10 w-28 h-28 bg-gradient-to-br ${p.grad} opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-700 rounded-full`} />

              <div className="relative z-10">
                {/* Icon */}
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${p.grad} flex items-center justify-center mb-5 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <p.icon className="w-5 h-5 text-white" />
                </div>

                {/* Counter */}
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-700 mb-2 block">
                  {String(i + 1).padStart(2, '0')}
                </span>

                {/* Label */}
                <h3 className="text-lg sm:text-xl font-black tracking-tight dash-text mb-2 leading-tight">
                  {p.label}
                </h3>

                {/* Phrase */}
                <p className="text-xs sm:text-sm dash-text-2 leading-relaxed group-hover:dash-text transition-colors duration-300">
                  {p.phrase}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Impact quote */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <p className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight dash-text max-w-3xl mx-auto leading-snug">
            "Não entregamos apenas software.{' '}
            <span className="text-gradient-animated">
              Entregamos propósito com precisão.
            </span>
            "
          </p>
          <p className="text-[10px] sm:text-xs text-neutral-700 mt-4 font-black uppercase tracking-widest">
            — Equipe Develoi
          </p>
        </motion.div>

      </div>
    </section>
  );
}
