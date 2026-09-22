import { useMemo, useState, useEffect, type ReactNode } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { AddTransactionSheet } from '@/components/AddTransactionSheet';
import { EditTransactionSheet } from '@/components/EditTransactionSheet';
import { ExportReportSheet } from '@/components/ExportReportSheet';
import { CustomSelectSheet } from '@/components/ui/CustomSelectSheet';
import { CustomDateRangePicker } from '@/components/ui/CustomDateRangePicker';
import { WalletBrandIcon } from '@/components/ui/WalletBrandIcon';
import { WALLET_BRAND_MAP } from '@/lib/walletBrands';
import { walletTypeIcon } from '@/lib/walletIcons';
import { getCategory, type Wallet } from '@/lib/types';
import { formatDate, formatDateRange, formatMoney } from '@/lib/format';
import { Search, Receipt, X, FileDown, Calendar, ChevronDown, Wallet as WalletIcon, Tags, Users, Pencil, Trash2, ArrowRightLeft } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getIcon } from '@/lib/icons';
import { TransactionDetailSheet } from '@/components/TransactionDetailSheet';
import { TransferBadge, transferRouteLabel } from '@/components/ui/TransferBadge';

const localDayKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const shiftDayKey = (key: string, delta: number): string => {
  const d = new Date(`${key}T00:00:00`);
  d.setDate(d.getDate() + delta);
  return localDayKey(d);
};

type FilterOption = { value: string; label: string; icon?: ReactNode; badge?: ReactNode; section?: string };

