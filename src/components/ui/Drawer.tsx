import React, { useEffect } from 'react';
import { gsap } from '../../lib/gsap';
import { Presence } from '../motion/Presence';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { IconButton } from './Button';

type DrawerSide = 'right' | 'left' | 'bottom';
export interface DrawerProps { open: boolean; onClose: () => void; title?: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode; side?: DrawerSide; width?: string; persistent?: boolean; }

export function Drawer({ open, onClose, title, subtitle, children, footer, side = 'right', width = 'w-full sm:w-[420px]', persistent = false }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const keydown = (event: KeyboardEvent) => { if (event.key === 'Escape' && !persistent) onClose(); };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [open, onClose, persistent]);
  const position = side === 'right' ? 'right-0 top-0 h-full border-l' : side === 'left' ? 'left-0 top-0 h-full border-r' : 'bottom-0 left-0 right-0 max-h-[92dvh] rounded-t-lg border-t';
  const from: gsap.TweenVars = side === 'right' ? { xPercent: 100 } : side === 'left' ? { xPercent: -100 } : { yPercent: 100 };
  const enter = (root: HTMLElement) => gsap.timeline()
    .from(root.querySelector('[data-p="backdrop"]'), { opacity: 0, duration: 0.25 }, 0)
    .from(root.querySelector('[data-p="panel"]'), { ...from, duration: 0.55, ease: 'power4.out', clearProps: 'transform' }, 0)
    .from(root.querySelectorAll('[data-p="panel"] > *'), { opacity: 0, y: 10, duration: 0.4, stagger: 0.06, clearProps: 'opacity,transform' }, 0.2);
  const exit = (root: HTMLElement) => gsap.timeline()
    .to(root.querySelector('[data-p="backdrop"]'), { opacity: 0, duration: 0.22 }, 0)
    .to(root.querySelector('[data-p="panel"]'), { ...from, duration: 0.32, ease: 'power3.in' }, 0);
  return <Presence open={open} enter={enter} exit={exit}><div className="fixed inset-0 z-[120]">
    <div data-p="backdrop" className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={persistent ? undefined : onClose} />
    <aside data-p="panel" role="dialog" aria-modal="true" aria-label={title || 'Painel lateral'} className={cn('absolute flex flex-col overflow-hidden border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#111827]', position, side !== 'bottom' && width)}>
      {(title || subtitle) && <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5 sm:px-5"><div className="min-w-0">{title && <h2 className="truncate text-sm font-semibold text-slate-900 dark:text-white">{title}</h2>}{subtitle && <p className="mt-0.5 text-[11px] text-slate-500 dark:text-white/50">{subtitle}</p>}</div><IconButton type="button" variant="ghost" size="sm" aria-label="Fechar" onClick={onClose}><X size={16} /></IconButton></header>}
      <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">{children}</div>
      {footer && <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5 sm:px-5">{footer}</footer>}
    </aside>
  </div></Presence>;
}

export default Drawer;
