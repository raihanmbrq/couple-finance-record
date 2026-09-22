import { ArrowDownToLine, ArrowRightLeft } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import type { Transaction } from '@/lib/types';

interface TransferBadgeProps {
  transaction: Transaction;
  /**
   * Optional wallet context. When the transaction is an internal transfer and
   * this wallet is the destination, the badge reads "Top Up Received" instead
   * of "Internal Transfer".
   */
  walletId?: string;
  className?: string;
}

/**
 * Visual indicator that separates an internal wallet transfer / top up from a
 * regular expense or income entry in transaction lists. Internal transfers stay
 * visible in the cashflow history but are never part of income/expense totals.
 */
export function TransferBadge({ transaction, walletId, className = '' }: TransferBadgeProps) {
  const { t } = useLanguage();
  if (transaction.type !== 'transfer') return null;

  const sourceId = transaction.source_wallet_id ?? transaction.wallet_id;
  const isIncoming = Boolean(walletId) && transaction.destination_wallet_id === walletId && sourceId !== walletId;
  const Icon = isIncoming ? ArrowDownToLine : ArrowRightLeft;

  return (
    <span
      data-testid={`transfer-badge-${transaction.id}`}
      className={`inline-flex w-fit items-center gap-1 rounded-full border border-accent/25 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent ${className}`}
    >
      <Icon className="h-3 w-3" />
      {isIncoming ? t('tx.topUpReceived') : t('tx.internalTransfer')}
    </span>
  );
}

/** "BCA → GoPay" style route label for an internal transfer. */
export function transferRouteLabel(tx: Transaction, walletName: (id: string) => string | null): string {
  const sourceId = tx.source_wallet_id ?? tx.wallet_id;
  const source = walletName(sourceId) ?? tx.wallet_name ?? '—';
  const destination = walletName(tx.destination_wallet_id ?? '') ?? tx.destination_wallet_name ?? '—';
  return `${source} → ${destination}`;
}
