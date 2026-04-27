import React from "react";
import { cn } from "../../lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      iconLeft,
      iconRight,
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const variants: Record<string, string> = {
      primary:
        "bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 hover:border-indigo-700 shadow-sm shadow-indigo-500/20",
      secondary:
        "bg-violet-600 border-violet-600 text-white hover:bg-violet-700 hover:border-violet-700",
      success:
        "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 hover:border-emerald-700",
      danger:
        "bg-red-600 border-red-600 text-white hover:bg-red-700 hover:border-red-700",
      outline:
        "bg-white dark:bg-transparent border-zinc-300 dark:border-white/20 text-zinc-700 dark:text-white/70 hover:bg-zinc-50 dark:hover:bg-white/5 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-400",
      ghost:
        "bg-transparent border-transparent text-zinc-600 dark:text-white/50 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white",
    };

    const sizes: Record<string, string> = {
      xs: "h-7 min-w-[74px] px-2.5 text-[11px] rounded-[20px]",
      sm: "h-8 min-w-[82px] px-3 text-[12px] rounded-[20px]",
      md: "h-9 min-w-[90px] px-4 text-[13px] rounded-[20px]",
      lg: "h-10 min-w-[110px] px-5 text-[14px] rounded-[20px]",
    };

    const spinnerSize = size === "lg" ? 16 : size === "md" ? 15 : 13;

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "relative inline-flex max-w-full items-center justify-center gap-1.5 whitespace-nowrap border-2",
          "font-semibold leading-none select-none transition-all duration-150 active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50 focus-visible:ring-offset-1",
          "disabled:pointer-events-none disabled:opacity-50",
          "[&_svg]:shrink-0 [&_svg]:pointer-events-none",
          fullWidth && "w-full",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 size={spinnerSize} className="animate-spin shrink-0" />
        ) : (
          <>
            {iconLeft && (
              <span className="flex shrink-0 items-center justify-center">
                {iconLeft}
              </span>
            )}

            {children !== undefined && children !== null && (
              <span className="inline-flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap leading-none [&>svg]:shrink-0">
                {children}
              </span>
            )}

            {iconRight && (
              <span className="flex shrink-0 items-center justify-center">
                {iconRight}
              </span>
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

// ── IconButton ────────────────────────────────────────────────

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      variant = "ghost",
      size = "md",
      loading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const variants: Record<string, string> = {
      primary:
        "bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 hover:border-indigo-700 shadow-sm shadow-indigo-500/20",
      secondary:
        "bg-violet-600 border-violet-600 text-white hover:bg-violet-700 hover:border-violet-700",
      success:
        "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 hover:border-emerald-700",
      danger:
        "bg-red-600 border-red-600 text-white hover:bg-red-700 hover:border-red-700",
      outline:
        "bg-white dark:bg-transparent border-zinc-300 dark:border-white/20 text-zinc-700 dark:text-white/70 hover:bg-zinc-50 dark:hover:bg-white/5 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-400",
      ghost:
        "bg-transparent border-transparent text-zinc-600 dark:text-white/50 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white",
    };

    const sizes: Record<string, string> = {
      xs: "h-7 w-7 rounded-[10px]",
      sm: "h-8 w-8 rounded-[10px]",
      md: "h-9 w-9 rounded-[12px]",
      lg: "h-10 w-10 rounded-[12px]",
    };

    const spinnerSize = size === "lg" ? 16 : size === "md" ? 15 : 13;

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center shrink-0 border-2 transition-all duration-150 active:scale-90",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50 focus-visible:ring-offset-1",
          "disabled:pointer-events-none disabled:opacity-50",
          "[&_svg]:shrink-0 [&_svg]:pointer-events-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 size={spinnerSize} className="animate-spin" />
        ) : (
          children
        )}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";
