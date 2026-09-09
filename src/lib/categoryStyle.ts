import { getCategory, type TransactionCategory } from '@/lib/types';

/**
 * Soft-pastel category styling for quick visual scanning.
 *
 * IMPORTANT: class strings must stay full & literal (Tailwind scans source),
 * and must only reference shades that actually exist in tailwind.config.js
 * (amber/teal are restricted to 50/100/200/600/700 there; stone is custom).
 */

type CategoryVisual = {
  chip: string;      // pastel badge classes (used on a background)
  icon: string;      // icon color inside the badge
  dot: string;       // small status dot
  bar: string;       // progress bar fill
};

const VISUALS: CategoryVisual[] = [
  { chip: 'bg-amber-100 text-amber-700', icon: 'text-amber-600', dot: 'bg-amber-500', bar: 'bg-amber-500' },
  { chip: 'bg-blue-100 text-blue-700', icon: 'text-blue-600', dot: 'bg-blue-500', bar: 'bg-blue-500' },
  { chip: 'bg-purple-100 text-purple-700', icon: 'text-purple-600', dot: 'bg-purple-500', bar: 'bg-purple-500' },
  { chip: 'bg-teal-100 text-teal-700', icon: 'text-teal-600', dot: 'bg-teal-600', bar: 'bg-teal-600' },
  { chip: 'bg-green-100 text-green-700', icon: 'text-green-600', dot: 'bg-green-500', bar: 'bg-green-500' },
  { chip: 'bg-red-100 text-red-700', icon: 'text-red-600', dot: 'bg-red-500', bar: 'bg-red-500' },
  { chip: 'bg-indigo-100 text-indigo-700', icon: 'text-indigo-600', dot: 'bg-indigo-500', bar: 'bg-indigo-500' },
  { chip: 'bg-stone-200 text-stone-700', icon: 'text-stone-600', dot: 'bg-stone-500', bar: 'bg-stone-500' },
];

// Stable per-key assignment so a category always renders the same pastel hue.
const KEY_TO_INDEX: Record<string, number> = {
  food: 0,
  bills: 1,
  shopping: 2,
  entertainment: 3,
  transport: 4,
  health: 5,
  education: 1,
  salary: 4,
  goals: 2,
  coffee: 3,
  gift: 6,
  transfer: 7,
  other: 7,
};

const hashCode = (s: string): number =>
  s.split('').reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7);

function paletteIndex(key: string): number {
  if (KEY_TO_INDEX[key] !== undefined) return KEY_TO_INDEX[key];
  const seed = getCategory(key)?.color ? `${key}:${getCategory(key)?.color}` : key;
  return hashCode(seed) % VISUALS.length;
}

export function getCategoryChipClass(key: string): string {
  return VISUALS[paletteIndex(key)].chip;
}

export function getCategoryIconClass(key: string): string {
  return VISUALS[paletteIndex(key)].icon;
}

export function getCategoryDotClass(key: string): string {
  return VISUALS[paletteIndex(key)].dot;
}

export function getCategoryBarClass(key: string): string {
  return VISUALS[paletteIndex(key)].bar;
}

/** Resolve a category's display label + lucide icon name (supports custom categories). */
export function resolveCategoryMeta(
  key: string | undefined,
  categories: TransactionCategory[]
): { label: string; icon: string; key: string } {
  const safeKey = key || 'other';
  const custom = categories.find((c) => c.id === safeKey);
  if (custom) return { label: custom.name, icon: custom.icon || 'CircleDot', key: safeKey };
  const system = getCategory(safeKey);
  return { label: system?.label || safeKey, icon: system?.icon || 'CircleDot', key: safeKey };
}
