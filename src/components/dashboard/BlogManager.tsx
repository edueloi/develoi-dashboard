import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Plus, Search, Eye, Edit2, Trash2, Globe, Archive,
  Star, Tag, Users, BarChart2, Mail, ChevronLeft, ChevronRight,
  Save, X, ArrowLeft, TrendingUp, BookOpen, CheckCircle2,
} from "lucide-react";
import {
  PanelCard, Button, Input, Select, Textarea, Badge, Modal,
  StatGrid, StatCard, EmptyState,
} from "../ui";
import RichTextEditor from "../ui/RichTextEditor";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  status: "draft" | "published" | "archived";
  featured: boolean;
  tags: string;
  views: number;
  readTimeMinutes: number;
  publishedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  categoryId?: string;
  authorId?: string;
  category?: { id: string; name: string; color: string };
  author?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
  _count?: { posts: number };
}

interface BlogAuthor {
  id: string;
  name: string;
  slug: string;
  bio?: string;
  photo?: string;
  role?: string;
  linkedin?: string;
  isActive: boolean;
  _count?: { posts: number };
}

interface BlogSubscriber {
  id: string;
  email: string;
  name?: string;
  isActive: boolean;
  createdAt: string;
}

interface BlogStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalViews: number;
  totalSubscribers: number;
  activeSubscribers: number;
  totalCategories: number;
  totalAuthors: number;
  topPosts: { id: string; title: string; slug: string; views: number; publishedAt?: string }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseTags(tags: string): string[] {
  try { return JSON.parse(tags) || []; } catch { return []; }
}

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function statusBadgeColor(s: string) {
  if (s === "published") return "success";
  if (s === "draft") return "info";
  return "default";
}

function statusLabel(s: string) {
  if (s === "published") return "Publicado";
  if (s === "draft") return "Rascunho";
  return "Arquivado";
}

// ─── Sub-tabs ─────────────────────────────────────────────────────────────────

type BlogTab = "overview" | "posts" | "editor" | "categories" | "authors" | "subscribers";

// ─── Main Component ───────────────────────────────────────────────────────────

