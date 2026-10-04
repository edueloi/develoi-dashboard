import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, Plus, ChevronLeft, ChevronRight, Lock, Unlock, CheckCircle2, Wallet, TrendingUp, TrendingDown, PiggyBank, Landmark,
  Trash2, AlertCircle, History, CalendarRange, RotateCcw, CalendarDays, Settings2, ArrowRight,
} from 'lucide-react';
import { Button, Modal, Input, EmptyState } from '../ui';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { useLiveEvents } from '../../lib/liveEvents';
import { money } from './financeShared';

interface Partner { id: string; name: string; sharePercent: number; email?: string | null; role?: string | null; color?: string | null; active: boolean }
interface Config { reservePercent: number; reimbursementsAsExpense: boolean; basis: 'planned' | 'cash'; policy?: 'debt_first' | 'expense' | 'ignore' }
interface Share { partnerId: string; name: string; percent: number; amount: number; color?: string | null; paid?: boolean; paidAt?: string | null }
interface MonthData {
  month: string; basis: 'planned' | 'cash'; closed: boolean; closedAt?: string | null; closedByName?: string | null;
  revenueDone: number; revenuePending: number; expensesDone: number; expensesPending: number;
  policy: 'debt_first' | 'expense' | 'ignore'; debtPaid: number; debtBefore: number; debtAfter: number;
  debts: { id: string; description: string; by: string | null; dueDate: string | null; amount: number; remaining: number }[];
  compare: { basis: 'planned' | 'cash'; revenue: number; expenses: number; profit: number };
  revenue: number; expenses: number; profit: number; reserve: number; distributable: number; reservePercent: number;
  revenueBy: { label: string; amount: number; done: number }[]; expensesBy: { label: string; amount: number; done: number }[];
  topClients: { label: string; amount: number }[]; topExpenses: { label: string; amount: number }[];
  shares: Share[]; percentTotal: number;
}
interface YearMonth { month: string; closed: boolean; future: boolean; revenue: number; expenses: number; profit: number; debtPaid: number; reserve: number; distributable: number; shares: Share[] }
interface YearData { year: number; debtNow: number; months: YearMonth[]; totals: { revenue: number; expenses: number; profit: number; debtPaid: number; reserve: number; distributable: number }; partners: { id: string; name: string; color: string | null; amount: number; paid: number }[] }

