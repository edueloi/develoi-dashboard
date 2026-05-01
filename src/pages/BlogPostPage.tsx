import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Carousel } from "../components/ui";
import { ArrowLeft, ArrowRight, Share2, Linkedin, Twitter, CheckCircle, Folder } from "lucide-react";

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
    <div onClick={() => navigate(`/blog/${post.slug}`)} className="group cursor-pointer bg-white rounded-2xl border overflow-hidden transition-all duration-250 hover:-translate-y-1"
      style={{ borderColor: 'var(--border-color)', boxShadow: '0 2px 8px rgba(13,31,78,0.05)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,154,42,0.35)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)'; }}>
      <div className="h-28 relative overflow-hidden">
        {post.coverImage
          ? <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#06112B,#0D1F4E)' }}><Folder className="w-8 h-8" style={{ color: 'rgba(196,154,42,0.3)' }} /></div>
        }
      </div>
      <div className="p-4">
        {post.category && (
          <span className="text-[8px] font-black uppercase tracking-widest block mb-2" style={{ color: post.category.color || "var(--brand-gold)" }}>
            {post.category.name}
          </span>
        )}
        <h4 className="text-xs font-black leading-snug line-clamp-2" style={{ color: 'var(--brand-navy)' }}>
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

  if (done) return <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--brand-gold)' }}>Inscrito com sucesso! 🎉</p>;

  return (
    <div className="flex flex-col gap-3">
      <input
        value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Seu melhor e-mail"
        onKeyDown={e => e.key === "Enter" && handle()}
        className="w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none transition-all"
        style={{ borderColor: 'var(--border-color)', background: '#F8F9FC', color: 'var(--brand-navy)' }}
      />
      <button
        onClick={handle} disabled={loading || !email}
        className="w-full py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-colors shadow-lg disabled:opacity-60"
        style={{ background: 'var(--brand-navy)', color: '#fff' }}
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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fn = () => {
      const el = document.documentElement;
      setProgress(el.scrollHeight - el.clientHeight > 0 ? (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100 : 0);
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

        if (data.post?.id) fetch(`/api/blog/posts/${data.post.id}/view`, { method: "POST" }).catch(() => {});

        const title = data.post?.seoTitle || data.post?.title || "Blog Develoi";
        const desc = data.post?.seoDescription || data.post?.excerpt || "";
        document.title = `${title} | Blog Develoi`;

        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute("content", desc);
        else {
          const m = document.createElement("meta"); m.name = "description"; m.content = desc;
          document.head.appendChild(m);
        }
      })
      .catch(() => { setLoading(false); setNotFound(true); });

    return () => { document.title = "Blog Develoi"; };
  }, [slug]);

  const handleShare = (platform: 'linkedin' | 'twitter' | 'copy') => {
    const url = window.location.href;
    if (platform === 'linkedin') window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    else if (platform === 'twitter') window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(post?.title || '')}`, '_blank');
    else { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const tags = parseTags(post?.tags || "[]");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-40" style={{ background: 'var(--bg-primary)' }}>
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--brand-gold)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen pt-60 px-6 text-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8" style={{ background: 'rgba(13,31,78,0.05)' }}>
           <span className="text-5xl opacity-20">📰</span>
        </div>
        <h2 className="text-3xl font-black mb-4" style={{ color: 'var(--brand-navy)' }}>Artigo não encontrado.</h2>
        <p className="text-lg mb-12" style={{ color: 'var(--text-secondary)' }}>O conteúdo que você busca pode ter sido removido ou o link está incorreto.</p>
        <button onClick={() => navigate("/blog")} className="px-10 py-5 font-black rounded-2xl uppercase tracking-widest transition-all"
          style={{ background: 'var(--brand-navy)', color: '#fff' }}>
          Explorar Blog
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[8%] right-[-6%] w-[500px] h-[500px] rounded-full blur-[130px]" style={{ background: 'rgba(13,31,78,0.05)' }} />
        <div className="absolute bottom-[20%] left-[-4%] w-[400px] h-[400px] rounded-full blur-[120px]" style={{ background: 'rgba(196,154,42,0.04)' }} />
      </div>

      {/* Progress bar */}
      <div className="fixed top-[66px] left-0 right-0 h-[3px] z-[60]" style={{ background: 'rgba(13,31,78,0.06)' }}>
        <motion.div className="h-full" style={{ width: `${progress}%`, background: 'linear-gradient(90deg,var(--brand-navy),var(--brand-gold))' }} />
      </div>

      {/* HERO */}
      <section className="relative pt-32 pb-24 overflow-hidden" style={{ background: 'linear-gradient(135deg,#06112B 0%,#0D1F4E 60%,#0A1840 100%)' }}>
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg,var(--brand-gold),rgba(196,154,42,0.3) 60%,transparent)' }} />
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          
          <div className="flex items-center gap-2 mb-8 text-[10px] font-black uppercase tracking-widest text-white/50">
            <button onClick={() => navigate("/")} className="hover:text-white transition-colors">Develoi</button>
            <span className="opacity-40">/</span>
            <button onClick={() => navigate("/blog")} className="hover:text-white transition-colors">Blog</button>
            {post.category && (
              <>
                <span className="opacity-40">/</span>
                <button onClick={() => navigate(`/blog?category=${post.category!.slug}`)} style={{ color: post.category.color || 'var(--brand-gold)' }}>
                  {post.category.name}
                </button>
              </>
            )}
          </div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="font-black text-white leading-[1.05] tracking-tight mb-8" style={{ fontSize: 'clamp(2rem,4.5vw,3.5rem)', maxWidth: '900px' }}>
            {post.title}
          </motion.h1>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="flex items-center gap-8 flex-wrap">
            {post.author && (
              <div className="flex items-center gap-4">
                {post.author.photo ? (
                  <img src={post.author.photo} alt={post.author.name} className="w-12 h-12 rounded-full object-cover border-2" style={{ borderColor: 'rgba(196,154,42,0.3)' }} />
                ) : (
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-black text-white" style={{ background: 'var(--brand-gold)', color: '#06112B' }}>
                    {post.author.name[0]}
                  </div>
                )}
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-white">{post.author.name}</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(196,154,42,0.8)' }}>{post.author.role || 'Equipe Develoi'}</p>
                </div>
              </div>
            )}
            <div className="w-px h-10 hidden md:block" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <div className="flex items-center gap-5 text-[10px] font-bold uppercase tracking-widest flex-wrap" style={{ color: 'rgba(255,255,255,0.45)' }}>
              <span>{formatDate(post.publishedAt)}</span>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand-gold)' }} />
              <span>{post.readTimeMinutes} min de leitura</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Cover Image */}
      {post.coverImage && (
        <section className="px-6 sm:px-8 lg:px-12 py-12">
          <div className="max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}
              className="relative rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--border-color)', boxShadow: '0 16px 60px rgba(13,31,78,0.12)' }}>
              <img src={post.coverImage} alt={post.title} className="w-full h-auto max-h-[70vh] object-cover" />
            </motion.div>
          </div>
        </section>
      )}

      {/* Main content */}
      <section className="pb-24 px-6 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-16 items-start">

          {/* Content */}
          <article className="relative">
            {post.excerpt && (
              <div className="mb-12 p-8 rounded-2xl relative overflow-hidden" style={{ background: 'var(--bg-tertiary)', borderLeft: '4px solid var(--brand-gold)' }}>
                <p className="text-lg md:text-xl font-medium italic leading-relaxed" style={{ color: 'var(--brand-navy)' }}>
                  "{post.excerpt}"
                </p>
              </div>
            )}

            <div className="blog-content">
              {post.content.split(/<div class="develoi-carousel" data-images="([^"]+)"[^>]*>.*?<\/div>/gs).map((part, i) => {
                if (i % 2 === 1) { const images = part.split(',').filter(u => u.trim()); return <Carousel key={i} images={images} />; }
                return <div key={i} dangerouslySetInnerHTML={{ __html: part }} />;
              })}
            </div>

            {/* Footer tags / Author */}
            <div className="mt-16 pt-10" style={{ borderTop: '1px solid var(--border-color)' }}>
              {tags.length > 0 && (
                <div className="mb-12">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-4 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--brand-navy)' }}>Tópicos Relacionados</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, i) => (
                      <button key={i} onClick={() => navigate(`/blog?search=${tag}`)}
                        className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white border transition-all hover:-translate-y-px"
                        style={{ borderColor: 'var(--border-color)', color: 'var(--brand-navy)', boxShadow: '0 2px 8px rgba(13,31,78,0.03)' }}>
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Author Bio */}
              {post.author && post.author.bio && (
                <div className="bg-white border rounded-2xl p-8 flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left mt-12"
                  style={{ borderColor: 'var(--border-color)', boxShadow: '0 4px 20px rgba(13,31,78,0.05)' }}>
                  {post.author.photo ? (
                    <img src={post.author.photo} alt={post.author.name} className="w-20 h-20 rounded-full object-cover border-2" style={{ borderColor: 'var(--brand-gold)' }} />
                  ) : (
                    <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black text-white" style={{ background: 'var(--brand-navy)' }}>
                      {post.author.name[0]}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-1" style={{ color: 'var(--brand-gold)' }}>Sobre o Autor</p>
                    <h4 className="text-xl font-black mb-3" style={{ color: 'var(--brand-navy)' }}>{post.author.name}</h4>
                    <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>{post.author.bio}</p>
                    {post.author.linkedin && (
                      <a href={post.author.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all hover:gap-2" style={{ color: 'var(--brand-navy)' }}>
                        LinkedIn Profile <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Share Controls */}
              <div className="mt-12 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 justify-center sm:justify-start">
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Compartilhar:</span>
                <div className="flex items-center gap-3">
                  {[
                    { name: 'LI', icon: Linkedin, action: () => handleShare('linkedin') },
                    { name: 'TW', icon: Twitter, action: () => handleShare('twitter') },
                  ].map(p => (
                    <button key={p.name} onClick={p.action} className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border transition-all hover:-translate-y-px" style={{ borderColor: 'var(--border-color)', color: 'var(--brand-navy)' }}>
                      <p.icon className="w-4 h-4" />
                    </button>
                  ))}
                  <button onClick={() => handleShare('copy')} className="w-10 h-10 rounded-xl flex items-center justify-center border transition-all hover:-translate-y-px" style={copied ? { background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.4)', color: '#10b981' } : { background: 'white', borderColor: 'var(--border-color)', color: 'var(--brand-navy)' }}>
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="hidden lg:block sticky top-28 space-y-6">
            <button onClick={() => navigate('/blog')}
              className="w-full flex items-center gap-3 px-5 py-3.5 bg-white rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all hover:-translate-y-px group"
              style={{ borderColor: 'var(--border-color)', color: 'var(--brand-navy)', boxShadow: '0 2px 8px rgba(13,31,78,0.05)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,154,42,0.4)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)'; }}>
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Voltar ao Feed
            </button>

            {/* Newsletter */}
            <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: 'var(--border-color)', boxShadow: '0 4px 20px rgba(13,31,78,0.07)' }}>
              <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl" style={{ background: 'linear-gradient(90deg,var(--brand-gold),rgba(196,154,42,0.2))' }} />
              <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-4" style={{ color: 'var(--brand-gold)' }}>Newsletter Develoi</p>
              <h4 className="text-base font-black mb-5 leading-tight" style={{ color: 'var(--brand-navy)' }}>Receba conteúdos e novidades toda semana.</h4>
              <NewsletterInline />
            </div>

            {/* Related */}
            {related.length > 0 && (
              <div className="pt-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-4" style={{ color: 'var(--text-muted)' }}>Leituras Recomendadas</p>
                <div className="grid gap-4">
                  {related.map(r => <RelatedCard key={r.id} post={r} />)}
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>

      {/* Mobile related */}
      {related.length > 0 && (
        <section className="lg:hidden px-6 pb-20 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <span className="w-4 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--brand-gold)' }}>Mais Artigos</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {related.map(r => <RelatedCard key={r.id} post={r} />)}
            </div>
          </div>
        </section>
      )}

      <style>{`
        .blog-content h2 { font-size: clamp(1.6rem, 3vw, 2.4rem); font-weight:900; margin-top:3.5rem; margin-bottom:1.5rem; letter-spacing:-0.03em; line-height:1.2; color:var(--brand-navy); }
        .blog-content h3 { font-size: clamp(1.3rem, 2.5vw, 1.8rem); font-weight:900; margin-top:2.5rem; margin-bottom:1rem; letter-spacing:-0.02em; line-height:1.2; color:var(--brand-navy); }
        .blog-content p { font-size:1.05rem; line-height:1.8; margin-bottom:1.5rem; font-weight:500; color:var(--text-secondary); }
        .blog-content ul { list-style-type:disc; list-style-position:inside; margin-bottom:2rem; }
        .blog-content ol { list-style-type:decimal; list-style-position:inside; margin-bottom:2rem; }
        .blog-content li { margin-bottom:0.75rem; font-weight:500; color:var(--text-secondary); }
        .blog-content blockquote { border-left:4px solid var(--brand-gold); padding:1.5rem 2rem; border-radius:0 1rem 1rem 0; font-style:italic; font-size:1.15rem; margin:3rem 0; background:rgba(196,154,42,0.05); color:var(--brand-navy); }
        .blog-content img { border-radius:1.5rem; margin:3rem 0; width:100%; border:1px solid var(--border-color); box-shadow:0 8px 32px rgba(13,31,78,0.08); }
        .blog-content a { color:var(--brand-gold); font-weight:700; text-decoration:underline; }
        .blog-content code { background:var(--bg-tertiary); padding:0.2rem 0.4rem; border-radius:0.4rem; font-family:monospace; font-size:0.9em; color:var(--brand-navy); border:1px solid var(--border-color); }
        .blog-content pre { background:#06112B; padding:2rem; border-radius:1.5rem; overflow-x:auto; margin:2.5rem 0; }
        .blog-content pre code { background:transparent; padding:0; color:#fff; border:none; }
        .blog-content strong { color:var(--brand-navy); font-weight:900; }
        .blog-content hr { margin:4rem 0; border-color:var(--border-color); }
        .blog-content table { w-full; border-collapse:collapse; margin:2.5rem 0; font-size:0.95rem; }
        .blog-content th { text-align:left; padding:1rem; border-bottom:2px solid var(--border-color); color:var(--brand-navy); font-weight:900; background:var(--bg-tertiary); }
        .blog-content td { padding:1rem; border-bottom:1px solid var(--border-color); color:var(--text-secondary); }
      `}</style>
    </div>
  );
}
