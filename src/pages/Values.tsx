import { motion } from 'framer-motion';
import { Target, Zap, Shield, Sparkles, Rocket, Heart } from 'lucide-react';

const values = [
  {
    title: "Idealizações",
    subtitle: "Onde tudo começa",
    description: "Nossa visão é ser a maior plataforma de inovação digital do Brasil, transformando sonhos complexos em realidades extraordinárias.",
    icon: Sparkles,
    color: "from-aurora-blue to-aurora-purple"
  },
  {
    title: "Metas",
    subtitle: "Onde queremos chegar",
    description: "Impactar positivamente 1 milhão de vidas através de nossos ecossistemas digitais e soluções de elite nos próximos 5 anos.",
    icon: Target,
    color: "from-aurora-purple to-aurora-pink"
  },
  {
    title: "Valores",
    subtitle: "O que nos guia",
    description: "Excelência absoluta, transparência total, inovação constante e compromisso inabalável com o sucesso do cliente.",
    icon: Heart,
    color: "from-aurora-pink to-aurora-green"
  }
];

export default function Values() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-32 pb-20"
    >
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center mb-32">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black mb-8 tracking-tighter"
          >
            IDEALIZAÇÕES, <span className="text-gradient">METAS</span> & VALORES
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-neutral-400 leading-relaxed"
          >
            A bússola que guia cada decisão na Develoi. Nossa essência é baseada em propósito e excelência.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
          {values.map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative p-12 rounded-[3rem] glass-card overflow-hidden text-center"
            >
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${value.color} opacity-50 group-hover:opacity-100 transition-opacity`} />
              
              <div className="relative z-10">
                <div className={`w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br ${value.color} flex items-center justify-center mb-10 shadow-lg shadow-black/20 group-hover:scale-110 transition-transform duration-500`}>
                  <value.icon className="w-10 h-10 text-white" />
                </div>
                
                <p className="text-xs font-black uppercase tracking-[0.3em] text-neutral-500 mb-4">{value.subtitle}</p>
                <h3 className="text-4xl font-black mb-6 tracking-tighter">{value.title}</h3>
                <p className="text-neutral-400 leading-relaxed text-lg">
                  {value.description}
                </p>
              </div>

              {/* Decorative background glow */}
              <div className={`absolute -bottom-24 -right-24 w-48 h-48 bg-gradient-to-br ${value.color} opacity-0 group-hover:opacity-10 blur-[60px] transition-opacity duration-700`} />
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="max-w-5xl mx-auto glass p-16 md:p-24 rounded-[4rem] border-white/5 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-aurora-blue to-transparent opacity-50" />
          <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter">
            Pronto para <span className="text-gradient">Elevar</span> seu Negócio?
          </h2>
          <p className="text-xl text-neutral-300 mb-12 max-w-2xl mx-auto">
            Nossas metas são ambiciosas porque acreditamos no potencial ilimitado de cada projeto que abraçamos.
          </p>
          <button className="px-12 py-6 bg-white text-black font-black rounded-2xl text-lg hover:scale-105 transition-transform shadow-xl shadow-white/10">
            FALAR COM UM ESPECIALISTA
          </button>
        </div>
      </div>
    </motion.div>
  );
}
