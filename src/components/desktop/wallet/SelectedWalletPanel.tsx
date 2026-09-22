import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { formatMoney, formatDateShort } from '@/lib/format';
import { getCategory, type Wallet, type HouseholdMember } from '@/lib/types';
import { affectsWallet, walletSignedAmount } from '@/lib/transactionMath';
import { walletTypeIcon } from '@/lib/walletIcons';
import { WALLET_BRAND_MAP } from '@/lib/walletBrands';
import { WalletBrandIcon } from '@/components/ui/WalletBrandIcon';
import { TransferBadge } from '@/components/ui/TransferBadge';
import {
  Pencil,
  ArrowRightLeft,
  ArrowDownToLine,
  Trash2,
  Eye,
  EyeOff,
  ArrowRight,
  Wallet as WalletIcon,
  AlertTriangle,
} from 'lucide-react';

interface SelectedWalletPanelProps {
  wallet: Wallet | null;
  currency: string;
  hideBalance: boolean;
  hiddenFromCircle: boolean;
  onToggleVisibility: () => void;
  onEdit: () => void;
  onTransfer: () => void;
  onTopUp: () => void;
  onViewAllTransactions: () => void;
}

const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

/**
 * Right-hand "Selected Wallet Workspace" panel: overview, quick actions,
 * wallet-filtered recent transactions, and stats/visibility settings.
 */
