import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
  const initial = side === 'right' ? { x: '100%' } : side === 'left' ? { x: '-100%' } : { y: '100%' };
  return <AnimatePresence>{open && <div className="fixed inset-0 z-[120]">
    <motion.div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={persistent ? undefined : onClose} />
    <motion.aside role="dialog" aria-modal="true" aria-label={title || 'Painel lateral'} initial={initial} animate={{ x: 0, y: 0 }} exit={initial} transition={{ type: 'spring', damping: 30, stiffness: 350 }} className={cn('absolute flex flex-col overflow-hidden border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#111827]', position, side !== 'bottom' && width)}>
      {(title || subtitle) && <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5 sm:px-5"><div className="min-w-0">{title && <h2 className="truncate text-sm font-semibold text-slate-900 dark:text-white">{title}</h2>}{subtitle && <p className="mt-0.5 text-[11px] text-slate-500 dark:text-white/50">{subtitle}</p>}</div><IconButton type="button" variant="ghost" size="sm" aria-label="Fechar" onClick={onClose}><X size={16} /></IconButton></header>}
      <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">{children}</div>
      {footer && <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5 sm:px-5">{footer}</footer>}
    </motion.aside>
  </div>}</AnimatePresence>;
}

export default Drawer;
