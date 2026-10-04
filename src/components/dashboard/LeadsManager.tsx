import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Pencil, Trash2, Eye, XCircle, RotateCcw, UserPlus, Plus, Search, MessageCircle, ChevronRight, Upload, Target, CalendarClock, TrendingUp, Trophy, Phone, Mail, Users, Video, StickyNote, ArrowRightLeft } from 'lucide-react';
import { Button, Modal, Input, Select, Textarea, EmptyState } from '../ui';
import { useToast } from '../ui/Toast';
import { useLiveEvents } from '../../lib/liveEvents';
import { RowMenu } from './financeShared';

type Status = 'new' | 'contacted' | 'meeting' | 'proposal' | 'won' | 'lost';
interface Activity { id: string; type: string; text: string; createdAt: string }
interface Lead {
  id: string; name: string; company?: string | null; phone?: string | null; email?: string | null; city?: string | null;
  source: string; product?: string | null; status: Status; value: number; nextFollowUp?: string | null; lastContactAt?: string | null;
  notes?: string | null; lostReason?: string | null; clientId?: string | null; createdAt: string; activities: Activity[];
}

const STAGES: { id: Status; label: string; color: string; bg: string }[] = [
  { id: 'new',       label: 'Novo',      color: '#475569', bg: 'rgba(71,85,105,0.1)' },
  { id: 'contacted', label: 'Contatado', color: '#2563EB', bg: 'rgba(37,99,235,0.1)' },
  { id: 'meeting',   label: 'Reunião',   color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
  { id: 'proposal',  label: 'Proposta',  color: '#D97706', bg: 'rgba(217,119,6,0.12)' },
  { id: 'won',       label: 'Ganho',     color: '#15803D', bg: 'rgba(21,128,61,0.1)' },
  { id: 'lost',      label: 'Perdido',   color: '#B91C1C', bg: 'rgba(185,28,28,0.1)' },
];
const stageOf = (s: Status) => STAGES.find(x => x.id === s)!;
const NEXT: Partial<Record<Status, Status>> = { new: 'contacted', contacted: 'meeting', meeting: 'proposal', proposal: 'won' };
const NEXT_LABEL: Partial<Record<Status, string>> = { new: 'Contatei', contacted: 'Marcou reunião', meeting: 'Enviei proposta', proposal: 'Fechou!' };

const SOURCES = [
  { value: 'manual', label: 'Cadastro manual' }, { value: 'indicacao', label: 'Indicação' }, { value: 'instagram', label: 'Instagram' },
  { value: 'whatsapp', label: 'WhatsApp' }, { value: 'site', label: 'Site' }, { value: 'bia', label: 'BiIA' },
  { value: 'planilha', label: 'Lista / planilha' }, { value: 'outro', label: 'Outro' },
];
const ACT_TYPES = [
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle }, { value: 'call', label: 'Ligação', icon: Phone },
  { value: 'meeting', label: 'Reunião', icon: Video }, { value: 'email', label: 'E-mail', icon: Mail }, { value: 'note', label: 'Anotação', icon: StickyNote },
];

const money = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const dayOf = (iso?: string | null) => (iso ? iso.slice(0, 10) : '');
const fmtDay = (iso?: string | null) => { const d = dayOf(iso); return d ? d.split('-').reverse().join('/') : ''; };
const fmtDateTime = (iso: string) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const isOpen = (l: Lead) => l.status !== 'won' && l.status !== 'lost';
const followState = (l: Lead): 'late' | 'today' | 'future' | null => {
  const d = dayOf(l.nextFollowUp);
  if (!d || !isOpen(l)) return null;
  const t = todayStr();
  return d < t ? 'late' : d === t ? 'today' : 'future';
};
const waLink = (l: Lead) => {
  const dg = (l.phone || '').replace(/\D/g, '');
  const to = dg.startsWith('55') ? dg : `55${dg}`;
  const first = l.name.split(' ')[0];
  const text = `Olá, ${first}! Aqui é da Develoi Soluções Digitais. ${l.product ? `Vi que você tem interesse em ${l.product}. ` : ''}Posso te mostrar como funciona rapidinho?`;
  return `https://wa.me/${to}?text=${encodeURIComponent(text)}`;
};

