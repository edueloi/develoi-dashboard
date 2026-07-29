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
        "bg-[#0D1F4E] border-[#0D1F4E] text-white hover:bg-[#132b67] hover:border-[#132b67] shadow-sm shadow-[#0D1F4E]/20",
      secondary:
        "bg-zinc-700 border-zinc-700 text-white hover:bg-zinc-800 hover:border-zinc-800",
      success:
        "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 hover:border-emerald-700",
      danger:
        "bg-red-600 border-red-600 text-white hover:bg-red-700 hover:border-red-700",
      outline:
        "bg-white dark:bg-transparent border-zinc-300 dark:border-white/20 text-zinc-700 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/5 hover:border-[#0D1F4E]/40 dark:hover:border-white/30 hover:text-[#0D1F4E] dark:hover:text-white",
      ghost:
        "bg-transparent border-transparent text-zinc-600 dark:text-white/50 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white",
    };

    const sizes: Record<string, string> = {
      xs: "h-6 min-w-[68px] px-2 text-[10px] rounded-lg",
      sm: "h-7 min-w-[76px] px-2.5 text-[11px] rounded-lg",
      md: "h-8 min-w-[84px] px-3 text-[12px] rounded-lg",
      lg: "h-9 min-w-[96px] px-4 text-[13px] rounded-xl",
    };

    const spinnerSize = size === "lg" ? 16 : size === "md" ? 15 : 13;

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "relative inline-flex max-w-full items-center justify-center gap-1.5 whitespace-nowrap border-2",
          "font-semibold leading-none select-none transition-all duration-150 active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D1F4E]/25 focus-visible:ring-offset-1",
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
        "bg-[#0D1F4E] border-[#0D1F4E] text-white hover:bg-[#132b67] hover:border-[#132b67] shadow-sm shadow-[#0D1F4E]/20",
      secondary:
        "bg-zinc-700 border-zinc-700 text-white hover:bg-zinc-800 hover:border-zinc-800",
      success:
        "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 hover:border-emerald-700",
      danger:
        "bg-red-600 border-red-600 text-white hover:bg-red-700 hover:border-red-700",
      outline:
        "bg-white dark:bg-transparent border-zinc-300 dark:border-white/20 text-zinc-700 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/5 hover:border-[#0D1F4E]/40 dark:hover:border-white/30 hover:text-[#0D1F4E] dark:hover:text-white",
      ghost:
        "bg-transparent border-transparent text-zinc-600 dark:text-white/50 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white",
    };

    const sizes: Record<string, string> = {
      xs: "h-6 w-6 rounded-lg",
      sm: "h-7 w-7 rounded-lg",
      md: "h-8 w-8 rounded-lg",
      lg: "h-9 w-9 rounded-xl",
    };

    const spinnerSize = size === "lg" ? 16 : size === "md" ? 15 : 13;

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center shrink-0 border-2 transition-all duration-150 active:scale-90",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D1F4E]/25 focus-visible:ring-offset-1",
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
