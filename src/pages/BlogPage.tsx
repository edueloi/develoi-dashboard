import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Mail, CheckCircle } from "lucide-react";

/* ─── Types ───────────────────────────────────────────────────────────────── */
interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
  _count?: { posts: number };
}

interface BlogAuthor {
  id: string;
  name: string;
  slug: string;
  photo?: string;
  role?: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  featured: boolean;
  tags: string;
  views: number;
  readTimeMinutes: number;
  publishedAt?: string;
  category?: BlogCategory;
  author?: BlogAuthor;
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function formatDate(d?: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

/* ─── Newsletter Banner ─────────────────────────────────────────────────── */
function NewsletterBanner() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setSubscribed(true);
    setLoading(false);
  };

  if (subscribed) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-8 dash-surface border border-emerald-500/30 rounded-[2rem] text-center"
      >
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="text-xl font-black text-white mb-2">Inscrição Confirmada!</h3>
        <p className="text-sm text-white/50">Você agora faz parte da nossa elite de leitores.</p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="relative">
        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
        <input 
          type="email" 
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Seu melhor e-mail"
          className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-lg font-medium text-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
        />
      </div>
      <button 
        type="submit"
        disabled={loading}
        className="w-full py-5 bg-white text-[#030303] font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-indigo-500 hover:text-white transition-all shadow-2xl disabled:opacity-50"
      >
        {loading ? "Processando..." : "Quero me Inscrever"}
      </button>
      <p className="text-[10px] text-white/20 text-center uppercase tracking-widest">Respeitamos sua privacidade. Zero spam.</p>
    </form>
  );
}

