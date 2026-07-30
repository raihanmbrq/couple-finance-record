import { type ReactNode } from 'react';

type BadgeColor = 'teal' | 'amber' | 'stone' | 'green' | 'red' | 'blue' | 'purple';

interface BadgeProps {
  children: ReactNode;
  color?: BadgeColor;
  className?: string;
}

const colorClasses: Record<BadgeColor, string> = {
  teal: 'bg-teal-50 text-teal-700 border-teal-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  stone: 'bg-stone-100 text-stone-600 border-stone-200',
  green: 'bg-green-50 text-green-700 border-green-200',
  red: 'bg-red-50 text-red-600 border-red-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
};

export function Badge({ children, color = 'stone', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${colorClasses[color]} ${className}`}>
      {children}
    </span>
  );
}
