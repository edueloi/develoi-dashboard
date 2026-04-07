import { motion } from 'framer-motion';
import { Quote, Sparkles, Heart } from 'lucide-react';

export default function DreamSection() {
  return (
    <section className="py-32 relative overflow-hidden">
      {/* Aurora Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-aurora-pink/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-aurora-blue/10 blur-[120px] rounded-full" />
      </div>

      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto glass p-12 md:p-24 rounded-[4rem] border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <Quote className="w-64 h-64 text-white rotate-180" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-aurora-pink">
                <Sparkles className="w-4 h-4" />
                <span>Transformando Sonhos em Realidade</span>
              </div>

              <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
                O Projeto dos Sonhos de <span className="text-gradient">Jefferson Pereira</span>
              </h2>

              <p className="text-xl text-neutral-300 leading-relaxed italic">
                "Sempre sonhei em trabalhar com algo que pudesse ajudar as pessoas. Depois de um bom tempo estudando o Mercado Digital, tive a grandiosa ideia de criar essa Plataforma de Culinária com Afiliados. Eu falo que foi Deus que me deu essa luz."
              </p>

              <div className="space-y-4">
                <p className="text-neutral-400 text-lg">
                  A Develoi pegou a visão do Jefferson e a transformou no <span className="text-white font-bold">Receitas Milionárias</span>. Um ecossistema que une paixão por culinária com empreendedorismo digital.
                </p>
                <div className="flex items-center gap-4 pt-4">
                  <div className="logo-container w-48 h-12">
                    <img src="https://receitasmilionarias.com.br/static/images/logo-deitado-escuro.png" alt="Receitas Milionárias" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <a
                    href="https://receitasmilionarias.com.br/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-black uppercase tracking-widest text-aurora-blue hover:underline"
                  >
                    Ver Projeto →
                  </a>
                </div>
              </div>

              <div className="pt-8 border-t border-white/5">
                <p className="text-sm font-black uppercase tracking-[0.3em] text-neutral-500 mb-2">Fundador & Criador</p>
                <p className="text-2xl font-black tracking-tighter">Jefferson Pereira</p>
                <p className="text-aurora-pink font-medium italic">"Sonhe Para Viver - Viva Para Sonhar"</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 bg-aurora-pink/20 blur-[100px] rounded-full -z-10" />
              <div className="aspect-[4/5] rounded-[3rem] overflow-hidden border-4 border-white/10 shadow-2xl relative group">
                <img
                  src="https://receitasmilionarias.com.br/static/images/jefferson-pereira.png"
                  alt="Jefferson Pereira"
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent opacity-60" />
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="glass p-6 rounded-2xl border-white/20">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-10 h-10 rounded-full bg-aurora-pink flex items-center justify-center">
                        <Heart className="w-5 h-5 text-white fill-current" />
                      </div>
                      <span className="font-black text-lg tracking-tighter">5.000+ Vidas Impactadas</span>
                    </div>
                    <p className="text-xs text-neutral-400 uppercase tracking-widest font-bold">Membros ativos na plataforma</p>
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
