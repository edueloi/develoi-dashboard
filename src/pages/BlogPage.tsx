import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";

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
      background: scrolled ? "rgba(3,3,3,0.96)" : "rgba(3,3,3,0.85)",
      backdropFilter: "blur(20px)",
      borderBottom: `1px solid ${scrolled ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.05)"}`,
      transition: "all 0.3s ease",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 16 }}>D</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontWeight: 900, fontSize: 17, color: "#fff", letterSpacing: "-0.02em" }}>DEVELOI</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.12em" }}>Blog</span>
          </div>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)", padding: "8px 14px", borderRadius: 10, transition: "color 0.2s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#fff"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"}
          >
            Início
          </button>
          <button onClick={() => navigate("/login")} style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", cursor: "pointer",
            fontSize: 13, fontWeight: 700, color: "#fff", padding: "8px 20px", borderRadius: 10,
          }}>
            Entrar
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ─── Newsletter Banner ───────────────────────────────────────────────────── */
function NewsletterBanner() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSubmit = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch("/api/blog/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      setMsg(data.message || "Inscrito com sucesso!");
      setEmail("");
      setName("");
    } catch {
      setMsg("Erro ao inscrever. Tente novamente.");
    }
    setLoading(false);
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
      borderRadius: 24, padding: "40px 40px", color: "#fff",
      display: "flex", flexDirection: "column", gap: 16,
      border: "1px solid rgba(255,255,255,0.1)",
    }}>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", opacity: 0.75 }}>Newsletter</p>
        <h3 style={{ fontSize: 22, fontWeight: 900, margin: "6px 0 4px" }}>Fique por dentro das novidades da Develoi</h3>
        <p style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.6 }}>Artigos sobre tecnologia, desenvolvimento e inovação direto na sua caixa de entrada.</p>
      </div>
      {msg ? (
        <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "14px 20px", fontWeight: 700, fontSize: 14 }}>
          {msg}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="Seu nome"
              style={{ flex: 1, minWidth: 140, padding: "12px 16px", borderRadius: 10, border: "none", fontSize: 13, fontWeight: 600, background: "rgba(255,255,255,0.15)", color: "#fff", outline: "none" }}
            />
            <input
              value={email} onChange={e => setEmail(e.target.value)}
              type="email" placeholder="Seu e-mail"
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={{ flex: 2, minWidth: 180, padding: "12px 16px", borderRadius: 10, border: "none", fontSize: 13, fontWeight: 600, background: "rgba(255,255,255,0.15)", color: "#fff", outline: "none" }}
            />
            <button
              onClick={handleSubmit} disabled={loading || !email}
              style={{ padding: "12px 24px", borderRadius: 10, border: "none", cursor: "pointer", background: "#fff", color: "#4f46e5", fontWeight: 800, fontSize: 13, whiteSpace: "nowrap" }}
            >
              {loading ? "..." : "Assinar →"}
            </button>
          </div>
          <p style={{ fontSize: 11, opacity: 0.7 }}>Sem spam. Cancele quando quiser.</p>
        </div>
      )}
    </div>
  );
}

