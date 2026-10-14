import React from 'react';
import { MoreVertical } from 'lucide-react';
import { Popover, PopoverDivider, PopoverItem } from './Popover';

export interface DropdownMenuItem { type?: 'item' | 'divider'; label?: string; icon?: React.ReactNode; onClick?: () => void; variant?: 'default' | 'danger'; disabled?: boolean; hidden?: boolean; }
export function DropdownMenu({ items, trigger, placement = 'bottom-end', className }: { items: DropdownMenuItem[]; trigger?: React.ReactNode; placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'; className?: string; }) {
  const defaultTrigger = <button type="button" aria-label="Mais ações" className="flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-slate-400 transition-colors hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700 dark:hover:border-white/10 dark:hover:bg-white/5 dark:hover:text-white"><MoreVertical size={16} /></button>;
  return <Popover trigger={trigger ?? defaultTrigger} placement={placement} className={className}>{items.filter(item => !item.hidden).map((item, index) => item.type === 'divider' ? <PopoverDivider key={index} /> : <PopoverItem key={index} icon={item.icon} onClick={item.onClick} variant={item.variant} disabled={item.disabled}>{item.label}</PopoverItem>)}</Popover>;
}
