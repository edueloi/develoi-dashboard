import { motion } from 'framer-motion';
import { Users, Code, Rocket, Heart } from 'lucide-react';

const team = [
  {
    name: "Especialistas Develoi",
    role: "Nossa Equipe",
    image: "https://picsum.photos/seed/develoi-team/400/400",
    bio: "Um coletivo de designers, desenvolvedores e estrategistas focados em excelência absoluta e resultados reais."
  },
  {
    name: "Tecnologia & Inovação",
    role: "Nossa Essência",
    image: "https://picsum.photos/seed/tech/400/400",
    bio: "Utilizamos as stacks mais modernas do mercado para garantir performance, segurança e escalabilidade."
  }
];

export default function About() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-screen pt-32 pb-20 overflow-hidden"
    >
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[10%] left-[-5%] w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[20%] right-[-5%] w-[600px] h-[600px] bg-purple-500/10 blur-[150px] rounded-full animate-float-slow" />
        <div className="absolute inset-0 noise-overlay opacity-[0.08]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Quem Somos */}
        <div className="max-w-4xl mx-auto text-center mb-40">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full dash-surface-2 border dash-border mb-8 shadow-xl"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">Nossa Essência</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black mb-10 leading-[0.9] tracking-tighter dash-text"
          >
            QUEM <span className="text-gradient-animated">SOMOS.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-3xl dash-text-2 leading-relaxed font-medium opacity-80"
          >
            A Develoi nasceu para simplificar e fortalecer o digital das empresas. Criamos soluções que organizam processos, aumentam a presença e geram resultado real.
          </motion.p>
        </div>

        {/* Nossa História/Equipe */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-40">
          <div className="space-y-12">
            <div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter dash-text mb-6">Nossa <span className="text-gradient">Equipe.</span></h2>
              <p className="dash-text-2 text-lg md:text-xl leading-relaxed font-medium opacity-70">
                Selecionamos os melhores talentos para garantir que cada pixel e cada linha de código entreguem o máximo de valor. Excelência não é um ato, é um hábito.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="dash-surface-2 border dash-border p-8 rounded-[2rem] shadow-2xl group hover:-translate-y-2 transition-all duration-500">
                <Users className="w-10 h-10 text-indigo-500 mb-6 group-hover:scale-110 transition-transform" />
                <h4 className="font-black text-2xl mb-2 dash-text">Colaboração</h4>
                <p className="text-sm dash-text-2 font-medium opacity-70">Atuamos como parceiros estratégicos do seu negócio.</p>
              </div>
              <div className="dash-surface-2 border dash-border p-8 rounded-[2rem] shadow-2xl group hover:-translate-y-2 transition-all duration-500">
                <Code className="w-10 h-10 text-violet-500 mb-6 group-hover:scale-110 transition-transform" />
                <h4 className="font-black text-2xl mb-2 dash-text">Tecnologia</h4>
                <p className="text-sm dash-text-2 font-medium opacity-70">Stack moderna para performance e escala absoluta.</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="dash-surface border dash-border p-8 rounded-[3rem] text-center group shadow-2xl hover:shadow-indigo-500/10 transition-all duration-700"
              >
                <div className="w-32 h-32 mx-auto mb-8 rounded-[2.5rem] overflow-hidden border-2 dash-border group-hover:border-indigo-500 group-hover:rotate-6 transition-all duration-500">
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <h3 className="text-2xl font-black mb-2 dash-text tracking-tight">{member.name}</h3>
                <p className="text-indigo-600 text-xs font-black uppercase tracking-[0.2em] mb-4">{member.role}</p>
                <p className="dash-text-2 text-sm leading-relaxed opacity-70">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Success Case */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative group"
        >
          <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-[4rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="dash-surface border dash-border p-8 sm:p-16 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 mb-6 block">Case em Destaque</span>
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-8 leading-tight dash-text">Receitas <span className="text-gradient">Milionárias.</span></h2>
                <p className="dash-text-2 text-lg md:text-xl leading-relaxed mb-10 font-medium opacity-80">
                  Construímos um ecossistema digital completo que transformou uma visão em um negócio de alta escala. O projeto Receitas Milionárias é o benchmark de como a Develoi entrega resultados exponenciais.
                </p>
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-indigo-500 shadow-xl">
                    <img src="https://receitasmilionarias.com.br/static/images/jefferson-pereira.png" alt="Jefferson Pereira" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <h4 className="font-black dash-text text-xl tracking-tight">Jefferson Pereira</h4>
                    <p className="dash-text-2 text-sm font-bold opacity-60 uppercase tracking-widest">Founder & Client</p>
                  </div>
                </div>
              </div>
              
              <div className="relative aspect-video rounded-[2.5rem] overflow-hidden bg-zinc-900 border border-white/5 shadow-3xl group/video">
                <img src="https://receitasmilionarias.com.br/static/images/logo.png" alt="Receitas Milionárias" className="w-48 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 opacity-40 group-hover/video:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/40 to-transparent" />
                <div className="absolute inset-0 shimmer opacity-[0.05]" />
                <div className="absolute bottom-10 left-10 right-10 z-20">
                  <blockquote className="text-white text-lg md:text-xl font-bold italic leading-relaxed">
                    "A Develoi superou todas as minhas expectativas. Não entregaram apenas código, entregaram o futuro do meu negócio."
                  </blockquote>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
