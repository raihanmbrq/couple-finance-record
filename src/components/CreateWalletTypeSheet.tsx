import { useState } from 'react';
import { useApp } from '@/context/AppContext';
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

const ICON_OPTIONS = [
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
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Wallet');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Nama tipe wallet wajib diisi');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const created = await addCustomWalletType(name.trim(), icon);
      setName('');
      setIcon('Wallet');
      onClose();
      showToast('Tipe wallet baru berhasil ditambahkan!');
      onCreated(created.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      setError(msg || 'Gagal menambahkan tipe wallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Tambah Tipe Kustom">
      <div className="space-y-5">
        <Input
          label="Nama Tipe Wallet"
          placeholder="misal Dana Darurat, Voucher"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Pilih Ikon</label>
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
          {loading ? 'Menyimpan...' : 'Simpan Tipe Wallet'}
        </Button>
      </div>
    </Sheet>
  );
}