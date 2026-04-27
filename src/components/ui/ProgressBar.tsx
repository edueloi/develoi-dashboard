import React from 'react';
import { cn } from '../../lib/utils';

interface ProgressBarProps {
  progress: number;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  size = 'md', 
  color = 'bg-indigo-600',
  showLabel = true,
  className
}) => {
  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-4'
  };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between mb-1.5">
          <span className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider">Progresso</span>
          <span className="text-[10px] font-bold text-slate-900 dark:text-white">{Math.round(progress)}%</span>
        </div>
      )}
      <div className={cn("w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden", sizes[size])}>
        <div
          className={cn(color, "h-full transition-all duration-500 ease-out rounded-full")}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
