import React from 'react';
import { cn } from '../../lib/utils';

/** Campo de leitura, usado dentro de listas de descrição (<dl>). */
export function DetailField({ label, value, className }: { label: string; value?: string | number | null; className?: string }) {
  const text = value == null ? '' : String(value).trim();
  return <div className={cn('min-w-0 border-b border-slate-100 py-2.5 dark:border-white/10', className)}>
    <dt className="text-[11px] text-slate-500 dark:text-white/50">{label}</dt>
    <dd className={cn('mt-1 break-words text-[13px] leading-relaxed', text ? 'text-slate-800 dark:text-white' : 'text-slate-400')}>{text || 'Não informado'}</dd>
  </div>;
}
