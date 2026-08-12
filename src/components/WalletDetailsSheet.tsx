import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatMoney, formatMoneyInput, parseMoneyInput } from '@/lib/format';
import { getCurrencySymbol } from '@/lib/currencies';
import { walletTypeIcon } from '@/lib/walletIcons';
import { type Wallet } from '@/lib/types';
import { Plus, Pencil, ArrowRightLeft, ArrowDownToLine, Trash2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { CreateWalletTypeSheet } from '@/components/CreateWalletTypeSheet';
import { WalletTransferSheet } from '@/components/WalletTransferSheet';

interface WalletDetailsSheetProps {
  wallet: Wallet | null;
  open: boolean;
  onClose: () => void;
}

type View = 'details' | 'edit';

export function WalletDetailsSheet({ wallet: walletProp, open, onClose }: WalletDetailsSheetProps) {
  const { walletTypes, updateWallet, deleteWallet, profile, wallets } = useApp();
  const { t } = useLanguage();
  const currency = profile?.currency ?? 'IDR';
  const { showToast } = useToast();

  // Always read the latest wallet from context so balance updates after transfer are reflected
  const wallet = useMemo(
    () => (walletProp ? wallets.find((w) => w.id === walletProp.id) ?? walletProp : null),
    [walletProp, wallets],
  );

  const [view, setView] = useState<View>('details');
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [balance, setBalance] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateType, setShowCreateType] = useState(false);

  // Transfer state
  const [transferMode, setTransferMode] = useState<'transfer' | 'topup' | null>(null);

  useEffect(() => {
    if (walletProp && open) {
      setName(walletProp.name);
      setType(walletProp.type);
      setBalance(String(walletProp.balance));
      setConfirmDelete(false);
      setError('');
      setView('details');
      setTransferMode(null);
    }
  }, [walletProp, open]);

  const canDelete = useMemo(() => {
    return wallet && wallet.name.length > 0;
  }, [wallet]);

  const typeRow = useMemo(() => {
    if (!wallet) return null;
    return walletTypes.find((wt) => wt.id === wallet.type) ?? null;
  }, [wallet, walletTypes]);

  const WalletIcon = typeRow ? walletTypeIcon(typeRow.icon) : null;

  const handleSave = async () => {
    if (!wallet) return;
    if (!name.trim()) {
      setError(t('wallet.nameRequired'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      await updateWallet(wallet.id, {
        name: name.trim(),
        type,
        balance: parseMoneyInput(balance),
      });
      setView('details');
      showToast(t('wallet.updatedToast'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('wallet.failedUpdate'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!wallet) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await deleteWallet(wallet.id);
      onClose();
      showToast(t('wallet.deletedToast'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('wallet.failedDelete'));
    } finally {
      setLoading(false);
    }
  };

  if (!wallet) return null;

  return (
    <Sheet open={open} onClose={onClose} title={t('wallet.detailsTitle')}>
      {view === 'details' ? (
        <div className="space-y-5">
          {/* Wallet Info Header */}
          <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-2xl">
            {WalletIcon && (
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <WalletIcon className="w-7 h-7 text-primary" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-display font-bold text-lg text-text-primary truncate">{wallet.name}</p>
              <p className="text-sm text-text-secondary font-medium mb-1">{typeRow?.name ?? wallet.type}</p>
              <p className="font-display font-bold text-xl text-primary">{formatMoney(wallet.balance, currency)}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setView('edit')}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-secondary hover:bg-primary/10 hover:border-primary border-2 border-transparent transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Pencil className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs font-semibold text-text-primary text-center leading-tight">{t('wallet.editWallet')}</span>
            </button>

            <button
              type="button"
              onClick={() => setTransferMode('transfer')}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-secondary hover:bg-primary/10 hover:border-primary border-2 border-transparent transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ArrowRightLeft className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs font-semibold text-text-primary text-center leading-tight">{t('wallet.transfer')}</span>
            </button>

            <button
              type="button"
              onClick={() => setTransferMode('topup')}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-secondary hover:bg-primary/10 hover:border-primary border-2 border-transparent transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-income/10 flex items-center justify-center">
                <ArrowDownToLine className="w-5 h-5 text-income" />
              </div>
              <span className="text-xs font-semibold text-text-primary text-center leading-tight">{t('wallet.topUp')}</span>
            </button>
          </div>

          {/* Delete Button */}
          <Button fullWidth variant="danger" onClick={handleDelete} disabled={loading || !canDelete}>
            {confirmDelete ? t('wallet.confirmDelete') : t('wallet.deleteWallet')}
          </Button>

          {error && <p className="text-sm text-expense text-center">{error}</p>}
        </div>
      ) : (
        /* Edit Form View */
        <div className="space-y-5">
          <Input
            label={t('wallet.nameLabel')}
            placeholder={t('wallet.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">{t('wallet.walletType')}</label>
            <div className="grid grid-cols-2 gap-2">
              {walletTypes.map((wt) => {
                const Icon = walletTypeIcon(wt.icon);
                return (
                  <button
                    key={wt.id}
                    onClick={() => setType(wt.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl transition-all border-2 ${
                      type === wt.id ? 'border-primary bg-primary/10' : 'border-secondary bg-secondary'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${type === wt.id ? 'text-primary' : 'text-text-secondary'}`} />
                    <span className={`text-sm font-semibold ${type === wt.id ? 'text-primary' : 'text-text-primary'}`}>{wt.name}</span>
                  </button>
                );
              })}
              <button
                onClick={() => setShowCreateType(true)}
                className="flex items-center justify-center gap-1.5 p-3 rounded-xl border-2 border-dashed border-secondary text-text-secondary hover:border-primary hover:text-primary transition-all"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-semibold">{t('wallet.typeWallet')}</span>
              </button>
            </div>
          </div>

          <Input
            label={t('wallet.balance')}
            prefix={getCurrencySymbol(currency)}
            placeholder="0"
            inputMode="numeric"
            value={balance ? formatMoneyInput(parseMoneyInput(balance), currency) : ''}
            onChange={(e) => setBalance(e.target.value)}
          />

          {error && <p className="text-sm text-expense">{error}</p>}

          <div className="flex gap-2">
            <Button fullWidth variant="secondary" onClick={() => setView('details')} disabled={loading}>
              {t('common.cancel')}
            </Button>
            <Button fullWidth onClick={handleSave} disabled={loading}>
              {loading ? t('wallet.saving') : t('wallet.saveChanges')}
            </Button>
          </div>
        </div>
      )}

      <CreateWalletTypeSheet
        open={showCreateType}
        onClose={() => setShowCreateType(false)}
        onCreated={(id) => setType(id)}
      />

      <WalletTransferSheet
        open={transferMode !== null}
        onClose={() => setTransferMode(null)}
        sourceWalletId={transferMode === 'transfer' ? wallet.id : undefined}
        destWalletId={transferMode === 'topup' ? wallet.id : undefined}
      />
    </Sheet>
  );
}
