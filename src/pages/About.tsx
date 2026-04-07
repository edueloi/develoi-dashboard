import { motion } from 'framer-motion';
import { Users, Code, Rocket, Heart } from 'lucide-react';

const team = [
  {
    name: "Especialistas Develoi",
    role: "Time de Elite",
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
      className="pt-32 pb-20"
    >
      <div className="container mx-auto px-6">
        {/* Quem Somos */}
        <div className="max-w-4xl mx-auto text-center mb-32">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black mb-8 tracking-tighter"
          >
            QUEM <span className="text-gradient">SOMOS</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-neutral-400 leading-relaxed"
          >
            A Develoi nasceu da necessidade de elevar o padrão do desenvolvimento digital. Não somos apenas uma agência; somos o motor de inovação que impulsiona negócios para o futuro.
          </motion.p>
        </div>

        {/* Nossa História/Equipe */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
          <div className="space-y-8">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter">Nossa <span className="text-gradient">Equipe</span></h2>
            <p className="text-neutral-400 text-lg leading-relaxed">
              Contamos com um time de elite, selecionado a dedo para garantir que cada pixel e cada linha de código entreguem o máximo de valor. Nossa cultura é baseada em excelência, transparência e resultados extraordinários.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="glass p-6 rounded-2xl border-white/5">
                <Users className="w-8 h-8 text-aurora-blue mb-4" />
                <h4 className="font-black text-xl mb-2">Colaboração</h4>
                <p className="text-sm text-neutral-500">Trabalhamos como uma extensão do seu time.</p>
              </div>
              <div className="glass p-6 rounded-2xl border-white/5">
                <Code className="w-8 h-8 text-aurora-purple mb-4" />
                <h4 className="font-black text-xl mb-2">Tecnologia</h4>
                <p className="text-sm text-neutral-500">Stack moderna para performance absoluta.</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6 rounded-[2.5rem] text-center group"
              >
                <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-aurora-blue transition-all">
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <h3 className="text-xl font-black mb-1">{member.name}</h3>
                <p className="text-aurora-blue text-sm font-bold uppercase tracking-widest mb-4">{member.role}</p>
                <p className="text-neutral-500 text-sm">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Case de Sucesso */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass-card p-12 rounded-[3rem] border-white/5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-aurora-blue/10 blur-[100px]" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-aurora-blue font-black uppercase tracking-[0.3em] text-sm mb-4 block">Case de Sucesso</span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6">Receitas <span className="text-gradient">Milionárias</span></h2>
              <p className="text-neutral-400 text-lg leading-relaxed mb-8">
                Construímos para o nosso cliente <span className="text-white font-bold">Jefferson Pereira</span> um ecossistema digital completo que transformou sua visão em um negócio de alta escala. O projeto Receitas Milionárias é um exemplo de como a Develoi entrega soluções que geram impacto real.
              </p>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-aurora-blue">
                  <img src="https://receitasmilionarias.com.br/static/images/jefferson-pereira.png" alt="Jefferson Pereira" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h4 className="font-black text-white">Jefferson Pereira</h4>
                  <p className="text-neutral-500 text-sm">Cliente Develoi</p>
                </div>
              </div>
            </div>
            <div className="relative aspect-video rounded-3xl overflow-hidden glass border-white/10 flex items-center justify-center">
              <img src="https://receitasmilionarias.com.br/static/images/logo.png" alt="Receitas Milionárias" className="w-48 opacity-50" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-8 left-8 right-8">
                <p className="text-white font-medium italic">"A Develoi superou todas as minhas expectativas na construção do Receitas Milionárias."</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
