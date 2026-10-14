import React, { createContext, ReactNode, useContext, useId, useState } from 'react';
import { cn } from '../../lib/utils';

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: React.ElementType;
  badge?: string | number;
  disabled?: boolean;
  dataTour?: string;
}

interface ItemsTabsProps<T extends string> { items: readonly TabItem<T>[]; value: T; onChange: (value: T) => void; label: string; children: ReactNode; className?: string; }
interface CompoundTabsProps { defaultTab: string; children: ReactNode; onChange?: (id: string) => void; className?: string; }

const listClass = 'flex max-w-full gap-1 overflow-x-auto overscroll-x-contain border-b border-slate-200 dark:border-white/10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';
const buttonClass = 'flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D1F4E]/25 disabled:cursor-not-allowed disabled:opacity-40 dark:focus-visible:ring-amber-300/30';
const activeClass = 'border-[#0D1F4E] text-[#0D1F4E] dark:border-amber-400 dark:text-amber-300';
const idleClass = 'border-transparent text-slate-500 hover:text-slate-800 dark:text-white/50 dark:hover:text-white';

function TabBadge({ active, children }: { active: boolean; children: ReactNode }) {
  return <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none', active ? 'bg-[#0D1F4E]/10 text-[#0D1F4E] dark:bg-amber-400/15 dark:text-amber-300' : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/60')}>{children}</span>;
}

function ItemsTabs<T extends string>({ items, value, onChange, label, children, className }: ItemsTabsProps<T>) {
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
  return <div className={cn('min-w-0 space-y-3', className)}>
    <div role="tablist" aria-label={label} className={listClass}>{items.map((tab, index) => {
      const active = value === tab.id;
      const Icon = tab.icon;
      return <button key={tab.id} id={`${id}-${tab.id}`} data-tour={tab.dataTour} role="tab" type="button" disabled={tab.disabled} aria-selected={active} aria-controls={`${id}-panel`} tabIndex={active ? 0 : -1} onClick={() => onChange(tab.id)} onKeyDown={event => selectByKey(event, index)} className={cn(buttonClass, active ? activeClass : idleClass)}>
        {Icon && <Icon size={14} />}{tab.label}{tab.badge !== undefined && <TabBadge active={active}>{tab.badge}</TabBadge>}
      </button>;
    })}</div>
    <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${value}`} tabIndex={0} className="min-w-0 focus:outline-none">{children}</div>
  </div>;
}

const TabsContext = createContext<{ active: string; setActive: (id: string) => void }>({ active: '', setActive: () => {} });
function CompoundTabs({ defaultTab, children, onChange, className }: CompoundTabsProps) {
  const [active, setActiveState] = useState(defaultTab);
  const setActive = (id: string) => { setActiveState(id); onChange?.(id); };
  return <TabsContext.Provider value={{ active, setActive }}><div className={cn('min-w-0 space-y-3', className)}>{children}</div></TabsContext.Provider>;
}

export function Tabs<T extends string>(props: ItemsTabsProps<T>): React.ReactElement;
export function Tabs(props: CompoundTabsProps): React.ReactElement;
export function Tabs(props: ItemsTabsProps<string> | CompoundTabsProps) { return 'items' in props ? <ItemsTabs {...props} /> : <CompoundTabs {...props} />; }

export function TabList({ children, className }: { children: ReactNode; className?: string; variant?: 'pill' | 'underline' }) { return <div role="tablist" className={cn(listClass, className)}>{children}</div>; }
export function Tab({ id, children, icon, badge, disabled = false }: { id: string; children: ReactNode; icon?: ReactNode; badge?: string | number; disabled?: boolean; }) {
  const { active, setActive } = useContext(TabsContext); const selected = active === id;
  return <button type="button" role="tab" aria-selected={selected} disabled={disabled} onClick={() => !disabled && setActive(id)} className={cn(buttonClass, selected ? activeClass : idleClass)}>{icon && <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>}{children}{badge !== undefined && <TabBadge active={selected}>{badge}</TabBadge>}</button>;
}
export function TabPanel({ id, children }: { id: string; children: ReactNode }) { const { active } = useContext(TabsContext); return active === id ? <div role="tabpanel">{children}</div> : null; }

export default Tabs;
