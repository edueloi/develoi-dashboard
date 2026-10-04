import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Send, Eye, Edit2, Trash2, History, Bot, Headphones, ExternalLink, Receipt, MessageCircle } from 'lucide-react';
import { Button, Modal, EmptyState } from '../ui';
import { Pagination, usePagination } from '../ui/Pagination';
import { useAuth } from '../../contexts/AuthContext';
import { useLiveEvents } from '../../lib/liveEvents';
import { RowMenu } from './financeShared';
import { SendMessageModal, fillPlaceholders, type SendTarget } from './SendMessageModal';
import type { ReadyMessage } from './types';

type SrcType = 'client' | 'lead' | 'sale' | 'manual';
interface Src { type: SrcType; label: string; status: string; refId: string }
export interface UContact {
  key: string; name: string; company: string | null; phone: string; city: string | null;
  sources: Src[]; lastContactAt: string | null; contactCount: number; refs: Record<string, string>;
}
export interface LogRow { id: string; phone: string; name: string | null; source: string; via: string; message: string; byName: string | null; createdAt: string }

const SRC: Record<SrcType, { label: string; color: string; bg: string }> = {
  client: { label: 'Cliente',    color: '#15803D', bg: 'rgba(21,128,61,0.12)' },
  lead:   { label: 'Prospecção', color: '#2563EB', bg: 'rgba(37,99,235,0.12)' },
  sale:   { label: 'Venda',      color: '#C49A2A', bg: 'rgba(196,154,42,0.14)' },
  manual: { label: 'Manual',     color: '#64748B', bg: 'rgba(100,116,139,0.14)' },
};
const VIA: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  bot:       { label: 'Pela BiIA',        color: '#0D1F4E', bg: 'rgba(13,31,78,0.1)',    icon: Bot },
  attendant: { label: 'Atendimento',      color: '#C49A2A', bg: 'rgba(196,154,42,0.14)', icon: Headphones },
  link:      { label: 'Link do WhatsApp', color: '#15803D', bg: 'rgba(21,128,61,0.12)',  icon: ExternalLink },
  billing:   { label: 'Cobrança',         color: '#DC2626', bg: 'rgba(220,38,38,0.1)',   icon: Receipt },
};

const fmtWhen = (iso?: string | null) => (iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '');
const fmtDay = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '');