export const SelectedWalletPanel: React.FC<SelectedWalletPanelProps> = ({
  wallet,
  currency,
  hideBalance,
  hiddenFromCircle,
  onToggleVisibility,
  onEdit,
  onTransfer,
  onTopUp,
  onViewAllTransactions,
}) => {
  const { transactions, walletTypes, householdMembers, profile, categories, deleteWallet } = useApp();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Reset the destructive-action state whenever a different wallet is shown.
  useEffect(() => {
    setConfirmDelete(false);
    setDeleteError('');
  }, [wallet?.id]);

  const memberName = (m: HouseholdMember) =>
    m.profile?.full_name || m.profile?.email?.split('@')[0] || 'Member';

  const typeRow = useMemo(
    () => (wallet ? walletTypes.find((wt) => wt.id === wallet.type) ?? null : null),
    [wallet, walletTypes],
  );

  const walletTxs = useMemo(() => {
    if (!wallet) return [];
    return [...transactions]
      // A transfer belongs to both sides: the source wallet (outflow) and the
      // destination wallet (inflow).
      .filter((tx) => affectsWallet(tx, wallet.id))
      .sort(
        (a, b) =>
          new Date(b.transaction_date ?? b.created_at).getTime() -
          new Date(a.transaction_date ?? a.created_at).getTime(),
      );
  }, [transactions, wallet]);

  const recentTxs = walletTxs.slice(0, 5);

  const linkedTxCount = walletTxs.length;

  const monthOutflow = useMemo(() => {
    const now = new Date();
    // Internal transfers are excluded from spend figures (they are only a
    // movement between the household's own wallets).
    return walletTxs
      .filter((tx) => tx.type === 'expense')
      .filter((tx) => {
        const d = new Date(tx.transaction_date ?? tx.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [walletTxs]);

  const ownerLabel = useMemo(() => {
    if (!wallet) return '';
    if (wallet.user_id === profile?.id) return t('common.me');
    const member = householdMembers.find((m) => m.user_id === wallet.user_id);
    return member ? memberName(member) : t('common.unknownUser');
  }, [wallet, profile, householdMembers]); // eslint-disable-line react-hooks/exhaustive-deps

  const isCircle = Boolean(wallet && wallet.user_id && wallet.user_id !== profile?.id);

  const categoryLabel = (key: string) =>
    categories.find((c) => c.id === key)?.name || getCategory(key)?.label || key;

  const handleDelete = async () => {
    if (!wallet) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteWallet(wallet.id);
      showToast(t('wallet.deletedToast'));
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : t('wallet.failedDelete'));
    } finally {
      setDeleting(false);
    }
  };

  if (!wallet) {
    return (
      <div
        data-testid="selected-wallet-panel"
        className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-surface p-8 text-center"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-hover text-text-muted">
          <WalletIcon className="h-6 w-6" />
        </div>
        <p className="text-sm text-text-muted">{t('walletWs.selectPrompt')}</p>
      </div>
    );
  }

  const TypeIcon = walletTypeIcon(typeRow?.icon);
  const brandIcon = wallet.icon && WALLET_BRAND_MAP[wallet.icon] ? wallet.icon : null;

  return (
    <div data-testid="selected-wallet-panel" className="space-y-4">
      {/* Wallet overview */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/10">
              {brandIcon ? (
                <WalletBrandIcon brand={brandIcon} className="h-7 w-7 object-contain" />
              ) : (
                <TypeIcon className="h-6 w-6 text-accent" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-text-primary">{wallet.name}</p>
              <p className="truncate text-xs font-medium text-text-muted">{typeRow?.name ?? wallet.type}</p>
            </div>
          </div>
          {isCircle && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-semibold text-accent">
              👥 {ownerLabel}
            </span>
          )}
        </div>
        <p className="mt-4 text-2xl font-extrabold tabular-nums text-text-primary">
          {hideBalance ? '••••••••' : formatMoney(wallet.balance, currency)}
        </p>
        {isCircle && (
          <p className="mt-1 text-xs text-text-muted">{t('walletWs.owner', { name: ownerLabel })}</p>
        )}
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted">
          {t('walletWs.quickActions')}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onEdit}
            data-testid="wallet-quick-edit"
            className={`flex items-center gap-2 rounded-xl border border-border bg-surface-hover/60 px-3 py-2.5 text-xs font-semibold text-text-primary transition-all hover:border-accent hover:text-accent ${FOCUS_RING}`}
          >
            <Pencil className="h-4 w-4 shrink-0" />
            <span className="truncate">{t('wallet.editWallet')}</span>
          </button>
          <button
            type="button"
            onClick={onTransfer}
            data-testid="wallet-quick-transfer"
            className={`flex items-center gap-2 rounded-xl border border-border bg-surface-hover/60 px-3 py-2.5 text-xs font-semibold text-text-primary transition-all hover:border-accent hover:text-accent ${FOCUS_RING}`}
          >
            <ArrowRightLeft className="h-4 w-4 shrink-0" />
            <span className="truncate">{t('walletWs.transferBalance')}</span>
          </button>
          <button
            type="button"
            onClick={onTopUp}
            data-testid="wallet-quick-topup"
            className={`flex items-center gap-2 rounded-xl border border-border bg-surface-hover/60 px-3 py-2.5 text-xs font-semibold text-text-primary transition-all hover:border-accent hover:text-accent ${FOCUS_RING}`}
          >
            <ArrowDownToLine className="h-4 w-4 shrink-0" />
            <span className="truncate">{t('wallet.topUp')}</span>
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            data-testid="wallet-quick-delete"
            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all disabled:opacity-50 ${FOCUS_RING} ${
              confirmDelete
                ? 'border-expense/40 bg-expense/10 text-expense hover:bg-expense/20'
                : 'border-border bg-surface-hover/60 text-expense hover:border-expense/40 hover:bg-expense/10'
            }`}
          >
            <Trash2 className="h-4 w-4 shrink-0" />
            <span className="truncate">{confirmDelete ? t('wallet.confirmDelete') : t('wallet.deleteWallet')}</span>
          </button>
        </div>

        {confirmDelete && linkedTxCount > 0 && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <p className="text-[11px] font-medium leading-relaxed text-text-muted">
              {t('wallet.deleteHasTxWarning', { count: linkedTxCount })}
            </p>
          </div>
        )}
        {deleteError && <p className="mt-2 text-xs text-expense">{deleteError}</p>}
      </div>

      {/* Recent transactions */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted">
          {t('walletWs.recentTransactions')}
        </p>
        {recentTxs.length === 0 ? (
          <p className="py-6 text-center text-xs text-text-muted">{t('walletWs.noTx')}</p>
        ) : (
          <div className="space-y-1">
            <div className="grid grid-cols-[auto_1fr_auto] gap-2 border-b border-border pb-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              <span>{t('tx.date')}</span>
              <span>{t('common.category')}</span>
              <span className="text-right">{t('common.amount')}</span>
            </div>
            {recentTxs.map((tx) => {
              const signed = walletSignedAmount(tx, wallet?.id ?? '');
              return (
                <div
                  key={tx.id}
                  data-testid={`wallet-tx-${tx.id}`}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-2 py-2"
                >
                  <span className="whitespace-nowrap text-[11px] text-text-muted">
                    {formatDateShort(tx.transaction_date ?? tx.created_at)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium text-text-primary">
                      {tx.notes || categoryLabel(tx.category)}
                    </span>
                    {/* Internal transfer: shown from this wallet's perspective. */}
                    {tx.type === 'transfer' && (
                      <TransferBadge transaction={tx} walletId={wallet?.id} className="mt-0.5" />
                    )}
                    <span className="block truncate text-[10px] text-text-muted">{tx.spent_by}</span>
                  </span>
                  <span
                    className={`whitespace-nowrap text-right text-xs font-bold tabular-nums ${
                      signed >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-text-primary'
                    }`}
                  >
                    {hideBalance ? '••••' : `${signed >= 0 ? '+' : '-'}${formatMoney(tx.amount, currency)}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        <button
          type="button"
          onClick={onViewAllTransactions}
          data-testid="wallet-view-all-tx"
          className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border py-2 text-xs font-semibold text-accent transition-all hover:bg-accent/10 ${FOCUS_RING}`}
        >
          {t('walletWs.viewAllTx')}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Stats & visibility */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted">
          {t('walletWs.statsVisibility')}
        </p>
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-xs font-medium text-text-primary">
            {hiddenFromCircle ? <EyeOff className="h-4 w-4 text-amber-600" /> : <Eye className="h-4 w-4 text-accent" />}
            {t('walletWs.visibleToCircle')}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={!hiddenFromCircle}
            onClick={onToggleVisibility}
            data-testid="wallet-visibility-toggle"
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${FOCUS_RING} ${
              hiddenFromCircle ? 'bg-secondary' : 'bg-accent'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
                hiddenFromCircle ? 'left-0.5' : 'left-[22px]'
              }`}
            />
          </button>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
          <span className="text-xs text-text-muted">{t('walletWs.totalOutflow')}</span>
          <span className="text-sm font-bold tabular-nums text-text-primary">
            {hideBalance ? '••••••••' : formatMoney(monthOutflow, currency)}
          </span>
        </div>
      </div>
    </div>
  );
};
