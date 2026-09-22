import { TRANSFER_CATEGORY, type Transaction } from '@/lib/types';

export interface NormalizeLegacyTransfersResult {
  /** Effective list: one `type = 'transfer'` row per internal movement. */
  transactions: Transaction[];
  /** Income legs absorbed into a transfer row (must not be shown anymore). */
  collapsedIds: string[];
  /** Expense legs promoted to `type = 'transfer'`. */
  convertedIds: string[];
}

const dayKey = (tx: Transaction): string =>
  (tx.transaction_date || tx.created_at || '').slice(0, 10);

const byCreatedAt = (a: Transaction, b: Transaction): number =>
  (a.created_at || '').localeCompare(b.created_at || '') || a.id.localeCompare(b.id);

const isLegacyPairCandidate = (tx: Transaction): boolean =>
  tx.type !== 'transfer' &&
  tx.category === TRANSFER_CATEGORY &&
  !tx.source_wallet_id &&
  !tx.destination_wallet_id;

/**
 * Legacy tolerance layer.
 *
 * Before the `type = 'transfer'` migration an internal transfer was persisted
 * as a PAIR of ordinary rows: an `expense` on the source wallet plus an
 * `income` on the destination wallet, both with `category = 'transfer'`.
 * Because both legs were real expense/income rows, any aggregate that did not
 * know about them inflated Total Income and Total Expense.
 *
 * This collapses each detected pair into a single `type = 'transfer'` row so
 * the rest of the app only ever has to test `type !== 'transfer'`.
 *
 * A lone `category = 'transfer'` row with no matching counterpart is left
 * untouched: per spec that is an EXTERNAL transfer (money sent to / received
 * from a third party) and must keep counting towards income/expense.
 */
export function normalizeLegacyTransfers(
  transactions: Transaction[]
): NormalizeLegacyTransfersResult {
  const buckets = new Map<string, { expenses: Transaction[]; incomes: Transaction[] }>();

  for (const tx of transactions) {
    if (!isLegacyPairCandidate(tx)) continue;
    const key = `${dayKey(tx)}|${tx.amount}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { expenses: [], incomes: [] };
      buckets.set(key, bucket);
    }
    if (tx.type === 'expense') bucket.expenses.push(tx);
    else if (tx.type === 'income') bucket.incomes.push(tx);
  }

  const absorbed = new Map<string, Transaction>(); // income leg id -> income leg
  const promoted = new Map<string, Transaction>(); // expense leg id -> income leg

  for (const bucket of buckets.values()) {
    if (bucket.expenses.length === 0 || bucket.incomes.length === 0) continue;
    const expenses = [...bucket.expenses].sort(byCreatedAt);
    const incomes = [...bucket.incomes].sort(byCreatedAt);
    const pairs = Math.min(expenses.length, incomes.length);

    for (let i = 0; i < pairs; i += 1) {
      const expense = expenses[i];
      const income = incomes[i];
      // A transfer must always leave one wallet and enter another.
      if (expense.wallet_id === income.wallet_id) continue;
      absorbed.set(income.id, income);
      promoted.set(expense.id, income);
    }
  }

  if (absorbed.size === 0) {
    return { transactions, collapsedIds: [], convertedIds: [] };
  }

  const result: Transaction[] = [];
  for (const tx of transactions) {
    if (absorbed.has(tx.id)) continue; // drop the duplicate income counter-leg

    const counterpart = promoted.get(tx.id);
    if (!counterpart) {
      result.push(tx);
      continue;
    }

    result.push({
      ...tx,
      type: 'transfer',
      source_wallet_id: tx.wallet_id,
      destination_wallet_id: counterpart.wallet_id,
      destination_wallet_name:
        counterpart.wallet_name ?? counterpart.destination_wallet_name ?? null,
      transfer_group_id: tx.transfer_group_id ?? counterpart.transfer_group_id ?? null,
    });
  }

  return {
    transactions: result,
    collapsedIds: [...absorbed.keys()],
    convertedIds: [...promoted.keys()],
  };
}

/**
 * Locate the leftover income counter-leg of a transfer that was collapsed from
 * a legacy pair. Required so edit/delete can also act on that DB row while the
 * `type = 'transfer'` migration has not been applied yet.
 */
export function findLegacyIncomeLeg(
  transactions: Transaction[],
  transfer: Transaction
): Transaction | undefined {
  if (transfer.type !== 'transfer') return undefined;
  const destinationId = transfer.destination_wallet_id;
  if (!destinationId) return undefined;

  return transactions.find(
    (tx) =>
      tx.type === 'income' &&
      tx.category === TRANSFER_CATEGORY &&
      !tx.source_wallet_id &&
      tx.wallet_id === destinationId &&
      tx.amount === transfer.amount &&
      dayKey(tx) === dayKey(transfer)
  );
}