// ─── Lista unificada ────────────────────────────────────────────────────────
export const UnifiedContacts: React.FC<{
  messages: ReadyMessage[]; onEditManual: (id: string) => void; onDeleteManual: (id: string) => void; refreshKey: number; onChanged: () => void;
}> = ({ messages, onEditManual, onDeleteManual, refreshKey, onChanged }) => {
  const { profile } = useAuth();
  const [rows, setRows] = useState<UContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [src, setSrc] = useState<'all' | SrcType>('all');
  const [touched, setTouched] = useState<'all' | 'never' | 'done'>('all');
  const [sort, setSort] = useState<'name' | 'last' | 'never'>('name');
  const [sending, setSending] = useState<UContact | null>(null);
  const [history, setHistory] = useState<UContact | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/outreach/contacts?userId=${profile?.uid ?? ''}`);
      if (r.ok) setRows(await r.json());
    } finally { setLoading(false); }
  }, [profile?.uid]);
  useEffect(() => { load(); }, [load, refreshKey]);
  useLiveEvents(['Lead', 'Client', 'Sale', 'ClientContact'], () => { load(); });

  const stats = useMemo(() => ({
    total: rows.length,
    lead: rows.filter(r => r.sources.some(s => s.type === 'lead')).length,
    client: rows.filter(r => r.sources.some(s => s.type === 'client')).length,
    sale: rows.filter(r => r.sources.some(s => s.type === 'sale')).length,
    manual: rows.filter(r => r.sources.some(s => s.type === 'manual')).length,
    never: rows.filter(r => !r.lastContactAt).length,
  }), [rows]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const digits = s.replace(/\D/g, '');
    let list = rows.filter(r =>
      (src === 'all' || r.sources.some(x => x.type === src)) &&
      (touched === 'all' || (touched === 'never' ? !r.lastContactAt : !!r.lastContactAt)) &&
      (!s || r.name.toLowerCase().includes(s) || (r.company ?? '').toLowerCase().includes(s) || (r.city ?? '').toLowerCase().includes(s) || (digits.length >= 3 && r.key.includes(digits))));
    list = [...list].sort((a, b) => {
      if (sort === 'last') return (b.lastContactAt ?? '').localeCompare(a.lastContactAt ?? '');
      if (sort === 'never') return (a.lastContactAt ? 1 : 0) - (b.lastContactAt ? 1 : 0) || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [rows, q, src, touched, sort]);
  const { page, pageSize, paginatedData, setPage, setPageSize } = usePagination(filtered, 10);

  const tplFor = (c: UContact) => {
    const vars = { nome: c.name.split(' ')[0], empresa: c.company ?? '', atendente: profile?.displayName?.split(' ')[0] };
    const t = messages.map(m => ({ id: m.id, label: m.title, text: fillPlaceholders(m.body, vars) }));
    return t.length ? t : [{ id: 'livre', label: 'Mensagem livre', text: `Olá, ${vars.nome}! ` }];
  };
  const targetFor = (c: UContact): SendTarget => ({
    name: c.company || c.name, subtitle: c.company ? c.name : undefined, phone: c.phone,
    leadId: c.refs.leadId, contactId: c.refs.contactId,
    source: c.refs.clientId ? 'client' : c.refs.saleId ? 'sale' : undefined, refId: c.refs.clientId || c.refs.saleId,
  });

  const cards = [
    { id: 'all', label: 'Total', value: stats.total, color: '#0D1F4E' },
    { id: 'lead', label: 'Prospecção', value: stats.lead, color: '#2563EB' },
    { id: 'client', label: 'Clientes', value: stats.client, color: '#15803D' },
    { id: 'sale', label: 'Vendas', value: stats.sale, color: '#C49A2A' },
    { id: 'manual', label: 'Manuais', value: stats.manual, color: '#64748B' },
  ] as const;

  const sel = 'px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 focus:outline-none font-medium text-slate-700 dark:text-slate-200';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {cards.map(c => (
          <button key={c.id} onClick={() => setSrc(c.id as any)} className="rounded-xl p-3 border text-center transition-all bg-white dark:bg-white/5"
            style={src === c.id ? { borderColor: c.color, boxShadow: `0 0 0 1px ${c.color}` } : { borderColor: 'rgba(148,163,184,0.25)' }}>
            <p className="text-lg font-black" style={{ color: c.color }}>{c.value}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{c.label}</p>
          </button>
        ))}
        <button onClick={() => { setTouched(t => (t === 'never' ? 'all' : 'never')); }} className="rounded-xl p-3 border text-center transition-all bg-white dark:bg-white/5"
          style={touched === 'never' ? { borderColor: '#DC2626', boxShadow: '0 0 0 1px #DC2626' } : { borderColor: 'rgba(148,163,184,0.25)' }}>
          <p className="text-lg font-black text-red-600">{stats.never}</p>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Sem contato ainda</p>
        </button>
      </div>

      <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-sm p-2.5 flex flex-wrap gap-2 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Nome, empresa, telefone ou cidade..."
            className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 focus:outline-none focus:border-[#0D1F4E] text-slate-800 dark:text-white" />
        </div>
        <select className={sel} value={touched} onChange={e => setTouched(e.target.value as any)}>
          <option value="all">Todos</option><option value="never">Nunca contatados</option><option value="done">Já contatados</option>
        </select>
        <select className={sel} value={sort} onChange={e => setSort(e.target.value as any)}>
          <option value="name">Nome (A-Z)</option><option value="last">Contato mais recente</option><option value="never">Sem contato primeiro</option>
        </select>
      </div>

      {loading ? <div className="text-center py-12 text-sm text-slate-400">Carregando...</div>
        : filtered.length === 0 ? (
          <EmptyState icon={MessageCircle} title="Nenhum contato encontrado" description={rows.length ? 'Troque o filtro ou limpe a busca.' : 'Os leads da Prospecção, os clientes e os contatos das vendas aparecem aqui sozinhos.'} />
        ) : (
          <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {paginatedData.map(c => (
                <div key={c.key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-black truncate text-slate-900 dark:text-white max-w-full">{c.company || c.name}</p>
                      {c.sources.map(s => (
                        <span key={s.type + s.refId} title={s.status} className="text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wide" style={{ background: SRC[s.type].bg, color: SRC[s.type].color }}>
                          {SRC[s.type].label}{s.type === 'lead' || s.type === 'client' ? ` · ${s.status}` : ''}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      {[c.company ? c.name : null, c.city].filter(Boolean).join(' · ')}{c.company || c.city ? ' · ' : ''}{c.phone}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: c.lastContactAt ? '#94A3B8' : '#DC2626' }}>
                      {c.lastContactAt ? `Último contato ${fmtDay(c.lastContactAt)}${c.contactCount ? ` · ${c.contactCount} mensagem(ns)` : ''}` : 'Nenhuma mensagem enviada ainda'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Button size="xs" onClick={() => setSending(c)}><Send className="w-3 h-3 mr-1" />ENVIAR</Button>
                    <button onClick={() => setHistory(c)} title="Histórico de mensagens" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400"><History className="w-4 h-4" /></button>
                    <RowMenu items={[
                      { label: 'Histórico de mensagens', icon: History, onClick: () => setHistory(c) },
                      ...(c.refs.manualId ? [
                        { label: 'Editar contato', icon: Edit2, onClick: () => onEditManual(c.refs.manualId) },
                        { label: 'Excluir contato', icon: Trash2, danger: true, onClick: () => onDeleteManual(c.refs.manualId) },
                      ] : [{ label: c.refs.leadId ? 'Ver em Prospecção' : c.refs.clientId ? 'Ver em Clientes' : 'Ver em Vendas', icon: Eye, onClick: () => { window.location.href = c.refs.leadId ? '/dashboard/prospeccao' : c.refs.clientId ? '/dashboard/clientes' : '/dashboard/vendas'; } }]),
                    ]} />
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 dark:border-white/5 p-2">
              <Pagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
            </div>
          </div>
        )}

      {sending && <SendMessageModal target={targetFor(sending)} templates={tplFor(sending)} title="Enviar mensagem"
        onClose={() => setSending(null)} onSent={() => { load(); onChanged(); }} />}
      {history && <ContactHistoryModal contact={history} onClose={() => setHistory(null)} />}
    </div>
  );
};

// ─── Histórico de um contato ─────────────────────────────────────────────────
const ContactHistoryModal: React.FC<{ contact: UContact; onClose: () => void }> = ({ contact, onClose }) => {
  const [rows, setRows] = useState<LogRow[] | null>(null);
  useEffect(() => { fetch(`/api/outreach/log?phone=${encodeURIComponent(contact.phone)}`).then(r => r.json()).then(setRows).catch(() => setRows([])); }, [contact.phone]);
  return (
    <Modal isOpen onClose={onClose} title={`Mensagens enviadas: ${contact.company || contact.name}`} size="lg">
      {rows === null ? <div className="text-center py-8 text-sm text-slate-400">Carregando...</div>
        : rows.length === 0 ? <p className="text-sm text-slate-400 py-6 text-center">Nenhuma mensagem enviada para este contato pelo painel.</p>
        : <LogList rows={rows} showName={false} />}
    </Modal>
  );
};

const LogList: React.FC<{ rows: LogRow[]; showName: boolean }> = ({ rows, showName }) => {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      {rows.map(r => {
        const v = VIA[r.via] ?? VIA.bot, I = v.icon, isOpen = open === r.id;
        return (
          <div key={r.id} className="rounded-xl border border-slate-200/70 dark:border-white/10 p-3">
            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              <span className="font-black px-2 py-0.5 rounded-md uppercase tracking-wide flex items-center gap-1" style={{ background: v.bg, color: v.color }}><I className="w-3 h-3" />{v.label}</span>
              {showName && <span className="font-bold text-slate-700 dark:text-slate-200 truncate">{r.name || r.phone}</span>}
              {showName && <span className="text-slate-400">{r.phone}</span>}
              <span className="text-slate-400 ml-auto">{fmtWhen(r.createdAt)}{r.byName ? ` · ${r.byName}` : ''}</span>
            </div>
            <p className={`text-xs text-slate-600 dark:text-slate-300 mt-1.5 whitespace-pre-wrap break-words ${isOpen ? '' : 'line-clamp-3'}`}>{r.message}</p>
            {r.message.length > 160 && <button className="text-[11px] font-bold text-blue-600 mt-1" onClick={() => setOpen(isOpen ? null : r.id)}>{isOpen ? 'Mostrar menos' : 'Ver mensagem completa'}</button>}
          </div>
        );
      })}
    </div>
  );
};

// ─── Aba "Mensagens enviadas" ────────────────────────────────────────────────
export const SentMessages: React.FC<{ refreshKey: number }> = ({ refreshKey }) => {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [via, setVia] = useState('all');
  useEffect(() => {
    setLoading(true);
    fetch('/api/outreach/log?limit=1000').then(r => r.json()).then(d => setRows(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  }, [refreshKey]);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter(r => (via === 'all' || r.via === via) && (!s || (r.name ?? '').toLowerCase().includes(s) || r.phone.includes(s.replace(/\D/g, '') || '§') || r.message.toLowerCase().includes(s)));
  }, [rows, q, via]);
  const { page, pageSize, paginatedData, setPage, setPageSize } = usePagination(filtered, 10);
  const today = new Date().toDateString();
  const todayN = rows.filter(r => new Date(r.createdAt).toDateString() === today).length;
  const sel = 'px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 focus:outline-none font-medium text-slate-700 dark:text-slate-200';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[['Total enviadas', rows.length, '#0D1F4E'], ['Hoje', todayN, '#15803D'], ['Pela BiIA', rows.filter(r => r.via === 'bot').length, '#2563EB'], ['Cobranças', rows.filter(r => r.via === 'billing').length, '#DC2626']].map(([l, v, c]) => (
          <div key={l as string} className="rounded-xl p-3 border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 text-center">
            <p className="text-lg font-black" style={{ color: c as string }}>{v}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{l}</p>
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-sm p-2.5 flex flex-wrap gap-2 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nome, telefone ou trecho da mensagem..."
            className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 focus:outline-none focus:border-[#0D1F4E] text-slate-800 dark:text-white" />
        </div>
        <select className={sel} value={via} onChange={e => setVia(e.target.value)}>
          <option value="all">Todos os envios</option>
          {Object.entries(VIA).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      {loading ? <div className="text-center py-12 text-sm text-slate-400">Carregando...</div>
        : filtered.length === 0 ? <EmptyState icon={History} title="Nenhuma mensagem enviada ainda" description="Tudo que você disparar pelo painel (BiIA, atendimento, cobrança e links do WhatsApp) fica registrado aqui." />
        : (
          <div className="space-y-3">
            <LogList rows={paginatedData} showName />
            <Pagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
          </div>
        )}
    </div>
  );
};
