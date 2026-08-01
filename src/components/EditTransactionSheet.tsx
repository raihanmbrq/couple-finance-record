import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { AddWalletSheet } from '@/components/AddWalletSheet';
import { CATEGORIES, type Transaction, type TransactionType } from '@/lib/types';
import { formatIDR, formatIDRInput, parseIDRInput } from '@/lib/format';
import { ArrowDownCircle, ArrowUpCircle, Trash2 } from 'lucide-react';
import { getIcon } from '@/lib/icons';
import { useToast } from '@/context/ToastContext';

interface EditTransactionSheetProps {
  open: boolean;
  transaction: Transaction | null;
  onClose: () => void;
}

export function EditTransactionSheet({ open, transaction, onClose }: EditTransactionSheetProps) {
  const { wallets, profile, updateTransaction, deleteTransaction } = useApp();
  const { showToast } = useToast();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState('');
  const [category, setCategory] = useState('food');
  const [notes, setNotes] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const selectedWallet = useMemo(() => wallets.find(w => w.id === walletId), [wallets, walletId]);

  const formatWalletType = (type: string) => {
    if (type === 'ewallet') return 'E-Wallet';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  useEffect(() => {
    if (!open || !transaction) return;
    setType(transaction.type);
    setAmount(String(transaction.amount));
    setWalletId(transaction.wallet_id);
    setCategory(transaction.category);
    setNotes(transaction.notes ?? '');
    setTransactionDate(transaction.transaction_date.slice(0, 10));
    setError('');
  }, [open, transaction]);

  useEffect(() => {
    if (!walletId && wallets.length > 0) {
      setWalletId(wallets[0].id);
    }
  }, [walletId, wallets]);

  const handleDelete = async () => {
    if (!transaction) return;
    setLoading(true);
    try {
      await deleteTransaction(transaction.id);
      onClose();
      showToast('Transaksi berhasil dihapus', 'error');
    } catch {
      setError('Failed to delete transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!transaction) return;
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
      await updateTransaction(transaction.id, {
        wallet_id: walletId,
        user_id: profile?.id,
        amount: amt,
        type,
        category,
        notes: notes.trim() || null,
        spent_by: profile?.full_name ?? transaction.spent_by,
        transaction_date: `${transactionDate}T12:00:00.000Z`,
      });
      showToast('Transaksi berhasil diupdate');
      window.setTimeout(() => {
        onClose();
      }, 500);
    } catch {
      setError('Failed to update transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Edit Transaction">
      <div className="space-y-5">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
              type === 'expense' ? 'bg-red-50 text-red-600 border-2 border-red-200' : 'bg-cream-50 text-stone-400 border-2 border-transparent'
            }`}
          >
            <ArrowDownCircle className="w-5 h-5" />
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
              type === 'income' ? 'bg-green-50 text-green-600 border-2 border-green-200' : 'bg-cream-50 text-stone-400 border-2 border-transparent'
            }`}
          >
            <ArrowUpCircle className="w-5 h-5" />
            Income
          </button>
        </div>

        <Input
          label="Amount"
          prefix="Rp"
          placeholder="0"
          inputMode="numeric"
          value={formatIDRInput(parseIDRInput(amount))}
          onChange={(e) => setAmount(e.target.value)}
          className="text-2xl font-bold"
        />

        <fieldset className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <legend className="block text-sm font-medium text-stone-600">Wallet</legend>
            <button
              type="button"
              onClick={() => setShowAddWallet(true)}
              className="text-sm font-semibold text-teal-700 hover:text-teal-800"
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
                  walletId === w.id ? 'border-teal-500 bg-teal-50' : 'border-stone-200 bg-cream-50'
                }`}
              >
                <p className="font-semibold text-sm text-stone-800 truncate">{w.name}</p>
                <p className="text-xs text-stone-400">{formatWalletType(w.type)}</p>
              </button>
            ))}
          </div>
          {selectedWallet && (
            <p className="text-xs text-stone-500 mt-2">Current wallet balance: {formatIDR(selectedWallet.balance)}</p>
          )}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="block text-sm font-medium text-stone-600 mb-2">Category</legend>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = getIcon(cat.icon);
              const isActive = category === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
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
        </fieldset>

        <Input
          label="Date"
          type="date"
          value={transactionDate}
          onChange={(e) => setTransactionDate(e.target.value)}
        />

        <Input
          label="Note (optional)"
          placeholder="e.g., Groceries at Indomaret"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex items-center gap-2">
          <span className="text-sm text-stone-500">Logged by:</span>
          <Badge color="primary">{profile?.full_name ?? transaction?.spent_by ?? 'Unknown user'}</Badge>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button fullWidth onClick={handleSubmit} disabled={loading}>
          {loading ? 'Updating...' : 'Update Transaction'}
        </Button>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-red-600 bg-red-50 border-2 border-red-200 hover:bg-red-100 transition-all disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          Delete Transaction
        </button>

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-lg font-bold text-stone-800">Hapus Transaksi?</h2>
                <p className="text-sm text-stone-500">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 rounded-xl font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => { setShowDeleteConfirm(false); handleDelete(); }}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl font-semibold text-white bg-red-500 hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <AddWalletSheet open={showAddWallet} onClose={() => setShowAddWallet(false)} />
    </Sheet>
  );
}
