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
    title: "Nossa Missão",
    subtitle: "Por que existimos",
    description:
      "Transformar necessidades reais em soluções digitais inteligentes, funcionais e bem construídas. Unimos tecnologia, estratégia e olhar humano para criar sites, sistemas, automações e experiências que simplificam processos e ajudam empresas a crescerem com clareza e segurança.",
    icon: Target,
    color: "from-aurora-blue to-aurora-purple",
  },
  {
    title: "Nossa Visão",
    subtitle: "Onde queremos chegar",
    description:
      "Ser reconhecidos como uma empresa de soluções digitais que entrega mais do que tecnologia: entrega confiança, proximidade e evolução. Uma marca forte, respeitada pela qualidade das entregas e pela capacidade de acompanhar clientes desde a estruturação inicial até projetos escaláveis.",
    icon: Sparkles,
    color: "from-aurora-purple to-aurora-pink",
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
      className="relative min-h-screen pt-32 pb-24 overflow-hidden"
    >
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[10%] right-[-5%] w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[20%] left-[-5%] w-[600px] h-[600px] bg-purple-500/10 blur-[150px] rounded-full animate-float-slow" />
        <div className="absolute inset-0 noise-overlay opacity-[0.08]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Hero */}
        <div className="max-w-4xl mx-auto text-center mb-40">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full dash-surface-2 border dash-border mb-10 shadow-xl"
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500">DNA Develoi</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black mb-10 leading-[0.9] tracking-tighter dash-text"
          >
            IDEALIZAÇÕES, <span className="text-gradient-animated">METAS</span> & VALORES.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-3xl dash-text-2 leading-relaxed max-w-2xl mx-auto font-medium opacity-80"
          >
            O que nos move, o que entregamos e como nos relacionamos. A essência por trás de cada solução que construímos.
          </motion.p>
        </div>

        {/* Pillars */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 ${
            pillarCards.length >= 3 ? "lg:grid-cols-3" : "lg:grid-cols-2 max-w-5xl mx-auto"
          } gap-10 mb-40`}
        >
          {pillarCards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative p-10 sm:p-12 rounded-[3.5rem] dash-surface border dash-border overflow-hidden text-center shadow-2xl hover:shadow-indigo-500/10 transition-all duration-700"
            >
              <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${card.color} opacity-20 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className="relative z-10">
                <div className={`w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-[2rem] bg-gradient-to-br ${card.color} flex items-center justify-center mb-8 shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                  <card.icon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] dash-text opacity-40 mb-4">
                  {card.subtitle}
                </p>
                <h3 className="text-3xl sm:text-4xl font-black mb-6 tracking-tighter leading-tight dash-text">
                  {card.title}
                </h3>
                <p className="dash-text-2 leading-relaxed text-lg font-medium opacity-70">
                  {card.description}
                </p>
              </div>

              <div className={`absolute -bottom-24 -right-24 w-64 h-64 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-10 blur-[80px] transition-opacity duration-700`} />
            </motion.div>
          ))}
        </div>

        {/* Principles */}
        {principles.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-40"
          >
            <div className="text-center mb-24">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 mb-6 block">O que nos move</span>
              <h2 className="text-4xl md:text-7xl font-black tracking-tighter mb-8 dash-text">
                Nossos <span className="text-gradient">Princípios.</span>
              </h2>
              <p className="text-lg md:text-xl dash-text-2 max-w-2xl mx-auto leading-relaxed font-medium opacity-70">
                Cada linha de código que escrevemos carrega o DNA destes princípios fundamentais.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {principles.map((v, i) => {
                const IconComp = principleIcons[i % principleIcons.length];
                const grad = gradients[i % gradients.length];
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="group relative p-8 rounded-[2.5rem] dash-surface border dash-border overflow-hidden shadow-2xl hover:shadow-indigo-500/5 transition-all duration-500"
                  >
                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${grad} opacity-20 group-hover:opacity-100 transition-all`} />
                    
                    <div className="relative z-10">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform`}>
                        <IconComp className="w-6 h-6 text-white" />
                      </div>

                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 mb-3 block">
                        Princípio {String(i + 1).padStart(2, '0')}
                      </span>

                      <h4 className="text-2xl font-black tracking-tight dash-text mb-3 leading-tight">
                        {v.title}
                      </h4>

                      <p className="text-sm dash-text-2 leading-relaxed font-medium opacity-60">
                        {v.description || "Um dos pilares que definem nossa cultura e busca incessante pela perfeição técnica."}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="mt-32 text-center"
            >
              <p className="text-2xl md:text-5xl font-black tracking-tighter dash-text max-w-4xl mx-auto leading-tight">
                "Não começamos pelo código. Começamos pela <span className="text-gradient-animated">realidade de quem precisa evoluir.</span>"
              </p>
              <div className="mt-8 flex items-center justify-center gap-3">
                <div className="h-px w-12 bg-indigo-500/20" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-500 opacity-60">
                  DEVELOI SOLUÇÕES DIGITAIS
                </p>
                <div className="h-px w-12 bg-indigo-500/20" />
              </div>
            </motion.div>
          </motion.section>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative group max-w-6xl mx-auto"
        >
          <div className="absolute -inset-6 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded-[5rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="relative dash-surface-2 border dash-border p-12 sm:p-24 rounded-[4rem] text-center overflow-hidden shadow-3xl">
            <div className="absolute inset-0 noise-overlay opacity-[0.05]" />
            <h2 className="text-4xl md:text-7xl font-black mb-8 tracking-tighter dash-text leading-[0.95]">
              PRONTO PARA <span className="text-gradient">ELEVAR</span><br />SEU NEGÓCIO?
            </h2>
            <p className="text-xl md:text-2xl dash-text-2 mb-12 max-w-2xl mx-auto font-medium opacity-70 leading-relaxed">
              Criamos soluções digitais para empresas que querem evoluir sem perder sua essência. Vamos conversar sobre o seu negócio?
            </p>
            <motion.a
              href="/#contato"
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block px-12 py-6 text-white font-black rounded-2xl text-lg shadow-2xl transition-all uppercase tracking-widest"
              style={{ background: 'var(--brand-navy)', boxShadow: '0 20px 60px rgba(13,31,78,0.35)' }}
            >
              FALAR COM A DEVELOI
            </motion.a>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
