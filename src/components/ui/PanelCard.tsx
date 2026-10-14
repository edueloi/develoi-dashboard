import React from "react";
import { cn } from "@/src/lib/utils";
import { uiTheme } from './theme';

interface PanelCardProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  description?: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
  contentClassName?: string;
  headerClassName?: string;
  iconWrapClassName?: string;
  iconClassName?: string;
}

export function PanelCard({
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
  contentClassName,
  headerClassName,
  iconWrapClassName,
  iconClassName,
  ...props
}: PanelCardProps) {
  const hasHeader = !!(title || Icon || action);

  return (
    <section
      className={cn(
        "overflow-hidden",
        uiTheme.surface,
        className
      )}
      {...props}
    >
      {hasHeader && (
        <div
          className={cn(
            "flex flex-col gap-3 border-b border-slate-100 px-3 py-2.5 lg:flex-row lg:items-center lg:justify-between dark:border-white/10",
            headerClassName
          )}
        >
          <div className="flex min-w-0 items-start gap-3">
            {Icon && (
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-amber-100 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10",
                  iconWrapClassName
                )}
              >
                <Icon size={14} className={cn("text-amber-600 dark:text-amber-400", iconClassName)} />
              </div>
            )}

            {(title || description) && (
              <div className="min-w-0">
                {title && (
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</h3>
                )}
                {description && (
                  <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-white/50">{description}</p>
                )}
              </div>
            )}
          </div>

          {action && <div className="w-full lg:w-auto">{action}</div>}
        </div>
      )}

      <div className={cn("p-3", contentClassName)}>{children}</div>
    </section>
  );
}