const PALETTE = ['#0D1F4E', '#C49A2A', '#15803D', '#7C3AED', '#DC2626', '#0891B2', '#EA580C', '#DB2777'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const nowMonth = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
const shiftMonth = (m: string, n: number) => { const [y, mo] = m.split('-').map(Number); const d = new Date(y, mo - 1 + n, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
const labelOf = (m: string) => { const [y, mo] = m.split('-').map(Number); return `${MONTHS[mo - 1]} ${y}`; };
const colorOf = (p: { color?: string | null }, i: number) => p.color || PALETTE[i % PALETTE.length];
const pct = (n: number) => `${(Math.round(n * 100) / 100).toLocaleString('pt-BR')}%`;

// ─── Gráficos (SVG simples, sem biblioteca) ──────────────────────────────────
const Donut: React.FC<{ items: { label: string; value: number; color: string }[]; center: string; sub: string }> = ({ items, center, sub }) => {
  const total = items.reduce((s, i) => s + i.value, 0);
  const R = 52, C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div className="relative w-44 h-44 mx-auto">
      <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
        <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="18" />
        {total > 0 && items.map(i => {
          const len = (i.value / total) * C;
          const el = <circle key={i.label} cx="70" cy="70" r={R} fill="none" stroke={i.color} strokeWidth="18" strokeDasharray={`${Math.max(len - 1.5, 0)} ${C}`} strokeDashoffset={-acc} />;
          acc += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <span className="text-sm font-black text-slate-900 dark:text-white leading-tight">{center}</span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{sub}</span>
      </div>
    </div>
  );
};

const Bars: React.FC<{ rows: { label: string; revenue: number; expenses: number; profit: number; muted?: boolean }[] }> = ({ rows }) => {
  const max = Math.max(1, ...rows.flatMap(r => [r.revenue, r.expenses, Math.abs(r.profit)]));
  const W = 720, H = 220, pad = 28, bw = (W - pad * 2) / rows.length;
  const y = (v: number) => H - 24 - (v / max) * (H - 50);
  const pts = rows.map((r, i) => `${pad + i * bw + bw / 2},${y(Math.max(r.profit, 0))}`).join(' ');
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[520px]" role="img" aria-label="Receitas, despesas e lucro por mês">
        {[0, 0.5, 1].map(f => <line key={f} x1={pad} x2={W - pad} y1={y(max * f)} y2={y(max * f)} stroke="rgba(148,163,184,0.25)" strokeDasharray="3 4" />)}
        {rows.map((r, i) => {
          const x = pad + i * bw, w = bw * 0.28;
          return (
            <g key={r.label} opacity={r.muted ? 0.35 : 1}>
              <rect x={x + bw * 0.14} y={y(r.revenue)} width={w} height={H - 24 - y(r.revenue)} rx="3" fill="#15803D" />
              <rect x={x + bw * 0.14 + w + 3} y={y(r.expenses)} width={w} height={H - 24 - y(r.expenses)} rx="3" fill="#DC2626" />
              <text x={x + bw / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="#94A3B8" fontWeight="700">{r.label}</text>
            </g>
          );
        })}
        <polyline points={pts} fill="none" stroke="#C49A2A" strokeWidth="2.5" strokeLinejoin="round" />
        {rows.map((r, i) => <circle key={i} cx={pad + i * bw + bw / 2} cy={y(Math.max(r.profit, 0))} r="3.5" fill="#C49A2A" opacity={r.muted ? 0.35 : 1} />)}
      </svg>
      <div className="flex gap-4 text-[11px] font-bold text-slate-500 justify-center mt-1">
        <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm bg-[#15803D]" />Receita</span>
        <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm bg-[#DC2626]" />Despesas</span>
        <span className="flex items-center gap-1"><i className="w-2.5 h-0.5 bg-[#C49A2A]" />Lucro</span>
      </div>
    </div>
  );
};

const Card: React.FC<{ title?: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
  <div className={`rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-white/5 p-4 ${className}`}>
    {title && <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">{title}</h3>}
    {children}
  </div>
);

const Row: React.FC<{ label: string; amount: number; max: number; color: string }> = ({ label, amount, max, color }) => (
  <div className="mb-2.5 last:mb-0">
    <div className="flex justify-between gap-2 text-xs"><span className="font-semibold text-slate-600 dark:text-slate-300 truncate">{label}</span><span className="font-black text-slate-900 dark:text-white flex-shrink-0">{money(amount)}</span></div>
    <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/10 mt-1"><div className="h-full rounded-full" style={{ width: `${max ? Math.max(4, (amount / max) * 100) : 0}%`, background: color }} /></div>
  </div>
);

// ─── Tela ─────────────────────────────────────────────────────────────────────
export const PartnersManager: React.FC = () => {
  const { show: toast } = useToast();
  const { profile } = useAuth();
  const [view, setView] = useState<'month' | 'year' | 'history'>('month');
  const [month, setMonth] = useState(nowMonth());
  const [partners, setPartners] = useState<Partner[]>([]);
  const [config, setConfig] = useState<Config>({ reservePercent: 0, reimbursementsAsExpense: false, basis: 'planned', policy: 'debt_first' });
  const [data, setData] = useState<MonthData | null>(null);
  const [year, setYear] = useState<YearData | null>(null);
  const [history, setHistory] = useState<{ month: string; row: YearMonth }[]>([]);
  const [loading, setLoading] = useState(true);
  const [managing, setManaging] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const y = Number(month.slice(0, 4));
  const load = useCallback(async () => {
    try {
      const [p, m, yr, h1, h2] = await Promise.all([
        fetch('/api/partners').then(r => r.json()),
        fetch(`/api/partners/month/${month}`).then(r => r.json()),
        fetch(`/api/partners/year/${y}`).then(r => r.json()),
        fetch(`/api/partners/year/${new Date().getFullYear()}`).then(r => r.json()),
        fetch(`/api/partners/year/${new Date().getFullYear() - 1}`).then(r => r.json()),
      ]);
      setPartners(p.partners ?? []); setConfig(p.config ?? config);
      if (!m.error) setData(m);
      if (!yr.error) setYear(yr);
      const rows = [...(h1.months ?? []), ...(h2.months ?? [])].filter((x: YearMonth) => x.closed).sort((a: YearMonth, b: YearMonth) => b.month.localeCompare(a.month));
      setHistory(rows.map((row: YearMonth) => ({ month: row.month, row })));
    } catch { toast('Não deu para carregar os números agora.', 'error'); }
    finally { setLoading(false); }
  }, [month, y]); // eslint-disable-line
  useEffect(() => { load(); }, [load]);
  useLiveEvents(['ClientPayment', 'Receivable', 'PayablePayment', 'Payable', 'Partner', 'ProfitClosing'], () => { load(); });

  const post = async (url: string, method: string, body?: any) => {
    const res = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { toast(d.error || 'Não foi possível concluir', 'error'); return null; }
    return d;
  };
  const setBasis = async (basis: 'planned' | 'cash') => {
    if (config.basis === basis) return;
    const d = await post('/api/partners-config', 'PATCH', { basis });
    if (d) { setConfig(d); load(); }
  };
  const closeMonth = async () => {
    const q = data && data.debtPaid > 0 ? ` Também serão registrados em Contas a Pagar os ${money(data.debtPaid)} de reembolsos quitados com o lucro deste mês.` : '';
    if (!window.confirm(`Fechar ${labelOf(month)}? Os valores e as porcentagens deste mês ficam guardados e não mudam mais, mesmo que a sociedade mude depois.${q}`)) return;
    if (await post('/api/partners/closings', 'POST', { month, byName: profile?.displayName })) { toast('Mês fechado', 'success'); load(); }
  };
  const reopen = async (m: string) => {
    if (!window.confirm(`Reabrir ${labelOf(m)}? Os repasses marcados nele serão apagados e as quitações de reembolso feitas neste fechamento serão desfeitas.`)) return;
    if (await post(`/api/partners/closings/${m}`, 'DELETE')) { toast('Mês reaberto', 'success'); load(); }
  };
  const markPaid = async (m: string, partnerId: string, paid: boolean) => { if (await post(`/api/partners/closings/${m}/paid`, 'POST', { partnerId, paid })) load(); };

  const sumPct = partners.filter(p => p.active).reduce((s, p) => s + p.sharePercent, 0);
  const pctOk = Math.abs(sumPct - 100) < 0.01;
  const maxRev = Math.max(1, ...(data?.revenueBy.map(r => r.amount) ?? [1]));
  const maxExp = Math.max(1, ...(data?.expensesBy.map(r => r.amount) ?? [1]));
  const shareItems = useMemo(() => (data?.shares ?? []).map((s, i) => ({ label: s.name, value: s.amount, color: colorOf(s, i) })), [data]);

  const seg = (id: typeof view, label: string, Icon: any) => (
    <button key={id} onClick={() => setView(id)} className="px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all"
      style={view === id ? { background: '#0D1F4E', color: '#fff' } : { color: '#64748B' }}><Icon className="w-3.5 h-3.5" />{label}</button>
  );

  return (
    <div className="space-y-4 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black tracking-tight text-[#0D1F4E] dark:text-white">Sociedade & Lucros</h2>
          <p className="text-xs text-slate-400 mt-0.5">O que entrou, o que saiu e quanto sobra para cada sócio, mês a mês</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-white/5">{seg('month', 'Mensal', CalendarDays)}{seg('year', 'Anual', CalendarRange)}{seg('history', 'Histórico', History)}</div>
          <Button variant="outline" onClick={() => setManaging(true)}><Settings2 className="w-4 h-4 mr-1.5" />SÓCIOS E REGRAS</Button>
        </div>
      </div>

      {!loading && partners.length === 0 && (
        <EmptyState icon={Users} title="Cadastre os sócios para começar" description="Informe o nome de cada sócio e a porcentagem do lucro que ele recebe. A soma precisa dar 100%."
          action={<Button onClick={() => setManaging(true)}><Plus className="w-4 h-4 mr-1.5" />CADASTRAR SÓCIOS</Button>} />
      )}
      {partners.length > 0 && !pctOk && (
        <div className="flex items-center gap-2 text-xs font-semibold rounded-xl px-3 py-2 bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />As porcentagens dos sócios somam {pct(sumPct)}. Ajuste para 100% em "Sócios e regras" para poder fechar o mês.
        </div>
      )}

      {/* ═══ MENSAL ═══ */}
      {view === 'month' && data && (
        <>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <button onClick={() => setMonth(shiftMonth(month, -1))} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"><ChevronLeft className="w-4 h-4" /></button>
              <div className="px-3 text-sm font-black text-[#0D1F4E] dark:text-white min-w-[150px] text-center">{labelOf(month)}</div>
              <button onClick={() => setMonth(shiftMonth(month, 1))} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"><ChevronRight className="w-4 h-4" /></button>
              {month !== nowMonth() && <button onClick={() => setMonth(nowMonth())} className="ml-1 text-[11px] font-bold text-blue-600">Mês atual</button>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black px-2.5 py-1 rounded-full flex items-center gap-1" style={data.closed ? { background: 'rgba(21,128,61,0.12)', color: '#15803D' } : { background: 'rgba(196,154,42,0.14)', color: '#A8821C' }}>
                {data.closed ? <><Lock className="w-3 h-3" />Fechado{data.closedByName ? ` por ${data.closedByName}` : ''}</> : <><Unlock className="w-3 h-3" />Em aberto</>}
              </span>
              {data.closed ? <Button variant="outline" size="sm" onClick={() => reopen(month)}>REABRIR</Button> : <Button size="sm" onClick={closeMonth} disabled={!partners.length}>FECHAR MÊS</Button>}
            </div>
          </div>

          {/* base do cálculo */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-slate-500">Base do cálculo:</span>
            <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-white/5">
              {([['planned', 'Previsto (tudo que vence no mês)'], ['cash', 'Realizado (só o que já entrou e saiu)']] as const).map(([id, label]) => (
                <button key={id} onClick={() => !data.closed && setBasis(id)} disabled={data.closed} className="px-3 py-1.5 rounded-lg font-black transition-all disabled:cursor-default"
                  style={data.basis === id ? { background: '#fff', color: '#0D1F4E', boxShadow: '0 1px 3px rgba(0,0,0,.12)' } : { color: '#64748B' }}>{label}</button>
              ))}
            </div>
            <span className="text-slate-400">{data.basis === 'planned' ? 'Contas a receber menos contas a pagar do mês, já pagas ou não.' : 'Só o dinheiro que realmente entrou e saiu neste mês.'}</span>
          </div>

          {/* da receita ao lucro de cada sócio */}
          <div className="grid grid-cols-2 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr] gap-2 items-stretch">
            {([
              [data.basis === 'planned' ? 'A receber no mês' : 'Receita recebida', data.revenue, '#15803D', TrendingUp, data.basis === 'planned' ? `Já recebido ${money(data.revenueDone)} · falta ${money(data.revenuePending)}` : null],
              [data.basis === 'planned' ? 'A pagar no mês' : 'Despesas pagas', data.expenses, '#DC2626', TrendingDown, data.basis === 'planned' ? `Já pago ${money(data.expensesDone)} · falta ${money(data.expensesPending)}` : null],
              ['Lucro do mês (a receber − a pagar)', data.profit, data.profit >= 0 ? '#0D1F4E' : '#DC2626', Wallet, null],
              ['Quitação de reembolsos', data.debtPaid, '#2563EB', RotateCcw, data.policy === 'debt_first' ? (data.debtBefore > 0 || data.debtPaid > 0 ? `Dívida: ${money(data.debtBefore)} → ${money(data.debtAfter)}` : 'Sem dívidas com sócios') : 'Desligada nas regras'],
              [`Reserva da empresa (${pct(data.reservePercent)})`, data.reserve, '#64748B', PiggyBank, null],
              ['A dividir entre os sócios', data.distributable, '#C49A2A', Landmark, null],
            ] as const).flatMap(([label, value, color, Icon, sub], i) => [
              ...(i > 0 ? [<div key={`s${i}`} className="hidden lg:flex items-center justify-center text-slate-300 font-black text-lg">{['−', '=', '−', '−', '='][i - 1]}</div>] : []),
              <div key={label} className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-white/5 p-3.5 min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500"><Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} /><span className="truncate">{label}</span></div>
                <div className="mt-1 text-lg font-black truncate" style={{ color }}>{money(value)}</div>
                {sub && <div className="text-[10px] font-semibold text-slate-400 truncate mt-0.5">{sub}</div>}
              </div>,
            ])}
          </div>
          {data.policy === 'debt_first' && (data.debts.length > 0 || data.debtPaid > 0) && (
            <Card title="Dívidas com sócios: quitar antes de dividir o lucro">
              <p className="text-xs text-slate-500 mb-3">Gastos que os sócios adiantaram no sistema (tipo <b>Reembolso</b> em Contas a Pagar). Enquanto houver dívida, o lucro do mês vai primeiro para quitá-la. Só o que sobrar depois (menos a reserva) é dividido entre os sócios.</p>
              <div className="space-y-2">
                {data.debts.map(d => (
                  <div key={d.id} className="flex items-center gap-3 text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-200 truncate flex-1">{d.description}{d.by ? <span className="text-slate-400"> · {d.by}</span> : null}</span>
                    <span className="text-slate-400">{money(d.amount)}</span>
                    <span className="font-black text-blue-700 w-24 text-right">falta {money(d.remaining)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 text-xs flex flex-wrap gap-x-4 gap-y-1 font-bold">
                <span className="text-slate-500">Dívida total hoje: <span className="text-slate-900 dark:text-white">{money(data.debtBefore)}</span></span>
                <span className="text-blue-700">Quitada com o lucro deste mês: {money(data.debtPaid)}</span>
                <span className={data.debtAfter > 0 ? 'text-amber-700' : 'text-green-700'}>{data.debtAfter > 0 ? `Ainda falta quitar: ${money(data.debtAfter)}` : 'Tudo quitado: daqui para frente o lucro vai para os sócios'}</span>
              </div>
            </Card>
          )}
          {data.policy === 'debt_first' && data.debts.length === 0 && data.debtPaid === 0 && (
            <p className="text-[11px] text-slate-400">Sem dívidas de reembolso com os sócios. Se algum sócio adiantou gastos, registre em Contas a Pagar com o tipo "Reembolso" e o lucro passa a quitá-los primeiro.</p>
          )}
          {data.basis === 'planned' && data.revenue > 0 && (
            <div className="grid sm:grid-cols-2 gap-3">
              {([['Recebimentos do mês', data.revenueDone, data.revenue, '#15803D'], ['Pagamentos do mês', data.expensesDone, data.expenses, '#DC2626']] as const).map(([l, done, total, c]) => (
                <div key={l}>
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1"><span>{l}</span><span>{total ? Math.round((done / total) * 100) : 0}% concluído</span></div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10"><div className="h-full rounded-full" style={{ width: `${total ? Math.min(100, (done / total) * 100) : 0}%`, background: c }} /></div>
                </div>
              ))}
            </div>
          )}
          <p className="text-[11px] text-slate-400">Na outra base o lucro seria {money(data.compare.profit)} ({data.compare.basis === 'cash' ? 'realizado' : 'previsto'}).</p>
          {data.profit < 0 && <p className="text-xs font-semibold text-red-600">Neste mês as despesas passaram da receita. Não há lucro para dividir.</p>}

          <div className="grid lg:grid-cols-[320px_1fr] gap-4">
            <Card title="Divisão do lucro">
              {data.shares.length === 0 ? <p className="text-sm text-slate-400 text-center py-6">Cadastre os sócios.</p> : (
                <>
                  <Donut items={shareItems} center={money(data.distributable)} sub="a dividir" />
                  <div className="mt-3 space-y-1.5">
                    {data.shares.map((s, i) => (
                      <div key={s.partnerId} className="flex items-center gap-2 text-xs">
                        <i className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: colorOf(s, i) }} />
                        <span className="font-semibold text-slate-700 dark:text-slate-200 truncate flex-1">{s.name}</span>
                        <span className="text-slate-400">{pct(s.percent)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>

            <div className="space-y-3">
              {data.shares.map((s, i) => (
                <div key={s.partnerId} className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-white/5 p-4 flex items-center gap-3 flex-wrap" style={{ borderLeft: `4px solid ${colorOf(s, i)}` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black flex-shrink-0" style={{ background: colorOf(s, i) }}>{s.name.trim()[0]?.toUpperCase()}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-slate-900 dark:text-white truncate">{s.name}</p>
                    <p className="text-xs text-slate-400">{pct(s.percent)} do lucro distribuível</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black" style={{ color: s.amount > 0 ? '#15803D' : '#94A3B8' }}>{money(s.amount)}</p>
                    {data.closed && (
                      <button onClick={() => markPaid(month, s.partnerId, !s.paid)} className="text-[11px] font-bold mt-0.5 flex items-center gap-1 ml-auto" style={{ color: s.paid ? '#15803D' : '#C49A2A' }}>
                        <CheckCircle2 className="w-3.5 h-3.5" />{s.paid ? `Repassado${s.paidAt ? ` em ${new Date(s.paidAt).toLocaleDateString('pt-BR')}` : ''}` : 'Marcar como repassado'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {!data.closed && data.shares.length > 0 && <p className="text-[11px] text-slate-400">Valores previstos com os dados de hoje. Feche o mês para guardar os números e controlar os repasses.</p>}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card title={data.basis === 'planned' ? 'O que vai entrar (contas a receber)' : 'De onde veio a receita'}>
              {data.revenueBy.length === 0 ? <p className="text-sm text-slate-400">Nada a receber neste mês.</p> : data.revenueBy.map(r => <Row key={r.label} label={r.label} amount={r.amount} max={maxRev} color="#15803D" />)}
              {data.topClients.length > 0 && <><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-4 mb-2">Maiores pagadores</p>{data.topClients.map(r => <Row key={r.label} label={r.label} amount={r.amount} max={data.topClients[0].amount} color="#2563EB" />)}</>}
            </Card>
            <Card title={data.basis === 'planned' ? 'O que vai sair (contas a pagar)' : 'Para onde foi o dinheiro'}>
              {data.expensesBy.length === 0 ? <p className="text-sm text-slate-400">Nada a pagar neste mês.</p> : data.expensesBy.map(r => <Row key={r.label} label={r.label} amount={r.amount} max={maxExp} color="#DC2626" />)}
              {data.topExpenses.length > 0 && <><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-4 mb-2">Maiores despesas</p>{data.topExpenses.map(r => <Row key={r.label} label={r.label} amount={r.amount} max={data.topExpenses[0].amount} color="#EA580C" />)}</>}
            </Card>
          </div>
        </>
      )}

      {/* ═══ ANUAL ═══ */}
      {view === 'year' && year && (
        <>
          <div className="flex items-center gap-1">
            <button onClick={() => setMonth(`${y - 1}-${month.slice(5)}`)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"><ChevronLeft className="w-4 h-4" /></button>
            <div className="px-3 text-sm font-black text-[#0D1F4E] dark:text-white min-w-[80px] text-center">{year.year}</div>
            <button onClick={() => setMonth(`${y + 1}-${month.slice(5)}`)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-2">
            {([['Receita no ano', year.totals.revenue, '#15803D'], ['Despesas no ano', year.totals.expenses, '#DC2626'], ['Lucro no ano', year.totals.profit, '#0D1F4E'], ['Reembolsos quitados', year.totals.debtPaid, '#2563EB'], ['Reserva', year.totals.reserve, '#64748B'], ['Dividido entre sócios', year.totals.distributable, '#C49A2A']] as const).map(([l, v, c]) => (
              <div key={l} className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-white/5 p-3.5 min-w-0">
                <p className="text-[11px] font-bold text-slate-500 truncate">{l}</p><p className="text-lg font-black truncate" style={{ color: c }}>{money(v)}</p>
              </div>
            ))}
          </div>
          <Card title="Mês a mês"><Bars rows={year.months.map(m => ({ label: SHORT[Number(m.month.slice(5)) - 1], revenue: m.revenue, expenses: m.expenses, profit: m.profit, muted: m.future }))} /></Card>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {year.partners.map((p, i) => (
              <div key={p.id} className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-white/5 p-4" style={{ borderTop: `4px solid ${colorOf(p, i)}` }}>
                <p className="text-sm font-black text-slate-900 dark:text-white truncate">{p.name}</p>
                <p className="text-2xl font-black mt-1" style={{ color: '#15803D' }}>{money(p.amount)}</p>
                <p className="text-[11px] text-slate-500 mt-1">gerou de lucro em {year.year}</p>
                <div className="flex justify-between text-[11px] mt-2"><span className="text-green-700 font-bold">Repassado {money(p.paid)}</span><span className="text-amber-700 font-bold">A repassar {money(Math.max(0, p.amount - p.paid))}</span></div>
              </div>
            ))}
          </div>

          <Card title="Detalhe por mês e por sócio">
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[640px]">
                <thead><tr className="text-left text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-2 pr-3">Mês</th><th className="pr-3 text-right">Receita</th><th className="pr-3 text-right">Despesas</th><th className="pr-3 text-right">Lucro</th>
                  {year.partners.map(p => <th key={p.id} className="pr-3 text-right">{p.name.split(' ')[0]}</th>)}<th /></tr></thead>
                <tbody>
                  {year.months.map(m => (
                    <tr key={m.month} className={`border-t border-slate-100 dark:border-white/5 ${m.future ? 'opacity-40' : ''}`}>
                      <td className="py-2 pr-3 font-bold text-slate-700 dark:text-slate-200">{SHORT[Number(m.month.slice(5)) - 1]}</td>
                      <td className="pr-3 text-right">{money(m.revenue)}</td><td className="pr-3 text-right">{money(m.expenses)}</td>
                      <td className="pr-3 text-right font-bold" style={{ color: m.profit < 0 ? '#DC2626' : undefined }}>{money(m.profit)}</td>
                      {year.partners.map(p => <td key={p.id} className="pr-3 text-right">{money(m.shares.find(s => s.partnerId === p.id)?.amount ?? 0)}</td>)}
                      <td className="text-right">{m.closed ? <Lock className="w-3 h-3 inline text-green-600" /> : null}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-slate-200 dark:border-white/10 font-black">
                    <td className="py-2 pr-3">Total</td><td className="pr-3 text-right">{money(year.totals.revenue)}</td><td className="pr-3 text-right">{money(year.totals.expenses)}</td><td className="pr-3 text-right">{money(year.totals.profit)}</td>
                    {year.partners.map(p => <td key={p.id} className="pr-3 text-right">{money(p.amount)}</td>)}<td />
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ═══ HISTÓRICO ═══ */}
      {view === 'history' && (
        history.length === 0 ? <EmptyState icon={History} title="Nenhum mês fechado ainda" description="Quando você fechar um mês, ele aparece aqui com os valores e os percentuais daquela época." />
          : (
            <div className="space-y-2">
              {history.map(({ month: m, row }) => (
                <div key={m} className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden">
                  <button className="w-full flex items-center gap-3 p-3.5 text-left" onClick={() => setOpen(open === m ? null : m)}>
                    <Lock className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm font-black text-slate-900 dark:text-white flex-1">{labelOf(m)}</span>
                    <span className="text-xs text-slate-500 hidden sm:inline">Receita {money(row.revenue)} · Despesas {money(row.expenses)}</span>
                    <span className="text-sm font-black" style={{ color: row.profit < 0 ? '#DC2626' : '#15803D' }}>{money(row.profit)}</span>
                    <ArrowRight className={`w-4 h-4 text-slate-400 transition-transform ${open === m ? 'rotate-90' : ''}`} />
                  </button>
                  {open === m && (
                    <div className="border-t border-slate-100 dark:border-white/5 p-3.5 space-y-2">
                      <p className="text-xs text-slate-500">Reserva {money(row.reserve)} · A dividir {money(row.distributable)}</p>
                      {row.shares.map((s, i) => (
                        <div key={s.partnerId} className="flex items-center gap-2 text-xs">
                          <i className="w-2.5 h-2.5 rounded-full" style={{ background: colorOf(s, i) }} />
                          <span className="font-semibold flex-1 truncate">{s.name} <span className="text-slate-400">({pct(s.percent)})</span></span>
                          <span className="font-black">{money(s.amount)}</span>
                          <button onClick={() => markPaid(m, s.partnerId, !s.paid)} className="font-bold" style={{ color: s.paid ? '#15803D' : '#C49A2A' }}>{s.paid ? 'Repassado' : 'Marcar repasse'}</button>
                        </div>
                      ))}
                      <div className="pt-1"><Button variant="outline" size="xs" onClick={() => reopen(m)}>REABRIR MÊS</Button></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
      )}

      {managing && <ManageModal partners={partners} config={config} onClose={() => setManaging(false)} onChanged={load} />}
    </div>
  );
};

// ─── Sócios e regras ─────────────────────────────────────────────────────────
const ManageModal: React.FC<{ partners: Partner[]; config: Config; onClose: () => void; onChanged: () => void }> = ({ partners, config, onClose, onChanged }) => {
  const { show: toast } = useToast();
  const [rows, setRows] = useState<Partner[]>(partners.filter(p => p.active));
  const [reserve, setReserve] = useState(String(config.reservePercent));
  const [policy, setPolicy] = useState<'debt_first' | 'expense' | 'ignore'>(config.policy ?? 'debt_first');
  const [saving, setSaving] = useState(false);
  const sum = rows.reduce((s, p) => s + (Number(p.sharePercent) || 0), 0);

  const upd = (i: number, patch: Partial<Partner>) => setRows(r => r.map((p, k) => (k === i ? { ...p, ...patch } : p)));
  const add = () => setRows(r => [...r, { id: `new-${Date.now()}`, name: '', sharePercent: 0, email: '', role: '', color: PALETTE[r.length % PALETTE.length], active: true }]);
  const remove = async (i: number) => {
    const p = rows[i];
    if (!p.id.startsWith('new-')) {
      if (!window.confirm(`Remover ${p.name} da sociedade? Os meses já fechados continuam com ele.`)) return;
      const res = await fetch(`/api/partners/${p.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: false }) });
      if (!res.ok) return toast('Não deu para remover.', 'error');
    }
    setRows(r => r.filter((_, k) => k !== i));
    onChanged();
  };

  const save = async () => {
    if (rows.some(r => !r.name.trim())) return toast('Dê um nome para cada sócio.', 'error');
    setSaving(true);
    try {
      for (const p of rows) {
        const body = { name: p.name.trim(), sharePercent: Number(p.sharePercent) || 0, email: p.email || null, role: p.role || null, color: p.color || null };
        const res = p.id.startsWith('new-')
          ? await fetch('/api/partners', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
          : await fetch(`/api/partners/${p.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'erro');
      }
      const c = await fetch('/api/partners-config', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reservePercent: Number(reserve) || 0, reimbursementPolicy: policy }) });
      if (!c.ok) throw new Error((await c.json().catch(() => ({}))).error || 'erro');
      toast('Sociedade salva', 'success');
      onChanged(); onClose();
    } catch (e: any) { toast(e.message === 'erro' ? 'Não deu para salvar.' : e.message, 'error'); }
    setSaving(false);
  };

  return (
    <Modal isOpen onClose={onClose} title="Sócios e regras" size="xl"
      footer={<Button loading={saving} fullWidth onClick={save}>SALVAR</Button>}>
      <div className="space-y-5">
        <div className="space-y-3">
          {rows.map((p, i) => (
            <div key={p.id} className="rounded-xl border border-slate-200 dark:border-white/10 p-3 grid grid-cols-2 sm:grid-cols-[1.4fr_90px_1fr_1fr_auto_auto] gap-2 items-end">
              <div className="col-span-2 sm:col-span-1"><Input label="Nome do sócio" value={p.name} onChange={e => upd(i, { name: e.target.value })} /></div>
              <Input label="% do lucro" type="number" step="0.01" min="0" max="100" value={String(p.sharePercent)} onChange={e => upd(i, { sharePercent: e.target.value as any })} />
              <Input label="Função (opcional)" value={p.role ?? ''} onChange={e => upd(i, { role: e.target.value })} />
              <Input label="E-mail (opcional)" value={p.email ?? ''} onChange={e => upd(i, { email: e.target.value })} />
              <label className="flex flex-col gap-1.5"><span className="ds-label">Cor</span><input type="color" value={p.color ?? '#0D1F4E'} onChange={e => upd(i, { color: e.target.value })} className="h-10 w-12 rounded-lg border border-slate-200 cursor-pointer bg-transparent" /></label>
              <button type="button" onClick={() => remove(i)} className="p-2.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 justify-self-end" title="Remover"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={add}><Plus className="w-4 h-4 mr-1" />ADICIONAR SÓCIO</Button>
            <span className="text-xs font-black" style={{ color: Math.abs(sum - 100) < 0.01 ? '#15803D' : '#B45309' }}>Soma: {pct(sum)} {Math.abs(sum - 100) < 0.01 ? '✓' : '(precisa dar 100%)'}</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4 space-y-3">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Regras do cálculo</p>
          <Input label="Reserva da empresa (% do lucro que fica no caixa antes de dividir)" type="number" step="0.01" min="0" max="100" value={reserve} onChange={e => setReserve(e.target.value)} />
          <div>
            <p className="ds-label mb-1.5">Reembolsos aos sócios (gastos adiantados no sistema)</p>
            <div className="space-y-1.5">
              {([
                ['debt_first', 'Quitar primeiro com o lucro (recomendado)', 'O lucro do mês paga as dívidas de reembolso antes de qualquer divisão. Ao fechar o mês, a quitação é registrada em Contas a Pagar. Quitou tudo, o lucro vai para os sócios.'],
                ['expense', 'Tratar como despesa comum', 'O reembolso reduz o lucro no mês em que vence ou é pago, como qualquer outra conta.'],
                ['ignore', 'Ignorar no cálculo', 'Reembolsos não entram na conta da sociedade.'],
              ] as const).map(([id, t, d]) => (
                <label key={id} className="flex items-start gap-2.5 cursor-pointer rounded-lg border p-2.5" style={policy === id ? { borderColor: '#0D1F4E', background: 'rgba(13,31,78,0.04)' } : { borderColor: 'rgba(148,163,184,0.3)' }}>
                  <input type="radio" name="policy" className="mt-0.5 accent-indigo-600" checked={policy === id} onChange={() => setPolicy(id)} />
                  <span className="text-sm font-semibold">{t}<span className="block text-[11px] font-normal text-slate-500">{d}</span></span>
                </label>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-slate-500">Como é calculado: lucro do mês = contas a receber (assinaturas dos clientes e contas avulsas) menos contas a pagar. No modo Previsto entra tudo que vence no mês; no modo Realizado, só o que já foi recebido e pago. Do lucro saem primeiro as dívidas de reembolso (se a regra estiver ligada), depois a reserva, e o resto é dividido pelas porcentagens. Clientes em período de teste não entram.</p>
        </div>
      </div>
    </Modal>
  );
};
