import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

export function Popover({ trigger, children, placement = 'bottom-end', className }: { trigger: React.ReactNode; children: React.ReactNode; placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'; className?: string; }) {
  const [open, setOpen] = useState(false); const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const close = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); }; document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close); }, []);
  const position = placement.startsWith('top') ? 'bottom-full mb-2' : 'top-full mt-2';
  const align = placement.endsWith('start') ? 'left-0' : 'right-0';
  return <div ref={ref} className="relative inline-flex"><span onClick={() => setOpen(value => !value)}>{trigger}</span>{open && <div className={cn('absolute z-[110] min-w-max', position, align)}><div className={cn('overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-[#111827]', className)}>{children}</div></div>}</div>;
}

export function PopoverItem({ children, icon, onClick, variant = 'default', disabled = false }: { children: React.ReactNode; icon?: React.ReactNode; onClick?: () => void; variant?: 'default' | 'danger'; disabled?: boolean; }) {
  return <button type="button" disabled={disabled} onClick={onClick} className={cn('flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50', variant === 'danger' ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-400/10' : 'text-slate-700 hover:bg-slate-50 dark:text-white/80 dark:hover:bg-white/5')}>{icon}{children}</button>;
}
export function PopoverDivider() { return <div className="my-1 border-t border-slate-100 dark:border-white/10" />; }
export default Popover;
