import { motion } from 'framer-motion';
import { Target, Heart, Sparkles, Zap, Shield, Star, Compass, Flame, Users, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

type ValueItem = { title: string; description: string };
type SiteValues = { mission: string; vision: string; values: ValueItem[] };

const gradients = [
  "from-aurora-blue to-aurora-purple",
  "from-aurora-purple to-aurora-pink",
  "from-aurora-pink to-aurora-green",
  "from-aurora-green to-aurora-blue",
  "from-aurora-blue to-aurora-green",
  "from-aurora-purple to-aurora-blue",
  "from-aurora-pink to-aurora-blue",
];

const principleIcons = [Flame, Zap, TrendingUp, Heart, Shield, Star, Compass, Users, Sparkles, Target];

const fallbackPillars = [
  {
    title: "Idealizações",
    subtitle: "Onde tudo começa",
    description:
      "Nossa visão é ser a maior plataforma de inovação digital do Brasil, transformando sonhos complexos em realidades extraordinárias.",
    icon: Sparkles,
    color: "from-aurora-blue to-aurora-purple",
  },
  {
    title: "Metas",
    subtitle: "Onde queremos chegar",
    description:
      "Impactar positivamente 1 milhão de vidas através de nossos ecossistemas digitais e soluções de elite nos próximos 5 anos.",
    icon: Target,
    color: "from-aurora-purple to-aurora-pink",
  },
  {
    title: "Valores",
    subtitle: "O que nos guia",
    description:
      "Excelência absoluta, transparência total, inovação constante e compromisso inabalável com o sucesso do cliente.",
    icon: Heart,
    color: "from-aurora-pink to-aurora-green",
  },
];

export default function Values() {
  const [siteData, setSiteData] = useState<SiteValues | null>(null);

  useEffect(() => {
    fetch('/api/site/values')
      .then(r => r.json())
      .then(d => setSiteData(d))
      .catch(() => setSiteData(null));
  }, []);

  const pillarCards = (() => {
    if (!siteData) return fallbackPillars;
    const cards = [];
    if (siteData.mission)
      cards.push({ title: "Nossa Missão", subtitle: "Por que existimos", description: siteData.mission, icon: Target, color: gradients[0] });
    if (siteData.vision)
      cards.push({ title: "Nossa Visão", subtitle: "Onde queremos chegar", description: siteData.vision, icon: Sparkles, color: gradients[1] });
    return cards.length > 0 ? cards : fallbackPillars;
  })();

  const principles = siteData?.values?.filter(v => v.title) ?? [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-28 pb-20 overflow-x-hidden"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Hero ─────────────────────────────────────────────── */}
        <div className="max-w-4xl mx-auto text-center mb-20 sm:mb-28 px-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs font-black uppercase tracking-widest text-neutral-400 mb-8"
          >
            <Sparkles className="w-3.5 h-3.5 text-aurora-blue" />
            DNA Develoi
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-black mb-6 tracking-tighter leading-[1.05]"
          >
            IDEALIZAÇÕES,{" "}
            <span className="text-gradient">METAS</span>{" "}
            &amp; VALORES
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-xl text-neutral-400 leading-relaxed max-w-2xl mx-auto"
          >
            A bússola que guia cada decisão na Develoi. Nossa essência é baseada em propósito e excelência.
          </motion.p>
        </div>

        {/* ── Pillars ───────────────────────────────────────────── */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 ${
            pillarCards.length >= 3 ? "lg:grid-cols-3" : "lg:grid-cols-2 max-w-4xl mx-auto"
          } gap-5 sm:gap-8 mb-20 sm:mb-28`}
        >
          {pillarCards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative p-8 sm:p-10 rounded-[2rem] glass-card overflow-hidden text-center"
            >
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${card.color} opacity-40 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className="relative z-10">
                <div className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl sm:rounded-3xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-7 shadow-lg shadow-black/20 group-hover:scale-110 transition-transform duration-500`}>
                  <card.icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-neutral-500 mb-3">
                  {card.subtitle}
                </p>
                <h3 className="text-2xl sm:text-3xl font-black mb-4 tracking-tighter leading-tight">
                  {card.title}
                </h3>
                <p className="text-neutral-400 leading-relaxed text-sm sm:text-base">
                  {card.description}
                </p>
              </div>

              <div className={`absolute -bottom-24 -right-24 w-48 h-48 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-10 blur-[60px] transition-opacity duration-700`} />
            </motion.div>
          ))}
        </div>

        {/* ── Principles (values from DB) ───────────────────────── */}
        {principles.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20 sm:mb-28"
          >
            {/* Section Header */}
            <div className="text-center mb-12 sm:mb-16 px-2">
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-[10px] sm:text-xs font-black uppercase tracking-[0.35em] text-neutral-500 mb-4"
              >
                O que nos move
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter mb-4"
              >
                Nossos <span className="text-gradient">Princípios</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-sm sm:text-base text-neutral-500 max-w-xl mx-auto leading-relaxed"
              >
                Cada linha de código que escrevemos carrega o peso destes princípios. Eles não são regras — são quem somos.
              </motion.p>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {principles.map((v, i) => {
                const IconComp = principleIcons[i % principleIcons.length];
                const grad = gradients[i % gradients.length];
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20, scale: 0.97 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06, duration: 0.4, ease: "easeOut" }}
                    whileHover={{ y: -4 }}
                    className="group relative p-6 sm:p-7 rounded-[1.75rem] glass-card overflow-hidden cursor-default"
                  >
                    {/* Top gradient line */}
                    <div className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r ${grad} opacity-25 group-hover:opacity-100 transition-all duration-500`} />

                    {/* Corner glow */}
                    <div className={`absolute -top-10 -right-10 w-28 h-28 bg-gradient-to-br ${grad} opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-700 rounded-full`} />

                    <div className="relative z-10">
                      {/* Icon */}
                      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center mb-5 shadow-md group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}>
                        <IconComp className="w-5 h-5 text-white" />
                      </div>

                      {/* Number tag */}
                      <span className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-600 mb-2 block">
                        {String(i + 1).padStart(2, '0')}
                      </span>

                      {/* Title */}
                      <h4 className="text-lg sm:text-xl font-black tracking-tight text-white mb-2 leading-tight group-hover:text-gradient transition-colors duration-300">
                        {v.title}
                      </h4>

                      {/* Description or impact phrase */}
                      {v.description ? (
                        <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed group-hover:text-neutral-400 transition-colors duration-300">
                          {v.description}
                        </p>
                      ) : (
                        <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed italic group-hover:text-neutral-500 transition-colors duration-300">
                          Um dos pilares que definem nossa cultura e forma de trabalhar.
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Impact quote */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mt-12 sm:mt-16 text-center"
            >
              <p className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight text-neutral-300 max-w-3xl mx-auto leading-snug">
                "Não entregamos apenas software.{" "}
                <span className="text-gradient-animated">
                  Entregamos propósito com precisão.
                </span>
                "
              </p>
              <p className="text-xs text-neutral-600 mt-4 font-bold uppercase tracking-widest">
                — Equipe Develoi
              </p>
            </motion.div>
          </motion.section>
        )}

        {/* ── CTA ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto glass p-10 sm:p-16 md:p-24 rounded-[2.5rem] sm:rounded-[4rem] border-white/5 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-aurora-blue to-transparent opacity-50" />
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-72 h-72 bg-aurora-blue/10 rounded-full blur-[80px] pointer-events-none" />

          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black mb-5 sm:mb-8 tracking-tighter relative z-10">
            Pronto para <span className="text-gradient">Elevar</span> seu Negócio?
          </h2>
          <p className="text-base sm:text-xl text-neutral-300 mb-8 sm:mb-12 max-w-2xl mx-auto relative z-10">
            Nossas metas são ambiciosas porque acreditamos no potencial ilimitado de cada projeto que abraçamos.
          </p>
          <button className="relative z-10 px-8 sm:px-12 py-4 sm:py-6 bg-white text-black font-black rounded-2xl text-base sm:text-lg hover:scale-105 active:scale-95 transition-transform shadow-xl shadow-white/10">
            FALAR COM UM ESPECIALISTA
          </button>
        </motion.div>

      </div>
    </motion.div>
  );
}
