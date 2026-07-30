import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export function getIcon(name: string): LucideIcon {
  const iconMap = Icons as unknown as Record<string, LucideIcon>;
  return iconMap[name] ?? Icons.CircleDot;
}
