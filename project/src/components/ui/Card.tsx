import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  elevated?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', elevated = false, onClick }: CardProps) {
  const base = elevated ? 'card-elevated' : 'card';
  const interactive = onClick ? 'cursor-pointer hover:shadow-card active:scale-[0.99] transition-all duration-150' : '';
  return (
    <div className={`${base} ${interactive} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}
