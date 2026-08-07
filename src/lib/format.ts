import { getCurrencyInfo } from '@/lib/currencies';

export function formatMoney(amount: number, currency: string = 'IDR'): string {
  const info = getCurrencyInfo(currency);
  return new Intl.NumberFormat(info.locale, {
    style: 'currency',
    currency: info.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatMoneyShort(amount: number, currency: string = 'IDR'): string {
  const info = getCurrencyInfo(currency);
  const absAmount = Math.abs(amount);

  // Indonesia-specific shorthand (M = miliar, JT = juta) preserved for IDR.
  if (info.code === 'IDR') {
    if (absAmount >= 1_000_000_000) {
      return `Rp ${(amount / 1_000_000_000).toFixed(1)} M`;
    }
    if (absAmount >= 100_000_000) {
      return `Rp ${(amount / 1_000_000).toFixed(1)} JT`;
    }
    return formatMoney(amount, 'IDR');
  }

  // Other currencies: use compact notation so large amounts stay readable.
  return new Intl.NumberFormat(info.locale, {
    style: 'currency',
    currency: info.code,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
}

export function parseMoneyInput(value: string): number {
  const digits = value.replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

export function formatMoneyInput(amount: number, currency: string = 'IDR'): string {
  if (!amount) return '';
  const info = getCurrencyInfo(currency);
  return new Intl.NumberFormat(info.locale).format(amount);
}

// --- Legacy wrappers (kept for compatibility; default to IDR) ---

export function formatIDR(amount: number): string {
  return formatMoney(amount, 'IDR');
}

export function formatIDRShort(amount: number): string {
  return formatMoneyShort(amount, 'IDR');
}

export function parseIDRInput(value: string): number {
  return parseMoneyInput(value);
}

export function formatIDRInput(amount: number): string {
  return formatMoneyInput(amount, 'IDR');
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d);
}