import { motion } from 'framer-motion';
import { Rocket, Target, Code, Lightbulb, ArrowRight } from 'lucide-react';

const services = [
  {
    title: "Consultoria Estratégica",
    description: "Não vendemos apenas software, vendemos soluções para o seu negócio. Analisamos seus gargalos e criamos o caminho para o crescimento.",
    icon: Lightbulb,
    color: "from-amber-400 to-orange-500"
  },
  {
    title: "Marketing de Performance",
    description: "Estratégias digitais focadas em conversão e autoridade. Colocamos sua marca onde o seu cliente está.",
    icon: Target,
    color: "from-aurora-pink to-purple-600"
  },
  {
    title: "Soluções Digitais",
    description: "Desenvolvimento de software de primeira linha. Criamos ecossistemas que automatizam sua rotina e escalam seus lucros.",
    icon: Code,
    color: "from-aurora-blue to-aurora-purple"
  }
];

export default function Services() {
  return (
    <section id="servicos" className="py-32 relative">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-aurora-blue/10 border border-aurora-blue/20 text-xs font-black uppercase tracking-widest text-aurora-blue mb-6"
          >
            <Rocket className="w-4 h-4" />
            <span>O que oferecemos</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black mb-8 tracking-tighter leading-none"
          >
            Transformamos <span className="text-gradient">Negócios</span> em Potências Digitais
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-neutral-400 leading-relaxed"
          >
            A Develoi não é apenas uma fábrica de software. Somos seus parceiros estratégicos na jornada da transformação digital.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative p-10 rounded-[3rem] glass-card overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${service.color} opacity-50 group-hover:opacity-100 transition-opacity`} />
              
              <div className="relative z-10">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-8 shadow-lg shadow-black/20 group-hover:scale-110 transition-transform duration-500`}>
                  <service.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-3xl font-black mb-4 tracking-tighter">{service.title}</h3>
                <p className="text-neutral-400 leading-relaxed mb-8 text-lg">
                  {service.description}
                </p>
                
                <button className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-white group-hover:text-aurora-blue transition-colors">
                  Saiba Mais <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </button>
              </div>

              {/* Decorative background glow */}
              <div className={`absolute -bottom-24 -right-24 w-48 h-48 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-10 blur-[60px] transition-opacity duration-700`} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
