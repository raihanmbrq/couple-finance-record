import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatIDRInput, parseIDRInput } from '@/lib/format';
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
  const { walletTypes, updateWallet, deleteWallet } = useApp();
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
           <label className="block text-sm font-medium text-text-secondary mb-2">Tipe Wallet</label>
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
               <span className="text-sm font-semibold">+ Tambah Tipe Kustom</span>
             </button>
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

      <CreateWalletTypeSheet
        open={showCreateType}
        onClose={() => setShowCreateType(false)}
        onCreated={(id) => setType(id)}
      />
    </Sheet>
  );
}