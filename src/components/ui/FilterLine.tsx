import React from 'react';
import { Search, LayoutGrid, List as ListIcon } from 'lucide-react';
import { DatePicker } from './DatePicker';

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

type FilterLineSectionAlign = 'left' | 'center' | 'right';

interface FilterLineProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface FilterLineSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  grow?: boolean;
  align?: FilterLineSectionAlign;
  wrap?: boolean;
}

interface FilterLineItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  grow?: boolean;
  fullOnMobile?: boolean;
  minWidth?: number | string;
}

interface FilterLineGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  compact?: boolean;
}

interface FilterSegmentOption<T extends string | number = string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

interface FilterLineSegmentedProps<T extends string | number = string> {
  value: T;
  onChange: (value: T) => void;
  options: FilterSegmentOption<T>[];
  className?: string;
  size?: 'sm' | 'md';
}

interface FilterLineViewToggleProps<T extends string | number = string> {
  value: T;
  onChange: (value: T) => void;
  gridValue: T;
  listValue: T;
  className?: string;
}

interface FilterLineSearchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

interface FilterLineDateRangeProps {
  from: string | null;
  to: string | null;
  onFromChange: (value: string | null) => void;
  onToChange: (value: string | null) => void;
  fromLabel?: string;
  toLabel?: string;
  className?: string;
}

export const FilterLine: React.FC<FilterLineProps> = ({ children, className = '', ...props }) => (
  <div className={cx('w-full rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/5', className)} {...props}>
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      {children}
    </div>
  </div>
);

export const FilterLineSection: React.FC<FilterLineSectionProps> = ({
  children, className = '', grow = false, align = 'left', wrap = true, ...props
}) => (
  <div
    className={cx(
      'min-w-0',
      grow && 'flex-1',
      'flex items-center gap-3',
      wrap ? 'flex-wrap' : 'flex-nowrap',
      align === 'left' && 'justify-start',
      align === 'center' && 'justify-center',
      align === 'right' && 'justify-start xl:justify-end',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const FilterLineItem: React.FC<FilterLineItemProps> = ({
  children, className = '', grow = false, fullOnMobile = true, minWidth, style, ...props
}) => (
  <div
    className={cx(fullOnMobile ? 'w-full sm:w-auto' : 'w-auto', grow && 'flex-1', className)}
    style={{ minWidth: minWidth ?? undefined, ...style }}
    {...props}
  >
    {children}
  </div>
);

export const FilterLineGroup: React.FC<FilterLineGroupProps> = ({
  children, className = '', compact = false, ...props
}) => (
  <div
    className={cx('inline-flex items-center rounded-lg bg-slate-100 dark:bg-white/10', compact ? 'gap-1 p-1' : 'gap-1.5 p-1', className)}
    {...props}
  >
    {children}
  </div>
);

export function FilterLineSegmented<T extends string | number = string>({
  value, onChange, options, className = '', size = 'md',
}: FilterLineSegmentedProps<T>) {
  return (
    <FilterLineGroup compact={size === 'sm'} className={className}>
      {options.map((option) => {
        const active = String(option.value) === String(value);
        return (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            className={cx(
              'inline-flex items-center gap-2 rounded-md font-semibold transition-colors',
              size === 'sm' ? 'px-3 py-1.5 text-[11px]' : 'px-4 py-2 text-xs',
              active ? 'bg-white text-[#0D1F4E] shadow-sm dark:bg-[#0D1F4E] dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-white/50 dark:hover:text-white'
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </FilterLineGroup>
  );
}

export function FilterLineViewToggle<T extends string | number = string>({
  value, onChange, gridValue, listValue, className = '',
}: FilterLineViewToggleProps<T>) {
  const isGrid = String(value) === String(gridValue);
  const isList = String(value) === String(listValue);

  return (
    <div className={cx('inline-flex items-center rounded-lg border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-white/5', className)}>
      <button
        type="button"
        onClick={() => onChange(gridValue)}
        className={cx('inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors', isGrid ? 'bg-[#0D1F4E]/10 text-[#0D1F4E] dark:bg-amber-400/10 dark:text-amber-300' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5')}
        aria-label="Grade"
      >
        <LayoutGrid size={15} />
      </button>
      <button
        type="button"
        onClick={() => onChange(listValue)}
        className={cx('inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors', isList ? 'bg-[#0D1F4E]/10 text-[#0D1F4E] dark:bg-amber-400/10 dark:text-amber-300' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5')}
        aria-label="Lista"
      >
        <ListIcon size={15} />
      </button>
    </div>
  );
}

export const FilterLineSearch: React.FC<FilterLineSearchProps> = ({
  value, onChange, placeholder = 'Buscar...', className = '', ...props
}) => (
  <div className={cx(
    'flex h-9 w-full items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 transition-colors dark:border-white/10 dark:bg-white/5',
    'focus-within:border-[#0D1F4E]/50 focus-within:ring-2 focus-within:ring-[#0D1F4E]/10 focus-within:bg-white dark:focus-within:bg-white/10',
    className
  )}>
    <Search size={15} className="shrink-0 text-zinc-400" />
    <input
      {...props}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-transparent text-xs font-medium text-slate-800 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-white/30"
    />
  </div>
);

export const FilterLineDateRange: React.FC<FilterLineDateRangeProps> = ({
  from, to, onFromChange, onToChange, fromLabel = 'De', toLabel = 'Até', className = '',
}) => (
  <div className={cx('flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-3', className)}>
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-semibold text-slate-500 dark:text-white/50">{fromLabel}</span>
      <div className="min-w-[140px]">
        <DatePicker value={from} onChange={onFromChange} />
      </div>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-semibold text-slate-500 dark:text-white/50">{toLabel}</span>
      <div className="min-w-[140px]">
        <DatePicker value={to} onChange={onToChange} />
      </div>
    </div>
  </div>
);
