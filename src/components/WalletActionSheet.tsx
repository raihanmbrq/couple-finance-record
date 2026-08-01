import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { type Wallet, type WalletType } from '@/lib/types';
import { formatIDRInput, parseIDRInput } from '@/lib/format';
import { PiggyBank, Banknote, Landmark, Smartphone } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface WalletActionSheetProps {
  wallet: Wallet | null;
  open: boolean;
  onClose: () => void;
}

const walletTypes: { key: WalletType; label: string; icon: typeof PiggyBank }[] = [
  { key: 'joint', label: 'Joint', icon: PiggyBank },
  { key: 'cash', label: 'Cash', icon: Banknote },
  { key: 'bank', label: 'Bank', icon: Landmark },
  { key: 'ewallet', label: 'E-Wallet', icon: Smartphone },
];

export function WalletActionSheet({ wallet, open, onClose }: WalletActionSheetProps) {
  const { updateWallet, deleteWallet } = useApp();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [type, setType] = useState<WalletType>('cash');
  const [balance, setBalance] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      setError('Please enter a wallet name');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await updateWallet(wallet.id, {
        name: name.trim(),
        type,
        balance: parseIDRInput(balance),
      });
      onClose();
      showToast('Wallet berhasil diupdate');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update wallet');
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
      showToast('Wallet berhasil dihapus');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete wallet');
    } finally {
      setLoading(false);
    }
  };

  if (!wallet) return null;

  return (
    <Sheet open={open} onClose={onClose} title="Wallet Details">
      <div className="space-y-5">
        <Input
          label="Wallet Name"
          placeholder="e.g., Shared Savings"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

         <div>
           <label className="block text-sm font-medium text-text-secondary mb-2">Icon / Color</label>
           <div className="grid grid-cols-2 gap-2">
             {walletTypes.map(({ key, label, icon: Icon }) => (
               <button
                 key={key}
                 onClick={() => setType(key)}
                 className={`flex items-center gap-2.5 p-3 rounded-xl transition-all border-2 ${
                   type === key ? 'border-primary bg-primary/10' : 'border-secondary bg-secondary'
                 }`}
               >
                 <Icon className={`w-5 h-5 ${type === key ? 'text-primary' : 'text-text-secondary'}`} />
                 <span className={`text-sm font-semibold ${type === key ? 'text-primary' : 'text-text-primary'}`}>{label}</span>
               </button>
             ))}
           </div>
         </div>

        <Input
          label="Balance"
          prefix="Rp"
          placeholder="0"
          inputMode="numeric"
          value={balance ? formatIDRInput(parseIDRInput(balance)) : ''}
          onChange={(e) => setBalance(e.target.value)}
        />

        {error && <p className="text-sm text-expense">{error}</p>}

        <div className="flex gap-2">
          <Button fullWidth variant="secondary" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <Button fullWidth variant="danger" onClick={handleDelete} disabled={loading || !canDelete}>
          {confirmDelete ? 'Confirm Delete Wallet' : 'Delete Wallet'}
        </Button>
      </div>
    </Sheet>
  );
}
