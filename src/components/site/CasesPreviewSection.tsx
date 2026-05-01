import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Star, ExternalLink, Loader2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Case {
  id: string;
  title: string;
  slug: string;
  client: string;
  excerpt?: string;
  coverImage?: string;
  featured: boolean;
  results?: string;
  category?: { id: string; name: string; slug: string; color: string };
}

export default function CasesPreviewSection() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await fetch('/api/cases/featured');
        if (res.ok) {
          const data = await res.json();
          setCases(Array.isArray(data) ? data.slice(0, 3) : []);
        }
      } catch (err) {
        console.error("Erro ao carregar projetos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  if (loading) {
    return (
      <section className="relative py-24 sm:py-32 dash-bg overflow-hidden flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Carregando projetos...</p>
        </div>
      </section>
    );
  }

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
              Nossos Projetos
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
          
          {cases.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <Link 
                to="/projetos" 
                className="group flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
              >
                VER TODOS OS PROJETOS
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          )}
        </div>

        {cases.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-16 rounded-[3rem] dash-surface border dash-border text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl" />
            <Sparkles className="w-12 h-12 text-indigo-500/20 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-white/40 mb-4 tracking-tight uppercase">Em breve: Novas histórias de sucesso.</h3>
            <p className="text-sm text-white/20 max-w-lg mx-auto font-medium">Estamos finalizando projetos incríveis que em breve estarão expostos aqui em nosso hall da fama.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {cases.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group relative h-[450px] sm:h-[500px] rounded-[2.5rem] overflow-hidden border dash-border shadow-sm hover:shadow-2xl transition-all duration-700"
                >
                  {/* Image */}
                  {item.coverImage ? (
                    <img 
                      src={item.coverImage} 
                      alt={item.title} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 to-violet-900/50 flex items-center justify-center">
                      <Star className="w-16 h-16 text-indigo-500/20" />
                    </div>
                  )}
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                  
                  {/* Content */}
                  <div className="absolute inset-0 p-8 sm:p-10 flex flex-col justify-end text-white">
                    <div className="mb-4">
                      {item.category && (
                        <span 
                          className="px-3 py-1 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-xl"
                          style={{ backgroundColor: item.category.color + '40', borderColor: item.category.color + '60' }}
                        >
                          {item.category.name}
                        </span>
                      )}
                    </div>
                    <h3 className="text-3xl sm:text-4xl font-black mb-2 tracking-tighter">
                      {item.title}
                    </h3>
                    {item.results && (
                      <p className="text-indigo-400 font-bold mb-6 flex items-center gap-2 line-clamp-1">
                        <ExternalLink className="w-4 h-4" />
                        {item.results.split('\n')[0]}
                      </p>
                    )}
                    <Link 
                      to={`/projetos/${item.slug}`} 
                      className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest group-hover:gap-4 transition-all"
                    >
                      CONHECER PROJETO
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}
