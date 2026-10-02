import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  MessageCircle, Clock, UserCheck, CheckCircle2, Send, ArrowRightLeft, ChevronLeft, Search, Inbox, Bot, Users, Plus, Check,
} from 'lucide-react';
import { Button, Modal, Select, Textarea } from '../ui';
import { AttendantsModal } from './AttendantsModal';
import { useToast } from '../ui/Toast';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLiveEvents } from '../../lib/liveEvents';

export type ConvStatus = 'bot' | 'waiting' | 'active' | 'closed';

interface Sector { id: string; name: string }
interface WaMessage { id: string; fromRole: 'client' | 'attendant' | 'bot' | 'system'; body: string; sentAt: string }
interface Conversation {
  id: string; clientPhone: string; clientName?: string | null; attendantId?: string | null; attendantName?: string | null;
  status: ConvStatus; firstMessage?: string | null; subject?: string | null; clientDocument?: string | null; linkedClientId?: string | null;
  queuedAt: string; updatedAt: string; sector?: Sector | null; lastMessage?: WaMessage | null;
}

const NAVY = '#0D1F4E';
const GOLD = '#C49A2A';

// Cada etapa do atendimento tem a sua tela (submenu "Atendimento WhatsApp")
export const WA_PATHS: Record<ConvStatus | 'new', string> = {
  bot: '/dashboard/atendimento/bot',
  waiting: '/dashboard/atendimento/fila',
  active: '/dashboard/atendimento/em-andamento',
  closed: '/dashboard/atendimento/finalizados',
  new: '/dashboard/atendimento/nova',
};

const VIEW_INFO: Record<ConvStatus, { title: string; hint: string; icon: any; empty: string }> = {
  bot: { title: 'Conversas com o bot', hint: 'Clientes que estão no menu do bot. Você pode assumir quando quiser.', icon: Bot, empty: 'Ninguém está com o bot agora' },
  waiting: { title: 'Fila de espera', hint: 'Clientes aguardando um atendente. Quem espera há mais tempo aparece primeiro.', icon: Clock, empty: 'Fila vazia' },
  active: { title: 'Em atendimento', hint: 'Conversas que estão sendo atendidas agora.', icon: UserCheck, empty: 'Nenhuma conversa em atendimento' },
  closed: { title: 'Finalizados', hint: 'Histórico das conversas encerradas.', icon: CheckCircle2, empty: 'Nenhuma conversa finalizada' },
};

// O WhatsApp pode identificar o contato por um ID interno (14+ dígitos) em vez do telefone
export const isRealPhone = (p: string) => p.replace(/\D/g, '').length <= 13;

export function formatPhone(p: string) {
  const d = p.replace(/\D/g, '');
  if (d.length === 13) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  if (d.length === 12) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 8)}-${d.slice(8)}`;
  return p;
}
export const personLabel = (c: { clientName?: string | null; clientPhone: string }) => c.clientName || (isRealPhone(c.clientPhone) ? formatPhone(c.clientPhone) : 'Cliente');

function waitingFor(iso: string) {
  const min = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 1) return 'agora';
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h ${min % 60}min`;
}

const hhmm = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

// hoje: hora · ontem · outros dias: dd/MM
function shortWhen(iso: string) {
  const d = new Date(iso), now = new Date();
  const days = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000);
  if (days <= 0) return hhmm(iso);
  if (days === 1) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}
function dayLabel(iso: string) {
  const w = shortWhen(iso);
  return w.includes(':') ? 'Hoje' : w.includes('/') ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : w;
}
const sameDay = (a: string, b: string) => new Date(a).toDateString() === new Date(b).toDateString();

