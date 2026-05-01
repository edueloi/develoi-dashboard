import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Folder, Sparkles, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Case {
  id: string; title: string; slug: string; client: string; excerpt?: string;
  coverImage?: string; featured: boolean; results?: string;
  category?: { id: string; name: string; slug: string; color: string };
}

export default function CasesPreviewSection() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/cases/featured')
      .then(r => r.ok ? r.json() : [])
      .then(data => { setCases(Array.isArray(data) ? data.slice(0, 3) : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <section className="py-24 flex items-center justify-center min-h-[320px]" style={{ background: 'var(--bg-tertiary)' }}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand-gold)' }} />
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Carregando projetos...</p>
      </div>
    </section>
  );

  return (
    <section className="relative py-20 md:py-28 overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">

        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="w-5 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--brand-gold)' }}>Nossos projetos</span>
            </div>
            <h2 className="font-black tracking-tight" style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', color: 'var(--brand-navy)' }}>
              Resultados que falam por si mesmos.
            </h2>
          </div>
          {cases.length > 0 && (
            <Link to="/projetos" className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 hover:-translate-y-px group"
              style={{ background: 'var(--brand-navy)', boxShadow: '0 4px 16px rgba(13,31,78,0.2)' }}>
              Ver todos os projetos <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>

        {cases.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-white rounded-2xl p-14 text-center border" style={{ borderColor: 'var(--border-color)' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'var(--bg-tertiary)' }}>
              <Sparkles className="w-7 h-7" style={{ color: 'var(--brand-gold)' }} />
            </div>
            <h3 className="font-black text-base mb-2 tracking-tight" style={{ color: 'var(--brand-navy)' }}>Em breve: Novas histórias de sucesso.</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Estamos finalizando projetos incríveis que em breve estarão aqui.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {cases.map((item, idx) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}>
                <Link to={`/projetos/${item.slug}`} className="group block">
                  <div className="relative h-[380px] rounded-2xl overflow-hidden border transition-all duration-300"
                    style={{ borderColor: 'var(--border-color)', boxShadow: '0 4px 20px rgba(13,31,78,0.08)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,154,42,0.4)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(13,31,78,0.15)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(13,31,78,0.08)'; }}
                  >
                    {item.coverImage
                      ? <img src={item.coverImage} alt={item.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      : <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#06112B,#0D1F4E)' }}>
                          <Folder className="w-16 h-16" style={{ color: 'rgba(196,154,42,0.2)' }} />
                        </div>
                    }
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                    {item.category && (
                      <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-[9px] font-black text-white backdrop-blur-sm" style={{ background: item.category.color + 'cc' }}>
                        {item.category.name}
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--brand-gold)' }}>{item.client}</p>
                      <h3 className="font-black text-white text-lg leading-snug tracking-tight mb-3">{item.title}</h3>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/70 group-hover:gap-3 transition-all">
                        Conhecer projeto <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