function FilterPill({ icon: Icon, label, active, onClick, onClear }: { icon: LucideIcon; label: string; active: boolean; onClick: () => void; onClear?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-all touch-manipulation ${
        active ? 'bg-primary/10 text-primary border-primary/30' : 'bg-secondary/60 text-text-secondary border-secondary hover:bg-secondary'
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="max-w-[160px] truncate">{label}</span>
      {active && onClear ? (
        <span
          role="button"
          aria-label="Clear filter"
          onClick={(e) => { e.stopPropagation(); onClear(); }}
          className="p-0.5 rounded-full hover:bg-primary/15"
        >
          <X className="w-3.5 h-3.5" />
        </span>
      ) : (
        <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
      )}
    </button>
  );
}

function walletIconNode(w: Wallet) {
  if (w.icon && WALLET_BRAND_MAP[w.icon]) {
    return (
      <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
        <WalletBrandIcon brand={w.icon} className="w-6 h-6 object-contain" />
      </div>
    );
  }
  const Icon = walletTypeIcon(w.type);
  return (
    <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
      <Icon className="w-5 h-5 text-text-secondary" />
    </div>
  );
}

export function TransactionsScreen({ dateFilter, onDateFilterConsumed }: { dateFilter?: string | null; onDateFilterConsumed?: () => void }) {
  const { transactions, wallets, categories, householdMembers, household, profile, deleteTransaction } = useApp();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const currency = profile?.currency ?? 'IDR';
  const isCircle = householdMembers.length > 1 || household?.mode === 'couple';
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [filterWallet, setFilterWallet] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterLoggedBy, setFilterLoggedBy] = useState('all');
  const [dateRange, setDateRange] = useState<{ start: string | null; end: string | null }>({ start: null, end: null });
  const [dateRangeDraft, setDateRangeDraft] = useState<{ start: string | null; end: string | null }>({ start: null, end: null });
  const [showWalletSheet, setShowWalletSheet] = useState(false);
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [showLoggedBySheet, setShowLoggedBySheet] = useState(false);
  const [showDateSheet, setShowDateSheet] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<(typeof transactions)[number] | null>(null);
  const [detailTransaction, setDetailTransaction] = useState<(typeof transactions)[number] | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<(typeof transactions)[number] | null>(null);

  // Apply date filter coming from another screen (e.g. Home calendar), then consume it.
  useEffect(() => {
    if (dateFilter) {
      setDateRange({ start: dateFilter, end: dateFilter });
      onDateFilterConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter]);

  const walletMap = useMemo(() => {
    const map = new Map(wallets.map(w => [w.id, w]));
    return map;
  }, [wallets]);

  // Resolve a wallet's display name. Falls back to the name snapshot stored on
  // the transaction so history keeps its wallet label even after the wallet
  // was deleted (archived) and is no longer part of the wallets list.
  const resolveWalletName = (walletId: string): string | null => {
    if (!walletId) return null;
    const w = walletMap.get(walletId);
    if (w) return w.name;
    const tx = transactions.find((t) => t.wallet_id === walletId);
    return tx?.wallet_name ?? null;
  };

  const walletOptions = useMemo(() => {
    // Only show wallets that have at least one transaction.
    const usedIds = new Set(transactions.map(tx => tx.wallet_id));
    const opts: FilterOption[] = [
      { value: 'all', label: t('tx.allWallets'), icon: <WalletIcon className="w-5 h-5 text-text-secondary" /> },
    ];
    for (const w of wallets) {
      if (!usedIds.has(w.id) || w.user_id !== profile?.id) continue;
      opts.push({ value: w.id, label: w.name, section: t('tx.myWallets'), icon: walletIconNode(w) });
    }
    for (const w of wallets) {
      if (!usedIds.has(w.id) || w.user_id === profile?.id) continue;
      const owner = householdMembers.find((m) => m.user_id === w.user_id)?.profile?.full_name;
      opts.push({
        value: w.id,
        label: w.name,
        section: t('tx.memberWallets'),
        icon: walletIconNode(w),
        badge: owner ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary text-text-secondary">{owner.split(' ')[0]}</span>
        ) : undefined,
      });
    }
    return opts;
  }, [wallets, householdMembers, profile, transactions, t]);

  const categoryOptions = useMemo(() => {
    // Only show categories that have at least one transaction.
    const usedIds = new Set(transactions.map(tx => tx.category));
    const opts: FilterOption[] = [
      { value: 'all', label: t('tx.allCategories'), icon: <Tags className="w-5 h-5 text-text-secondary" /> },
    ];
    for (const c of categories) {
      if (!usedIds.has(c.id)) continue;
      const Icon = getIcon(c.icon);
      const isIncome = c.type === 'income';
      const isBoth = c.type === 'both';
      opts.push({
        value: c.id,
        label: c.name,
        icon: (
          <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
            <Icon className="w-4.5 h-4.5 text-text-secondary" />
          </div>
        ),
        badge: (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isBoth ? 'bg-secondary text-text-secondary' : isIncome ? 'bg-income/10 text-income' : 'bg-expense/10 text-expense'}`}>
            {isBoth ? t('cat.typeBoth') : isIncome ? t('cat.typeIncome') : t('cat.typeExpense')}
          </span>
        ),
      });
    }
    return opts;
  }, [categories, transactions, t]);

  const loggedByOptions = useMemo(() => {
    const opts: FilterOption[] = [
      { value: 'all', label: t('tx.allPeople'), icon: <Users className="w-5 h-5 text-text-secondary" /> },
    ];
    const seen = new Set<string>();
    const memberByFullName = new Map(
      householdMembers.map((m) => [m.profile?.full_name, m] as [string | undefined, typeof m]),
    );
    for (const tx of transactions) {
      const name = tx.spent_by;
      if (!name || seen.has(name)) continue;
      seen.add(name);
      const member = memberByFullName.get(name);
      opts.push({
        value: name,
        label: name,
        icon: (
          <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
            {member?.profile?.avatar_url ? (
              <img src={member.profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-text-secondary">{name.charAt(0).toUpperCase()}</span>
            )}
          </div>
        ),
        badge: name === profile?.full_name ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">{t('common.me')}</span>
        ) : undefined,
      });
    }
    return opts;
  }, [transactions, householdMembers, profile, t]);

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      if (dateRange.start && dateRange.end) {
        const day = localDayKey(new Date(tx.transaction_date || tx.created_at));
        if (day < dateRange.start || day > dateRange.end) return false;
      }
      if (filterWallet !== 'all' && tx.wallet_id !== filterWallet) return false;
      if (filterCategory !== 'all' && tx.category !== filterCategory) return false;
      if (filterLoggedBy !== 'all' && tx.spent_by !== filterLoggedBy) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchesNote = tx.notes?.toLowerCase().includes(q);
        const matchesCat = tx.category.toLowerCase().includes(q);
        const matchesSpentBy = tx.spent_by.toLowerCase().includes(q);
        if (!matchesNote && !matchesCat && !matchesSpentBy) return false;
      }
      return true;
    });
  }, [transactions, filterWallet, filterCategory, filterLoggedBy, search, dateRange]);

  const hasDateFilter = Boolean(dateRange.start && dateRange.end);
  const hasActiveFilters = filterWallet !== 'all' || filterCategory !== 'all' || filterLoggedBy !== 'all' || search !== '' || hasDateFilter;

  const dateLabel = useMemo(() => {
    const { start, end } = dateRange;
    if (!start || !end) return t('tx.allDates');
    const today = localDayKey(new Date());
    if (start === end && start === today) return t('tx.today');
    if (start === shiftDayKey(today, -6) && end === today) return t('home.last7Days');
    if (start === `${today.slice(0, 7)}-01` && end === today) return t('tx.thisMonth');
    if (start === shiftDayKey(today, -29) && end === today) return t('home.last30Days');
    return formatDateRange(start, end);
  }, [dateRange, t]);

  const openDateSheet = () => {
    setDateRangeDraft(dateRange);
    setShowDateSheet(true);
  };

  const applyDateRange = () => {
    if (dateRangeDraft.start && dateRangeDraft.end) {
      setDateRange({ start: dateRangeDraft.start, end: dateRangeDraft.end });
    } else {
      setDateRange({ start: null, end: null });
    }
  };

  const grouped = useMemo(() => {
    const groups = new Map<string, typeof filtered>();
    for (const tx of filtered) {
      const key = new Date(tx.transaction_date || tx.created_at).toISOString().slice(0, 10);
      const list = groups.get(key) ?? [];
      list.push(tx);
      groups.set(key, list);
    }
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const clearFilters = () => {
    setFilterWallet('all');
    setFilterCategory('all');
    setFilterLoggedBy('all');
    setSearch('');
    setDateRange({ start: null, end: null });
  };

  return (
    <div className="px-5 py-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display font-extrabold text-2xl text-text-primary">{t('tx.title')}</h1>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowExport(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary/10 text-primary font-semibold text-sm hover:bg-primary/20 active:bg-primary/30 transition-colors"
          >
            <FileDown className="w-4 h-4" />
            {t('report.exportBtnShort')}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-secondary" />
        <input
          className="input-field pl-11"
          placeholder={t('tx.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filter pills (wrap so every filter stays visible without side-scrolling) */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterPill
          icon={WalletIcon}
          label={filterWallet === 'all' ? t('tx.allWallets') : (resolveWalletName(filterWallet) ?? t('tx.allWallets'))}
          active={filterWallet !== 'all'}
          onClick={() => setShowWalletSheet(true)}
        />
        <FilterPill
          icon={Tags}
          label={filterCategory === 'all' ? t('tx.allCategories') : (categories.find(c => c.id === filterCategory)?.name ?? t('tx.allCategories'))}
          active={filterCategory !== 'all'}
          onClick={() => setShowCategorySheet(true)}
        />
        {isCircle && (
          <FilterPill
            icon={Users}
            label={filterLoggedBy === 'all' ? t('tx.allPeople') : filterLoggedBy}
            active={filterLoggedBy !== 'all'}
            onClick={() => setShowLoggedBySheet(true)}
          />
        )}
        <FilterPill
          icon={Calendar}
          label={dateLabel}
          active={hasDateFilter}
          onClick={openDateSheet}
          onClear={hasDateFilter ? () => setDateRange({ start: null, end: null }) : undefined}
        />
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-2 rounded-full text-xs font-bold text-expense bg-expense/10 hover:bg-expense/20 transition-colors whitespace-nowrap shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            {t('tx.resetFilters')}
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="text-xs text-text-secondary font-medium">
        {filtered.length === 1 ? t('tx.countOne') : t('tx.countMany', { count: filtered.length })}
      </p>

      {/* Transaction List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-7 h-7" />}
          title={t('tx.notFound')}
          description={hasActiveFilters ? t('tx.adjustFilters') : t('tx.empty')}
        />
      ) : (
        <div className="space-y-4">
          {grouped.map(([dayKey, items]) => {
            const date = new Date(dayKey);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            const label = date.toDateString() === today.toDateString()
              ? t('tx.today')
              : date.toDateString() === yesterday.toDateString()
                ? t('tx.yesterday')
                : formatDate(date);
            return (
              <div key={dayKey} className="space-y-2">
                <p className="px-1 text-xs font-semibold text-text-secondary uppercase tracking-wide">{label}</p>
                <Card className="divide-y divide-secondary">
                  {items.map((tx) => {
                    const cat = getCategory(tx.category);
                    const dynCat = categories.find((c) => c.id === tx.category);
                    const Icon = getIcon(dynCat?.icon ?? cat?.icon ?? 'CircleDot');
                    const wallet = walletMap.get(tx.wallet_id);
                    const walletName = wallet?.name ?? tx.wallet_name ?? null;
                    const isIncome = tx.type === 'income';
                    const isTransfer = tx.type === 'transfer';
                    return (
                      <button
                        key={tx.id}
                        type="button"
                        onClick={() => setDetailTransaction(tx)}
                        className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-secondary/50 transition-colors"
                      >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isTransfer ? 'bg-accent/10' : isIncome ? 'bg-income/10' : 'bg-secondary'
                        }`}>
                          {isTransfer ? (
                            <ArrowRightLeft className="w-5 h-5 text-accent" />
                          ) : (
                            <Icon className={`w-5 h-5 ${isIncome ? 'text-income' : 'text-text-secondary'}`} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-text-primary truncate">
                            {tx.notes || (isTransfer
                              ? transferRouteLabel(tx, (id) => walletMap.get(id)?.name ?? null)
                              : dynCat?.name || cat?.label || tx.category)}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {walletName && <span className="text-xs text-text-secondary">{walletName}</span>}
                            {isTransfer && <TransferBadge transaction={tx} />}
                          </div>
                          <Badge color="secondary" className="text-[10px] py-0.5 mt-0.5">{tx.spent_by}</Badge>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <p className={`font-bold text-sm whitespace-nowrap tabular-nums ${
                            isTransfer ? 'text-text-secondary' : isIncome ? 'text-income' : 'text-text-primary'
                          }`}>
                            {isTransfer ? '' : isIncome ? '+' : '-'}{formatMoney(tx.amount, currency)}
                          </p>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setEditingTransaction(tx); }}
                              className="p-1.5 rounded-lg text-text-secondary hover:bg-secondary transition-colors"
                              aria-label="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setDeletingTransaction(tx); }}
                              className="p-1.5 rounded-lg text-text-secondary hover:bg-expense/10 hover:text-expense transition-colors"
                              aria-label="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </Card>
              </div>
            );
          })}
        </div>
      )}

      <AddTransactionSheet open={showAdd} onClose={() => setShowAdd(false)} />
      <EditTransactionSheet open={Boolean(editingTransaction)} transaction={editingTransaction} onClose={() => setEditingTransaction(null)} />
      <ExportReportSheet open={showExport} onClose={() => setShowExport(false)} />

      {detailTransaction && (() => {
        const dynCat = categories.find((c) => c.id === detailTransaction.category);
        const cat = getCategory(detailTransaction.category);
        const Icon = getIcon(dynCat?.icon ?? cat?.icon ?? 'CircleDot');
        const wallet = walletMap.get(detailTransaction.wallet_id);
        return (
          <TransactionDetailSheet
            open={Boolean(detailTransaction)}
            transaction={detailTransaction}
            onClose={() => setDetailTransaction(null)}
            onEdit={(tx) => { setDetailTransaction(null); setEditingTransaction(tx); }}
            onDelete={(tx) => { setDetailTransaction(null); setDeletingTransaction(tx); }}
            currency={currency}
            walletName={wallet?.name ?? detailTransaction.wallet_name ?? null}
            categoryName={dynCat?.name ?? cat?.label ?? detailTransaction.category}
            categoryIcon={Icon}
          />
        );
      })()}

      {/* Delete Confirmation Modal */}
      {deletingTransaction && (
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
                onClick={() => setDeletingTransaction(null)}
                className="flex-1 py-3 rounded-xl font-semibold text-text-primary bg-secondary hover:bg-secondary/80 transition-all"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await deleteTransaction(deletingTransaction.id);
                    showToast(t('tx.deletedToast'), 'error');
                  } catch {
                    showToast(t('tx.failedDelete'), 'error');
                  }
                  setDeletingTransaction(null);
                }}
                className="flex-1 py-3 rounded-xl font-semibold text-white bg-expense hover:bg-expense/90 transition-all"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter sheets */}
      <CustomSelectSheet
        title={t('tx.filterWallet')}
        open={showWalletSheet}
        onClose={() => setShowWalletSheet(false)}
        value={filterWallet}
        onChange={(val) => setFilterWallet(val)}
        options={walletOptions}
      />
      <CustomSelectSheet
        title={t('tx.filterCategory')}
        open={showCategorySheet}
        onClose={() => setShowCategorySheet(false)}
        value={filterCategory}
        onChange={(val) => setFilterCategory(val)}
        options={categoryOptions}
      />
      {isCircle && (
        <CustomSelectSheet
          title={t('tx.filterLoggedByTitle')}
          open={showLoggedBySheet}
          onClose={() => setShowLoggedBySheet(false)}
          value={filterLoggedBy}
          onChange={(val) => setFilterLoggedBy(val)}
          options={loggedByOptions}
        />
      )}
      <CustomDateRangePicker
        presetMode="recent"
        startDate={dateRangeDraft.start ?? ''}
        endDate={dateRangeDraft.end ?? ''}
        onChange={(s, e) => setDateRangeDraft({ start: s || null, end: e || null })}
        onApply={applyDateRange}
        open={showDateSheet}
        onClose={() => setShowDateSheet(false)}
      />
    </div>
  );
}
