import React from "react";
import { cn } from "../../lib/utils";
import { Loader2 } from "lucide-react";
import { iconButtonVariants, uiTheme } from './theme';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
  iconLeft?: React.ReactNode;
  /** Alias para compatibilidade com os componentes do Store Stock. */
  icon?: React.ReactNode;
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
      iconLeft: iconLeftProp,
      icon,
      iconRight,
      fullWidth = false,
      children,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    const iconLeft = iconLeftProp ?? icon;

    const spinnerSize = size === "lg" ? 16 : size === "md" ? 15 : 13;

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(
          "relative inline-flex max-w-full items-center justify-center gap-1.5 whitespace-nowrap border-2",
          "font-medium leading-none select-none transition-all duration-150 active:scale-[0.98]",
          uiTheme.focus,
          "disabled:pointer-events-none disabled:opacity-50",
          "[&_svg]:shrink-0 [&_svg]:pointer-events-none",
          fullWidth && "w-full",
          uiTheme.button[variant],
          uiTheme.buttonSize[size],
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
      type = "button",
      ...props
    },
    ref
  ) => {
    const spinnerSize = size === "lg" ? 16 : size === "md" ? 15 : 13;

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(
          "inline-flex shrink-0 items-center justify-center border transition-colors duration-150",
          uiTheme.focus,
          "disabled:pointer-events-none disabled:opacity-50",
          "[&_svg]:shrink-0 [&_svg]:pointer-events-none",
          iconButtonVariants[variant],
          uiTheme.iconButtonSize[size],
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
