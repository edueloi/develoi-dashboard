import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Eye, Heart, Clock, Calendar, Tag, Share2,
  Linkedin, Twitter, CheckCircle, ChevronRight, Star,
  Target, Lightbulb, TrendingUp, Briefcase,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Carousel } from '../components/ui';
import { useTheme } from '../contexts/ThemeContext';

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

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar({ readProgress }: { readProgress: number }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'dash-surface/90 backdrop-blur-xl border-b dash-border shadow-2xl' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">D</span>
          </div>
          <span className="font-black text-indigo-600 text-lg tracking-tight">DEVELOI</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/" className="dash-text-2 hover:dash-text text-sm font-medium transition-colors">Home</Link>
          <Link to="/blog" className="dash-text-2 hover:dash-text text-sm font-medium transition-colors">Blog</Link>
          <Link to="/cases" className="dash-text-2 hover:dash-text text-sm font-medium transition-colors">Cases</Link>
        </div>
      </div>
      {/* Progress bar */}
      <div
        className="h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 transition-all duration-150 origin-left"
        style={{ transform: `scaleX(${readProgress / 100})` }}
      />
    </nav>
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
  const [readProgress, setReadProgress] = useState(0);
  const { theme, isDark } = useTheme();
  const contentRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Read progress
  useEffect(() => {
    const onScroll = () => {
      const el = contentRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight;
      const scrolled = Math.max(0, -rect.top);
      setReadProgress(Math.min(100, (scrolled / total) * 100));
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Fetch case
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
        // Register view
        fetch(`/api/cases/${data.case.id}/view`, { method: 'POST' }).catch(() => {});
        // SEO
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
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!caseItem) return null;

  return (
    <div className={`min-h-screen dash-bg dash-text transition-colors duration-500 ${isDark ? 'dark' : ''}`}>
      <Navbar readProgress={readProgress} />

      {/* Cover */}
      <div className="relative pt-16 h-[55vh] min-h-[360px] overflow-hidden">
        {caseItem.coverImage ? (
          <img src={caseItem.coverImage} alt={caseItem.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-violet-950" />
        )}
        <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-[#0a0a0f] via-[#0a0a0f]/60' : 'from-[#f8fafc] via-[#f8fafc]/40'} to-transparent`} />

        {/* Breadcrumb */}
        <div className="absolute top-20 left-0 right-0 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 text-xs dash-text-muted font-medium">
              <Link to="/" className="hover:dash-text transition-colors">Home</Link>
              <ChevronRight className="w-3 h-3" />
              <Link to="/cases" className="hover:dash-text transition-colors">Cases</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="dash-text-2 truncate max-w-[200px]">{caseItem.title}</span>
            </div>
          </div>
        </div>

        {/* Header text */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {caseItem.category && (
                <span
                  className="px-3 py-1 rounded-xl text-[10px] font-black text-white"
                  style={{ background: caseItem.category.color + '30', border: `1px solid ${caseItem.category.color}50`, color: caseItem.category.color }}
                >
                  {caseItem.category.name}
                </span>
              )}
              {caseItem.featured && (
                <span className="flex items-center gap-1 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-xl text-[10px] font-black text-amber-400">
                  <Star className="w-2.5 h-2.5" /> DESTAQUE
                </span>
              )}
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-5xl font-black dash-text leading-tight max-w-4xl mb-4"
            >
              {caseItem.title}
            </motion.h1>

            <div className="flex flex-wrap items-center gap-5 text-sm dash-text-2">
              <span className="font-bold text-indigo-600">{caseItem.client}</span>
              {caseItem.segment && <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {caseItem.segment}</span>}
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {caseItem.readTimeMinutes} min de leitura</span>
              <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {caseItem.views} visualizações</span>
              {caseItem.publishedAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(new Date(caseItem.publishedAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-12">

          {/* Main Content */}
          <div ref={contentRef}>
            {/* Excerpt */}
            {caseItem.excerpt && (
              <div className="border-l-4 border-indigo-500 pl-6 mb-10">
                <p className="dash-text-2 text-lg leading-relaxed italic">{caseItem.excerpt}</p>
              </div>
            )}

            {/* Highlight Cards */}
            {(caseItem.challenge || caseItem.solution || resultsList.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                {caseItem.challenge && (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-red-400" />
                      <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">O Desafio</span>
                    </div>
                    <p className="dash-text-2 text-sm leading-relaxed">{caseItem.challenge}</p>
                  </div>
                )}
                {caseItem.solution && (
                  <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="w-4 h-4 text-indigo-400" />
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">A Solução</span>
                    </div>
                    <p className="dash-text-2 text-sm leading-relaxed">{caseItem.solution}</p>
                  </div>
                )}
                {resultsList.length > 0 && (
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Resultados</span>
                    </div>
                    <ul className="space-y-2">
                      {resultsList.slice(0, 4).map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm dash-text-2">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Article Content */}
            <article className="case-content prose prose-invert max-w-none">
              {caseItem.content.split(/<div class="develoi-carousel" data-images="([^"]+)"[^>]*>.*?<\/div>/gs).map((part, i) => {
                if (i % 2 === 1) {
                  const images = part.split(',').filter(u => u.trim());
                  return <Carousel key={i} images={images} />;
                }
                return <div key={i} dangerouslySetInnerHTML={{ __html: part }} />;
              })}
            </article>

            {/* Services */}
            {servicesList.length > 0 && (
              <div className="mt-10 p-6 dash-surface border dash-border rounded-2xl">
                <h3 className="font-black dash-text mb-4 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-500" /> Serviços Prestados
                </h3>
                <div className="flex flex-wrap gap-2">
                  {servicesList.map((s, i) => (
                    <span key={i} className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-xs font-bold rounded-xl">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-8">
                <Tag className="w-4 h-4 dash-text-muted flex-shrink-0 mt-0.5" />
                {tags.map((tag, i) => (
                  <span key={i} className="text-[10px] font-bold px-2.5 py-1 dash-surface dash-text-muted rounded-lg border dash-border uppercase">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Like & Share */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-12 pt-8 border-t border-white/10">
              <button
                onClick={handleLike}
                disabled={liked}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
                  liked
                    ? 'bg-pink-500/10 text-pink-500 border border-pink-500/20 cursor-default'
                    : 'dash-surface dash-text-2 border dash-border hover:bg-pink-500/5 hover:text-pink-500 hover:border-pink-500/20'
                }`}
              >
                <Heart className={`w-4 h-4 ${liked ? 'fill-pink-500' : ''}`} />
                {likes} curtidas {liked && '— Obrigado!'}
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs dash-text-muted font-bold">COMPARTILHAR:</span>
                <button onClick={() => handleShare('linkedin')} className="p-2.5 dash-surface border dash-border rounded-xl dash-text-muted hover:text-[#0077B5] hover:border-[#0077B5]/30 hover:bg-[#0077B5]/10 transition-all">
                  <Linkedin className="w-4 h-4" />
                </button>
                <button onClick={() => handleShare('twitter')} className="p-2.5 dash-surface border dash-border rounded-xl dash-text-muted hover:text-sky-500 hover:border-sky-500/30 hover:bg-sky-500/10 transition-all">
                  <Twitter className="w-4 h-4" />
                </button>
                <button onClick={() => handleShare('copy')} className={`p-2.5 border rounded-xl transition-all ${copied ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'dash-surface border dash-border dash-text-muted hover:bg-zinc-100 dark:hover:bg-white/5 hover:dash-text'}`}>
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Related */}
            {related.length > 0 && (
              <div className="mt-14">
                <h3 className="font-black dash-text text-lg mb-6">Cases Relacionados</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {related.map(r => (
                    <Link key={r.id} to={`/cases/${r.slug}`} className="group block">
                      <div className="dash-surface border dash-border rounded-2xl overflow-hidden hover:border-indigo-500/40 transition-all">
                        <div className="h-32 relative overflow-hidden">
                          {r.coverImage ? (
                            <img src={r.coverImage} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/50 dark:to-violet-900/50" />
                          )}
                          <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-black/50' : 'from-white/50'} to-transparent`} />
                        </div>
                        <div className="p-4">
                          <p className="text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-widest mb-1">{r.client}</p>
                          <p className="dash-text text-sm font-bold line-clamp-2 group-hover:text-indigo-500 transition-colors">{r.title}</p>
                          <p className="text-indigo-600 dark:text-indigo-400 text-xs font-bold mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            Leia mais <ChevronRight className="w-3 h-3" />
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden xl:block space-y-6">
            {/* Stats */}
            <div className="sticky top-24 space-y-4">
              <div className="dash-surface border dash-border rounded-2xl p-5 space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest dash-text-muted">Sobre este Case</h4>
                <div className="space-y-3">
                  {[
                    { label: 'Cliente', value: caseItem.client, icon: Briefcase },
                    { label: 'Segmento', value: caseItem.segment, icon: Tag },
                    { label: 'Leitura', value: `${caseItem.readTimeMinutes} minutos`, icon: Clock },
                    { label: 'Visualizações', value: caseItem.views.toString(), icon: Eye },
                    { label: 'Curtidas', value: likes.toString(), icon: Heart },
                    ...(caseItem.publishedAt ? [{ label: 'Publicado em', value: format(new Date(caseItem.publishedAt), "d 'de' MMM, yyyy", { locale: ptBR }), icon: Calendar }] : []),
                  ].filter(i => i.value).map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <item.icon className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-widest dash-text-muted">{item.label}</p>
                        <p className="text-xs font-bold dash-text-2 break-words">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white">
                <Star className="w-6 h-6 text-white/60 mb-3" />
                <h4 className="font-black text-base mb-2">Quer resultados assim?</h4>
                <p className="text-indigo-200 text-xs leading-relaxed mb-4">
                  Vamos criar juntos a próxima história de sucesso da sua empresa.
                </p>
                <a
                  href="/#contato"
                  className="block text-center bg-white text-indigo-700 font-black text-xs px-4 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors"
                >
                  FALAR COM A DEVELOI
                </a>
              </div>

              {/* Back */}
              <Link
                to="/cases"
                className="flex items-center gap-2 dash-text-muted hover:dash-text text-xs font-bold transition-colors px-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Ver todos os cases
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Global case content styles */}
      <style>{`
        .case-content h2 { font-size: 1.5rem; font-weight: 900; color: var(--text-primary); margin: 2rem 0 1rem; }
        .case-content h3 { font-size: 1.2rem; font-weight: 800; color: var(--text-secondary); margin: 1.5rem 0 0.75rem; }
        .case-content p { color: var(--text-secondary); line-height: 1.8; margin-bottom: 1rem; font-size: 0.95rem; }
        .case-content ul { list-style: none; padding: 0; margin-bottom: 1rem; }
        .case-content ul li { color: var(--text-secondary); padding: 0.25rem 0 0.25rem 1.5rem; position: relative; font-size: 0.9rem; line-height: 1.7; }
        .case-content ul li::before { content: ''; position: absolute; left: 0; top: 0.65rem; width: 6px; height: 6px; border-radius: 50%; background: #6366f1; }
        .case-content ol { padding-left: 1.5rem; margin-bottom: 1rem; }
        .case-content ol li { color: var(--text-secondary); margin-bottom: 0.5rem; font-size: 0.9rem; line-height: 1.7; }
        .case-content strong { color: var(--text-primary); font-weight: 700; }
        .case-content a { color: #6366f1; text-decoration: underline; }
        .case-content blockquote { border-left: 3px solid #6366f1; padding-left: 1rem; margin: 1.5rem 0; color: var(--text-muted); font-style: italic; }
        .case-content img { border-radius: 12px; max-width: 100%; margin: 1.5rem 0; border: 1px solid var(--border-color); }
        .case-content code { background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2); color: #6366f1; padding: 0.15rem 0.4rem; border-radius: 6px; font-size: 0.85em; }
        .case-content pre { background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 12px; padding: 1rem; overflow-x: auto; margin: 1.5rem 0; }
        .case-content pre code { background: none; border: none; padding: 0; color: var(--text-secondary); }
      `}</style>
    </div>
  );
}
