import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { AddWalletSheet } from '@/components/AddWalletSheet';
import { CreateCategorySheet } from '@/components/CreateCategorySheet';
import { type Transaction, type TransactionType } from '@/lib/types';
import { formatMoney, formatMoneyInput, parseMoneyInput } from '@/lib/format';
import { getCurrencySymbol } from '@/lib/currencies';
import { ArrowDownCircle, ArrowUpCircle, ArrowRightLeft, Plus, Trash2 } from 'lucide-react';
import { getIcon } from '@/lib/icons';
import { useToast } from '@/context/ToastContext';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';
import { ReceiptAttachButton } from '@/components/ReceiptAttachButton';

interface EditTransactionSheetProps {
  open: boolean;
  transaction: Transaction | null;
  onClose: () => void;
}

export function EditTransactionSheet({ open, transaction, onClose }: EditTransactionSheetProps) {
  const { wallets, profile, updateTransaction, deleteTransaction, walletTypes, categories } = useApp();
  const { t } = useLanguage();
  const currency = profile?.currency ?? 'IDR';
  const { showToast } = useToast();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState('');
  /** Internal transfer only: the wallet receiving the money. */
  const [destinationWalletId, setDestinationWalletId] = useState('');
  const [category, setCategory] = useState('food');
  const [notes, setNotes] = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
  const [datePickerOpen, setDatePickerOpen] = useState(false);
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
    setDestinationWalletId(transaction.destination_wallet_id ?? '');
    setCategory(transaction.category);
    setNotes(transaction.notes ?? '');
    setReceiptUrl(transaction.receipt_url ?? null);
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
      showToast(t('tx.deletedToast'), 'error');
    } catch {
      setError(t('tx.failedDelete'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!transaction) return;
    const amt = parseMoneyInput(amount);
    if (!amt) {
      setError(t('tx.enterAmount'));
      return;
    }
    if (!walletId) {
      setError(t('tx.selectWallet'));
      return;
    }
    if (type === 'transfer' && !destinationWalletId) {
      setError(t('transfer.selectDest'));
      return;
    }
    if (type === 'transfer' && destinationWalletId === walletId) {
      setError(t('transfer.sameWallet'));
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
        // A transfer keeps its source/destination pair (source mirrors wallet_id).
        ...(type === 'transfer'
          ? {
              source_wallet_id: walletId,
              destination_wallet_id: destinationWalletId,
              destination_wallet_name:
                wallets.find((w) => w.id === destinationWalletId)?.name ?? null,
            }
          : {
              source_wallet_id: null,
              destination_wallet_id: null,
              destination_wallet_name: null,
            }),
        notes: notes.trim() || null,
        spent_by: profile?.full_name ?? transaction.spent_by,
        transaction_date: `${transactionDate}T12:00:00.000Z`,
        receipt_url: receiptUrl,
      });
      showToast(t('tx.updatedToast'));
      window.setTimeout(() => {
        onClose();
      }, 500);
    } catch {
      setError(t('tx.failedUpdate'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title={t('tx.editTitle')}>
      <div className="space-y-5">
        <div className="flex gap-2">
          {type === 'transfer' ? (
            // A transfer keeps its dedicated type: it is a movement between two
            // own wallets, never a normal expense/income row.
            <div
              data-testid="edit-transfer-indicator"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-accent/10 text-accent border-2 border-accent"
            >
              <ArrowRightLeft className="w-5 h-5" />
              {t('tx.internalTransfer')}
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
                  type === 'expense' ? 'bg-expense/20 text-expense border-2 border-expense' : 'bg-secondary text-text-secondary border-2 border-transparent'
                }`}
              >
                <ArrowDownCircle className="w-5 h-5" />
                {t('common.expense')}
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
                  type === 'income' ? 'bg-income/20 text-income border-2 border-income' : 'bg-secondary text-text-secondary border-2 border-transparent'
                }`}
              >
                <ArrowUpCircle className="w-5 h-5" />
                {t('common.income')}
              </button>
            </>
          )}
        </div>

        {type === 'transfer' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-secondary">{t('tx.destinationWallet')}</label>
            <div className="grid grid-cols-2 gap-2">
              {wallets.filter((w) => w.id !== walletId).map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setDestinationWalletId(w.id)}
                  className={`p-3 rounded-xl text-left transition-all border-2 ${
                    destinationWalletId === w.id ? 'border-accent bg-accent/10' : 'border-secondary bg-secondary'
                  }`}
                >
                  <p className="font-semibold text-sm text-text-primary truncate">{w.name}</p>
                  <p className="text-xs text-text-secondary">{formatWalletType(w.type)}</p>
                </button>
              ))}
            </div>
            <p className="text-xs text-text-secondary">{t('tx.transferInternalHint')}</p>
          </div>
        )}

        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              label={t('common.amount')}
              prefix={getCurrencySymbol(currency)}
              placeholder="0"
              inputMode="numeric"
              value={formatMoneyInput(parseMoneyInput(amount), currency)}
              onChange={(e) => setAmount(e.target.value)}
              className="text-2xl font-bold"
            />
          </div>
          <ReceiptAttachButton
            receiptUrl={receiptUrl}
            onUpload={(url) => setReceiptUrl(url)}
            onRemove={() => setReceiptUrl(null)}
          />
        </div>

        <fieldset className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <legend className="block text-sm font-medium text-text-secondary">{t('common.wallet')}</legend>
            <button
              type="button"
              onClick={() => setShowAddWallet(true)}
              className="text-sm font-semibold text-primary hover:text-primary-hover"
            >
              + {t('tx.addWallet')}
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
                <p className="text-xs text-text-secondary">{formatWalletType(w.type)}</p>
              </button>
            ))}
          </div>
          {selectedWallet && (
            <p className="text-xs text-text-secondary mt-2">{t('tx.currentBalance')}: {formatMoney(selectedWallet.balance, currency)}</p>
          )}
          {!selectedWallet && transaction && (
            <div className="p-3 rounded-xl bg-secondary/50 border border-dashed border-secondary">
              <p className="font-semibold text-sm text-text-primary truncate">{transaction.wallet_name ?? t('wallet.title')}</p>
              <p className="text-xs text-text-secondary mt-1">{t('tx.walletDeletedNote')}</p>
            </div>
          )}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="block text-sm font-medium text-text-secondary mb-2">{t('common.category')}</legend>
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
              <span className="text-[10px] font-semibold text-center leading-tight">{t('tx.addCategory')}</span>
            </button>
          </div>
        </fieldset>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">{t('tx.date')}</label>
          <CustomDatePicker
            value={transactionDate}
            onChange={setTransactionDate}
            open={datePickerOpen}
            onClose={() => setDatePickerOpen(false)}
          />
          <button
            type="button"
            onClick={() => setDatePickerOpen(true)}
            className="w-full flex items-center justify-between px-4 py-3 bg-secondary/50 border border-secondary/35 rounded-xl hover:border-primary/50 transition-all font-medium text-sm text-text-primary min-h-[48px]"
          >
            <span>{transactionDate || t('tx.date')}</span>
            <span className="text-primary font-bold text-xs">Change</span>
          </button>
        </div>

        <Input
          label={t('tx.noteOptional')}
          placeholder={t('tx.notePlaceholder')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">{t('tx.loggedBy')}</span>
          <Badge color="primary">{profile?.full_name ?? transaction?.spent_by ?? t('common.unknownUser')}</Badge>
        </div>

        {error && <p className="text-sm text-expense">{error}</p>}

        <Button fullWidth onClick={handleSubmit} disabled={loading}>
          {loading ? t('tx.updating') : t('tx.updateTransaction')}
        </Button>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-expense bg-expense/10 border-2 border-expense/20 hover:bg-expense/20 transition-all disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          {t('tx.deleteTransaction')}
        </button>

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-surface rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-12 h-12 rounded-full bg-expense/10 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-expense" />
                </div>
                <h2 className="text-lg font-bold text-text-primary">{t('tx.deleteTitle')}</h2>
                <p className="text-sm text-text-secondary">{t('common.actionIrreversible')}</p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 rounded-xl font-semibold text-text-primary bg-secondary hover:bg-secondary/80 transition-all"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowDeleteConfirm(false); handleDelete(); }}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl font-semibold text-white bg-expense hover:bg-expense/90 transition-all disabled:opacity-50"
                >
                  {loading ? t('tx.deleting') : t('common.delete')}
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
