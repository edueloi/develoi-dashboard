import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Search, Eye, Heart, Clock, Star, Tag, ChevronRight, Filter } from 'lucide-react';
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseTags(tags?: string): string[] {
  if (!tags) return [];
  try { return JSON.parse(tags); } catch { return []; }
}

// ─── Case Card ─────────────────────────────────────────────────────────────────

function CaseCard({ c, index }: { c: Case; index: number }) {
  const tags = parseTags(c.tags);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
    >
      <Link to={`/projetos/${c.slug}`} className="group block h-full">
        <div className="pub-surface border rounded-[2.5rem] overflow-hidden hover:border-indigo-500/40 transition-all duration-500 hover:shadow-3xl hover:shadow-indigo-500/10 hover:-translate-y-2 h-full flex flex-col">
          {/* Cover */}
          <div className="relative overflow-hidden h-64">
            {c.coverImage ? (
              <img
                src={c.coverImage}
                alt={c.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/50 dark:to-violet-900/50 flex items-center justify-center">
                <Star className="w-16 h-16 text-indigo-300 dark:text-indigo-500/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Featured badge */}
            {c.featured && (
              <div className="absolute top-5 left-5 flex items-center gap-1.5 bg-amber-500 text-black px-3 py-1.5 rounded-xl text-[10px] font-black shadow-xl">
                <Star className="w-3 h-3" /> DESTAQUE
              </div>
            )}

            {/* Category */}
            {c.category && (
              <div
                className="absolute top-5 right-5 px-3 py-1.5 rounded-xl text-[10px] font-black text-white shadow-xl backdrop-blur-md"
                style={{ background: c.category.color + 'cc' }}
              >
                {c.category.name}
              </div>
            )}

            {/* Stats overlay */}
            <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-[10px] text-white/90 font-black uppercase tracking-widest">
                  <Eye className="w-3.5 h-3.5 text-indigo-300" /> {c.views}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-white/90 font-black uppercase tracking-widest">
                  <Heart className="w-3.5 h-3.5 text-rose-400" /> {c.likes}
                </span>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] text-white/90 font-black uppercase tracking-widest">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> {c.readTimeMinutes} MIN
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 flex flex-col flex-1">
            <p className="text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">{c.client}</p>
            <h3 className="pub-text font-black text-2xl leading-tight mb-4 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 tracking-tight">
              {c.title}
            </h3>
            {c.excerpt && (
              <p className="pub-text-soft text-sm leading-relaxed mb-6 line-clamp-3 flex-1 font-medium">{c.excerpt}</p>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {tags.slice(0, 3).map((tag, i) => (
                  <span key={i} className="text-[9px] font-black px-3 py-1 bg-indigo-50 dark:bg-white/[0.03] text-indigo-500 dark:text-white/30 rounded-lg uppercase border border-indigo-100 dark:border-white/5 tracking-widest">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-100 dark:border-white/5">
              {c.publishedAt && (
                <span className="text-[10px] pub-text-muted font-black uppercase tracking-widest">
                  {format(new Date(c.publishedAt), "d MMM yyyy", { locale: ptBR })}
                </span>
              )}
              <span className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest group-hover:gap-3 transition-all ml-auto">
                DETALHES <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Featured Case ─────────────────────────────────────────────────────────────

function FeaturedCase({ c }: { c: Case }) {
  return (
    <Link to={`/projetos/${c.slug}`} className="group block">
      <div className="relative overflow-hidden rounded-[3.5rem] pub-surface border hover:border-indigo-500/40 transition-all duration-700 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[500px]">
          {/* Image */}
          <div className="relative overflow-hidden min-h-[350px] lg:min-h-full">
            {c.coverImage ? (
              <img
                src={c.coverImage}
                alt={c.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900 dark:to-violet-900 flex items-center justify-center">
                <Star className="w-24 h-24 text-indigo-300 dark:text-indigo-500/10" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/20 hidden lg:block" />
            <div className="absolute top-8 left-8 flex items-center gap-2 bg-amber-500 text-black px-4 py-2 rounded-2xl text-[10px] font-black shadow-2xl">
              <Star className="w-4 h-4" /> PROJETO EM DESTAQUE
            </div>
          </div>

          {/* Content */}
          <div className="p-10 lg:p-20 flex flex-col justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] to-transparent pointer-events-none" />

            <div className="relative z-10 space-y-8">
              {c.category && (
                <span
                  className="inline-block px-4 py-2 rounded-2xl text-[10px] font-black shadow-xl"
                  style={{ background: c.category.color + '20', border: `1px solid ${c.category.color}40`, color: c.category.color }}
                >
                  {c.category.name}
                </span>
              )}

              <div>
                <p className="text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] mb-4">{c.client}</p>
                <h2 className="text-4xl lg:text-6xl font-black pub-text leading-[0.95] tracking-tighter group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {c.title}
                </h2>
              </div>

              {c.excerpt && (
                <p className="pub-text-soft leading-relaxed text-lg lg:text-xl font-medium max-w-xl">{c.excerpt}</p>
              )}

              <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] pub-text-muted flex-wrap">
                <span className="flex items-center gap-2"><Eye className="w-4 h-4 text-indigo-500" /> {c.views} VIEWS</span>
                <span className="flex items-center gap-2"><Heart className="w-4 h-4 text-rose-500" /> {c.likes} CURTIDAS</span>
                <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" /> {c.readTimeMinutes} MIN</span>
              </div>

              <div className="pt-4">
                <span className="inline-flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black px-10 py-5 rounded-2xl text-sm transition-all shadow-2xl shadow-indigo-500/30 group-hover:gap-5 group-hover:translate-x-2 uppercase tracking-widest">
                  Ver Projeto Completo <ArrowRight className="w-5 h-5" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ProjetosPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [featured, setFeatured] = useState<Case[]>([]);
  const [categories, setCategories] = useState<CaseCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/cases/featured')
      .then(r => r.json())
      .then(setFeatured)
      .catch(console.error);
    fetch('/api/cases-categories')
      .then(r => r.json())
      .then(setCategories)
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '9' });
    if (categoryFilter) params.set('category', categoryFilter);
    if (search) params.set('search', search);
    fetch(`/api/cases?${params}`)
      .then(r => r.json())
      .then(data => {
        setCases(data.cases || []);
        setTotal(data.pagination?.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, categoryFilter, search]);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  const totalPages = Math.ceil(total / 9);
  const topFeatured = featured[0];

  return (
    <div className="relative min-h-screen dash-bg selection:bg-indigo-500/30 overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[10%] left-[-5%] w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/10 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[20%] right-[-5%] w-[600px] h-[600px] bg-purple-500/5 dark:bg-purple-500/10 blur-[150px] rounded-full animate-float-slow" />
      </div>

      {/* Hero Header */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full pub-surface border mb-10 shadow-xl"
          >
            <Star className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 dark:text-indigo-400">Nossos Projetos</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black mb-10 leading-[0.9] tracking-tighter dash-text"
          >
            NOSSOS <span className="text-gradient-animated">PROJETOS.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-3xl pub-text-soft leading-relaxed max-w-3xl mx-auto font-medium"
          >
            Conheça as histórias de sucesso dos nossos clientes e os impactos reais que entregamos com tecnologia e estratégia.
          </motion.p>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="px-6 mb-24">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative mb-12"
          >
            <div className="relative flex items-center pub-surface border rounded-[2.5rem] p-2 shadow-xl">
              <Search className="ml-6 w-5 h-5 text-indigo-500" />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Buscar por projeto, cliente ou tecnologia..."
                className="flex-1 px-4 py-5 bg-transparent border-none pub-text placeholder:pub-text-muted text-lg font-medium focus:ring-0 focus:outline-none"
              />
            </div>
          </motion.div>

          {/* Categories */}
          {categories.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap justify-center gap-3"
            >
              <button
                onClick={() => { setCategoryFilter(''); setPage(1); }}
                className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${!categoryFilter ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'pub-surface border pub-text-soft hover:pub-text'}`}
              >
                Todos
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setCategoryFilter(cat.slug); setPage(1); }}
                  className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${
                    categoryFilter === cat.slug ? 'text-white' : 'pub-surface pub-text-soft hover:pub-text'
                  }`}
                  style={categoryFilter === cat.slug ? { background: cat.color, borderColor: cat.color, boxShadow: `0 10px 20px -5px ${cat.color}40` } : {}}
                >
                  {cat.name}
                  {cat._count && <span className="ml-2 opacity-50">[{cat._count.cases}]</span>}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Featured Case */}
      {topFeatured && !categoryFilter && !search && page === 1 && (
        <section className="px-6 pb-24">
          <div className="max-w-7xl mx-auto">
            <FeaturedCase c={topFeatured} />
          </div>
        </section>
      )}

      {/* Cases Grid */}
      <section className="px-6 pb-40">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="pub-surface border rounded-[3rem] h-[500px] animate-pulse" />
              ))}
            </div>
          ) : cases.length === 0 ? (
            <div className="text-center py-40">
              <div className="w-24 h-24 pub-surface-2 rounded-full flex items-center justify-center mx-auto mb-8">
                <Filter className="w-10 h-10 pub-text-muted" />
              </div>
              <h3 className="text-3xl font-black mb-4 pub-text">Nenhum projeto encontrado.</h3>
              <p className="text-lg pub-text-soft mb-10">Tente ajustar seus filtros ou buscar por outros termos.</p>
              <button
                onClick={() => { setSearchInput(''); setCategoryFilter(''); }}
                className="px-8 py-4 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all"
              >
                Limpar Filtros
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {cases.map((c, i) => (
                  <CaseCard key={c.id} c={c} index={i} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-6 mt-24">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-8 py-4 pub-surface border rounded-2xl text-sm font-black uppercase tracking-widest pub-text-soft disabled:opacity-20 hover:border-indigo-500/40 transition-all"
                  >
                    Anterior
                  </motion.button>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest pub-text-muted">Página</span>
                    <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{page}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest pub-text-muted">de {totalPages}</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-8 py-4 pub-surface border rounded-2xl text-sm font-black uppercase tracking-widest pub-text-soft disabled:opacity-20 hover:border-indigo-500/40 transition-all"
                  >
                    Próxima
                  </motion.button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="px-6 pb-40">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative group"
          >
            <div className="absolute -inset-6 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-[5rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="relative pub-surface border p-12 sm:p-24 rounded-[4rem] text-center overflow-hidden shadow-2xl">
              <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter pub-text leading-[0.95]">
                QUER FAZER PARTE DOS NOSSOS <span className="text-gradient">PROJETOS?</span>
              </h2>
              <p className="text-xl md:text-2xl pub-text-soft mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
                Transforme sua visão em uma solução digital real. Vamos criar o futuro do seu negócio hoje.
              </p>
              <motion.a
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                href="/#contato"
                className="inline-flex items-center gap-3 px-12 py-6 bg-indigo-600 text-white font-black rounded-2xl text-lg shadow-2xl shadow-indigo-500/40 hover:bg-indigo-700 transition-all uppercase tracking-widest"
              >
                INICIAR PROJETO <ArrowRight className="w-5 h-5" />
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
