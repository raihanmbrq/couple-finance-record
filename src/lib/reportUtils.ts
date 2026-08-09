import type { Transaction } from '@/lib/types';
import type { ReportCategoryRow } from '@/components/EStatementPDFDocument';

export interface ReportRange {
  start: string;
  end: string;
}

export type ReportFormat = 'excel' | 'pdf';

export interface ReportData {
  rows: Transaction[];
  totalIncome: number;
  totalExpense: number;
  netCashflow: number;
  categoryBreakdown: ReportCategoryRow[];
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function startOfMonthRange(): ReportRange {
  const now = new Date();
  return {
    start: toDateKey(new Date(now.getFullYear(), now.getMonth(), 1)),
    end: toDateKey(now),
  };
}

export function last30DaysRange(): ReportRange {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 29);
  return { start: toDateKey(start), end: toDateKey(now) };
}

export function getDefaultRange(): ReportRange {
  return startOfMonthRange();
}

export function filterTransactionsByRange(
  transactions: Transaction[],
  range: ReportRange
): Transaction[] {
  return transactions
    .filter((tx) => {
      const dateKey = (tx.transaction_date || tx.created_at).slice(0, 10);
      return dateKey >= range.start && dateKey <= range.end;
    })
    .sort((a, b) => {
      const dateDiff =
        new Date(b.transaction_date || b.created_at).getTime() -
        new Date(a.transaction_date || a.created_at).getTime();
      if (dateDiff !== 0) return dateDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
}

export function computeReportData(txs: Transaction[]): ReportData {
  const totalIncome = txs.filter((tx) => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpense = txs.filter((tx) => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);

  const expenseByCategory = new Map<string, number>();
  for (const tx of txs) {
    if (tx.type !== 'expense') continue;
    expenseByCategory.set(tx.category, (expenseByCategory.get(tx.category) ?? 0) + tx.amount);
  }

  const categoryBreakdown: ReportCategoryRow[] = Array.from(expenseByCategory.entries())
    .map(([category, total]) => ({
      category,
      total,
      percentage: totalExpense > 0 ? Math.round((total / totalExpense) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    rows: txs,
    totalIncome,
    totalExpense,
    netCashflow: totalIncome - totalExpense,
    categoryBreakdown,
  };
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function generateReportId(): string {
  const now = new Date();
  const d = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PF-${d}-${rand}`;
}
