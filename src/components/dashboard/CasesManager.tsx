import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart2, FileText, Plus, Search, Edit2, Trash2, Eye, CheckCircle,
  Archive, Star, Tag, Image, Globe, X, Save, ChevronDown, Clock,
  TrendingUp, Heart, Layers, AlertCircle, Upload,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import RichTextEditor from '../ui/RichTextEditor';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Case {
  id: string;
  title: string;
  slug: string;
  client: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  tags?: string;
  views: number;
  likes: number;
  readTimeMinutes: number;
  publishedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  segment?: string;
  services?: string;
  results?: string;
  challenge?: string;
  solution?: string;
  categoryId?: string;
  category?: { id: string; name: string; color: string };
  createdAt: string;
  updatedAt: string;
}

interface CaseCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
  _count?: { cases: number };
}

interface CasesStats {
  total: number;
  published: number;
  draft: number;
  totalViews: number;
  totalLikes: number;
  topCases: Case[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  published: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  draft: 'bg-amber-100 text-amber-700 border-amber-200',
  archived: 'bg-slate-100 text-slate-600 border-slate-200',
};

const STATUS_LABELS: Record<string, string> = {
  published: 'Publicado',
  draft: 'Rascunho',
  archived: 'Arquivado',
};

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f59e0b', '#10b981', '#14b8a6', '#3b82f6',
  '#06b6d4', '#84cc16',
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function CasesManager() {
  const [activeTab, setActiveTab] = useState<'overview' | 'cases' | 'editor' | 'categories'>('overview');
  const [editingCase, setEditingCase] = useState<Case | null>(null);

  const openEditor = (c?: Case) => {
    setEditingCase(c || null);
    setActiveTab('editor');
  };

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart2 },
    { id: 'cases', label: 'Cases', icon: FileText },
    { id: 'editor', label: editingCase ? 'Editando' : 'Novo Case', icon: Plus },
    { id: 'categories', label: 'Categorias', icon: Tag },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Sub Nav */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-2xl p-1 w-fit shadow-sm">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <CasesOverview onNew={() => openEditor()} />
          </motion.div>
        )}
        {activeTab === 'cases' && (
          <motion.div key="cases" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <CasesList onEdit={openEditor} />
          </motion.div>
        )}
        {activeTab === 'editor' && (
          <motion.div key="editor" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <CaseEditor
              caseItem={editingCase}
              onSaved={() => { setEditingCase(null); setActiveTab('cases'); }}
            />
          </motion.div>
        )}
        {activeTab === 'categories' && (
          <motion.div key="categories" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <CategoriesManager />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────────

function CasesOverview({ onNew }: { onNew: () => void }) {
  const [stats, setStats] = useState<CasesStats | null>(null);

  useEffect(() => {
    fetch('/api/admin/cases/stats').then(r => r.json()).then(setStats).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total de Cases', value: stats?.total ?? '—', icon: FileText, color: 'indigo' },
          { label: 'Publicados', value: stats?.published ?? '—', icon: Globe, color: 'emerald' },
          { label: 'Visualizações', value: stats?.totalViews ?? '—', icon: Eye, color: 'blue' },
          { label: 'Curtidas', value: stats?.totalLikes ?? '—', icon: Heart, color: 'pink' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-${s.color}-50`}>
              <s.icon className={`w-5 h-5 text-${s.color}-600`} />
            </div>
            <p className="text-2xl font-black text-slate-900">{s.value}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" /> Cases Mais Vistos
          </h3>
          {stats?.topCases?.length ? (
            <div className="space-y-3">
              {stats.topCases.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-black text-slate-300">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{c.title}</p>
                    <p className="text-[10px] text-slate-400">{c.client}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {c.views}</span>
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {c.likes}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Nenhum case publicado ainda.</p>
          )}
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 shadow-lg text-white flex flex-col justify-between">
          <div>
            <Star className="w-8 h-8 text-white/70 mb-3" />
            <h3 className="text-xl font-black mb-2">Criar Novo Case</h3>
            <p className="text-indigo-200 text-sm leading-relaxed">
              Mostre ao mundo os resultados incríveis que a Develoi entrega. Cada case é uma história de sucesso.
            </p>
          </div>
          <button
            onClick={onNew}
            className="mt-6 bg-white text-indigo-700 font-black text-sm px-6 py-3 rounded-xl hover:bg-indigo-50 transition-colors w-fit"
          >
            + NOVO CASE
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Cases List ───────────────────────────────────────────────────────────────

function CasesList({ onEdit }: { onEdit: (c: Case) => void }) {
  const [cases, setCases] = useState<Case[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/cases?${params}`);
      const data = await res.json();
      setCases(data.cases || []);
      setTotal(data.pagination?.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCases(); }, [page, statusFilter]);
  useEffect(() => {
    const t = setTimeout(fetchCases, 400);
    return () => clearTimeout(t);
  }, [search]);

  const handlePublish = async (id: string) => {
    await fetch(`/api/admin/cases/${id}/publish`, { method: 'PATCH' });
    fetchCases();
  };

  const handleArchive = async (id: string) => {
    await fetch(`/api/admin/cases/${id}/archive`, { method: 'PATCH' });
    fetchCases();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este case permanentemente?')) return;
    setDeleting(id);
    await fetch(`/api/admin/cases/${id}`, { method: 'DELETE' });
    setDeleting(null);
    fetchCases();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar cases..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'published', 'draft', 'archived'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
                statusFilter === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'
              }`}
            >
              {s === 'all' ? 'Todos' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Carregando...</div>
      ) : cases.length === 0 ? (
        <div className="py-20 text-center">
          <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Nenhum case encontrado.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {cases.map(c => (
            <div key={c.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors group">
              {c.coverImage ? (
                <img src={c.coverImage} alt="" className="w-14 h-10 object-cover rounded-lg border border-slate-100 flex-shrink-0" />
              ) : (
                <div className="w-14 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Image className="w-4 h-4 text-slate-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-slate-900 truncate">{c.title}</p>
                  {c.featured && <Star className="w-3 h-3 text-amber-500 flex-shrink-0" />}
                </div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <span className="text-xs text-slate-400">{c.client}</span>
                  {c.category && (
                    <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: c.category.color }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.category.color }} />
                      {c.category.name}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Eye className="w-3 h-3" />{c.views}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Heart className="w-3 h-3" />{c.likes}
                  </span>
                </div>
              </div>

              <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border hidden sm:inline-flex ${STATUS_COLORS[c.status]}`}>
                {STATUS_LABELS[c.status]}
              </span>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {c.status === 'draft' && (
                  <button
                    onClick={() => handlePublish(c.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                    title="Publicar"
                  >
                    <Globe className="w-3.5 h-3.5" />
                  </button>
                )}
                {c.status === 'published' && (
                  <button
                    onClick={() => handleArchive(c.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-all"
                    title="Arquivar"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => onEdit(c)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                  title="Editar"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  disabled={deleting === c.id}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                  title="Excluir"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 15 && (
        <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">{total} cases no total</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 disabled:opacity-40 hover:border-indigo-400 transition-colors">
              Anterior
            </button>
            <button onClick={() => setPage(p => p + 1)} disabled={page * 15 >= total} className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 disabled:opacity-40 hover:border-indigo-400 transition-colors">
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Case Editor ──────────────────────────────────────────────────────────────

function CaseEditor({ caseItem, onSaved }: { caseItem: Case | null; onSaved: () => void }) {
  const isEditing = !!caseItem;
  const [tab, setTab] = useState<'content' | 'details' | 'seo'>('content');

  // Content
  const [title, setTitle] = useState(caseItem?.title || '');
  const [client, setClient] = useState(caseItem?.client || '');
  const [excerpt, setExcerpt] = useState(caseItem?.excerpt || '');
  const [content, setContent] = useState(caseItem?.content || '');
  const [coverImage, setCoverImage] = useState(caseItem?.coverImage || '');
  const [coverImageURL, setCoverImageURL] = useState('');
  const [status, setStatus] = useState(caseItem?.status || 'draft');
  const [featured, setFeatured] = useState(caseItem?.featured || false);
  const [categoryId, setCategoryId] = useState(caseItem?.categoryId || '');
  const [tags, setTags] = useState(() => {
    if (!caseItem?.tags) return '';
    try { return JSON.parse(caseItem.tags).join(', '); } catch { return caseItem.tags; }
  });

  // Details
  const [segment, setSegment] = useState(caseItem?.segment || '');
  const [services, setServices] = useState(caseItem?.services || '');
  const [results, setResults] = useState(caseItem?.results || '');
  const [challenge, setChallenge] = useState(caseItem?.challenge || '');
  const [solution, setSolution] = useState(caseItem?.solution || '');

  // SEO
  const [seoTitle, setSeoTitle] = useState(caseItem?.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(caseItem?.seoDescription || '');
  const [seoKeywords, setSeoKeywords] = useState(caseItem?.seoKeywords || '');

  const [categories, setCategories] = useState<CaseCategory[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/admin/cases-categories').then(r => r.json()).then(setCategories).catch(console.error);
  }, []);

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCoverImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const wordCount = content.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.round(wordCount / 200));

  const handleSave = async (publishNow = false) => {
    if (!title.trim() || !content.trim()) { setError('Título e conteúdo são obrigatórios.'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        title, client, excerpt, content,
        coverImage: coverImage || (coverImageURL || undefined),
        status: publishNow ? 'published' : status,
        featured, categoryId: categoryId || null,
        tags: tags ? JSON.stringify(tags.split(',').map(t => t.trim()).filter(Boolean)) : '[]',
        segment, services, results, challenge, solution,
        seoTitle, seoDescription, seoKeywords,
      };
      const url = isEditing ? `/api/admin/cases/${caseItem.id}` : '/api/admin/cases';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error((await res.json()).error || 'Erro ao salvar');
      onSaved();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
      {/* Main Panel */}
      <div className="space-y-4">
        {/* Tab nav */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
          {(['content', 'details', 'seo'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                tab === t ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {t === 'content' ? 'Conteúdo' : t === 'details' ? 'Detalhes' : 'SEO'}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {tab === 'content' && (
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Título do Case *</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Como a Empresa X aumentou 300% nas conversões"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-900 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Cliente *</label>
                  <input
                    value={client}
                    onChange={e => setClient(e.target.value)}
                    placeholder="Nome do cliente"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Tags (separadas por vírgula)</label>
                  <input
                    value={tags}
                    onChange={e => setTags(e.target.value)}
                    placeholder="e-commerce, growth, SEO"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Resumo / Excerpt</label>
                <textarea
                  value={excerpt}
                  onChange={e => setExcerpt(e.target.value)}
                  placeholder="Uma descrição curta que aparece nos cards e listagens..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Cover Image */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Imagem de Capa</label>
                {coverImage ? (
                  <div className="relative group">
                    <img src={coverImage} alt="Capa" className="w-full max-h-48 object-cover rounded-xl border border-slate-200" />
                    <button
                      onClick={() => setCoverImage('')}
                      className="absolute top-2 right-2 p-1 bg-black/60 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group"
                    >
                      <Upload className="w-6 h-6 text-slate-300 group-hover:text-indigo-500 mx-auto mb-2 transition-colors" />
                      <p className="text-xs font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">Clique para fazer upload da imagem</p>
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={coverImageURL}
                        onChange={e => setCoverImageURL(e.target.value)}
                        placeholder="Ou cole uma URL de imagem..."
                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400"
                      />
                      {coverImageURL && (
                        <button
                          onClick={() => { setCoverImage(coverImageURL); setCoverImageURL(''); }}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
                        >
                          Usar
                        </button>
                      )}
                    </div>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
              </div>

              {/* Rich Text Editor */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Conteúdo Principal *</label>
                <RichTextEditor value={content} onChange={setContent} placeholder="Escreva o conteúdo completo do case..." />
              </div>
            </div>
          )}

          {tab === 'details' && (
            <div className="p-6 space-y-5">
              <p className="text-sm text-slate-500">Detalhes específicos do case que enriquecem a apresentação ao cliente.</p>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Segmento / Mercado</label>
                <input
                  value={segment}
                  onChange={e => setSegment(e.target.value)}
                  placeholder="Ex: E-commerce, Saúde, Educação, Indústria..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Serviços Prestados</label>
                <textarea
                  value={services}
                  onChange={e => setServices(e.target.value)}
                  placeholder="Ex: Desenvolvimento de sistema, UX/UI, Consultoria técnica..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">O Desafio</label>
                <textarea
                  value={challenge}
                  onChange={e => setChallenge(e.target.value)}
                  placeholder="Descreva o problema ou desafio enfrentado pelo cliente..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">A Solução</label>
                <textarea
                  value={solution}
                  onChange={e => setSolution(e.target.value)}
                  placeholder="Como a Develoi resolveu o problema..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Resultados Alcançados</label>
                <textarea
                  value={results}
                  onChange={e => setResults(e.target.value)}
                  placeholder="Ex: 300% aumento nas conversões, 2x mais tráfego orgânico, ROI de R$ 500mil..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
          )}

          {tab === 'seo' && (
            <div className="p-6 space-y-5">
              <p className="text-sm text-slate-500">Otimize este case para os motores de busca.</p>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Título SEO</label>
                <input
                  value={seoTitle}
                  onChange={e => setSeoTitle(e.target.value)}
                  placeholder="Título para motores de busca (máx. 60 caracteres)"
                  maxLength={60}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                <p className="text-[10px] text-slate-400 mt-1">{seoTitle.length}/60 caracteres</p>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Meta Description</label>
                <textarea
                  value={seoDescription}
                  onChange={e => setSeoDescription(e.target.value)}
                  placeholder="Descrição para motores de busca (máx. 160 caracteres)"
                  maxLength={160}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                <p className="text-[10px] text-slate-400 mt-1">{seoDescription.length}/160 caracteres</p>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Palavras-chave (Keywords)</label>
                <input
                  value={seoKeywords}
                  onChange={e => setSeoKeywords(e.target.value)}
                  placeholder="case de sucesso, develoi, marketing digital..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-500 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{error}</p>}
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Stats */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Estatísticas</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 flex items-center gap-1.5"><FileText className="w-3 h-3" /> Palavras</span>
              <span className="text-xs font-black text-slate-900">{wordCount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 flex items-center gap-1.5"><Clock className="w-3 h-3" /> Leitura</span>
              <span className="text-xs font-black text-slate-900">{readTime} min</span>
            </div>
            {isEditing && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 flex items-center gap-1.5"><Eye className="w-3 h-3" /> Views</span>
                  <span className="text-xs font-black text-slate-900">{caseItem.views}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 flex items-center gap-1.5"><Heart className="w-3 h-3" /> Curtidas</span>
                  <span className="text-xs font-black text-slate-900">{caseItem.likes}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Configurações</h3>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-400"
            >
              <option value="draft">Rascunho</option>
              <option value="published">Publicado</option>
              <option value="archived">Arquivado</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Categoria</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400"
            >
              <option value="">Sem categoria</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-3 cursor-pointer p-3 bg-amber-50 rounded-xl border border-amber-100">
            <input
              type="checkbox"
              checked={featured}
              onChange={e => setFeatured(e.target.checked)}
              className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
            />
            <div>
              <p className="text-xs font-black text-amber-800">Case Destaque</p>
              <p className="text-[10px] text-amber-600">Aparece na seção em destaque</p>
            </div>
          </label>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Globe className="w-4 h-4" />
            {saving ? 'SALVANDO...' : 'PUBLICAR AGORA'}
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'SALVANDO...' : isEditing ? 'SALVAR ALTERAÇÕES' : 'SALVAR RASCUNHO'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Categories Manager ────────────────────────────────────────────────────────

function CategoriesManager() {
  const [categories, setCategories] = useState<CaseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CaseCategory | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchCategories = () => {
    fetch('/api/admin/cases-categories').then(r => r.json()).then(data => {
      setCategories(data);
      setLoading(false);
    }).catch(console.error);
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => {
    setEditing(null); setName(''); setColor('#6366f1'); setSortOrder(0); setIsActive(true); setShowForm(true);
  };
  const openEdit = (cat: CaseCategory) => {
    setEditing(cat); setName(cat.name); setColor(cat.color); setSortOrder(cat.sortOrder); setIsActive(cat.isActive); setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await fetch(`/api/admin/cases-categories/${editing.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, color, sortOrder, isActive }),
        });
      } else {
        await fetch('/api/admin/cases-categories', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, color, sortOrder, isActive }),
        });
      }
      setShowForm(false);
      fetchCategories();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir categoria? Os cases desta categoria ficarão sem categoria.')) return;
    await fetch(`/api/admin/cases-categories/${id}`, { method: 'DELETE' });
    fetchCategories();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-slate-900">Categorias de Cases</h3>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Nova Categoria
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-indigo-200 shadow-md p-6 space-y-4">
          <h4 className="font-bold text-slate-900">{editing ? 'Editar Categoria' : 'Nova Categoria'}</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Nome *</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Marketing Digital"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Ordem</label>
              <input
                type="number"
                value={sortOrder}
                onChange={e => setSortOrder(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Cor</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-xl border-2 transition-transform hover:scale-110"
                  style={{ background: c, borderColor: color === c ? 'white' : c, boxShadow: color === c ? `0 0 0 2px ${c}` : 'none' }}
                />
              ))}
              <div className="flex items-center gap-2">
                <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-8 h-8 rounded-xl cursor-pointer border border-slate-200" />
                <span className="text-xs text-slate-400 font-mono">{color}</span>
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="rounded text-indigo-600" />
            <span className="text-sm font-bold text-slate-700">Categoria ativa</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-6 py-2.5 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-400 text-center py-8">Carregando...</p>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center">
          <Tag className="w-8 h-8 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Nenhuma categoria criada ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4 group">
              <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ background: cat.color + '20', border: `2px solid ${cat.color}` }}>
                <div className="w-full h-full rounded-xl flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full" style={{ background: cat.color }} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 text-sm truncate">{cat.name}</p>
                <p className="text-[10px] text-slate-400">{cat._count?.cases || 0} cases</p>
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
    </div>
  );
}
