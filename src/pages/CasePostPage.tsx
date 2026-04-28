import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Eye, Heart, Clock, Calendar, Tag, Share2,
  Linkedin, Twitter, CheckCircle, Star,
  Target, Lightbulb, TrendingUp, Briefcase,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Carousel } from '../components/ui';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Case {
  id: string;
  title: string;
  slug: string;
  client: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  featured: boolean;
  tags?: string;
  views: number;
  likes: number;
  readTimeMinutes: number;
  publishedAt?: string;
  segment?: string;
  services?: string;
  results?: string;
  challenge?: string;
  solution?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  category?: { id: string; name: string; slug: string; color: string };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseTags(tags?: string): string[] {
  if (!tags) return [];
  try { return JSON.parse(tags); } catch { return []; }
}

function parseList(text?: string): string[] {
  if (!text?.trim()) return [];
  return text.split('\n').map(l => l.trim()).filter(Boolean);
}

function formatDate(d?: string) {
  if (!d) return "";
  return format(new Date(d), "d 'de' MMMM, yyyy", { locale: ptBR });
}

// ─── Related Card ─────────────────────────────────────────────────────────────

function RelatedCard({ r }: { r: Case }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/cases/${r.slug}`)}
      className="group cursor-pointer rounded-2xl overflow-hidden pub-surface border hover:border-indigo-500/40 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
    >
      <div className="h-32 relative overflow-hidden">
        {r.coverImage ? (
          <img src={r.coverImage} alt={r.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/50 dark:to-violet-900/50 flex items-center justify-center">
            <span className="text-2xl opacity-20">🚀</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>
      <div className="p-4">
        <p className="text-indigo-600 dark:text-indigo-400 text-[8px] font-black uppercase tracking-widest mb-1">{r.client}</p>
        <h4 className="text-xs font-black pub-text leading-tight line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {r.title}
        </h4>
      </div>
    </div>
  );
}

// ─── Case Post Page ───────────────────────────────────────────────────────────

export default function CasePostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [caseItem, setCaseItem] = useState<Case | null>(null);
  const [related, setRelated] = useState<Case[]>([]);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setProgress(total > 0 ? (scrolled / total) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/cases/${slug}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        setCaseItem(data.case);
        setRelated(data.related || []);
        setLikes(data.case.likes);
        setLoading(false);
        fetch(`/api/cases/${data.case.id}/view`, { method: 'POST' }).catch(() => {});
        if (data.case.seoTitle || data.case.title) {
          document.title = `${data.case.seoTitle || data.case.title} | Develoi Cases`;
        }
      })
      .catch(() => { setLoading(false); navigate('/cases'); });
  }, [slug]);

  const handleLike = async () => {
    if (liked || !caseItem) return;
    setLiked(true);
    setLikes(l => l + 1);
    try {
      const res = await fetch(`/api/cases/${caseItem.id}/like`, { method: 'POST' });
      const data = await res.json();
      setLikes(data.likes);
    } catch { setLikes(l => l - 1); setLiked(false); }
  };

  const handleShare = (platform: 'linkedin' | 'twitter' | 'copy') => {
    const url = window.location.href;
    const text = caseItem?.title || '';
    if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const tags = parseTags(caseItem?.tags);
  const resultsList = parseList(caseItem?.results);
  const servicesList = parseList(caseItem?.services);

  if (loading) {
    return (
      <div className="min-h-screen dash-bg pt-40 px-6 flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!caseItem) return null;

  return (
    <div className="relative min-h-screen dash-bg selection:bg-indigo-500/30 overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[5%] right-[-5%] w-[600px] h-[600px] bg-indigo-500/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-[10%] left-[-5%] w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full" />
      </div>

      {/* Reading progress bar */}
      <div className="fixed top-[72px] left-0 right-0 h-1 z-[60] bg-slate-200 dark:bg-white/5">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="relative z-10">
        {/* Cover Header */}
        <header className="pt-40 pb-20 px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto relative">
            <div className="flex flex-wrap items-center gap-4 mb-10">
              {caseItem.category && (
                <span
                  className="px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-xl"
                  style={{ background: caseItem.category.color, boxShadow: `0 0 20px ${caseItem.category.color}30` }}
                >
                  {caseItem.category.name}
                </span>
              )}
              {caseItem.featured && (
                <span className="flex items-center gap-2 px-5 py-1.5 bg-amber-50 dark:bg-white/5 border border-amber-500/30 rounded-full text-[10px] font-black text-amber-600 dark:text-amber-400">
                  <Star className="w-3 h-3 fill-amber-500" /> CASE EM DESTAQUE
                </span>
              )}
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-8xl font-black mb-12 leading-[0.9] tracking-tighter dash-text max-w-5xl"
            >
              {caseItem.title}
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-10 flex-wrap"
            >
              <div className="space-y-1">
                <p className="text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest">Cliente Parceiro</p>
                <p className="text-2xl font-black pub-text tracking-tight">{caseItem.client}</p>
              </div>
              <div className="w-px h-12 bg-slate-200 dark:bg-white/10 hidden md:block" />
              <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.25em] pub-text-muted flex-wrap">
                {caseItem.segment && <span>{caseItem.segment}</span>}
                <span className="w-1 h-1 rounded-full bg-indigo-400/50" />
                <span>{caseItem.readTimeMinutes} MIN LEITURA</span>
                <span className="w-1 h-1 rounded-full bg-indigo-400/50" />
                <span>{caseItem.views.toLocaleString('pt-BR')} VIEWS</span>
              </div>
            </motion.div>
          </div>
        </header>

        {/* Cover Image */}
        {caseItem.coverImage && (
          <section className="px-6 mb-24 relative">
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1 }}
                className="relative rounded-[3rem] md:rounded-[4rem] overflow-hidden shadow-2xl border pub-surface group"
              >
                <img src={caseItem.coverImage} alt={caseItem.title} className="w-full h-auto max-h-[85vh] object-contain mx-auto transition-all duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />

                {/* Key metrics overlay */}
                {resultsList.length > 0 && (
                  <div className="absolute bottom-10 left-10 right-10 flex flex-wrap gap-4">
                    {resultsList.slice(0, 3).map((res, i) => (
                      <div key={i} className="px-6 py-4 bg-white/90 dark:bg-black/60 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl">
                        <p className="text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-widest mb-1">Métrica Chave</p>
                        <p className="text-lg font-black text-slate-900 dark:text-white">{res}</p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </section>
        )}

        {/* Content Section */}
        <section className="px-6 pb-40">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-20 items-start">

            {/* Content Area */}
            <div ref={contentRef}>
              {/* Executive Summary */}
              {caseItem.excerpt && (
                <div className="mb-20 p-12 pub-surface-2 border-l-4 border-indigo-500 rounded-r-[3rem] relative group overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl" />
                  <p className="text-2xl md:text-3xl font-medium italic pub-text-soft leading-relaxed tracking-tight">
                    "{caseItem.excerpt}"
                  </p>
                </div>
              )}

              {/* Challenge & Solution Grid */}
              {(caseItem.challenge || caseItem.solution) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
                  {caseItem.challenge && (
                    <div className="p-10 pub-surface border rounded-[2.5rem] relative group hover:border-red-400/40 transition-all">
                      <Target className="w-10 h-10 text-red-500 mb-6" />
                      <h3 className="text-xl font-black text-red-600 dark:text-red-400 mb-4 uppercase tracking-tighter">O Desafio</h3>
                      <p className="pub-text-soft leading-relaxed font-medium">{caseItem.challenge}</p>
                    </div>
                  )}
                  {caseItem.solution && (
                    <div className="p-10 pub-surface border rounded-[2.5rem] relative group hover:border-indigo-500/30 transition-all">
                      <Lightbulb className="w-10 h-10 text-indigo-500 mb-6" />
                      <h3 className="text-xl font-black text-indigo-600 dark:text-indigo-400 mb-4 uppercase tracking-tighter">A Solução</h3>
                      <p className="pub-text-soft leading-relaxed font-medium">{caseItem.solution}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Article Content */}
              <article className="case-content prose prose-indigo max-w-none dark:prose-invert">
                {caseItem.content.split(/<div class="develoi-carousel" data-images="([^"]+)"[^>]*>.*?<\/div>/gs).map((part, i) => {
                  if (i % 2 === 1) {
                    const images = part.split(',').filter(u => u.trim());
                    return <Carousel key={i} images={images} />;
                  }
                  return <div key={i} dangerouslySetInnerHTML={{ __html: part }} />;
                })}
              </article>

              {/* Services Tags */}
              {servicesList.length > 0 && (
                <div className="mt-24 p-12 pub-surface-2 border rounded-[3rem] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 blur-[80px]" />
                  <h3 className="text-2xl font-black pub-text mb-8 tracking-tight flex items-center gap-3">
                    <Briefcase className="w-6 h-6 text-indigo-500" /> Expertise Aplicada
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {servicesList.map((s, i) => (
                      <span key={i} className="px-6 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs font-black uppercase tracking-widest rounded-xl">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Interaction Footer */}
              <div className="mt-20 pt-12 border-t border-slate-100 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-10">
                <button
                  onClick={handleLike}
                  disabled={liked}
                  className={`group flex items-center gap-4 px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
                    liked
                      ? 'bg-pink-50 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 border border-pink-300 dark:border-pink-500/30'
                      : 'pub-surface border pub-text-soft hover:text-pink-600 dark:hover:text-pink-400 hover:border-pink-400/40 hover:bg-pink-50 dark:hover:bg-pink-500/5 shadow-xl'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${liked ? 'fill-pink-500' : 'group-hover:scale-125 transition-transform'}`} />
                  {likes} Reconhecimentos {liked && '✓'}
                </button>

                <div className="flex items-center gap-8">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] pub-text-muted">Expandir Impacto:</span>
                  <div className="flex items-center gap-4">
                    {[
                      { name: 'LI', icon: Linkedin, url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}` },
                      { name: 'TW', icon: Twitter, url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}` }
                    ].map(platform => (
                      <button
                        key={platform.name}
                        onClick={() => window.open(platform.url, '_blank')}
                        className="p-4 pub-surface border rounded-xl pub-text-muted transition-all hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400/40 hover:shadow-xl hover:-translate-y-1"
                      >
                        <platform.icon className="w-4 h-4" />
                      </button>
                    ))}
                    <button
                      onClick={() => handleShare('copy')}
                      className={`p-4 border rounded-xl transition-all shadow-xl hover:-translate-y-1 ${copied ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-400 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'pub-surface pub-text-muted hover:text-indigo-600 dark:hover:text-indigo-400'}`}
                    >
                      {copied ? <CheckCircle className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="hidden lg:block sticky top-32 space-y-10">
              <button
                onClick={() => navigate("/cases")}
                className="w-full flex items-center gap-3 px-6 py-4 pub-surface-2 border rounded-2xl text-[10px] font-black uppercase tracking-widest pub-text-soft hover:pub-text hover:border-indigo-500/40 transition-all group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Voltar ao Portfólio
              </button>

              <div className="pub-surface border p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-2xl" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] pub-text-muted mb-10">Briefing do Projeto</h4>

                <div className="space-y-8">
                  {[
                    { label: 'Segmento', value: caseItem.segment, icon: Briefcase },
                    { label: 'Data', value: formatDate(caseItem.publishedAt), icon: Calendar },
                    { label: 'Entrega', value: `${caseItem.readTimeMinutes} min de leitura`, icon: Clock },
                    { label: 'Alcance', value: `${caseItem.views.toLocaleString('pt-BR')} visualizações`, icon: Eye },
                  ].filter(i => i.value).map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-widest pub-text-muted mb-1">{item.label}</p>
                        <p className="text-sm font-black pub-text leading-tight break-words">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-12 p-6 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl shadow-inner group">
                  <Star className="w-8 h-8 text-white/40 mb-4 group-hover:scale-125 group-hover:rotate-12 transition-transform" />
                  <h5 className="text-lg font-black text-white mb-2 leading-tight">Sua visão, nossa execução.</h5>
                  <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest mb-6 opacity-70">Resultados mensuráveis para sua marca.</p>
                  <button
                    onClick={() => navigate('/#contato')}
                    className="w-full py-4 bg-white text-indigo-700 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-50 transition-colors shadow-2xl flex items-center justify-center gap-2"
                  >
                    INICIAR PROJETO <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Related */}
              {related.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] pub-text-muted">Sucessos Similares</h3>
                  <div className="grid grid-cols-1 gap-6">
                    {related.map(r => <RelatedCard key={r.id} r={r} />)}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </section>

        {/* Mobile Related */}
        {related.length > 0 && (
          <section className="lg:hidden px-6 pb-40 border-t border-slate-100 dark:border-white/5 pt-20">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-2xl font-black pub-text mb-10 tracking-tight text-center">MAIS CASES DE SUCESSO</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {related.map(r => <RelatedCard key={r.id} r={r} />)}
              </div>
            </div>
          </section>
        )}
      </div>

      <footer className="relative z-10 py-20 border-t border-slate-100 dark:border-white/5 pub-surface-2 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] pub-text-muted">© 2026 DEVELOI. EXCELÊNCIA EM CADA LINHA.</p>
      </footer>

      <style>{`
        .case-content h2 { font-size: 2.5rem; font-weight: 900; margin-top: 5rem; margin-bottom: 2rem; letter-spacing: -0.05em; line-height: 1.1; }
        .case-content h3 { font-size: 1.75rem; font-weight: 900; margin-top: 3.5rem; margin-bottom: 1.5rem; letter-spacing: -0.03em; line-height: 1.2; }
        .case-content p { font-size: 1.1rem; line-height: 1.8; margin-bottom: 2rem; font-weight: 500; }
        .case-content ul { list-style-type: disc; list-style-position: inside; margin-bottom: 3rem; }
        .case-content ul li { margin-bottom: 0.75rem; font-weight: 500; }
        .case-content blockquote { border-left: 4px solid #6366f1; padding: 2.5rem; border-radius: 0 2rem 2rem 0; font-style: italic; font-size: 1.5rem; margin: 4rem 0; }
        .case-content img { border-radius: 2rem; margin: 5rem 0; width: 100%; }
        .case-content hr { margin: 6rem 0; border-color: #e2e8f0; }
        .dark .case-content hr { border-color: rgba(255,255,255,0.05); }
        .case-content blockquote { background: rgba(99,102,241,0.05); }
      `}</style>
    </div>
  );
}
