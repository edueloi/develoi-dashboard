import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Search, Eye, Heart, Clock, Star, Filter, Folder, ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Case {
  id: string;
  title: string;
  slug: string;
  client: string;
  excerpt?: string;
  coverImage?: string;
  featured: boolean;
  tags?: string;
  views: number;
  likes: number;
  readTimeMinutes: number;
  publishedAt?: string;
  segment?: string;
  services?: string;
  category?: { id: string; name: string; slug: string; color: string };
}

interface CaseCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
  _count?: { cases: number };
}

function parseTags(tags?: string): string[] {
  if (!tags) return [];
  try { return JSON.parse(tags); } catch { return []; }
}

// ─── Draggable Featured Slider ─────────────────────────────────────────────

function FeaturedSlider({ featured }: { featured: Case[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [imageLoaded, setImageLoaded] = useState<Record<string, boolean>>({});
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const count = featured.length;

  const goTo = useCallback((idx: number) => {
    setCurrent(((idx % count) + count) % count);
    setDragOffset(0);
  }, [count]);

  const prev = () => goTo(current - 1);
  const next = () => goTo(current + 1);

  useEffect(() => {
    if (count < 2) return;
    autoRef.current = setInterval(() => {
      setCurrent(c => ((c + 1) % count));
    }, 5000);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [count, current]);

  const stopAuto = () => { if (autoRef.current) clearInterval(autoRef.current); };

  const onPointerDown = (e: React.PointerEvent) => {
    stopAuto();
    setDragging(true);
    setDragStartX(e.clientX);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setDragOffset(e.clientX - dragStartX);
  };
  const onPointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    if (Math.abs(dragOffset) > 60) {
      dragOffset < 0 ? next() : prev();
    } else {
      setDragOffset(0);
    }
  };

  if (!count) return null;

  const c = featured[current];

  return (
    <div className="relative select-none overflow-hidden rounded-2xl" style={{ boxShadow: '0 24px 80px rgba(6,17,43,0.18)' }}>
      {/* Track arrastável */}
      <div
        ref={trackRef}
        className="cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'pan-y' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: dragOffset < 0 ? 60 : -60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dragOffset < 0 ? -60 : 60 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 lg:grid-cols-2 min-h-[460px]"
            style={{ background: 'white', borderRadius: '16px', overflow: 'hidden' }}
          >
            {/* Image */}
            <div className="relative overflow-hidden min-h-[280px] lg:min-h-full">
              {c.coverImage ? (
                <>
                  {!imageLoaded[c.id] && (
                    <div className="absolute inset-0 animate-pulse" style={{ background: 'linear-gradient(135deg, #06112B, #0D1F4E)' }} />
                  )}
                  <img
                    src={c.coverImage}
                    alt={c.title}
                    className="w-full h-full object-cover"
                    style={{ opacity: imageLoaded[c.id] ? 1 : 0, transition: 'opacity 0.4s ease' }}
                    onLoad={() => setImageLoaded(prev => ({ ...prev, [c.id]: true }))}
                    draggable={false}
                  />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #06112B 0%, #0D1F4E 100%)' }}>
                  <Folder className="w-20 h-20" style={{ color: 'rgba(196,154,42,0.2)' }} />
                </div>
              )}
              {/* Overlay gradient */}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, transparent 60%, rgba(255,255,255,0.08))' }} />

              {/* Badge destaque */}
              <div className="absolute top-6 left-6 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black" style={{ background: 'var(--brand-gold)', color: '#06112B' }}>
                <Star className="w-3 h-3" /> PROJETO EM DESTAQUE
              </div>

              {/* Indicadores de posição */}
              {count > 1 && (
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                  {featured.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); stopAuto(); goTo(i); }}
                      className="rounded-full transition-all duration-300"
                      style={{
                        width: i === current ? '24px' : '6px',
                        height: '6px',
                        background: i === current ? 'var(--brand-gold)' : 'rgba(255,255,255,0.4)',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-8 sm:p-12 flex flex-col justify-center relative">
              {/* Barra lateral dourada */}
              <div className="absolute top-0 left-0 bottom-0 w-[3px] hidden lg:block" style={{ background: 'linear-gradient(180deg, var(--brand-gold), rgba(196,154,42,0.05))' }} />

              {c.category && (
                <span
                  className="inline-block px-3 py-1 rounded-full text-[10px] font-black mb-5 w-fit"
                  style={{ background: c.category.color + '18', color: c.category.color, border: `1px solid ${c.category.color}35` }}
                >
                  {c.category.name}
                </span>
              )}

              <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-3" style={{ color: 'var(--brand-gold)' }}>{c.client}</p>
              <h2
                className="font-black leading-tight tracking-tight mb-5"
                style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', color: 'var(--brand-navy)' }}
              >
                {c.title}
              </h2>

              {c.excerpt && (
                <p className="text-sm leading-relaxed mb-6 line-clamp-3" style={{ color: 'var(--text-secondary)' }}>{c.excerpt}</p>
              )}

              <div className="flex items-center gap-5 text-[10px] font-bold uppercase tracking-widest mb-8" style={{ color: 'var(--text-muted)' }}>
                <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" style={{ color: 'var(--brand-navy)' }} /> {c.views} views</span>
                <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" style={{ color: '#e11d48' }} /> {c.likes}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" style={{ color: 'var(--brand-gold)' }} /> {c.readTimeMinutes} min</span>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to={`/projetos/${c.slug}`}
                  onClick={e => dragging && e.preventDefault()}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-px group"
                  style={{ background: 'var(--brand-navy)', boxShadow: '0 4px 16px rgba(13,31,78,0.2)' }}
                >
                  Ver Projeto <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                {/* Controles prev/next */}
                {count > 1 && (
                  <div className="flex items-center gap-1.5 ml-auto">
                    <button
                      onClick={(e) => { e.stopPropagation(); stopAuto(); prev(); }}
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:-translate-x-0.5"
                      style={{ background: 'var(--bg-tertiary, #f4f6fa)', color: 'var(--brand-navy)' }}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); stopAuto(); next(); }}
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:translate-x-0.5"
                      style={{ background: 'var(--bg-tertiary, #f4f6fa)', color: 'var(--brand-navy)' }}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Hint de arrastar */}
              {count > 1 && (
                <p className="text-[10px] font-medium mt-4 opacity-30 flex items-center gap-1" style={{ color: 'var(--brand-navy)' }}>
                  ← Arraste para navegar →
                </p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function CaseCard({ c, index }: { c: Case; index: number }) {
  const tags = parseTags(c.tags);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.07 }}
    >
      <Link to={`/projetos/${c.slug}`} className="group block h-full">
        <div
          className="bg-white rounded-2xl border overflow-hidden h-full flex flex-col transition-all duration-250 hover:-translate-y-1"
          style={{ borderColor: 'var(--border-color)', boxShadow: '0 2px 12px rgba(13,31,78,0.05)' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,154,42,0.35)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(13,31,78,0.1)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(13,31,78,0.05)';
          }}
        >
          {/* Cover */}
          <div className="relative overflow-hidden h-52">
            {c.coverImage ? (
              <img src={c.coverImage} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #06112B 0%, #0D1F4E 100%)' }}>
                <Folder className="w-12 h-12" style={{ color: 'rgba(196,154,42,0.4)' }} />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

            {c.featured && (
              <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black" style={{ background: 'var(--brand-gold)', color: '#06112B' }}>
                <Star className="w-3 h-3" /> DESTAQUE
              </div>
            )}

            {c.category && (
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-black text-white backdrop-blur-sm" style={{ background: c.category.color + 'cc' }}>
                {c.category.name}
              </div>
            )}

            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[10px] text-white/80 font-bold uppercase tracking-widest">
                  <Eye className="w-3 h-3" /> {c.views}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-white/80 font-bold uppercase tracking-widest">
                  <Heart className="w-3 h-3" /> {c.likes}
                </span>
              </div>
              <span className="flex items-center gap-1 text-[10px] text-white/80 font-bold uppercase tracking-widest">
                <Clock className="w-3 h-3" /> {c.readTimeMinutes} min
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 flex flex-col flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--brand-gold)' }}>{c.client}</p>
            <h3 className="font-black text-base leading-snug mb-3 line-clamp-2 tracking-tight group-hover:opacity-80 transition-opacity" style={{ color: 'var(--brand-navy)' }}>
              {c.title}
            </h3>
            {c.excerpt && (
              <p className="text-sm leading-relaxed mb-4 line-clamp-3 flex-1" style={{ color: 'var(--text-secondary)' }}>{c.excerpt}</p>
            )}

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {tags.slice(0, 3).map((tag, i) => (
                  <span key={i} className="text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between mt-auto pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
              {c.publishedAt && (
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  {format(new Date(c.publishedAt), "d MMM yyyy", { locale: ptBR })}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest ml-auto group-hover:gap-2.5 transition-all" style={{ color: 'var(--brand-navy)' }}>
                Ver projeto <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function ProjetosPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cases, setCases] = useState<Case[]>([]);
  const [featured, setFeatured] = useState<Case[]>([]);
  const [categories, setCategories] = useState<CaseCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/cases/featured').then(r => r.json()).then(setFeatured).catch(console.error);
    fetch('/api/cases-categories').then(r => r.json()).then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    const catFromUrl = searchParams.get('category') || '';
    setCategoryFilter(catFromUrl);
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '9' });
    if (categoryFilter) params.set('category', categoryFilter);
    if (search) params.set('search', search);
    fetch(`/api/cases?${params}`)
      .then(r => r.json())
      .then(data => { setCases(data.cases || []); setTotal(data.pagination?.total || 0); setLoading(false); })
      .catch(() => setLoading(false));
  }, [page, categoryFilter, search]);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  const totalPages = Math.ceil(total / 9);

  const handleCategoryFilter = (slug: string) => {
    if (slug) {
      setSearchParams({ category: slug });
    } else {
      setSearchParams({});
    }
    setPage(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-screen overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Background blurs */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[8%] right-[-6%] w-[500px] h-[500px] rounded-full blur-[130px]" style={{ background: 'rgba(13,31,78,0.05)' }} />
        <div className="absolute bottom-[20%] left-[-4%] w-[400px] h-[400px] rounded-full blur-[120px]" style={{ background: 'rgba(196,154,42,0.04)' }} />
      </div>

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-24 overflow-hidden" style={{ background: 'linear-gradient(135deg, #06112B 0%, #0D1F4E 60%, #0A1840 100%)' }}>
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, var(--brand-gold), rgba(196,154,42,0.3) 60%, transparent)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />

        {/* Decorative dots */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, rgba(196,154,42,0.8) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="w-6 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
              <span className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--brand-gold)' }}>
                Nossos Projetos
              </span>
            </div>

            <h1 className="font-black text-white leading-[1.05] tracking-tight mb-6" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)' }}>
              Resultados reais,{' '}
              <span style={{ color: 'var(--brand-gold)' }}>projetos que transformam.</span>
            </h1>

            <p className="text-lg leading-relaxed max-w-xl" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Conheça as histórias de sucesso dos nossos clientes e os impactos reais que entregamos com tecnologia e estratégia.
            </p>

            {/* Stats rápidos */}
            <div className="flex items-center gap-8 mt-10">
              {[
                { value: total > 0 ? `${total}+` : '∞', label: 'Projetos' },
                { value: categories.length > 0 ? `${categories.length}` : '–', label: 'Categorias' },
              ].map(stat => (
                <div key={stat.label}>
                  <p className="text-2xl font-black text-white">{stat.value}</p>
                  <p className="text-[11px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── BUSCA + FILTROS ── */}
      <section className="py-10 md:py-14" style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative mb-7"
          >
            <div className="relative flex items-center bg-white rounded-2xl border transition-all" style={{ borderColor: 'var(--border-color)', boxShadow: '0 2px 12px rgba(13,31,78,0.06)' }}>
              <Search className="ml-5 w-4 h-4 flex-shrink-0" style={{ color: 'var(--brand-navy)' }} />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Buscar por projeto, cliente ou tecnologia..."
                className="flex-1 px-4 py-4 bg-transparent border-none text-sm font-medium focus:ring-0 focus:outline-none"
                style={{ color: 'var(--brand-navy)' }}
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className="mr-4 text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg transition-all"
                  style={{ color: 'var(--text-muted)', background: 'var(--bg-tertiary)' }}
                >
                  Limpar
                </button>
              )}
            </div>
          </motion.div>

          {categories.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="flex flex-wrap justify-center gap-2"
            >
              <button
                onClick={() => handleCategoryFilter('')}
                className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200"
                style={!categoryFilter
                  ? { background: 'var(--brand-navy)', color: 'white', boxShadow: '0 4px 14px rgba(13,31,78,0.2)' }
                  : { background: 'white', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }
                }
              >
                Todos
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryFilter(cat.slug)}
                  className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 border"
                  style={categoryFilter === cat.slug
                    ? { background: cat.color, borderColor: cat.color, color: 'white', boxShadow: `0 4px 14px ${cat.color}40` }
                    : { background: 'white', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }
                  }
                >
                  {cat.name}
                  {cat._count && <span className="ml-1.5 opacity-50">[{cat._count.cases}]</span>}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ── SLIDER DESTAQUE ── */}
      {featured.length > 0 && !categoryFilter && !search && page === 1 && (
        <section className="py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center justify-between mb-8"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--brand-gold)' }}>
                  Em destaque
                </span>
              </div>
              <Link
                to="/projetos"
                className="text-[11px] font-black uppercase tracking-widest flex items-center gap-1 transition-opacity hover:opacity-70"
                style={{ color: 'var(--brand-navy)' }}
                onClick={() => handleCategoryFilter('')}
              >
                Ver todos <ArrowUpRight className="w-3 h-3" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <FeaturedSlider featured={featured} />
            </motion.div>
          </div>
        </section>
      )}

      {/* ── GRID ── */}
      <section className="pb-24 md:pb-32" style={{ background: 'var(--bg-tertiary)' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-16">

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="w-5 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--brand-gold)' }}>
                Portfólio completo
              </span>
              <span className="w-5 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
            </div>
            <h2 className="font-black tracking-tight" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', color: 'var(--brand-navy)' }}>
              {categoryFilter
                ? categories.find(c => c.slug === categoryFilter)?.name || 'Projetos filtrados'
                : search
                  ? `Resultados para "${search}"`
                  : 'Todos os projetos'}
            </h2>
            {total > 0 && (
              <p className="text-sm mt-2 font-medium" style={{ color: 'var(--text-muted)' }}>
                {total} projeto{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
              </p>
            )}
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl h-[420px] animate-pulse border" style={{ borderColor: 'var(--border-color)' }} />
              ))}
            </div>
          ) : cases.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-white border" style={{ borderColor: 'var(--border-color)' }}>
                <Filter className="w-7 h-7" style={{ color: 'var(--text-muted)' }} />
              </div>
              <h3 className="text-xl font-black mb-3 tracking-tight" style={{ color: 'var(--brand-navy)' }}>Nenhum projeto encontrado.</h3>
              <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>Tente ajustar seus filtros ou buscar por outros termos.</p>
              <button
                onClick={() => { setSearchInput(''); handleCategoryFilter(''); }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
                style={{ background: 'var(--brand-navy)', boxShadow: '0 4px 16px rgba(13,31,78,0.2)' }}
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {cases.map((c, i) => <CaseCard key={c.id} c={c} index={i} />)}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-16">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all disabled:opacity-30"
                    style={{ background: 'white', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', boxShadow: '0 2px 8px rgba(13,31,78,0.05)' }}
                  >
                    Anterior
                  </button>
                  <div className="flex items-center gap-2 text-sm font-black" style={{ color: 'var(--brand-navy)' }}>
                    <span style={{ color: 'var(--text-muted)' }} className="text-[11px] uppercase tracking-widest">Página</span>
                    {page}
                    <span style={{ color: 'var(--text-muted)' }} className="text-[11px] uppercase tracking-widest">de {totalPages}</span>
                  </div>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all disabled:opacity-30"
                    style={{ background: 'white', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', boxShadow: '0 2px 8px rgba(13,31,78,0.05)' }}
                  >
                    Próxima
                  </button>
                </div>
              )}
            </>
          )}
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
            style={{ background: 'linear-gradient(135deg, #06112B 0%, #0D1F4E 100%)', boxShadow: '0 20px 60px rgba(13,31,78,0.2)' }}
          >
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, var(--brand-gold), rgba(196,154,42,0.2) 70%, transparent)' }} />
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, rgba(196,154,42,0.8) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            <div className="relative z-10 px-8 sm:px-16 py-14 sm:py-16 flex flex-col sm:flex-row items-center justify-between gap-8">
              <div>
                <h2 className="font-black text-white tracking-tight mb-2" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)' }}>
                  Quer fazer parte dos nossos{' '}
                  <span style={{ color: 'var(--brand-gold)' }}>projetos?</span>
                </h2>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Transforme sua visão em uma solução digital real. Vamos criar o futuro do seu negócio.
                </p>
              </div>
              <a
                href="/#contato"
                className="flex-shrink-0 inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 hover:opacity-90 hover:-translate-y-px group"
                style={{ background: 'var(--brand-gold)', color: '#06112B', boxShadow: '0 6px 20px rgba(196,154,42,0.35)' }}
              >
                INICIAR PROJETO
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}
