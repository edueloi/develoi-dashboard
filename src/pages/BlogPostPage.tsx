import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Carousel } from "../components/ui";

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

/* ─── Navbar ──────────────────────────────────────────────────────────────── */
function BlogNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? "rgba(3,3,3,0.97)" : "rgba(3,3,3,0.85)",
      backdropFilter: "blur(20px)",
      borderBottom: `1px solid ${scrolled ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.05)"}`,
      transition: "all 0.3s ease",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontWeight: 900, fontSize: 14 }}>D</span>
            </div>
            <span style={{ fontWeight: 900, fontSize: 15, color: "#fff", letterSpacing: "-0.02em" }}>DEVELOI</span>
          </button>
          <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 18 }}>|</span>
          <button onClick={() => navigate("/blog")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#6366f1" }}>
            Blog
          </button>
        </div>
        <button onClick={() => navigate("/login")} style={{
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", cursor: "pointer",
          fontSize: 13, fontWeight: 700, color: "#fff", padding: "8px 20px", borderRadius: 10,
        }}>
          Entrar
        </button>
      </div>
    </nav>
  );
}

/* ─── Related Card ────────────────────────────────────────────────────────── */
function RelatedCard({ post }: { post: any }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/blog/${post.slug}`)}
      style={{
        cursor: "pointer", borderRadius: 16, overflow: "hidden",
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
        transition: "transform 0.15s, box-shadow 0.15s, border-color 0.15s",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(99,102,241,0.15)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.3)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
    >
      <div style={{ height: 140 }}>
        {post.coverImage ? (
          <img src={post.coverImage} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #1e1b4b, #312e81)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 28, opacity: 0.3 }}>✍</span>
          </div>
        )}
      </div>
      <div style={{ padding: "14px 16px" }}>
        {post.category && (
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: post.category.color || "#6366f1" }}>
            {post.category.name}
          </span>
        )}
        <h4 style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "6px 0 0", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
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

  if (done) return <p style={{ fontSize: 12, color: "#a5b4fc", fontWeight: 700 }}>Inscrito! Obrigado 🎉</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <input
        value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Seu e-mail"
        onKeyDown={e => e.key === "Enter" && handle()}
        style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", fontSize: 12, background: "rgba(255,255,255,0.08)", color: "#fff", outline: "none" }}
      />
      <button
        onClick={handle} disabled={loading || !email}
        style={{ width: "100%", padding: "10px", borderRadius: 8, border: "none", cursor: "pointer", background: "#fff", color: "#4f46e5", fontWeight: 800, fontSize: 12 }}
      >
        {loading ? "..." : "Assinar grátis"}
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
  }, [slug]);

  const tags = parseTags(post?.tags || "[]");

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#030303", fontFamily: "'Inter', sans-serif" }}>
        <BlogNavbar />
        <div style={{ paddingTop: 120, display: "flex", justifyContent: "center" }}>
          <div style={{ maxWidth: 720, width: "100%", padding: "0 24px" }}>
            <div style={{ height: 48, background: "rgba(255,255,255,0.05)", borderRadius: 10, marginBottom: 24, animation: "pulse 1.5s infinite" }} />
            <div style={{ height: 360, background: "rgba(255,255,255,0.05)", borderRadius: 20, marginBottom: 32, animation: "pulse 1.5s infinite" }} />
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ height: 14, background: "rgba(255,255,255,0.05)", borderRadius: 6, marginBottom: 12, width: `${70 + Math.random() * 30}%`, animation: "pulse 1.5s infinite" }} />
            ))}
          </div>
        </div>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div style={{ minHeight: "100vh", background: "#030303", fontFamily: "'Inter', sans-serif" }}>
        <BlogNavbar />
        <div style={{ paddingTop: 120, textAlign: "center", padding: "120px 24px" }}>
          <div style={{ fontSize: 64 }}>📰</div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: "#fff", margin: "16px 0 8px" }}>Artigo não encontrado</h2>
          <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>O artigo que você procura não existe ou foi removido.</p>
          <button onClick={() => navigate("/blog")} style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", cursor: "pointer", padding: "12px 28px", borderRadius: 12, fontWeight: 800, fontSize: 14 }}>
            Ver todos os artigos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#030303", fontFamily: "'Inter', sans-serif", color: "#fff" }}>
      {/* Fixed bg */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.07) 0%, transparent 60%)" }} />

      {/* Reading progress bar */}
      <div style={{ position: "fixed", top: 68, left: 0, right: 0, height: 3, zIndex: 99, background: "rgba(255,255,255,0.05)" }}>
        <div style={{ height: "100%", background: "linear-gradient(90deg, #6366f1, #8b5cf6)", width: `${progress}%`, transition: "width 0.1s" }} />
      </div>

      <BlogNavbar />

      <div style={{ paddingTop: 72, position: "relative", zIndex: 1 }}>
        {/* Cover image */}
        {post.coverImage && (
          <div style={{ width: "100%", maxHeight: 500, overflow: "hidden" }}>
            <img src={post.coverImage} alt={post.title} style={{ width: "100%", height: 500, objectFit: "cover", opacity: 0.85 }} />
          </div>
        )}

        {/* Content layout */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <div className="blog-post-grid">

            {/* Article */}
            <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              {/* Breadcrumb */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                <button onClick={() => navigate("/")} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Início</button>
                <span>›</span>
                <button onClick={() => navigate("/blog")} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Blog</button>
                {post.category && (
                  <>
                    <span>›</span>
                    <button
                      onClick={() => navigate(`/blog?category=${post.category!.slug}`)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: post.category.color || "#6366f1", fontSize: 12, fontWeight: 700 }}
                    >
                      {post.category.name}
                    </button>
                  </>
                )}
              </div>

              {/* Category badge */}
              {post.category && (
                <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: post.category.color || "#6366f1", marginBottom: 14 }}>
                  {post.category.name}
                </span>
              )}

              {/* Title */}
              <h1 style={{ fontSize: "clamp(24px, 3.5vw, 44px)", fontWeight: 900, color: "#fff", lineHeight: 1.2, margin: "0 0 20px", letterSpacing: "-0.02em" }}>
                {post.title}
              </h1>

              {/* Excerpt */}
              {post.excerpt && (
                <p style={{ fontSize: 18, color: "rgba(255,255,255,0.6)", lineHeight: 1.65, margin: "0 0 28px", fontWeight: 400, borderLeft: "3px solid #6366f1", paddingLeft: 18 }}>
                  {post.excerpt}
                </p>
              )}

              {/* Meta */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, paddingBottom: 28, borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 36, flexWrap: "wrap" }}>
                {post.author && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {post.author.photo ? (
                      <img src={post.author.photo} alt={post.author.name} style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: "#fff" }}>
                        {post.author.name[0]}
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{post.author.name}</div>
                      {post.author.role && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{post.author.role}</div>}
                    </div>
                  </div>
                )}
                <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)" }} />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{formatDate(post.publishedAt)}</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>📖 {post.readTimeMinutes} min de leitura</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>👁 {post.views.toLocaleString("pt-BR")} visualizações</span>
              </div>

              {/* Content */}
              <div
                className="blog-content"
                style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(255,255,255,0.8)" }}
              >
                {post.content.split(/<div class="develoi-carousel" data-images="([^"]+)"[^>]*>.*?<\/div>/gs).map((part, i) => {
                  if (i % 2 === 1) {
                    const images = part.split(',').filter(u => u.trim());
                    return <Carousel key={i} images={images} />;
                  }
                  return <div key={i} dangerouslySetInnerHTML={{ __html: part }} />;
                })}
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div style={{ marginTop: 44, paddingTop: 28, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", marginBottom: 12 }}>Tags</p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {tags.map((tag, i) => (
                      <button
                        key={i}
                        onClick={() => navigate(`/blog?search=${tag}`)}
                        style={{ padding: "5px 12px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", cursor: "pointer" }}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Author bio box */}
              {post.author && post.author.bio && (
                <div style={{ marginTop: 44, background: "rgba(99,102,241,0.08)", borderRadius: 20, padding: "28px 32px", border: "1px solid rgba(99,102,241,0.2)", display: "flex", gap: 20, alignItems: "flex-start" }}>
                  {post.author.photo ? (
                    <img src={post.author.photo} alt={post.author.name} style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, color: "#fff", flexShrink: 0 }}>
                      {post.author.name[0]}
                    </div>
                  )}
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6366f1", margin: "0 0 6px" }}>Sobre o autor</p>
                    <p style={{ fontSize: 15, fontWeight: 800, color: "#fff", margin: "0 0 10px" }}>{post.author.name}</p>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.65, margin: 0 }}>{post.author.bio}</p>
                    {post.author.linkedin && (
                      <a href={post.author.linkedin} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#6366f1", fontWeight: 700, marginTop: 10, display: "inline-block" }}>
                        Ver perfil no LinkedIn →
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Share */}
              <div style={{ marginTop: 44, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>Compartilhar:</span>
                <button
                  onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, "_blank")}
                  style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#0077b5" }}
                >
                  LinkedIn
                </button>
                <button
                  onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}`, "_blank")}
                  style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#1d9bf0" }}
                >
                  Twitter/X
                </button>
                <button
                  onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(post.title + " " + window.location.href)}`, "_blank")}
                  style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#25d366" }}
                >
                  WhatsApp
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(window.location.href)}
                  style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}
                >
                  Copiar link
                </button>
              </div>
            </motion.article>

            {/* Sidebar */}
            <aside style={{ position: "sticky", top: 88 }}>
              <button
                onClick={() => navigate("/blog")}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: 24 }}
              >
                ← Voltar ao Blog
              </button>

              {/* Newsletter */}
              <div style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", borderRadius: 18, padding: "24px 20px", color: "#fff", marginBottom: 24, border: "1px solid rgba(255,255,255,0.1)" }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.8, margin: "0 0 8px" }}>Newsletter</p>
                <h4 style={{ fontSize: 15, fontWeight: 900, margin: "0 0 8px" }}>Conteúdo tech semanal</h4>
                <p style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.5, margin: "0 0 16px" }}>Artigos sobre tecnologia e desenvolvimento enviados direto para você.</p>
                <NewsletterInline />
              </div>

              {/* Related posts */}
              {related.length > 0 && (
                <div>
                  <h3 style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>
                    Artigos Relacionados
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {related.map(r => <RelatedCard key={r.id} post={r} />)}
                  </div>
                </div>
              )}
            </aside>
          </div>

          {/* Mobile related posts */}
          {related.length > 0 && (
            <div className="mobile-related" style={{ paddingBottom: 60, borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 48 }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: "#fff", marginBottom: 24 }}>Artigos Relacionados</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 20 }}>
                {related.map(r => <RelatedCard key={r.id} post={r} />)}
              </div>
            </div>
          )}
        </div>
      </div>

      <footer style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.35)", padding: "32px 24px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <p style={{ fontSize: 12 }}>© 2026 Develoi. Todos os direitos reservados.</p>
      </footer>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        * { box-sizing: border-box; }
        body { margin: 0; }
        input::placeholder { color: rgba(255,255,255,0.3); }

        .blog-post-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 56px;
          align-items: start;
          padding-top: 52px;
          padding-bottom: 80px;
        }

        .mobile-related { display: none; }

        @media (max-width: 992px) {
          .blog-post-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          aside { display: none !important; }
          .mobile-related { display: block !important; }
        }

        .blog-content h1, .blog-content h2, .blog-content h3, .blog-content h4 {
          color: #fff; font-weight: 900; line-height: 1.3; margin-top: 2em; margin-bottom: 0.6em;
        }
        .blog-content h2 { font-size: 1.5em; }
        .blog-content h3 { font-size: 1.25em; }
        .blog-content p { margin: 0 0 1.2em; }
        .blog-content ul, .blog-content ol { padding-left: 1.5em; margin-bottom: 1.2em; }
        .blog-content li { margin-bottom: 0.4em; }
        .blog-content blockquote {
          border-left: 3px solid #6366f1; padding: 14px 22px;
          background: rgba(99,102,241,0.08); margin: 1.5em 0; border-radius: 0 12px 12px 0;
          font-style: italic; color: rgba(255,255,255,0.7);
        }
        .blog-content img { max-width: 100%; border-radius: 16px; margin: 1.5em 0; }
        .blog-content a { color: #818cf8; font-weight: 700; }
        .blog-content a:hover { text-decoration: underline; color: #a5b4fc; }
        .blog-content code {
          background: rgba(255,255,255,0.08); padding: 2px 8px; border-radius: 5px;
          font-family: 'Courier New', monospace; font-size: 0.875em; color: #a5b4fc;
        }
        .blog-content pre {
          background: rgba(15,23,42,0.8); color: #e2e8f0; padding: 24px;
          border-radius: 16px; overflow-x: auto; margin: 1.5em 0;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .blog-content pre code { background: none; color: inherit; padding: 0; }
        .blog-content strong { color: #fff; font-weight: 800; }
        .blog-content hr { border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 2.5em 0; }
        .blog-content table { width: 100%; border-collapse: collapse; margin: 1.5em 0; }
        .blog-content td, .blog-content th { border: 1px solid rgba(255,255,255,0.1); padding: 10px 14px; font-size: 14px; }
        .blog-content th { background: rgba(99,102,241,0.1); font-weight: 700; color: #a5b4fc; }
      `}</style>
    </div>
  );
}
