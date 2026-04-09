import { motion } from 'framer-motion';
import { Quote, Sparkles, Heart } from 'lucide-react';

export default function DreamSection() {
  return (
    <section className="py-16 sm:py-24 md:py-32 relative overflow-hidden">
      {/* Aurora Background */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-[300px] sm:w-[400px] md:w-[500px] h-[300px] sm:h-[400px] md:h-[500px] bg-aurora-pink/10 blur-[100px] sm:blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[300px] sm:w-[400px] md:w-[500px] h-[300px] sm:h-[400px] md:h-[500px] bg-aurora-blue/10 blur-[100px] sm:blur-[120px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-6xl mx-auto glass p-6 sm:p-10 md:p-16 lg:p-24 rounded-[2rem] sm:rounded-[3rem] md:rounded-[4rem] border-white/5 relative overflow-hidden">
          {/* Decorative quote */}
          <div className="absolute top-0 right-0 p-4 sm:p-8 md:p-12 opacity-[0.06] pointer-events-none">
            <Quote className="w-24 h-24 sm:w-40 sm:h-40 md:w-64 md:h-64 text-white rotate-180" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-14 md:gap-16 items-center relative z-10">
            {/* Left content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6 sm:space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] sm:text-xs font-black uppercase tracking-widest text-aurora-pink">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>Transformando Sonhos em Realidade</span>
              </div>

              <h2
                className="font-black tracking-tighter leading-[0.92]"
                style={{ fontSize: 'clamp(2rem, 5.5vw, 4.5rem)' }}
              >
                O Projeto dos Sonhos de{' '}
                <span className="text-gradient">Jefferson Pereira</span>
              </h2>

              <p className="text-base sm:text-lg md:text-xl text-neutral-300 leading-relaxed italic">
                "Sempre sonhei em trabalhar com algo que pudesse ajudar as pessoas. Depois de um bom
                tempo estudando o Mercado Digital, tive a grandiosa ideia de criar essa Plataforma de
                Culinária com Afiliados. Eu falo que foi Deus que me deu essa luz."
              </p>

              <div className="space-y-4">
                <p className="text-neutral-400 text-base sm:text-lg leading-relaxed">
                  A Develoi pegou a visão do Jefferson e a transformou no{' '}
                  <span className="text-white font-bold">Receitas Milionárias</span>. Um ecossistema
                  que une paixão por culinária com empreendedorismo digital.
                </p>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2">
                  <div className="logo-container h-10 sm:h-12 px-2 sm:px-3">
                    <img
                      src="https://receitasmilionarias.com.br/static/images/logo-deitado-escuro.png"
                      alt="Receitas Milionárias"
                      className="max-h-full max-w-[140px] sm:max-w-[180px] object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <a
                    href="https://receitasmilionarias.com.br/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm font-black uppercase tracking-widest text-aurora-blue hover:underline"
                  >
                    Ver Projeto →
                  </a>
                </div>
              </div>

              <div className="pt-5 sm:pt-8 border-t border-white/5">
                <p className="text-[10px] sm:text-sm font-black uppercase tracking-[0.3em] text-neutral-500 mb-1 sm:mb-2">
                  Fundador & Criador
                </p>
                <p className="text-xl sm:text-2xl font-black tracking-tighter">Jefferson Pereira</p>
                <p className="text-aurora-pink font-medium italic text-sm sm:text-base">
                  "Sonhe Para Viver - Viva Para Sonhar"
                </p>
              </div>
            </motion.div>

            {/* Right: photo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative w-full max-w-sm mx-auto lg:max-w-none"
            >
              <div className="absolute inset-0 bg-aurora-pink/20 blur-[80px] sm:blur-[100px] rounded-full -z-10" />
              <div className="aspect-[4/5] rounded-[2rem] sm:rounded-[3rem] overflow-hidden border-2 sm:border-4 border-white/10 shadow-2xl relative group">
                <img
                  src="https://receitasmilionarias.com.br/static/images/jefferson-pereira.png"
                  alt="Jefferson Pereira"
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent opacity-60" />
                <div className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 right-4 sm:right-8">
                  <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-2xl border-white/20">
                    <div className="flex items-center gap-3 sm:gap-4 mb-1 sm:mb-2">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-aurora-pink flex items-center justify-center flex-shrink-0">
                        <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-current" />
                      </div>
                      <span className="font-black text-base sm:text-lg tracking-tighter">5.000+ Vidas Impactadas</span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-neutral-400 uppercase tracking-widest font-bold">
                      Membros ativos na plataforma
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
