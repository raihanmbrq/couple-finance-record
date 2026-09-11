import React from 'react';
import { Pencil, ArrowRightLeft, EyeOff } from 'lucide-react';
import { formatMoney } from '@/lib/format';
import { walletTypeIcon } from '@/lib/walletIcons';
import { WALLET_BRAND_MAP } from '@/lib/walletBrands';
import { WalletBrandIcon } from '@/components/ui/WalletBrandIcon';
import type { Wallet, WalletTypeRow } from '@/lib/types';

export interface WalletCardProps {
  wallet: Wallet;
  typeRow?: WalletTypeRow;
  currency: string;
  selected: boolean;
  /** Circle-visibility preference: when true the wallet is hidden from the circle. */
  hiddenFromCircle: boolean;
  /** Global privacy toggle — masks the numeric balance. */
  hideBalance: boolean;
  /** Owner display name shown for circle (spouse) wallets. */
  ownerLabel?: string;
  isCircle?: boolean;
  /** Localized label for the `● Selected` badge. */
  selectedLabel?: string;
  navIndex: number;
  tabIndex: number;
  cardRef?: (el: HTMLButtonElement | null) => void;
  onSelect: () => void;
  onEdit: () => void;
  onTransfer: () => void;
}

/**
 * A single wallet tile in the desktop Left Panel grid.
 * Supports a `● Selected` ring, hover quick actions, and roving-tabindex
 * keyboard navigation (the `data-nav-index` + `tabIndex` props).
 */
export const WalletCard: React.FC<WalletCardProps> = ({
  wallet,
  typeRow,
  currency,
  selected,
  hiddenFromCircle,
  hideBalance,
  ownerLabel,
  isCircle = false,
  selectedLabel,
  navIndex,
  tabIndex,
  cardRef,
  onSelect,
  onEdit,
  onTransfer,
}) => {
  const TypeIcon = walletTypeIcon(typeRow?.icon);
  const brandIcon = wallet.icon && WALLET_BRAND_MAP[wallet.icon] ? wallet.icon : null;

  const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

  return (
    <div
      className={`group relative rounded-2xl border-2 bg-surface p-4 text-left transition-all ${
        selected
          ? 'border-accent shadow-card'
          : 'border-border hover:border-accent/60 hover:shadow-xs'
      }`}
      data-testid={`wallet-card-${wallet.id}`}
    >
      {/* Full-card select target (keeps hover actions clickable above it) */}
      <button
        type="button"
        ref={cardRef}
        data-nav-index={navIndex}
        tabIndex={tabIndex}
        aria-pressed={selected}
        aria-label={wallet.name}
        onClick={onSelect}
        className={`absolute inset-0 z-0 rounded-2xl ${focusRing}`}
      />

      <div className="relative z-10 pointer-events-none flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
            {brandIcon ? (
              <WalletBrandIcon brand={brandIcon} className="h-6 w-6 object-contain" />
            ) : (
              <TypeIcon className="h-5 w-5 text-accent" />
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            {selected && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-text">
                ● {selectedLabel ?? 'Selected'}
              </span>
            )}
            {hiddenFromCircle && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300"
                title="Hidden from circle"
              >
                <EyeOff className="h-3 w-3" />
              </span>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">{wallet.name}</p>
          <p className="mt-0.5 truncate text-[11px] font-medium text-text-muted">
            {typeRow?.name ?? wallet.type}
          </p>
          <p className="mt-1 truncate text-sm font-bold tabular-nums text-text-primary">
            {hideBalance ? '••••••••' : formatMoney(wallet.balance, currency)}
          </p>
          {isCircle && ownerLabel && (
            <p className="mt-1 truncate text-[11px] text-text-muted">👥 {ownerLabel}</p>
          )}
        </div>
      </div>

      {/* Hover quick actions */}
      <div className="absolute right-3 bottom-3 z-20 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          onClick={onEdit}
          data-testid={`wallet-card-edit-${wallet.id}`}
          title="Edit"
          className={`flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-surface text-text-muted hover:border-accent hover:text-accent ${focusRing}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onTransfer}
          data-testid={`wallet-card-transfer-${wallet.id}`}
          title="Transfer"
          className={`flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-surface text-text-muted hover:border-accent hover:text-accent ${focusRing}`}
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
