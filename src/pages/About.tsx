import { motion } from 'framer-motion';
import { Users, Code2, Rocket, Target, CheckCircle2, ArrowRight } from 'lucide-react';

const values = [
  {
    icon: Users,
    title: 'Colaboração',
    desc: 'Atuamos como parceiros estratégicos do seu negócio, do planejamento à entrega.',
  },
  {
    icon: Code2,
    title: 'Tecnologia',
    desc: 'Stack moderna para garantir performance, segurança e escalabilidade real.',
  },
  {
    icon: Rocket,
    title: 'Resultado',
    desc: 'Cada decisão técnica é tomada pensando no impacto direto no seu negócio.',
  },
  {
    icon: Target,
    title: 'Propósito',
    desc: 'Tecnologia com clareza e visão de futuro, feita para o tamanho do seu negócio.',
  },
];

const differentials = [
  'Sites e landing pages profissionais',
  'Sistemas sob medida para a sua operação',
  'Chatbots e automações inteligentes',
  'Dashboards e plataformas prontas',
  'Integrações com APIs e serviços externos',
  'Suporte contínuo e evolução do produto',
];

export default function About() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-screen overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Background sutil */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div
          className="absolute top-[8%] right-[-6%] w-[500px] h-[500px] rounded-full blur-[130px]"
          style={{ background: 'rgba(13,31,78,0.05)' }}
        />
        <div
          className="absolute bottom-[20%] left-[-4%] w-[400px] h-[400px] rounded-full blur-[120px]"
          style={{ background: 'rgba(196,154,42,0.04)' }}
        />
      </div>

      {/* ── HERO DA PÁGINA ── */}
      <section
        className="relative pt-32 pb-24 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #06112B 0%, #0D1F4E 60%, #0A1840 100%)' }}
      >
        {/* Linha dourada topo */}
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ background: 'linear-gradient(90deg, var(--brand-gold), rgba(196,154,42,0.3) 60%, transparent)' }}
        />
        {/* Foto de fundo com overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1497366216548-37526070297c?w=1400&q=70&fit=crop)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0" style={{ background: 'rgba(6,17,43,0.7)' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="w-6 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
              <span className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--brand-gold)' }}>
                Quem Somos
              </span>
            </div>

            <h1
              className="font-black text-white leading-[1.05] tracking-tight mb-6"
              style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)' }}
            >
              A Develoi cria soluções digitais{' '}
              <span style={{ color: 'var(--brand-gold)' }}>que fazem empresas crescerem.</span>
            </h1>

            <p className="text-lg leading-relaxed max-w-xl" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Nascemos para simplificar e fortalecer o digital das empresas. Criamos soluções que organizam processos, aumentam a presença e geram resultado real — do pequeno negócio à grande empresa.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── MISSÃO + DIFERENCIAIS ── */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Esquerda — texto */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2 mb-5">
                <span className="w-5 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--brand-gold)' }}>
                  Nossa missão
                </span>
              </div>

              <h2
                className="font-black tracking-tight leading-tight mb-6"
                style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', color: 'var(--brand-navy)' }}
              >
                Tecnologia com estratégia,{' '}
                <br className="hidden sm:block" />
                beleza e resultado.
              </h2>

              <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--text-secondary)' }}>
                A Develoi é uma empresa de soluções digitais focada em transformar processos, ideias e desafios em tecnologia simples, bonita e eficiente. Trabalhamos com empresas de todos os tamanhos que querem sair do improviso e crescer com estrutura.
              </p>

              <ul className="space-y-3 mb-10">
                {differentials.map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center gap-3 text-sm font-medium"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--brand-gold)' }} />
                    {item}
                  </motion.li>
                ))}
              </ul>

              <a
                href="/#contato"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-px group"
                style={{ background: 'var(--brand-navy)', boxShadow: '0 4px 16px rgba(13,31,78,0.2)' }}
              >
                Falar com a Develoi
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </motion.div>

            {/* Direita — card visual navy */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="relative"
            >
              <div
                className="rounded-2xl overflow-hidden relative"
                style={{
                  background: 'linear-gradient(135deg, #06112B 0%, #0D1F4E 100%)',
                  boxShadow: '0 24px 64px rgba(13,31,78,0.25)',
                }}
              >
                {/* Foto */}
                <div
                  className="w-full h-64 opacity-20"
                  style={{
                    backgroundImage: 'url(https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=70&fit=crop)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                <div
                  className="absolute top-0 left-0 right-0 h-full"
                  style={{ background: 'linear-gradient(180deg, transparent 30%, #06112B 100%)' }}
                />

                {/* Conteúdo sobre a imagem */}
                <div className="relative px-8 pb-8 -mt-16">
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-[10px] font-bold uppercase tracking-[0.18em]"
                    style={{ background: 'rgba(196,154,42,0.15)', color: 'var(--brand-gold)', border: '1px solid rgba(196,154,42,0.25)' }}
                  >
                    Develoi — Desde 2022
                  </div>

                  <h3 className="text-2xl font-black text-white mb-2 tracking-tight">
                    Do planejamento à entrega
                  </h3>
                  <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    Acompanhamos seu projeto do início ao fim, com comunicação clara e foco em resultado.
                  </p>

                  {/* Mini métricas */}
                  <div className="grid grid-cols-3 gap-4 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    {[
                      { v: '+50', l: 'Projetos' },
                      { v: '98%', l: 'Satisfação' },
                      { v: '+40%', l: 'Crescimento' },
                    ].map((m) => (
                      <div key={m.l} className="text-center">
                        <div className="text-xl font-black" style={{ color: 'var(--brand-gold)' }}>{m.v}</div>
                        <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{m.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Detalhe decorativo */}
              <div
                className="absolute -bottom-4 -right-4 w-32 h-32 rounded-2xl -z-10"
                style={{ background: 'var(--brand-gold-pale)', border: '2px solid rgba(196,154,42,0.2)' }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 4 PILARES ── */}
      <section className="py-16 md:py-20" style={{ background: 'var(--bg-tertiary)' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="w-5 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--brand-gold)' }}>
                O que nos move
              </span>
              <span className="w-5 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
            </div>
            <h2
              className="font-black tracking-tight"
              style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', color: 'var(--brand-navy)' }}
            >
              Os pilares da Develoi
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="bg-white rounded-2xl p-6 border group transition-all duration-250 hover:-translate-y-1"
                style={{
                  borderColor: 'var(--border-color)',
                  boxShadow: '0 2px 12px rgba(13,31,78,0.05)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,154,42,0.35)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(13,31,78,0.1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(13,31,78,0.05)';
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'var(--bg-tertiary)' }}
                >
                  <item.icon className="w-5 h-5" style={{ color: 'var(--brand-navy)' }} />
                </div>
                <h3 className="font-black text-base mb-2" style={{ color: 'var(--brand-navy)' }}>
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-20 md:py-24">
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
            {/* Linha dourada topo */}
            <div
              className="absolute top-0 left-0 right-0 h-[3px]"
              style={{ background: 'linear-gradient(90deg, var(--brand-gold), rgba(196,154,42,0.2) 70%, transparent)' }}
            />

            <div className="relative z-10 px-8 sm:px-16 py-14 sm:py-16 flex flex-col sm:flex-row items-center justify-between gap-8">
              <div>
                <h2
                  className="font-black text-white tracking-tight mb-2"
                  style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)' }}
                >
                  Pronto para transformar{' '}
                  <span style={{ color: 'var(--brand-gold)' }}>seu negócio?</span>
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.55)' }} className="text-sm">
                  Fale com a nossa equipe e descubra a solução certa para você.
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
