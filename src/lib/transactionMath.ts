import type { Transaction } from '@/lib/types';

/**
 * Single source of truth for how a transaction moves wallet balances.
 *
 * - `income`   -> +amount on its own wallet
 * - `expense`  -> -amount on its own wallet
 * - `transfer` -> -amount on `source_wallet_id` AND +amount on
 *                 `destination_wallet_id`, so the household's total net worth
 *                 is left unchanged.
 *
 * Every mutation in `AppContext` goes through these helpers so a transfer can
 * never be applied to just one side of the movement.
 */
export interface WalletEffect {
  walletId: string;
  delta: number;
}

/**
 * Rows that are allowed to contribute to Income / Expense aggregates.
 * Internal transfers are structurally excluded here, which is what fixes the
 * double counting (source leg looked like an expense, destination leg looked
 * like an income).
 */
export function countedCashflow(transactions: Transaction[]): Transaction[] {
  return transactions.filter((tx) => tx.type !== 'transfer');
}

/** Balance deltas produced by a single transaction. */
export function walletEffects(tx: Transaction): WalletEffect[] {
  if (tx.type === 'transfer') {
    const sourceId = tx.source_wallet_id ?? tx.wallet_id;
    const destId = tx.destination_wallet_id ?? null;
    const effects: WalletEffect[] = [];
    if (sourceId) effects.push({ walletId: sourceId, delta: -tx.amount });
    if (destId && destId !== sourceId) effects.push({ walletId: destId, delta: tx.amount });
    return effects;
  }

  if (!tx.wallet_id) return [];
  return [{ walletId: tx.wallet_id, delta: tx.type === 'income' ? tx.amount : -tx.amount }];
}

/** Reversal of `walletEffects` — used before re-applying an edited transaction. */
export function invertEffects(effects: WalletEffect[]): WalletEffect[] {
  return effects.map((effect) => ({ walletId: effect.walletId, delta: -effect.delta }));
}

/** Fold effects into an accumulator map (walletId -> delta). */
export function accumulateEffects(target: Map<string, number>, effects: WalletEffect[]): void {
  for (const effect of effects) {
    if (!effect.walletId || effect.delta === 0) continue;
    target.set(effect.walletId, (target.get(effect.walletId) ?? 0) + effect.delta);
  }
}

/** True when the transaction belongs in the given wallet's history list. */
export function affectsWallet(tx: Transaction, walletId: string): boolean {
  if (!walletId) return false;
  if (tx.wallet_id === walletId) return true;
  return tx.type === 'transfer' && tx.destination_wallet_id === walletId;
}

/**
 * Signed amount to display when the transaction is listed inside `walletId`.
 * An internal transfer is shown as an outflow on its source wallet and as an
 * inflow on its destination wallet.
 */
export function walletSignedAmount(tx: Transaction, walletId: string): number {
  if (tx.type === 'transfer') {
    const sourceId = tx.source_wallet_id ?? tx.wallet_id;
    const isInflow = tx.destination_wallet_id === walletId && sourceId !== walletId;
    return isInflow ? tx.amount : -tx.amount;
  }
  return tx.type === 'income' ? tx.amount : -tx.amount;
}
