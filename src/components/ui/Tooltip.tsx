import React from 'react';
import { cn } from '../../lib/utils';

export function Tooltip({ content, children, className }: { content: React.ReactNode; children: React.ReactNode; className?: string; }) {
  return <span className="group/tooltip relative inline-flex">{children}<span role="tooltip" className={cn('pointer-events-none absolute bottom-full left-1/2 z-[130] mb-2 w-max max-w-56 -translate-x-1/2 rounded-md bg-slate-900 px-2 py-1 text-[11px] leading-snug text-white opacity-0 shadow-lg transition-opacity group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100', className)}>{content}</span></span>;
}

export default Tooltip;
