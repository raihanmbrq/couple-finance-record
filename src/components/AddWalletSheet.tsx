import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatIDRInput, parseIDRInput } from '@/lib/format';
import { type WalletType } from '@/lib/types';
import { PiggyBank, Banknote, Landmark, Smartphone } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface AddWalletSheetProps {
  open: boolean;
  onClose: () => void;
}

const walletTypes: { key: WalletType; label: string; icon: typeof PiggyBank }[] = [
  { key: 'joint', label: 'Joint Account', icon: PiggyBank },
  { key: 'cash', label: 'Cash', icon: Banknote },
  { key: 'bank', label: 'Bank', icon: Landmark },
  { key: 'ewallet', label: 'E-Wallet', icon: Smartphone },
];

export function AddWalletSheet({ open, onClose }: AddWalletSheetProps) {
  const { addWallet } = useApp();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [type, setType] = useState<WalletType>('cash');
  const [balance, setBalance] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Please enter a wallet name');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const inserted = await addWallet(name.trim(), type, parseIDRInput(balance));
      setName('');
      setBalance('');
      setType('cash');
      onClose();
      showToast('Wallet berhasil ditambahkan');
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      setError(msg || 'Failed to add wallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Add Wallet">
      <div className="space-y-5">
        <Input
          label="Wallet Name"
          placeholder="e.g., BCA Joint Account"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

         <div>
           <label className="block text-sm font-medium text-text-secondary mb-2">Type</label>
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
          label="Initial Balance"
          prefix="Rp"
          placeholder="0"
          inputMode="numeric"
          value={balance ? formatIDRInput(parseIDRInput(balance)) : ''}
          onChange={(e) => setBalance(e.target.value)}
        />

        {error && <p className="text-sm text-expense">{error}</p>}

        <Button fullWidth onClick={handleSubmit} disabled={loading}>
          {loading ? 'Adding...' : 'Add Wallet'}
        </Button>
      </div>
    </Sheet>
  );
}
