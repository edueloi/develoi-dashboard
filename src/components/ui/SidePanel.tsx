import React, { useEffect, useState } from "react";
import { X, Maximize2, Minimize2 } from "lucide-react";
import { gsap } from "../../lib/gsap";
import { Presence } from "../motion/Presence";
import { cn } from "../../lib/utils";

// Painel lateral: desliza da direita para a esquerda da tela, com botão para expandir em tela cheia.
// Serve para detalhes longos (ticket, meta) que ficam feios dentro de um modal no meio da tela.
// largura inicial: cerca de 40% da tela (com um mínimo para não espremer); "Tela cheia" ocupa tudo
const WIDTH = { lg: "sm:w-[34vw] sm:min-w-[480px]", xl: "sm:w-[40vw] sm:min-w-[560px]", "2xl": "sm:w-[48vw] sm:min-w-[640px]" } as const;

export interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode | ((full: boolean) => React.ReactNode);
  footer?: React.ReactNode | ((full: boolean) => React.ReactNode);
  width?: keyof typeof WIDTH;
}

export function SidePanel({ isOpen, onClose, title, children, footer, width = "xl" }: SidePanelProps) {
  const [full, setFull] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [isOpen, onClose]);

  const enter = (root: HTMLElement) => gsap.timeline()
    .from(root.querySelector('[data-p="backdrop"]'), { opacity: 0, duration: 0.25 }, 0)
    .from(root.querySelector('[data-p="panel"]'), { xPercent: 100, duration: 0.55, ease: "power4.out", clearProps: "transform" }, 0)
    .from(root.querySelectorAll('[data-p="panel"] > header > *, [data-p="panel"] > div > *'), { opacity: 0, y: 12, duration: 0.4, stagger: 0.04, clearProps: "opacity,transform" }, 0.2);
  const exit = (root: HTMLElement) => gsap.timeline()
    .to(root.querySelector('[data-p="backdrop"]'), { opacity: 0, duration: 0.22 }, 0)
    .to(root.querySelector('[data-p="panel"]'), { xPercent: 100, duration: 0.32, ease: "power3.in" }, 0);

  return (
    <Presence open={isOpen} enter={enter} exit={exit}>
        <>
          <div
            data-p="backdrop"
            className="fixed inset-0 z-[90] bg-zinc-900/45 dark:bg-black/70" onClick={onClose}
          />
          <aside
            data-p="panel" role="dialog" aria-modal="true"
            className={cn("fixed top-0 right-0 bottom-0 z-[91] w-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col transition-[width] duration-300", full ? "sm:w-screen" : WIDTH[width], "sm:max-w-full")}
          >
            <header className="flex items-center gap-3 px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-white/10 flex-shrink-0">
              <div className="flex-1 min-w-0 text-sm font-black text-slate-900 dark:text-white">{title}</div>
              <button type="button" onClick={() => setFull(f => !f)} title={full ? "Reduzir" : "Tela cheia"}
                className="hidden sm:flex p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                {full ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button type="button" onClick={onClose} aria-label="Fechar" className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-5 sm:py-7">{typeof children === "function" ? children(full) : children}</div>
            {footer && <footer className="flex-shrink-0 border-t border-slate-200 dark:border-white/10 px-4 sm:px-8 py-3 bg-white dark:bg-slate-900">{typeof footer === "function" ? footer(full) : footer}</footer>}
          </aside>
        </>
    </Presence>
  );
}
