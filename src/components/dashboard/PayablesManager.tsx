import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Wallet, Plus, Edit2, Trash2, Building2, Boxes, RotateCcw, CheckCircle2, Clock, AlertCircle,
  TrendingUp, Receipt, ChevronLeft, ChevronRight, MoreVertical, Banknote, Repeat, Layers, ChevronDown,
} from 'lucide-react';
import { Button, Modal, Input, Select, Textarea, EmptyState, DatePicker } from '../ui';
import { useToast } from '../ui/Toast';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import type { Payable, PayablePayment, PayableType, InterestPeriod } from './types';
import { differenceInCalendarDays, addMonths, format, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── Configuração visual ─────────────────────────────────────────────────────

const TYPE_CONFIG: Record<PayableType, { label: string; hint: string; color: string; bg: string; icon: any }> = {
  fixed:         { label: 'Fixa',      hint: 'Todo mês, mesmo valor (aluguel, internet, hospedagem)', color: '#0D1F4E', bg: 'rgba(13,31,78,0.08)',  icon: Building2 },
  variable:      { label: 'Variável',  hint: 'Todo mês, mas o valor muda (energia, água, cartão)',    color: '#D97706', bg: 'rgba(217,119,6,0.1)',  icon: TrendingUp },
  normal:        { label: 'Avulsa',    hint: 'Um gasto pontual, à vista ou parcelado',                color: '#475569', bg: 'rgba(71,85,105,0.1)',  icon: Receipt },
  product:       { label: 'Sistema',   hint: 'Custo ligado a um sistema/produto seu',                 color: '#2563EB', bg: 'rgba(37,99,235,0.08)', icon: Boxes },
  reimbursement: { label: 'Reembolso', hint: 'Dinheiro seu que você investiu e quer receber de volta', color: '#C49A2A', bg: 'rgba(196,154,42,0.1)', icon: RotateCcw },
};

const INTEREST_PERIOD_LABEL: Record<InterestPeriod, string> = { day: 'ao dia', month: 'ao mês', year: 'ao ano' };
const PAY_METHODS = ['Pix', 'Boleto', 'Cartão', 'Transferência', 'Dinheiro'];

type View = 'month' | 'overdue' | 'all';

// ─── Utilidades ──────────────────────────────────────────────────────────────

const money = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Datas "só dia" vêm do servidor como meia-noite UTC; ler pelos componentes UTC evita cair no dia anterior (fuso do Brasil).
function parseDay(iso?: string | null): Date | null {
  if (!iso) return null;
  if (iso.endsWith('T00:00:00.000Z') || iso.length === 10) {
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

const fmtDate = (iso?: string | null) => { const d = parseDay(iso); return d ? format(d, 'dd/MM/yyyy') : '—'; };
const paidSum = (p: Payable) => (p.payments ?? []).reduce((a, x) => a + x.amount, 0);
const remaining = (p: Payable) => Math.max(0, p.amount - paidSum(p));
const startOfToday = () => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); };

function daysUntil(p: Payable, today: Date) {
  const d = parseDay(p.dueDate);
  return d ? differenceInCalendarDays(d, today) : null;
}
const isOverdue = (p: Payable, today: Date) => p.status !== 'paid' && (daysUntil(p, today) ?? 0) < 0;

// Multa + juros se pagar depois do vencimento
function lateCharges(p: Payable, payDate: Date) {
  const due = parseDay(p.dueDate);
  const daysLate = due ? Math.max(0, differenceInCalendarDays(payDate, due)) : 0;
  if (!daysLate) return { daysLate: 0, fine: 0, interest: 0, total: 0 };
  const base = remaining(p);
  const fine = p.finePercent ? base * (p.finePercent / 100) : 0;
  let periods = 0;
  if (p.interestRate && p.interestPeriod) {
    periods = p.interestPeriod === 'day' ? daysLate : p.interestPeriod === 'month' ? daysLate / 30 : daysLate / 365;
  }
  const interest = p.interestRate ? base * (p.interestRate / 100) * periods : 0;
  return { daysLate, fine, interest, total: fine + interest };
}

type RowState = { label: string; color: string; bg: string; icon: any };
function rowState(p: Payable, today: Date): RowState {
  if (p.status === 'paid') return { label: 'Paga', color: '#15803D', bg: 'rgba(21,128,61,0.1)', icon: CheckCircle2 };
  if (isOverdue(p, today)) return { label: 'Atrasada', color: '#DC2626', bg: 'rgba(220,38,38,0.1)', icon: AlertCircle };
  if (p.status === 'partial') return { label: 'Parcial', color: '#2563EB', bg: 'rgba(37,99,235,0.1)', icon: Banknote };
  return { label: 'A vencer', color: '#C49A2A', bg: 'rgba(196,154,42,0.12)', icon: Clock };
}

function dueText(p: Payable, today: Date) {
  const n = daysUntil(p, today);
  if (n === null) return 'Sem vencimento';
  if (p.status === 'paid') return `Paga em ${fmtDate(p.paidDate)}`;
  if (n < 0) return `Venceu ${fmtDate(p.dueDate)} · há ${-n} dia${-n > 1 ? 's' : ''}`;
  if (n === 0) return 'Vence hoje';
  if (n === 1) return 'Vence amanhã';
  return `Vence ${fmtDate(p.dueDate)} · em ${n} dias`;
}

// A linha "pai" de uma série/parcelamento é só um agrupador; o usuário vê as contas de cada mês.
const isGroupParent = (p: Payable) => !!p.recurrence && p.recurrence !== 'none' && !p.parentId;

// ─── Tela principal ──────────────────────────────────────────────────────────

export function PayablesManager() {
  const { isDark } = useTheme();
  const { show: toast } = useToast();
  const { profile, isAdmin } = useAuth();

  const [payables, setPayables] = useState<Payable[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('month');
  const [cursor, setCursor] = useState(() => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), 1); });
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | PayableType>('all');
  const [formState, setFormState] = useState<{ open: boolean; payable: Payable | null }>({ open: false, payable: null });
  const [payOf, setPayOf] = useState<Payable | null>(null);
  const [deleting, setDeleting] = useState<Payable | null>(null);
  const [showPaid, setShowPaid] = useState(true);

  const today = useMemo(startOfToday, []);
  const text = isDark ? '#fff' : '#0D1F4E';

  const fetchData = useCallback(async () => {
    try {
      const [pr, jr] = await Promise.all([
        fetch('/api/payables'),
        fetch(`/api/projects?userId=${profile?.uid ?? ''}&isAdmin=${isAdmin}`),
      ]);
      const [payablesData, projectsData] = await Promise.all([pr.json(), jr.json()]);
      setPayables(Array.isArray(payablesData) ? payablesData : []);
      setProjects(Array.isArray(projectsData) ? projectsData.map((p: any) => ({ id: p.id, name: p.name })) : []);
    } catch {
      toast('Não deu para carregar as contas agora. Tente de novo.', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast, profile?.uid, isAdmin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const visible = useMemo(() => payables.filter(p => !isGroupParent(p)), [payables]);

  // "3/12" para contas de uma série
  const seriesIndex = useMemo(() => {
    const groups = new Map<string, Payable[]>();
    visible.forEach(p => { if (p.parentId) groups.set(p.parentId, [...(groups.get(p.parentId) ?? []), p]); });
    const idx = new Map<string, { n: number; total: number; installments: boolean; openEnded: boolean }>();
    groups.forEach((list, parentId) => {
      const parent = payables.find(x => x.id === parentId);
      list.sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''));
      list.forEach((p, i) => idx.set(p.id, { n: i + 1, total: list.length, installments: parent?.recurrence === 'installments', openEnded: parent?.recurrence === 'monthly' && parent.recurrenceCount == null }));
    });
    return idx;
  }, [visible, payables]);

  const scoped = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visible.filter(p => {
      if (view === 'month') { const d = parseDay(p.dueDate); if (!d || !isSameMonth(d, cursor)) return false; }
      if (view === 'overdue' && !isOverdue(p, today)) return false;
      if (filterType !== 'all' && p.type !== filterType) return false;
      if (q && !p.description.toLowerCase().includes(q) && !(p.project?.name.toLowerCase().includes(q))) return false;
      return true;
    }).sort((a, b) => (a.dueDate ?? '9').localeCompare(b.dueDate ?? '9'));
  }, [visible, view, cursor, search, filterType, today]);

  const open = scoped.filter(p => p.status !== 'paid');
  const done = scoped.filter(p => p.status === 'paid');

  const toPay = open.reduce((a, p) => a + remaining(p), 0);
  const overdueTotal = open.filter(p => isOverdue(p, today)).reduce((a, p) => a + remaining(p), 0);
  const paidTotal = scoped.reduce((a, p) => a + paidSum(p), 0);
  const reimbursementPending = visible.filter(p => p.type === 'reimbursement' && !p.reimbursed).reduce((a, p) => a + p.amount, 0);
  const progress = paidTotal + toPay > 0 ? Math.round((paidTotal / (paidTotal + toPay)) * 100) : 0;

  const overdueCount = visible.filter(p => isOverdue(p, today)).length;

  const toggleReimbursed = async (p: Payable) => {
    try {
      const res = await fetch(`/api/payables/${p.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reimbursed: !p.reimbursed }),
      });
      if (!res.ok) throw new Error();
      fetchData();
    } catch { toast('Não deu para atualizar agora.', 'error'); }
  };

  const doDelete = async (scope?: 'following' | 'series') => {
    if (!deleting) return;
    try {
      const res = await fetch(`/api/payables/${deleting.id}${scope ? `?scope=${scope}` : ''}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast('Removido', 'success');
      fetchData();
    } catch { toast('Não deu para remover agora. Tente de novo.', 'error'); }
    finally { setDeleting(null); }
  };

  const openNew = () => setFormState({ open: true, payable: null });

  const renderRow = (p: Payable) => {
    const st = rowState(p, today);
    const tc = TYPE_CONFIG[p.type];
    const paid = paidSum(p);
    const sIdx = seriesIndex.get(p.id);
    const StIcon = st.icon;
    return (
      <div key={p.id} className="flex items-center gap-3 px-3.5 sm:px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: st.bg }}>
          <StIcon className="w-4 h-4" style={{ color: st.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold truncate" style={{ color: text }}>{p.description}</p>
            {sIdx && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300 flex items-center gap-1">
                {sIdx.installments ? <Layers className="w-3 h-3" /> : <Repeat className="w-3 h-3" />}{sIdx.openEnded ? 'Todo mês' : `${sIdx.n}/${sIdx.total}`}
              </span>
            )}
          </div>
          <p className="text-xs mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5" style={{ color: st.label === 'Atrasada' ? '#DC2626' : '#94A3B8' }}>
            <span className="inline-flex items-center gap-1" style={{ color: tc.color }}>
              <tc.icon className="w-3 h-3" /> {tc.label}
            </span>
            <span>· {dueText(p, today)}</span>
            {p.project?.name && <span>· {p.project.name}</span>}
            {p.type === 'reimbursement' && (
              <span className="font-bold" style={{ color: p.reimbursed ? '#15803D' : '#DC2626' }}>
                · {p.reimbursed ? 'reembolsado' : 'a reembolsar'}
              </span>
            )}
          </p>
          {paid > 0 && p.status !== 'paid' && (
            <p className="text-[11px] font-semibold mt-0.5" style={{ color: '#2563EB' }}>Pago {money(paid)} · falta {money(remaining(p))}</p>
          )}
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-sm font-black" style={{ color: p.status === 'paid' ? '#15803D' : text }}>{money(p.amount)}</p>
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: st.color }}>{st.label}</span>
        </div>

        {p.status !== 'paid' ? (
          <Button size="sm" onClick={() => setPayOf(p)}>Pagar</Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setPayOf(p)}>Detalhes</Button>
        )}

        <RowMenu items={[
          { label: 'Pagamentos', icon: Banknote, onClick: () => setPayOf(p) },
          { label: 'Editar', icon: Edit2, onClick: () => setFormState({ open: true, payable: p }) },
          ...(p.type === 'reimbursement' ? [{ label: p.reimbursed ? 'Desfazer reembolso' : 'Marcar como reembolsado', icon: RotateCcw, onClick: () => toggleReimbursed(p) }] : []),
          { label: 'Excluir', icon: Trash2, danger: true, onClick: () => setDeleting(p) },
        ]} />
      </div>
    );
  };

  const emptyText = view === 'overdue'
    ? { title: 'Nenhuma conta atrasada 🎉', description: 'Tudo em dia por aqui.' }
    : view === 'month'
      ? { title: 'Nada a pagar neste mês', description: 'Cadastre uma conta ou mude de mês.' }
      : { title: 'Nenhuma conta cadastrada', description: 'Comece cadastrando o primeiro gasto.' };

  return (
    <div className="space-y-4 sm:space-y-5 dashboard-density">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black tracking-tight" style={{ color: text }}>Contas a Pagar</h2>
          <p className="text-xs text-slate-400 mt-0.5">O que vence, o que já foi pago e o que está atrasado</p>
        </div>
        <Button iconLeft={<Plus className="w-4 h-4" />} onClick={openNew}>NOVA CONTA</Button>
      </div>

      {/* Período */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-white/5 self-start">
          {([
            ['month', 'Mês'],
            ['overdue', overdueCount ? `Atrasadas (${overdueCount})` : 'Atrasadas'],
            ['all', 'Todas'],
          ] as [View, string][]).map(([v, label]) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${view === v ? 'bg-white dark:bg-white/15 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}
              style={view === v ? { color: v === 'overdue' ? '#DC2626' : text } : undefined}>
              {label}
            </button>
          ))}
        </div>

        {view === 'month' && (
          <div className="inline-flex items-center gap-1 self-start">
            <button onClick={() => setCursor(addMonths(cursor, -1))} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500" aria-label="Mês anterior"><ChevronLeft className="w-4 h-4" /></button>
            <span className="min-w-[150px] text-center text-sm font-black capitalize" style={{ color: text }}>
              {format(cursor, "MMMM 'de' yyyy", { locale: ptBR })}
            </span>
            <button onClick={() => setCursor(addMonths(cursor, 1))} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500" aria-label="Próximo mês"><ChevronRight className="w-4 h-4" /></button>
            {!isSameMonth(cursor, new Date()) && (
              <button onClick={() => { const t = new Date(); setCursor(new Date(t.getFullYear(), t.getMonth(), 1)); }} className="ml-1 text-xs font-bold text-indigo-500 hover:underline">Hoje</button>
            )}
          </div>
        )}
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <Stat label="A pagar" value={money(toPay)} color="#C49A2A" icon={Wallet} text={text} />
        <Stat label="Atrasado" value={money(overdueTotal)} color="#DC2626" icon={AlertCircle} text={text} />
        <Stat label="Já pago" value={money(paidTotal)} color="#15803D" icon={CheckCircle2} text={text}
          footer={scoped.length > 0 ? (
            <div className="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${progress}%`, background: '#15803D' }} />
            </div>
          ) : undefined} />
        <Stat label="Falta te reembolsar" value={money(reimbursementPending)} color="#2563EB" icon={RotateCcw} text={text} />
      </div>

      {/* Busca e filtro */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="flex-1">
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por descrição ou sistema…" />
        </div>
        <Select
          aria-label="Filtrar por tipo"
          value={filterType}
          onChange={e => setFilterType(e.target.value as 'all' | PayableType)}
          className="sm:min-w-[180px]"
          options={[{ value: 'all', label: 'Todos os tipos' }, ...(Object.keys(TYPE_CONFIG) as PayableType[]).map(t => ({ value: t, label: TYPE_CONFIG[t].label }))]}
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Carregando…</div>
      ) : scoped.length === 0 ? (
        <EmptyState icon={Wallet} title={emptyText.title} description={emptyText.description}
          action={<Button onClick={openNew}>NOVA CONTA</Button>} />
      ) : (
        <div className="space-y-4">
          {open.length > 0 && (
            <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden">
              <div className="px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-white/5">
                Em aberto · {open.length}
              </div>
              <div className="divide-y divide-slate-100 dark:divide-white/5">{open.map(renderRow)}</div>
            </div>
          )}
          {done.length > 0 && (
            <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden">
              <button onClick={() => setShowPaid(v => !v)} className="w-full px-4 py-2 flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-white/5">
                <span>Pagas · {done.length}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showPaid ? '' : '-rotate-90'}`} />
              </button>
              {showPaid && <div className="divide-y divide-slate-100 dark:divide-white/5">{done.map(renderRow)}</div>}
            </div>
          )}
        </div>
      )}

      {formState.open && (
        <PayableFormModal
          payable={formState.payable}
          projects={projects}
          defaultDate={view === 'month' ? cursor : new Date()}
          onClose={() => setFormState({ open: false, payable: null })}
          onSuccess={() => { setFormState({ open: false, payable: null }); fetchData(); }}
        />
      )}

      {payOf && (
        <PayModal
          payable={payables.find(p => p.id === payOf.id) ?? payOf}
          onClose={() => setPayOf(null)}
          onChanged={fetchData}
        />
      )}

      {deleting && (
        <Modal isOpen onClose={() => setDeleting(null)} title="Excluir conta" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              <b style={{ color: text }}>{deleting.description}</b>
              {deleting.parentId ? ' faz parte de uma série. O que você quer excluir?' : ' será removida. Essa ação não pode ser desfeita.'}
            </p>
            {deleting.parentId ? (
              <div className="space-y-2">
                <Button fullWidth variant="outline" onClick={() => doDelete()}>Só esta conta</Button>
                <Button fullWidth variant="outline" onClick={() => doDelete('following')}>Esta e as próximas (pendentes)</Button>
                <Button fullWidth variant="danger" onClick={() => doDelete('series')}>A série inteira</Button>
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

// ─── Peças pequenas ──────────────────────────────────────────────────────────

function Stat({ label, value, color, icon: Icon, text, footer }: { label: string; value: string; color: string; icon: any; text: string; footer?: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-white/5 rounded-xl p-3.5 sm:p-4 shadow-sm border border-slate-200/60 dark:border-white/10">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{label}</p>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <p className="text-lg font-black truncate mt-1" style={{ color: text }}>{value}</p>
      {footer}
    </div>
  );
}

function RowMenu({ items }: { items: { label: string; icon: any; onClick: () => void; danger?: boolean }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button onClick={() => setOpen(v => !v)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Mais ações">
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 min-w-[200px] rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl py-1">
          {items.map(it => (
            <button key={it.label} onClick={() => { setOpen(false); it.onClick(); }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-left hover:bg-slate-50 dark:hover:bg-white/5 ${it.danger ? 'text-rose-600' : 'text-slate-600 dark:text-slate-200'}`}>
              <it.icon className="w-4 h-4" /> {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Pagamento ───────────────────────────────────────────────────────────────

function PayModal({ payable, onClose, onChanged }: { payable: Payable; onClose: () => void; onChanged: () => void }) {
  const { show: toast } = useToast();
  const [editing, setEditing] = useState<PayablePayment | null>(null);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState<string | null>(format(new Date(), 'yyyy-MM-dd'));
  const [method, setMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const paid = paidSum(payable);
  const left = remaining(payable);
  const payDate = date ? new Date(date + 'T12:00:00') : new Date();
  const charges = lateCharges(payable, payDate);
  const suggested = left + (left > 0 ? charges.total : 0);

  useEffect(() => {
    if (editing) {
      setAmount(String(editing.amount));
      setDate(editing.date ? editing.date.slice(0, 10) : null);
      setMethod(editing.method || '');
      setNotes(editing.notes || '');
    } else {
      setAmount(left > 0 ? suggested.toFixed(2) : '');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setMethod('');
      setNotes('');
    }
  }, [editing, payable.id, paid]); // eslint-disable-line

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/payments/${editing.id}` : `/api/payables/${payable.id}/payments`, {
        method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount) || 0, date, method, notes }),
      });
      if (!res.ok) throw new Error();
      toast(editing ? 'Pagamento atualizado' : 'Pagamento registrado', 'success');
      setEditing(null);
      onChanged();
    } catch { toast('Não deu para salvar o pagamento.', 'error'); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    try {
      const res = await fetch(`/api/payments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast('Pagamento removido', 'success');
      onChanged();
    } catch { toast('Não deu para remover.', 'error'); }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={payable.description}
      size="md"
      footer={(left > 0 || editing) ? (
        <div className="flex gap-2">
          {editing && <Button type="button" variant="outline" onClick={() => setEditing(null)}>CANCELAR</Button>}
          <Button type="submit" form="payment-form" loading={saving} fullWidth>
            {editing ? 'SALVAR' : left > 0 && Number(amount) >= left ? 'CONFIRMAR PAGAMENTO' : 'REGISTRAR PAGAMENTO'}
          </Button>
        </div>
      ) : undefined}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            ['Valor', money(payable.amount), '#0D1F4E'],
            ['Pago', money(paid), '#15803D'],
            ['Falta', money(left), left > 0 ? '#DC2626' : '#15803D'],
          ].map(([l, v, c]) => (
            <div key={l} className="rounded-xl bg-slate-50 dark:bg-white/5 py-2.5 px-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{l}</p>
              <p className="text-sm font-black mt-0.5" style={{ color: c }}>{v}</p>
            </div>
          ))}
        </div>

        {(payable.payments ?? []).length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Pagamentos feitos</p>
            {(payable.payments ?? []).map(pm => (
              <div key={pm.id} className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-white/10 px-3 py-2 text-sm">
                <span><b>{money(pm.amount)}</b> <span className="text-slate-400">· {fmtDate(pm.date)}{pm.method ? ` · ${pm.method}` : ''}</span></span>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(pm)} className="p-1.5 rounded text-slate-400 hover:text-slate-700" aria-label="Editar pagamento"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => remove(pm.id)} className="p-1.5 rounded text-slate-400 hover:text-rose-600" aria-label="Remover pagamento"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {(left > 0 || editing) && (
          <form id="payment-form" onSubmit={save} className="space-y-3">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{editing ? 'Editar pagamento' : 'Registrar pagamento'}</p>

            {!editing && charges.total > 0 && (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs px-3 py-2">
                Atrasada {charges.daysLate} dia{charges.daysLate > 1 ? 's' : ''}: multa + juros de <b>{money(charges.total)}</b>. Valor sugerido já inclui.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Valor pago" addonLeft="R$" type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} />
              <div className="flex flex-col gap-1.5 min-w-0">
                <label className="ds-label">Data do pagamento</label>
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
          </form>
        )}
      </div>
    </Modal>
  );
}

// ─── Cadastro / edição ───────────────────────────────────────────────────────

type PlanMode = 'once' | 'monthly' | 'installments';

function PayableFormModal({ payable, projects, defaultDate, onClose, onSuccess }: {
  payable: Payable | null; projects: { id: string; name: string }[]; defaultDate: Date; onClose: () => void; onSuccess: () => void;
}) {
  const { profile } = useAuth();
  const { show: toast } = useToast();
  const editing = !!payable;

  const [type, setType] = useState<PayableType>(payable?.type || 'fixed');
  const [description, setDescription] = useState(payable?.description || '');
  const [projectId, setProjectId] = useState(payable?.projectId || '');
  const [amount, setAmount] = useState(payable ? String(payable.amount) : '');
  const [dueDate, setDueDate] = useState<string | null>(
    payable?.dueDate ? format(parseDay(payable.dueDate)!, 'yyyy-MM-dd') : format(new Date(defaultDate.getFullYear(), defaultDate.getMonth(), Math.min(new Date().getDate(), 28)), 'yyyy-MM-dd'),
  );
  const [plan, setPlan] = useState<PlanMode>('monthly'); // Fixa/Variável nascem repetindo todo mês
  const [count, setCount] = useState(''); // mensal: vazio = sem prazo
  const [notes, setNotes] = useState(payable?.notes || '');
  const [fine, setFine] = useState(payable?.finePercent != null ? String(payable.finePercent) : '');
  const [interest, setInterest] = useState(payable?.interestRate != null ? String(payable.interestRate) : '');
  const [interestPeriod, setInterestPeriod] = useState<InterestPeriod>(payable?.interestPeriod ?? 'month');
  const [applyFollowing, setApplyFollowing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Ao trocar a categoria, sugere o jeito mais comum de pagar
  const pickType = (t: PayableType) => {
    setType(t);
    if (editing) return;
    setPlan(t === 'fixed' || t === 'variable' ? 'monthly' : 'once');
  };

  const canPlan = !editing && type !== 'reimbursement';
  const forever = plan === 'monthly' && !count.trim(); // aluguel, internet… sem data para acabar
  const defaultCount = plan === 'installments' ? 2 : 12;
  const n = Math.min(120, Math.max(plan === 'installments' ? 2 : 1, Math.floor(Number(count)) || defaultCount));
  const total = Number(amount) || 0;
  const firstDue = dueDate ? new Date(dueDate + 'T12:00:00') : null;

  const planPreview = (() => {
    if (!canPlan || plan === 'once' || !firstDue) return null;
    const last = addMonths(firstDue, n - 1);
    if (forever) return `Repete todo mês sem data para acabar. Já deixo criados os próximos 12 meses (até ${format(addMonths(firstDue, 11), 'dd/MM/yy')}) e o sistema cria os seguintes sozinho. Para encerrar, exclua "esta e as próximas".`;
    if (plan === 'monthly') return `${n} ${n === 1 ? 'conta' : 'contas'} de ${money(total)}, de ${format(firstDue, 'dd/MM/yy')} até ${format(last, 'dd/MM/yy')} (${n} ${n === 1 ? 'mês' : 'meses'}).`;
    return `${n}x de ${money(total / n)} — a última parcela vence em ${format(last, 'dd/MM/yy')}.`;
  })();

  const amountLabel =
    canPlan && plan === 'installments' ? 'Valor total' :
    type === 'variable' ? 'Valor estimado' : 'Valor';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'product' && !projectId) return toast('Escolha o sistema desta conta.', 'warning');
    if (!dueDate) return toast('Informe o vencimento.', 'warning');
    setSaving(true);
    try {
      const payload: any = {
        description: description.trim(),
        type,
        projectId: type === 'product' ? projectId : null,
        amount: total,
        dueDate,
        notes,
        createdById: profile?.uid,
        createdByName: profile?.displayName,
        interestRate: interest ? Number(interest) : null,
        interestPeriod: interest ? interestPeriod : null,
        finePercent: fine ? Number(fine) : null,
      };
      if (!editing && canPlan && plan !== 'once') payload.plan = { mode: plan, count: forever ? null : n };

      const url = editing ? `/api/payables/${payable!.id}${applyFollowing ? '?scope=following' : ''}` : '/api/payables';
      const res = await fetch(url, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error();
      toast(editing ? 'Alterações salvas' : plan !== 'once' && canPlan ? (forever ? 'Conta mensal cadastrada' : `${n} ${n === 1 ? 'conta criada' : 'contas criadas'}`) : 'Conta cadastrada', 'success');
      onSuccess();
    } catch {
      toast('Não deu para salvar agora. Confira os dados e tente de novo.', 'error');
    } finally { setSaving(false); }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={editing ? 'Editar conta' : 'Nova conta a pagar'}
      size="lg"
      footer={
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="payable-form" loading={saving} fullWidth size="lg">
            {editing ? 'SALVAR ALTERAÇÕES' : canPlan && plan !== 'once' && !forever ? `CRIAR ${n} ${n === 1 ? 'CONTA' : 'CONTAS'}` : 'CADASTRAR CONTA'}
          </Button>
        </div>
      }
    >
      <form id="payable-form" onSubmit={submit} className="space-y-5">
        {/* Categoria */}
        <div>
          <label className="ds-label">Que tipo de conta é?</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-1.5">
            {(Object.keys(TYPE_CONFIG) as PayableType[]).map(t => {
              const c = TYPE_CONFIG[t];
              const active = type === t;
              return (
                <button type="button" key={t} onClick={() => pickType(t)}
                  className="flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 text-xs font-bold transition-all"
                  style={{ borderColor: active ? c.color : 'transparent', background: active ? c.bg : 'rgba(148,163,184,0.1)', color: active ? c.color : '#64748B' }}>
                  <c.icon className="w-4 h-4" /> {c.label}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">{TYPE_CONFIG[type].hint}</p>
        </div>

        <Input label="Descrição" required autoFocus value={description} onChange={e => setDescription(e.target.value)}
          placeholder={type === 'fixed' ? 'Ex: Servidor VPS, Internet, Domínio…' : type === 'variable' ? 'Ex: Energia elétrica, Água…' : 'Ex: Notebook, Curso…'} />

        {type === 'product' && (
          <Select label="Qual sistema?" value={projectId} onChange={e => setProjectId(e.target.value)}
            options={[{ value: '', label: 'Selecione o sistema…' }, ...projects.map(p => ({ value: p.id, label: p.name }))]} />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label={amountLabel} addonLeft="R$" type="number" step="0.01" min="0" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" />
          <div className="flex flex-col gap-1.5 min-w-0">
            <label className="ds-label">{canPlan && plan !== 'once' ? 'Primeiro vencimento' : 'Vencimento'}</label>
            <DatePicker value={dueDate} onChange={setDueDate} />
          </div>
        </div>
        {type === 'variable' && !editing && (
          <p className="text-[11px] text-slate-400 -mt-3">Use uma média. Quando a conta de cada mês chegar, edite o valor real ou informe no pagamento.</p>
        )}

        {/* Como pagar */}
        {canPlan && (
          <div>
            <label className="ds-label">Como vai pagar?</label>
            <div className="grid grid-cols-3 gap-2 mt-1.5">
              {([
                ['once', 'À vista', 'Uma vez só', Receipt],
                ['monthly', 'Todo mês', 'Mesmo valor, repetindo', Repeat],
                ['installments', 'Parcelado', 'Divide o total', Layers],
              ] as [PlanMode, string, string, any][]).map(([m, title, sub, Icon]) => (
                <button type="button" key={m} onClick={() => { setPlan(m); setCount(m === 'installments' ? '12' : ''); }}
                  className={`text-left p-3 rounded-xl border-2 transition-all ${plan === m ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-transparent bg-slate-100/70 dark:bg-white/5'}`}>
                  <Icon className={`w-4 h-4 mb-1 ${plan === m ? 'text-indigo-500' : 'text-slate-400'}`} />
                  <p className={`text-xs font-black ${plan === m ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300'}`}>{title}</p>
                  <p className="text-[10px] text-slate-400 leading-tight">{sub}</p>
                </button>
              ))}
            </div>
            {plan !== 'once' && (
              <div className="mt-3 space-y-2.5">
                <label className="ds-label">{plan === 'monthly' ? 'Até quando?' : 'Em quantas parcelas?'}</label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {plan === 'monthly' && (
                    <button type="button" onClick={() => setCount('')}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors ${forever ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300'}`}>
                      Sem prazo
                    </button>
                  )}
                  {(plan === 'monthly' ? [6, 12, 24, 36] : [2, 3, 6, 10, 12]).map(v => (
                    <button type="button" key={v} onClick={() => setCount(String(v))}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors ${!forever && n === v ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300'}`}>
                      {plan === 'monthly' ? `${v} meses` : `${v}x`}
                    </button>
                  ))}
                  <div className="w-24">
                    <Input type="number" min={plan === 'installments' ? 2 : 1} max={120} value={count} onChange={e => setCount(e.target.value)} placeholder={plan === 'monthly' ? 'Outro' : String(defaultCount)} aria-label="Outra quantidade" />
                  </div>
                  {!forever && <span className="text-xs text-slate-400">{plan === 'monthly' ? 'meses' : 'parcelas'}</span>}
                </div>
                {planPreview && <p className="text-xs text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg px-3 py-2">{planPreview}</p>}
              </div>
            )}
          </div>
        )}

        {editing && payable?.parentId && (
          <label className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 rounded-xl px-3.5 py-3 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={applyFollowing} onChange={e => setApplyFollowing(e.target.checked)} />
            Aplicar descrição, valor e multa/juros também às próximas contas pendentes desta série
          </label>
        )}

        {/* Avançado */}
        <details className="group rounded-xl border border-slate-200 dark:border-white/10" open={!!(fine || interest)}>
          <summary className="cursor-pointer list-none flex items-center justify-between px-3.5 py-3 text-xs font-bold text-slate-500">
            <span>Multa e juros por atraso <span className="font-normal text-slate-400">(opcional)</span></span>
            <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-3.5 pb-3.5">
            <Input label="Multa" addonLeft="%" type="number" step="0.01" min="0" value={fine} onChange={e => setFine(e.target.value)} placeholder="2" />
            <Input label="Juros" addonLeft="%" type="number" step="0.01" min="0" value={interest} onChange={e => setInterest(e.target.value)} placeholder="1" />
            <Select label="Juros cobrados" value={interestPeriod} onChange={e => setInterestPeriod(e.target.value as InterestPeriod)}
              options={(['day', 'month', 'year'] as InterestPeriod[]).map(p => ({ value: p, label: INTEREST_PERIOD_LABEL[p] }))} />
          </div>
        </details>

        <Textarea label="Observações" value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Opcional" />
      </form>
    </Modal>
  );
}
