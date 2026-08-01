import { type ReactNode } from 'react';

type BadgeColor = 'primary' | 'secondary' | 'income' | 'expense' | 'warning';

interface BadgeProps {
  children: ReactNode;
  color?: BadgeColor;
  className?: string;
}

const colorClasses: Record<BadgeColor, string> = {
  primary: 'bg-primary/10 text-primary border-primary/20',
  secondary: 'bg-secondary text-text-secondary border-secondary',
  income: 'bg-income/10 text-income border-income/20',
  expense: 'bg-expense/10 text-expense border-expense/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
};

export function Badge({ children, color = 'secondary', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${colorClasses[color]} ${className}`}>
      {children}
    </span>
  );
}
