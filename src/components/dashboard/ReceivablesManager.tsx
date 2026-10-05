import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DollarSign, Plus, Edit2, Trash2, MessageCircle, Clock, AlertCircle, ShieldAlert, CheckCircle2,
  Undo2, RefreshCw, Repeat, ChevronDown, Bot, Users, Layers, Receipt, Banknote, FileText, Send,
} from 'lucide-react';
import { Button, Modal, Input, Select, Textarea, EmptyState, DatePicker } from '../ui';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import type { Client, ClientPayment, Receivable } from './types';
import { differenceInCalendarDays, format, isSameMonth, addMonths } from 'date-fns';
import { CYCLE_LABEL, ClientFormModal } from './ClientForm';
import { AsaasWebhookStatus } from './AsaasWebhookStatus';
import { useLiveEvents } from '../../lib/liveEvents';
import { PAY_METHODS, money, parseDay, fmtDate, startOfToday, firstOfMonth, Stat, RowMenu, PeriodBar } from './financeShared';

type View = 'month' | 'overdue' | 'all';
type Source = 'all' | 'subscription' | 'manual';

export interface RowState { key: 'ok' | 'soon' | 'overdue' | 'blocked' | 'paused' | 'cancelled' | 'none' | 'trial'; label: string; color: string; bg: string; icon: any }

export function clientState(c: Client, today: Date): RowState {
  const due = parseDay(c.nextDueDate);
  const diff = due ? differenceInCalendarDays(due, today) : null;
  if (c.status === 'cancelled') return { key: 'cancelled', label: 'Cancelado', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)', icon: AlertCircle };
  if (c.inTrial && c.status === 'active') return { key: 'trial', label: 'Em teste', color: '#7C3AED', bg: 'rgba(124,58,237,0.1)', icon: Clock };
  if (c.status === 'paused' && diff !== null && diff < 0) return { key: 'blocked', label: 'Bloqueado', color: '#7F1D1D', bg: 'rgba(127,29,29,0.12)', icon: ShieldAlert };
  if (c.status === 'paused') return { key: 'paused', label: 'Pausado', color: '#C49A2A', bg: 'rgba(196,154,42,0.12)', icon: Clock };
  if (diff === null) return { key: 'none', label: 'Sem vencimento', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)', icon: Clock };
  if (diff < 0) return { key: 'overdue', label: 'Atrasado', color: '#DC2626', bg: 'rgba(220,38,38,0.1)', icon: AlertCircle };
  if (diff <= (c.reminderDaysBefore ?? 5)) return { key: 'soon', label: 'Vence em breve', color: '#C49A2A', bg: 'rgba(196,154,42,0.12)', icon: Clock };
  return { key: 'ok', label: 'Em dia', color: '#15803D', bg: 'rgba(21,128,61,0.1)', icon: CheckCircle2 };
}

function relativeDue(iso: string | null | undefined, today: Date) {
  const due = parseDay(iso);
  if (!due) return 'Sem vencimento';
  const n = differenceInCalendarDays(due, today);
  if (n < 0) return `Venceu ${fmtDate(iso)} · há ${-n} dia${-n > 1 ? 's' : ''}`;
  if (n === 0) return 'Vence hoje';
  if (n === 1) return 'Vence amanhã';
  return `Vence ${fmtDate(iso)} · em ${n} dias`;
}

export function dueText(c: Client, today: Date) {
  return relativeDue(c.nextDueDate, today);
}

function manualState(r: Receivable, today: Date): RowState {
  if (r.status === 'received') return { key: 'ok', label: 'Recebido', color: '#15803D', bg: 'rgba(21,128,61,0.1)', icon: CheckCircle2 };
  const due = parseDay(r.dueDate);
  const diff = due ? differenceInCalendarDays(due, today) : 0;
  if (diff < 0) return { key: 'overdue', label: 'Atrasada', color: '#DC2626', bg: 'rgba(220,38,38,0.1)', icon: AlertCircle };
  if (diff <= 3) return { key: 'soon', label: 'Vence em breve', color: '#C49A2A', bg: 'rgba(196,154,42,0.12)', icon: Clock };
  return { key: 'ok', label: 'A receber', color: '#2563EB', bg: 'rgba(37,99,235,0.1)', icon: Receipt };
}

export function buildWhatsAppLink(client: Client) {
  const digits = (client.phone || '').replace(/\D/g, '');
  const to = digits.startsWith('55') ? digits : `55${digits}`;
  const text = `Olá, ${client.name.split(' ')[0]}! Passando para lembrar sobre o pagamento de ${money(client.billingValue || 0)}, com vencimento em ${client.nextDueDate ? fmtDate(client.nextDueDate) : 'breve'}. Qualquer dúvida, estou à disposição!`;
  return `https://wa.me/${to}?text=${encodeURIComponent(text)}`;
}

