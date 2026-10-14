/** Tokens visuais compartilhados do dashboard.
 * Estrutura inspirada no Store Stock, preservando a identidade da Develoi.
 */
export const uiTheme = {
  surface: 'rounded-lg border border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-white/5',
  popover: 'overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-white/10 dark:bg-[#111827]',
  focus: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D1F4E]/25 focus-visible:ring-offset-1 dark:focus-visible:ring-amber-300/30',
  button: {
    primary: 'border-[#0D1F4E] bg-[#0D1F4E] text-white hover:border-[#132b67] hover:bg-[#132b67] dark:border-amber-400 dark:bg-amber-400 dark:text-[#0D1F4E] dark:hover:border-amber-300 dark:hover:bg-amber-300',
    secondary: 'border-slate-200 bg-white text-slate-700 hover:border-[#0D1F4E]/30 hover:bg-slate-50 hover:text-[#0D1F4E] dark:border-white/20 dark:bg-transparent dark:text-white/80 dark:hover:bg-white/5 dark:hover:text-white',
    success: 'border-emerald-600 bg-emerald-600 text-white hover:border-emerald-700 hover:bg-emerald-700',
    danger: 'border-red-600 bg-red-600 text-white hover:border-red-700 hover:bg-red-700',
    outline: 'border-slate-200 bg-white text-slate-700 hover:border-[#0D1F4E]/30 hover:bg-slate-50 hover:text-[#0D1F4E] dark:border-white/20 dark:bg-transparent dark:text-white/80 dark:hover:bg-white/5 dark:hover:text-white',
    ghost: 'border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white',
  },
  buttonSize: {
    xs: 'h-7 min-w-[52px] rounded-md px-2 text-[11px]',
    sm: 'h-8 min-w-[60px] rounded-md px-2.5 text-[12px]',
    md: 'h-8 min-w-[60px] rounded-md px-3 text-[12px]',
    lg: 'h-9 min-w-[72px] rounded-md px-3.5 text-[13px]',
  },
  iconButtonSize: {
    xs: 'h-7 w-7 rounded-md', sm: 'h-8 w-8 rounded-md', md: 'h-9 w-9 rounded-md', lg: 'h-10 w-10 rounded-md',
  },
} as const;

export const iconButtonVariants = {
  ...uiTheme.button,
  primary: 'border-[#0D1F4E] bg-[#0D1F4E] text-white hover:border-[#132b67] hover:bg-[#132b67] dark:border-amber-400 dark:bg-amber-400 dark:text-[#0D1F4E]',
  outline: 'border-[#0D1F4E] bg-white text-[#0D1F4E] hover:bg-slate-50 dark:border-amber-400 dark:bg-transparent dark:text-amber-300',
} as const;
