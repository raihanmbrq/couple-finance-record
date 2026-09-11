import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  type FocusEvent,
  type KeyboardEvent,
  type MutableRefObject,
} from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';
import { AddWalletSheet } from '@/components/AddWalletSheet';
import { CreateCategorySheet } from '@/components/CreateCategorySheet';
import { getIcon } from '@/lib/icons';
import { formatMoneyInput, parseMoneyInput } from '@/lib/format';
import { getCurrencySymbol } from '@/lib/currencies';
import { uploadReceipt } from '@/lib/receiptUpload';
import { type TransactionType } from '@/lib/types';
import { ARROW_DIRECTIONS, getNextGridIndex } from '@/lib/gridNav';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarDays,
  ChevronRight,
  FileText,
  ImagePlus,
  Loader2,
  Plus,
  Tag,
  Trash2,
  Wallet as WalletIcon,
  X,
} from 'lucide-react';

interface DesktopAddTransactionModalProps {
  /** Controls visibility of the desktop Add Transaction dialog. */
  isOpen: boolean;
  /** Requests the dialog to close (backdrop click, Escape, or after submit). */
  onClose: () => void;
}

/**
 * Grid geometry — declared as constants so the CSS `grid-cols-*` and the 2D
 * arrow-key navigation math can never drift apart.
 */
const WALLET_COLUMNS = 3;
const CATEGORY_COLUMNS = 4;

// Sentinel ids let the inline "add" actions join the same arrow-key grid matrix.
const ADD_WALLET_KEY = '__add_wallet__';
const ADD_CATEGORY_KEY = '__add_category__';

const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