export function WhatsappInbox({ view }: { view: ConvStatus }) {
  const { isDark } = useTheme();
  const { show: toast } = useToast();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const myId = profile?.uid;
  const myName = profile?.displayName || 'Atendente';
  const info = VIEW_INFO[view];

  const go = (target: ConvStatus | 'new', id?: string) => navigate(WA_PATHS[target] + (id ? `?c=${id}` : ''));

  const [sectorFilter, setSectorFilter] = useState('');
  const [search, setSearch] = useState('');
  const [onlyMine, setOnlyMine] = useState(false);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [all, setAll] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(() => new URLSearchParams(location.search).get('c'));
  const [messages, setMessages] = useState<WaMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferSector, setTransferSector] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [closeOpen, setCloseOpen] = useState(false);
  const [closingMsg, setClosingMsg] = useState('Atendimento finalizado. Agradecemos o contato! Qualquer dúvida, é só chamar. 😊');
  const [attendantsOpen, setAttendantsOpen] = useState(false);
  const lastWaiting = useRef<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const muted = isDark ? '#8B96B3' : '#6B7794';
  const text = isDark ? '#E6EAF5' : NAVY;
  const border = 'border-slate-200/70 dark:border-white/10';

  const loadList = useCallback(async () => {
    try {
      // a conversa aberta pode ter mudado de etapa (ex.: acabou de ser aceita), então busca também pelo id
      const r = await fetch(`/api/admin/bot/conversations?status=${view}`);
      if (!r.ok) return;
      const data: Conversation[] = await r.json();
      setAll(data);
      if (view === 'waiting') {
        if (lastWaiting.current !== null && data.length > lastWaiting.current) toast('Nova conversa na fila de atendimento', 'info');
        lastWaiting.current = data.length;
      }
    } catch {} finally { setLoading(false); }
  }, [toast, view]);

  const loadMessages = useCallback(async (id: string) => {
    try {
      const r = await fetch(`/api/admin/bot/conversations/${id}/messages`);
      if (r.ok) setMessages(await r.json());
    } catch {}
  }, []);

  useEffect(() => { fetch('/api/admin/bot/sectors').then(r => r.json()).then(d => setSectors(Array.isArray(d) ? d : [])).catch(() => {}); }, []);

  // Atualiza na hora quando algo muda (eventos do sistema) e, por garantia, a cada 20s
  useEffect(() => { loadList(); const t = setInterval(loadList, 20000); return () => clearInterval(t); }, [loadList]);
  useEffect(() => {
    if (!selectedId) { setMessages([]); return; }
    loadMessages(selectedId);
    const t = setInterval(() => loadMessages(selectedId), 20000);
    return () => clearInterval(t);
  }, [selectedId, loadMessages]);
  useLiveEvents(['WppConversation', 'WppConversationMessage'], () => { loadList(); if (selectedId) loadMessages(selectedId); });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length, selectedId]);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = all;
    if (sectorFilter) rows = rows.filter(c => c.sector?.id === sectorFilter);
    if (onlyMine && view === 'active') rows = rows.filter(c => c.attendantId === myId);
    if (q) rows = rows.filter(c => (c.clientName || '').toLowerCase().includes(q) || c.clientPhone.includes(q.replace(/\D/g, '') || '§'));
    if (view === 'waiting') rows = [...rows].sort((a, b) => new Date(a.queuedAt).getTime() - new Date(b.queuedAt).getTime()); // quem espera há mais tempo primeiro
    return rows;
  }, [all, view, sectorFilter, onlyMine, search, myId]);

  const selected = all.find(c => c.id === selectedId) || null;
  const canReply = selected?.status === 'active' && (selected.attendantId === myId || !selected.attendantId);

  async function post(url: string, body: any) {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || 'Erro na requisição');
    return data;
  }

  async function accept(c: Conversation) {
    try {
      await post(`/api/admin/bot/conversations/${c.id}/accept`, { attendantId: myId, attendantName: myName });
      toast('Atendimento iniciado', 'success');
      go('active', c.id); // abre direto na tela "Em atendimento"
    } catch (e: any) { toast(e.message, 'error'); loadList(); }
  }

  async function send() {
    if (!selected || !draft.trim() || sending) return;
    setSending(true);
    try {
      await post('/api/admin/bot/conversations/message', { conversationId: selected.id, body: draft.trim() });
      setDraft('');
      loadMessages(selected.id); loadList();
    } catch (e: any) { toast(e.message, 'error'); }
    setSending(false);
  }

  async function transfer() {
    if (!selected || !transferSector) return;
    try {
      await post(`/api/admin/bot/conversations/${selected.id}/transfer`, { sectorId: transferSector, reason: transferReason.trim(), byName: myName });
      toast('Conversa transferida para a fila do outro setor', 'success');
      setTransferOpen(false); setTransferSector(''); setTransferReason(''); setSelectedId(null);
      loadList();
    } catch (e: any) { toast(e.message, 'error'); }
  }

  async function finish() {
    if (!selected) return;
    try {
      await post(`/api/admin/bot/conversations/${selected.id}/close`, { closingMessage: closingMsg, byName: myName });
      toast('Atendimento finalizado', 'success');
      setCloseOpen(false); setSelectedId(null);
      loadList();
    } catch (e: any) { toast(e.message, 'error'); }
  }

  const avatar = (c: Conversation, size = 40) => (
    <div className="rounded-full flex items-center justify-center shrink-0 text-white font-bold" style={{ width: size, height: size, background: c.status === 'bot' ? GOLD : NAVY, fontSize: size * 0.4 }}>
      {c.status === 'bot' ? <Bot size={size * 0.5} /> : personLabel(c)[0]?.toUpperCase() ?? '?'}
    </div>
  );
  const ViewIcon = info.icon;

  return (
    <div className={`flex rounded-2xl overflow-hidden border ${border} bg-white dark:bg-[#0B1220]`} style={{ height: 'calc(100dvh - 170px)', minHeight: 540 }}>
      {/* ══ Lista ══ */}
      <aside className={`${selected ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-[380px] xl:w-[420px] shrink-0 border-r ${border}`}>
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <ViewIcon size={18} style={{ color: GOLD }} />
            <h3 className="text-base font-black flex-1 truncate" style={{ color: text }}>{info.title}</h3>
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10" style={{ color: text }}>{all.length}</span>
            <button onClick={() => setAttendantsOpen(true)} title="Equipe de atendimento" aria-label="Equipe de atendimento"
              className={`p-2 rounded-lg border ${border} text-slate-500 hover:text-slate-800 dark:hover:text-white`}><Users size={16} /></button>
          </div>
          <p className="text-xs mt-1.5" style={{ color: muted }}>{info.hint}</p>
        </div>

        <div className={`px-3 pb-3 flex gap-2 border-b ${border}`}>
          <div className="relative flex-1 min-w-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: muted }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar nome ou telefone"
              className={`w-full rounded-lg pl-8 pr-3 py-2 text-sm outline-none border ${border} bg-slate-50 dark:bg-white/5`} style={{ color: text }} />
          </div>
          <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} aria-label="Filtrar por setor"
            className={`w-[118px] rounded-lg px-2 py-2 text-sm outline-none border ${border} bg-slate-50 dark:bg-white/5`} style={{ color: text }}>
            <option value="">Setores</option>
            {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {view === 'active' && (
            <button onClick={() => setOnlyMine(v => !v)} className={`px-3 rounded-lg text-xs font-bold border ${onlyMine ? 'border-amber-500 text-amber-600' : `${border} text-slate-500`}`}>Meus</button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-center py-12 text-sm" style={{ color: muted }}>Carregando…</p>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 px-6 text-center" style={{ color: muted }}>
              <Inbox size={34} />
              <p className="text-sm">{info.empty}</p>
              {(view === 'active' || view === 'waiting') && <Button size="sm" variant="outline" iconLeft={<Plus size={14} />} onClick={() => go('new')}>Iniciar conversa</Button>}
            </div>
          ) : list.map(c => {
            const sel = selectedId === c.id;
            const preview = c.lastMessage?.body?.replace(/\*/g, '') || c.firstMessage || '—';
            return (
              <button key={c.id} onClick={() => setSelectedId(c.id)}
                className={`w-full text-left px-4 py-3 flex gap-3 border-b ${border} transition-colors ${sel ? 'bg-amber-50 dark:bg-amber-500/10' : 'hover:bg-slate-50 dark:hover:bg-white/5'}`}>
                {avatar(c)}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-bold text-sm truncate" style={{ color: text }}>{personLabel(c)}</span>
                    <span className="text-[11px] shrink-0 font-semibold" style={{ color: c.status === 'waiting' ? GOLD : muted }}>
                      {c.status === 'waiting' ? `${waitingFor(c.queuedAt)}` : shortWhen(c.updatedAt)}
                    </span>
                  </div>
                  <p className="text-xs truncate mt-0.5" style={{ color: muted }}>
                    {c.lastMessage?.fromRole === 'bot' ? '🤖 ' : c.lastMessage?.fromRole === 'attendant' ? 'Você: ' : ''}{preview}
                  </p>
                  {(c.sector || c.subject || (c.attendantName && c.status === 'active')) && (
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {c.sector && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-200">{c.sector.name}</span>}
                      {c.subject && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300">🛠️ {c.subject}</span>}
                      {c.attendantName && c.status === 'active' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">{c.attendantName.trim()}</span>}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ══ Conversa ══ */}
      <section className={`${selected ? 'flex' : 'hidden lg:flex'} flex-col flex-1 min-w-0`}>
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ color: muted }}>
            <MessageCircle size={44} />
            <p className="text-sm">Selecione uma conversa para ver o histórico</p>
          </div>
        ) : (
          <>
            <header className={`px-3 sm:px-4 py-3 border-b ${border} flex items-center gap-2 sm:gap-3`}>
              <button className="lg:hidden p-1.5 -ml-1 rounded-lg" onClick={() => setSelectedId(null)} style={{ color: muted }} aria-label="Voltar"><ChevronLeft size={20} /></button>
              {avatar(selected, 38)}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm truncate" style={{ color: text }}>{personLabel(selected)}</p>
                <p className="text-xs truncate" style={{ color: muted }}>
                  {isRealPhone(selected.clientPhone) ? formatPhone(selected.clientPhone) : 'WhatsApp'}
                  {selected.sector ? ` · ${selected.sector.name}` : ''}
                  {selected.attendantName && selected.status === 'active' ? ` · ${selected.attendantName.trim()}` : ''}
                </p>
              </div>
              {(selected.status === 'waiting' || selected.status === 'bot') && (
                <Button size="sm" onClick={() => accept(selected)} iconLeft={<Check size={14} />}>{selected.status === 'bot' ? 'Assumir' : 'Aceitar'}</Button>
              )}
              {selected.status === 'active' && canReply && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => setTransferOpen(true)} iconLeft={<ArrowRightLeft size={14} />}><span className="hidden sm:inline">Transferir</span></Button>
                  <Button size="sm" variant="success" onClick={() => setCloseOpen(true)}><span className="sm:hidden">Fim</span><span className="hidden sm:inline">Finalizar</span></Button>
                </div>
              )}
            </header>

            {(selected.subject || selected.clientDocument) && (
              <div className={`px-4 py-2 border-b ${border} text-xs flex flex-wrap items-center gap-x-4 gap-y-1 bg-amber-50/60 dark:bg-amber-500/5`}>
                {selected.subject && <span style={{ color: text }}>🛠️ <b>{selected.subject}</b></span>}
                {selected.clientDocument && (
                  <span style={{ color: muted }}>
                    🪪 {selected.clientDocument}{' '}
                    <b className={selected.linkedClientId ? 'text-green-600' : 'text-amber-600'}>{selected.linkedClientId ? '· cadastro localizado' : '· não está no cadastro'}</b>
                  </span>
                )}
                {selected.firstMessage && !selected.firstMessage.startsWith('Escolheu o setor') && <span className="basis-full truncate" style={{ color: muted }}>“{selected.firstMessage}”</span>}
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 space-y-1.5 bg-slate-50 dark:bg-[#0E1626]">
              {messages.map((m, i) => {
                const newDay = i === 0 || !sameDay(messages[i - 1].sentAt, m.sentAt);
                const sep = newDay && (
                  <div className="flex justify-center py-2">
                    <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-white dark:bg-white/10 shadow-sm" style={{ color: muted }}>{dayLabel(m.sentAt)}</span>
                  </div>
                );
                if (m.fromRole === 'system') {
                  return <React.Fragment key={m.id}>{sep}<div className="text-center text-[11px] py-1" style={{ color: muted }}>{m.body} · {hhmm(m.sentAt)}</div></React.Fragment>;
                }
                const mine = m.fromRole !== 'client', isBot = m.fromRole === 'bot';
                return (
                  <React.Fragment key={m.id}>
                    {sep}
                    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[88%] sm:max-w-[75%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words shadow-sm ${
                        isBot ? 'bg-amber-50 dark:bg-amber-500/10 border border-amber-200/70 dark:border-amber-500/30'
                        : mine ? 'text-white rounded-br-md' : 'bg-white dark:bg-white/10 border border-slate-200/70 dark:border-white/10 rounded-bl-md'}`}
                        style={{ color: mine && !isBot ? '#fff' : text, background: mine && !isBot ? NAVY : undefined }}>
                        {isBot && <div className="text-[10px] font-black mb-1 flex items-center gap-1" style={{ color: GOLD }}><Bot size={11} /> BOT</div>}
                        {m.body}
                        <div className="text-[10px] text-right mt-1 opacity-60">{hhmm(m.sentAt)}</div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <footer className={`p-2.5 sm:p-3 border-t ${border}`}>
              {selected.status === 'active' && canReply ? (
                <form onSubmit={e => { e.preventDefault(); send(); }} className="flex items-end gap-2">
                  <textarea rows={1} value={draft} placeholder="Digite sua resposta…"
                    onChange={e => setDraft(e.target.value)}
                    onInput={e => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = `${Math.min(t.scrollHeight, 120)}px`; }}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                    className={`flex-1 resize-none rounded-xl px-3.5 py-2.5 text-sm outline-none border ${border} bg-slate-50 dark:bg-white/5`} style={{ color: text }} />
                  <button type="submit" disabled={sending || !draft.trim()} aria-label="Enviar"
                    className="h-10 w-10 rounded-xl text-white disabled:opacity-40 flex items-center justify-center shrink-0" style={{ background: GOLD }}><Send size={16} /></button>
                </form>
              ) : (
                <p className="text-xs text-center py-2" style={{ color: muted }}>
                  {selected.status === 'bot' ? 'Conversa com o bot. Clique em Assumir para falar com o cliente.'
                    : selected.status === 'waiting' ? 'Aceite a conversa para responder.'
                    : selected.status === 'closed' ? 'Atendimento finalizado.'
                    : `Em atendimento por ${selected.attendantName?.trim()}.`}
                </p>
              )}
            </footer>
          </>
        )}
      </section>

      {attendantsOpen && <AttendantsModal onClose={() => setAttendantsOpen(false)} />}

      {transferOpen && (
        <Modal isOpen onClose={() => setTransferOpen(false)} title="Transferir para outro setor" size="sm"
          footer={<div className="flex gap-2"><Button type="button" variant="outline" onClick={() => setTransferOpen(false)}>Cancelar</Button><Button fullWidth onClick={transfer} disabled={!transferSector}>TRANSFERIR</Button></div>}>
          <div className="space-y-3">
            <Select label="Setor" value={transferSector} onChange={e => setTransferSector(e.target.value)}
              options={[{ value: '', label: 'Selecione o setor' }, ...sectors.filter(s => s.id !== selected?.sector?.id).map(s => ({ value: s.id, label: s.name }))]} />
            <Textarea label="Motivo (opcional)" rows={3} value={transferReason} onChange={e => setTransferReason(e.target.value)} />
          </div>
        </Modal>
      )}

      {closeOpen && (
        <Modal isOpen onClose={() => setCloseOpen(false)} title="Finalizar atendimento" size="sm"
          footer={<div className="flex gap-2"><Button type="button" variant="outline" onClick={() => setCloseOpen(false)}>Cancelar</Button><Button fullWidth variant="success" onClick={finish}>FINALIZAR</Button></div>}>
          <div className="space-y-3">
            <p className="text-xs text-slate-400">Mensagem de encerramento enviada ao cliente (deixe vazio para não enviar):</p>
            <Textarea rows={3} value={closingMsg} onChange={e => setClosingMsg(e.target.value)} />
          </div>
        </Modal>
      )}
    </div>
  );
}
