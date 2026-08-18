import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { AddWalletSheet } from '@/components/AddWalletSheet';
import { CreateCategorySheet } from '@/components/CreateCategorySheet';
import { type TransactionType } from '@/lib/types';
import { formatMoneyInput, parseMoneyInput } from '@/lib/format';
import { getCurrencySymbol } from '@/lib/currencies';
import { ArrowDownCircle, ArrowUpCircle, Plus } from 'lucide-react';
import { getIcon } from '@/lib/icons';
import { useToast } from '@/context/ToastContext';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';

interface AddTransactionSheetProps {
  open: boolean;
  onClose: () => void;
}

export function AddTransactionSheet({ open, onClose }: AddTransactionSheetProps) {
  const { wallets, profile, addTransaction, walletTypes, categories } = useApp();
  const { t } = useLanguage();
  const currency = profile?.currency ?? 'IDR';
  const formatWalletType = (type: string) => {
    const row = walletTypes.find((t) => t.id === type);
    if (row) return row.name;
    return type.charAt(0).toUpperCase() + type.slice(1);
  };
  const { showToast } = useToast();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState('');

  const [category, setCategory] = useState('food');
  const [notes, setNotes] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);

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
    setTransactionDate(new Date().toISOString().slice(0, 10));
    setError('');
  };

  const handleSubmit = async () => {
    const amt = parseMoneyInput(amount);
    if (!amt) {
      setError(t('tx.enterAmount'));
      return;
    }
    if (!walletId) {
      setError(t('tx.selectWallet'));
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
        transaction_date: `${transactionDate}T12:00:00.000Z`,
      });
      reset();
      onClose();
      showToast(t('tx.addedToast'));
    } catch {
      setError(t('tx.failedSave'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title={t('tx.addTitle')}>
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
            {t('common.expense')}
          </button>
          <button
            onClick={() => setType('income')}
             className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
               type === 'income' ? 'bg-income/20 text-income border-2 border-income' : 'bg-secondary text-text-secondary border-2 border-transparent'
             }`}
          >
            <ArrowUpCircle className="w-5 h-5" />
            {t('common.income')}
          </button>
        </div>

        {/* Amount */}
        <Input
          label={t('common.amount')}
          prefix={getCurrencySymbol(currency)}
          placeholder="0"
          inputMode="numeric"
          value={formatMoneyInput(parseMoneyInput(amount), currency)}
          onChange={(e) => setAmount(e.target.value)}
          className="text-2xl font-bold"
        />

        {/* Wallet Selection */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">{t('common.wallet')}</label>
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
            <button
              type="button"
              onClick={() => setShowAddWallet(true)}
              className="flex items-center justify-center gap-1.5 p-3 rounded-xl border-2 border-dashed border-secondary text-text-secondary hover:border-primary hover:text-primary transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-semibold">{t('tx.addNewWallet')}</span>
            </button>
          </div>
          {wallets.length === 0 && (
            <p className="text-sm text-text-secondary mt-2">{t('tx.noWalletsYet')}</p>
          )}
        </div>

        {/* Category */}
         <div>
           <label className="block text-sm font-medium text-text-secondary mb-2">{t('common.category')}</label>
           <div className="grid grid-cols-4 gap-2">
             {categories
               .filter((cat) => cat.type === 'both' || cat.type === type)
               .map((cat) => {
                 const Icon = getIcon(cat.icon);
                 const isActive = category === cat.id;
                 return (
                   <button
                     key={cat.id}
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
         </div>


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

        {/* Note */}
        <Input
          label={t('tx.noteOptional')}
          placeholder={t('tx.notePlaceholder')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

         {/* Spent By */}
         <div className="flex items-center gap-2">
           <span className="text-sm text-text-secondary">{t('tx.loggedBy')}</span>
           <Badge color="primary">{profile?.full_name ?? t('common.me')}</Badge>
         </div>
 
         {error && <p className="text-sm text-expense">{error}</p>}

        <Button fullWidth onClick={handleSubmit} disabled={loading}>
          {loading ? t('goals.saving') : t('tx.saveTransaction')}
        </Button>
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
