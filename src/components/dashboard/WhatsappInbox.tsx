import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { MessageCircle, Clock, UserCheck, CheckCircle2, Send, ArrowRightLeft, X, Search, Phone, Inbox, Bot, Users } from 'lucide-react';
import { AttendantsModal } from './AttendantsModal';
import { useToast } from '../ui/Toast';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLiveEvents } from '../../lib/liveEvents';

type ConvStatus = 'bot' | 'waiting' | 'active' | 'closed';

interface Sector { id: string; name: string }
interface WaMessage { id: string; fromRole: 'client' | 'attendant' | 'bot' | 'system'; body: string; sentAt: string }
interface Conversation {
  id: string;
  clientPhone: string;
  clientName?: string | null;
  attendantId?: string | null;
  attendantName?: string | null;
  status: ConvStatus;
  firstMessage?: string | null;
  queuedAt: string;
  updatedAt: string;
  sector?: Sector | null;
  lastMessage?: WaMessage | null;
}

const NAVY = '#0D1F4E';
const GOLD = '#C49A2A';

const TABS: { key: ConvStatus; label: string; icon: any }[] = [
  { key: 'bot', label: 'Bot', icon: Bot },
  { key: 'waiting', label: 'Fila', icon: Clock },
  { key: 'active', label: 'Em atendimento', icon: UserCheck },
  { key: 'closed', label: 'Finalizadas', icon: CheckCircle2 },
];

const isRealPhone = (p: string) => p.replace(/\D/g, '').length <= 13;
const personLabel = (c: { clientName?: string | null; clientPhone: string }) => c.clientName || (isRealPhone(c.clientPhone) ? formatPhone(c.clientPhone) : 'Cliente');

function formatPhone(p: string) {
  const d = p.replace(/\D/g, '');
  if (d.length === 13) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  if (d.length === 12) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 8)}-${d.slice(8)}`;
  return p;
}

function waitingFor(iso: string) {
  const min = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 1) return 'agora';
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h ${min % 60}min`;
}

