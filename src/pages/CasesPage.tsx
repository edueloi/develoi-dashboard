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

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#030303]/95 backdrop-blur-xl border-b border-white/5 shadow-2xl' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">D</span>
          </div>
          <span className="font-black text-white text-lg tracking-tight">DEVELOI</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/" className="text-white/60 hover:text-white text-sm font-medium transition-colors">Home</Link>
          <Link to="/blog" className="text-white/60 hover:text-white text-sm font-medium transition-colors">Blog</Link>
          <Link to="/cases" className="text-white text-sm font-bold border-b-2 border-indigo-500 pb-0.5">Cases</Link>
          <Link to="/sobre" className="text-white/60 hover:text-white text-sm font-medium transition-colors">Sobre</Link>
        </div>
      </div>
    </nav>
  );
}

// ─── Case Card ─────────────────────────────────────────────────────────────────

function CaseCard({ c, index }: { c: Case; index: number }) {
  const tags = parseTags(c.tags);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
    >
      <Link to={`/cases/${c.slug}`} className="group block h-full">
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/8 hover:border-indigo-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 h-full flex flex-col">
          {/* Cover */}
          <div className="relative overflow-hidden h-52">
            {c.coverImage ? (
              <img
                src={c.coverImage}
                alt={c.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-900/50 to-violet-900/50 flex items-center justify-center">
                <Star className="w-12 h-12 text-indigo-500/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

            {/* Featured badge */}
            {c.featured && (
              <div className="absolute top-3 left-3 flex items-center gap-1 bg-amber-500 text-black px-2.5 py-1 rounded-lg text-[10px] font-black">
                <Star className="w-2.5 h-2.5" /> DESTAQUE
              </div>
            )}

            {/* Category */}
            {c.category && (
              <div
                className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[10px] font-black text-white"
                style={{ background: c.category.color + 'cc' }}
              >
                {c.category.name}
              </div>
            )}

            {/* Stats overlay */}
            <div className="absolute bottom-3 left-3 flex items-center gap-3">
              <span className="flex items-center gap-1 text-[10px] text-white/80 font-bold">
                <Eye className="w-3 h-3" /> {c.views}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-white/80 font-bold">
                <Heart className="w-3 h-3" /> {c.likes}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-white/80 font-bold">
                <Clock className="w-3 h-3" /> {c.readTimeMinutes} min
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 flex flex-col flex-1">
            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-2">{c.client}</p>
            <h3 className="text-white font-bold text-base leading-snug mb-3 group-hover:text-indigo-300 transition-colors line-clamp-2">
              {c.title}
            </h3>
            {c.excerpt && (
              <p className="text-white/50 text-sm leading-relaxed mb-4 line-clamp-2 flex-1">{c.excerpt}</p>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {tags.slice(0, 3).map((tag, i) => (
                  <span key={i} className="text-[9px] font-bold px-2 py-0.5 bg-white/5 text-white/40 rounded-md uppercase border border-white/10">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between mt-auto">
              {c.publishedAt && (
                <span className="text-[10px] text-white/30">
                  {format(new Date(c.publishedAt), "d 'de' MMM, yyyy", { locale: ptBR })}
                </span>
              )}
              <span className="flex items-center gap-1 text-indigo-400 text-xs font-bold group-hover:gap-2 transition-all ml-auto">
                Leia Mais <ArrowRight className="w-3.5 h-3.5" />
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
    <Link to={`/cases/${c.slug}`} className="group block">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 hover:border-indigo-500/40 transition-all duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[400px]">
          {/* Image */}
          <div className="relative overflow-hidden">
            {c.coverImage ? (
              <img
                src={c.coverImage}
                alt={c.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 min-h-[280px] md:min-h-full"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-violet-900 flex items-center justify-center min-h-[280px]">
                <Star className="w-20 h-20 text-indigo-500/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#030303]/50 hidden md:block" />
            <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-amber-500 text-black px-3 py-1.5 rounded-xl text-[10px] font-black">
              <Star className="w-3 h-3" /> CASE EM DESTAQUE
            </div>
          </div>

          {/* Content */}
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <div className="space-y-4">
              {c.category && (
                <span
                  className="inline-block px-3 py-1 rounded-xl text-[10px] font-black text-white"
                  style={{ background: c.category.color + '40', border: `1px solid ${c.category.color}40`, color: c.category.color }}
                >
                  {c.category.name}
                </span>
              )}
              <p className="text-indigo-400 text-xs font-black uppercase tracking-widest">{c.client}</p>
              <h2 className="text-2xl md:text-3xl font-black text-white leading-tight group-hover:text-indigo-300 transition-colors">
                {c.title}
              </h2>
              {c.excerpt && (
                <p className="text-white/50 leading-relaxed text-sm">{c.excerpt}</p>
              )}

              <div className="flex items-center gap-4 text-xs text-white/40">
                <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {c.views} views</span>
                <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {c.likes} curtidas</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {c.readTimeMinutes} min</span>
              </div>

              <div className="pt-2">
                <span className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors group-hover:gap-3">
                  Ver Case Completo <ArrowRight className="w-4 h-4" />
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

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [featured, setFeatured] = useState<Case[]>([]);
  const [categories, setCategories] = useState<CaseCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch featured
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

  // Fetch cases
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

  // Search debounce
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  const totalPages = Math.ceil(total / 9);
  const topFeatured = featured[0];

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-2 text-indigo-400 text-xs font-bold mb-6">
              <Star className="w-3.5 h-3.5" /> CASES DE SUCESSO
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
              Resultados que{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                transformam negócios
              </span>
            </h1>
            <p className="text-white/50 text-lg max-w-2xl mx-auto leading-relaxed">
              Conheça as histórias de sucesso dos nossos clientes e os impactos reais que entregamos com tecnologia e estratégia.
            </p>
          </motion.div>

          {/* Search */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex justify-center mb-8">
            <div className="relative w-full max-w-lg">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Buscar cases por título, cliente..."
                className="w-full pl-11 pr-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-white/8 transition-all"
              />
            </div>
          </motion.div>

          {/* Category Filters */}
          {categories.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-wrap justify-center gap-2 mb-12">
              <button
                onClick={() => { setCategoryFilter(''); setPage(1); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${!categoryFilter ? 'bg-indigo-600 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/10'}`}
              >
                Todos
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setCategoryFilter(cat.slug); setPage(1); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    categoryFilter === cat.slug
                      ? 'text-white'
                      : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border-white/10'
                  }`}
                  style={categoryFilter === cat.slug ? { background: cat.color, borderColor: cat.color } : {}}
                >
                  {cat.name}
                  {cat._count && <span className="ml-1.5 opacity-60">({cat._count.cases})</span>}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Featured Case */}
      {topFeatured && !categoryFilter && !search && page === 1 && (
        <section className="px-6 pb-12">
          <div className="max-w-7xl mx-auto">
            <FeaturedCase c={topFeatured} />
          </div>
        </section>
      )}

      {/* Cases Grid */}
      <section className="px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl h-80 animate-pulse" />
              ))}
            </div>
          ) : cases.length === 0 ? (
            <div className="text-center py-20">
              <Star className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <p className="text-white/40 text-lg font-medium">Nenhum case encontrado.</p>
              {(search || categoryFilter) && (
                <button
                  onClick={() => { setSearchInput(''); setCategoryFilter(''); }}
                  className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm font-bold transition-colors"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cases.map((c, i) => (
                  <CaseCard key={c.id} c={c} index={i} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-14">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white/60 disabled:opacity-30 hover:bg-white/10 hover:text-white transition-all"
                  >
                    Anterior
                  </button>
                  <span className="text-white/40 text-sm">
                    Página {page} de {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white/60 disabled:opacity-30 hover:bg-white/10 hover:text-white transition-all"
                  >
                    Próxima
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="px-6 pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-indigo-900/40 to-violet-900/40 border border-indigo-500/20 rounded-3xl p-10">
            <h2 className="text-2xl font-black text-white mb-3">Quer ser o próximo case de sucesso?</h2>
            <p className="text-white/50 mb-6 text-sm leading-relaxed">
              Transforme seu negócio com tecnologia e estratégia. Vamos criar algo extraordinário juntos.
            </p>
            <a
              href="/#contato"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3.5 rounded-xl transition-colors"
            >
              Falar com a Develoi <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
