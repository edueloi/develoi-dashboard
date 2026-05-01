import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Mail, CheckCircle, Search, BookOpen, Filter } from "lucide-react";

interface BlogCategory { id: string; name: string; slug: string; color: string; _count?: { posts: number }; }
interface BlogAuthor { id: string; name: string; slug: string; photo?: string; role?: string; }
interface BlogPost { id: string; title: string; slug: string; excerpt?: string; coverImage?: string; featured: boolean; tags: string; views: number; readTimeMinutes: number; publishedAt?: string; category?: BlogCategory; author?: BlogAuthor; }

function formatDate(d?: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function AuthorAvatar({ author }: { author: BlogAuthor }) {
  if (author.photo) return <img src={author.photo} alt={author.name} className="w-7 h-7 rounded-full object-cover border" style={{ borderColor: 'var(--border-color)' }} />;
  return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white" style={{ background: 'var(--brand-navy)' }}>
      {author.name[0]}
    </div>
  );
}

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

  if (subscribed) return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-8 rounded-2xl text-center bg-white border" style={{ borderColor: 'rgba(196,154,42,0.3)' }}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(196,154,42,0.1)' }}>
        <CheckCircle className="w-7 h-7" style={{ color: 'var(--brand-gold)' }} />
      </div>
      <h3 className="text-base font-black mb-1 tracking-tight" style={{ color: 'var(--brand-navy)' }}>Inscrição Confirmada!</h3>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Você vai receber nossos conteúdos em primeira mão.</p>
    </motion.div>
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="relative">
        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Seu melhor e-mail"
          className="w-full pl-11 pr-4 py-4 rounded-xl text-sm font-medium text-white focus:outline-none transition-all"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }} />
      </div>
      <button type="submit" disabled={loading}
        className="w-full py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 hover:opacity-90"
        style={{ background: 'var(--brand-gold)', color: '#06112B', boxShadow: '0 4px 16px rgba(196,154,42,0.3)' }}>
        {loading ? "Processando..." : "Quero me Inscrever"}
      </button>
      <p className="text-[10px] text-center uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Zero spam. Respeitamos sua privacidade.</p>
    </form>
  );
}

function FeaturedPost({ post }: { post: BlogPost }) {
  const navigate = useNavigate();
  return (
    <div onClick={() => navigate(`/blog/${post.slug}`)} className="group cursor-pointer rounded-2xl overflow-hidden border transition-all duration-300"
      style={{ borderColor: 'var(--border-color)', boxShadow: '0 8px 40px rgba(13,31,78,0.1)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,154,42,0.4)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)'; }}>
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[400px]">
        <div className="relative overflow-hidden min-h-[280px] lg:min-h-full">
          {post.coverImage
            ? <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            : <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#06112B,#0D1F4E)' }}><BookOpen className="w-16 h-16" style={{ color: 'rgba(196,154,42,0.25)' }} /></div>
          }
          {post.featured && (
            <div className="absolute top-5 left-5 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black" style={{ background: 'var(--brand-gold)', color: '#06112B' }}>
              ★ DESTAQUE
            </div>
          )}
        </div>
        <div className="p-8 sm:p-12 flex flex-col justify-center bg-white">
          {post.category && (
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black mb-4" style={{ background: post.category.color + '18', color: post.category.color, border: `1px solid ${post.category.color}35` }}>
              {post.category.name}
            </span>
          )}
          <h2 className="font-black leading-tight tracking-tight mb-4 group-hover:opacity-75 transition-opacity" style={{ fontSize: 'clamp(1.4rem,2.5vw,2.2rem)', color: 'var(--brand-navy)' }}>
            {post.title}
          </h2>
          {post.excerpt && <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>{post.excerpt}</p>}
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            {post.author && (
              <div className="flex items-center gap-2">
                <AuthorAvatar author={post.author} />
                <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{post.author.name}</span>
              </div>
            )}
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{formatDate(post.publishedAt)}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{post.readTimeMinutes} min</span>
          </div>
          <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all group-hover:gap-3" style={{ background: 'var(--brand-navy)', boxShadow: '0 4px 16px rgba(13,31,78,0.2)', width: 'fit-content' }}>
            Ler Artigo <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </div>
  );
}

