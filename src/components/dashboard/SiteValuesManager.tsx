import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Target, TrendingUp, Star, Sparkles, CheckCircle2, Plus, Trash2, Save, ArrowUp, ArrowDown, Copy, Eye, PencilLine, RotateCcw, Download, Quote } from 'lucide-react';
import { Button, Input, Textarea, EmptyState } from '../ui';
import { useToast } from '../ui/Toast';
import type { SiteValues } from './types';

const EMPTY: SiteValues = { mission: '', vision: '', values: [] };
const same = (a: SiteValues, b: SiteValues) => JSON.stringify(a) === JSON.stringify(b);

// Missão, visão e valores que aparecem no site público: editor à esquerda e pré-visualização do site à direita
export function SiteValuesManager() {
  const { show: toast } = useToast();
  const [data, setData] = useState<SiteValues>(EMPTY);
  const [saved, setSaved] = useState<SiteValues>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');
  const dirty = useMemo(() => !same(data, saved), [data, saved]);

  useEffect(() => {
    fetch('/api/site/values')
      .then(r => r.json())
      .then(d => { const v = { mission: d.mission || '', vision: d.vision || '', values: Array.isArray(d.values) ? d.values : [] }; setData(v); setSaved(v); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // avisa antes de sair da página com alterações sem salvar
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const clean = { ...data, values: data.values.filter(v => v.title.trim() || v.description.trim()) };
      const res = await fetch('/api/site/values', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(clean) });
      if (!res.ok) throw new Error();
      setData(clean); setSaved(clean);
      toast('Missão, visão e valores atualizados no site', 'success');
    } catch { toast('Não deu para salvar agora. Tente de novo.', 'error'); }
    finally { setSaving(false); }
  };

  const fromPlan = async (field: 'mission' | 'vision') => {
    try {
      const plan = await (await fetch('/api/business-plan')).json();
      const txt = field === 'mission' ? plan?.missionText : plan?.visionText;
      if (!txt) return toast('O Plano de Negócio ainda não tem esse texto.', 'error');
      setData(d => ({ ...d, [field]: txt }));
      toast('Texto trazido do Plano de Negócio. Revise antes de salvar.', 'success');
    } catch { toast('Não deu para buscar o Plano de Negócio.', 'error'); }
  };

  const updateValue = (i: number, field: 'title' | 'description', val: string) =>
    setData(d => ({ ...d, values: d.values.map((v, k) => (k === i ? { ...v, [field]: val } : v)) }));
  const move = (i: number, dir: -1 | 1) => setData(d => {
    const j = i + dir; if (j < 0 || j >= d.values.length) return d;
    const values = [...d.values]; [values[i], values[j]] = [values[j], values[i]]; return { ...d, values };
  });

  if (loading) return <div className="flex items-center justify-center py-24"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;

  const count = (t: string, max: number) => <span className={`text-[11px] font-bold ${t.length > max ? 'text-amber-600' : 'text-slate-400'}`}>{t.length} caracteres{t.length > max ? ' (texto longo para o site)' : ''}</span>;

  const editor = (
    <div className="space-y-5 min-w-0">
      {/* Missão e visão */}
      {([
        { key: 'mission' as const, title: 'Nossa missão', sub: 'O propósito: por que a Develoi existe.', icon: Target, color: '#0D1F4E', ph: 'Ex: Criar sistemas sob medida que resolvem problemas reais de negócios…', max: 400 },
        { key: 'vision' as const, title: 'Nossa visão', sub: 'Onde queremos chegar no futuro.', icon: TrendingUp, color: '#2563EB', ph: 'Ex: Ser a casa de software de referência para pequenos negócios…', max: 400 },
      ]).map(b => (
        <section key={b.key} className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden" style={{ borderTop: `3px solid ${b.color}` }}>
          <div className="flex items-center gap-3 p-4 sm:p-5 pb-3">
            <span className="w-11 h-11 rounded-2xl flex items-center justify-center text-white flex-shrink-0" style={{ background: b.color }}><b.icon className="w-5 h-5" /></span>
            <div className="min-w-0 flex-1"><h3 className="text-sm font-black uppercase tracking-widest" style={{ color: b.color }}>{b.title}</h3><p className="text-xs text-slate-400">{b.sub}</p></div>
            <button type="button" onClick={() => fromPlan(b.key)} title="Trazer o texto do Plano de Negócio" className="hidden sm:flex items-center gap-1.5 text-[11px] font-black text-indigo-600 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg"><Download className="w-3.5 h-3.5" />Do Plano</button>
          </div>
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-1.5">
            <Textarea rows={5} placeholder={b.ph} value={data[b.key]} onChange={e => setData(d => ({ ...d, [b.key]: e.target.value }))} className="leading-relaxed" />
            <div className="flex items-center justify-between gap-2">{count(data[b.key], b.max)}<button type="button" onClick={() => fromPlan(b.key)} className="sm:hidden text-[11px] font-black text-indigo-600">Trazer do Plano</button></div>
          </div>
        </section>
      ))}

      {/* Valores */}
      <section className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden" style={{ borderTop: '3px solid #C49A2A' }}>
        <div className="flex items-center gap-3 p-4 sm:p-5 pb-3">
          <span className="w-11 h-11 rounded-2xl flex items-center justify-center bg-amber-100 text-amber-700 flex-shrink-0"><Star className="w-5 h-5" /></span>
          <div className="min-w-0 flex-1"><h3 className="text-sm font-black uppercase tracking-widest text-amber-700">Nossos valores</h3><p className="text-xs text-slate-400">Os princípios que guiam as decisões. Use poucos e diretos.</p></div>
          <Button variant="outline" size="sm" onClick={() => setData(d => ({ ...d, values: [...d.values, { title: '', description: '' }] }))} iconLeft={<Plus className="w-3.5 h-3.5" />}>ADICIONAR</Button>
        </div>
        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
          {data.values.length === 0 ? (
            <EmptyState icon={Sparkles} title="Sem valores cadastrados" description="Adicione os valores que representam a cultura da Develoi." className="border-none bg-zinc-50/30" />
          ) : (
            <ol className="space-y-3">
              {data.values.map((v, i) => (
                <li key={i} className="rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-white hover:shadow-sm hover:border-amber-200 transition-all p-3.5 sm:p-4 flex gap-3">
                  <span className="w-8 h-8 rounded-lg bg-amber-500 text-white text-sm font-black flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  <div className="flex-1 min-w-0 space-y-2">
                    <Input placeholder="Título do valor (ex.: Transparência)" value={v.title} onChange={e => updateValue(i, 'title', e.target.value)} />
                    <Textarea rows={2} placeholder="Explique em uma ou duas frases o que esse valor significa na prática." value={v.description} onChange={e => updateValue(i, 'description', e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button type="button" disabled={i === 0} onClick={() => move(i, -1)} title="Subir" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-25"><ArrowUp className="w-4 h-4" /></button>
                    <button type="button" disabled={i === data.values.length - 1} onClick={() => move(i, 1)} title="Descer" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-25"><ArrowDown className="w-4 h-4" /></button>
                    <button type="button" onClick={() => setData(d => ({ ...d, values: [...d.values.slice(0, i + 1), { ...v, title: `${v.title} (cópia)` }, ...d.values.slice(i + 1)] }))} title="Duplicar" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"><Copy className="w-4 h-4" /></button>
                    <button type="button" onClick={() => setData(d => ({ ...d, values: d.values.filter((_, k) => k !== i) }))} title="Remover" className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </div>
  );

  // como a seção aparece no site
  const preview = (
    <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-[#F8FAFC] min-w-0">
      <div className="px-5 py-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 bg-white"><Eye className="w-3.5 h-3.5" />Pré-visualização do site</div>
      <div className="p-5 sm:p-7 space-y-7">
        <div className="text-center"><p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#C49A2A]">Cultura & DNA</p><h3 className="text-xl sm:text-2xl font-black text-[#0D1F4E] mt-1">Quem somos por dentro</h3></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[{ t: 'Missão', txt: data.mission, c: '#0D1F4E', I: Target }, { t: 'Visão', txt: data.vision, c: '#2563EB', I: TrendingUp }].map(b => (
            <div key={b.t} className="rounded-2xl p-5 text-white relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${b.c}, #0D1F4E)` }}>
              <Quote className="absolute right-3 top-3 w-12 h-12 opacity-10" />
              <b.I className="w-6 h-6 text-[#C49A2A] mb-3" />
              <p className="text-[11px] font-black uppercase tracking-widest text-[#C49A2A]">{b.t}</p>
              <p className="text-sm leading-relaxed mt-1.5 text-white/90 whitespace-pre-line break-words">{b.txt || <span className="italic text-white/40">Ainda não preenchida</span>}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 text-center mb-3">Nossos valores</p>
          {data.values.filter(v => v.title || v.description).length === 0 ? <p className="text-sm text-slate-400 text-center italic">Nenhum valor ainda</p> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.values.filter(v => v.title || v.description).map((v, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 flex gap-3">
                  <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0"><CheckCircle2 className="w-4 h-4" /></span>
                  <div className="min-w-0"><p className="text-sm font-black text-[#0D1F4E] break-words">{v.title || 'Sem título'}</p><p className="text-xs text-slate-500 leading-relaxed mt-0.5 break-words">{v.description}</p></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 pb-24 w-full min-w-0">
      <div className="rounded-3xl p-5 sm:p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#0D1F4E 0%,#1B3A8A 100%)' }}>
        <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/5" />
        <p className="text-[11px] font-black uppercase tracking-widest text-[#C49A2A]">Site público</p>
        <h2 className="text-xl font-black mt-1">Missão, visão e valores</h2>
        <p className="text-sm text-white/70 mt-1 max-w-2xl">Estes textos aparecem no site da Develoi. Edite à esquerda e confira a pré-visualização à direita antes de salvar.</p>
      </div>

      <div className="xl:hidden inline-flex p-1 rounded-xl bg-slate-100">
        {([['edit', 'Editar', PencilLine], ['preview', 'Pré-visualizar', Eye]] as const).map(([id, l, I]) => (
          <button key={id} onClick={() => setMobileTab(id)} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black transition-colors ${mobileTab === id ? 'bg-white shadow-sm text-[#0D1F4E]' : 'text-slate-500'}`}><I className="w-3.5 h-3.5" />{l}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
        <div className={mobileTab === 'edit' ? 'block' : 'hidden xl:block'}>{editor}</div>
        <div className={`${mobileTab === 'preview' ? 'block' : 'hidden xl:block'} xl:sticky xl:top-2`}>{preview}</div>
      </div>

      {/* barra de salvar sempre visível */}
      <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 pb-3 sm:pb-4 flex justify-end lg:pl-[260px]">
          <motion.div initial={false} animate={{ y: dirty ? 0 : 80, opacity: dirty ? 1 : 0 }} className="pointer-events-auto flex items-center gap-2 sm:gap-3 bg-white border border-slate-200 shadow-2xl rounded-2xl pl-4 pr-2 py-2">
            <span className="text-xs font-bold text-amber-700 hidden sm:inline">Alterações não salvas</span>
            <Button variant="outline" size="sm" onClick={() => setData(saved)} iconLeft={<RotateCcw className="w-3.5 h-3.5" />}>DESCARTAR</Button>
            <Button size="sm" onClick={handleSave} loading={saving} iconLeft={<Save className="w-3.5 h-3.5" />}>SALVAR NO SITE</Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
