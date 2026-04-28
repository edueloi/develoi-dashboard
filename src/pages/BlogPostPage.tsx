import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Carousel } from "../components/ui";
import { useTheme } from "../contexts/ThemeContext";
import { ArrowRight } from "lucide-react";

/* ─── Types ───────────────────────────────────────────────────────────────── */
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  featured: boolean;
  tags: string;
  views: number;
  readTimeMinutes: number;
  publishedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  category?: { id: string; name: string; slug: string; color: string };
  author?: { id: string; name: string; slug: string; photo?: string; bio?: string; role?: string; linkedin?: string };
}

function formatDate(d?: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function parseTags(tags: string): string[] {
  try { return JSON.parse(tags) || []; } catch { return []; }
}

/* ─── Related Card ────────────────────────────────────────────────────────── */
function RelatedCard({ post }: { post: any }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/blog/${post.slug}`)}
      className="group cursor-pointer rounded-2xl overflow-hidden dash-surface border dash-border hover:border-indigo-500/40 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
    >
      <div className="h-32 overflow-hidden">
        {post.coverImage ? (
          <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-900/50 to-violet-900/50 flex items-center justify-center">
            <span className="text-2xl opacity-20">✍</span>
          </div>
        )}
      </div>
      <div className="p-4">
        {post.category && (
          <span className="text-[8px] font-black uppercase tracking-widest block mb-2" style={{ color: post.category.color || "#6366f1" }}>
            {post.category.name}
          </span>
        )}
        <h4 className="text-xs font-black text-white leading-tight line-clamp-2 group-hover:text-indigo-400 transition-colors">
          {post.title}
        </h4>
      </div>
    </div>
  );
}

/* ─── Newsletter Inline ───────────────────────────────────────────────────── */
function NewsletterInline() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handle = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await fetch("/api/blog/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      setDone(true);
    } catch {}
    setLoading(false);
  };

  if (done) return <p className="text-xs text-indigo-400 font-black uppercase tracking-widest">Inscrito com sucesso! 🎉</p>;

  return (
    <div className="flex flex-col gap-3">
      <input
        value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Seu melhor e-mail"
        onKeyDown={e => e.key === "Enter" && handle()}
        className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/[0.05] text-white text-xs font-medium focus:ring-1 focus:ring-indigo-500 outline-none"
      />
      <button
        onClick={handle} disabled={loading || !email}
        className="w-full py-3 rounded-xl bg-white text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-colors shadow-lg"
      >
        {loading ? "Processando..." : "Assinar Newsletter"}
      </button>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────────── */
export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [progress, setProgress] = useState(0);
  const { theme } = useTheme();

  useEffect(() => {
    const fn = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setProgress(total > 0 ? (scrolled / total) * 100 : 0);
    };
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);

    fetch(`/api/blog/posts/${slug}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then(data => {
        if (!data) return;
        setPost(data.post);
        setRelated(data.related || []);
        setLoading(false);

        if (data.post?.id) {
          fetch(`/api/blog/posts/${data.post.id}/view`, { method: "POST" }).catch(() => {});
        }

        const title = data.post?.seoTitle || data.post?.title || "Blog Develoi";
        const desc = data.post?.seoDescription || data.post?.excerpt || "";
        document.title = `${title} | Blog Develoi`;

        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute("content", desc);
        else {
          const m = document.createElement("meta");
          m.name = "description"; m.content = desc;
          document.head.appendChild(m);
        }

        // Open Graph
        const setOG = (property: string, content: string) => {
          let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
          if (!el) { el = document.createElement("meta") as HTMLMetaElement; el.setAttribute("property", property); document.head.appendChild(el); }
          el.content = content;
        };
        setOG("og:title", title);
        setOG("og:description", desc);
        if (data.post?.coverImage) setOG("og:image", data.post.coverImage);
        setOG("og:type", "article");
      })
      .catch(() => { setLoading(false); setNotFound(true); });

    return () => { document.title = "Blog Develoi"; };
  }, [slug, navigate]);

  const tags = parseTags(post?.tags || "[]");

  if (loading) {
    return (
      <div className="min-h-screen dash-bg pt-40 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="h-12 dash-surface-2 rounded-2xl mb-8 animate-pulse" />
          <div className="h-96 dash-surface-2 rounded-3xl mb-12 animate-pulse" />
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 dash-surface-2 rounded-lg animate-pulse" style={{ width: `${80 + Math.random() * 20}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen dash-bg pt-60 px-6 text-center">
        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8">
           <span className="text-5xl opacity-20">📰</span>
        </div>
        <h2 className="text-3xl font-black mb-4 dash-text">Artigo não encontrado.</h2>
        <p className="text-lg dash-text-2 mb-12 opacity-60">O conteúdo que você busca pode ter sido removido ou o link está incorreto.</p>
        <button onClick={() => navigate("/blog")} className="px-10 py-5 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-2xl">
          Explorar Blog
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen dash-bg text-white selection:bg-indigo-500/30 overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[10%] left-[-5%] w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[20%] right-[-5%] w-[600px] h-[600px] bg-purple-500/5 blur-[150px] rounded-full" />
        <div className="absolute inset-0 noise-overlay opacity-[0.05]" />
      </div>

      {/* Reading progress bar */}
      <div className="fixed top-[72px] left-0 right-0 h-1 z-[60] bg-white/5">
        <motion.div 
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
          style={{ width: `${progress}%` }} 
        />
      </div>

      <div className="relative z-10">
        {/* Cover Header */}
        <header className="pt-40 pb-20 px-6 overflow-hidden">
          <div className="max-w-4xl mx-auto relative">
             {/* Breadcrumb */}
             <div className="flex items-center gap-3 mb-10 text-[10px] font-black uppercase tracking-widest text-white/30">
                <button onClick={() => navigate("/")} className="hover:text-indigo-500 transition-colors">Develoi</button>
                <span className="opacity-20">/</span>
                <button onClick={() => navigate("/blog")} className="hover:text-indigo-500 transition-colors">Blog</button>
                {post.category && (
                  <>
                    <span className="opacity-20">/</span>
                    <button 
                      onClick={() => navigate(`/blog?category=${post.category!.slug}`)}
                      className="font-black"
                      style={{ color: post.category.color }}
                    >
                      {post.category.name}
                    </button>
                  </>
                )}
             </div>

             <motion.h1 
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               className="text-4xl md:text-7xl font-black mb-10 leading-[0.95] tracking-tighter dash-text"
             >
               {post.title}
             </motion.h1>

             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
               className="flex items-center gap-8 flex-wrap"
             >
                {post.author && (
                  <div className="flex items-center gap-4">
                    {post.author.photo ? (
                      <img src={post.author.photo} alt={post.author.name} className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500/20" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-sm font-black text-white">
                        {post.author.name[0]}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-white/90">{post.author.name}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500/60">{post.author.role || 'Expert Develoi'}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                   <span>{formatDate(post.publishedAt)}</span>
                   <span className="w-1 h-1 rounded-full bg-indigo-500/30" />
                   <span>{post.readTimeMinutes} MIN LEITURA</span>
                   <span className="w-1 h-1 rounded-full bg-indigo-500/30" />
                   <span>{post.views.toLocaleString('pt-BR')} VIEWS</span>
                </div>
             </motion.div>
          </div>
        </header>

        {/* Featured Image */}
        {post.coverImage && (
          <section className="px-6 mb-24">
            <div className="max-w-6xl mx-auto">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="relative rounded-[3rem] overflow-hidden shadow-3xl border dash-border group"
              >
                <img src={post.coverImage} alt={post.title} className="w-full h-auto max-h-[600px] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </motion.div>
            </div>
          </section>
        )}

        {/* Article Content */}
        <section className="px-6 pb-40">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-24 items-start">
             
             {/* Main Article Body */}
             <article className="relative">
                {post.excerpt && (
                  <div className="mb-16 p-10 dash-surface-2 border-l-4 border-indigo-500 rounded-r-3xl italic text-xl md:text-2xl text-white/70 leading-relaxed font-medium">
                    "{post.excerpt}"
                  </div>
                )}

                <div className="blog-content prose prose-invert prose-indigo max-w-none">
                  {post.content.split(/<div class="develoi-carousel" data-images="([^"]+)"[^>]*>.*?<\/div>/gs).map((part, i) => {
                    if (i % 2 === 1) {
                      const images = part.split(',').filter(u => u.trim());
                      return <Carousel key={i} images={images} />;
                    }
                    return <div key={i} dangerouslySetInnerHTML={{ __html: part }} />;
                  })}
                </div>

                {/* Footer Meta */}
                <div className="mt-24 pt-12 border-t border-white/5">
                   {tags.length > 0 && (
                      <div className="mb-12">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 mb-6 block">Insights & Inovação</span>
                        <div className="flex flex-wrap gap-3">
                          {tags.map((tag, i) => (
                            <button 
                              key={i}
                              onClick={() => navigate(`/blog?search=${tag}`)}
                              className="px-5 py-2 dash-surface border dash-border rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-indigo-500 hover:border-indigo-500/40 transition-all"
                            >
                              #{tag}
                            </button>
                          ))}
                        </div>
                      </div>
                   )}

                   {/* Author Bio Section */}
                   {post.author && post.author.bio && (
                      <div className="dash-surface-2 border dash-border p-10 rounded-[2.5rem] flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl group-hover:bg-indigo-500/10 transition-colors" />
                        {post.author.photo ? (
                          <img src={post.author.photo} alt={post.author.name} className="w-24 h-24 rounded-full object-cover border-2 border-indigo-500/20 shadow-2xl" />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-4xl font-black text-white shadow-2xl">
                            {post.author.name[0]}
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-indigo-500 text-[10px] font-black uppercase tracking-[0.4em] mb-2">Sobre o Autor</p>
                          <h4 className="text-2xl font-black text-white mb-4 tracking-tight">{post.author.name}</h4>
                          <p className="text-white/50 leading-relaxed font-medium mb-6">{post.author.bio}</p>
                          {post.author.linkedin && (
                            <a href={post.author.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-indigo-500 text-[10px] font-black uppercase tracking-widest hover:gap-4 transition-all">
                              Linkedin Profile <ArrowRight className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                   )}

                   {/* Share Controls */}
                   <div className="mt-16 flex items-center gap-6 flex-wrap justify-center md:justify-start">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Compartilhar Artigo:</span>
                      <div className="flex items-center gap-4">
                        {[
                          { name: 'LinkedIn', color: 'hover:text-[#0077b5]', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}` },
                          { name: 'X / Twitter', color: 'hover:text-white', url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}` },
                          { name: 'WhatsApp', color: 'hover:text-[#25d366]', url: `https://wa.me/?text=${encodeURIComponent(post.title + " " + window.location.href)}` }
                        ].map(platform => (
                          <button 
                            key={platform.name}
                            onClick={() => window.open(platform.url, '_blank')}
                            className={`text-[10px] font-black uppercase tracking-widest text-white/40 transition-colors ${platform.color}`}
                          >
                            {platform.name}
                          </button>
                        ))}
                        <button 
                          onClick={() => { navigator.clipboard.writeText(window.location.href); }}
                          className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-indigo-500 transition-colors"
                        >
                          Copiar Link
                        </button>
                      </div>
                   </div>
                </div>
             </article>

             {/* Sidebar Actions */}
             <aside className="hidden lg:block sticky top-32 space-y-12">
                <button 
                  onClick={() => navigate("/blog")}
                  className="w-full flex items-center gap-3 px-6 py-4 dash-surface-2 border dash-border rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:border-indigo-500/40 transition-all"
                >
                   <ArrowRight className="w-4 h-4 rotate-180" /> Voltar ao Feed
                </button>

                {/* Newsletter Box */}
                <div className="relative group">
                   <div className="absolute -inset-4 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                   <div className="relative dash-surface border dash-border p-8 rounded-3xl overflow-hidden shadow-2xl">
                      <div className="absolute inset-0 noise-overlay opacity-[0.05]" />
                      <p className="text-indigo-500 text-[9px] font-black uppercase tracking-[0.4em] mb-4">Elite Newsletter</p>
                      <h4 className="text-lg font-black text-white mb-4 leading-tight">Receba insights de elite toda semana.</h4>
                      <NewsletterInline />
                   </div>
                </div>

                {/* Related Posts Sidebar */}
                {related.length > 0 && (
                   <div className="space-y-6">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Leituras Recomendadas</h3>
                      <div className="grid grid-cols-1 gap-6">
                        {related.map(r => <RelatedCard key={r.id} post={r} />)}
                      </div>
                   </div>
                )}
             </aside>
          </div>
        </section>

        {/* Mobile Related Section */}
        {related.length > 0 && (
          <section className="lg:hidden px-6 pb-40 border-t border-white/5 pt-20">
             <div className="max-w-4xl mx-auto">
               <h3 className="text-2xl font-black text-white mb-10 tracking-tight text-center">ARTIGOS RELACIONADOS</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {related.map(r => <RelatedCard key={r.id} post={r} />)}
               </div>
             </div>
          </section>
        )}
      </div>

      <footer className="relative z-10 py-20 border-t border-white/5 bg-black/20 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">© 2026 DEVELOI. TODOS OS DIREITOS RESERVADOS.</p>
      </footer>

      <style>{`
        .blog-content h2 { @apply text-3xl md:text-5xl font-black mt-16 mb-8 tracking-tighter dash-text leading-tight; }
        .blog-content h3 { @apply text-2xl md:text-3xl font-black mt-12 mb-6 tracking-tight text-white leading-snug; }
        .blog-content p { @apply text-lg md:text-xl text-white/60 leading-relaxed mb-8 font-medium; }
        .blog-content ul { @apply list-disc list-inside mb-10 space-y-4 text-white/60 text-lg; }
        .blog-content ol { @apply list-decimal list-inside mb-10 space-y-4 text-white/60 text-lg; }
        .blog-content li { @apply font-medium; }
        .blog-content blockquote { @apply border-l-4 border-indigo-500 bg-indigo-500/5 p-8 rounded-r-3xl italic text-xl text-white/70 my-12; }
        .blog-content img { @apply rounded-[2.5rem] border dash-border shadow-3xl my-16 w-full; }
        .blog-content a { @apply text-indigo-400 font-black underline decoration-indigo-500/30 underline-offset-4 hover:text-indigo-300 transition-colors; }
        .blog-content code { @apply bg-white/10 px-2 py-0.5 rounded font-mono text-indigo-300 text-sm; }
        .blog-content pre { @apply bg-slate-950 border border-white/10 p-8 rounded-3xl overflow-x-auto my-12 shadow-inner; }
        .blog-content pre code { @apply bg-transparent p-0 text-white/90 text-sm; }
        .blog-content strong { @apply text-white font-black; }
        .blog-content hr { @apply border-white/5 my-20; }
        .blog-content table { @apply w-full border-collapse my-12 text-sm; }
        .blog-content th { @apply text-left p-4 border-b border-white/10 text-indigo-500 font-black uppercase tracking-widest bg-white/[0.02]; }
        .blog-content td { @apply p-4 border-b border-white/5 text-white/50 font-medium; }
      `}</style>
    </div>
  );
}