/* ─── PostCard ────────────────────────────────────────────────────────────── */
function PostCard({ post, featured = false }: { post: BlogPost; featured?: boolean }) {
  const navigate = useNavigate();

  if (featured) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        onClick={() => navigate(`/blog/${post.slug}`)}
        className="featured-post-card"
        style={{
          cursor: "pointer", borderRadius: 24, overflow: "hidden",
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
          display: "grid", gridTemplateColumns: "1fr 1fr",
          transition: "transform 0.25s ease, box-shadow 0.25s ease",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 60px rgba(99,102,241,0.2)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 40px rgba(0,0,0,0.4)"; }}
      >
        <div style={{ position: "relative", minHeight: 300 }}>
          {post.coverImage ? (
            <img src={post.coverImage} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", minHeight: 300, background: "linear-gradient(135deg, #1e1b4b, #312e81)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 64, opacity: 0.3 }}>✍</span>
            </div>
          )}
          {post.featured && (
            <div style={{ position: "absolute", top: 16, left: 16, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", padding: "4px 10px", borderRadius: 6 }}>
              ★ Destaque
            </div>
          )}
        </div>
        <div style={{ padding: 36, display: "flex", flexDirection: "column", justifyContent: "center", gap: 14 }}>
          {post.category && (
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: post.category.color || "#6366f1" }}>
              {post.category.name}
            </span>
          )}
          <h2 style={{ fontSize: 24, fontWeight: 900, color: "#fff", lineHeight: 1.3, margin: 0 }}>{post.title}</h2>
          {post.excerpt && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, margin: 0 }}>{post.excerpt}</p>}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
            {post.author && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {post.author.photo ? (
                  <img src={post.author.photo} alt={post.author.name} style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>
                    {post.author.name[0]}
                  </div>
                )}
                <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>{post.author.name}</span>
              </div>
            )}
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{formatDate(post.publishedAt)}</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{post.readTimeMinutes} min</span>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#6366f1", fontSize: 13, fontWeight: 700, marginTop: 4 }}>
            Ler artigo →
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      onClick={() => navigate(`/blog/${post.slug}`)}
      style={{
        cursor: "pointer", borderRadius: 20, overflow: "hidden",
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
        display: "flex", flexDirection: "column",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(99,102,241,0.15)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.3)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
    >
      <div style={{ position: "relative", height: 200 }}>
        {post.coverImage ? (
          <img src={post.coverImage} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #1e1b4b, #312e81)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 40, opacity: 0.3 }}>✍</span>
          </div>
        )}
        {post.category && (
          <span style={{
            position: "absolute", bottom: 12, left: 12,
            background: post.category.color || "#6366f1", color: "#fff",
            fontSize: 10, fontWeight: 800, textTransform: "uppercase",
            letterSpacing: "0.08em", padding: "3px 8px", borderRadius: 5,
          }}>
            {post.category.name}
          </span>
        )}
      </div>
      <div style={{ padding: "20px 20px 24px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#fff", lineHeight: 1.4, margin: 0 }}>{post.title}</h3>
        {post.excerpt && (
          <p style={{
            fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.65, margin: 0,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {post.excerpt}
          </p>
        )}
        <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {post.author && (
              <>
                {post.author.photo ? (
                  <img src={post.author.photo} alt={post.author.name} style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#fff" }}>
                    {post.author.name[0]}
                  </div>
                )}
                <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>{post.author.name}</span>
              </>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{formatDate(post.publishedAt)}</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{post.readTimeMinutes} min</span>
          </div>
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
    <div style={{ minHeight: "100vh", background: "#030303", fontFamily: "'Inter', sans-serif", color: "#fff" }}>
      {/* Fixed bg */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, background: "radial-gradient(ellipse at 20% 20%, rgba(99,102,241,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(139,92,246,0.06) 0%, transparent 60%)" }} />

      <BlogNavbar />

      <div style={{ paddingTop: 68, position: "relative", zIndex: 1 }}>
        {/* Hero Header */}
        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "60px 24px 48px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              style={{ textAlign: "center", marginBottom: 36 }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "#6366f1" }}>Blog Develoi</span>
              <h1 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 900, color: "#fff", margin: "12px 0 14px", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
                Tecnologia, inovação e<br /><span style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>desenvolvimento de software</span>
              </h1>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", maxWidth: 520, margin: "0 auto" }}>
                Conteúdo técnico, estudos de caso e insights sobre o universo da tecnologia produzidos pela equipe Develoi.
              </p>
            </motion.div>

            {/* Search */}
            <div style={{ maxWidth: 560, margin: "0 auto 28px", display: "flex", gap: 8 }}>
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="Buscar artigos..."
                style={{
                  flex: 1, padding: "13px 18px", borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.1)", fontSize: 13, fontWeight: 500,
                  background: "rgba(255,255,255,0.05)", color: "#fff", outline: "none",
                }}
              />
              <button
                onClick={handleSearch}
                style={{ padding: "13px 24px", borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontWeight: 800, fontSize: 13 }}
              >
                Buscar
              </button>
            </div>

            {/* Category filters */}
            {categories.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                <button
                  onClick={() => setCategory("")}
                  style={{
                    padding: "6px 14px", borderRadius: 20,
                    border: `1.5px solid ${!category ? "#6366f1" : "rgba(255,255,255,0.1)"}`,
                    background: !category ? "rgba(99,102,241,0.15)" : "transparent",
                    color: !category ? "#6366f1" : "rgba(255,255,255,0.5)",
                    fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  Todos
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.slug)}
                    style={{
                      padding: "6px 14px", borderRadius: 20,
                      border: `1.5px solid ${category === cat.slug ? cat.color : "rgba(255,255,255,0.1)"}`,
                      background: category === cat.slug ? `${cat.color}22` : "transparent",
                      color: category === cat.slug ? cat.color : "rgba(255,255,255,0.5)",
                      fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    {cat.name}
                    {cat._count && <span style={{ marginLeft: 4, opacity: 0.7 }}>({cat._count.posts})</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px 80px" }}>

          {/* Featured post */}
          {showHero && featuredPost && (
            <div style={{ marginBottom: 56 }}>
              <PostCard post={featuredPost} featured />
            </div>
          )}

          {/* Active filters indicator */}
          {(search || category) && (
            <div style={{ marginBottom: 28, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
                {total} resultado{total !== 1 ? "s" : ""}
                {search && <> para "<strong style={{ color: "#fff" }}>{search}</strong>"</>}
                {category && ` na categoria "${categories.find(c => c.slug === category)?.name || category}"`}
              </span>
              <button
                onClick={() => { setSearchInput(""); setSearchParams({}); }}
                style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", background: "rgba(239,68,68,0.1)", border: "none", cursor: "pointer", padding: "3px 10px", borderRadius: 6 }}
              >
                Limpar filtros ×
              </button>
            </div>
          )}

          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ borderRadius: 20, overflow: "hidden", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ height: 200, background: "rgba(255,255,255,0.05)", animation: "pulse 1.5s infinite" }} />
                  <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ height: 16, background: "rgba(255,255,255,0.05)", borderRadius: 8, width: "80%" }} />
                    <div style={{ height: 12, background: "rgba(255,255,255,0.05)", borderRadius: 6, width: "60%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "rgba(255,255,255,0.3)" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>📝</div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>Nenhum artigo encontrado</p>
              <p style={{ fontSize: 13 }}>Tente outro termo ou categoria</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
              {posts.map(post => <PostCard key={post.id} post={post} />)}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 56 }}>
              <button
                onClick={() => setPage(page - 1)} disabled={page <= 1}
                style={{ padding: "8px 18px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#fff", cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.4 : 1, fontSize: 13, fontWeight: 700 }}
              >
                ← Anterior
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, page - 2) + i;
                if (p > totalPages) return null;
                return (
                  <button
                    key={p} onClick={() => setPage(p)}
                    style={{
                      width: 36, height: 36, borderRadius: 10,
                      border: `1px solid ${p === page ? "#6366f1" : "rgba(255,255,255,0.1)"}`,
                      background: p === page ? "rgba(99,102,241,0.2)" : "transparent",
                      color: p === page ? "#6366f1" : "rgba(255,255,255,0.6)",
                      cursor: "pointer", fontWeight: 800, fontSize: 13,
                    }}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(page + 1)} disabled={page >= totalPages}
                style={{ padding: "8px 18px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#fff", cursor: page >= totalPages ? "not-allowed" : "pointer", opacity: page >= totalPages ? 0.4 : 1, fontSize: 13, fontWeight: 700 }}
              >
                Próximo →
              </button>
            </div>
          )}

          {/* Newsletter */}
          <div style={{ marginTop: 72 }}>
            <NewsletterBanner />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", padding: "40px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontWeight: 900, fontSize: 13 }}>D</span>
            </div>
            <span style={{ fontWeight: 900, color: "#fff" }}>DEVELOI</span>
          </div>
          <p style={{ fontSize: 12 }}>© 2026 Develoi. Todos os direitos reservados.</p>
          <div style={{ display: "flex", gap: 20, fontSize: 12 }}>
            <button onClick={() => navigate("/")} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}>Início</button>
            <button onClick={() => navigate("/login")} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}>Dashboard</button>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        * { box-sizing: border-box; }
        body { margin: 0; }
        input::placeholder { color: rgba(255,255,255,0.35); }

        .featured-post-card {
          cursor: pointer;
          border-radius: 24px;
          overflow: hidden;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 8px 40px rgba(0,0,0,0.4);
          display: grid;
          grid-template-columns: 1fr 1fr;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }

        @media (max-width: 768px) {
          .featured-post-card {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
