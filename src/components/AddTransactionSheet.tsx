import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { AddWalletSheet } from '@/components/AddWalletSheet';
import { CATEGORIES, type TransactionType } from '@/lib/types';
import { formatIDRInput, parseIDRInput } from '@/lib/format';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { getIcon } from '@/lib/icons';
import { useToast } from '@/context/ToastContext';

interface AddTransactionSheetProps {
  open: boolean;
  onClose: () => void;
}

export function AddTransactionSheet({ open, onClose }: AddTransactionSheetProps) {
  const { wallets, profile, addTransaction } = useApp();
  const { showToast } = useToast();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState('');
  const [targetWalletId, setTargetWalletId] = useState('');
  const [category, setCategory] = useState('food');
  const [notes, setNotes] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddWallet, setShowAddWallet] = useState(false);

  useEffect(() => {
    if (open && wallets.length > 0 && !walletId) {
      setWalletId(wallets[0].id);
    }
  }, [open, wallets, walletId]);

  useEffect(() => {
    if (wallets.length > 0 && !walletId) {
      setWalletId(wallets[0].id);
    }
  }, [wallets, walletId]);

  const reset = () => {
    setType('expense');
    setAmount('');
    setCategory('food');
    setNotes('');
    setTargetWalletId('');
    setTransactionDate(new Date().toISOString().slice(0, 10));
    setError('');
  };

  const handleSubmit = async () => {
    const amt = parseIDRInput(amount);
    if (!amt) {
      setError('Please enter an amount');
      return;
    }
    if (!walletId) {
      setError('Please select a wallet');
      return;
    }
    if (category === 'transfer' && !targetWalletId) {
      setError('Please select a target wallet');
      return;
    }
    if (category === 'transfer' && walletId === targetWalletId) {
      setError('Source and target wallets must be different');
      return;
    }

    setError('');
    setLoading(true);
    try {
      if (category === 'transfer') {
        const sourceWalletName = wallets.find(w => w.id === walletId)?.name ?? 'Unknown';
        const targetWalletName = wallets.find(w => w.id === targetWalletId)?.name ?? 'Unknown';

        // Expense from source wallet
        await addTransaction({
          wallet_id: walletId,
          amount: amt,
          type: 'expense',
          category: 'transfer',
          notes: notes.trim() || `Transfer to ${targetWalletName}`,
          spent_by: profile?.full_name ?? 'Me',
          transaction_date: `${transactionDate}T12:00:00.000Z`,
        });

        // Income to target wallet
        await addTransaction({
          wallet_id: targetWalletId,
          amount: amt,
          type: 'income',
          category: 'transfer',
          notes: notes.trim() || `Transfer from ${sourceWalletName}`,
          spent_by: profile?.full_name ?? 'Me',
          transaction_date: `${transactionDate}T12:00:00.000Z`,
        });
      } else {
        await addTransaction({
          wallet_id: walletId,
          amount: amt,
          type,
          category,
          notes: notes.trim() || null,
          spent_by: profile?.full_name ?? 'Me',
          transaction_date: `${transactionDate}T12:00:00.000Z`,
        });
      }
      reset();
      onClose();
      showToast('Transaksi berhasil ditambahkan');
    } catch {
      setError('Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Add Transaction">
      <div className="space-y-5">
        {/* Type Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setType('expense')}
             className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
               type === 'expense' ? 'bg-expense/20 text-expense border-2 border-expense' : 'bg-secondary text-text-secondary border-2 border-transparent'
             }`}
          >
            <ArrowDownCircle className="w-5 h-5" />
            Expense
          </button>
          <button
            onClick={() => setType('income')}
             className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
               type === 'income' ? 'bg-income/20 text-income border-2 border-income' : 'bg-secondary text-text-secondary border-2 border-transparent'
             }`}
          >
            <ArrowUpCircle className="w-5 h-5" />
            Income
          </button>
        </div>

        {/* Amount */}
        <Input
          label="Amount"
          prefix="Rp"
          placeholder="0"
          inputMode="numeric"
          value={formatIDRInput(parseIDRInput(amount))}
          onChange={(e) => setAmount(e.target.value)}
          className="text-2xl font-bold"
        />

        {/* Wallet Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
             <label className="block text-sm font-medium text-text-secondary">Wallet</label>
             <button
               type="button"
               onClick={() => setShowAddWallet(true)}
               className="text-sm font-semibold text-primary hover:text-primary-hover"
             >
              + Add wallet
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {wallets.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => setWalletId(w.id)}
                 className={`p-3 rounded-xl text-left transition-all border-2 ${
                   walletId === w.id ? 'border-primary bg-primary/10' : 'border-secondary bg-secondary'
                 }`}
               >
                 <p className="font-semibold text-sm text-text-primary truncate">{w.name}</p>
                 <p className="text-xs text-text-secondary">{w.type}</p>
               </button>
            ))}
          </div>
           {wallets.length === 0 && (
             <p className="text-sm text-text-secondary mt-2">No wallets yet. Add one to start tracking transactions.</p>
           )}
        </div>

        {/* Target Wallet (For Transfers) */}
        {category === 'transfer' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-stone-600">Target Wallet</label>
              <button
                type="button"
                onClick={() => setShowAddWallet(true)}
                className="text-sm font-semibold text-teal-700 hover:text-teal-800"
              >
                + Add wallet
              </button>
            </div>
            {wallets.length < 2 ? (
              <p className="text-sm text-stone-500 mt-2">You need at least another wallet to make a transfer.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {wallets.filter(w => w.id !== walletId).map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setTargetWalletId(w.id)}
                    className={`p-3 rounded-xl text-left transition-all border-2 ${
                      targetWalletId === w.id ? 'border-teal-500 bg-teal-50' : 'border-stone-200 bg-cream-50'
                    }`}
                  >
                    <p className="font-semibold text-sm text-stone-800 truncate">{w.name}</p>
                    <p className="text-xs text-stone-400">{w.type}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Category */}
         <div>
           <label className="block text-sm font-medium text-text-secondary mb-2">Category</label>
           <div className="grid grid-cols-4 gap-2">
             {CATEGORIES.map((cat) => {
               const Icon = getIcon(cat.icon);
               const isActive = category === cat.key;
               return (
                 <button
                   key={cat.key}
                   onClick={() => setCategory(cat.key)}
                   className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all border-2 ${
                     isActive ? 'border-primary bg-primary/10' : 'border-transparent bg-secondary'
                   }`}
                 >
                   <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isActive ? 'bg-primary/20' : 'bg-secondary'}`}>
                     <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-primary' : 'text-text-secondary'}`} />
                   </div>
                   <span className={`text-[10px] font-medium text-center leading-tight ${isActive ? 'text-primary' : 'text-text-secondary'}`}>
                     {cat.label.split(' ')[0]}
                   </span>
                 </button>
               );
             })}
           </div>
         </div>

        <Input
          label="Date"
          type="date"
          value={transactionDate}
          onChange={(e) => setTransactionDate(e.target.value)}
        />

        {/* Note */}
        <Input
          label="Note (optional)"
          placeholder="e.g., Groceries at Indomaret"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

         {/* Spent By */}
         <div className="flex items-center gap-2">
           <span className="text-sm text-text-secondary">Logged by:</span>
           <Badge color="primary">{profile?.full_name ?? 'Me'}</Badge>
         </div>
 
         {error && <p className="text-sm text-expense">{error}</p>}

        <Button fullWidth onClick={handleSubmit} disabled={loading}>
          {loading ? 'Saving...' : 'Save Transaction'}
        </Button>
      </div>
      <AddWalletSheet open={showAddWallet} onClose={() => setShowAddWallet(false)} />
    </Sheet>
  );
}
