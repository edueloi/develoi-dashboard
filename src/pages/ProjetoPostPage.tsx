import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye, Heart, Clock, Calendar, Share2, Linkedin, Twitter, CheckCircle, Star, Target, Lightbulb, Briefcase, Folder } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Carousel } from '../components/ui';

interface Case {
  id: string; title: string; slug: string; client: string; excerpt?: string; content: string;
  coverImage?: string; featured: boolean; tags?: string; views: number; likes: number;
  readTimeMinutes: number; publishedAt?: string; segment?: string; services?: string;
  results?: string; challenge?: string; solution?: string; seoTitle?: string; seoDescription?: string;
  category?: { id: string; name: string; slug: string; color: string };
}

function parseTags(t?: string): string[] { if (!t) return []; try { return JSON.parse(t); } catch { return []; } }
function parseList(t?: string): string[] { if (!t?.trim()) return []; return t.split('\n').map(l => l.trim()).filter(Boolean); }
function formatDate(d?: string) { if (!d) return ''; return format(new Date(d), "d 'de' MMMM, yyyy", { locale: ptBR }); }

function RelatedCard({ r }: { r: Case }) {
  const navigate = useNavigate();
  return (
    <div onClick={() => navigate(`/projetos/${r.slug}`)} className="group cursor-pointer bg-white rounded-2xl border overflow-hidden transition-all duration-250 hover:-translate-y-1"
      style={{ borderColor: 'var(--border-color)', boxShadow: '0 2px 8px rgba(13,31,78,0.05)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,154,42,0.35)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)'; }}>
      <div className="h-28 relative overflow-hidden">
        {r.coverImage
          ? <img src={r.coverImage} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#06112B,#0D1F4E)' }}><Folder className="w-8 h-8" style={{ color: 'rgba(196,154,42,0.3)' }} /></div>
        }
      </div>
      <div className="p-4">
        <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--brand-gold)' }}>{r.client}</p>
        <h4 className="text-xs font-black leading-snug line-clamp-2" style={{ color: 'var(--brand-navy)' }}>{r.title}</h4>
      </div>
    </div>
  );
}

