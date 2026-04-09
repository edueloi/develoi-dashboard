import { motion } from 'framer-motion';
import { Rocket, Target, Code, Lightbulb, ArrowRight, CheckCircle } from 'lucide-react';

const services = [
  {
    title: 'Consultoria Estratégica',
    description:
      'Não vendemos apenas software, vendemos soluções para o seu negócio. Analisamos seus gargalos e criamos o caminho para o crescimento.',
    icon: Lightbulb,
    color: 'from-amber-400 to-orange-500',
    borderColor: 'hover:border-amber-400/30',
    glowColor: 'rgba(251,191,36,0.15)',
    bullets: ['Diagnóstico completo do negócio', 'Mapa de crescimento digital', 'ROI garantido'],
  },
  {
    title: 'Marketing de Performance',
    description:
      'Estratégias digitais focadas em conversão e autoridade. Colocamos sua marca onde o seu cliente está.',
    icon: Target,
    color: 'from-aurora-pink to-purple-600',
    borderColor: 'hover:border-aurora-pink/30',
    glowColor: 'rgba(255,0,204,0.15)',
    bullets: ['Funis de alta conversão', 'Tráfego pago e orgânico', 'Análise de dados em tempo real'],
  },
  {
    title: 'Soluções Digitais',
    description:
      'Desenvolvimento de software de primeira linha. Criamos ecossistemas que automatizam sua rotina e escalam seus lucros.',
    icon: Code,
    color: 'from-aurora-blue to-aurora-purple',
    borderColor: 'hover:border-aurora-blue/30',
    glowColor: 'rgba(0,210,255,0.15)',
    bullets: ['Sistemas sob medida', 'Integrações com IA', 'Escalabilidade infinita'],
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

export default function Services() {
  return (
    <section id="servicos" className="py-16 sm:py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] md:w-[800px] h-[400px] sm:h-[600px] md:h-[800px] bg-aurora-purple/5 blur-[100px] sm:blur-[120px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="max-w-3xl mb-12 sm:mb-20 md:mb-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-aurora-blue/10 border border-aurora-blue/20 text-[10px] sm:text-xs font-black uppercase tracking-widest text-aurora-blue mb-4 sm:mb-6"
          >
            <Rocket className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>O que oferecemos</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="font-black mb-4 sm:mb-6 tracking-tighter leading-[0.92]"
            style={{ fontSize: 'clamp(2rem, 6vw, 4.5rem)' }}
          >
            Transformamos{' '}
            <span className="text-gradient">Negócios</span>{' '}
            em Potências Digitais
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl text-neutral-400 leading-relaxed"
          >
            A Develoi não é apenas uma fábrica de software. Somos seus parceiros estratégicos na
            jornada da transformação digital.
          </motion.p>
        </div>

        {/* Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8"
        >
          {services.map((service) => (
            <motion.div
              key={service.title}
              variants={cardVariants}
              whileHover={{ y: -6, transition: { duration: 0.3 } }}
              className={`group relative p-6 sm:p-8 md:p-10 rounded-[2rem] sm:rounded-[2.5rem] glass-card border border-white/[0.04] ${service.borderColor} overflow-hidden cursor-default`}
            >
              {/* Top gradient line */}
              <div
                className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r ${service.color} opacity-40 group-hover:opacity-100 transition-opacity duration-500`}
              />

              {/* Hover glow */}
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 rounded-[2rem] sm:rounded-[2.5rem] pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse at 50% 100%, ${service.glowColor}, transparent 70%)`,
                }}
              />

              <div className="relative z-10">
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-5 sm:mb-7 shadow-lg shadow-black/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}
                >
                  <service.icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                </div>

                <h3 className="text-xl sm:text-2xl md:text-3xl font-black mb-2 sm:mb-3 tracking-tighter">
                  {service.title}
                </h3>
                <p className="text-neutral-400 leading-relaxed mb-5 sm:mb-6 text-sm sm:text-base md:text-lg">
                  {service.description}
                </p>

                <ul className="space-y-2 mb-6 sm:mb-8">
                  {service.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-xs sm:text-sm text-neutral-300">
                      <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-aurora-green flex-shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>

                <button className="flex items-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-widest text-aurora-blue group-hover:gap-3 transition-all duration-300">
                  Saiba Mais
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-10 sm:mt-16 text-center"
        >
          <p className="text-neutral-500 text-xs sm:text-sm font-medium">
            Pronto para escalar seu negócio?{' '}
            <a href="#contato" className="text-aurora-blue font-black hover:underline">
              Fale com a nossa equipe →
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
