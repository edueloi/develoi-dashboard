import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Pencil, Trash2, Eye, XCircle, RotateCcw, UserPlus, Plus, Search, MessageCircle, ChevronRight, Upload, Target, CalendarClock, TrendingUp, Trophy,
  MapPin, Hand, Phone, Mail, Video, StickyNote, ArrowRightLeft, LayoutGrid, List, Flame, Percent, Hourglass,
} from 'lucide-react';
import { Button, Modal, Input, Select, Textarea, EmptyState } from '../ui';
import { useToast } from '../ui/Toast';
import { useLiveEvents } from '../../lib/liveEvents';
import { RowMenu } from './financeShared';
import { SendMessageModal, fillPlaceholders, type MessageTemplate } from './SendMessageModal';
import { PlacesSearchModal } from './PlacesSearchModal';
import { useAuth } from '../../contexts/AuthContext';

type Status = 'new' | 'contacted' | 'meeting' | 'proposal' | 'won' | 'lost';
type Priority = 'hot' | 'warm' | 'cold';
interface Activity { id: string; type: string; text: string; createdAt: string }
interface Lead {
  id: string; name: string; company?: string | null; phone?: string | null; email?: string | null; city?: string | null;
  source: string; product?: string | null; status: Status; priority: Priority; value: number; nextFollowUp?: string | null; lastContactAt?: string | null;
  notes?: string | null; lostReason?: string | null; clientId?: string | null; saleId?: string | null; createdAt: string; updatedAt: string; activities: Activity[];
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

const PRIORITIES: { id: Priority; label: string; color: string; bg: string }[] = [
  { id: 'hot',  label: 'Quente', color: '#DC2626', bg: 'rgba(220,38,38,0.1)' },
  { id: 'warm', label: 'Morno',  color: '#D97706', bg: 'rgba(217,119,6,0.12)' },
  { id: 'cold', label: 'Frio',   color: '#2563EB', bg: 'rgba(37,99,235,0.1)' },
];
const prioOf = (p: Priority) => PRIORITIES.find(x => x.id === p) ?? PRIORITIES[1];

const SOURCES = [
  { value: 'manual', label: 'Cadastro manual' }, { value: 'indicacao', label: 'Indicação' }, { value: 'instagram', label: 'Instagram' },
  { value: 'whatsapp', label: 'WhatsApp' }, { value: 'site', label: 'Site' }, { value: 'bia', label: 'BiIA' },
  { value: 'planilha', label: 'Lista / planilha' }, { value: 'google', label: 'Google Maps' }, { value: 'outro', label: 'Outro' },
];
const ACT_TYPES = [
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle }, { value: 'call', label: 'Ligação', icon: Phone },
  { value: 'meeting', label: 'Reunião', icon: Video }, { value: 'email', label: 'E-mail', icon: Mail }, { value: 'note', label: 'Anotação', icon: StickyNote },
];

const money = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const todayStr = () => ymd(new Date());
const inDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return ymd(d); };
const dayOf = (iso?: string | null) => (iso ? iso.slice(0, 10) : '');
const fmtDay = (iso?: string | null) => { const d = dayOf(iso); return d ? d.split('-').reverse().join('/') : ''; };
const fmtDateTime = (iso: string) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const daysSince = (iso?: string | null) => (iso ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)) : 0);
const isOpen = (l: Lead) => l.status !== 'won' && l.status !== 'lost';
const followState = (l: Lead): 'late' | 'today' | 'future' | null => {
  const d = dayOf(l.nextFollowUp);
  if (!d || !isOpen(l)) return null;
  const t = todayStr();
  return d < t ? 'late' : d === t ? 'today' : 'future';
};

