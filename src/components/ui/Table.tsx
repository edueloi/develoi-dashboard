import React from 'react';
import { cn } from '../../lib/utils';

/** Contêiner semântico para tabelas simples; listas extensas devem usar GridTable. */
export function Table({ className, children, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return <div className="w-full overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5"><table className={cn('w-full min-w-[640px] text-left text-xs', className)} {...props}>{children}</table></div>;
}
