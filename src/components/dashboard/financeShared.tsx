import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import { addMonths, format, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Peças comuns das telas de Contas a Pagar e Contas a Receber.

export const PAY_METHODS = ['Pix', 'Boleto', 'Cartão', 'Transferência', 'Dinheiro'];

export const money = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Datas "só dia" vêm do servidor como meia-noite UTC; ler pelos componentes UTC evita cair no dia anterior (fuso do Brasil).
export function parseDay(iso?: string | null): Date | null {
  if (!iso) return null;
  if (iso.endsWith('T00:00:00.000Z') || iso.length === 10) {
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export const fmtDate = (iso?: string | null) => { const d = parseDay(iso); return d ? format(d, 'dd/MM/yyyy') : '—'; };
export const startOfToday = () => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); };
export const firstOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

// ─── Indicador ───────────────────────────────────────────────────────────────

export function Stat({ label, value, color, icon: Icon, text, footer }: {
  label: string; value: string; color: string; icon: any; text: string; footer?: React.ReactNode;
}) {
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

// ─── Menu "⋮" da linha ───────────────────────────────────────────────────────

export function RowMenu({ items }: { items: { label: string; icon: any; onClick: () => void; danger?: boolean }[] }) {
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

// ─── Barra de período: abas + navegação de mês ───────────────────────────────

export function PeriodBar<V extends string>({ options, view, onView, monthView, cursor, onCursor, text }: {
  options: { value: V; label: string; danger?: boolean }[];
  view: V;
  onView: (v: V) => void;
  monthView: V;           // qual aba mostra o seletor de mês
  cursor: Date;
  onCursor: (d: Date) => void;
  text: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-white/5 self-start">
        {options.map(o => (
          <button key={o.value} onClick={() => onView(o.value)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${view === o.value ? 'bg-white dark:bg-white/15 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}
            style={view === o.value ? { color: o.danger ? '#DC2626' : text } : undefined}>
            {o.label}
          </button>
        ))}
      </div>

      {view === monthView && (
        <div className="inline-flex items-center gap-1 self-start">
          <button onClick={() => onCursor(addMonths(cursor, -1))} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500" aria-label="Mês anterior"><ChevronLeft className="w-4 h-4" /></button>
          <span className="min-w-[150px] text-center text-sm font-black capitalize" style={{ color: text }}>
            {format(cursor, "MMMM 'de' yyyy", { locale: ptBR })}
          </span>
          <button onClick={() => onCursor(addMonths(cursor, 1))} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500" aria-label="Próximo mês"><ChevronRight className="w-4 h-4" /></button>
          {!isSameMonth(cursor, new Date()) && (
            <button onClick={() => onCursor(firstOfMonth(new Date()))} className="ml-1 text-xs font-bold text-indigo-500 hover:underline">Hoje</button>
          )}
        </div>
      )}
    </div>
  );
}