// Mensagens prontas para abrir a conversa; {nome} e {produto} são preenchidos com os dados do lead
const TEMPLATES: { id: string; label: string; text: string }[] = [
  { id: 'intro', label: 'Apresentação', text: 'Olá, {nome}! Aqui é da Develoi Soluções Digitais. {produto}Posso te mostrar rapidinho como funciona?' },
  { id: 'follow', label: 'Retomar contato', text: 'Oi, {nome}! Tudo bem? Passando para saber se você conseguiu avaliar a nossa conversa sobre {produtoSimples}. Ficou alguma dúvida?' },
  { id: 'demo', label: 'Convite para demonstração', text: 'Oi, {nome}! Que tal uma demonstração rápida de {produtoSimples}? Leva uns 15 minutos e você vê na prática. Qual horário fica bom para você?' },
  { id: 'proposal', label: 'Enviar proposta', text: 'Oi, {nome}! Preparei a proposta de {produtoSimples} para você. Posso te enviar por aqui e explicar os detalhes?' },
  { id: 'trial', label: 'Oferecer teste grátis', text: 'Oi, {nome}! Você pode testar {produtoSimples} gratuitamente por 14 dias, sem compromisso. Quer que eu libere o seu acesso agora?' },
];
const fillTemplate = (t: string, l: Lead) => {
  const first = l.name.split(' ')[0];
  return t.replaceAll('{nome}', first)
    .replaceAll('{produto}', l.product ? `Vi que você tem interesse em ${l.product}. ` : '')
    .replaceAll('{produtoSimples}', l.product ?? 'os nossos sistemas');
};
const templatesFor = (l: Lead, ready: { id: string; title: string; body: string; productName?: string | null }[]): MessageTemplate[] => {
  const mine = ready.filter(r => !r.productName || !l.product || r.productName.toLowerCase() === l.product.toLowerCase())
    .map(r => ({ id: `r-${r.id}`, label: `${r.title}${r.productName ? ` · ${r.productName}` : ''}`, text: fillPlaceholders(r.body, { nome: l.name.split(' ')[0], empresa: l.company ?? '', produto: l.product ?? undefined }) }));
  return [...TEMPLATES.map(t => ({ id: t.id, label: t.label, text: fillTemplate(t.text, l) })), ...mine];
};
const waUrl = (l: Lead, text: string) => {
  const dg = (l.phone || '').replace(/\D/g, '');
  const to = dg.startsWith('55') ? dg : `55${dg}`;
  return `https://wa.me/${to}?text=${encodeURIComponent(text)}`;
};
const introUrl = (l: Lead) => waUrl(l, fillTemplate(TEMPLATES[0].text, l));

const store = {
  get: (k: string, d: string) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* sem storage */ } },
};