function PostCard({ post, index }: { post: BlogPost; index: number }) {
  const navigate = useNavigate();
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.07 }}>
      <div onClick={() => navigate(`/blog/${post.slug}`)} className="group cursor-pointer bg-white rounded-2xl border overflow-hidden h-full flex flex-col transition-all duration-250 hover:-translate-y-1"
        style={{ borderColor: 'var(--border-color)', boxShadow: '0 2px 12px rgba(13,31,78,0.05)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,154,42,0.35)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(13,31,78,0.1)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(13,31,78,0.05)'; }}>
        <div className="relative h-48 overflow-hidden">
          {post.coverImage
            ? <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            : <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#06112B,#0D1F4E)' }}><BookOpen className="w-10 h-10" style={{ color: 'rgba(196,154,42,0.3)' }} /></div>
          }
          {post.category && (
            <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-white backdrop-blur-sm" style={{ background: (post.category.color || '#0D1F4E') + 'cc' }}>
              {post.category.name}
            </span>
          )}
        </div>
        <div className="p-6 flex-1 flex flex-col">
          <h3 className="font-black text-base leading-snug mb-3 line-clamp-2 tracking-tight group-hover:opacity-75 transition-opacity" style={{ color: 'var(--brand-navy)' }}>
            {post.title}
          </h3>
          {post.excerpt && <p className="text-sm leading-relaxed mb-4 line-clamp-2 flex-1" style={{ color: 'var(--text-secondary)' }}>{post.excerpt}</p>}
          <div className="flex items-center justify-between mt-auto pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-2">
              {post.author && (
                <>
                  <AuthorAvatar author={post.author} />
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{post.author.name}</span>
                </>
              )}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{post.readTimeMinutes} min</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function BlogPage() {
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
      const params = new URLSearchParams({ page: String(page), limit: "9" });
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
    try { const res = await fetch("/api/blog/posts/featured"); const data = await res.json(); setFeatured(Array.isArray(data) ? data.slice(0, 1) : []); } catch {}
  }, [page, search, category]);

  const fetchCategories = useCallback(async () => {
    try { const res = await fetch("/api/blog/categories"); const data = await res.json(); setCategories(Array.isArray(data) ? data : []); } catch {}
  }, []);

  useEffect(() => { fetchPosts(); fetchFeatured(); fetchCategories(); }, [fetchPosts, fetchFeatured, fetchCategories]);

  const handleSearch = () => {
    const p = new URLSearchParams(searchParams);
    if (searchInput) p.set("search", searchInput); else p.delete("search");
    p.delete("page");
    setSearchParams(p);
  };

  const setCategory = (slug: string) => {
    const p = new URLSearchParams(searchParams);
    if (slug) p.set("category", slug); else p.delete("category");
    p.delete("page");
    setSearchParams(p);
  };

  const setPage = (n: number) => {
    const p = new URLSearchParams(searchParams);
    p.set("page", String(n));
    setSearchParams(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showFeatured = page === 1 && !search && !category;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative min-h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[8%] right-[-6%] w-[500px] h-[500px] rounded-full blur-[130px]" style={{ background: 'rgba(13,31,78,0.05)' }} />
        <div className="absolute bottom-[20%] left-[-4%] w-[400px] h-[400px] rounded-full blur-[120px]" style={{ background: 'rgba(196,154,42,0.04)' }} />
      </div>

      {/* HERO */}
      <section className="relative pt-32 pb-24 overflow-hidden" style={{ background: 'linear-gradient(135deg,#06112B 0%,#0D1F4E 60%,#0A1840 100%)' }}>
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg,var(--brand-gold),rgba(196,154,42,0.3) 60%,transparent)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22,1,0.36,1] }} className="max-w-3xl">
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="w-6 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
              <span className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--brand-gold)' }}>Blog Develoi</span>
            </div>
            <h1 className="font-black text-white leading-[1.05] tracking-tight mb-6" style={{ fontSize: 'clamp(2.2rem,5vw,3.8rem)' }}>
              Insights, tendências{' '}
              <span style={{ color: 'var(--brand-gold)' }}>e tecnologia.</span>
            </h1>
            <p className="text-lg leading-relaxed max-w-xl" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Tecnologia, estratégia e tendências digitais para impulsionar o seu negócio.
            </p>
          </motion.div>
        </div>
      </section>

      {/* BUSCA + FILTROS */}
      <section className="py-12 md:py-16" style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="relative mb-8">
            <div className="relative flex items-center bg-white rounded-2xl border" style={{ borderColor: 'var(--border-color)', boxShadow: '0 2px 12px rgba(13,31,78,0.06)' }}>
              <Search className="ml-5 w-4 h-4 flex-shrink-0" style={{ color: 'var(--brand-navy)' }} />
              <input value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="Buscar artigos, temas ou categorias..."
                className="flex-1 px-4 py-4 bg-transparent border-none text-sm font-medium focus:ring-0 focus:outline-none"
                style={{ color: 'var(--brand-navy)' }} />
              <button onClick={handleSearch} className="mr-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
                style={{ background: 'var(--brand-navy)', boxShadow: '0 4px 12px rgba(13,31,78,0.2)' }}>
                Buscar
              </button>
            </div>
          </motion.div>

          {categories.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="flex flex-wrap justify-center gap-2">
              <button onClick={() => setCategory("")} className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200"
                style={!category ? { background: 'var(--brand-navy)', color: 'white', boxShadow: '0 4px 14px rgba(13,31,78,0.2)' } : { background: 'white', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                Todos
              </button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setCategory(cat.slug)} className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 border"
                  style={category === cat.slug
                    ? { background: cat.color, borderColor: cat.color, color: 'white', boxShadow: `0 4px 14px ${cat.color}40` }
                    : { background: 'white', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                  {cat.name}{cat._count && <span className="ml-1.5 opacity-50">[{cat._count.posts}]</span>}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* DESTAQUE */}
      {showFeatured && featured[0] && (
        <section className="py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-center gap-2 mb-8">
              <span className="w-5 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--brand-gold)' }}>Em destaque</span>
            </motion.div>
            <FeaturedPost post={featured[0]} />
          </div>
        </section>
      )}

      {/* GRID */}
      <section className="pb-24 md:pb-32" style={{ background: 'var(--bg-tertiary)' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-16">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="w-5 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--brand-gold)' }}>
                {search || category ? `${total} resultado${total !== 1 ? 's' : ''}` : 'Todos os artigos'}
              </span>
              <span className="w-5 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
            </div>
            {!search && !category && (
              <h2 className="font-black tracking-tight" style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', color: 'var(--brand-navy)' }}>
                Últimas publicações
              </h2>
            )}
            {(search || category) && (
              <button onClick={() => { setSearchInput(""); setSearchParams({}); }} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all hover:opacity-80"
                style={{ background: 'rgba(13,31,78,0.06)', color: 'var(--brand-navy)', border: '1px solid var(--border-color)' }}>
                Limpar filtros ×
              </button>
            )}
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="bg-white rounded-2xl h-[380px] animate-pulse border" style={{ borderColor: 'var(--border-color)' }} />)}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-white border" style={{ borderColor: 'var(--border-color)' }}>
                <Filter className="w-7 h-7" style={{ color: 'var(--text-muted)' }} />
              </div>
              <h3 className="text-xl font-black mb-3 tracking-tight" style={{ color: 'var(--brand-navy)' }}>Nenhum artigo encontrado.</h3>
              <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>Tente buscar por outros termos ou categorias.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {posts.map((post, i) => <PostCard key={post.id} post={post} index={i} />)}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-16">
                  <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all disabled:opacity-30"
                    style={{ background: 'white', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', boxShadow: '0 2px 8px rgba(13,31,78,0.05)' }}>
                    Anterior
                  </button>
                  <div className="flex items-center gap-2 text-sm font-black" style={{ color: 'var(--brand-navy)' }}>
                    <span className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Página</span>
                    {page}
                    <span className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>de {totalPages}</span>
                  </div>
                  <button onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all disabled:opacity-30"
                    style={{ background: 'white', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', boxShadow: '0 2px 8px rgba(13,31,78,0.05)' }}>
                    Próxima
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="rounded-2xl overflow-hidden relative"
            style={{ background: 'linear-gradient(135deg,#06112B 0%,#0D1F4E 100%)', boxShadow: '0 20px 60px rgba(13,31,78,0.2)' }}>
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg,var(--brand-gold),rgba(196,154,42,0.2) 70%,transparent)' }} />
            <div className="relative z-10 px-8 sm:px-16 py-14 sm:py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 mb-5">
                  <span className="w-5 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
                  <span className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--brand-gold)' }}>Newsletter Develoi</span>
                </div>
                <h2 className="font-black text-white tracking-tight mb-3" style={{ fontSize: 'clamp(1.5rem,3vw,2.2rem)' }}>
                  Fique por dentro da{' '}
                  <span style={{ color: 'var(--brand-gold)' }}>inovação.</span>
                </h2>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Insights técnicos e novidades do universo digital direto na sua caixa de entrada.
                </p>
              </div>
              <NewsletterBanner />
            </div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}