/* ─── PostCard ────────────────────────────────────────────────────────────── */
function PostCard({ post, featured = false }: { post: BlogPost; featured?: boolean }) {
  const navigate = useNavigate();

  if (featured) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        onClick={() => navigate(`/blog/${post.slug}`)}
        className="group relative cursor-pointer rounded-[2.5rem] overflow-hidden dash-surface border dash-border shadow-3xl hover:border-indigo-500/40 transition-all duration-500 hover:-translate-y-2"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[400px]">
          <div className="relative overflow-hidden h-64 lg:h-auto">
            {post.coverImage ? (
              <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-900/50 to-violet-900/50 flex items-center justify-center">
                <span className="text-6xl opacity-20">✍</span>
              </div>
            )}
            {post.featured && (
              <div className="absolute top-6 left-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl shadow-2xl">
                ★ Destaque
              </div>
            )}
          </div>
          <div className="p-8 lg:p-12 flex flex-col justify-center gap-6 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] to-transparent pointer-events-none" />
            <div className="relative z-10">
              {post.category && (
                <span className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 block" style={{ color: post.category.color || "#6366f1" }}>
                  {post.category.name}
                </span>
              )}
              <h2 className="text-3xl lg:text-4xl font-black text-white leading-tight mb-4 group-hover:text-indigo-400 transition-colors tracking-tight">
                {post.title}
              </h2>
              {post.excerpt && <p className="text-lg text-white/50 leading-relaxed line-clamp-3 mb-6 font-medium">{post.excerpt}</p>}
              
              <div className="flex items-center gap-6 flex-wrap">
                {post.author && (
                  <div className="flex items-center gap-3">
                    {post.author.photo ? (
                      <img src={post.author.photo} alt={post.author.name} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-[10px] font-black text-white">
                        {post.author.name[0]}
                      </div>
                    )}
                    <span className="text-xs font-black uppercase tracking-widest text-white/70">{post.author.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-white/30">
                   <span>{formatDate(post.publishedAt)}</span>
                   <span className="w-1 h-1 rounded-full bg-white/20" />
                   <span>{post.readTimeMinutes} MIN</span>
                </div>
              </div>
              
              <div className="mt-8 flex items-center gap-2 text-indigo-500 text-xs font-black uppercase tracking-widest group-hover:gap-4 transition-all">
                Ler Artigo Completo <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onClick={() => navigate(`/blog/${post.slug}`)}
      className="group relative cursor-pointer rounded-[2.5rem] overflow-hidden dash-surface border dash-border hover:border-indigo-500/40 transition-all duration-500 hover:shadow-3xl hover:-translate-y-2 flex flex-col"
    >
      <div className="relative h-60 overflow-hidden">
        {post.coverImage ? (
          <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-900/50 to-violet-900/50 flex items-center justify-center">
            <span className="text-4xl opacity-20">✍</span>
          </div>
        )}
        {post.category && (
          <span className="absolute bottom-4 left-4 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg text-white shadow-2xl backdrop-blur-md" style={{ background: (post.category.color || "#6366f1") + 'aa' }}>
            {post.category.name}
          </span>
        )}
      </div>
      <div className="p-8 flex-1 flex flex-col gap-4">
        <h3 className="text-xl font-black text-white leading-tight group-hover:text-indigo-400 transition-colors line-clamp-2 tracking-tight">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-sm text-white/40 leading-relaxed line-clamp-2 font-medium">
            {post.excerpt}
          </p>
        )}
        <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {post.author && (
              <>
                {post.author.photo ? (
                  <img src={post.author.photo} alt={post.author.name} className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-[8px] font-black text-white">
                    {post.author.name[0]}
                  </div>
                )}
                <span className="text-[10px] font-black uppercase tracking-widest text-white/50">{post.author.name}</span>
              </>
            )}
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-white/20">
            {post.readTimeMinutes} MIN
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────────── */
export default function BlogPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [featured, setFeatured] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const page = Number(searchParams.get("page") || 1);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";

  const [searchInput, setSearchInput] = useState(search);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "9");
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      const res = await fetch(`/api/blog/posts?${params}`);
      const data = await res.json();
      setPosts(data.posts || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch {}
    setLoading(false);
  }, [page, search, category]);

  const fetchFeatured = useCallback(async () => {
    if (page > 1 || search || category) return;
    try {
      const res = await fetch("/api/blog/posts/featured");
      const data = await res.json();
      setFeatured(Array.isArray(data) ? data.slice(0, 1) : []);
    } catch {}
  }, [page, search, category]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/blog/categories");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch {}
  }, []);

  useEffect(() => { fetchPosts(); fetchFeatured(); fetchCategories(); }, [fetchPosts, fetchFeatured, fetchCategories]);

  const handleSearch = () => {
    const p = new URLSearchParams(searchParams);
    if (searchInput) p.set("search", searchInput);
    else p.delete("search");
    p.delete("page");
    setSearchParams(p);
  };

  const setCategory = (slug: string) => {
    const p = new URLSearchParams(searchParams);
    if (slug) p.set("category", slug);
    else p.delete("category");
    p.delete("page");
    setSearchParams(p);
  };

  const setPage = (n: number) => {
    const p = new URLSearchParams(searchParams);
    p.set("page", String(n));
    setSearchParams(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showHero = page === 1 && !search && !category;
  const featuredPost = featured[0];

  return (
    <div className="relative min-h-screen dash-bg text-white selection:bg-indigo-500/30 overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[10%] right-[-5%] w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[20%] left-[-5%] w-[600px] h-[600px] bg-purple-500/10 blur-[150px] rounded-full animate-float-slow" />
        <div className="absolute inset-0 noise-overlay opacity-[0.08]" />
      </div>

      <div className="relative z-10">
        {/* Hero Header */}
        <section className="pt-40 pb-20 px-6 border-b border-white/5">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-12"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 mb-6 block">Insights & Inovação</span>
              <h1 className="text-6xl md:text-8xl font-black mb-10 leading-[0.9] tracking-tighter dash-text">
                BLOG <span className="text-gradient-animated">DEVELOI.</span>
              </h1>
              <p className="text-xl md:text-3xl dash-text-2 leading-relaxed max-w-2xl mx-auto font-medium opacity-80">
                Tecnologia, estratégia e o futuro do software de elite.
              </p>
            </motion.div>

            {/* Search */}
            <div className="max-w-xl mx-auto mb-16 relative">
              <div className="absolute inset-0 bg-indigo-500/10 blur-2xl opacity-50" />
              <div className="relative flex items-center bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2rem] p-2 shadow-3xl">
                <input
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  placeholder="Buscar artigos..."
                  className="flex-1 px-6 py-4 bg-transparent border-none text-white placeholder-white/20 text-lg font-medium focus:ring-0"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSearch}
                  className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl text-white font-black text-sm uppercase tracking-widest shadow-xl"
                >
                  Buscar
                </motion.button>
              </div>
            </div>

            {/* Category filters */}
            {categories.length > 0 && (
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => setCategory("")}
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${!category ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'dash-surface-2 border dash-border text-white/50 hover:dash-text'}`}
                >
                  Todos
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.slug)}
                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                      category === cat.slug
                        ? 'text-white'
                        : 'dash-surface-2 border dash-border text-white/50 hover:dash-text'
                    }`}
                    style={category === cat.slug ? { background: cat.color, borderColor: cat.color, boxShadow: `0 10px 20px -5px ${cat.color}40` } : {}}
                  >
                    {cat.name}
                    {cat._count && <span className="ml-2 opacity-50">[{cat._count.posts}]</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Main Content */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          {/* Featured post */}
          {showHero && featuredPost && (
            <div className="mb-24">
              <PostCard post={featuredPost} featured />
            </div>
          )}

          {/* Active filters indicator */}
          {(search || category) && (
            <div className="mb-12 flex items-center justify-between flex-wrap gap-4 px-4">
              <span className="text-lg font-black dash-text">
                {total} RESULTADO{total !== 1 ? "S" : ""}
                {search && <> PARA "<span className="text-gradient">{search}</span>"</>}
              </span>
              <button
                onClick={() => { setSearchInput(""); setSearchParams({}); }}
                className="px-5 py-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
              >
                Limpar Filtros ×
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="dash-surface border dash-border rounded-[2.5rem] h-[500px] animate-pulse" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-40">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8">
                <span className="text-5xl opacity-20">✍</span>
              </div>
              <h3 className="text-3xl font-black mb-4 dash-text">Nenhum artigo encontrado.</h3>
              <p className="text-lg dash-text-2 opacity-60">Tente buscar por outros termos ou categorias.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {posts.map(post => <PostCard key={post.id} post={post} />)}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-6 mt-24">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="px-8 py-4 dash-surface-2 border dash-border rounded-2xl text-sm font-black uppercase tracking-widest text-white/60 disabled:opacity-20 hover:dash-text hover:border-indigo-500/40 transition-all"
              >
                Anterior
              </motion.button>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Página</span>
                <span className="text-lg font-black text-indigo-500">{page}</span>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">de {totalPages}</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="px-8 py-4 dash-surface-2 border dash-border rounded-2xl text-sm font-black uppercase tracking-widest text-white/60 disabled:opacity-20 hover:dash-text hover:border-indigo-500/40 transition-all"
              >
                Próxima
              </motion.button>
            </div>
          )}

          {/* Newsletter */}
          <div className="mt-40">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative group max-w-5xl mx-auto"
            >
              <div className="absolute -inset-6 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-[5rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              <div className="relative dash-surface border dash-border p-12 lg:p-24 rounded-[4rem] overflow-hidden shadow-3xl">
                <div className="absolute inset-0 noise-overlay opacity-[0.05]" />
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center text-left">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 mb-6 block">Elite Newsletter</span>
                    <h2 className="text-4xl lg:text-6xl font-black mb-8 tracking-tighter dash-text leading-tight">
                      FIQUE POR DENTRO DA <span className="text-gradient">INOVAÇÃO.</span>
                    </h2>
                    <p className="text-xl dash-text-2 font-medium opacity-70">
                      Insights técnicos e novidades sobre o universo da tecnologia direto na sua caixa de entrada.
                    </p>
                  </div>
                  <NewsletterBanner />
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>

      <footer className="relative z-10 py-20 border-t border-white/5 bg-black/20 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">© 2026 DEVELOI. EXCELÊNCIA EM CADA LINHA.</p>
      </footer>
    </div>
  );
}
