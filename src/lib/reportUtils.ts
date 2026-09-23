import type { Budget, Goal, Transaction, Wallet } from '@/lib/types';
import type { ReportCategoryRow } from '@/components/EStatementPDFDocument';

export interface ReportRange {
  start: string;
  end: string;
}

export type ReportFormat = 'excel' | 'pdf' | 'pptx';

export interface ReportData {
  rows: Transaction[];
  totalIncome: number;
  totalExpense: number;
  /**
   * Total of internal wallet transfers in the period. Listed for transparency
   * only — never added to income, expense or net cashflow.
   */
  totalTransfer: number;
  netCashflow: number;
  categoryBreakdown: ReportCategoryRow[];
  topExpensesByAmount: ReportExpenseRow[];
  topExpensesByFrequency: ReportFrequencyRow[];
  memberBreakdown: ReportMemberRow[];
  walletBreakdown: ReportWalletRow[];
  highlightedTransactions: Transaction[];
  budgetBreakdown: ReportBudgetRow[];
  goalBreakdown: ReportGoalRow[];
}

export interface ReportExpenseRow {
  transaction: Transaction;
  percentage: number;
}

export interface ReportFrequencyRow {
  key: string;
  count: number;
  total: number;
}

export interface ReportMemberRow {
  member: string;
  total: number;
  percentage: number;
}

export interface ReportWalletRow {
  wallet: Wallet;
  endingBalance: number;
}

export interface ReportBudgetRow {
  category: string;
  limit: number;
  spent: number;
  percentage: number;
  status: 'healthy' | 'warning' | 'over';
}

export interface ReportGoalRow {
  goal: Goal;
  percentage: number;
}

export interface ReportContext {
  wallets?: Wallet[];
  allTransactions?: Transaction[];
  budgets?: Budget[];
  goals?: Goal[];
  highlightedThreshold?: number;
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

export function computeReportData(txs: Transaction[], context: ReportContext = {}): ReportData {
  // Internal wallet transfers (`type = 'transfer'`) move money between the
  // household's own wallets, so they must never inflate Income or Expense.
  // They stay in `rows` so the detail sheet keeps the full cashflow history.
  //
  // Note: an EXPENSE/INCOME row with the "Transfer" category is an EXTERNAL
  // movement (money sent to / received from a third party) and stays counted.
  const counted = txs.filter((tx) => tx.type !== 'transfer');

  const totalIncome = counted.filter((tx) => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpense = counted.filter((tx) => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
  const totalTransfer = txs
    .filter((tx) => tx.type === 'transfer')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const expenseByCategory = new Map<string, number>();
  for (const tx of counted) {
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

  const topExpensesByAmount = counted
    .filter((tx) => tx.type === 'expense')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((transaction) => ({
      transaction,
      percentage: totalExpense > 0 ? Math.round((transaction.amount / totalExpense) * 1000) / 10 : 0,
    }));

  const frequencyMap = new Map<string, { count: number; total: number }>();
  counted.filter((tx) => tx.type === 'expense').forEach((tx) => {
    const current = frequencyMap.get(tx.category) ?? { count: 0, total: 0 };
    frequencyMap.set(tx.category, { count: current.count + 1, total: current.total + tx.amount });
  });
  const topExpensesByFrequency = Array.from(frequencyMap.entries())
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => b.count - a.count || b.total - a.total)
    .slice(0, 5);

  const memberMap = new Map<string, number>();
  counted.filter((tx) => tx.type === 'expense').forEach((tx) => {
    memberMap.set(tx.spent_by, (memberMap.get(tx.spent_by) ?? 0) + tx.amount);
  });
  const memberBreakdown = Array.from(memberMap.entries())
    .map(([member, total]) => ({
      member,
      total,
      percentage: totalExpense > 0 ? Math.round((total / totalExpense) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const allTransactions = context.allTransactions ?? txs;
  const reportEnd = txs.length > 0
    ? txs.reduce((latest, tx) => Math.max(latest, new Date(tx.transaction_date || tx.created_at).getTime()), 0)
    : 0;
  const walletBreakdown = (context.wallets ?? []).map((wallet) => {
    const laterEffect = allTransactions
      .filter((tx) => new Date(tx.transaction_date || tx.created_at).getTime() > reportEnd)
      .reduce((sum, tx) => {
        if (tx.type === 'income' && tx.wallet_id === wallet.id) return sum + tx.amount;
        if (tx.type === 'expense' && tx.wallet_id === wallet.id) return sum - tx.amount;
        if (tx.type === 'transfer') {
          if ((tx.source_wallet_id ?? tx.wallet_id) === wallet.id) return sum - tx.amount;
          if (tx.destination_wallet_id === wallet.id) return sum + tx.amount;
        }
        return sum;
      }, 0);
    return { wallet, endingBalance: wallet.balance - laterEffect };
  });

  const highlightedThreshold = context.highlightedThreshold ?? 500000;
  const highlightedTransactions = counted
    .filter((tx) => tx.type === 'expense' && tx.amount > highlightedThreshold)
    .sort((a, b) => b.amount - a.amount);

  const budgetBreakdown = (context.budgets ?? []).map((budget) => {
    const spent = expenseByCategory.get(budget.category) ?? 0;
    const percentage = budget.limit_amount > 0 ? Math.round((spent / budget.limit_amount) * 1000) / 10 : 0;
    return {
      category: budget.category,
      limit: budget.limit_amount,
      spent,
      percentage,
      status: percentage > 100 ? 'over' : percentage >= 80 ? 'warning' : 'healthy',
    } as ReportBudgetRow;
  });

  const goalBreakdown = (context.goals ?? []).map((goal) => ({
    goal,
    percentage: goal.target_amount > 0 ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 1000) / 10) : 0,
  }));

  return {
    rows: txs,
    totalIncome,
    totalExpense,
    totalTransfer,
    netCashflow: totalIncome - totalExpense,
    categoryBreakdown,
    topExpensesByAmount,
    topExpensesByFrequency,
    memberBreakdown,
    walletBreakdown,
    highlightedTransactions,
    budgetBreakdown,
    goalBreakdown,
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
