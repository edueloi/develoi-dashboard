import React from 'react';
import { cn } from '../../lib/utils';

export function RadioGroup({ label, error, hint, children, className, orientation = 'vertical' }: { label?: string; error?: string; hint?: string; children: React.ReactNode; className?: string; orientation?: 'vertical' | 'horizontal'; }) {
  return <fieldset className={cn('space-y-1.5', className)}>{label && <legend className="mb-2 block text-[11px] font-semibold text-slate-600 dark:text-white/70">{label}</legend>}<div className={cn('flex gap-3', orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap')}>{children}</div>{error && <p className="mt-1.5 text-[11px] font-medium text-red-500">{error}</p>}{hint && !error && <p className="mt-1.5 text-[11px] text-slate-400">{hint}</p>}</fieldset>;
}

export function Radio({ value, checked, onChange, label, description, disabled = false, variant = 'plain' }: { value: string; checked: boolean; onChange: (value: string) => void; label: string; description?: string; disabled?: boolean; variant?: 'plain' | 'card'; }) {
  return <label className={cn('group flex cursor-pointer select-none items-center gap-2.5', variant === 'card' && 'rounded-lg border-2 p-3', variant === 'card' && (checked ? 'border-[#0D1F4E] bg-[#0D1F4E]/5 dark:border-amber-400 dark:bg-amber-400/10' : 'border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-white/5'), disabled && 'cursor-not-allowed opacity-50')}>
    <input type="radio" className="sr-only" checked={checked} disabled={disabled} onChange={() => onChange(value)} />
    <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all', checked ? 'border-[#0D1F4E] bg-[#0D1F4E] dark:border-amber-400 dark:bg-amber-400' : 'border-slate-300 group-hover:border-[#0D1F4E]/60 dark:border-white/30')}><span className={cn('h-1.5 w-1.5 rounded-full bg-white dark:bg-[#0D1F4E]', !checked && 'hidden')} /></span>
    <span className="min-w-0"><span className={cn('block text-xs font-semibold leading-none', checked ? 'text-[#0D1F4E] dark:text-amber-300' : 'text-slate-800 dark:text-white')}>{label}</span>{description && <span className="mt-1 block text-[11px] leading-snug text-slate-400 dark:text-white/45">{description}</span>}</span>
  </label>;
}