export function BlogManager() {
  const [tab, setTab] = useState<BlogTab>("overview");
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  const handleNewPost = () => { setEditingPost(null); setTab("editor"); };
  const handleEditPost = (p: BlogPost) => { setEditingPost(p); setTab("editor"); };
  const handleBackFromEditor = () => { setEditingPost(null); setTab("posts"); };

  return (
    <div className="space-y-6">
      {/* Sub-nav */}
      {tab !== "editor" && (
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1.5 w-fit shadow-sm flex-wrap">
          {([
            { id: "overview", label: "Visão Geral", icon: BarChart2 },
            { id: "posts",    label: "Posts",       icon: FileText },
            { id: "categories", label: "Categorias", icon: Tag },
            { id: "authors",  label: "Autores",     icon: Users },
            { id: "subscribers", label: "Assinantes", icon: Mail },
          ] as { id: BlogTab; label: string; icon: any }[]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                tab === id
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {tab === "overview" && (
          <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <BlogOverview onNewPost={handleNewPost} />
          </motion.div>
        )}
        {tab === "posts" && (
          <motion.div key="posts" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <BlogPostsList onNew={handleNewPost} onEdit={handleEditPost} />
          </motion.div>
        )}
        {tab === "editor" && (
          <motion.div key="editor" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <PostEditor post={editingPost} onBack={handleBackFromEditor} />
          </motion.div>
        )}
        {tab === "categories" && (
          <motion.div key="categories" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <CategoriesManager />
          </motion.div>
        )}
        {tab === "authors" && (
          <motion.div key="authors" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <AuthorsManager />
          </motion.div>
        )}
        {tab === "subscribers" && (
          <motion.div key="subscribers" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <SubscribersManager />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── BlogOverview ─────────────────────────────────────────────────────────────

function BlogOverview({ onNewPost }: { onNewPost: () => void }) {
  const [stats, setStats] = useState<BlogStats | null>(null);

  useEffect(() => {
    fetch("/api/admin/blog/stats").then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  if (!stats) {
    return <div className="flex items-center justify-center py-20 text-slate-400 text-sm font-bold">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <StatGrid cols={4}>
        <StatCard title="Total de Posts" value={stats.totalPosts} icon={FileText} color="info" delay={0.1} />
        <StatCard title="Publicados" value={stats.publishedPosts} icon={Globe} color="success" delay={0.2} />
        <StatCard title="Visualizações" value={stats.totalViews.toLocaleString("pt-BR")} icon={Eye} color="warning" delay={0.3} />
        <StatCard title="Assinantes" value={stats.activeSubscribers} icon={Mail} color="info" delay={0.4} />
      </StatGrid>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <PanelCard title="Posts Mais Vistos" icon={TrendingUp} description="Top 5 artigos por visualizações">
          {stats.topPosts.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Nenhum post publicado ainda.</p>
          ) : (
            <div className="space-y-3">
              {stats.topPosts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-7 h-7 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center text-xs font-black">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{p.title}</p>
                    <p className="text-xs text-slate-400">{formatDate(p.publishedAt)}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-indigo-600">
                    <Eye className="w-3 h-3" />
                    {p.views.toLocaleString("pt-BR")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </PanelCard>

        <PanelCard title="Resumo do Blog" icon={BarChart2} description="Situação atual do conteúdo">
          <div className="space-y-4">
            {[
              { label: "Posts publicados", value: stats.publishedPosts, total: stats.totalPosts, color: "bg-emerald-500" },
              { label: "Rascunhos", value: stats.draftPosts, total: stats.totalPosts, color: "bg-blue-500" },
              { label: "Categorias ativas", value: stats.totalCategories, total: stats.totalCategories + 1, color: "bg-indigo-500" },
              { label: "Autores ativos", value: stats.totalAuthors, total: stats.totalAuthors + 1, color: "bg-violet-500" },
            ].map(item => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-600">{item.label}</span>
                  <span className="text-xs font-black text-slate-900">{item.value}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-700`}
                    style={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Assinantes ativos</span>
            <span className="text-sm font-black text-indigo-700">{stats.activeSubscribers} / {stats.totalSubscribers}</span>
          </div>
          <Button onClick={onNewPost} className="w-full mt-4" iconLeft={<Plus className="w-4 h-4" />}>
            NOVO POST
          </Button>
        </PanelCard>
      </div>
    </div>
  );
}

// ─── BlogPostsList ────────────────────────────────────────────────────────────

function BlogPostsList({ onNew, onEdit }: { onNew: () => void; onEdit: (p: BlogPost) => void }) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "15");
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);
      const r = await fetch(`/api/admin/blog/posts?${params}`);
      const data = await r.json();
      setPosts(data.posts || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch {}
    setLoading(false);
  }, [page, statusFilter, search]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handlePublish = async (id: string) => {
    await fetch(`/api/admin/blog/posts/${id}/publish`, { method: "PATCH" });
    fetchPosts();
  };

  const handleArchive = async (id: string) => {
    await fetch(`/api/admin/blog/posts/${id}/archive`, { method: "PATCH" });
    fetchPosts();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/blog/posts/${id}`, { method: "DELETE" });
    setDeletingId(null);
    fetchPosts();
  };

  return (
    <div className="space-y-4">
      <PanelCard
        title="Posts do Blog"
        icon={FileText}
        description={`${total} post${total !== 1 ? "s" : ""} no total`}
        action={
          <div className="flex gap-3 flex-wrap">
            <Select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              wrapperClassName="w-36"
            >
              <option value="all">Todos</option>
              <option value="published">Publicados</option>
              <option value="draft">Rascunhos</option>
              <option value="archived">Arquivados</option>
            </Select>
            <Input
              iconLeft={<Search className="w-4 h-4" />}
              placeholder="Buscar posts..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              wrapperClassName="w-56"
            />
            <Button onClick={onNew} iconLeft={<Plus className="w-4 h-4" />}>NOVO POST</Button>
          </div>
        }
      >
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <EmptyState icon={FileText} title="Nenhum post encontrado" description="Crie seu primeiro artigo para o blog da Develoi." />
        ) : (
          <div className="space-y-2">
            {posts.map(post => (
              <div key={post.id} className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group">
                {/* Cover thumb */}
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center">
                  {post.coverImage ? (
                    <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="w-5 h-5 text-indigo-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-bold text-slate-900 truncate">{post.title}</p>
                    {post.featured && <Star className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge color={statusBadgeColor(post.status) as any} size="sm">{statusLabel(post.status)}</Badge>
                    {post.category && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: post.category.color }}>
                        {post.category.name}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-medium">{formatDate(post.publishedAt || post.createdAt)}</span>
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {post.views}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">{post.readTimeMinutes} min</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {post.status !== "published" && (
                    <button
                      onClick={() => handlePublish(post.id)}
                      title="Publicar"
                      className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                    >
                      <Globe className="w-4 h-4" />
                    </button>
                  )}
                  {post.status !== "archived" && (
                    <button
                      onClick={() => handleArchive(post.id)}
                      title="Arquivar"
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onEdit(post)}
                    title="Editar"
                    className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingId(post.id)}
                    title="Excluir"
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-xl border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-600">Pág {page} de {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-xl border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </PanelCard>

      {/* Delete confirm */}
      {deletingId && (
        <Modal isOpen title="Excluir Post" onClose={() => setDeletingId(null)} size="sm">
          <p className="text-sm text-slate-600 mb-6">Tem certeza? Esta ação não pode ser desfeita.</p>
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setDeletingId(null)}>Cancelar</Button>
            <Button fullWidth onClick={() => handleDelete(deletingId)} className="bg-red-600 hover:bg-red-700 text-white border-red-600">
              Excluir
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── PostEditor ───────────────────────────────────────────────────────────────

function PostEditor({ post, onBack }: { post: BlogPost | null; onBack: () => void }) {
  const isEdit = !!post;

  const [title, setTitle] = useState(post?.title || "");
  const [excerpt, setExcerpt] = useState(post?.excerpt || "");
  const [content, setContent] = useState(post?.content || "");
  const [coverImage, setCoverImage] = useState(post?.coverImage || "");
  const [status, setStatus] = useState<"draft" | "published" | "archived">(post?.status || "draft");
  const [featured, setFeatured] = useState(post?.featured || false);
  const [categoryId, setCategoryId] = useState(post?.categoryId || "");
  const [authorId, setAuthorId] = useState(post?.authorId || "");
  const [tagsInput, setTagsInput] = useState(parseTags(post?.tags || "[]").join(", "));
  const [seoTitle, setSeoTitle] = useState(post?.seoTitle || "");
  const [seoDescription, setSeoDescription] = useState(post?.seoDescription || "");
  const [seoKeywords, setSeoKeywords] = useState(post?.seoKeywords || "");

  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [authors, setAuthors] = useState<BlogAuthor[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<"content" | "seo" | "settings">("content");

  useEffect(() => {
    fetch("/api/admin/blog/categories").then(r => r.json()).then(setCategories).catch(() => {});
    fetch("/api/admin/blog/authors").then(r => r.json()).then(setAuthors).catch(() => {});
  }, []);

  const handleCoverFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => setCoverImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async (saveStatus?: string) => {
    if (!title.trim() || !content.trim()) return alert("Título e conteúdo são obrigatórios.");
    setLoading(true);
    try {
      const tags = JSON.stringify(tagsInput.split(",").map(t => t.trim()).filter(t => t));
      const body = {
        title, excerpt, content, coverImage, featured, categoryId: categoryId || null,
        authorId: authorId || null, tags, seoTitle, seoDescription, seoKeywords,
        status: saveStatus || status,
      };

      const url = isEdit ? `/api/admin/blog/posts/${post!.id}` : "/api/admin/blog/posts";
      const method = isEdit ? "PUT" : "POST";
      await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

      setSaved(true);
      setTimeout(() => { setSaved(false); if (!isEdit) onBack(); }, 1500);
    } catch {
      alert("Erro ao salvar post.");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Editor de Post</p>
            <p className="text-sm font-bold text-slate-900 truncate max-w-xs">{title || "Novo Artigo"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={status} onChange={e => setStatus(e.target.value as any)} wrapperClassName="w-36">
            <option value="draft">Rascunho</option>
            <option value="published">Publicar</option>
            <option value="archived">Arquivar</option>
          </Select>
          <Button
            onClick={() => handleSave()}
            loading={loading}
            iconLeft={saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          >
            {saved ? "Salvo!" : isEdit ? "SALVAR" : "CRIAR POST"}
          </Button>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
        {([
          { id: "content", label: "Conteúdo" },
          { id: "seo", label: "SEO" },
          { id: "settings", label: "Configurações" },
        ] as { id: typeof activeSection; label: string }[]).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSection === id ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4 items-start">
        {/* Main editor area */}
        <div className="space-y-4">
          {activeSection === "content" && (
            <>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                <Input
                  label="Título do Artigo"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Como a tecnologia está transformando o mercado"
                  required
                />
                <Textarea
                  label="Resumo (Excerpt)"
                  value={excerpt}
                  onChange={e => setExcerpt(e.target.value)}
                  placeholder="Um resumo curto e atraente do artigo (aparece nas listagens e no SEO)..."
                  rows={2}
                />
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Conteúdo</p>
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Comece a escrever seu artigo aqui..."
                  minHeight={480}
                />
              </div>
            </>
          )}

          {activeSection === "seo" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-indigo-600" />
                <p className="text-sm font-black text-slate-800">Otimização para Mecanismos de Busca</p>
              </div>

              <Input
                label="Título SEO"
                value={seoTitle}
                onChange={e => setSeoTitle(e.target.value)}
                placeholder="Título que aparece no Google (máx. 60 caracteres)"
              />
              <div>
                <p className="text-xs font-bold text-slate-500 mb-1">
                  {seoTitle.length}/60 caracteres
                  {seoTitle.length > 60 && <span className="text-red-500 ml-1">— muito longo!</span>}
                </p>
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${seoTitle.length > 60 ? "bg-red-400" : seoTitle.length > 45 ? "bg-amber-400" : "bg-emerald-400"}`}
                    style={{ width: `${Math.min(100, (seoTitle.length / 60) * 100)}%` }}
                  />
                </div>
              </div>

              <Textarea
                label="Descrição SEO (Meta Description)"
                value={seoDescription}
                onChange={e => setSeoDescription(e.target.value)}
                placeholder="Descrição que aparece no resultado do Google (máx. 160 caracteres)"
                rows={3}
              />
              <div>
                <p className="text-xs font-bold text-slate-500 mb-1">
                  {seoDescription.length}/160 caracteres
                  {seoDescription.length > 160 && <span className="text-red-500 ml-1">— muito longo!</span>}
                </p>
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${seoDescription.length > 160 ? "bg-red-400" : seoDescription.length > 130 ? "bg-amber-400" : "bg-emerald-400"}`}
                    style={{ width: `${Math.min(100, (seoDescription.length / 160) * 100)}%` }}
                  />
                </div>
              </div>

              <Input
                label="Palavras-chave (Keywords)"
                value={seoKeywords}
                onChange={e => setSeoKeywords(e.target.value)}
                placeholder="tecnologia, desenvolvimento, software (separadas por vírgula)"
              />

              {/* SEO preview */}
              {(seoTitle || title) && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Prévia no Google</p>
                  <p className="text-blue-600 text-sm font-medium hover:underline cursor-pointer">
                    {seoTitle || title}
                  </p>
                  <p className="text-xs text-emerald-700 mb-0.5">develoi.com.br/blog/{title.toLowerCase().replace(/\s+/g, "-").substring(0, 40)}...</p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {seoDescription || excerpt || "Adicione uma meta description para melhorar o SEO."}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeSection === "settings" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <p className="text-sm font-black text-slate-800 mb-2">Configurações do Post</p>

              <Select
                label="Categoria"
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
              >
                <option value="">Sem categoria</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </Select>

              <Select
                label="Autor"
                value={authorId}
                onChange={e => setAuthorId(e.target.value)}
              >
                <option value="">Sem autor</option>
                {authors.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </Select>

              <Input
                label="Tags (separadas por vírgula)"
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
                placeholder="Ex: tecnologia, inovação, startups"
              />

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-800">Post em destaque</p>
                  <p className="text-xs text-slate-500">Aparece na seção de destaques da página inicial do blog</p>
                </div>
                <button
                  onClick={() => setFeatured(v => !v)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${featured ? "bg-indigo-600" : "bg-slate-200"}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${featured ? "left-6" : "left-1"}`} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Cover image */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Imagem de Capa</p>
            {coverImage ? (
              <div className="relative rounded-xl overflow-hidden">
                <img src={coverImage} alt="Capa" className="w-full h-40 object-cover" />
                <button
                  onClick={() => setCoverImage("")}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-lg shadow text-red-500 hover:bg-red-50 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all">
                <div className="text-2xl mb-2">🖼️</div>
                <p className="text-xs font-bold text-slate-500">Clique para fazer upload</p>
                <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, GIF — max 10MB</p>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleCoverFile(f); }}
                />
              </label>
            )}
            <div className="mt-3">
              <Input
                placeholder="Ou cole uma URL de imagem..."
                value={coverImage.startsWith("data:") ? "" : coverImage}
                onChange={e => setCoverImage(e.target.value)}
              />
            </div>
          </div>

          {/* Quick info */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Info Rápida</p>
            <div className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Status</span>
                <Badge color={statusBadgeColor(status) as any} size="sm">{statusLabel(status)}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Palavras</span>
                <span className="font-bold text-slate-900">
                  {content.replace(/<[^>]+>/g, "").split(/\s+/).filter(Boolean).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Leitura</span>
                <span className="font-bold text-slate-900">
                  {Math.max(1, Math.round(content.replace(/<[^>]+>/g, "").split(/\s+/).filter(Boolean).length / 200))} min
                </span>
              </div>
            </div>
          </div>

          {/* Publish action */}
          {status !== "published" && (
            <Button
              onClick={() => handleSave("published")}
              loading={loading}
              fullWidth
              iconLeft={<Globe className="w-4 h-4" />}
              className="bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
            >
              PUBLICAR AGORA
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CategoriesManager ────────────────────────────────────────────────────────

function CategoriesManager() {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BlogCategory | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [saving, setSaving] = useState(false);

  const PRESET_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#14b8a6"];

  const fetch_ = async () => {
    setLoading(true);
    try {
      const data = await fetch("/api/admin/blog/categories").then(r => r.json());
      setCategories(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  const openNew = () => { setEditing(null); setName(""); setDescription(""); setColor("#6366f1"); setShowForm(true); };
  const openEdit = (c: BlogCategory) => { setEditing(c); setName(c.name); setDescription(c.description || ""); setColor(c.color); setShowForm(true); };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const url = editing ? `/api/admin/blog/categories/${editing.id}` : "/api/admin/blog/categories";
      const method = editing ? "PUT" : "POST";
      await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description, color }) });
      setShowForm(false);
      fetch_();
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir categoria?")) return;
    await fetch(`/api/admin/blog/categories/${id}`, { method: "DELETE" });
    fetch_();
  };

  return (
    <div className="space-y-4">
      <PanelCard
        title="Categorias do Blog"
        icon={Tag}
        description="Organize seus posts por categorias"
        action={<Button onClick={openNew} iconLeft={<Plus className="w-4 h-4" />}>NOVA CATEGORIA</Button>}
      >
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}</div>
        ) : categories.length === 0 ? (
          <EmptyState icon={Tag} title="Nenhuma categoria" description="Crie categorias para organizar seus posts." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 transition-all group">
                <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-black text-sm" style={{ background: cat.color }}>
                  {cat.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{cat.name}</p>
                  <p className="text-xs text-slate-400">{cat._count?.posts || 0} posts</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </PanelCard>

      {showForm && (
        <Modal isOpen title={editing ? "Editar Categoria" : "Nova Categoria"} onClose={() => setShowForm(false)} size="sm">
          <div className="space-y-4">
            <Input label="Nome" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Tecnologia" required />
            <Textarea label="Descrição (opcional)" value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Breve descrição desta categoria..." />
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Cor</p>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-xl transition-all ${color === c ? "ring-2 ring-offset-2 ring-indigo-600 scale-110" : "hover:scale-110"}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
            <Button onClick={handleSave} loading={saving} fullWidth>{editing ? "SALVAR" : "CRIAR"}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── AuthorsManager ───────────────────────────────────────────────────────────

function AuthorsManager() {
  const [authors, setAuthors] = useState<BlogAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BlogAuthor | null>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [role, setRole] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [photo, setPhoto] = useState("");
  const [saving, setSaving] = useState(false);

  const fetch_ = async () => {
    setLoading(true);
    try {
      const data = await fetch("/api/admin/blog/authors").then(r => r.json());
      setAuthors(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  const openNew = () => { setEditing(null); setName(""); setBio(""); setRole(""); setLinkedin(""); setPhoto(""); setShowForm(true); };
  const openEdit = (a: BlogAuthor) => { setEditing(a); setName(a.name); setBio(a.bio || ""); setRole(a.role || ""); setLinkedin(a.linkedin || ""); setPhoto(a.photo || ""); setShowForm(true); };

  const handlePhoto = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => setPhoto(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const url = editing ? `/api/admin/blog/authors/${editing.id}` : "/api/admin/blog/authors";
      const method = editing ? "PUT" : "POST";
      await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, bio, role, linkedin, photo }) });
      setShowForm(false);
      fetch_();
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir autor?")) return;
    await fetch(`/api/admin/blog/authors/${id}`, { method: "DELETE" });
    fetch_();
  };

  return (
    <div className="space-y-4">
      <PanelCard
        title="Autores do Blog"
        icon={Users}
        description="Gerencie os autores que escrevem para o blog"
        action={<Button onClick={openNew} iconLeft={<Plus className="w-4 h-4" />}>NOVO AUTOR</Button>}
      >
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>
        ) : authors.length === 0 ? (
          <EmptyState icon={Users} title="Nenhum autor" description="Cadastre autores para assinar os posts do blog." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {authors.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 transition-all group">
                {a.photo ? (
                  <img src={a.photo} alt={a.name} className="w-12 h-12 rounded-2xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-base flex-shrink-0">
                    {a.name[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{a.name}</p>
                  <p className="text-xs text-slate-400">{a.role || "Autor"} · {a._count?.posts || 0} posts</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </PanelCard>

      {showForm && (
        <Modal isOpen title={editing ? "Editar Autor" : "Novo Autor"} onClose={() => setShowForm(false)} size="md">
          <div className="space-y-4">
            {/* Photo upload */}
            <div className="flex items-center gap-4">
              {photo ? (
                <div className="relative">
                  <img src={photo} alt="Foto" className="w-16 h-16 rounded-2xl object-cover" />
                  <button onClick={() => setPhoto("")} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:border-indigo-400 transition-all">
                  <div className="text-xl">👤</div>
                  <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handlePhoto(f); }} />
                </label>
              )}
              <Input label="URL da Foto" value={photo.startsWith("data:") ? "" : photo} onChange={e => setPhoto(e.target.value)} placeholder="https://..." wrapperClassName="flex-1" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Nome" value={name} onChange={e => setName(e.target.value)} required />
              <Input label="Cargo / Função" value={role} onChange={e => setRole(e.target.value)} placeholder="Ex: CTO, Redator..." />
            </div>

            <Textarea label="Bio" value={bio} onChange={e => setBio(e.target.value)} rows={2} placeholder="Uma breve descrição do autor..." />
            <Input label="LinkedIn" value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." />

            <Button onClick={handleSave} loading={saving} fullWidth>{editing ? "SALVAR" : "CRIAR AUTOR"}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── SubscribersManager ───────────────────────────────────────────────────────

function SubscribersManager() {
  const [subscribers, setSubscribers] = useState<BlogSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (search) params.set("search", search);
      const data = await fetch(`/api/admin/blog/subscribers?${params}`).then(r => r.json());
      setSubscribers(data.subscribers || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch {}
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const handleDelete = async (id: string) => {
    if (!confirm("Remover assinante?")) return;
    await fetch(`/api/admin/blog/subscribers/${id}`, { method: "DELETE" });
    fetch_();
  };

  const exportCSV = () => {
    const rows = [["Email", "Nome", "Ativo", "Data"]];
    subscribers.forEach(s => rows.push([s.email, s.name || "", s.isActive ? "Sim" : "Não", formatDate(s.createdAt)]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "assinantes-blog-develoi.csv";
    a.click();
  };

  return (
    <PanelCard
      title="Assinantes da Newsletter"
      icon={Mail}
      description={`${total} assinante${total !== 1 ? "s" : ""} no total`}
      action={
        <div className="flex gap-3">
          <Input
            iconLeft={<Search className="w-4 h-4" />}
            placeholder="Buscar..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            wrapperClassName="w-48"
          />
          <Button variant="outline" onClick={exportCSV}>Exportar CSV</Button>
        </div>
      }
    >
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : subscribers.length === 0 ? (
        <EmptyState icon={Mail} title="Nenhum assinante" description="Quando alguém se inscrever na newsletter, aparecerá aqui." />
      ) : (
        <div className="space-y-2">
          {subscribers.map(s => (
            <div key={s.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-200 transition-all group">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-xs flex-shrink-0">
                {(s.name || s.email)[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{s.email}</p>
                {s.name && <p className="text-xs text-slate-400">{s.name}</p>}
              </div>
              <Badge color={s.isActive ? "success" : "default"} size="sm">{s.isActive ? "Ativo" : "Inativo"}</Badge>
              <span className="text-xs text-slate-400">{formatDate(s.createdAt)}</span>
              <button
                onClick={() => handleDelete(s.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-2 rounded-xl border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-600">Pág {page} de {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-2 rounded-xl border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </PanelCard>
  );
}
