import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { WalletCard } from '@/components/desktop/wallet/WalletCard';
import { ARROW_DIRECTIONS, getNextGridIndex } from '@/lib/gridNav';
import type { Wallet, WalletTypeRow } from '@/lib/types';

interface WalletGridProps {
  wallets: Wallet[];
  walletTypes: WalletTypeRow[];
  currency: string;
  hideBalance: boolean;
  hiddenMap: Record<string, boolean>;
  selectedId: string | null;
  /** Resolves the owner label for circle (spouse) wallets. */
  ownerLabelFor?: (wallet: Wallet) => string | undefined;
  selectedLabel: string;
  addLabel: string;
  onSelect: (wallet: Wallet) => void;
  onEdit: (wallet: Wallet) => void;
  onTransfer: (wallet: Wallet) => void;
  onAdd: () => void;
}

const COLUMNS = 3;
const ADD_KEY = '__add_wallet__';
const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

/**
 * Responsive wallet tile grid with roving-tabindex 2D arrow-key navigation.
 * Keyboard: Arrow keys move between tiles, Enter/Space selects, and the trailing
 * "Add New" tile joins the same navigation matrix.
 */
export const WalletGrid: React.FC<WalletGridProps> = ({
  wallets,
  walletTypes,
  currency,
  hideBalance,
  hiddenMap,
  selectedId,
  ownerLabelFor,
  selectedLabel,
  addLabel,
  onSelect,
  onEdit,
  onTransfer,
  onAdd,
}) => {
  const [focusIndex, setFocusIndex] = useState(0);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const ids = useMemo(() => [...wallets.map((w) => w.id), ADD_KEY], [wallets]);
  const highlightedId = ids[focusIndex] ?? ids[0] ?? '';

  const focusItem = useCallback(
    (index: number) => {
      const idx = Math.max(0, Math.min(index, ids.length - 1));
      setFocusIndex(idx);
      itemRefs.current[ids[idx]]?.focus();
    },
    [ids],
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const index = Number((event.target as HTMLElement).dataset.navIndex);
    if (Number.isNaN(index)) return;

    const direction = ARROW_DIRECTIONS[event.key];
    if (direction) {
      event.preventDefault();
      focusItem(getNextGridIndex(index, ids.length, COLUMNS, direction));
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const id = ids[index];
      if (id === ADD_KEY) onAdd();
      else {
        const wallet = wallets.find((w) => w.id === id);
        if (wallet) onSelect(wallet);
      }
    }
  };

  return (
    <div
      role="group"
      className="grid grid-cols-3 gap-3"
      onKeyDown={handleKeyDown}
    >
      {wallets.map((wallet, index) => (
        <WalletCard
          key={wallet.id}
          wallet={wallet}
          typeRow={walletTypes.find((wt) => wt.id === wallet.type)}
          currency={currency}
          selected={selectedId === wallet.id}
          hiddenFromCircle={hiddenMap[wallet.id] === true}
          hideBalance={hideBalance}
          ownerLabel={ownerLabelFor?.(wallet)}
          isCircle={Boolean(ownerLabelFor)}
          selectedLabel={selectedLabel}
          navIndex={index}
          tabIndex={highlightedId === wallet.id ? 0 : -1}
          cardRef={(el) => { itemRefs.current[wallet.id] = el; }}
          onSelect={() => { setFocusIndex(index); onSelect(wallet); }}
          onEdit={() => onEdit(wallet)}
          onTransfer={() => onTransfer(wallet)}
        />
      ))}

      {/* Trailing "Add New" tile */}
      <button
        type="button"
        ref={(el) => { itemRefs.current[ADD_KEY] = el; }}
        data-nav-index={wallets.length}
        data-testid="wallet-grid-add-card"
        tabIndex={highlightedId === ADD_KEY ? 0 : -1}
        onClick={onAdd}
        className={`flex min-h-[132px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-accent/40 p-4 text-accent transition-all hover:border-accent hover:bg-accent/5 ${FOCUS_RING}`}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
          <Plus className="h-5 w-5 text-accent" />
        </div>
        <span className="text-xs font-semibold">{addLabel}</span>
      </button>
    </div>
  );
};
