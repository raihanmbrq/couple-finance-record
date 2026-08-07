import { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { AddTransactionSheet } from '@/components/AddTransactionSheet';
import { EditTransactionSheet } from '@/components/EditTransactionSheet';
import { getCategory } from '@/lib/types';
import { formatDate, formatMoney, formatRelative } from '@/lib/format';
import { Plus, Search, Filter, TrendingUp, TrendingDown, Receipt, X } from 'lucide-react';
import { getIcon } from '@/lib/icons';

export function TransactionsScreen() {
  const { transactions, wallets, categories, profile } = useApp();
  const currency = profile?.currency ?? 'IDR';
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [filterWallet, setFilterWallet] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<(typeof transactions)[number] | null>(null);

  const walletMap = useMemo(() => {
    const map = new Map(wallets.map(w => [w.id, w]));
    return map;
  }, [wallets]);

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      if (filterWallet !== 'all' && tx.wallet_id !== filterWallet) return false;
      if (filterCategory !== 'all' && tx.category !== filterCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchesNote = tx.notes?.toLowerCase().includes(q);
        const matchesCat = tx.category.toLowerCase().includes(q);
        const matchesSpentBy = tx.spent_by.toLowerCase().includes(q);
        if (!matchesNote && !matchesCat && !matchesSpentBy) return false;
      }
      return true;
    });
  }, [transactions, filterWallet, filterCategory, search]);

  const hasActiveFilters = filterWallet !== 'all' || filterCategory !== 'all' || search !== '';

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
    setSearch('');
  };

  return (
    <div className="px-5 py-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display font-extrabold text-2xl text-stone-800">Transactions</h1>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-stone-400" />
        <input
          className="input-field pl-11"
          placeholder="Search transactions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${
            showFilters || hasActiveFilters ? 'bg-teal-50 text-teal-700' : 'text-stone-400 hover:bg-cream-100'
          }`}
        >
          <Filter className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="p-4 space-y-3 animate-fade-in">
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-2">WALLET</label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterWallet('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  filterWallet === 'all' ? 'bg-teal-700 text-white' : 'bg-cream-100 text-stone-500'
                }`}
              >
                All
              </button>
              {wallets.map(w => (
                <button
                  key={w.id}
                  onClick={() => setFilterWallet(w.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    filterWallet === w.id ? 'bg-teal-700 text-white' : 'bg-cream-100 text-stone-500'
                  }`}
                >
                  {w.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-2">CATEGORY</label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterCategory('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  filterCategory === 'all' ? 'bg-teal-700 text-white' : 'bg-cream-100 text-stone-500'
                }`}
              >
                All
              </button>
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setFilterCategory(c.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    filterCategory === c.id ? 'bg-teal-700 text-white' : 'bg-cream-100 text-stone-500'
                  }`}
                >
                  {c.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-red-500 font-semibold">
              <X className="w-3.5 h-3.5" />
              Clear filters
            </button>
          )}
        </Card>
      )}

      {/* Results count */}
      <p className="text-xs text-stone-400 font-medium">
        {filtered.length} {filtered.length === 1 ? 'transaction' : 'transactions'}
      </p>

      {/* Transaction List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-7 h-7" />}
          title="No transactions found"
          description={hasActiveFilters ? "Try adjusting your filters" : "No transactions have been added yet"}
        />
      ) : (
        <div className="space-y-4">
          {grouped.map(([dayKey, items]) => {
            const date = new Date(dayKey);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            const label = date.toDateString() === today.toDateString()
              ? 'Today'
              : date.toDateString() === yesterday.toDateString()
                ? 'Yesterday'
                : formatDate(date);
            return (
              <div key={dayKey} className="space-y-2">
                <p className="px-1 text-xs font-semibold text-stone-500 uppercase tracking-wide">{label}</p>
                <Card className="divide-y divide-stone-100">
                  {items.map((tx) => {
                    const cat = getCategory(tx.category);
                    const dynCat = categories.find((c) => c.id === tx.category);
                    const Icon = getIcon(dynCat?.icon ?? cat?.icon ?? 'CircleDot');
                    const wallet = walletMap.get(tx.wallet_id);
                    const isIncome = tx.type === 'income';
                    return (
                      <button
                        key={tx.id}
                        type="button"
                        onClick={() => setEditingTransaction(tx)}
                        className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-cream-50 transition-colors"
                      >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isIncome ? 'bg-green-50' : 'bg-cream-100'
                        }`}>
                          <Icon className={`w-5 h-5 ${isIncome ? 'text-green-600' : 'text-stone-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-stone-800 truncate">{tx.notes || dynCat?.name || cat?.label || tx.category}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-stone-400">{formatRelative(tx.created_at)}</span>
                            {wallet && <span className="text-xs text-stone-400">· {wallet.name}</span>}
                          </div>
                          <Badge color="secondary" className="text-[10px] py-0.5 mt-0.5">{tx.spent_by}</Badge>
                        </div>
                        <p className={`font-bold text-sm whitespace-nowrap ${isIncome ? 'text-green-600' : 'text-stone-700'}`}>
                          {isIncome ? '+' : '-'}{formatMoney(tx.amount, currency)}
                        </p>
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
    </div>
  );
}
