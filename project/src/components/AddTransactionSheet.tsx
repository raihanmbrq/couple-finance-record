import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { CATEGORIES, type TransactionType, type WalletType } from '@/lib/types';
import { formatIDRInput, parseIDRInput } from '@/lib/format';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { getIcon } from '@/lib/icons';

interface AddTransactionSheetProps {
  open: boolean;
  onClose: () => void;
}

export function AddTransactionSheet({ open, onClose }: AddTransactionSheetProps) {
  const { wallets, profile, addTransaction } = useApp();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState('');
  const [category, setCategory] = useState('food');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && wallets.length > 0 && !walletId) {
      setWalletId(wallets[0].id);
    }
  }, [open, wallets, walletId]);

  const reset = () => {
    setType('expense');
    setAmount('');
    setCategory('food');
    setNotes('');
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
    setError('');
    setLoading(true);
    try {
      await addTransaction({
        wallet_id: walletId,
        amount: amt,
        type,
        category,
        notes: notes.trim() || null,
        spent_by: profile?.full_name ?? 'Me',
      });
      reset();
      onClose();
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
              type === 'expense' ? 'bg-red-50 text-red-600 border-2 border-red-200' : 'bg-cream-50 text-stone-400 border-2 border-transparent'
            }`}
          >
            <ArrowDownCircle className="w-5 h-5" />
            Expense
          </button>
          <button
            onClick={() => setType('income')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
              type === 'income' ? 'bg-green-50 text-green-600 border-2 border-green-200' : 'bg-cream-50 text-stone-400 border-2 border-transparent'
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
          <label className="block text-sm font-medium text-stone-600 mb-2">Wallet</label>
          <div className="grid grid-cols-2 gap-2">
            {wallets.map((w) => (
              <button
                key={w.id}
                onClick={() => setWalletId(w.id)}
                className={`p-3 rounded-xl text-left transition-all border-2 ${
                  walletId === w.id ? 'border-teal-500 bg-teal-50' : 'border-stone-200 bg-cream-50'
                }`}
              >
                <p className="font-semibold text-sm text-stone-800 truncate">{w.name}</p>
                <p className="text-xs text-stone-400">{w.type}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-2">Category</label>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = getIcon(cat.icon);
              const isActive = category === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setCategory(cat.key)}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all border-2 ${
                    isActive ? 'border-teal-500 bg-teal-50' : 'border-transparent bg-cream-50'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isActive ? 'bg-teal-100' : 'bg-cream-100'}`}>
                    <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-teal-700' : 'text-stone-500'}`} />
                  </div>
                  <span className={`text-[10px] font-medium text-center leading-tight ${isActive ? 'text-teal-700' : 'text-stone-500'}`}>
                    {cat.label.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Note */}
        <Input
          label="Note (optional)"
          placeholder="e.g., Groceries at Indomaret"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {/* Spent By */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-stone-500">Logged by:</span>
          <Badge color="teal">{profile?.full_name ?? 'Me'}</Badge>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button fullWidth onClick={handleSubmit} disabled={loading}>
          {loading ? 'Saving...' : 'Save Transaction'}
        </Button>
      </div>
    </Sheet>
  );
}
