import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatMoneyInput, parseMoneyInput } from '@/lib/format';
import { getCurrencySymbol } from '@/lib/currencies';
import { walletTypeIcon } from '@/lib/walletIcons';
import { type Wallet } from '@/lib/types';
import { Plus } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { CreateWalletTypeSheet } from '@/components/CreateWalletTypeSheet';

interface WalletActionSheetProps {
  wallet: Wallet | null;
  open: boolean;
  onClose: () => void;
}

export function WalletActionSheet({ wallet, open, onClose }: WalletActionSheetProps) {
  const { walletTypes, updateWallet, deleteWallet, profile } = useApp();
  const { t } = useLanguage();
  const currency = profile?.currency ?? 'IDR';
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [balance, setBalance] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateType, setShowCreateType] = useState(false);

  useEffect(() => {
    if (wallet) {
      setName(wallet.name);
      setType(wallet.type);
      setBalance(String(wallet.balance));
      setConfirmDelete(false);
      setError('');
    }
  }, [wallet, open]);

  const canDelete = useMemo(() => {
    return wallet && wallet.name.length > 0;
  }, [wallet]);

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
      onClose();
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
             {walletTypes.map((t) => {
               const Icon = walletTypeIcon(t.icon);
               return (
                 <button
                   key={t.id}
                   onClick={() => setType(t.id)}
                   className={`flex items-center gap-2.5 p-3 rounded-xl transition-all border-2 ${
                     type === t.id ? 'border-primary bg-primary/10' : 'border-secondary bg-secondary'
                   }`}
                 >
                   <Icon className={`w-5 h-5 ${type === t.id ? 'text-primary' : 'text-text-secondary'}`} />
                   <span className={`text-sm font-semibold ${type === t.id ? 'text-primary' : 'text-text-primary'}`}>{t.name}</span>
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
          <Button fullWidth variant="secondary" onClick={handleSave} disabled={loading}>
            {loading ? t('wallet.saving') : t('wallet.saveChanges')}
          </Button>
        </div>

        <Button fullWidth variant="danger" onClick={handleDelete} disabled={loading || !canDelete}>
          {confirmDelete ? t('wallet.confirmDelete') : t('wallet.deleteWallet')}
        </Button>
      </div>

      <CreateWalletTypeSheet
        open={showCreateType}
        onClose={() => setShowCreateType(false)}
        onCreated={(id) => setType(id)}
      />
    </Sheet>
  );
}