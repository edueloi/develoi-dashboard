import { motion } from 'framer-motion';
import { ArrowRight, Star, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const featuredCases = [
  {
    title: "MecaERP",
    category: "Gestão Automotiva",
    impact: "+40% de eficiência operacional",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800",
    color: "from-blue-600 to-indigo-600"
  },
  {
    title: "PsiFlux",
    category: "Saúde Digital",
    impact: "Redução de 60% em faltas",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800",
    color: "from-indigo-600 to-violet-600"
  },
  {
    title: "Agendelle",
    category: "Beleza & Bem-estar",
    impact: "10k+ agendamentos mensais",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=800",
    color: "from-violet-600 to-purple-600"
  }
];

export default function CasesPreviewSection() {
  return (
    <section className="relative py-24 sm:py-32 dash-bg overflow-hidden">
      {/* Decorative Blur */}
      <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-indigo-500/[0.03] blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-6"
            >
              <Star className="w-3 h-3 fill-indigo-600" />
              Histórias de Sucesso
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-6xl font-black dash-text tracking-tighter"
            >
              Resultados que falam por <span className="text-gradient">si mesmos.</span>
            </motion.h2>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Link 
              to="/cases" 
              className="group flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
            >
              VER TODOS OS CASES
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredCases.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group relative h-[450px] sm:h-[500px] rounded-[2.5rem] overflow-hidden border dash-border shadow-sm hover:shadow-2xl transition-all duration-700"
            >
              {/* Image */}
              <img 
                src={item.image} 
                alt={item.title} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
              
              {/* Content */}
              <div className="absolute inset-0 p-8 sm:p-10 flex flex-col justify-end text-white">
                <div className="mb-4">
                  <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {item.category}
                  </span>
                </div>
                <h3 className="text-3xl sm:text-4xl font-black mb-2 tracking-tighter">
                  {item.title}
                </h3>
                <p className="text-indigo-400 font-bold mb-6 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  {item.impact}
                </p>
                <Link 
                  to="/cases" 
                  className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest group-hover:gap-4 transition-all"
                >
                  CONHECER CASE
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