export const LeadsManager: React.FC = () => {
  const { show: toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [products, setProducts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'open' | Status>('open');
  const [onlyFollow, setOnlyFollow] = useState(false);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Lead | 'new' | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [losing, setLosing] = useState<Lead | null>(null);

  const load = useCallback(async () => {
    try {
      const [r, p] = await Promise.all([fetch('/api/leads'), fetch('/api/products').catch(() => null)]);
      if (r.ok) setLeads(await r.json());
      if (p && p.ok) { const list = await p.json(); setProducts(Array.isArray(list) ? list.filter((x: any) => x.active !== false).map((x: any) => x.name) : []); }
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useLiveEvents(['Lead', 'LeadActivity', 'Client'], () => { load(); });

  const call = async (url: string, method: string, body?: any) => {
    const res = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { toast(data.error || 'Não foi possível concluir', 'error'); return null; }
    return data;
  };
  const move = async (l: Lead, status: Status, lostReason?: string) => {
    if (status === 'won') {
      const r = await call(`/api/leads/${l.id}/convert`, 'POST');
      if (r) { toast(r.reused ? 'Ganho! Ligado ao cliente que já existia.' : 'Ganho! Cliente criado em Clientes. 🎉', 'success'); load(); }
      return;
    }
    if (await call(`/api/leads/${l.id}/status`, 'POST', { status, lostReason })) load();
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { open: leads.filter(isOpen).length };
    STAGES.forEach(s => { c[s.id] = leads.filter(l => l.status === s.id).length; });
    return c;
  }, [leads]);

  const kpi = useMemo(() => {
    const open = leads.filter(isOpen);
    const month = todayStr().slice(0, 7);
    return {
      follow: open.filter(l => { const f = followState(l); return f === 'late' || f === 'today'; }).length,
      potential: open.reduce((s, l) => s + (l.value || 0), 0),
      wonMonth: leads.filter(l => l.status === 'won' && dayOf(l.createdAt) && l.activities.some(a => a.type === 'status' && a.text.startsWith('Ganho') && a.createdAt.slice(0, 7) === month)).length,
    };
  }, [leads]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    let rows = leads.filter(l => (tab === 'open' ? isOpen(l) : l.status === tab));
    if (onlyFollow) rows = rows.filter(l => { const f = followState(l); return f === 'late' || f === 'today'; });
    if (s) rows = rows.filter(l => [l.name, l.company, l.phone, l.city, l.product].some(x => (x ?? '').toLowerCase().includes(s)));
    const order = (l: Lead) => { const f = followState(l); return f === 'late' ? 0 : f === 'today' ? 1 : 2; };
    return rows.sort((a, b) => order(a) - order(b) || (dayOf(a.nextFollowUp) || '9').localeCompare(dayOf(b.nextFollowUp) || '9') || b.createdAt.localeCompare(a.createdAt));
  }, [leads, tab, q, onlyFollow]);

  const current = detail ? leads.find(l => l.id === detail) ?? null : null;

  return (
    <div className="space-y-5">
      {/* Indicadores */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Target, label: 'Leads em aberto', value: String(counts.open), color: '#0D1F4E' },
          { icon: CalendarClock, label: 'Follow-ups de hoje/atrasados', value: String(kpi.follow), color: kpi.follow ? '#B91C1C' : '#475569' },
          { icon: TrendingUp, label: 'Potencial mensal', value: money(kpi.potential), color: '#2563EB' },
          { icon: Trophy, label: 'Ganhos no mês', value: String(kpi.wonMonth), color: '#15803D' },
        ].map(k => (
          <div key={k.label} className="rounded-2xl border p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500"><k.icon className="w-4 h-4" style={{ color: k.color }} />{k.label}</div>
            <div className="mt-1 text-xl font-bold" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Barra de ações */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nome, empresa, telefone, cidade…" className="pl-9" />
        </div>
        <Button variant="outline" onClick={() => setImporting(true)}><Upload className="w-4 h-4 mr-1.5" />IMPORTAR LISTA</Button>
        <Button onClick={() => setEditing('new')}><Plus className="w-4 h-4 mr-1.5" />NOVO LEAD</Button>
      </div>

      {/* Etapas */}
      <div className="flex flex-wrap gap-2">
        {[{ id: 'open' as const, label: 'Em aberto', color: '#0D1F4E', bg: 'rgba(13,31,78,0.08)' }, ...STAGES].map(s => (
          <button key={s.id} onClick={() => setTab(s.id)}
            className="px-3 py-1.5 rounded-full text-xs font-bold transition-all border"
            style={tab === s.id ? { background: s.color, color: '#fff', borderColor: s.color } : { background: s.bg, color: s.color, borderColor: 'transparent' }}>
            {s.label} · {counts[s.id] ?? 0}
          </button>
        ))}
        <button onClick={() => setOnlyFollow(v => !v)}
          className="px-3 py-1.5 rounded-full text-xs font-bold border ml-auto"
          style={onlyFollow ? { background: '#B91C1C', color: '#fff', borderColor: '#B91C1C' } : { background: 'rgba(185,28,28,0.08)', color: '#B91C1C', borderColor: 'transparent' }}>
          <CalendarClock className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />Follow-up pendente
        </button>
      </div>

      {/* Lista */}
      {loading ? <div className="text-center py-12 text-slate-400">Carregando…</div>
        : list.length === 0 ? (
          <EmptyState icon={Target} title={leads.length ? 'Nenhum lead nesse filtro' : 'Nenhum lead ainda'}
            description={leads.length ? 'Troque a etapa ou limpe a busca.' : 'Cadastre quem você quer prospectar ou importe uma lista de contatos.'} />
        ) : (
          <div className="space-y-2">
            {list.map(l => {
              const st = stageOf(l.status), f = followState(l);
              return (
                <div key={l.id} className="rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <button className="flex-1 min-w-0 text-left" onClick={() => setDetail(l.id)}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-white truncate">{l.name}</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                      {f === 'late' && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Follow-up atrasado ({fmtDay(l.nextFollowUp)})</span>}
                      {f === 'today' && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Falar hoje</span>}
                      {f === 'future' && <span className="text-[11px] font-semibold text-slate-500">Retorno {fmtDay(l.nextFollowUp)}</span>}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate">
                      {[l.company, l.city, l.product, l.phone].filter(Boolean).join(' · ') || 'Sem detalhes'}{l.value > 0 ? ` · ${money(l.value)}/mês` : ''}
                    </div>
                  </button>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {l.phone && (
                      <a href={waLink(l)} target="_blank" rel="noopener noreferrer" title="Chamar no WhatsApp"
                        onClick={() => { if (l.status === 'new') move(l, 'contacted'); }}
                        className="p-2 rounded-lg text-white hover:opacity-90" style={{ background: '#15803D' }}><MessageCircle className="w-4 h-4" /></a>
                    )}
                    {NEXT[l.status] && <Button variant="outline" size="sm" onClick={() => move(l, NEXT[l.status]!)}>{NEXT_LABEL[l.status]}<ChevronRight className="w-3.5 h-3.5 ml-1" /></Button>}
                    <RowMenu items={[
                      { label: 'Abrir / registrar contato', icon: Eye, onClick: () => setDetail(l.id) },
                      { label: 'Editar', icon: Pencil, onClick: () => setEditing(l) },
                      ...(isOpen(l) ? [{ label: 'Marcar como perdido', icon: XCircle, onClick: () => setLosing(l) }] : [{ label: 'Reabrir', icon: RotateCcw, onClick: () => move(l, 'new') }]),
                      ...(l.status !== 'won' ? [{ label: 'Converter em cliente', icon: UserPlus, onClick: () => move(l, 'won') }] : []),
                      { label: 'Excluir', icon: Trash2, danger: true, onClick: async () => { if (confirm(`Excluir o lead ${l.name}?`)) { if (await call(`/api/leads/${l.id}`, 'DELETE')) load(); } } },
                    ]} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

      {editing && <LeadForm lead={editing === 'new' ? null : editing} products={products} onClose={() => setEditing(null)}
        onSave={async body => {
          const r = editing === 'new' ? await call('/api/leads', 'POST', body) : await call(`/api/leads/${(editing as Lead).id}`, 'PATCH', body);
          if (r) { toast('Lead salvo', 'success'); setEditing(null); load(); }
        }} />}

      {current && <LeadDetail lead={current} onClose={() => setDetail(null)} onEdit={() => { setEditing(current); setDetail(null); }}
        onActivity={async b => { if (await call(`/api/leads/${current.id}/activity`, 'POST', b)) { toast('Contato registrado', 'success'); load(); } }}
        onMove={s => s === 'lost' ? setLosing(current) : move(current, s)} />}

      {importing && <ImportModal products={products} onClose={() => setImporting(false)}
        onImport={async (rows, source, product) => {
          const r = await call('/api/leads/import', 'POST', { rows, source, product });
          if (r) { toast(`${r.created} lead(s) importado(s)${r.skipped ? `, ${r.skipped} ignorado(s) (repetidos ou sem nome)` : ''}`, 'success'); setImporting(false); load(); }
        }} />}

      {losing && <LostModal lead={losing} onClose={() => setLosing(null)} onConfirm={async reason => { await move(losing, 'lost', reason); setLosing(null); setDetail(null); }} />}
    </div>
  );
};

// ─── Cadastro / edição ───────────────────────────────────────────────────────
const LeadForm: React.FC<{ lead: Lead | null; products: string[]; onClose: () => void; onSave: (b: any) => Promise<void> }> = ({ lead, products, onClose, onSave }) => {
  const [f, setF] = useState({
    name: lead?.name ?? '', company: lead?.company ?? '', phone: lead?.phone ?? '', email: lead?.email ?? '', city: lead?.city ?? '',
    source: lead?.source ?? 'manual', product: lead?.product ?? '', value: lead?.value ? String(lead.value) : '',
    nextFollowUp: dayOf(lead?.nextFollowUp), notes: lead?.notes ?? '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<any>) => setF(p => ({ ...p, [k]: e.target.value }));
  return (
    <Modal isOpen onClose={onClose} title={lead ? 'Editar lead' : 'Novo lead'} size="md"
      footer={<Button type="submit" form="lead-form" loading={saving} fullWidth>SALVAR</Button>}>
      <form id="lead-form" className="space-y-3" onSubmit={async e => { e.preventDefault(); setSaving(true); await onSave({ ...f, value: Number(f.value) || 0, nextFollowUp: f.nextFollowUp || null }); setSaving(false); }}>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Nome do contato" required value={f.name} onChange={set('name')} />
          <Input label="Empresa / estabelecimento" value={f.company} onChange={set('company')} />
          <Input label="WhatsApp" value={f.phone} onChange={set('phone')} placeholder="(11) 99999-9999" />
          <Input label="E-mail" type="email" value={f.email} onChange={set('email')} />
          <Input label="Cidade" value={f.city} onChange={set('city')} />
          <Select label="De onde veio" value={f.source} onChange={set('source')} options={SOURCES} />
          <Select label="Produto de interesse" value={f.product} onChange={set('product')} placeholder="Escolha…" options={products.map(p => ({ value: p, label: p }))} />
          <Input label="Valor mensal estimado" addonLeft="R$" type="number" step="0.01" value={f.value} onChange={set('value')} />
        </div>
        <Input label="Próximo contato" type="date" value={f.nextFollowUp} onChange={set('nextFollowUp')} />
        <Textarea label="Observações" rows={3} value={f.notes} onChange={set('notes')} />
      </form>
    </Modal>
  );
};

// ─── Detalhe + histórico ─────────────────────────────────────────────────────
const LeadDetail: React.FC<{ lead: Lead; onClose: () => void; onEdit: () => void; onActivity: (b: any) => Promise<void>; onMove: (s: Status) => void }> = ({ lead, onClose, onEdit, onActivity, onMove }) => {
  const [type, setType] = useState('whatsapp');
  const [text, setText] = useState('');
  const [next, setNext] = useState('');
  const [saving, setSaving] = useState(false);
  const st = stageOf(lead.status);
  const iconOf = (t: string) => (ACT_TYPES.find(a => a.value === t)?.icon ?? ArrowRightLeft);
  return (
    <Modal isOpen onClose={onClose} title={lead.name} size="lg">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: st.bg, color: st.color }}>{st.label}</span>
          {lead.lostReason && <span className="text-xs text-slate-500">Motivo: {lead.lostReason}</span>}
          <Button variant="outline" size="sm" className="ml-auto" onClick={onEdit}>EDITAR</Button>
        </div>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
          {([['Empresa', lead.company], ['WhatsApp', lead.phone], ['E-mail', lead.email], ['Cidade', lead.city], ['Produto', lead.product], ['Origem', SOURCES.find(s => s.value === lead.source)?.label],
            ['Valor estimado', lead.value ? `${money(lead.value)}/mês` : null], ['Próximo contato', fmtDay(lead.nextFollowUp) || null]] as [string, string | null | undefined][])
            .filter(([, v]) => v).map(([k, v]) => <div key={k}><span className="text-slate-500">{k}: </span><span className="font-semibold text-slate-800 dark:text-slate-100">{v}</span></div>)}
        </div>
        {lead.notes && <p className="text-sm whitespace-pre-wrap rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 text-slate-700 dark:text-slate-200">{lead.notes}</p>}

        {isOpen(lead) && (
          <div className="flex flex-wrap gap-2">
            {STAGES.filter(s => s.id !== lead.status).map(s => (
              <button key={s.id} onClick={() => onMove(s.id)} className="px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: s.bg, color: s.color }}>
                {s.id === 'won' ? 'Fechou (virar cliente)' : s.id === 'lost' ? 'Perdido' : `Mover para ${s.label}`}
              </button>
            ))}
          </div>
        )}

        <form className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3 space-y-2" onSubmit={async e => {
          e.preventDefault(); if (!text.trim()) return;
          setSaving(true); await onActivity({ type, text, ...(next ? { nextFollowUp: next } : {}) }); setSaving(false); setText(''); setNext('');
        }}>
          <div className="text-sm font-bold text-slate-700 dark:text-slate-200">Registrar contato</div>
          <div className="flex flex-wrap gap-1.5">
            {ACT_TYPES.map(a => (
              <button type="button" key={a.value} onClick={() => setType(a.value)} className="px-2.5 py-1 rounded-full text-xs font-semibold border"
                style={type === a.value ? { background: '#0D1F4E', color: '#fff', borderColor: '#0D1F4E' } : { borderColor: 'rgba(100,116,139,0.3)', color: '#64748B' }}>
                <a.icon className="w-3 h-3 inline mr-1 -mt-0.5" />{a.label}
              </button>
            ))}
          </div>
          <Textarea rows={2} value={text} onChange={e => setText(e.target.value)} placeholder="O que foi conversado? O que ficou combinado?" />
          <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
            <Input label="Próximo contato (opcional)" type="date" value={next} onChange={e => setNext(e.target.value)} />
            <Button type="submit" loading={saving} className="sm:ml-auto">REGISTRAR</Button>
          </div>
        </form>

        <div>
          <div className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Histórico</div>
          {lead.activities.length === 0 ? <div className="text-sm text-slate-400">Nada registrado ainda.</div> : (
            <ul className="space-y-2">
              {lead.activities.map(a => { const I = iconOf(a.type); return (
                <li key={a.id} className="flex gap-2 text-sm">
                  <I className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
                  <div className="min-w-0"><div className="text-slate-800 dark:text-slate-100 whitespace-pre-wrap break-words">{a.text}</div><div className="text-[11px] text-slate-400">{fmtDateTime(a.createdAt)}</div></div>
                </li>); })}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
};

// ─── Importar lista ──────────────────────────────────────────────────────────
const ImportModal: React.FC<{ products: string[]; onClose: () => void; onImport: (rows: any[], source: string, product: string) => Promise<void> }> = ({ products, onClose, onImport }) => {
  const [raw, setRaw] = useState('');
  const [source, setSource] = useState('planilha');
  const [product, setProduct] = useState('');
  const [saving, setSaving] = useState(false);
  // cada linha: nome; telefone; empresa; cidade  (aceita ; , ou tab, e colar direto do Excel)
  const rows = useMemo(() => raw.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
    const [name, phone, company, city] = l.split(/[;\t]|,(?=\s*[\d(+])|,\s*(?=\D)/).map(x => x.trim());
    return { name, phone, company, city };
  }).filter(r => r.name), [raw]);
  return (
    <Modal isOpen onClose={onClose} title="Importar lista de leads" size="md"
      footer={<Button loading={saving} disabled={!rows.length} fullWidth onClick={async () => { setSaving(true); await onImport(rows, source, product); setSaving(false); }}>IMPORTAR {rows.length || ''} CONTATO(S)</Button>}>
      <div className="space-y-3">
        <p className="text-sm text-slate-500">Cole uma linha por contato no formato <b>nome; telefone; empresa; cidade</b>. Pode colar direto do Excel ou Google Planilhas. Quem já estiver cadastrado pelo telefone é ignorado.</p>
        <Textarea rows={8} value={raw} onChange={e => setRaw(e.target.value)} placeholder={'Maria Souza; (11) 98888-7777; Salão da Maria; Campinas\nJoão Lima; 11977776666; Mercado Lima; Jundiaí'} />
        <div className="grid sm:grid-cols-2 gap-3">
          <Select label="Origem" value={source} onChange={e => setSource(e.target.value)} options={SOURCES} />
          <Select label="Produto de interesse (todos)" value={product} onChange={e => setProduct(e.target.value)} placeholder="Nenhum" options={products.map(p => ({ value: p, label: p }))} />
        </div>
      </div>
    </Modal>
  );
};

const LOST_REASONS = ['Sem interesse', 'Achou caro', 'Já usa outro sistema', 'Sem retorno', 'Fechou com concorrente', 'Não é o momento'];
const LostModal: React.FC<{ lead: Lead; onClose: () => void; onConfirm: (reason: string) => Promise<void> }> = ({ lead, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  return (
    <Modal isOpen onClose={onClose} title={`Perdido: ${lead.name}`} size="sm"
      footer={<Button variant="danger" fullWidth onClick={() => onConfirm(reason)}>CONFIRMAR</Button>}>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {LOST_REASONS.map(r => (
            <button key={r} type="button" onClick={() => setReason(r)} className="px-2.5 py-1 rounded-full text-xs font-semibold border"
              style={reason === r ? { background: '#B91C1C', color: '#fff', borderColor: '#B91C1C' } : { borderColor: 'rgba(100,116,139,0.3)', color: '#64748B' }}>{r}</button>
          ))}
        </div>
        <Input label="Ou escreva o motivo" value={reason} onChange={e => setReason(e.target.value)} />
      </div>
    </Modal>
  );
};