export function DesktopAddTransactionModal({ isOpen, onClose }: DesktopAddTransactionModalProps) {
  const { wallets, walletTypes, categories, profile, household, addTransaction } = useApp();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const currency = profile?.currency ?? 'IDR';

  const dialogRef = useRef<HTMLDivElement>(null);
  // Keeps Tab / Shift+Tab cycling inside the dialog while it is open.
  useFocusTrap(dialogRef, isOpen);

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
  const [draggingReceipt, setDraggingReceipt] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  // Roving-tabindex highlight — the cell that currently owns `tabIndex={0}`.
  const [walletFocusIndex, setWalletFocusIndex] = useState(0);
  const [categoryFocusIndex, setCategoryFocusIndex] = useState(0);

  const amountRef = useRef<HTMLInputElement>(null);
  const dateTriggerRef = useRef<HTMLButtonElement>(null);
  const noteRef = useRef<HTMLInputElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const walletItemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const categoryItemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const submitRef = useRef<(() => Promise<void>) | null>(null);

  const formatWalletType = (walletType: string) => {
    const row = walletTypes.find((wt) => wt.id === walletType);
    if (row) return row.name;
    return walletType.charAt(0).toUpperCase() + walletType.slice(1);
  };

  const filteredCategories = useMemo(
    () => categories.filter((cat) => cat.type === 'both' || cat.type === type),
    [categories, type]
  );

  // Grid items = real entries followed by the inline "add" sentinel, in visual order.
  const walletIds = useMemo(() => [...wallets.map((w) => w.id), ADD_WALLET_KEY], [wallets]);
  const categoryIds = useMemo(
    () => [...filteredCategories.map((c) => c.id), ADD_CATEGORY_KEY],
    [filteredCategories]
  );

  // Resolve the roving highlight to a currently-rendered cell even after the list
  // shrinks (e.g. switching expense ⇄ income filters categories down).
  const highlightedWalletId = walletIds[walletFocusIndex] ?? walletIds[0] ?? '';
  const highlightedCategoryId = categoryIds[categoryFocusIndex] ?? categoryIds[0] ?? '';

  // Grouped, locale-formatted amount for the hero field + a width that keeps the
  // number visually centred (and never collapses while it is still empty).
  const formattedAmount = formatMoneyInput(parseMoneyInput(amount), currency);
  const currencySymbol = getCurrencySymbol(currency);

  // Live-preview data for the left panel.
  const selectedWallet = wallets.find((w) => w.id === walletId) ?? null;
  const selectedCategory = categories.find((c) => c.id === category) ?? null;
  const SelectedCategoryIcon = selectedCategory ? getIcon(selectedCategory.icon) : Tag;

  // Auto-select the first wallet and keep the roving highlight on the selection.
  useEffect(() => {
    if (!walletId && wallets.length > 0) setWalletId(wallets[0].id);
  }, [wallets, walletId]);

  useEffect(() => {
    const idx = wallets.findIndex((w) => w.id === walletId);
    if (idx >= 0) setWalletFocusIndex(idx);
  }, [walletId, wallets]);

  useEffect(() => {
    const idx = filteredCategories.findIndex((c) => c.id === category);
    if (idx >= 0) setCategoryFocusIndex(idx);
  }, [category, filteredCategories]);

  // Step 1 — focus the Amount field the moment the dialog opens and place the
  // caret at the end, so the field is immediately type-ready (no select-all).
  useEffect(() => {
    if (!isOpen) return;
    const raf = requestAnimationFrame(() => {
      const el = amountRef.current;
      if (!el) return;
      el.focus();
      const end = el.value.length;
      el.setSelectionRange(end, end);
    });
    return () => cancelAnimationFrame(raf);
  }, [isOpen]);

  const reset = () => {
    setType('expense');
    setAmount('');
    setCategory('food');
    setNotes('');
    setReceiptUrl(null);
    setTransactionDate(new Date().toISOString().slice(0, 10));
    setError('');
  };

  // ── Focus helpers for the two grid matrices ────────────────────────────────
  const focusWallet = useCallback(
    (index?: number) => {
      const idx = Math.max(0, Math.min(index ?? walletFocusIndex, walletIds.length - 1));
      walletItemRefs.current[walletIds[idx]]?.focus();
    },
    [walletIds, walletFocusIndex]
  );

  const focusCategory = useCallback(
    (index?: number) => {
      const idx = Math.max(0, Math.min(index ?? categoryFocusIndex, categoryIds.length - 1));
      categoryItemRefs.current[categoryIds[idx]]?.focus();
    },
    [categoryIds, categoryFocusIndex]
  );

  const activateWallet = (id: string) => {
    if (id === ADD_WALLET_KEY) setShowAddWallet(true);
    else setWalletId(id);
  };

  const activateCategory = (id: string) => {
    if (id === ADD_CATEGORY_KEY) setShowAddCategory(true);
    else setCategory(id);
  };

  /**
   * Shared Arrow/Enter/Space/Tab logic. The active index comes from the focused
   * cell's `data-nav-index`, so a single listener on the grid container is enough.
   */
  const handleGridKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    ids: string[],
    columns: number,
    setIndex: (n: number) => void,
    refs: MutableRefObject<Record<string, HTMLButtonElement | null>>,
    activate: (id: string) => void,
    onForwardTab: () => void
  ) => {
    const index = Number((event.target as HTMLElement).dataset.navIndex);
    if (Number.isNaN(index)) return;

    const direction = ARROW_DIRECTIONS[event.key];
    if (direction) {
      event.preventDefault();
      const next = getNextGridIndex(index, ids.length, columns, direction);
      setIndex(next);
      refs.current[ids[next]]?.focus();
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activate(ids[index]);
      return;
    }

    if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault();
      onForwardTab();
    }
  };

  // Keep the caret collapsed at the end of the value whenever the field is
  // focused — prevents the browser leaving a full-text blue selection block
  // covering the amount on keyboard / auto focus.
  const handleAmountFocus = (event: FocusEvent<HTMLInputElement>) => {
    const end = event.currentTarget.value.length;
    event.currentTarget.setSelectionRange(end, end);
  };

  // Step 2 — Tab from Amount jumps straight to the wallet grid.
  const handleAmountKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault();
      focusWallet();
    }
  };

  // Step 5 — Enter/Space opens the inline calendar; Tab moves on to the note field.
  const handleDateTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setDatePickerOpen((prev) => !prev);
    } else if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault();
      noteRef.current?.focus();
    }
  };

  const handleDatePickerClose = useCallback(() => {
    setDatePickerOpen(false);
    requestAnimationFrame(() => dateTriggerRef.current?.focus());
  }, []);

  // Escape closes without submitting (nested overlays stop propagation first).
  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      event.preventDefault();
      onClose();
    }
  };

  // Step 7 — Ctrl/Cmd + Enter submits from anywhere inside the form.
  const handleFormKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      if (datePickerOpen || showAddWallet || showAddCategory) return;
      event.preventDefault();
      if (!loading) void submitRef.current?.();
    }
  };

  const handleReceiptFile = async (file: File) => {
    setUploadingReceipt(true);
    try {
      const url = await uploadReceipt(file);
      setReceiptUrl(url);
      showToast(t('tx.receiptUploaded'));
    } catch {
      showToast(t('tx.receiptFailed'), 'error');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmit = async () => {
    const parsedAmount = parseMoneyInput(amount);
    if (!parsedAmount) {
      setError(t('tx.enterAmount'));
      amountRef.current?.focus();
      return;
    }
    if (!walletId) {
      setError(t('tx.selectWallet'));
      focusWallet();
      return;
    }

    setError('');
    setLoading(true);
    try {
      await addTransaction({
        wallet_id: walletId,
        amount: parsedAmount,
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
      // Hand focus back to the dashboard shell for continued keyboard use.
      requestAnimationFrame(() => {
        document.querySelector<HTMLElement>('[data-testid="desktop-dashboard-main"]')?.focus();
      });
    } catch {
      setError(t('tx.failedSave'));
    } finally {
      setLoading(false);
    }
  };

  // Keep the Ctrl/Cmd+Enter handler pointed at the latest submit closure.
  submitRef.current = handleSubmit;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6"
      data-testid="desktop-add-transaction-overlay"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="desktop-add-transaction-title"
        data-testid="desktop-add-transaction-modal"
        onKeyDown={handleDialogKeyDown}
        className="relative z-10 grid h-[min(88vh,760px)] w-full max-w-4xl grid-cols-1 overflow-hidden rounded-2xl border border-border bg-surface shadow-float animate-scale-in md:grid-cols-[35%_65%]"
      >
        {/* ══ LEFT PANEL — live preview + receipt attachment ══════════════ */}
        <aside className="hidden min-h-0 flex-col gap-5 overflow-y-auto border-r border-border bg-secondary/30 p-6 md:flex">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              {t('tx.preview')}
            </span>
            <Badge color={type === 'expense' ? 'expense' : 'income'}>
              {type === 'expense' ? t('common.expense') : t('common.income')}
            </Badge>
          </div>

          {/* Live amount preview */}
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-1 text-text-primary">
              <span className="text-xl font-bold">{currencySymbol}</span>
              <span className="break-all text-4xl font-extrabold tabular-nums">
                {formattedAmount || '0'}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-text-muted">{transactionDate}</p>
          </div>

          {/* Selection summary */}
          <div className="space-y-4 rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-text-secondary">
                <WalletIcon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  {t('common.wallet')}
                </p>
                <p className="truncate text-sm font-semibold text-text-primary">
                  {selectedWallet ? selectedWallet.name : '—'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-text-secondary">
                <SelectedCategoryIcon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  {t('common.category')}
                </p>
                <p className="truncate text-sm font-semibold text-text-primary">
                  {selectedCategory ? selectedCategory.name : '—'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-text-secondary">
                <CalendarDays className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  {t('tx.date')}
                </p>
                <p className="truncate text-sm font-semibold text-text-primary">{transactionDate || '—'}</p>
              </div>
            </div>
          </div>

          {/* Receipt drag & drop / upload */}
          <div className="mt-auto space-y-2">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              <ImagePlus className="h-3.5 w-3.5" />
              {t('tx.attachReceipt')}
            </p>
            <input
              ref={receiptInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleReceiptFile(file);
                event.target.value = '';
              }}
            />
            {receiptUrl ? (
              <div className="relative overflow-hidden rounded-xl border border-border">
                <img
                  src={receiptUrl}
                  alt={t('tx.receiptPreview')}
                  className="h-40 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setReceiptUrl(null)}
                  data-testid="remove-receipt-btn"
                  aria-label={t('common.delete')}
                  className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-surface/80 text-text-secondary transition-colors hover:bg-surface ${FOCUS_RING}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                data-testid="receipt-dropzone"
                onClick={() => receiptInputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDraggingReceipt(true);
                }}
                onDragLeave={() => setDraggingReceipt(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDraggingReceipt(false);
                  const file = event.dataTransfer.files?.[0];
                  if (file) void handleReceiptFile(file);
                }}
                disabled={uploadingReceipt}
                className={`flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-center transition-all ${FOCUS_RING} ${
                  draggingReceipt
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-secondary/40 text-text-muted hover:border-primary/60 hover:text-text-secondary'
                }`}
              >
                {uploadingReceipt ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-xs font-medium">{t('tx.receiptUploading')}</span>
                  </>
                ) : (
                  <>
                    <ImagePlus className="h-6 w-6" />
                    <span className="text-xs font-medium">{t('tx.attachReceipt')}</span>
                    <span className="text-[10px] text-text-muted">{t('tx.receiptDropHint')}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </aside>

        {/* ══ RIGHT PANEL — interactive form ══════════════════════════════ */}
        <div className="flex min-h-0 flex-col">
          {/* Header */}
          <div className="flex shrink-0 items-center gap-3 border-b border-border px-6 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Plus className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2
                id="desktop-add-transaction-title"
                className="font-display text-base font-bold leading-tight text-text-primary"
              >
                {t('tx.addTitle')}
              </h2>
              <p className="truncate text-xs text-text-muted">
                {household?.name ? `${household.name} · ` : ''}
                {t('tx.loggedBy')} {profile?.full_name ?? t('common.me')}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              data-testid="close-add-transaction-modal"
              aria-label={t('common.close')}
              className={`shrink-0 rounded-xl p-2 text-text-secondary transition-colors hover:bg-secondary hover:text-text-primary ${FOCUS_RING}`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable form body */}
          <div
            data-testid="desktop-add-transaction-form"
            onKeyDown={handleFormKeyDown}
            className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5"
          >

            {/* Type selector — segmented control */}
            <div
              className="grid grid-cols-2 gap-1 rounded-2xl bg-secondary p-1"
              role="group"
              aria-label={t('tx.addTitle')}
            >
              <button
                type="button"
                data-testid="type-expense"
                aria-pressed={type === 'expense'}
                onClick={() => setType('expense')}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${FOCUS_RING} ${
                  type === 'expense'
                    ? 'bg-surface text-expense shadow-soft'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <ArrowDownCircle className="h-4 w-4" />
                {t('common.expense')}
              </button>
              <button
                type="button"
                data-testid="type-income"
                aria-pressed={type === 'income'}
                onClick={() => setType('income')}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${FOCUS_RING} ${
                  type === 'income'
                    ? 'bg-surface text-income shadow-soft'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <ArrowUpCircle className="h-4 w-4" />
                {t('common.income')}
              </button>
            </div>

            {/* Amount — same field style as the mobile sheet, but with no focus
                ring/box: the caret is the only focus indicator (per request). */}
            <Input
              ref={amountRef}
              data-testid="input-amount"
              aria-label={t('common.amount')}
              label={t('common.amount')}
              prefix={currencySymbol}
              placeholder="0"
              inputMode="numeric"
              value={formattedAmount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={handleAmountKeyDown}
              onFocus={handleAmountFocus}
              className="text-2xl font-bold selection:bg-transparent selection:text-text-primary focus:border-secondary focus:ring-0"
            />

            {/* Step 3 — Wallet grid (2D arrow navigation, 3 columns) */}
            <section data-testid="select-wallet" aria-labelledby="desktop-add-tx-wallet-label">
              <label
                id="desktop-add-tx-wallet-label"
                className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted"
              >
                <WalletIcon className="h-3.5 w-3.5" />
                {t('common.wallet')}
              </label>
              <div
                role="group"
                aria-label={t('common.wallet')}
                className="grid grid-cols-3 gap-3"
                onKeyDown={(event) =>
                  handleGridKeyDown(
                    event,
                    walletIds,
                    WALLET_COLUMNS,
                    setWalletFocusIndex,
                    walletItemRefs,
                    activateWallet,
                    () => focusCategory()
                  )
                }
              >
                {wallets.map((wallet, index) => {
                  const isActive = walletId === wallet.id;
                  const isHighlighted = highlightedWalletId === wallet.id;
                  return (
                    <button
                      key={wallet.id}
                      type="button"
                      ref={(el) => { walletItemRefs.current[wallet.id] = el; }}
                      data-testid={`select-wallet-${wallet.id}`}
                      data-nav-index={index}
                      role="button"
                      aria-pressed={isActive}
                      tabIndex={isHighlighted ? 0 : -1}
                      onClick={() => { setWalletId(wallet.id); setWalletFocusIndex(index); }}
                      className={`flex min-h-[60px] flex-col items-start gap-1.5 rounded-xl border-2 p-3 text-left transition-all ${FOCUS_RING} ${
                        isActive
                          ? 'border-primary bg-primary/10 ring-2 ring-primary'
                          : 'border-border bg-secondary/60 hover:border-primary/50'
                      }`}
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-text-secondary">
                        <WalletIcon className="h-3.5 w-3.5" />
                      </span>
                      <span className="w-full min-w-0">
                        <span className="block truncate text-xs font-semibold text-text-primary">{wallet.name}</span>
                        <span className="block truncate text-[10px] text-text-muted">
                          {formatWalletType(wallet.type)}
                        </span>
                      </span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  ref={(el) => { walletItemRefs.current[ADD_WALLET_KEY] = el; }}
                  data-testid="add-wallet-inline-btn"
                  data-nav-index={wallets.length}
                  tabIndex={highlightedWalletId === ADD_WALLET_KEY ? 0 : -1}
                  onClick={() => setShowAddWallet(true)}
                  className={`flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border p-3 text-text-muted transition-all hover:border-primary hover:text-primary ${FOCUS_RING}`}
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-[10px] font-semibold">{t('tx.addNewWallet')}</span>
                </button>
              </div>
              {wallets.length === 0 && (
                <p className="mt-2 text-xs text-text-muted">{t('tx.noWalletsYet')}</p>
              )}
            </section>

            {/* Step 4 — Category grid (2D arrow navigation, 4 columns) */}
            <section data-testid="select-category" aria-labelledby="desktop-add-tx-category-label">
              <label
                id="desktop-add-tx-category-label"
                className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted"
              >
                <Tag className="h-3.5 w-3.5" />
                {t('common.category')}
              </label>
              <div
                role="group"
                aria-label={t('common.category')}
                className="grid grid-cols-4 gap-3"
                onKeyDown={(event) =>
                  handleGridKeyDown(
                    event,
                    categoryIds,
                    CATEGORY_COLUMNS,
                    setCategoryFocusIndex,
                    categoryItemRefs,
                    activateCategory,
                    () => dateTriggerRef.current?.focus()
                  )
                }
              >
                {filteredCategories.map((cat, index) => {
                  const Icon = getIcon(cat.icon);
                  const isActive = category === cat.id;
                  const isHighlighted = highlightedCategoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      ref={(el) => { categoryItemRefs.current[cat.id] = el; }}
                      data-testid={`select-category-${cat.id}`}
                      data-nav-index={index}
                      role="button"
                      aria-pressed={isActive}
                      tabIndex={isHighlighted ? 0 : -1}
                      onClick={() => { setCategory(cat.id); setCategoryFocusIndex(index); }}
                      className={`flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 p-2 transition-all ${FOCUS_RING} ${
                        isActive
                          ? 'border-primary bg-primary/10 ring-2 ring-primary'
                          : 'border-border bg-secondary/60 hover:border-primary/50'
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          isActive ? 'bg-primary/20 text-primary' : 'bg-secondary text-text-secondary'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span
                        className={`w-full truncate text-center text-[10px] font-medium leading-tight ${
                          isActive ? 'text-primary' : 'text-text-secondary'
                        }`}
                      >
                        {cat.name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  ref={(el) => { categoryItemRefs.current[ADD_CATEGORY_KEY] = el; }}
                  data-testid="add-category-inline-btn"
                  data-nav-index={filteredCategories.length}
                  tabIndex={highlightedCategoryId === ADD_CATEGORY_KEY ? 0 : -1}
                  onClick={() => setShowAddCategory(true)}
                  className={`flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border p-2 text-text-muted transition-all hover:border-primary hover:text-primary ${FOCUS_RING}`}
                >
                  <Plus className="h-4 w-4" />
                  <span className="w-full truncate text-center text-[10px] font-semibold leading-tight">
                    {t('tx.addCategory')}
                  </span>
                </button>
              </div>
            </section>

            {/* Step 5 — Date trigger + inline calendar (anchored beneath) */}
            <section data-testid="select-date">
              <label className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                <CalendarDays className="h-3.5 w-3.5" />
                {t('tx.date')}
              </label>
              <button
                type="button"
                ref={dateTriggerRef}
                data-testid="select-date-trigger"
                aria-haspopup="dialog"
                aria-expanded={datePickerOpen}
                onClick={() => setDatePickerOpen((prev) => !prev)}
                onKeyDown={handleDateTriggerKeyDown}
                className={`flex min-h-[46px] w-full items-center gap-3 rounded-xl border border-border bg-secondary/60 px-4 py-3 text-sm font-medium text-text-primary transition-all hover:border-primary/60 ${FOCUS_RING}`}
              >
                <CalendarDays className="h-4 w-4 shrink-0 text-text-secondary" />
                <span className="flex-1 text-left">{transactionDate || t('tx.date')}</span>
                <ChevronRight
                  className={`h-4 w-4 shrink-0 text-text-secondary transition-transform ${
                    datePickerOpen ? 'rotate-90' : ''
                  }`}
                />
              </button>
              <CustomDatePicker
                value={transactionDate}
                onChange={setTransactionDate}
                open={datePickerOpen}
                onClose={handleDatePickerClose}
                variant="inline"
              />
            </section>

            {/* Step 6 — Note */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                <FileText className="h-3.5 w-3.5" />
                {t('tx.noteOptional')}
              </label>
              <Input
                ref={noteRef}
                data-testid="input-notes"
                aria-label={t('tx.noteOptional')}
                placeholder={t('tx.notePlaceholder')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Sticky footer */}
          <div className="shrink-0 space-y-3 border-t border-border bg-surface px-6 py-4">
            {error && (
              <p className="text-sm text-expense" role="alert" data-testid="add-transaction-error">
                {error}
              </p>
            )}

            <Button
              type="button"
              fullWidth
              data-testid="submit-transaction-btn"
              onClick={handleSubmit}
              disabled={loading}
              className={FOCUS_RING}
            >
              {loading ? t('goals.saving') : t('tx.saveTransaction')}
            </Button>
            <p className="text-center text-[11px] text-text-muted">
              Ctrl/⌘ + Enter — {t('tx.saveTransaction')}
            </p>
          </div>
        </div>
      </div>

      {/* Nested create sheets live at the overlay level so their own sheets and
          focus traps layer above this dialog. */}
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
    </div>
  );
}








