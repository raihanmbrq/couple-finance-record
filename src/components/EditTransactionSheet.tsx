import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { AddWalletSheet } from '@/components/AddWalletSheet';
import { CreateCategorySheet } from '@/components/CreateCategorySheet';
import { type Transaction, type TransactionType } from '@/lib/types';
import { formatIDR, formatIDRInput, parseIDRInput } from '@/lib/format';
import { ArrowDownCircle, ArrowUpCircle, Plus, Trash2 } from 'lucide-react';
import { getIcon } from '@/lib/icons';
import { useToast } from '@/context/ToastContext';

interface EditTransactionSheetProps {
  open: boolean;
  transaction: Transaction | null;
  onClose: () => void;
}

export function EditTransactionSheet({ open, transaction, onClose }: EditTransactionSheetProps) {
  const { wallets, profile, updateTransaction, deleteTransaction, walletTypes, categories } = useApp();
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
  const [showAddCategory, setShowAddCategory] = useState(false);

  const selectedWallet = useMemo(() => wallets.find(w => w.id === walletId), [wallets, walletId]);

  const formatWalletType = (type: string) => {
    const row = walletTypes.find((t) => t.id === type);
    if (row) return row.name;
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
              type === 'expense' ? 'bg-expense/20 text-expense border-2 border-expense' : 'bg-secondary text-text-secondary border-2 border-transparent'
            }`}
          >
            <ArrowDownCircle className="w-5 h-5" />
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
              type === 'income' ? 'bg-income/20 text-income border-2 border-income' : 'bg-secondary text-text-secondary border-2 border-transparent'
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
            <legend className="block text-sm font-medium text-text-secondary">Wallet</legend>
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
                <p className="text-xs text-stone-400">{formatWalletType(w.type)}</p>
              </button>
            ))}
          </div>
          {selectedWallet && (
            <p className="text-xs text-text-secondary mt-2">Current wallet balance: {formatIDR(selectedWallet.balance)}</p>
          )}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="block text-sm font-medium text-text-secondary mb-2">Category</legend>
          <div className="grid grid-cols-4 gap-2">
            {categories
              .filter((cat) => cat.type === 'both' || cat.type === type)
              .map((cat) => {
                const Icon = getIcon(cat.icon);
                const isActive = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all border-2 ${
                      isActive ? 'border-primary bg-primary/10' : 'border-transparent bg-secondary'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isActive ? 'bg-primary/20' : 'bg-secondary'}`}>
                      <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-primary' : 'text-text-secondary'}`} />
                    </div>
                    <span className={`text-[10px] font-medium text-center leading-tight ${isActive ? 'text-primary' : 'text-text-secondary'}`}>
                      {cat.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            <button
              type="button"
              onClick={() => setShowAddCategory(true)}
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border-2 border-dashed border-secondary text-text-secondary hover:border-primary hover:text-primary transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="text-[10px] font-semibold text-center leading-tight">Add Category</span>
            </button>
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
          <span className="text-sm text-text-secondary">Logged by:</span>
          <Badge color="primary">{profile?.full_name ?? transaction?.spent_by ?? 'Unknown user'}</Badge>
        </div>

        {error && <p className="text-sm text-expense">{error}</p>}

        <Button fullWidth onClick={handleSubmit} disabled={loading}>
          {loading ? 'Updating...' : 'Update Transaction'}
        </Button>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-expense bg-expense/10 border-2 border-expense/20 hover:bg-expense/20 transition-all disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          Delete Transaction
        </button>

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-surface rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-12 h-12 rounded-full bg-expense/10 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-expense" />
                </div>
                <h2 className="text-lg font-bold text-text-primary">Hapus Transaksi?</h2>
                <p className="text-sm text-text-secondary">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 rounded-xl font-semibold text-text-primary bg-secondary hover:bg-secondary/80 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => { setShowDeleteConfirm(false); handleDelete(); }}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl font-semibold text-white bg-expense hover:bg-expense/90 transition-all disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <AddWalletSheet open={showAddWallet} onClose={() => setShowAddWallet(false)} />
      <CreateCategorySheet
        open={showAddCategory}
        onClose={() => setShowAddCategory(false)}
        onCreated={(id) => {
          setCategory(id);
          setType((prevType) => {
            const createdCat = categories.find((c) => c.id === id);
            if (createdCat && (createdCat.type === 'expense' || createdCat.type === 'income')) {
              return createdCat.type;
            }
            return prevType;
          });
        }}
      />
    </Sheet>
  );
}