// Quanto o cliente rende por mês (anual divide por 12; único não conta)
const monthlyValue = (c: Client) => c.billingCycle === 'one_time' ? 0 : c.billingCycle === 'yearly' ? (c.billingValue || 0) / 12 : (c.billingValue || 0);

// Uma linha da lista: assinatura de cliente OU conta avulsa
type Entry =
  | { kind: 'sub'; id: string; name: string; amount: number; due: string | null; state: RowState; client: Client }
  | { kind: 'manual'; id: string; name: string; amount: number; due: string | null; state: RowState; rec: Receivable };

export function ReceivablesManager() {
  const { isDark } = useTheme();
  const { show: toast } = useToast();
  const { profile } = useAuth();

  // Cobrança/lembrete gentil: a BiIA manda a mensagem na hora, com o link da fatura
  const remindViaBot = async (c: Client) => {
    if (!window.confirm(`Enviar agora uma mensagem gentil pela BiIA para ${c.name}?`)) return;
    try {
      const res = await fetch(`/api/clients/${c.id}/billing/remind`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ byName: profile?.displayName, byEmail: profile?.email, byId: profile?.uid }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Não foi possível enviar');
      toast(`Mensagem enviada para ${c.name}`, 'success');
    } catch (e: any) { toast(e.message, 'error'); }
  };
  const text = isDark ? '#fff' : '#0D1F4E';

  const [clients, setClients] = useState<Client[]>([]);
  const [manual, setManual] = useState<Receivable[]>([]);
  const [users, setUsers] = useState<{ uid: string; displayName: string }[]>([]);
  const [received, setReceived] = useState<ClientPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('month');
  const [source, setSource] = useState<Source>('all');
  const [cursor, setCursor] = useState(() => firstOfMonth(new Date()));
  const [search, setSearch] = useState('');
  const [clientForm, setClientForm] = useState<{ open: boolean; client: Client | null }>({ open: false, client: null });
  const [recForm, setRecForm] = useState<{ open: boolean; rec: Receivable | null }>({ open: false, rec: null });
  const [receiveSub, setReceiveSub] = useState<Client | null>(null);
  const [receiveManual, setReceiveManual] = useState<Receivable | null>(null);
  const [deleting, setDeleting] = useState<Entry | null>(null);
  const [showReceived, setShowReceived] = useState(true);

  const today = useMemo(startOfToday, []);
  // os indicadores seguem o mês navegado; nas outras abas valem para o mês atual
  const kpiMonth = view === 'month' ? cursor : firstOfMonth(new Date());
  const kpiKey = format(kpiMonth, 'yyyy-MM');

  const fetchData = useCallback(async (silent = false) => {
    try {
      const [cr, rr, pr, ur] = await Promise.all([
        fetch('/api/clients'), fetch('/api/receivables'), fetch(`/api/client-payments?month=${kpiKey}`), fetch('/api/users'),
      ]);
      const [clientsData, manualData, paymentsData, usersData] = await Promise.all([cr.json(), rr.json(), pr.json(), ur.json()]);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setManual(Array.isArray(manualData) ? manualData : []);
      setReceived(Array.isArray(paymentsData) ? paymentsData : []);
      setUsers(Array.isArray(usersData) ? usersData.map((u: any) => ({ uid: u.uid, displayName: u.displayName })) : []);
    } catch {
      if (!silent) toast('Não deu para carregar as contas a receber agora. Tente de novo.', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast, kpiKey]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Atualiza sozinho assim que algo muda
  useLiveEvents(['Client', 'ClientPayment', 'Receivable', 'AsaasCharge'], () => fetchData(true));


  // ── monta as linhas ──
  const entries = useMemo<Entry[]>(() => {
    const subs: Entry[] = source === 'manual' ? [] : clients
      .filter(c => !c.inTrial && (c.status !== 'cancelled' || view === 'all'))
      .map(c => ({ kind: 'sub' as const, id: `c-${c.id}`, name: c.name, amount: c.billingValue || 0, due: c.nextDueDate ?? null, state: clientState(c, today), client: c }));
    const man: Entry[] = source === 'subscription' ? [] : manual
      .filter(r => r.status === 'pending')
      .map(r => ({ kind: 'manual' as const, id: `r-${r.id}`, name: r.description, amount: r.amount, due: r.dueDate, state: manualState(r, today), rec: r }));
    return [...subs, ...man];
  }, [clients, manual, source, view, today]);

  const q = search.trim().toLowerCase();
  const matches = (e: Entry) => !q
    || e.name.toLowerCase().includes(q)
    || (e.kind === 'sub' && ((e.client.document ?? '').toLowerCase().includes(q) || (e.client.phone ?? '').includes(q)))
    || (e.kind === 'manual' && ((e.rec.payerName ?? '').toLowerCase().includes(q) || (e.rec.client?.name ?? '').toLowerCase().includes(q)));

  const isLate = (e: Entry) => !!e.due && parseDay(e.due)! < today && e.state.key !== 'cancelled';
  const inMonth = (e: Entry, m: Date) => !!e.due && e.state.key !== 'cancelled' && isSameMonth(parseDay(e.due)!, m);

  const list = useMemo(() => {
    const byDue = (a: Entry, b: Entry) => (a.due ?? '9').localeCompare(b.due ?? '9');
    let rows = entries.filter(matches);
    if (view === 'month') rows = rows.filter(e => inMonth(e, cursor));
    else if (view === 'overdue') rows = rows.filter(isLate);
    return rows.sort(view === 'all' ? ((a, b) => a.name.localeCompare(b.name)) : byDue);
  }, [entries, view, cursor, q]); // eslint-disable-line

  // recebidos no mês navegado: pagamentos de assinatura + contas avulsas recebidas
  const receivedRows = useMemo(() => {
    if (view !== 'month') return [];
    type R = { id: string; name: string; amount: number; fee: number; at: string; method?: string | null; ref?: string | null; undo: () => void; receiptBase: string };
    const rows: R[] = [];
    if (source !== 'manual') received.forEach(p => rows.push({ id: `p-${p.id}`, name: p.client?.name ?? 'Cliente', amount: p.amount, fee: p.feeAmount ?? 0, at: p.paidAt, method: p.method, ref: p.dueDate, undo: () => undoSub(p.id), receiptBase: `/api/client-payments/${p.id}` }));
    if (source !== 'subscription') manual.filter(r => r.status === 'received' && r.receivedAt && isSameMonth(parseDay(r.receivedAt)!, kpiMonth))
      .forEach(r => rows.push({ id: `m-${r.id}`, name: r.description, amount: r.receivedAmount ?? r.amount, fee: r.feeAmount ?? 0, at: r.receivedAt!, method: r.method, ref: r.dueDate, undo: () => undoManual(r.id), receiptBase: `/api/receivables/${r.id}` }));
    return rows.filter(r => !q || r.name.toLowerCase().includes(q)).sort((a, b) => b.at.localeCompare(a.at));
  }, [view, source, received, manual, kpiMonth, q]); // eslint-disable-line

  // ── indicadores ──
  const monthEntries = entries.filter(e => inMonth(e, kpiMonth));
  const toReceive = monthEntries.reduce((a, e) => a + e.amount, 0);
  const receivedTotal = (source === 'manual' ? 0 : received.reduce((a, p) => a + p.amount, 0))
    + (source === 'subscription' ? 0 : manual.filter(r => r.status === 'received' && r.receivedAt && isSameMonth(parseDay(r.receivedAt)!, kpiMonth)).reduce((a, r) => a + (r.receivedAmount ?? r.amount), 0));
  const feesTotal = receivedRows.reduce((a, r) => a + r.fee, 0); // taxas descontadas (Asaas) nos recebimentos do mês
  const overdueEntries = entries.filter(isLate);
  const overdueTotal = overdueEntries.reduce((a, e) => a + e.amount, 0);
  const mrr = clients.filter(c => c.status === 'active').reduce((a, c) => a + monthlyValue(c), 0);
  const progress = receivedTotal + toReceive > 0 ? Math.round((receivedTotal / (receivedTotal + toReceive)) * 100) : 0;

  // ── ações ──
  async function call(url: string, method: string, ok: string, fail: string) {
    try {
      const res = await fetch(url, { method });
      if (!res.ok) throw new Error();
      toast(ok, 'success');
      fetchData();
    } catch { toast(fail, 'error'); }
  }
  async function sendReceipt(base: string) {
    try {
      const res = await fetch(`${base}/send-receipt`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Erro');
      toast(data.sent ? 'Recibo enviado no WhatsApp' : 'Não consegui enviar o recibo agora', data.sent ? 'success' : 'error');
    } catch (e: any) { toast(e.message || 'Não deu para enviar o recibo.', 'error'); }
  }
  function undoSub(id: string) { call(`/api/client-payments/${id}`, 'DELETE', 'Recebimento desfeito', 'Não deu para desfazer agora.'); }
  function undoManual(id: string) { call(`/api/receivables/${id}/undo`, 'POST', 'Recebimento desfeito', 'Não deu para desfazer agora.'); }

  const doDelete = async (scope?: 'following' | 'series') => {
    const e = deleting;
    if (!e) return;
    try {
      const url = e.kind === 'sub' ? `/api/clients/${e.client.id}` : `/api/receivables/${e.rec.id}${scope ? `?scope=${scope}` : ''}`;
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast('Removido', 'success');
      fetchData();
    } catch { toast('Não deu para remover agora. Tente de novo.', 'error'); }
    finally { setDeleting(null); }
  };

  const renderEntry = (e: Entry) => {
    const st = e.state;
    const StIcon = st.icon;
    const late = st.key === 'overdue' || st.key === 'blocked';
    const isSub = e.kind === 'sub';
    const c = isSub ? e.client : null;
    const r = !isSub ? e.rec : null;
    const canCharge = !!c?.phone && (st.key === 'overdue' || st.key === 'soon' || st.key === 'blocked');
    const projectsText = (c?.projects ?? []).map(p => p.project?.name).filter(Boolean).join(', ');
    const payer = r ? (r.client?.name ?? r.payerName) : null;

    return (
      <div key={e.id} className="flex items-center gap-3 px-3.5 sm:px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: st.bg }}>
          <StIcon className="w-4 h-4" style={{ color: st.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold truncate" style={{ color: text }}>{e.name}</p>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300 flex items-center gap-1">
              {isSub ? <><Repeat className="w-3 h-3" />Assinatura · {CYCLE_LABEL[c!.billingCycle]}</>
                : r!.installmentsTotal ? <><Layers className="w-3 h-3" />{r!.installmentNo}/{r!.installmentsTotal}</>
                : <><Receipt className="w-3 h-3" />Avulsa</>}
            </span>
          </div>
          <p className="text-xs mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5" style={{ color: late ? st.color : '#94A3B8' }}>
            <span>{relativeDue(e.due, today)}</span>
            {payer && <span>· {payer}</span>}
            {c?.sale?.productName && <span>· {c.sale.productName}</span>}
            {projectsText && <span>· {projectsText}</span>}
          </p>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-sm font-black" style={{ color: text }}>{money(e.amount)}</p>
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: st.color }}>{st.label}</span>
        </div>

        {isSub
          ? (c!.status !== 'cancelled' && !!c!.nextDueDate
              ? <Button size="sm" onClick={() => setReceiveSub(c!)}>Receber</Button>
              : <Button size="sm" variant="ghost" onClick={() => setReceiveSub(c!)}>Histórico</Button>)
          : <Button size="sm" onClick={() => setReceiveManual(r!)}>Receber</Button>}

        {canCharge && (
          <a href={buildWhatsAppLink(c!)} target="_blank" rel="noopener noreferrer" title="Cobrar no WhatsApp"
            className="p-2 rounded-lg text-white hover:opacity-90 transition-opacity flex-shrink-0" style={{ background: '#15803D' }}>
            <MessageCircle className="w-4 h-4" />
          </a>
        )}

        <RowMenu items={
          isSub ? [
            { label: 'Recebimentos', icon: Banknote, onClick: () => setReceiveSub(c!) },
            ...(c!.phone ? [{ label: 'Cobrar no WhatsApp', icon: MessageCircle, onClick: () => window.open(buildWhatsAppLink(c!), '_blank') }] : []),
            ...(c!.phone && c!.nextDueDate && c!.status !== 'cancelled' && (c!.billingValue ?? 0) > 0 ? [{ label: late ? 'Enviar cobrança gentil pela BiIA' : 'Enviar lembrete pela BiIA', icon: Bot, onClick: () => remindViaBot(c!) }] : []),
            { label: 'Editar assinatura', icon: Edit2, onClick: () => setClientForm({ open: true, client: c }) },
            { label: 'Excluir cliente', icon: Trash2, danger: true, onClick: () => setDeleting(e) },
          ] : [
            { label: 'Editar', icon: Edit2, onClick: () => setRecForm({ open: true, rec: r }) },
            { label: 'Excluir', icon: Trash2, danger: true, onClick: () => setDeleting(e) },
          ]
        } />
      </div>
    );
  };

  const empty = view === 'overdue'
    ? { title: 'Nada atrasado 🎉', description: 'Tudo que tinha para receber está em dia.' }
    : view === 'month'
      ? { title: 'Nada a receber neste mês', description: 'Nenhuma conta vence neste mês. Navegue entre os meses ou cadastre uma conta a receber.' }
      : { title: 'Nenhuma conta a receber', description: 'Cadastre um valor a receber ou a assinatura de um cliente.' };

  const hasAnything = list.length > 0 || receivedRows.length > 0;
  const openNew = () => setRecForm({ open: true, rec: null });

  return (
    <div className="space-y-4 sm:space-y-5 dashboard-density">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black tracking-tight" style={{ color: text }}>Contas a Receber</h2>
          <p className="text-xs text-slate-400 mt-0.5">Tudo que a empresa tem a receber: assinaturas dos clientes e valores avulsos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" iconLeft={<Users className="w-4 h-4" />} onClick={() => setClientForm({ open: true, client: null })}>NOVO CLIENTE</Button>
          <Button iconLeft={<Plus className="w-4 h-4" />} onClick={openNew}>NOVA CONTA</Button>
        </div>
      </div>

      <PeriodBar<View>
        options={[
          { value: 'month', label: 'Mês' },
          { value: 'overdue', label: overdueEntries.length ? `Atrasadas (${overdueEntries.length})` : 'Atrasadas', danger: true },
          { value: 'all', label: 'Todas' },
        ]}
        view={view} onView={setView} monthView="month" cursor={cursor} onCursor={setCursor} text={text}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <Stat label="A receber" value={money(toReceive)} color="#C49A2A" icon={Clock} text={text} />
        <Stat label="Recebido" value={money(receivedTotal)} color="#15803D" icon={CheckCircle2} text={text}
          footer={(receivedTotal + toReceive) > 0 ? (
            <>
            {feesTotal > 0 && <p className="mt-1 text-[11px] font-bold text-slate-400">Líquido {money(receivedTotal - feesTotal)} · taxas {money(feesTotal)}</p>}
            <div className="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${progress}%`, background: '#15803D' }} />
            </div>
            </>
          ) : undefined} />
        <Stat label="Atrasado" value={money(overdueTotal)} color="#DC2626" icon={AlertCircle} text={text} />
        <Stat label="Receita mensal (assinaturas)" value={money(mrr)} color="#2563EB" icon={RefreshCw} text={text} />
      </div>

      <AsaasWebhookStatus />

      <p className="flex items-center gap-2 text-xs text-slate-400 -mt-1">
        <Bot className="w-3.5 h-3.5 flex-shrink-0" />
        Assinaturas de clientes entram aqui sozinhas. O bot avisa o cliente antes do vencimento, no dia, quando atrasa e quando bloqueia, e a equipe recebe o resumo do dia.
      </p>

      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="flex-1">
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, descrição, CPF/CNPJ ou telefone…" />
        </div>
        <Select aria-label="Origem" value={source} onChange={e => setSource(e.target.value as Source)} className="sm:min-w-[210px]"
          options={[{ value: 'all', label: 'Assinaturas e avulsas' }, { value: 'subscription', label: 'Só assinaturas de clientes' }, { value: 'manual', label: 'Só contas avulsas' }]} />
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Carregando…</div>
      ) : !hasAnything ? (
        <EmptyState icon={DollarSign} title={empty.title} description={empty.description} action={<Button onClick={openNew}>NOVA CONTA</Button>} />
      ) : (
        <div className="space-y-4">
          {list.length > 0 && (
            <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden">
              <div className="px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-white/5">
                {view === 'month' ? 'A receber' : view === 'overdue' ? 'Atrasadas' : 'Todas'} · {list.length}
              </div>
              <div className="divide-y divide-slate-100 dark:divide-white/5">{list.map(renderEntry)}</div>
            </div>
          )}

          {view === 'month' && overdueEntries.length > 0 && (
            <button onClick={() => setView('overdue')} className="w-full text-left text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-500/10 rounded-xl px-4 py-3 hover:opacity-90">
              ⚠ {overdueEntries.length} {overdueEntries.length === 1 ? 'conta atrasada' : 'contas atrasadas'} ({money(overdueTotal)}) — ver atrasadas
            </button>
          )}

          {receivedRows.length > 0 && (
            <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden">
              <button onClick={() => setShowReceived(v => !v)} className="w-full px-4 py-2 flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-white/5">
                <span>Recebidos · {receivedRows.length}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showReceived ? '' : '-rotate-90'}`} />
              </button>
              {showReceived && (
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {receivedRows.map(p => (
                    <div key={p.id} className="flex items-center gap-3 px-3.5 sm:px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(21,128,61,0.1)' }}>
                        <CheckCircle2 className="w-4 h-4" style={{ color: '#15803D' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: text }}>{p.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Recebido em {fmtDate(p.at)}{p.method ? ` · ${p.method}` : ''}{p.ref ? ` · ref. venc. ${fmtDate(p.ref)}` : ''}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-black" style={{ color: '#15803D' }}>{money(p.amount - p.fee)}</p>
                        <span className="text-[10px] font-bold" style={{ color: p.fee > 0 ? '#64748b' : '#15803D' }}>{p.fee > 0 ? `cobrado ${money(p.amount)} · taxa ${money(p.fee)}` : 'RECEBIDO'}</span>
                      </div>
                      <RowMenu items={[
                        { label: 'Baixar recibo (PDF)', icon: FileText, onClick: () => window.open(`${p.receiptBase}/receipt.pdf`, '_blank') },
                        { label: 'Enviar recibo no WhatsApp', icon: Send, onClick: () => sendReceipt(p.receiptBase) },
                        { label: 'Desfazer recebimento', icon: Undo2, danger: true, onClick: p.undo },
                      ]} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {clientForm.open && (
        <ClientFormModal
          client={clientForm.client}
          users={users}
          onClose={() => setClientForm({ open: false, client: null })}
          onSaved={() => { setClientForm({ open: false, client: null }); fetchData(); }}
        />
      )}

      {recForm.open && (
        <ReceivableFormModal
          rec={recForm.rec}
          clients={clients}
          onClose={() => setRecForm({ open: false, rec: null })}
          onSaved={() => { setRecForm({ open: false, rec: null }); fetchData(); }}
        />
      )}

      {receiveSub && (
        <ReceiveModal
          client={clients.find(c => c.id === receiveSub.id) ?? receiveSub}
          today={today}
          onClose={() => setReceiveSub(null)}
          onChanged={fetchData}
          onUndo={async (id) => undoSub(id)}
        />
      )}

      {receiveManual && (
        <ReceiveManualModal
          rec={receiveManual}
          onClose={() => setReceiveManual(null)}
          onDone={() => { setReceiveManual(null); fetchData(); }}
        />
      )}

      {deleting && (
        <Modal isOpen onClose={() => setDeleting(null)} title={deleting.kind === 'sub' ? 'Excluir cliente' : 'Excluir conta'} size="sm">
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              <b style={{ color: text }}>{deleting.name}</b>
              {deleting.kind === 'sub'
                ? ' será removido da lista de Clientes e o histórico de recebimentos também é apagado. Essa ação não pode ser desfeita.'
                : deleting.rec.groupId ? ' faz parte de um parcelamento. O que você quer excluir?' : ' será removida. Essa ação não pode ser desfeita.'}
            </p>
            {deleting.kind === 'manual' && deleting.rec.groupId ? (
              <div className="space-y-2">
                <Button fullWidth variant="outline" onClick={() => doDelete()}>Só esta parcela</Button>
                <Button fullWidth variant="outline" onClick={() => doDelete('following')}>Esta e as próximas (pendentes)</Button>
                <Button fullWidth variant="danger" onClick={() => doDelete('series')}>O parcelamento inteiro</Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button fullWidth variant="outline" onClick={() => setDeleting(null)}>Cancelar</Button>
                <Button fullWidth variant="danger" onClick={() => doDelete()}>Excluir</Button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Conta avulsa: cadastro / edição ─────────────────────────────────────────

function ReceivableFormModal({ rec, clients, onClose, onSaved }: {
  rec: Receivable | null; clients: Client[]; onClose: () => void; onSaved: () => void;
}) {
  const { show: toast } = useToast();
  const editing = !!rec;
  const [description, setDescription] = useState(rec?.description ?? '');
  const [clientId, setClientId] = useState(rec?.clientId ?? '');
  const [payerName, setPayerName] = useState(rec?.payerName ?? '');
  const [amount, setAmount] = useState(rec ? String(rec.amount) : '');
  const [dueDate, setDueDate] = useState<string | null>(rec ? format(parseDay(rec.dueDate)!, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
  const [plan, setPlan] = useState<'once' | 'installments'>('once');
  const [count, setCount] = useState('3');
  const [notes, setNotes] = useState(rec?.notes ?? '');
  const [applyFollowing, setApplyFollowing] = useState(false);
  const [saving, setSaving] = useState(false);

  const total = Number(amount) || 0;
  const n = Math.min(120, Math.max(2, Math.floor(Number(count)) || 2));
  const first = dueDate ? new Date(dueDate + 'T12:00:00') : null;
  const preview = !editing && plan === 'installments' && first
    ? `${n}x de ${money(total / n)} — a última parcela vence em ${format(addMonths(first, n - 1), 'dd/MM/yy')}.` : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dueDate) return toast('Informe o vencimento.', 'warning');
    setSaving(true);
    try {
      const payload: any = { description: description.trim(), amount: total, dueDate, notes, clientId: clientId || null, payerName: clientId ? null : payerName.trim() || null };
      if (!editing && plan === 'installments') payload.plan = { mode: 'installments', count: n };
      const url = editing ? `/api/receivables/${rec!.id}${applyFollowing ? '?scope=following' : ''}` : '/api/receivables';
      const res = await fetch(url, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error();
      toast(editing ? 'Alterações salvas' : plan === 'installments' ? `${n} parcelas criadas` : 'Conta a receber cadastrada', 'success');
      onSaved();
    } catch { toast('Não deu para salvar agora. Confira os dados e tente de novo.', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={editing ? 'Editar conta a receber' : 'Nova conta a receber'}
      size="lg"
      footer={
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="receivable-form" loading={saving} fullWidth size="lg">
            {editing ? 'SALVAR ALTERAÇÕES' : plan === 'installments' ? `CRIAR ${n} PARCELAS` : 'CADASTRAR CONTA'}
          </Button>
        </div>
      }
    >
      <form id="receivable-form" onSubmit={submit} className="space-y-5">
        <p className="text-xs text-slate-400 -mt-1">Para a mensalidade de um cliente, use <b>Novo cliente</b>: a assinatura entra aqui sozinha.</p>

        <Input label="O que é?" required autoFocus value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Site da loja, Consultoria, Reembolso de viagem…" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Quem vai pagar?" value={clientId} onChange={e => setClientId(e.target.value)}
            options={[{ value: '', label: 'Outra pessoa / empresa' }, ...clients.map(c => ({ value: c.id, label: c.name }))]} />
          {!clientId && <Input label="Nome (opcional)" value={payerName} onChange={e => setPayerName(e.target.value)} placeholder="Ex: Maria, Empresa X" />}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label={!editing && plan === 'installments' ? 'Valor total' : 'Valor'} addonLeft="R$" type="number" step="0.01" min="0" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" />
          <div className="flex flex-col gap-1.5 min-w-0">
            <label className="ds-label">{!editing && plan === 'installments' ? 'Primeiro vencimento' : 'Vencimento'}</label>
            <DatePicker value={dueDate} onChange={setDueDate} />
          </div>
        </div>

        {!editing && (
          <div>
            <label className="ds-label">Como vai receber?</label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {([['once', 'À vista', 'De uma vez', Receipt], ['installments', 'Parcelado', 'Divide o total em meses', Layers]] as const).map(([m, t, sub, Icon]) => (
                <button type="button" key={m} onClick={() => setPlan(m)}
                  className={`text-left p-3 rounded-xl border-2 transition-all ${plan === m ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-transparent bg-slate-100/70 dark:bg-white/5'}`}>
                  <Icon className={`w-4 h-4 mb-1 ${plan === m ? 'text-indigo-500' : 'text-slate-400'}`} />
                  <p className={`text-xs font-black ${plan === m ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300'}`}>{t}</p>
                  <p className="text-[10px] text-slate-400 leading-tight">{sub}</p>
                </button>
              ))}
            </div>
            {plan === 'installments' && (
              <div className="mt-3 space-y-2.5">
                <label className="ds-label">Em quantas parcelas?</label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[2, 3, 6, 10, 12].map(v => (
                    <button type="button" key={v} onClick={() => setCount(String(v))}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors ${n === v ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300'}`}>
                      {v}x
                    </button>
                  ))}
                  <div className="w-24"><Input type="number" min={2} max={120} value={count} onChange={e => setCount(e.target.value)} aria-label="Outra quantidade" /></div>
                </div>
                {preview && <p className="text-xs text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg px-3 py-2">{preview}</p>}
              </div>
            )}
          </div>
        )}

        {editing && rec?.groupId && (
          <label className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 rounded-xl px-3.5 py-3 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={applyFollowing} onChange={e => setApplyFollowing(e.target.checked)} />
            Aplicar descrição, valor e observação também às próximas parcelas pendentes
          </label>
        )}

        <Textarea label="Observações" value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Opcional" />
      </form>
    </Modal>
  );
}

// ─── Conta avulsa: receber ───────────────────────────────────────────────────

function ReceiveManualModal({ rec, onClose, onDone }: { rec: Receivable; onClose: () => void; onDone: () => void }) {
  const { show: toast } = useToast();
  const [amount, setAmount] = useState(String(rec.amount));
  const [date, setDate] = useState<string | null>(format(new Date(), 'yyyy-MM-dd'));
  const [method, setMethod] = useState('');
  const [fee, setFee] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/receivables/${rec.id}/receive`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount) || 0, receivedAt: date, method, fee: Number(fee) || 0 }),
      });
      if (!res.ok) throw new Error();
      toast('Recebimento registrado', 'success');
      onDone();
    } catch { toast('Não deu para registrar o recebimento agora.', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={rec.description}
      size="md"
      footer={<Button type="submit" form="receive-manual-form" loading={saving} fullWidth size="lg">CONFIRMAR RECEBIMENTO</Button>}
    >
      <form id="receive-manual-form" onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl bg-slate-50 dark:bg-white/5 py-2.5 px-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Valor</p>
            <p className="text-sm font-black mt-0.5">{money(rec.amount)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-white/5 py-2.5 px-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vencimento</p>
            <p className="text-sm font-black mt-0.5">{fmtDate(rec.dueDate)}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Valor recebido" addonLeft="R$" type="number" step="0.01" min="0" required value={amount} onChange={e => setAmount(e.target.value)} />
          <div className="flex flex-col gap-1.5 min-w-0">
            <label className="ds-label">Data do recebimento</label>
            <DatePicker value={date} onChange={setDate} />
          </div>
        </div>
        <Input label="Taxa descontada (opcional)" addonLeft="R$" type="number" step="0.01" min="0" value={fee} onChange={e => setFee(e.target.value)} hint={fee && Number(fee) > 0 ? `Cai na conta: ${money((Number(amount) || 0) - Number(fee))}` : 'Pix, boleto ou cartão: informe se algum valor foi descontado'} />
        <div className="flex flex-wrap gap-1.5">
          {PAY_METHODS.map(m => (
            <button type="button" key={m} onClick={() => setMethod(method === m ? '' : m)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${method === m ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300'}`}>
              {m}
            </button>
          ))}
        </div>
      </form>
    </Modal>
  );
}

