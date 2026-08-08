import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/context/ToastContext';
import {
  Banknote, Wallet, CreditCard, PiggyBank, Coins, Briefcase,
  ShoppingBag, Landmark, Sparkles, Receipt, ShieldCheck, Vault,
} from 'lucide-react';

interface CreateWalletTypeSheetProps {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}

export const ICON_OPTIONS = [
  { name: 'Banknote', icon: Banknote },
  { name: 'Wallet', icon: Wallet },
  { name: 'CreditCard', icon: CreditCard },
  { name: 'PiggyBank', icon: PiggyBank },
  { name: 'Coins', icon: Coins },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'ShoppingBag', icon: ShoppingBag },
  { name: 'Landmark', icon: Landmark },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'Receipt', icon: Receipt },
  { name: 'ShieldCheck', icon: ShieldCheck },
  { name: 'Vault', icon: Vault },
];

export function CreateWalletTypeSheet({ open, onClose, onCreated }: CreateWalletTypeSheetProps) {
  const { addCustomWalletType } = useApp();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Wallet');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError(t('wallet.typeNameRequired'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      const created = await addCustomWalletType(name.trim(), icon);
      setName('');
      setIcon('Wallet');
      onClose();
      showToast(t('wallet.typeAddedToast'));
      onCreated(created.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      setError(msg || t('wallet.typeFailedAdd'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title={t('wallet.addTypeCustomTitle')}>
      <div className="space-y-5">
        <Input
          label={t('wallet.typeNameLabel')}
          placeholder={t('wallet.typeNamePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">{t('cat.iconLabel')}</label>
          <div className="grid grid-cols-4 gap-2">
            {ICON_OPTIONS.map(({ name: iconName, icon: Icon }) => (
              <button
                key={iconName}
                type="button"
                onClick={() => setIcon(iconName)}
                className={`flex items-center justify-center p-3 rounded-xl border-2 transition-all ${
                  icon === iconName ? 'border-primary bg-primary/10' : 'border-secondary bg-secondary'
                }`}
              >
                <Icon className={`w-5 h-5 ${icon === iconName ? 'text-primary' : 'text-text-secondary'}`} />
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-expense">{error}</p>}

        <Button fullWidth onClick={handleSubmit} disabled={loading}>
          {loading ? t('wallet.saving') : t('wallet.saveType')}
        </Button>
      </div>
    </Sheet>
  );
}