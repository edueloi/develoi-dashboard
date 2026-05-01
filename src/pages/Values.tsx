// @ts-nocheck
import { motion } from 'framer-motion';
import { Target, Sparkles, Heart, Shield, Zap, Star, Users, TrendingUp, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';

type ValueItem = { title: string; description: string };
type SiteValues = { mission: string; vision: string; values: ValueItem[] };

const fallbackValues: ValueItem[] = [
  { title: 'Atendimento Humano e Próximo', description: 'Somos parceiros reais. Atendemos com atenção, clareza e proximidade em cada etapa do projeto.' },
  { title: 'Tecnologia com Propósito', description: 'Cada solução é construída com intenção — para resolver o seu problema, não só para impressionar.' },
  { title: 'Soluções Sob Medida', description: 'Nada de pacotes genéricos. Entendemos sua realidade e criamos o que faz sentido para você.' },
  { title: 'Organização e Transparência', description: 'Processos claros, comunicação aberta e entregas previsíveis. Sem surpresas desagradáveis.' },
  { title: 'Agilidade com Responsabilidade', description: 'Entregamos rápido sem abrir mão da qualidade. Compromisso com prazo e com o resultado.' },
  { title: 'Excelência e Compromisso', description: 'Cada detalhe importa. Buscamos sempre o melhor nível de execução em cada projeto.' },
  { title: 'Ética, Confiança e Parceria', description: 'Transparência no relacionamento e comprometimento com o crescimento do cliente a longo prazo.' },
];

const valueIcons = [Heart, Zap, Star, Shield, TrendingUp, Target, Users, Sparkles, CheckCircle2];

export default function Values() {
  const [siteData, setSiteData] = useState<SiteValues | null>(null);

  useEffect(() => {
    fetch('/api/site/values')
      .then(r => r.json())
      .then(d => setSiteData(d))
      .catch(() => setSiteData(null));
  }, []);

  const mission = siteData?.mission || 'Transformar necessidades reais em soluções digitais inteligentes, funcionais e bem construídas. Unimos tecnologia, estratégia e olhar humano para criar experiências que simplificam processos e ajudam empresas a crescerem com clareza e segurança.';
  const vision = siteData?.vision || 'Ser reconhecidos como uma empresa que entrega mais do que tecnologia: entrega confiança, proximidade e evolução. Uma marca respeitada pela qualidade das entregas e pela capacidade de acompanhar clientes desde o início até projetos escaláveis.';
  const values = siteData?.values?.filter(v => v.title).length ? siteData.values.filter(v => v.title) : fallbackValues;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-screen overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Blurs de fundo sutis */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[5%] right-[-5%] w-[500px] h-[500px] rounded-full blur-[140px]" style={{ background: 'rgba(13,31,78,0.04)' }} />
        <div className="absolute bottom-[10%] left-[-5%] w-[500px] h-[500px] rounded-full blur-[140px]" style={{ background: 'rgba(196,154,42,0.04)' }} />
      </div>

      {/* ── HERO ── */}
      <section
        className="relative pt-32 pb-20 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #06112B 0%, #0D1F4E 60%, #0A1840 100%)' }}
      >
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, var(--brand-gold), rgba(196,154,42,0.2) 70%, transparent)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />

        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="w-5 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
              <span className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--brand-gold)' }}>
                DNA Develoi
              </span>
            </div>
            <h1
              className="font-black text-white leading-[1.05] tracking-tight mb-5"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
            >
              Missão, Visão{' '}
              <span style={{ color: 'var(--brand-gold)' }}>& Valores</span>
            </h1>
            <p className="text-base leading-relaxed max-w-xl" style={{ color: 'rgba(255,255,255,0.55)' }}>
              O que nos move, o que entregamos e como nos relacionamos. A essência por trás de cada solução que construímos.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── MISSÃO + VISÃO ── */}
      <section className="py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Missão */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative rounded-2xl overflow-hidden p-8 sm:p-10 border"
              style={{
                background: 'white',
                borderColor: 'var(--border-color)',
                boxShadow: '0 4px 24px rgba(13,31,78,0.06)',
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, #0D1F4E, rgba(13,31,78,0.2))' }} />
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-6" style={{ background: 'rgba(13,31,78,0.07)' }}>
                <Target className="w-5 h-5" style={{ color: '#0D1F4E' }} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--text-muted)' }}>
                Por que existimos
              </p>
              <h2 className="text-xl font-black tracking-tight mb-4" style={{ color: 'var(--brand-navy)' }}>
                Nossa Missão
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {mission}
              </p>
            </motion.div>

            {/* Visão */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative rounded-2xl overflow-hidden p-8 sm:p-10"
              style={{
                background: 'linear-gradient(135deg, #06112B 0%, #0D1F4E 100%)',
                boxShadow: '0 8px 32px rgba(13,31,78,0.2)',
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, var(--brand-gold), rgba(196,154,42,0.2))' }} />
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-6" style={{ background: 'rgba(196,154,42,0.12)' }}>
                <Sparkles className="w-5 h-5" style={{ color: 'var(--brand-gold)' }} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2" style={{ color: 'rgba(196,154,42,0.55)' }}>
                Onde queremos chegar
              </p>
              <h2 className="text-xl font-black tracking-tight mb-4 text-white">
                Nossa Visão
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {vision}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── VALORES ── */}
      <section className="pb-20 md:pb-28" style={{ background: 'var(--bg-tertiary)' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-16">

          {/* Header seção */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="w-5 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--brand-gold)' }}>
                O que nos guia
              </span>
              <span className="w-5 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
            </div>
            <h2
              className="font-black tracking-tight"
              style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', color: 'var(--brand-navy)' }}
            >
              Nossos 7 Valores
            </h2>
            <p className="text-sm mt-3 max-w-lg mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Estes princípios definem como trabalhamos, como nos relacionamos e como entregamos valor a cada cliente.
            </p>
          </motion.div>

          {/* Grid de valores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {values.map((v, i) => {
              const IconComp = valueIcons[i % valueIcons.length];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                  className="bg-white rounded-2xl p-6 border group transition-all duration-250 hover:-translate-y-1"
                  style={{
                    borderColor: 'var(--border-color)',
                    boxShadow: '0 2px 12px rgba(13,31,78,0.04)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,154,42,0.3)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(13,31,78,0.09)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(13,31,78,0.04)';
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: 'var(--bg-tertiary)' }}
                    >
                      <IconComp className="w-4.5 h-4.5" style={{ color: 'var(--brand-navy)' }} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <h3 className="font-black text-sm leading-snug mb-2" style={{ color: 'var(--brand-navy)' }}>
                        {v.title}
                      </h3>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {v.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── QUOTE ── */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="h-px w-12" style={{ background: 'var(--border-color)' }} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: 'var(--text-muted)' }}>
                Develoi Soluções Digitais
              </span>
              <div className="h-px w-12" style={{ background: 'var(--border-color)' }} />
            </div>
            <p
              className="font-black tracking-tight leading-tight mb-3"
              style={{ fontSize: 'clamp(1.4rem, 3vw, 2.2rem)', color: 'var(--brand-navy)' }}
            >
              "Não começamos pelo código.{' '}
              <span style={{ color: 'var(--brand-gold)' }}>
                Começamos pela realidade de quem precisa evoluir."
              </span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl overflow-hidden relative"
            style={{
              background: 'linear-gradient(135deg, #06112B 0%, #0D1F4E 100%)',
              boxShadow: '0 20px 60px rgba(13,31,78,0.2)',
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, var(--brand-gold), rgba(196,154,42,0.15) 70%, transparent)' }} />
            <div className="relative z-10 px-8 sm:px-16 py-14 sm:py-16 flex flex-col sm:flex-row items-center justify-between gap-8">
              <div>
                <h2
                  className="font-black text-white tracking-tight mb-2"
                  style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)' }}
                >
                  Prontos para evoluir{' '}
                  <span style={{ color: 'var(--brand-gold)' }}>juntos?</span>
                </h2>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Fale com a nossa equipe e descubra a solução certa para o seu negócio.
                </p>
              </div>
              <a
                href="/#contato"
                className="flex-shrink-0 inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 hover:opacity-90 hover:-translate-y-px group"
                style={{
                  background: 'var(--brand-gold)',
                  color: '#06112B',
                  boxShadow: '0 6px 20px rgba(196,154,42,0.35)',
                }}
              >
                FALAR COM A DEVELOI
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}
