import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Transaction } from '@/lib/types';

/**
 * Global Quick Date Filter — shared by the Desktop Overview & Analytics screens.
 *
 * Preset keys follow the product spec:
 *   'today' | 'last7' | 'thisMonth' | 'last30' | 'custom'
 *
 * Range semantics are INCLUSIVE on both ends, resolved in the user's local
 * timezone. The chosen key is persisted so it survives tab switches & reloads.
 */

export type GlobalRangeKey = 'today' | 'last7' | 'thisMonth' | 'last30' | 'custom';

export interface ResolvedFinanceRange {
  /** Inclusive start instant (local midnight). */
  start: Date;
  /** Inclusive end instant (23:59:59.999 local). */
  end: Date;
  /** YYYY-MM-DD keys (inclusive) used for labels/export ranges. */
  startKey: string;
  endKey: string;
}

interface FinanceDateRangeContextValue {
  rangeKey: GlobalRangeKey;
  setRangeKey: (key: GlobalRangeKey) => void;
  /** Persisted custom draft range keys (YYYY-MM-DD). */
  customStartKey: string;
  customEndKey: string;
  applyCustomRange: (startKey: string, endKey: string) => void;
  /** Fully resolved inclusive date range for the active selection. */
  range: ResolvedFinanceRange;
  isInRange: (txDate: string | Date) => boolean;
  filterTransactions: (transactions: Transaction[]) => Transaction[];
}

const FinanceDateRangeContext = createContext<FinanceDateRangeContextValue | null>(null);

const RANGE_KEY_STORAGE = 'pf_overview_range_key';
const CUSTOM_RANGE_STORAGE = 'pf_overview_range_custom';

const toKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const startOfDay = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const endOfDay = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

function parseStoredRange(): { startKey: string; endKey: string } {
  try {
    const raw = localStorage.getItem(CUSTOM_RANGE_STORAGE);
    if (raw) {
      const parsed = JSON.parse(raw) as { startKey?: string; endKey?: string };
      if (parsed?.startKey && parsed?.endKey) return { startKey: parsed.startKey, endKey: parsed.endKey };
    }
  } catch {
    /* corrupted storage → fall through to defaults */
  }
  const now = new Date();
  return { startKey: toKey(new Date(now.getFullYear(), now.getMonth(), 1)), endKey: toKey(now) };
}

function readStoredKey(): GlobalRangeKey {
  const raw = localStorage.getItem(RANGE_KEY_STORAGE) as GlobalRangeKey | null;
  if (raw && ['today', 'last7', 'thisMonth', 'last30', 'custom'].includes(raw)) return raw;
  return 'thisMonth';
}

function resolveRange(key: GlobalRangeKey, customStartKey: string, customEndKey: string): ResolvedFinanceRange {
  const now = new Date();
  const today = startOfDay(now);
  let start: Date;
  let end: Date;

  if (key === 'today') {
    start = today;
    end = today;
  } else if (key === 'last7') {
    start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
    end = today;
  } else if (key === 'last30') {
    start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29);
    end = today;
  } else if (key === 'custom' && customStartKey && customEndKey) {
    const s = new Date(`${customStartKey}T00:00:00`);
    const e = new Date(`${customEndKey}T00:00:00`);
    start = s.getTime() <= e.getTime() ? s : e;
    end = s.getTime() <= e.getTime() ? e : s;
  } else {
    // 'thisMonth' (default) or a malformed custom range → current calendar month.
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  return {
    start: startOfDay(start),
    end: endOfDay(end),
    startKey: toKey(start),
    endKey: toKey(end),
  };
}

export function FinanceDateRangeProvider({ children }: { children: ReactNode }) {
  const initialCustom = useMemo(parseStoredRange, []);
  const [rangeKey, setRangeKeyState] = useState<GlobalRangeKey>(readStoredKey);
  const [customStartKey, setCustomStartKey] = useState<string>(initialCustom.startKey);
  const [customEndKey, setCustomEndKey] = useState<string>(initialCustom.endKey);

  const setRangeKey = useCallback((key: GlobalRangeKey) => {
    setRangeKeyState(key);
    localStorage.setItem(RANGE_KEY_STORAGE, key);
  }, []);

  const applyCustomRange = useCallback(
    (startKey: string, endKey: string) => {
      const start = startKey || customStartKey;
      const end = endKey || customEndKey;
      setCustomStartKey(start);
      setCustomEndKey(end);
      localStorage.setItem(CUSTOM_RANGE_STORAGE, JSON.stringify({ startKey: start, endKey: end }));
      setRangeKey('custom');
    },
    [customStartKey, customEndKey, setRangeKey]
  );

  const range = useMemo(
    () => resolveRange(rangeKey, customStartKey, customEndKey),
    [rangeKey, customStartKey, customEndKey]
  );

  const isInRange = useCallback(
    (txDate: string | Date) => {
      const date = txDate instanceof Date ? txDate : new Date(txDate);
      const t = date.getTime();
      return t >= range.start.getTime() && t <= range.end.getTime();
    },
    [range]
  );

  const filterTransactions = useCallback(
    (transactions: Transaction[]) => transactions.filter((tx) => isInRange(tx.transaction_date || tx.created_at)),
    [isInRange]
  );

  const value: FinanceDateRangeContextValue = {
    rangeKey,
    setRangeKey,
    customStartKey,
    customEndKey,
    applyCustomRange,
    range,
    isInRange,
    filterTransactions,
  };

  return <FinanceDateRangeContext.Provider value={value}>{children}</FinanceDateRangeContext.Provider>;
}

export function useFinanceDateRange(): FinanceDateRangeContextValue {
  const ctx = useContext(FinanceDateRangeContext);
  if (!ctx) throw new Error('useFinanceDateRange harus dipakai di dalam FinanceDateRangeProvider');
  return ctx;
}
