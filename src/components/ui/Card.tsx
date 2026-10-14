import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: 'blue' | 'emerald' | 'amber' | 'red' | 'purple' | 'slate';
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const accent = {
  blue: 'border-l-4 border-l-blue-500', emerald: 'border-l-4 border-l-emerald-500', amber: 'border-l-4 border-l-amber-500',
  red: 'border-l-4 border-l-red-500', purple: 'border-l-4 border-l-violet-500', slate: 'border-l-4 border-l-slate-400',
};
const padding = { none: '', sm: 'p-3', md: 'p-3', lg: 'p-4' };

export function Card({ accent: accentColor, hover = false, padding: spacing = 'md', className, children, ...props }: CardProps) {
  return <div className={cn('rounded-lg border border-slate-200 bg-white transition-colors dark:border-white/10 dark:bg-white/5', hover && 'cursor-pointer hover:border-slate-300 dark:hover:border-white/20', accentColor && accent[accentColor], padding[spacing], className)} {...props}>{children}</div>;
}