export const LeadsManager: React.FC = () => {
  const { show: toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [products, setProducts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'board' | 'list'>(() => (store.get('develoi:leads:view', 'board') as 'board' | 'list'));
  const [tab, setTab] = useState<'open' | Status>('open');
  const [onlyFollow, setOnlyFollow] = useState(false);
  const [q, setQ] = useState('');
  const [fProduct, setFProduct] = useState('');
  const [fSource, setFSource] = useState('');
  const [fPrio, setFPrio] = useState('');
  const [editing, setEditing] = useState<Lead | 'new' | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [losing, setLosing] = useState<Lead | null>(null);
  const [sending, setSending] = useState<Lead | null>(null);
  const [ready, setReady] = useState<{ id: string; title: string; body: string; productName?: string | null }[]>([]);
  const { profile } = useAuth();
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const on = () => setNarrow(window.innerWidth < 768);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<Status | null>(null);

  const load = useCallback(async () => {
    try {
      const [r, o] = await Promise.all([fetch('/api/leads'), fetch('/api/leads/options').catch(() => null)]);
      if (r.ok) setLeads(await r.json());
      if (o && o.ok) setProducts((await o.json()).products ?? []);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch(`/api/ready-messages?userId=${profile?.uid ?? ''}`).then(r => r.json()).then(d => setReady(Array.isArray(d) ? d : [])).catch(() => {});
  }, [profile?.uid]);
  useLiveEvents(['Lead', 'LeadActivity', 'Client', 'Project', 'Product'], () => { load(); });

  const changeView = (v: 'board' | 'list') => { setView(v); store.set('develoi:leads:view', v); };

  const call = async (url: string, method: string, body?: any) => {
    const res = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { toast(data.error || 'Não foi possível concluir', 'error'); return null; }
    return data;
  };
  const move = async (l: Lead, status: Status, lostReason?: string) => {
    if (l.status === status) return;
    if (status === 'won') {
      const r = await call(`/api/leads/${l.id}/convert`, 'POST');
      if (r) { toast(r.reused ? 'Ganho! Ligado ao cliente que já existia.' : 'Ganho! Cliente criado em Clientes. 🎉', 'success'); load(); }
      return;
    }
    if (await call(`/api/leads/${l.id}/status`, 'POST', { status, lostReason })) load();
  };
  const undoWon = async (l: Lead) => {
    if (!confirm(`Desfazer o ganho de ${l.name}? Ele volta para a etapa Proposta, a venda volta para negociação e o cliente criado é removido (se ainda não tiver recebimentos).`)) return;
    const r = await call(`/api/leads/${l.id}/revert`, 'POST');
    if (r) { toast(r.clientKept ? `Voltou para a Proposta. O cliente foi mantido porque ${r.clientKept}.` : 'Voltou para a Proposta', 'success'); load(); }
  };
  const setFollow = async (l: Lead, date: string | null) => { if (await call(`/api/leads/${l.id}`, 'PATCH', { nextFollowUp: date })) load(); };

  // filtros comuns (busca, produto, origem, temperatura, follow-up)
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let rows = leads;
    if (fProduct) rows = rows.filter(l => l.product === fProduct);
    if (fSource) rows = rows.filter(l => l.source === fSource);
    if (fPrio) rows = rows.filter(l => l.priority === fPrio);
    if (onlyFollow) rows = rows.filter(l => { const f = followState(l); return f === 'late' || f === 'today'; });
    if (s) rows = rows.filter(l => [l.name, l.company, l.phone, l.city, l.product, l.email].some(x => (x ?? '').toLowerCase().includes(s)));
    return rows;
  }, [leads, q, fProduct, fSource, fPrio, onlyFollow]);

  const order = (l: Lead) => { const f = followState(l); return f === 'late' ? 0 : f === 'today' ? 1 : 2; };
  const sortLeads = (rows: Lead[]) => [...rows].sort((a, b) =>
    order(a) - order(b) || PRIORITIES.findIndex(p => p.id === a.priority) - PRIORITIES.findIndex(p => p.id === b.priority)
    || (dayOf(a.nextFollowUp) || '9').localeCompare(dayOf(b.nextFollowUp) || '9') || b.createdAt.localeCompare(a.createdAt));

  const counts = useMemo(() => {
    const c: Record<string, number> = { open: filtered.filter(isOpen).length };
    STAGES.forEach(s => { c[s.id] = filtered.filter(l => l.status === s.id).length; });
    return c;
  }, [filtered]);

  const kpi = useMemo(() => {
    const open = leads.filter(isOpen);
    const month = todayStr().slice(0, 7);
    const won = leads.filter(l => l.status === 'won').length, lost = leads.filter(l => l.status === 'lost').length;
    return {
      open: open.length,
      follow: open.filter(l => { const f = followState(l); return f === 'late' || f === 'today'; }).length,
      potential: open.reduce((s, l) => s + (l.value || 0), 0),
      hot: open.filter(l => l.priority === 'hot').length,
      wonMonth: leads.filter(l => l.status === 'won' && l.activities.some(a => a.type === 'status' && a.text.startsWith('Ganho') && a.createdAt.slice(0, 7) === month)).length,
      rate: won + lost ? Math.round((won / (won + lost)) * 100) : null,
      stale: open.filter(l => daysSince(l.lastContactAt ?? l.createdAt) >= 7).length,
    };
  }, [leads]);

  const current = detail ? leads.find(l => l.id === detail) ?? null : null;
  const mode: 'board' | 'list' = narrow ? 'list' : view;
  const visibleCols = STAGES.filter(x => x.id !== 'won' && x.id !== 'lost');
  const wonCol = stageOf('won'), lostCol = stageOf('lost');
  const listRows = useMemo(() => sortLeads(filtered.filter(l => (tab === 'open' ? isOpen(l) : l.status === tab))), [filtered, tab]); // eslint-disable-line
  const sources = useMemo(() => [...new Set(leads.map(l => l.source))], [leads]);
  const productOptions = useMemo(() => [...new Set([...products, ...leads.map(l => l.product).filter(Boolean) as string[]])].sort(), [products, leads]);

  const Card = ({ l, compact }: { l: Lead; compact?: boolean }) => {
    const st = stageOf(l.status), f = followState(l), pr = prioOf(l.priority);
    const idle = isOpen(l) ? daysSince(l.lastContactAt ?? l.createdAt) : 0;
    return (
      <div data-lead-card
        className={`rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 ${compact ? 'p-2.5' : 'p-3'} ${dragId === l.id ? 'opacity-40' : ''} ${compact ? '' : 'sm:flex sm:items-center sm:gap-3'}`}
        style={{ borderLeft: `3px solid ${pr.color}` }}>
        <button className="flex-1 min-w-0 text-left block w-full" onClick={() => setDetail(l.id)}>
          <div className={`flex items-center gap-1.5 ${compact ? 'flex-nowrap' : 'flex-wrap'}`}>
            <span className={`font-bold text-sm text-slate-900 dark:text-white truncate ${compact ? 'min-w-0 flex-1' : 'max-w-full'}`}>{l.name}</span>
            {!compact && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.color }}>{st.label}</span>}
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: pr.bg, color: pr.color }}>{pr.label}</span>
          </div>
          <div className={`text-xs text-slate-500 mt-0.5 ${compact ? 'truncate' : 'break-words'}`}>
            {[l.company, l.city].filter(Boolean).join(' · ') || 'Sem empresa'}
          </div>
          {(l.product || l.value > 0) && (
            <div className="text-xs mt-1 flex flex-wrap gap-x-2 text-slate-600 dark:text-slate-300">
              {l.product && <span className="font-semibold">{l.product}</span>}
              {l.value > 0 && <span className="font-bold" style={{ color: '#15803D' }}>{money(l.value)}/mês</span>}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {f === 'late' && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">Atrasado · {fmtDay(l.nextFollowUp)}</span>}
            {f === 'today' && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Falar hoje</span>}
            {f === 'future' && <span className="text-[10px] font-semibold text-slate-500">Retorno {fmtDay(l.nextFollowUp)}</span>}
            {idle >= 7 && <span className="text-[10px] font-semibold text-slate-400"><Hourglass className="w-3 h-3 inline -mt-0.5 mr-0.5" />{idle} dias sem contato</span>}
            {l.saleId && isOpen(l) && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Em Vendas</span>}
            {l.status === 'lost' && l.lostReason && <span className="text-[10px] text-slate-500">{l.lostReason}</span>}
          </div>
        </button>
        <div className={`flex items-center ${compact ? 'gap-1.5 mt-1.5' : 'flex-wrap gap-1.5 mt-2 sm:mt-0'} flex-shrink-0`}>
          {mode === 'board' && (
            <span draggable title="Segure aqui e arraste para outra etapa"
              onDragStart={e => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', l.id);
                const card = (e.currentTarget as HTMLElement).closest('[data-lead-card]');
                if (card) e.dataTransfer.setDragImage(card as Element, 24, 24);
                setTimeout(() => setDragId(l.id), 0);
              }}
              onDragEnd={() => { setDragId(null); setOverCol(null); }}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-grab active:cursor-grabbing select-none flex-shrink-0 touch-none">
              <Hand className="w-4 h-4" />
            </span>
          )}
          {l.phone && (
            <button type="button" title="Enviar mensagem (BiIA, atendimento ou WhatsApp)" onClick={() => setSending(l)}
              className="p-1.5 rounded-lg text-white hover:opacity-90" style={{ background: '#15803D' }}><MessageCircle className="w-4 h-4" /></button>
          )}
          {NEXT[l.status] && <Button variant="outline" size="xs" onClick={() => move(l, NEXT[l.status]!)}>{NEXT_LABEL[l.status]}<ChevronRight className="w-3 h-3 ml-0.5" /></Button>}
          <div className="ml-auto">
            <RowMenu items={[
              { label: 'Abrir / registrar contato', icon: Eye, onClick: () => setDetail(l.id) },
              { label: 'Editar', icon: Pencil, onClick: () => setEditing(l) },
              ...(isOpen(l) ? [
                ...STAGES.filter(x => x.id !== l.status && x.id !== 'won' && x.id !== 'lost').map(x => ({ label: `Mover para ${x.label}`, icon: ArrowRightLeft, onClick: () => move(l, x.id) })),
                { label: 'Falar amanhã', icon: CalendarClock, onClick: () => setFollow(l, inDays(1)) },
                { label: 'Falar em 1 semana', icon: CalendarClock, onClick: () => setFollow(l, inDays(7)) },
                { label: 'Marcar como perdido', icon: XCircle, onClick: () => setLosing(l) },
              ] : l.status === 'won' ? [{ label: 'Desfazer ganho (voltar para Proposta)', icon: RotateCcw, onClick: () => undoWon(l) }] : [{ label: 'Reabrir', icon: RotateCcw, onClick: () => move(l, 'new') }]),
              ...(l.status !== 'won' ? [{ label: 'Converter em cliente', icon: UserPlus, onClick: () => move(l, 'won') }] : []),
              { label: 'Excluir', icon: Trash2, danger: true, onClick: async () => { if (confirm(`Excluir o lead ${l.name}?`)) { if (await call(`/api/leads/${l.id}`, 'DELETE')) load(); } } },
            ]} />
          </div>
        </div>
      </div>
    );
  };

  // alvo de soltar do quadro (colunas e zonas de ganho/perdido)
  const dropProps = (colId: Status) => ({
    onDragOver: (e: React.DragEvent) => { if (dragId) { e.preventDefault(); setOverCol(colId); } },
    onDragLeave: (e: React.DragEvent) => { if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) setOverCol(c => (c === colId ? null : c)); },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault(); setOverCol(null);
      const l = leads.find(x => x.id === dragId); setDragId(null);
      if (!l || l.status === colId) return;
      if (colId === 'lost') setLosing(l); else move(l, colId);
    },
  });

  const kpis = [
    { icon: Target, label: 'Em aberto', value: String(kpi.open), color: '#0D1F4E' },
    { icon: CalendarClock, label: 'Follow-ups hoje/atrasados', value: String(kpi.follow), color: kpi.follow ? '#B91C1C' : '#475569' },
    { icon: Flame, label: 'Leads quentes', value: String(kpi.hot), color: '#DC2626' },
    { icon: TrendingUp, label: 'Potencial mensal', value: money(kpi.potential), color: '#2563EB' },
    { icon: Trophy, label: 'Ganhos no mês', value: String(kpi.wonMonth), color: '#15803D' },
    { icon: Percent, label: 'Taxa de conversão', value: kpi.rate === null ? '—' : `${kpi.rate}%`, color: '#7C3AED' },
  ];

  return (
    <div className="space-y-3 w-full min-w-0 max-w-full">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3">
        {kpis.map(k => (
          <div key={k.label} className="rounded-2xl border p-3 sm:p-3.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500"><k.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: k.color }} /><span className="truncate">{k.label}</span></div>
            <div className="mt-1 text-lg font-bold truncate" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>
      {kpi.stale > 0 && (
        <div className="rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-2" style={{ background: 'rgba(217,119,6,0.12)', color: '#B45309' }}>
          <Hourglass className="w-4 h-4" />{kpi.stale} lead(s) em aberto sem contato há 7 dias ou mais. Vale retomar antes que esfriem.
        </div>
      )}

      {/* Busca, filtros e ações */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nome, empresa, telefone, cidade…" className="pl-9" />
          </div>
          <div className="flex gap-2">
            <div className="hidden md:flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex-shrink-0">
              {([['board', LayoutGrid, 'Quadro'], ['list', List, 'Lista']] as const).map(([id, I, t]) => (
                <button key={id} onClick={() => changeView(id)} title={t} className="px-3 py-2" style={view === id ? { background: '#0D1F4E', color: '#fff' } : { color: '#64748B' }}><I className="w-4 h-4" /></button>
              ))}
            </div>
            <Button variant="outline" onClick={() => setSearching(true)} title="Buscar empresas no Google Maps"><MapPin className="w-4 h-4 sm:mr-1.5" /><span className="hidden sm:inline">BUSCAR EMPRESAS</span></Button>
            <Button variant="outline" onClick={() => setImporting(true)} title="Importar lista"><Upload className="w-4 h-4 sm:mr-1.5" /><span className="hidden sm:inline">IMPORTAR</span></Button>
            <Button className="flex-1 sm:flex-none" onClick={() => setEditing('new')}><Plus className="w-4 h-4 mr-1.5" />NOVO LEAD</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <Select aria-label="Produto" value={fProduct} onChange={e => setFProduct(e.target.value)} placeholder="Produto" options={[{ value: '', label: 'Todos os produtos' }, ...productOptions.map(p => ({ value: p, label: p }))]} />
          <Select aria-label="Origem" value={fSource} onChange={e => setFSource(e.target.value)} placeholder="Origem" options={[{ value: '', label: 'Todas as origens' }, ...sources.map(x => ({ value: x, label: SOURCES.find(y => y.value === x)?.label ?? x }))]} />
          <Select aria-label="Temperatura" value={fPrio} onChange={e => setFPrio(e.target.value)} placeholder="Temperatura" options={[{ value: '', label: 'Toda temperatura' }, ...PRIORITIES.map(p => ({ value: p.id, label: p.label }))]} />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto sm:flex-wrap items-center pb-1">
        {mode === 'list' && [{ id: 'open' as const, label: 'Em aberto', color: '#0D1F4E', bg: 'rgba(13,31,78,0.08)' }, ...STAGES].map(s => (
          <button key={s.id} onClick={() => setTab(s.id)} className="px-3 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap flex-shrink-0"
            style={tab === s.id ? { background: s.color, color: '#fff', borderColor: s.color } : { background: s.bg, color: s.color, borderColor: 'transparent' }}>
            {s.label} · {counts[s.id] ?? 0}
          </button>
        ))}
        {mode === 'board' && (
          <>
            <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden md:inline"><Hand className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />Segure a mãozinha do card e arraste para outra coluna ou solte em:</span>
            {[wonCol, lostCol].map(col => {
              const n = filtered.filter(l => l.status === col.id).length;
              return (
                <button type="button" key={col.id} {...dropProps(col.id)} onClick={() => { setTab(col.id); changeView('list'); }}
                  className="px-3 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap flex-shrink-0 transition-all"
                  style={{ background: overCol === col.id ? col.color : col.bg, color: overCol === col.id ? '#fff' : col.color, borderColor: overCol === col.id ? col.color : 'transparent', transform: overCol === col.id ? 'scale(1.06)' : 'none' }}>
                  {col.label} · {n}
                </button>
              );
            })}
          </>
        )}
        <button onClick={() => setOnlyFollow(v => !v)} className="px-3 py-1.5 rounded-full text-xs font-bold border ml-auto whitespace-nowrap flex-shrink-0"
          style={onlyFollow ? { background: '#B91C1C', color: '#fff', borderColor: '#B91C1C' } : { background: 'rgba(185,28,28,0.08)', color: '#B91C1C', borderColor: 'transparent' }}>
          <CalendarClock className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />Follow-up pendente
        </button>
      </div>

      {loading ? <div className="text-center py-12 text-slate-400">Carregando…</div>
        : leads.length === 0 ? (
          <EmptyState icon={Target} title="Nenhum lead ainda" description="Cadastre quem você quer prospectar ou importe uma lista de contatos."
            action={<div className="flex gap-2 justify-center"><Button onClick={() => setEditing('new')}>NOVO LEAD</Button><Button variant="outline" onClick={() => setImporting(true)}>IMPORTAR LISTA</Button></div>} />
        ) : mode === 'board' ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))]">
            {visibleCols.map(col => {
              const rows = sortLeads(filtered.filter(l => l.status === col.id));
              const total = rows.reduce((sum, l) => sum + (l.value || 0), 0);
              return (
                <div key={col.id} {...dropProps(col.id)}
                  className="min-w-0 rounded-2xl p-2.5 transition-colors flex flex-col h-[max(320px,calc(100vh-20rem))]"
                  style={{ background: overCol === col.id ? col.bg : 'rgba(100,116,139,0.07)', outline: overCol === col.id ? `2px dashed ${col.color}` : 'none' }}>
                  <div className="flex items-center justify-between gap-2 px-1 mb-2 flex-shrink-0">
                    <span className="text-xs font-extrabold uppercase tracking-wide truncate" style={{ color: col.color }}>{col.label} · {rows.length}</span>
                    {total > 0 && <span className="text-[11px] font-bold text-slate-500 flex-shrink-0">{money(total)}</span>}
                  </div>
                  <div className="space-y-2 flex-1 min-h-0 overflow-y-auto overscroll-contain pr-0.5">
                    {rows.map(l => <Card key={l.id} l={l} compact />)}
                    {rows.length === 0 && (
                      <div className="h-full min-h-[120px] rounded-xl border-2 border-dashed flex items-center justify-center text-center text-[11px] text-slate-400 px-3" style={{ borderColor: 'rgba(100,116,139,0.2)' }}>
                        Arraste um lead para cá
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : listRows.length === 0 ? (
          <EmptyState icon={Target} title="Nenhum lead nesse filtro" description="Troque a etapa ou limpe a busca." />
        ) : (
          <div className="space-y-2">{listRows.map(l => <Card key={l.id} l={l} />)}</div>
        )}

      {editing && <LeadForm lead={editing === 'new' ? null : editing} products={productOptions} onClose={() => setEditing(null)}
        onSave={async body => {
          const r = editing === 'new' ? await call('/api/leads', 'POST', body) : await call(`/api/leads/${(editing as Lead).id}`, 'PATCH', body);
          if (r) { toast('Lead salvo', 'success'); setEditing(null); load(); }
        }} />}

      {sending && (
        <SendMessageModal target={{ name: sending.name, subtitle: sending.company ?? undefined, phone: sending.phone ?? '', leadId: sending.id }}
          templates={templatesFor(sending, ready)} title="Enviar mensagem ao lead" onClose={() => setSending(null)} onSent={() => load()} />
      )}

      {current && <LeadDetail lead={current} onSend={() => { setSending(current); setDetail(null); }} onClose={() => setDetail(null)} onEdit={() => { setEditing(current); setDetail(null); }}
        onActivity={async b => { if (await call(`/api/leads/${current.id}/activity`, 'POST', b)) { toast('Contato registrado', 'success'); load(); } }}
        onMove={s => (s === 'lost' ? setLosing(current) : move(current, s))} />}

      {searching && <PlacesSearchModal products={productOptions} onClose={() => setSearching(false)} onImported={load} />}

      {importing && <ImportModal products={productOptions} onClose={() => setImporting(false)}
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
    source: lead?.source ?? 'manual', product: lead?.product ?? '', value: lead?.value ? String(lead.value) : '', priority: lead?.priority ?? 'warm',
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
        <div>
          <div className="ds-label mb-1.5">Temperatura</div>
          <div className="flex gap-2">
            {PRIORITIES.map(p => (
              <button type="button" key={p.id} onClick={() => setF(x => ({ ...x, priority: p.id }))} className="flex-1 py-2 rounded-xl text-xs font-bold border"
                style={f.priority === p.id ? { background: p.color, color: '#fff', borderColor: p.color } : { background: p.bg, color: p.color, borderColor: 'transparent' }}>{p.label}</button>
            ))}
          </div>
        </div>
        <div>
          <Input label="Próximo contato" type="date" value={f.nextFollowUp} onChange={set('nextFollowUp')} />
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {[['Hoje', 0], ['Amanhã', 1], ['3 dias', 3], ['1 semana', 7], ['15 dias', 15]].map(([t, n]) => (
              <button type="button" key={t as string} onClick={() => setF(x => ({ ...x, nextFollowUp: inDays(n as number) }))} className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{t}</button>
            ))}
          </div>
        </div>
        <Textarea label="Observações" rows={3} value={f.notes} onChange={set('notes')} />
      </form>
    </Modal>
  );
};

// ─── Detalhe + histórico ─────────────────────────────────────────────────────
const LeadDetail: React.FC<{ lead: Lead; onSend: () => void; onClose: () => void; onEdit: () => void; onActivity: (b: any) => Promise<void>; onMove: (s: Status) => void }> = ({ lead, onSend, onClose, onEdit, onActivity, onMove }) => {
  const [type, setType] = useState('whatsapp');
  const [text, setText] = useState('');
  const [next, setNext] = useState('');
  const [saving, setSaving] = useState(false);
  const st = stageOf(lead.status), pr = prioOf(lead.priority);
  const iconOf = (t: string) => (ACT_TYPES.find(a => a.value === t)?.icon ?? ArrowRightLeft);
  return (
    <Modal isOpen onClose={onClose} title={lead.name} size="lg">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: st.bg, color: st.color }}>{st.label}</span>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: pr.bg, color: pr.color }}>{pr.label}</span>
          {lead.lostReason && <span className="text-xs text-slate-500">Motivo: {lead.lostReason}</span>}
          {lead.saleId && !lead.clientId && <span className="text-xs font-semibold text-amber-700">Acompanhado em Vendas</span>}
          {lead.clientId && <span className="text-xs font-semibold text-emerald-700">Já é cliente</span>}
          <Button variant="outline" size="sm" className="ml-auto" onClick={onEdit}>EDITAR</Button>
        </div>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
          {([['Empresa', lead.company], ['WhatsApp', lead.phone], ['E-mail', lead.email], ['Cidade', lead.city], ['Produto', lead.product], ['Origem', SOURCES.find(s => s.value === lead.source)?.label],
            ['Valor estimado', lead.value ? `${money(lead.value)}/mês` : null], ['Próximo contato', fmtDay(lead.nextFollowUp) || null], ['No funil há', `${daysSince(lead.createdAt)} dia(s)`]] as [string, string | null | undefined][])
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

        {lead.phone && (
          <button type="button" onClick={onSend} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-white text-sm font-black" style={{ background: '#15803D' }}>
            <MessageCircle className="w-4 h-4" />ENVIAR MENSAGEM (BiIA, atendimento ou WhatsApp)
          </button>
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
            <div>
              <Input label="Próximo contato (opcional)" type="date" value={next} onChange={e => setNext(e.target.value)} />
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {[['Amanhã', 1], ['3 dias', 3], ['1 semana', 7]].map(([t, n]) => (
                  <button type="button" key={t as string} onClick={() => setNext(inDays(n as number))} className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{t}</button>
                ))}
              </div>
            </div>
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
  // cada linha: nome; telefone; empresa; cidade  (aceita ; ou tab, e dá para colar direto do Excel)
  const rows = useMemo(() => raw.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
    const [name, phone, company, city] = l.split(/[;\t]/).map(x => x.trim());
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