export default function ProjetoPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [caseItem, setCaseItem] = useState<Case | null>(null);
  const [related, setRelated] = useState<Case[]>([]);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      setProgress(el.scrollHeight - el.clientHeight > 0 ? (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/cases/${slug}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        setCaseItem(data.case); setRelated(data.related || []); setLikes(data.case.likes); setLoading(false);
        fetch(`/api/cases/${data.case.id}/view`, { method: 'POST' }).catch(() => {});
        if (data.case.seoTitle || data.case.title) document.title = `${data.case.seoTitle || data.case.title} | Develoi Projetos`;
      })
      .catch(() => { setLoading(false); navigate('/projetos'); });
  }, [slug]);

  const handleLike = async () => {
    if (liked || !caseItem) return;
    setLiked(true); setLikes(l => l + 1);
    try { const res = await fetch(`/api/cases/${caseItem.id}/like`, { method: 'POST' }); const d = await res.json(); setLikes(d.likes); }
    catch { setLikes(l => l - 1); setLiked(false); }
  };

  const handleShare = (platform: 'linkedin' | 'twitter' | 'copy') => {
    const url = window.location.href;
    if (platform === 'linkedin') window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    else if (platform === 'twitter') window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`, '_blank');
    else { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const resultsList = parseList(caseItem?.results);
  const servicesList = parseList(caseItem?.services);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center pt-40" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--brand-gold)', borderTopColor: 'transparent' }} />
    </div>
  );

  if (!caseItem) return null;

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
      <section className="relative pt-32 pb-20 overflow-hidden" style={{ background: 'linear-gradient(135deg,#06112B 0%,#0D1F4E 60%,#0A1840 100%)' }}>
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg,var(--brand-gold),rgba(196,154,42,0.3) 60%,transparent)' }} />
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          {/* Category + featured */}
          <div className="flex flex-wrap gap-3 mb-8">
            {caseItem.category && (
              <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white" style={{ background: caseItem.category.color }}>
                {caseItem.category.name}
              </span>
            )}
            {caseItem.featured && (
              <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest" style={{ background: 'rgba(196,154,42,0.15)', color: 'var(--brand-gold)', border: '1px solid rgba(196,154,42,0.3)' }}>
                <Star className="w-3 h-3" /> Projeto em Destaque
              </span>
            )}
          </div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="font-black text-white leading-[1.05] tracking-tight mb-8" style={{ fontSize: 'clamp(2rem,5vw,3.8rem)' }}>
            {caseItem.title}
          </motion.h1>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="flex items-center gap-8 flex-wrap">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: 'rgba(196,154,42,0.7)' }}>Cliente Parceiro</p>
              <p className="text-xl font-black text-white">{caseItem.client}</p>
            </div>
            <div className="w-px h-10 hidden md:block" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <div className="flex items-center gap-5 text-[10px] font-bold uppercase tracking-widest flex-wrap" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {caseItem.segment && <span>{caseItem.segment}</span>}
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {caseItem.readTimeMinutes} min</span>
              <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> {caseItem.views.toLocaleString('pt-BR')} views</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Cover Image */}
      {caseItem.coverImage && (
        <section className="px-6 sm:px-8 lg:px-12 py-12">
          <div className="max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}
              className="relative rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--border-color)', boxShadow: '0 16px 60px rgba(13,31,78,0.12)' }}>
              <img src={caseItem.coverImage} alt={caseItem.title} className="w-full h-auto max-h-[80vh] object-contain mx-auto" style={{ background: 'var(--bg-tertiary)' }} />
              {resultsList.length > 0 && (
                <div className="absolute bottom-6 left-6 right-6 flex flex-wrap gap-3">
                  {resultsList.slice(0, 3).map((res, i) => (
                    <div key={i} className="px-5 py-3 rounded-xl backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.92)', boxShadow: '0 4px 16px rgba(13,31,78,0.15)' }}>
                      <p className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: 'var(--brand-gold)' }}>Resultado</p>
                      <p className="text-sm font-black" style={{ color: 'var(--brand-navy)' }}>{res}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </section>
      )}

      {/* Main content */}
      <section className="pb-24 px-6 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-16 items-start">

          {/* Content */}
          <div>
            {/* Excerpt */}
            {caseItem.excerpt && (
              <div className="mb-12 p-8 rounded-2xl relative overflow-hidden" style={{ background: 'var(--bg-tertiary)', borderLeft: '4px solid var(--brand-gold)' }}>
                <p className="text-lg md:text-xl font-medium italic leading-relaxed" style={{ color: 'var(--brand-navy)' }}>
                  "{caseItem.excerpt}"
                </p>
              </div>
            )}

            {/* Challenge & Solution */}
            {(caseItem.challenge || caseItem.solution) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
                {caseItem.challenge && (
                  <div className="bg-white rounded-2xl p-7 border transition-all" style={{ borderColor: 'var(--border-color)', boxShadow: '0 2px 12px rgba(13,31,78,0.05)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(220,38,38,0.3)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)'; }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(220,38,38,0.08)' }}>
                      <Target className="w-5 h-5" style={{ color: '#dc2626' }} />
                    </div>
                    <h3 className="font-black text-sm uppercase tracking-widest mb-3" style={{ color: '#dc2626' }}>O Desafio</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{caseItem.challenge}</p>
                  </div>
                )}
                {caseItem.solution && (
                  <div className="bg-white rounded-2xl p-7 border transition-all" style={{ borderColor: 'var(--border-color)', boxShadow: '0 2px 12px rgba(13,31,78,0.05)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,154,42,0.35)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)'; }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(196,154,42,0.1)' }}>
                      <Lightbulb className="w-5 h-5" style={{ color: 'var(--brand-gold)' }} />
                    </div>
                    <h3 className="font-black text-sm uppercase tracking-widest mb-3" style={{ color: 'var(--brand-gold)' }}>A Solução</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{caseItem.solution}</p>
                  </div>
                )}
              </div>
            )}

            {/* Article */}
            <article className="case-content">
              {caseItem.content.split(/<div class="develoi-carousel" data-images="([^"]+)"[^>]*>.*?<\/div>/gs).map((part, i) => {
                if (i % 2 === 1) { const images = part.split(',').filter(u => u.trim()); return <Carousel key={i} images={images} />; }
                return <div key={i} dangerouslySetInnerHTML={{ __html: part }} />;
              })}
            </article>

            {/* Services */}
            {servicesList.length > 0 && (
              <div className="mt-12 p-8 bg-white rounded-2xl border" style={{ borderColor: 'var(--border-color)', boxShadow: '0 2px 12px rgba(13,31,78,0.05)' }}>
                <div className="flex items-center gap-2 mb-5">
                  <span className="w-4 h-[2px] rounded-full" style={{ background: 'var(--brand-gold)' }} />
                  <h3 className="font-black text-sm uppercase tracking-widest" style={{ color: 'var(--brand-navy)' }}>Expertise Aplicada</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {servicesList.map((s, i) => (
                    <span key={i} className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest"
                      style={{ background: 'var(--bg-tertiary)', color: 'var(--brand-navy)', border: '1px solid var(--border-color)' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Like + Share */}
            <div className="mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-6" style={{ borderTop: '1px solid var(--border-color)' }}>
              <button onClick={handleLike} disabled={liked}
                className="flex items-center gap-3 px-7 py-3.5 rounded-xl font-black text-sm uppercase tracking-widest transition-all"
                style={liked
                  ? { background: 'rgba(236,72,153,0.08)', color: '#db2777', border: '1px solid rgba(236,72,153,0.3)' }
                  : { background: 'var(--bg-tertiary)', color: 'var(--brand-navy)', border: '1px solid var(--border-color)' }}>
                <Heart className={`w-4 h-4 ${liked ? 'fill-pink-500' : ''}`} style={{ color: liked ? '#db2777' : 'inherit' }} />
                {likes} Reconhecimentos {liked && '✓'}
              </button>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Compartilhar:</span>
                {[
                  { name: 'LI', icon: Linkedin, action: () => handleShare('linkedin') },
                  { name: 'TW', icon: Twitter, action: () => handleShare('twitter') },
                ].map(p => (
                  <button key={p.name} onClick={p.action}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-white border transition-all hover:-translate-y-px"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--brand-navy)' }}>
                    <p.icon className="w-4 h-4" />
                  </button>
                ))}
                <button onClick={() => handleShare('copy')}
                  className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all hover:-translate-y-px"
                  style={copied
                    ? { background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.4)', color: '#10b981' }
                    : { background: 'white', borderColor: 'var(--border-color)', color: 'var(--brand-navy)' }}>
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block sticky top-28 space-y-6">
            {/* Back */}
            <button onClick={() => navigate('/projetos')}
              className="w-full flex items-center gap-3 px-5 py-3.5 bg-white rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all hover:-translate-y-px group"
              style={{ borderColor: 'var(--border-color)', color: 'var(--brand-navy)', boxShadow: '0 2px 8px rgba(13,31,78,0.05)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,154,42,0.4)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)'; }}>
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Voltar aos Projetos
            </button>

            {/* Briefing */}
            <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: 'var(--border-color)', boxShadow: '0 4px 20px rgba(13,31,78,0.07)' }}>
              <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl" style={{ background: 'linear-gradient(90deg,var(--brand-gold),rgba(196,154,42,0.2))' }} />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-6" style={{ color: 'var(--text-muted)' }}>Briefing do Projeto</p>
              <div className="space-y-5">
                {[
                  { label: 'Segmento', value: caseItem.segment, icon: Briefcase },
                  { label: 'Data', value: formatDate(caseItem.publishedAt), icon: Calendar },
                  { label: 'Entrega', value: `${caseItem.readTimeMinutes} min de leitura`, icon: Clock },
                  { label: 'Alcance', value: `${caseItem.views.toLocaleString('pt-BR')} visualizações`, icon: Eye },
                ].filter(i => i.value).map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-tertiary)' }}>
                      <item.icon className="w-4 h-4" style={{ color: 'var(--brand-navy)' }} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
                      <p className="text-sm font-black leading-tight" style={{ color: 'var(--brand-navy)' }}>{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA navy */}
              <div className="mt-6 rounded-2xl overflow-hidden relative" style={{ background: 'linear-gradient(135deg,#06112B 0%,#0D1F4E 100%)' }}>
                <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg,var(--brand-gold),rgba(196,154,42,0.2))' }} />
                <div className="p-6">
                  <Star className="w-6 h-6 mb-3" style={{ color: 'rgba(196,154,42,0.5)' }} />
                  <h5 className="font-black text-white text-sm mb-1 tracking-tight">Sua visão, nossa execução.</h5>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-5" style={{ color: 'rgba(255,255,255,0.35)' }}>Resultados mensuráveis para sua marca.</p>
                  <button onClick={() => navigate('/#contato')}
                    className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
                    style={{ background: 'var(--brand-gold)', color: '#06112B' }}>
                    INICIAR PROJETO <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Related */}
            {related.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-4" style={{ color: 'var(--text-muted)' }}>Projetos Similares</p>
                <div className="grid gap-4">
                  {related.map(r => <RelatedCard key={r.id} r={r} />)}
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
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--brand-gold)' }}>Mais Projetos</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {related.map(r => <RelatedCard key={r.id} r={r} />)}
            </div>
          </div>
        </section>
      )}

      <style>{`
        .case-content h2 { font-size: clamp(1.5rem,3vw,2.2rem); font-weight:900; margin-top:3rem; margin-bottom:1.5rem; letter-spacing:-0.04em; line-height:1.1; color:var(--brand-navy); }
        .case-content h3 { font-size: clamp(1.2rem,2.5vw,1.7rem); font-weight:900; margin-top:2.5rem; margin-bottom:1rem; letter-spacing:-0.03em; line-height:1.2; color:var(--brand-navy); }
        .case-content p { font-size:1rem; line-height:1.8; margin-bottom:1.5rem; font-weight:500; color:var(--text-secondary); }
        .case-content ul { list-style-type:disc; list-style-position:inside; margin-bottom:2rem; }
        .case-content ul li { margin-bottom:0.5rem; font-weight:500; color:var(--text-secondary); }
        .case-content blockquote { border-left:4px solid var(--brand-gold); padding:1.5rem 2rem; border-radius:0 1rem 1rem 0; font-style:italic; font-size:1.15rem; margin:3rem 0; background:rgba(196,154,42,0.05); color:var(--brand-navy); }
        .case-content img { border-radius:1rem; margin:3rem 0; width:100%; }
        .case-content hr { margin:4rem 0; border-color:var(--border-color); }
        .case-content a { color:var(--brand-navy); font-weight:700; text-decoration:underline; }
      `}</style>
    </div>
  );
}
