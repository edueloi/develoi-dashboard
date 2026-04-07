import React from 'react';

interface ProgressBarProps {
  progress: number;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  size = 'md', 
  color = 'bg-indigo-600',
  showLabel = true
}) => {
  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-4'
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between mb-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Progresso</span>
          <span className="text-[10px] font-bold text-slate-900">{Math.round(progress)}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${sizes[size]}`}>
        <div 
          className={`${color} h-full transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
