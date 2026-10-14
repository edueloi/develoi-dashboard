import React from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: React.ReactNode;
  action?: React.ReactNode;
}

const style = {
  info: 'border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200',
  success: 'border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200',
  warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100',
  error: 'border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200',
};
const icons = { info: Info, success: CheckCircle2, warning: AlertTriangle, error: XCircle };

export function Alert({ variant = 'info', title, children, action, className, ...props }: AlertProps) {
  const Icon = icons[variant];
  return <div role={variant === 'error' ? 'alert' : 'status'} className={cn('flex min-w-0 items-start gap-2 rounded-md border p-3 text-xs leading-relaxed', style[variant], className)} {...props}>
    <Icon size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
    <div className="min-w-0 flex-1 break-words">
      {title && <div className="font-semibold">{title}</div>}
      {children && <div className={cn(title && 'mt-1')}>{children}</div>}
      {action && <div className="mt-2 flex flex-wrap gap-2">{action}</div>}
    </div>
  </div>;
}
