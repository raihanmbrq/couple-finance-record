import { type ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-cream-100 flex items-center justify-center text-stone-400 mb-4">
        {icon}
      </div>
      <h3 className="font-display font-semibold text-stone-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-stone-500 max-w-xs mb-4">{description}</p>}
      {action}
    </div>
  );
}
