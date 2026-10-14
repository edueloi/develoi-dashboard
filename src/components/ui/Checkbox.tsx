import React from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CheckboxProps { checked: boolean; onChange: (checked: boolean) => void; label?: string; description?: string; disabled?: boolean; indeterminate?: boolean; variant?: 'plain' | 'card'; className?: string; }
export function Checkbox({ checked, onChange, label, description, disabled = false, indeterminate = false, variant = 'plain', className }: CheckboxProps) {
  const box = <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded-md border-2 transition-all', checked || indeterminate ? 'border-[#0D1F4E] bg-[#0D1F4E] dark:border-amber-400 dark:bg-amber-400' : 'border-slate-300 bg-white group-hover:border-[#0D1F4E]/60 dark:border-white/30 dark:bg-transparent')}>
    {indeterminate ? <Minus size={10} className="stroke-[3] text-white dark:text-[#0D1F4E]" /> : checked ? <Check size={10} className="stroke-[3] text-white dark:text-[#0D1F4E]" /> : null}
  </span>;
  return <label className={cn('group flex cursor-pointer select-none gap-2.5', variant === 'card' && 'items-center rounded-lg border-2 p-3', variant === 'card' && (checked ? 'border-[#0D1F4E] bg-[#0D1F4E]/5 dark:border-amber-400 dark:bg-amber-400/10' : 'border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-white/5'), variant === 'plain' && 'items-start', disabled && 'cursor-not-allowed opacity-50', className)}>
    <input type="checkbox" className="sr-only" checked={checked} disabled={disabled} onChange={event => onChange(event.target.checked)} />
    <span className={variant === 'plain' ? 'mt-0.5' : ''}>{box}</span>
    {(label || description) && <span className="min-w-0"><span className={cn('block text-xs font-semibold leading-none', checked ? 'text-[#0D1F4E] dark:text-amber-300' : 'text-slate-800 dark:text-white')}>{label}</span>{description && <span className="mt-1 block text-[11px] leading-snug text-slate-400 dark:text-white/45">{description}</span>}</span>}
  </label>;
}

interface CheckboxOption { value: string; label: string; description?: string; disabled?: boolean; }
export function CheckboxGroup({ label, options, value, onChange, error, hint, orientation = 'vertical', variant = 'plain', className }: { label?: string; options: CheckboxOption[]; value: string[]; onChange: (value: string[]) => void; error?: string; hint?: string; orientation?: 'vertical' | 'horizontal'; variant?: 'plain' | 'card'; className?: string; }) {
  return <fieldset className={cn('space-y-1.5', className)}><legend className={cn('mb-2 block text-[11px] font-semibold text-slate-600 dark:text-white/70', !label && 'sr-only')}>{label || 'Opções'}</legend><div className={cn('flex gap-3', orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap')}>{options.map(option => <Checkbox key={option.value} checked={value.includes(option.value)} onChange={() => onChange(value.includes(option.value) ? value.filter(item => item !== option.value) : [...value, option.value])} label={option.label} description={option.description} disabled={option.disabled} variant={variant} />)}</div>{error && <p className="mt-1.5 text-[11px] font-medium text-red-500">{error}</p>}{hint && !error && <p className="mt-1.5 text-[11px] text-slate-400">{hint}</p>}</fieldset>;
}
