import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { gsap } from "../../lib/gsap";
import { Presence } from "../motion/Presence";
import { cn } from "../../lib/utils";
import { Button } from "./Button";

// ─────────────────────────────────────────────────────────────────────────────
// Modal — Design System
//
// Comportamento responsivo automático:
//  • Mobile (<640px): bottom-sheet com handle iOS ou fullscreen
//  • Tablet/Desktop: modal centralizado com bordas arredondadas
//
// Tamanhos (desktop):
//  xs  → 360px   (confirmações simples)
//  sm  → 448px   (forms pequenos)
//  md  → 512px   (padrão geral)
//  lg  → 640px   (forms médios)
//  xl  → 768px   (forms grandes / detalhes)
//  2xl → 900px   (painéis complexos / split)
//  full → 95vw   (tabelas / relatórios)
//
// Slots:
//  title    → header fixo com botão fechar
//  children → body scrollável
//  footer   → rodapé fixo com ações (use ModalFooter)
// ─────────────────────────────────────────────────────────────────────────────

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string | React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "full" | "auto";
  hideCloseButton?: boolean;
  /** Mobile presentation mode */
  mobileStyle?: "bottom-sheet" | "fullscreen" | "center";
  backdropBlur?: "none" | "sm" | "md";
}

const sizeClasses: Record<string, string> = {
  xs:   "sm:max-w-[360px]",
  sm:   "sm:max-w-[448px]",
  md:   "sm:max-w-[512px]",
  lg:   "sm:max-w-[640px]",
  xl:   "sm:max-w-[768px]",
  "2xl":"sm:max-w-[900px]",
  full: "sm:max-w-[95dvw] sm:w-full",
  auto: "sm:w-auto",
};

const backdropConfigs: Record<string, string> = {
  none: "",
  sm:   "backdrop-blur-[2px]",
  md:   "backdrop-blur-[4px]",
};

// ── Animações (GSAP) ───────────────────────────────────────────────────────
type ModalMode = "bottom-sheet" | "fullscreen" | "desktop";

const panelFrom: Record<ModalMode, gsap.TweenVars> = {
  "bottom-sheet": { yPercent: 100, opacity: 1 },
  fullscreen:     { opacity: 0, scale: 0.96, y: 24 },
  desktop:        { opacity: 0, scale: 0.97, y: 16 },
};

