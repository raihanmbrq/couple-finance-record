import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { DesktopDialog } from '@/components/desktop/ui/DesktopDialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { formatMoneyInput, parseMoneyInput } from '@/lib/format';
import { getCurrencySymbol } from '@/lib/currencies';
import { walletTypeIcon } from '@/lib/walletIcons';
import { getSaveTimeWalletIcon } from '@/lib/walletIconDetect';
import { ICON_OPTIONS } from '@/components/CreateWalletTypeSheet';
import { ARROW_DIRECTIONS, getNextGridIndex } from '@/lib/gridNav';
import { Wallet as WalletIcon, Plus } from 'lucide-react';
import type { Wallet } from '@/lib/types';

interface DesktopWalletFormModalProps {
  open: boolean;
  /** `null` puts the dialog into Create mode. */
  wallet: Wallet | null;
  onClose: () => void;
}

const TYPE_COLUMNS = 3;
const ADD_TYPE_KEY = '__add_type__';
const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

/**
 * Desktop-native Create/Edit wallet dialog. Wraps the same AppContext mutations
 * as the mobile `AddWalletSheet` / `WalletDetailsSheet` but with a full-width
 * desktop layout, 2D arrow-key type selection, and inline custom-type creation.
 */
export const DesktopWalletFormModal: React.FC<DesktopWalletFormModalProps> = ({ open, wallet, onClose }) => {
  const { walletTypes, addWallet, updateWallet, addCustomWalletType, profile } = useApp();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const currency = profile?.currency ?? 'IDR';

  const isEdit = Boolean(wallet);

  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [balance, setBalance] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [typeFocusIndex, setTypeFocusIndex] = useState(0);

  // Inline custom-type creator
  const [showCreateType, setShowCreateType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeIcon, setNewTypeIcon] = useState('Wallet');
  const [typeError, setTypeError] = useState('');
  const [creatingType, setCreatingType] = useState(false);

  const typeItemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (!open) return;
    setName(wallet?.name ?? '');
    setType(wallet?.type ?? '');
    setBalance(wallet ? String(wallet.balance) : '');
    setError('');
    setShowCreateType(false);
    setNewTypeName('');
    setNewTypeIcon('Wallet');
    setTypeError('');
    const idx = wallet ? walletTypes.findIndex((wt) => wt.id === wallet.type) : 0;
    setTypeFocusIndex(idx >= 0 ? idx : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, wallet]);

  const typeIds = useMemo(
    () => [...walletTypes.map((wt) => wt.id), ADD_TYPE_KEY],
    [walletTypes],
  );

  const highlightedTypeId = typeIds[typeFocusIndex] ?? typeIds[0] ?? '';

  const focusType = (index: number) => {
    const idx = Math.max(0, Math.min(index, typeIds.length - 1));
    setTypeFocusIndex(idx);
    typeItemRefs.current[typeIds[idx]]?.focus();
  };

  const handleTypeGridKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const index = Number((event.target as HTMLElement).dataset.navIndex);
    if (Number.isNaN(index)) return;
    const direction = ARROW_DIRECTIONS[event.key];
    if (direction) {
      event.preventDefault();
      const next = getNextGridIndex(index, typeIds.length, TYPE_COLUMNS, direction);
      focusType(next);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const id = typeIds[index];
      if (id === ADD_TYPE_KEY) setShowCreateType(true);
      else setType(id);
    }
  };

  const handleCreateType = async () => {
    if (!newTypeName.trim()) {
      setTypeError(t('wallet.typeNameRequired'));
      return;
    }
    setTypeError('');
    setCreatingType(true);
    try {
      const created = await addCustomWalletType(newTypeName.trim(), newTypeIcon);
      setType(created.id);
      setShowCreateType(false);
      setNewTypeName('');
      setNewTypeIcon('Wallet');
      showToast(t('wallet.typeAddedToast'));
    } catch (err) {
      setTypeError(err instanceof Error ? err.message : t('wallet.typeFailedAdd'));
    } finally {
      setCreatingType(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError(t('wallet.nameRequired'));
      return;
    }
    if (!type) {
      setError(t('wallet.typeRequired'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (isEdit && wallet) {
        await updateWallet(wallet.id, {
          name: name.trim(),
          type,
          balance: parseMoneyInput(balance),
          icon: getSaveTimeWalletIcon(name.trim(), type),
        });
        showToast(t('wallet.updatedToast'));
      } else {
        await addWallet(name.trim(), type, parseMoneyInput(balance), getSaveTimeWalletIcon(name.trim(), type));
        showToast(t('wallet.addedToast'));
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : isEdit ? t('wallet.failedUpdate') : t('wallet.failedAdd'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DesktopDialog
      open={open}
      onClose={onClose}
      title={isEdit ? t('wallet.detailsTitle') : t('wallet.addNew')}
      description={isEdit ? wallet?.name : t('walletWs.subtitle')}
      icon={WalletIcon}
      maxWidthClass="max-w-xl"
      testId="desktop-wallet-form-modal"
    >
      <div className="space-y-5">
        <Input
          label={t('wallet.nameLabel')}
          placeholder={t('wallet.namePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          data-testid="wallet-form-name"
        />

        {/* Wallet type grid — 2D arrow navigation, 3 columns */}
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-muted">
            {t('wallet.walletType')}
          </label>
          <div
            role="group"
            aria-label={t('wallet.walletType')}
            className="grid grid-cols-3 gap-2"
            onKeyDown={handleTypeGridKeyDown}
          >
            {walletTypes.map((wt, index) => {
              const Icon = walletTypeIcon(wt.icon);
              const isActive = type === wt.id;
              const isHighlighted = highlightedTypeId === wt.id;
              return (
                <button
                  key={wt.id}
                  type="button"
                  ref={(el) => { typeItemRefs.current[wt.id] = el; }}
                  data-nav-index={index}
                  data-testid={`wallet-form-type-${wt.id}`}
                  aria-pressed={isActive}
                  tabIndex={isHighlighted ? 0 : -1}
                  onClick={() => { setType(wt.id); setTypeFocusIndex(index); }}
                  className={`flex items-center gap-2 rounded-xl border-2 p-2.5 text-left transition-all ${FOCUS_RING} ${
                    isActive ? 'border-accent bg-accent/10' : 'border-border bg-surface-hover/60 hover:border-accent/50'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-accent' : 'text-text-muted'}`} />
                  <span className={`truncate text-xs font-semibold ${isActive ? 'text-accent' : 'text-text-primary'}`}>
                    {wt.name}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              ref={(el) => { typeItemRefs.current[ADD_TYPE_KEY] = el; }}
              data-nav-index={walletTypes.length}
              data-testid="wallet-form-add-type"
              tabIndex={highlightedTypeId === ADD_TYPE_KEY ? 0 : -1}
              onClick={() => setShowCreateType((v) => !v)}
              className={`flex items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border p-2.5 text-xs font-semibold text-text-muted transition-all hover:border-accent hover:text-accent ${FOCUS_RING}`}
            >
              <Plus className="h-3.5 w-3.5" />
              {t('wallet.typeWallet')}
            </button>
          </div>
        </div>

        {/* Inline custom wallet type creator */}
        {showCreateType && (
          <div className="space-y-3 rounded-xl border border-border bg-surface-hover/50 p-4" data-testid="wallet-form-create-type-panel">
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
              {t('wallet.addTypeCustomTitle')}
            </p>
            <Input
              label={t('wallet.typeNameLabel')}
              placeholder={t('wallet.typeNamePlaceholder')}
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
            />
            <div>
              <label className="mb-2 block text-xs font-medium text-text-muted">{t('cat.iconLabel')}</label>
              <div className="grid grid-cols-6 gap-2">
                {ICON_OPTIONS.map(({ name: iconName, icon: Icon }) => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setNewTypeIcon(iconName)}
                    aria-pressed={newTypeIcon === iconName}
                    className={`flex items-center justify-center rounded-lg border-2 p-2 transition-all ${FOCUS_RING} ${
                      newTypeIcon === iconName ? 'border-accent bg-accent/10' : 'border-border bg-surface'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${newTypeIcon === iconName ? 'text-accent' : 'text-text-muted'}`} />
                  </button>
                ))}
              </div>
            </div>
            {typeError && <p className="text-xs text-expense">{typeError}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowCreateType(false)}>
                {t('common.cancel')}
              </Button>
              <Button size="sm" onClick={handleCreateType} disabled={creatingType}>
                {creatingType ? t('wallet.saving') : t('wallet.saveType')}
              </Button>
            </div>
          </div>
        )}

        <Input
          label={isEdit ? t('wallet.balance') : t('wallet.initialBalance')}
          prefix={getCurrencySymbol(currency)}
          placeholder="0"
          inputMode="numeric"
          value={balance ? formatMoneyInput(parseMoneyInput(balance), currency) : ''}
          onChange={(e) => setBalance(e.target.value)}
          data-testid="wallet-form-balance"
        />

        {error && <p className="text-sm text-expense" role="alert">{error}</p>}

        <div className="flex items-center gap-3 pt-1">
          <Button variant="secondary" fullWidth onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button fullWidth onClick={handleSubmit} disabled={loading} data-testid="wallet-form-submit">
            {loading
              ? (isEdit ? t('wallet.saving') : t('wallet.adding'))
              : (isEdit ? t('wallet.saveChanges') : t('wallet.addNew'))}
          </Button>
        </div>
      </div>
    </DesktopDialog>
  );
};
