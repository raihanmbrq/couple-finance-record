import React from 'react';
import { getIcon } from '@/lib/icons';
import { getCategoryChipClass, getCategoryIconClass } from '@/lib/categoryStyle';

interface CategoryChipProps {
  categoryKey: string;
  iconName?: string | null;
  label?: string;
  className?: string;
}

/**
 * Soft-pastel category badge with a lucide icon for quick visual scanning.
 * Used by the Transactions Data Grid, Member Breakdown & Top Expenses widgets.
 */
export const CategoryChip: React.FC<CategoryChipProps> = ({
  categoryKey,
  iconName,
  label,
  className = '',
}) => {
  const resolvedLabel = label || categoryKey;
  const Icon = getIcon(iconName || 'CircleDot');
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${getCategoryChipClass(
        categoryKey
      )} ${className}`}
    >
      <Icon className={`w-3.5 h-3.5 ${getCategoryIconClass(categoryKey)}`} />
      <span className="capitalize">{resolvedLabel}</span>
    </span>
  );
};