// ─── Receber ─────────────────────────────────────────────────────────────────

export function ReceiveModal({ client, today, onClose, onChanged, onUndo }: {
  client: Client; today: Date; onClose: () => void; onChanged: () => void; onUndo: (id: string) => Promise<void>;
}) {
  const { show: toast } = useToast();
  const [amount, setAmount] = useState(String(client.billingValue ?? ''));
  const [date, setDate] = useState<string | null>(format(new Date(), 'yyyy-MM-dd'));
  const [method, setMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [sendReceipt, setSendReceipt] = useState(!!client.phone);
  const [saving, setSaving] = useState(false);

  const st = clientState(client, today);
  const canReceive = !!client.nextDueDate && client.status !== 'cancelled';
  const payments = client.payments ?? [];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${client.id}/mark-paid`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount) || 0, paidAt: date, method, notes, sendReceipt }),
      });
      if (!res.ok) throw new Error();
      const out = await res.json().catch(() => ({}));
      toast(sendReceipt && out.receipt ? (out.receipt.sent ? 'Recebimento registrado e recibo enviado no WhatsApp' : `Recebimento registrado. Recibo não enviado: ${out.receipt.error ?? 'WhatsApp indisponível'}`) : 'Recebimento registrado', 'success');
      onChanged();
      onClose();
    } catch { toast('Não deu para registrar o recebimento agora.', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={client.name}
      size="md"
      footer={canReceive ? (
        <Button type="submit" form="receive-form" loading={saving} fullWidth size="lg">CONFIRMAR RECEBIMENTO</Button>
      ) : undefined}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-slate-50 dark:bg-white/5 py-2.5 px-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assinatura</p>
            <p className="text-sm font-black mt-0.5">{money(client.billingValue || 0)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-white/5 py-2.5 px-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vencimento</p>
            <p className="text-sm font-black mt-0.5">{client.nextDueDate ? format(parseDay(client.nextDueDate)!, 'dd/MM/yy') : '—'}</p>
          </div>
          <div className="rounded-xl py-2.5 px-2" style={{ background: st.bg }}>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: st.color }}>Situação</p>
            <p className="text-sm font-black mt-0.5" style={{ color: st.color }}>{st.label}</p>
          </div>
        </div>

        {canReceive ? (
          <form id="receive-form" onSubmit={submit} className="space-y-3">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Registrar recebimento</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Valor recebido" addonLeft="R$" type="number" step="0.01" min="0" required value={amount} onChange={e => setAmount(e.target.value)} />
              <div className="flex flex-col gap-1.5 min-w-0">
                <label className="ds-label">Data do recebimento</label>
                <DatePicker value={date} onChange={setDate} />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PAY_METHODS.map(m => (
                <button type="button" key={m} onClick={() => setMethod(method === m ? '' : m)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${method === m ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300'}`}>
                  {m}
                </button>
              ))}
            </div>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observação (opcional)" />
            <label className={`flex items-center gap-2 text-sm cursor-pointer ${client.phone ? 'text-slate-600 dark:text-slate-300' : 'text-slate-300'}`}>
              <input type="checkbox" className="w-4 h-4 accent-indigo-600" disabled={!client.phone} checked={sendReceipt && !!client.phone} onChange={e => setSendReceipt(e.target.checked)} />
              Enviar o recibo em PDF no WhatsApp do cliente{!client.phone ? ' (sem WhatsApp cadastrado)' : ''}
            </label>
            {client.billingCycle !== 'one_time' && (
              <p className="text-[11px] text-slate-400">Ao confirmar, o próximo vencimento avança para o ciclo seguinte.</p>
            )}
          </form>
        ) : (
          <p className="text-sm text-slate-400 text-center">
            {client.status === 'cancelled' ? 'Cliente cancelado.' : 'Sem vencimento aberto. Edite o cliente para definir o próximo vencimento.'}
          </p>
        )}

        {payments.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Últimos recebimentos</p>
            {payments.map(p => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-white/10 px-3 py-2 text-sm">
                <span><b>{money(p.amount - (p.feeAmount ?? 0))}</b> <span className="text-slate-400">· {fmtDate(p.paidAt)}{p.method ? ` · ${p.method}` : ''}{p.feeAmount ? ` · cobrado ${money(p.amount)}, taxa ${money(p.feeAmount)}` : ''}</span></span>
                <button onClick={async () => { await onUndo(p.id); }} className="p-1.5 rounded text-slate-400 hover:text-rose-600" aria-label="Desfazer recebimento" title="Desfazer">
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
