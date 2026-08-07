import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatMoneyInput, parseMoneyInput } from '@/lib/format';
import { getCurrencySymbol } from '@/lib/currencies';
import { walletTypeIcon } from '@/lib/walletIcons';
import { Plus } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { CreateWalletTypeSheet } from '@/components/CreateWalletTypeSheet';

interface AddWalletSheetProps {
  open: boolean;
  onClose: () => void;
}

export function AddWalletSheet({ open, onClose }: AddWalletSheetProps) {
  const { walletTypes, addWallet, profile } = useApp();
  const currency = profile?.currency ?? 'IDR';
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [balance, setBalance] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateType, setShowCreateType] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Please enter a wallet name');
      return;
    }
    if (!type) {
      setError('Please select a wallet type');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await addWallet(name.trim(), type, parseMoneyInput(balance));
      setName('');
      setBalance('');
      setType('');
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
           <label className="block text-sm font-medium text-text-secondary mb-2">Wallet Type</label>
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
               <span className="text-sm font-semibold">Wallet Type</span>
             </button>
           </div>
         </div>

        <Input
          label="Initial Balance"
          prefix={getCurrencySymbol(currency)}
          placeholder="0"
          inputMode="numeric"
          value={balance ? formatMoneyInput(parseMoneyInput(balance), currency) : ''}
          onChange={(e) => setBalance(e.target.value)}
        />

        {error && <p className="text-sm text-expense">{error}</p>}

        <Button fullWidth onClick={handleSubmit} disabled={loading}>
          {loading ? 'Adding...' : 'Add Wallet'}
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