const panelExit: Record<ModalMode, gsap.TweenVars> = {
  "bottom-sheet": { yPercent: 100, duration: 0.28, ease: "power3.in" },
  fullscreen:     { opacity: 0, scale: 0.96, y: -16, duration: 0.2, ease: "power2.in" },
  desktop:        { opacity: 0, scale: 0.97, y: -12, duration: 0.18, ease: "power2.in" },
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className,
  size = "md",
  hideCloseButton = false,
  mobileStyle = "bottom-sheet",
  backdropBlur = "sm",
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Bloqueia scroll do body enquanto o modal está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const isBottomSheet   = isMobile && mobileStyle === "bottom-sheet";
  const isMobileFullscreen = isMobile && mobileStyle === "fullscreen";

  const mode: ModalMode = isMobile
    ? isMobileFullscreen ? "fullscreen" : "bottom-sheet"
    : "desktop";

  const enter = (root: HTMLElement) => {
    const tl = gsap.timeline();
    tl.from(root.querySelector('[data-p="backdrop"]'), { opacity: 0, duration: 0.25, ease: "power2.out" }, 0);
    tl.from(root.querySelector('[data-p="panel"]'), {
      ...panelFrom[mode],
      duration: mode === "bottom-sheet" ? 0.55 : 0.5,
      ease: mode === "bottom-sheet" ? "power4.out" : "back.out(1.3)",
      clearProps: "transform,opacity",
    }, 0);
    return tl;
  };

  const exit = (root: HTMLElement) => {
    const tl = gsap.timeline();
    tl.to(root.querySelector('[data-p="backdrop"]'), { opacity: 0, duration: 0.22, ease: "power2.in" }, 0);
    tl.to(root.querySelector('[data-p="panel"]'), panelExit[mode], 0);
    return tl;
  };

  return (
    <Presence open={isOpen} enter={enter} exit={exit}>
        <>
          {/* Backdrop */}
          <div
            data-p="backdrop"
            onClick={onClose}
            className={cn(
              "fixed inset-0 z-[100] bg-zinc-900/45 dark:bg-black/70",
              backdropConfigs[backdropBlur]
            )}
          />

          {/* Container de posicionamento */}
          <div
            className={cn(
              "fixed inset-0 z-[101] flex pointer-events-none",
              isBottomSheet
                ? "items-end sm:items-center sm:justify-center p-0 sm:p-6"
                : "items-center justify-center p-4 sm:p-6"
            )}
          >
            <div
              data-p="panel"
              className={cn(
                "w-full bg-white dark:bg-[#111118] relative flex flex-col pointer-events-auto overflow-hidden",
                // Mobile styles
                isBottomSheet && [
                  "rounded-t-lg sm:rounded-lg",
                  "max-h-[92dvh] sm:max-h-[88vh]",
                  "shadow-[0_-12px_48px_rgba(0,0,0,0.12)]",
                ],
                isMobileFullscreen && [
                  "h-[100dvh] w-full rounded-none",
                ],
                // Desktop styles
                !isBottomSheet && !isMobileFullscreen && [
                  "rounded-lg",
                  "max-h-[90dvh] sm:max-h-[88vh]",
                ],
                "sm:rounded-lg sm:shadow-xl sm:border sm:border-slate-200 dark:sm:border-white/10",
                sizeClasses[size],
                className
              )}
            >
              {/* iOS Grab Handle */}
              {isBottomSheet && (
                <div className="w-full flex justify-center pt-3 pb-0 shrink-0 sm:hidden">
                  <div className="w-10 h-[5px] rounded-full bg-zinc-200 dark:bg-white/20" />
                </div>
              )}

              {/* Header */}
              {title && (
                <div
                  className={cn(
                    "flex items-center justify-between shrink-0",
                    "px-4 sm:px-5",
                    "border-b border-slate-200 dark:border-white/10",
                    isBottomSheet ? "pt-4 pb-3 sm:py-3" : "py-3"
                  )}
                >
                  <div className="truncate pr-4 text-sm font-semibold text-zinc-900 dark:text-white">
                    {title}
                  </div>
                  {!hideCloseButton && (
                    <button
                      onClick={onClose}
                      aria-label="Fechar"
                      className="-mr-1 rounded-md p-2 text-zinc-400 transition-colors hover:bg-slate-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D1F4E]/25 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white shrink-0"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              )}

              {/* Body — scrollável */}
              <div className="relative w-full flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 scroll-smooth">
                {/* Botão fechar flutuante (quando sem título) */}
                {!title && !hideCloseButton && (
                  <button
                    onClick={onClose}
                    aria-label="Fechar"
                    className="absolute right-4 top-4 z-10 rounded-md border border-slate-200 bg-white p-2 text-zinc-500 transition-colors hover:bg-slate-50 hover:text-zinc-900 dark:border-white/10 dark:bg-white/10 dark:text-white/50 dark:hover:text-white"
                  >
                    <X size={17} strokeWidth={2.5} />
                  </button>
                )}
                {children}
              </div>

              {/* Footer fixo */}
              {footer && (
                <div
                  className={cn(
                    "shrink-0 border-t border-slate-200 dark:border-white/10",
                    "px-4 py-3 sm:px-5 sm:py-3",
                    // Safe area para dispositivos com home bar
                    "pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-5"
                  )}
                >
                  {footer}
                </div>
              )}
            </div>
          </div>
        </>
    </Presence>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ModalFooter — Padrão de rodapé de ações
//
// Mobile: botões empilhados (ação principal primeiro visualmente, mas
//         flex-col-reverse garante ordem lógica correta)
// Desktop: alinhados à direita
// ─────────────────────────────────────────────────────────────────────────────

interface ModalFooterProps {
  children: React.ReactNode;
  align?: "left" | "right" | "between";
  className?: string;
}

export function ModalFooter({ children, align = "right", className }: ModalFooterProps) {
  const alignMap = {
    left:    "sm:justify-start",
    right:   "sm:justify-end",
    between: "sm:justify-between",
  };

  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:items-center",
        alignMap[align],
        className
      )}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ConfirmModal — Modal de confirmação simples (sim/não)
// ─────────────────────────────────────────────────────────────────────────────

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary" | "success";
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  loading = false,
}: ConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="xs"
      mobileStyle="center"
      footer={
        <ModalFooter>
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            variant={variant}
            loading={loading}
            className="w-full sm:w-auto"
          >
            {confirmLabel}
          </Button>
        </ModalFooter>
      }
    >
      <div className="text-sm text-zinc-600 leading-relaxed">{message}</div>
    </Modal>
  );
}
