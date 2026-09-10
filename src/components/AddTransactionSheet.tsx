import { useState, useEffect, useMemo, useRef, useCallback, type KeyboardEvent, type MutableRefObject } from 'react';
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
import { ReceiptAttachButton } from '@/components/ReceiptAttachButton';

interface AddTransactionSheetProps {
  open: boolean;
  onClose: () => void;
}

// Sentinel ids for the inline "add" actions so they can join the arrow-key
// navigation of their grids without polluting the real wallet/category list.
const ADD_WALLET_KEY = '__add_wallet__';
const ADD_CATEGORY_KEY = '__add_category__';

const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

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
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);

  // ── Refs used to drive the keyboard-only focus flow ────────────────────────
  const amountRef = useRef<HTMLInputElement>(null);
  const dateTriggerRef = useRef<HTMLButtonElement>(null);
  const noteRef = useRef<HTMLInputElement>(null);
  const walletItemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const categoryItemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  // Latest handleSubmit, so the form-level Ctrl/Cmd+Enter handler never goes stale.
  const handleSubmitRef = useRef<(() => Promise<void>) | null>(null);

  // ── Roving-tabindex highlight for the two chip grids ───────────────────────
  const [walletFocusIndex, setWalletFocusIndex] = useState(0);
  const [categoryFocusIndex, setCategoryFocusIndex] = useState(0);

  const filteredCategories = useMemo(
    () => categories.filter((cat) => cat.type === 'both' || cat.type === type),
    [categories, type]
  );

  const walletNavIds = useMemo(() => [...wallets.map((w) => w.id), ADD_WALLET_KEY], [wallets]);
  const categoryNavIds = useMemo(
    () => [...filteredCategories.map((c) => c.id), ADD_CATEGORY_KEY],
    [filteredCategories]
  );

  // Resolve the roving highlight to a rendered item even if the underlying list
  // shrank (e.g. switching expense ⇄ income filters categories down).
  const highlightedWalletId = walletNavIds[walletFocusIndex] ?? walletNavIds[0] ?? '';
  const highlightedCategoryId = categoryNavIds[categoryFocusIndex] ?? categoryNavIds[0] ?? '';

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

  // Keep the roving highlight aligned with whichever item is actually selected.
  useEffect(() => {
    const idx = wallets.findIndex((w) => w.id === walletId);
    if (idx >= 0) setWalletFocusIndex(idx);
  }, [walletId, wallets]);

  useEffect(() => {
    const idx = filteredCategories.findIndex((c) => c.id === category);
    if (idx >= 0) setCategoryFocusIndex(idx);
  }, [category, filteredCategories]);

  // Step 1 — auto-focus the Amount field the moment the sheet opens.
  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => amountRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, [open]);

  // Return focus to the desktop dashboard once the flow completes.
  const focusDashboardMain = useCallback(() => {
    const main =
      document.querySelector<HTMLElement>('[data-testid="desktop-dashboard-main"]') ||
      document.querySelector<HTMLElement>('[data-testid="desktop-dashboard-layout"]');
    main?.focus();
  }, []);

  // ── Chip-grid focus helpers (roving tabindex) ──────────────────────────────
  const focusWallet = useCallback((index: number) => {
    const id = walletNavIds[Math.max(0, Math.min(index, walletNavIds.length - 1))];
    if (id) walletItemRefs.current[id]?.focus();
  }, [walletNavIds]);

  const focusCategory = useCallback((index: number) => {
    const id = categoryNavIds[Math.max(0, Math.min(index, categoryNavIds.length - 1))];
    if (id) categoryItemRefs.current[id]?.focus();
  }, [categoryNavIds]);

  const activateWallet = (id: string) => {
    if (id === ADD_WALLET_KEY) {
      setShowAddWallet(true);
    } else {
      setWalletId(id);
    }
  };

  const activateCategory = (id: string) => {
    if (id === ADD_CATEGORY_KEY) {
      setShowAddCategory(true);
    } else {
      setCategory(id);
    }
  };

  // Shared Arrow/Enter/Space logic for the wallet + category grids.
  const handleGridItemKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
    ids: string[],
    setIndex: (n: number) => void,
    refs: MutableRefObject<Record<string, HTMLButtonElement | null>>,
    activate: (id: string) => void,
    onForwardTab: () => void
  ) => {
    const move = (next: number) => {
      event.preventDefault();
      const wrapped = (next + ids.length) % ids.length;
      setIndex(wrapped);
      refs.current[ids[wrapped]]?.focus();
    };

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        move(index + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        move(index - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        activate(ids[index]);
        break;
      case 'Tab':
        if (!event.shiftKey) {
          event.preventDefault();
          onForwardTab();
        }
        break;
      default:
        break;
    }
  };

  // Step 2 — Tab from Amount jumps straight to the wallet grid.
  const handleAmountKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault();
      focusWallet(walletFocusIndex);
    }
  };

  // Step 5 — Enter/Space opens the picker; Tab moves on to the note field.
  const handleDateTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setDatePickerOpen(true);
    } else if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault();
      noteRef.current?.focus();
    }
  };

  const handleDatePickerClose = useCallback(() => {
    setDatePickerOpen(false);
    requestAnimationFrame(() => dateTriggerRef.current?.focus());
  }, []);

  // Step 7 — Ctrl/Cmd + Enter submits from anywhere inside the form.
  const handleFormKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      if (datePickerOpen || showAddWallet || showAddCategory) return;
      event.preventDefault();
      if (!loading) void handleSubmitRef.current?.();
    }
  };

  const reset = () => {
    setType('expense');
    setAmount('');
    setCategory('food');
    setNotes('');
    setReceiptUrl(null);
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
        receipt_url: receiptUrl,
      });
      reset();
      onClose();
      showToast(t('tx.addedToast'));
      // Return the keyboard user to the dashboard shell.
      requestAnimationFrame(focusDashboardMain);
    } catch {
      setError(t('tx.failedSave'));
    } finally {
      setLoading(false);
    }
  };

  // Keep the ref used by the form-level Ctrl/Cmd+Enter shortcut up to date.
  handleSubmitRef.current = handleSubmit;

  return (
    <Sheet open={open} onClose={onClose} title={t('tx.addTitle')}>
      <div
        data-testid="add-transaction-form"
        className="space-y-5"
        onKeyDown={handleFormKeyDown}
      >
        {/* Type Toggle */}
        <div className="flex gap-2" role="group" aria-label={t('tx.addTitle')}>
          <button
            type="button"
            data-testid="type-expense"
            aria-pressed={type === 'expense'}
            onClick={() => setType('expense')}
             className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${FOCUS_RING} ${
               type === 'expense' ? 'bg-expense/20 text-expense border-2 border-expense' : 'bg-secondary text-text-secondary border-2 border-transparent'
             }`}
          >
            <ArrowDownCircle className="w-5 h-5" />
            {t('common.expense')}
          </button>
          <button
            type="button"
            data-testid="type-income"
            aria-pressed={type === 'income'}
            onClick={() => setType('income')}
             className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${FOCUS_RING} ${
               type === 'income' ? 'bg-income/20 text-income border-2 border-income' : 'bg-secondary text-text-secondary border-2 border-transparent'
             }`}
          >
            <ArrowUpCircle className="w-5 h-5" />
            {t('common.income')}
          </button>
        </div>

        {/* Amount + Receipt Attachment */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              ref={amountRef}
              data-testid="input-amount"
              aria-label={t('common.amount')}
              label={t('common.amount')}
              prefix={getCurrencySymbol(currency)}
              placeholder="0"
              inputMode="numeric"
              value={formatMoneyInput(parseMoneyInput(amount), currency)}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={handleAmountKeyDown}
              className="text-2xl font-bold"
            />
          </div>
          <ReceiptAttachButton
            receiptUrl={receiptUrl}
            onUpload={(url) => setReceiptUrl(url)}
            onRemove={() => setReceiptUrl(null)}
          />
        </div>

        {/* Wallet Selection */}
        <div data-testid="select-wallet">
          <label className="block text-sm font-medium text-text-secondary mb-2">{t('common.wallet')}</label>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label={t('common.wallet')}>
            {wallets.map((w) => {
              const isActive = walletId === w.id;
              const isHighlighted = highlightedWalletId === w.id;
              return (
                <button
                  key={w.id}
                  type="button"
                  ref={(el) => { walletItemRefs.current[w.id] = el; }}
                  data-testid={`select-wallet-${w.id}`}
                  role="button"
                  aria-pressed={isActive}
                  tabIndex={isHighlighted ? 0 : -1}
                  onClick={() => { setWalletId(w.id); setWalletFocusIndex(walletNavIds.indexOf(w.id)); }}
                  onKeyDown={(e) =>
                    handleGridItemKeyDown(
                      e,
                      walletNavIds.indexOf(w.id),
                      walletNavIds,
                      setWalletFocusIndex,
                      walletItemRefs,
                      activateWallet,
                      () => focusCategory(categoryFocusIndex)
                    )
                  }
                  className={`p-3 rounded-xl text-left transition-all border-2 ${FOCUS_RING} ${
                    isActive ? 'border-primary bg-primary/10' : 'border-secondary bg-secondary'
                  }`}
                >
                  <p className="font-semibold text-sm text-text-primary truncate">{w.name}</p>
                  <p className="text-xs text-text-secondary">{formatWalletType(w.type)}</p>
                </button>
              );
            })}
            <button
              type="button"
              ref={(el) => { walletItemRefs.current[ADD_WALLET_KEY] = el; }}
              data-testid="add-wallet-inline-btn"
              tabIndex={highlightedWalletId === ADD_WALLET_KEY ? 0 : -1}
              onClick={() => setShowAddWallet(true)}
              onKeyDown={(e) =>
                handleGridItemKeyDown(
                  e,
                  walletNavIds.length - 1,
                  walletNavIds,
                  setWalletFocusIndex,
                  walletItemRefs,
                  activateWallet,
                  () => focusCategory(categoryFocusIndex)
                )
              }
              className={`flex items-center justify-center gap-1.5 p-3 rounded-xl border-2 border-dashed border-secondary text-text-secondary hover:border-primary hover:text-primary transition-all ${FOCUS_RING}`}
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
         <div data-testid="select-category">
           <label className="block text-sm font-medium text-text-secondary mb-2">{t('common.category')}</label>
           <div className="grid grid-cols-4 gap-2" role="group" aria-label={t('common.category')}>
             {filteredCategories.map((cat) => {
               const Icon = getIcon(cat.icon);
               const isActive = category === cat.id;
               const isHighlighted = highlightedCategoryId === cat.id;
               return (
                 <button
                   key={cat.id}
                   type="button"
                   ref={(el) => { categoryItemRefs.current[cat.id] = el; }}
                   data-testid={`select-category-${cat.id}`}
                   role="button"
                   aria-pressed={isActive}
                   tabIndex={isHighlighted ? 0 : -1}
                   onClick={() => { setCategory(cat.id); setCategoryFocusIndex(categoryNavIds.indexOf(cat.id)); }}
                   onKeyDown={(e) =>
                     handleGridItemKeyDown(
                       e,
                       categoryNavIds.indexOf(cat.id),
                       categoryNavIds,
                       setCategoryFocusIndex,
                       categoryItemRefs,
                       activateCategory,
                       () => dateTriggerRef.current?.focus()
                     )
                   }
                   className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all border-2 ${FOCUS_RING} ${
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
               ref={(el) => { categoryItemRefs.current[ADD_CATEGORY_KEY] = el; }}
               data-testid="add-category-inline-btn"
               tabIndex={highlightedCategoryId === ADD_CATEGORY_KEY ? 0 : -1}
               onClick={() => setShowAddCategory(true)}
               onKeyDown={(e) =>
                 handleGridItemKeyDown(
                   e,
                   categoryNavIds.length - 1,
                   categoryNavIds,
                   setCategoryFocusIndex,
                   categoryItemRefs,
                   activateCategory,
                   () => dateTriggerRef.current?.focus()
                 )
               }
               className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border-2 border-dashed border-secondary text-text-secondary hover:border-primary hover:text-primary transition-all ${FOCUS_RING}`}
             >
                <Plus className="w-4 h-4" />
                <span className="text-[10px] font-semibold text-center leading-tight">{t('tx.addCategory')}</span>
             </button>
           </div>
         </div>


        <div data-testid="select-date">
          <label className="block text-sm font-medium text-text-secondary mb-2">{t('tx.date')}</label>
          <CustomDatePicker
            value={transactionDate}
            onChange={setTransactionDate}
            open={datePickerOpen}
            onClose={handleDatePickerClose}
          />
          <button
            type="button"
            ref={dateTriggerRef}
            data-testid="select-date-trigger"
            aria-haspopup="dialog"
            aria-expanded={datePickerOpen}
            onClick={() => setDatePickerOpen(true)}
            onKeyDown={handleDateTriggerKeyDown}
            className={`w-full flex items-center justify-between px-4 py-3 bg-secondary/50 border border-secondary/35 rounded-xl hover:border-primary/50 transition-all font-medium text-sm text-text-primary min-h-[48px] ${FOCUS_RING}`}
          >
            <span>{transactionDate || t('tx.date')}</span>
            <span className="text-primary font-bold text-xs">Change</span>
          </button>
        </div>

        {/* Note */}
        <Input
          ref={noteRef}
          data-testid="input-notes"
          aria-label={t('tx.noteOptional')}
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

        <Button
          fullWidth
          data-testid="submit-transaction-btn"
          onClick={handleSubmit}
          disabled={loading}
          className={FOCUS_RING}
        >
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
