import { motion } from 'framer-motion';
import { ExternalLink, CheckCircle2, Shield, Zap, Users, BarChart3, Bot } from 'lucide-react';

const solutions = [
  {
    title: "PsiFlux",
    subtitle: "Sistema completo para saúde mental",
    description: "Agenda, prontuário, teleconsulta, financeiro e IA — tudo em uma plataforma criada para psicólogos e clínicas de saúde mental.",
    logo: "https://psiflux.com.br/assets/logo-psiflux-AdcS1aCJ.png",
    url: "https://psiflux.com.br/",
    features: ["Agenda Inteligente", "Teleconsulta & IA", "LGPD Compliant", "Prontuário Digital"],
    stats: ["2.000+ Profissionais", "98% Satisfação", "150+ Clínicas"],
    color: "from-blue-500 to-cyan-400"
  },
  {
    title: "MecaERP",
    subtitle: "O ecossistema definitivo de gestão automotiva",
    description: "Mais de 500 donos de oficinas já pararam de perder dinheiro com peças não cobradas e orçamentos esquecidos.",
    logo: "https://mecaerp.com.br/assets/logo-mecaerp-CbIDGmjk.png",
    url: "https://mecaerp.com.br/",
    features: ["OS Inteligente", "Financeiro & Lucro Real", "Automação WhatsApp", "Checklist Digital HD"],
    stats: ["500+ Oficinas", "+35% Lucro Médio", "Integração SEFAZ"],
    color: "from-orange-500 to-red-500"
  },
  {
    title: "Agendelle",
    subtitle: "A agenda elegante para o seu negócio de beleza",
    description: "Une organização inteligente com elegância — o sistema perfeito para salões e barbearias que querem crescer.",
    logo: "https://agendelle.com.br/assets/imagem-agendele-a9t6taIM.png",
    url: "https://agendelle.com.br/",
    features: ["Agendamento Online 24/7", "Lembretes Automáticos", "Gestão de Equipe", "IA de Atendimento"],
    stats: ["2.800+ Negócios", "1,2M+ Agendamentos", "+40% Receita"],
    color: "from-purple-500 to-pink-500"
  },
  {
    title: "Receitas Milionárias",
    subtitle: "Plataforma de Infoprodutos e Culinária",
    description: "O ecossistema digital completo para o Jefferson Pereira, transformando o mercado de receitas em um negócio de alta escala.",
    logo: "https://receitasmilionarias.com.br/static/images/logo.png",
    url: "https://receitasmilionarias.com.br/",
    features: ["Área de Membros", "Checkout Integrado", "Gestão de Conteúdo", "Escalabilidade"],
    stats: ["Case de Sucesso", "Alta Conversão", "Design Exclusivo"],
    color: "from-green-500 to-emerald-400"
  }
];

export default function Projects() {
  return (
    <section id="projetos" className="py-32 relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center mb-24">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-black mb-6 tracking-tighter"
          >
            Nossas <span className="text-gradient">Soluções</span> de Elite
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-neutral-400 max-w-3xl mx-auto text-xl"
          >
            Desenvolvemos ecossistemas completos que transformam indústrias inteiras. Tecnologia de ponta para resultados reais.
          </motion.p>
        </div>

        <div className="space-y-32">
          {solutions.map((solution, index) => (
            <motion.div
              key={solution.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-16 items-center`}
            >
              {/* Content */}
              <div className="flex-1 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="logo-container w-48 h-16">
                    <img src={solution.logo} alt={solution.title} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <div className={`h-1 w-24 bg-gradient-to-r ${solution.color} rounded-full`} />
                </div>
                
                <h3 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                  {solution.subtitle}
                </h3>
                
                <p className="text-neutral-400 text-lg leading-relaxed">
                  {solution.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {solution.features.map(feature => (
                    <div key={feature} className="flex items-center gap-2 text-neutral-300">
                      <CheckCircle2 className="w-5 h-5 text-aurora-green" />
                      <span className="font-medium">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-6 pt-4">
                  {solution.stats.map(stat => (
                    <div key={stat} className="px-4 py-2 bg-white/[0.03] border border-white/5 rounded-2xl">
                      <span className="text-sm font-black text-white">{stat}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-8">
                  <a
                    href={solution.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r ${solution.color} text-white font-black rounded-2xl shadow-xl hover:scale-105 transition-transform`}
                  >
                    Explorar {solution.title} <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
              </div>

              {/* Visual Mockup Placeholder */}
              <div className="flex-1 w-full aspect-video relative group">
                <div className={`absolute inset-0 bg-gradient-to-br ${solution.color} opacity-20 blur-[80px] group-hover:opacity-30 transition-opacity`} />
                <div className="relative h-full w-full glass rounded-[3rem] overflow-hidden border-white/10 flex items-center justify-center">
                  <div className="text-center p-12">
                    <img src={solution.logo} alt={solution.title} className="w-64 mx-auto mb-8 brightness-0 invert opacity-20" referrerPolicy="no-referrer" />
                    <p className="text-neutral-500 font-mono text-sm uppercase tracking-widest">Interface de Alta Performance</p>
                  </div>
                  {/* Floating elements for visual interest */}
                  <motion.div
                    animate={{ y: [0, -20, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-10 right-10 p-4 glass rounded-2xl border-white/20"
                  >
                    <Zap className="w-6 h-6 text-yellow-400" />
                  </motion.div>
                  <motion.div
                    animate={{ y: [0, 20, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-10 left-10 p-4 glass rounded-2xl border-white/20"
                  >
                    <Shield className="w-6 h-6 text-aurora-blue" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
