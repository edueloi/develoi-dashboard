import React, { ReactNode, useId } from 'react';
import { cn } from '../../lib/utils';

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: React.ElementType;
  badge?: string | number;
  disabled?: boolean;
}

interface TabsProps<T extends string> {
  items: readonly TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  children: ReactNode;
  className?: string;
}

/** Abas responsivas com navegação por teclado, reaproveitáveis nos formulários do painel. */
export function Tabs<T extends string>({ items, value, onChange, label, children, className }: TabsProps<T>) {
  const id = useId();
  const selectByKey = (event: React.KeyboardEvent, index: number) => {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % items.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    else return;
    event.preventDefault();
    onChange(items[next].id);
    document.getElementById(`${id}-${items[next].id}`)?.focus();
  };

  return (
    <div className={cn('min-w-0 space-y-4', className)}>
      <div role="tablist" aria-label={label} className="flex max-w-full gap-1 overflow-x-auto border-b border-slate-200 dark:border-white/10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((tab, index) => {
          const active = value === tab.id;
          return (
            <button key={tab.id} id={`${id}-${tab.id}`} role="tab" type="button" disabled={tab.disabled}
              aria-selected={active} aria-controls={`${id}-panel`} tabIndex={active ? 0 : -1}
              onClick={() => onChange(tab.id)} onKeyDown={event => selectByKey(event, index)}
              className={cn('flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D1F4E]/25 disabled:cursor-not-allowed disabled:opacity-40', active ? 'border-[#0D1F4E] text-[#0D1F4E] dark:border-amber-400 dark:text-amber-300' : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-white')}>
              {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
              {tab.label}
              {tab.badge !== undefined && <span className={cn('rounded-full px-1.5 py-0.5 text-[10px]', active ? 'bg-[#0D1F4E]/10 text-[#0D1F4E] dark:bg-amber-400/10 dark:text-amber-300' : 'bg-slate-100 text-slate-500 dark:bg-white/10')}>{tab.badge}</span>}
            </button>
          );
        })}
      </div>
      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${value}`} tabIndex={0} className="min-w-0 focus:outline-none">{children}</div>
    </div>
  );
}

export default Tabs;
