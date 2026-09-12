import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { formatMoney, formatDate } from '@/lib/format';
import { getCategory, type Transaction } from '@/lib/types';
import { resolveCategoryMeta } from '@/lib/categoryStyle';
import { CategoryChip } from '@/components/desktop/ui/CategoryChip';
import { CustomDesktopDropdown } from '@/components/desktop/ui/CustomDesktopDropdown';
import { EditTransactionSheet } from '@/components/EditTransactionSheet';
import { 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Edit3, 
  Trash2, 
  X,
  Filter,
  Receipt,
  AlertTriangle,
  Rows2,
  Rows3,
  ZoomIn
} from 'lucide-react';

interface TransactionsDataGridProps {
  dateFilter?: string | null;
  categoryFilter?: string | null;
  loggedByFilter?: string | null;
  onDateFilterConsumed?: () => void;
}

const localDayKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const TransactionsDataGrid: React.FC<TransactionsDataGridProps> = ({
  dateFilter,
  categoryFilter,
  loggedByFilter,
  onDateFilterConsumed,
}) => {
  const { transactions, wallets, categories, householdMembers, deleteTransaction, profile } = useApp();
  const currency = profile?.currency || 'IDR';

  // View density toggle (persisted)
  const [density, setDensity] = useState<'compact' | 'comfortable'>(() => {
    return (localStorage.getItem('pf_grid_density') as 'compact' | 'comfortable') || 'comfortable';
  });

  // Hover-zoom preview for receipt thumbnails (fixed-position, never clipped)
  const [hoverReceipt, setHoverReceipt] = useState<string | null>(null);

  // Allow the Command Palette to prefill the grid search.
  useEffect(() => {
    const handleExternalSearch = (e: Event) => {
      const query = (e as CustomEvent<string>).detail;
      if (typeof query === 'string') setSearchQuery(query);
    };
    window.addEventListener('pf:grid-search', handleExternalSearch);
    return () => window.removeEventListener('pf:grid-search', handleExternalSearch);
  }, []);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWallet, setSelectedWallet] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (!dateFilter) return;
    setSelectedDate(dateFilter);
    onDateFilterConsumed?.();
  }, [dateFilter, onDateFilterConsumed]);

  useEffect(() => {
    if (categoryFilter) setSelectedCategory(categoryFilter);
    if (loggedByFilter) setSelectedMember(loggedByFilter);
  }, [categoryFilter, loggedByFilter]);

  // Sorting state
  const [sortColumn, setSortColumn] = useState<'date' | 'amount' | 'category'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Modals state
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deleteTxTarget, setDeleteTxTarget] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Dropdown options
  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'income', label: 'Income Only' },
    { value: 'expense', label: 'Expense Only' },
  ];

  const walletOptions = [
    { value: 'all', label: 'All Wallets' },
    ...wallets.map((w) => ({ value: w.id, label: w.name })),
  ];

  const memberOptions = [
    { value: 'all', label: 'All Members' },
    ...householdMembers.map((m) => {
      const name = m.profile?.full_name || m.profile?.role || 'Member';
      return { value: name, label: name };
    }),
  ];

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'food', label: 'Food & Groceries' },
    { value: 'bills', label: 'Bills & Utilities' },
    { value: 'shopping', label: 'Shopping' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'transport', label: 'Transport' },
    { value: 'health', label: 'Health & Medical' },
    { value: 'education', label: 'Education' },
    { value: 'salary', label: 'Salary' },
    { value: 'other', label: 'Other' },
  ];

  // Filtering Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const categoryLabel = getCategory(tx.category)?.label.toLowerCase() || '';
        const notesMatch = tx.notes?.toLowerCase().includes(query) || false;
        const spentByMatch = tx.spent_by?.toLowerCase().includes(query) || false;
        const walletMatch = tx.wallet_name?.toLowerCase().includes(query) || false;
        const amountMatch = tx.amount.toString().includes(query);
        if (!categoryLabel.includes(query) && !notesMatch && !spentByMatch && !walletMatch && !amountMatch) {
          return false;
        }
      }

      if (selectedWallet !== 'all' && tx.wallet_id !== selectedWallet) {
        return false;
      }

      if (selectedCategory !== 'all' && tx.category !== selectedCategory) {
        return false;
      }

      if (selectedMember !== 'all' && tx.spent_by?.toLowerCase() !== selectedMember.toLowerCase()) {
        return false;
      }

      if (selectedType !== 'all' && tx.type !== selectedType) {
        return false;
      }

      if (selectedDate) {
        const txDate = localDayKey(new Date(tx.transaction_date || tx.created_at));
        if (txDate !== selectedDate) return false;
      }

      return true;
    });
  }, [transactions, searchQuery, selectedWallet, selectedCategory, selectedMember, selectedType, selectedDate]);

  // Sorting Logic
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      let result = 0;
      if (sortColumn === 'date') {
        const dateA = new Date(a.transaction_date || a.created_at).getTime();
        const dateB = new Date(b.transaction_date || b.created_at).getTime();
        result = dateA - dateB;
      } else if (sortColumn === 'amount') {
        result = a.amount - b.amount;
      } else if (sortColumn === 'category') {
        result = (a.category || '').localeCompare(b.category || '');
      }

      return sortDirection === 'asc' ? result : -result;
    });
  }, [filteredTransactions, sortColumn, sortDirection]);

  const handleSort = (column: 'date' | 'amount' | 'category') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTxTarget) return;
    setIsDeleting(true);
    try {
      await deleteTransaction(deleteTxTarget.id);
      setDeleteTxTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div data-testid="transactions-data-grid" className="space-y-4">
      {/* Top Filter & Toolbar Bar */}
      <div className="bg-surface p-4 rounded-2xl border border-border space-y-3 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Real-time Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="grid-search-input"
              placeholder="Search by notes, category, wallet, spent by, or amount..."
              className="w-full pl-10 pr-4 py-2 bg-surface-hover/70 border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* View Density Toggle */}
            <div
              data-testid="grid-density-toggle"
              className="flex items-center gap-0.5 bg-surface-hover p-1 rounded-xl border border-border"
              role="group"
              aria-label="Table density"
            >
              <button
                type="button"
                onClick={() => {
                  setDensity('compact');
                  localStorage.setItem('pf_grid_density', 'compact');
                }}
                title="Compact"
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  density === 'compact' ? 'bg-accent text-accent-text' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <Rows3 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Compact</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDensity('comfortable');
                  localStorage.setItem('pf_grid_density', 'comfortable');
                }}
                title="Comfortable"
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  density === 'comfortable' ? 'bg-accent text-accent-text' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <Rows2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Comfortable</span>
              </button>
            </div>

            <div className="text-xs text-text-muted font-medium">
              Showing <span className="font-bold text-text-primary">{sortedTransactions.length}</span> of {transactions.length} transactions
            </div>
          </div>
        </div>

        {/* Custom Design Dropdown Filters Toolbar */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 text-text-muted font-semibold mr-1">
            <Filter className="w-3.5 h-3.5 text-accent" />
            <span>Filters:</span>
          </div>

          {/* Custom Type Dropdown */}
          <CustomDesktopDropdown
            options={typeOptions}
            value={selectedType}
            onChange={(val) => setSelectedType(val as any)}
            testId="grid-filter-type"
          />

          {/* Custom Wallet Dropdown */}
          <CustomDesktopDropdown
            options={walletOptions}
            value={selectedWallet}
            onChange={setSelectedWallet}
            testId="grid-filter-wallet"
          />

          {/* Custom Member Dropdown */}
          <CustomDesktopDropdown
            options={memberOptions}
            value={selectedMember}
            onChange={setSelectedMember}
            testId="grid-filter-member"
          />

          {/* Custom Category Dropdown */}
          <CustomDesktopDropdown
            options={categoryOptions}
            value={selectedCategory}
            onChange={setSelectedCategory}
            testId="grid-filter-category"
          />

          {selectedDate && (
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-accent/30 bg-accent/10 text-[11px] font-semibold text-accent transition-colors hover:bg-accent/15"
              title="Clear date filter"
            >
              <span>Date: {formatDate(`${selectedDate}T00:00:00`)}</span>
              <X className="w-3 h-3" />
            </button>
          )}

          {(selectedWallet !== 'all' || selectedCategory !== 'all' || selectedMember !== 'all' || selectedType !== 'all' || searchQuery || selectedDate) && (
            <button
              onClick={() => {
                setSelectedWallet('all');
                setSelectedCategory('all');
                setSelectedMember('all');
                setSelectedType('all');
                setSearchQuery('');
                setSelectedDate(null);
              }}
              className="px-2.5 py-1.5 text-[11px] text-rose-500 hover:bg-rose-500/10 rounded-xl font-medium transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Dense Data Table */}
      <div className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table data-grid-density={density} className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-hover/60 border-b border-border text-text-muted select-none">
                <th 
                  onClick={() => handleSort('date')}
                  className="py-3 px-4 font-bold cursor-pointer hover:text-text-primary transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Date</span>
                    {sortColumn === 'date' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-accent" /> : <ArrowDown className="w-3 h-3 text-accent" />
                    ) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('category')}
                  className="py-3 px-4 font-bold cursor-pointer hover:text-text-primary transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Category</span>
                    {sortColumn === 'category' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-accent" /> : <ArrowDown className="w-3 h-3 text-accent" />
                    ) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                  </div>
                </th>
                <th className="py-3 px-4 font-bold">Wallet</th>
                <th className="py-3 px-4 font-bold">Logged By</th>
                <th className="py-3 px-4 font-bold">Notes</th>
                <th className="py-3 px-4 font-bold text-center">Receipt</th>
                <th 
                  onClick={() => handleSort('amount')}
                  className="py-3 px-4 font-bold text-right cursor-pointer hover:text-text-primary transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Amount</span>
                    {sortColumn === 'amount' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-accent" /> : <ArrowDown className="w-3 h-3 text-accent" />
                    ) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                  </div>
                </th>
                <th className="py-3 px-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {sortedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-text-muted">
                    No transactions found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                sortedTransactions.map((tx) => {
                  const catMeta = resolveCategoryMeta(tx.category, categories);
                  const isIncome = tx.type === 'income';

                  return (
                    <tr 
                      key={tx.id}
                      data-testid={`transaction-row-${tx.id}`}
                      className="hover:bg-surface-hover/50 transition-colors group"
                    >
                      <td className="py-3 px-4 font-medium text-text-primary whitespace-nowrap">
                        {formatDate(tx.transaction_date || tx.created_at)}
                      </td>

                      <td className="py-3 px-4 font-medium text-text-primary whitespace-nowrap">
                        <CategoryChip categoryKey={tx.category} iconName={catMeta.icon} label={catMeta.label} />
                      </td>

                      <td className="py-3 px-4 text-text-muted whitespace-nowrap">
                        {tx.wallet_name || 'Wallet'}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full bg-accent/15 text-accent text-[11px] font-semibold capitalize">
                          {tx.spent_by || 'Partner'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-text-muted max-w-xs truncate">
                        {tx.notes || '-'}
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {tx.receipt_url ? (
                          <span
                            className="inline-flex"
                            onMouseEnter={() => setHoverReceipt(tx.receipt_url!)}
                            onMouseLeave={() => setHoverReceipt(null)}
                          >
                            <button
                              onClick={() => setReceiptUrl(tx.receipt_url!)}
                              title="View Receipt"
                              data-testid={`receipt-thumb-${tx.id}`}
                              className="rounded-md border border-border overflow-hidden cursor-zoom-in hover:ring-2 hover:ring-accent transition-all inline-flex"
                            >
                              <img
                                src={tx.receipt_url}
                                alt="Receipt"
                                width={28}
                                height={28}
                                className="w-7 h-7 object-cover"
                              />
                            </button>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-hover text-text-muted text-[10px] font-medium border border-border/60">
                            <Receipt className="w-3 h-3" />
                            No Receipt
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-extrabold whitespace-nowrap">
                        <span className={isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          {isIncome ? '+' : '-'}{formatMoney(tx.amount, currency)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingTx(tx)}
                            title="Edit Transaction"
                            className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTxTarget(tx)}
                            title="Delete Transaction"
                            className="p-1.5 rounded-lg hover:bg-rose-500/15 text-text-muted hover:text-rose-500 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Receipt Hover-Zoom Preview */}
      {hoverReceipt && (
        <div
          data-testid="receipt-hover-zoom"
          className="fixed bottom-6 right-6 z-[70] pointer-events-none w-64 rounded-2xl overflow-hidden border border-border shadow-2xl bg-surface p-1.5 animate-fade-in"
        >
          <div className="flex items-center justify-center gap-1.5 px-1 pb-1.5 pt-0.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
            <ZoomIn className="w-3 h-3 text-accent" />
            Receipt preview
          </div>
          <img
            src={hoverReceipt}
            alt="Receipt zoom preview"
            className="w-full h-44 object-contain rounded-xl bg-black/10"
          />
        </div>
      )}

      {/* Receipt Modal Preview */}
      {receiptUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative bg-surface p-4 rounded-2xl max-w-lg w-full border border-border shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
                <Receipt className="w-4 h-4 text-accent" />
                <span>Receipt Attachment Preview</span>
              </div>
              <button 
                onClick={() => setReceiptUrl(null)} 
                className="p-1.5 rounded-xl hover:bg-surface-hover text-text-muted hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-black/10 rounded-xl p-2">
              <img src={receiptUrl} alt="Receipt attachment" className="max-w-full max-h-[65vh] object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}

      {/* Edit Transaction Sheet (PWA Edit Component) */}
      <EditTransactionSheet
        open={Boolean(editingTx)}
        transaction={editingTx}
        onClose={() => setEditingTx(null)}
      />

      {/* Delete Confirmation Popup Modal */}
      {deleteTxTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-surface p-6 rounded-2xl max-w-sm w-full border border-border shadow-2xl space-y-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-text-primary">Delete Transaction?</h3>
              <p className="text-xs text-text-muted">
                Are you sure you want to delete this transaction for <strong className="text-text-primary">{formatMoney(deleteTxTarget.amount, currency)}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTxTarget(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-border text-text-muted hover:bg-surface-hover transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