function hhmm(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function WhatsappInbox() {
  const { isDark } = useTheme();
  const { show: toast } = useToast();
  const { profile } = useAuth();
  const myId = profile?.uid;
  const myName = profile?.displayName || 'Atendente';

  const [tab, setTab] = useState<ConvStatus>('waiting');
  const [sectorFilter, setSectorFilter] = useState('');
  const [search, setSearch] = useState('');
  const [onlyMine, setOnlyMine] = useState(false);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [all, setAll] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<WaMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferSector, setTransferSector] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [closeOpen, setCloseOpen] = useState(false);
  const [attendantsOpen, setAttendantsOpen] = useState(false);
  const [closingMsg, setClosingMsg] = useState('Atendimento finalizado. Agradecemos o contato! Qualquer dúvida, é só chamar. 😊');
  const lastWaiting = useRef<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const bg = isDark ? '#0B1220' : '#fff';
  const panel = isDark ? '#111A2E' : '#F8F9FC';
  const border = isDark ? 'rgba(255,255,255,0.08)' : '#E4E8F2';
  const text = isDark ? '#E6EAF5' : NAVY;
  const muted = isDark ? '#8B96B3' : '#6B7794';

  const loadList = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/bot/conversations?status=bot,waiting,active,closed');
      if (!r.ok) return;
      const data: Conversation[] = await r.json();
      setAll(data);
      const waiting = data.filter(c => c.status === 'waiting').length;
      if (lastWaiting.current !== null && waiting > lastWaiting.current) {
        toast('Nova conversa na fila de atendimento', 'info');
      }
      lastWaiting.current = waiting;
    } catch {}
  }, [toast]);

  const loadMessages = useCallback(async (id: string) => {
    try {
      const r = await fetch(`/api/admin/bot/conversations/${id}/messages`);
      if (r.ok) setMessages(await r.json());
    } catch {}
  }, []);

  useEffect(() => {
    fetch('/api/admin/bot/sectors').then(r => r.json()).then(setSectors).catch(() => {});
  }, []);

  useEffect(() => {
    loadList();
    const t = setInterval(loadList, 4000);
    return () => clearInterval(t);
  }, [loadList]);

  useEffect(() => {
    if (!selectedId) { setMessages([]); return; }
    loadMessages(selectedId);
    const t = setInterval(() => loadMessages(selectedId), 3000);
    return () => clearInterval(t);
  }, [selectedId, loadMessages]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length, selectedId]);

  // Nova mensagem / conversa aparece na hora (além da verificação periódica)
  useLiveEvents(['WppConversation', 'WppConversationMessage'], () => { loadList(); if (selectedId) loadMessages(selectedId); });

  const counts = useMemo(() => ({
    bot: all.filter(c => c.status === 'bot').length,
    waiting: all.filter(c => c.status === 'waiting').length,
    active: all.filter(c => c.status === 'active').length,
    closed: all.filter(c => c.status === 'closed').length,
  }), [all]);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = all.filter(c => c.status === tab);
    if (sectorFilter) rows = rows.filter(c => c.sector?.id === sectorFilter);
    if (onlyMine && tab === 'active') rows = rows.filter(c => c.attendantId === myId);
    if (q) rows = rows.filter(c => (c.clientName || '').toLowerCase().includes(q) || c.clientPhone.includes(q));
    // fila: quem espera há mais tempo primeiro
    if (tab === 'waiting') rows = [...rows].sort((a, b) => new Date(a.queuedAt).getTime() - new Date(b.queuedAt).getTime());
    return rows;
  }, [all, tab, sectorFilter, onlyMine, search, myId]);

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
      setTab('active');
      setSelectedId(c.id);
      toast('Atendimento iniciado', 'success');
      loadList();
    } catch (e: any) { toast(e.message, 'error'); loadList(); }
  }

  async function send() {
    if (!selected || !draft.trim() || sending) return;
    setSending(true);
    try {
      await post('/api/admin/bot/conversations/message', { conversationId: selected.id, body: draft.trim() });
      setDraft('');
      loadMessages(selected.id);
      loadList();
    } catch (e: any) { toast(e.message, 'error'); }
    setSending(false);
  }

  async function transfer() {
    if (!selected || !transferSector) return;
    try {
      await post(`/api/admin/bot/conversations/${selected.id}/transfer`, { sectorId: transferSector, reason: transferReason.trim(), byName: myName });
      toast('Conversa transferida', 'success');
      setTransferOpen(false); setTransferSector(''); setTransferReason('');
      setSelectedId(null);
      loadList();
    } catch (e: any) { toast(e.message, 'error'); }
  }

  async function finish() {
    if (!selected) return;
    try {
      await post(`/api/admin/bot/conversations/${selected.id}/close`, { closingMessage: closingMsg, byName: myName });
      toast('Atendimento finalizado', 'success');
      setCloseOpen(false);
      loadMessages(selected.id);
      loadList();
    } catch (e: any) { toast(e.message, 'error'); }
  }

  const inputCls = 'w-full rounded-lg px-3 py-2 text-sm outline-none border';
  const inputStyle = { background: panel, borderColor: border, color: text };

  return (
    <div className="flex flex-col lg:flex-row rounded-2xl overflow-hidden border" style={{ background: bg, borderColor: border, height: 'calc(100vh - 190px)', minHeight: 520 }}>
      {/* ── Lista ── */}
      <div className={`${selected ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-[360px] border-r shrink-0`} style={{ borderColor: border }}>
        <div className="flex border-b" style={{ borderColor: border }}>
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 transition-colors"
                style={{ color: active ? GOLD : muted, borderBottom: `2px solid ${active ? GOLD : 'transparent'}` }}>
                <span className="flex items-center gap-1"><Icon size={14} />{t.label}</span>
                <span className="text-[11px] px-1.5 rounded-full" style={{ background: active ? 'rgba(196,154,42,0.15)' : panel }}>{counts[t.key]}</span>
              </button>
            );
          })}
        </div>

        <div className="p-3 space-y-2 border-b" style={{ borderColor: border }}>
          <button onClick={() => setAttendantsOpen(true)} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold border" style={{ borderColor: border, color: text, background: panel }}>
            <Users size={14} /> Equipe de atendimento
          </button>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: muted }} />
            <input className={inputCls} style={{ ...inputStyle, paddingLeft: 32 }} placeholder="Buscar nome ou telefone" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <select className={inputCls} style={inputStyle} value={sectorFilter} onChange={e => setSectorFilter(e.target.value)}>
              <option value="">Todos os setores</option>
              {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {tab === 'active' && (
              <button onClick={() => setOnlyMine(v => !v)} className="px-3 rounded-lg text-xs font-bold border whitespace-nowrap"
                style={{ borderColor: onlyMine ? GOLD : border, color: onlyMine ? GOLD : muted, background: panel }}>
                Meus
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {list.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-2" style={{ color: muted }}>
              <Inbox size={32} />
              <p className="text-sm">{tab === 'waiting' ? 'Fila vazia' : 'Nenhuma conversa'}</p>
            </div>
          )}
          {list.map(c => (
            <button key={c.id} onClick={() => setSelectedId(c.id)}
              className="w-full text-left px-4 py-3 border-b flex gap-3 transition-colors"
              style={{ borderColor: border, background: selectedId === c.id ? (isDark ? 'rgba(196,154,42,0.1)' : 'rgba(196,154,42,0.08)') : 'transparent' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm" style={{ background: NAVY }}>
                {c.clientName ? c.clientName[0].toUpperCase() : <Phone size={16} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <span className="font-bold text-sm truncate" style={{ color: text }}>{personLabel(c)}</span>
                  <span className="text-[11px] shrink-0" style={{ color: c.status === 'waiting' ? GOLD : muted }}>
                    {c.status === 'waiting' ? waitingFor(c.queuedAt) : hhmm(c.updatedAt)}
                  </span>
                </div>
                <p className="text-xs truncate" style={{ color: muted }}>
                  {c.lastMessage?.body || c.firstMessage || '—'}
                </p>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  {c.sector && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(13,31,78,0.08)', color: isDark ? '#9DB2F5' : NAVY }}>{c.sector.name}</span>}
                  {c.attendantName && c.status !== 'waiting' && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: panel, color: muted }}>{c.attendantName}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Chat ── */}
      <div className={`${selected ? 'flex' : 'hidden lg:flex'} flex-col flex-1 min-w-0`}>
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3" style={{ color: muted }}>
            <MessageCircle size={44} />
            <p className="text-sm">Selecione uma conversa</p>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b flex items-center gap-3" style={{ borderColor: border }}>
              <button className="lg:hidden p-1" onClick={() => setSelectedId(null)} style={{ color: muted }}><X size={18} /></button>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm truncate" style={{ color: text }}>{personLabel(selected)}</p>
                <p className="text-xs truncate" style={{ color: muted }}>
                  {isRealPhone(selected.clientPhone) ? formatPhone(selected.clientPhone) : 'WhatsApp'}{selected.sector ? ` · ${selected.sector.name}` : ''}
                  {selected.attendantName && selected.status !== 'waiting' && selected.status !== 'bot' ? ` · ${selected.attendantName}` : ''}
                </p>
              </div>
              {(selected.status === 'waiting' || selected.status === 'bot') && (
                <button onClick={() => accept(selected)} className="px-4 py-2 rounded-lg text-sm font-bold text-white" style={{ background: NAVY }}>
                  {selected.status === 'bot' ? 'Assumir' : 'Aceitar'}
                </button>
              )}
              {selected.status === 'active' && canReply && (
                <>
                  <button onClick={() => setTransferOpen(true)} className="px-3 py-2 rounded-lg text-xs font-bold border flex items-center gap-1.5" style={{ borderColor: border, color: text }}>
                    <ArrowRightLeft size={14} /> Transferir
                  </button>
                  <button onClick={() => setCloseOpen(true)} className="px-3 py-2 rounded-lg text-xs font-bold text-white" style={{ background: '#15803D' }}>Finalizar</button>
                </>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ background: panel }}>
              {messages.map(m => {
                if (m.fromRole === 'system') {
                  return <div key={m.id} className="text-center text-[11px] py-1" style={{ color: muted }}>{m.body} · {hhmm(m.sentAt)}</div>;
                }
                const mine = m.fromRole !== 'client';
                const isBot = m.fromRole === 'bot';
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[78%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words"
                      style={{
                        background: isBot ? (isDark ? 'rgba(196,154,42,0.15)' : 'rgba(196,154,42,0.12)') : mine ? NAVY : bg,
                        color: mine && !isBot ? '#fff' : text,
                        border: mine && !isBot ? 'none' : `1px solid ${isBot ? 'rgba(196,154,42,0.35)' : border}`,
                      }}>
                      {isBot && <div className="text-[10px] font-black mb-1 flex items-center gap-1" style={{ color: GOLD }}><Bot size={11} /> BOT</div>}
                      {m.body}
                      <div className="text-[10px] text-right mt-1 opacity-60">{hhmm(m.sentAt)}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="p-3 border-t" style={{ borderColor: border }}>
              {selected.status === 'active' && canReply ? (
                <form onSubmit={e => { e.preventDefault(); send(); }} className="flex gap-2">
                  <input className={inputCls} style={inputStyle} placeholder="Digite sua resposta…" value={draft} onChange={e => setDraft(e.target.value)} />
                  <button type="submit" disabled={sending || !draft.trim()} className="px-4 rounded-lg text-white disabled:opacity-40" style={{ background: GOLD }}><Send size={16} /></button>
                </form>
              ) : (
                <p className="text-xs text-center py-2" style={{ color: muted }}>
                  {selected.status === 'bot' ? 'Conversa com o bot. Clique em Assumir para falar com o cliente.'
                    : selected.status === 'waiting' ? 'Aceite a conversa para responder.'
                    : selected.status === 'closed' ? 'Atendimento finalizado.'
                    : `Em atendimento por ${selected.attendantName}.`}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {attendantsOpen && <AttendantsModal onClose={() => setAttendantsOpen(false)} />}

      {/* ── Modais ── */}
      {(transferOpen || closeOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => { setTransferOpen(false); setCloseOpen(false); }}>
          <div className="w-full max-w-md rounded-2xl p-5 space-y-3" style={{ background: bg, color: text }} onClick={e => e.stopPropagation()}>
            {transferOpen ? (
              <>
                <h3 className="font-bold">Transferir para outro setor</h3>
                <select className={inputCls} style={inputStyle} value={transferSector} onChange={e => setTransferSector(e.target.value)}>
                  <option value="">Selecione o setor</option>
                  {sectors.filter(s => s.id !== selected?.sector?.id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <textarea className={inputCls} style={inputStyle} rows={3} placeholder="Motivo (opcional)" value={transferReason} onChange={e => setTransferReason(e.target.value)} />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setTransferOpen(false)} className="px-4 py-2 text-sm rounded-lg border" style={{ borderColor: border }}>Cancelar</button>
                  <button onClick={transfer} disabled={!transferSector} className="px-4 py-2 text-sm rounded-lg text-white font-bold disabled:opacity-40" style={{ background: NAVY }}>Transferir</button>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-bold">Finalizar atendimento</h3>
                <p className="text-xs" style={{ color: muted }}>Mensagem de encerramento enviada ao cliente (deixe vazio para não enviar):</p>
                <textarea className={inputCls} style={inputStyle} rows={3} value={closingMsg} onChange={e => setClosingMsg(e.target.value)} />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setCloseOpen(false)} className="px-4 py-2 text-sm rounded-lg border" style={{ borderColor: border }}>Cancelar</button>
                  <button onClick={finish} className="px-4 py-2 text-sm rounded-lg text-white font-bold" style={{ background: '#15803D' }}>Finalizar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
