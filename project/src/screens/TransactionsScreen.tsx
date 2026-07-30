import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { AddTransactionSheet } from '@/components/AddTransactionSheet';
import { getCategory, CATEGORIES } from '@/lib/types';
import { formatIDR, formatRelative } from '@/lib/format';
import { Plus, Search, Filter, TrendingUp, TrendingDown, Receipt, X } from 'lucide-react';
import { getIcon } from '@/lib/icons';

export function TransactionsScreen() {
  const { transactions, wallets } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [filterWallet, setFilterWallet] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

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
        <button
          onClick={() => setShowAdd(true)}
          className="w-10 h-10 rounded-full bg-teal-700 text-white flex items-center justify-center shadow-card hover:bg-teal-800 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
        </button>
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
              {CATEGORIES.map(c => (
                <button
                  key={c.key}
                  onClick={() => setFilterCategory(c.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    filterCategory === c.key ? 'bg-teal-700 text-white' : 'bg-cream-100 text-stone-500'
                  }`}
                >
                  {c.label.split(' ')[0]}
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
          description={hasActiveFilters ? "Try adjusting your filters" : "Add your first transaction to get started"}
          action={<Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4 inline mr-1" />
            Add Transaction
          </Button>}
        />
      ) : (
        <Card className="divide-y divide-stone-100">
          {filtered.map((tx) => {
            const cat = getCategory(tx.category);
            const Icon = getIcon(cat?.icon ?? 'CircleDot');
            const wallet = walletMap.get(tx.wallet_id);
            const isIncome = tx.type === 'income';
            return (
              <div key={tx.id} className="flex items-center gap-3 p-3.5">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isIncome ? 'bg-green-50' : 'bg-cream-100'
                }`}>
                  <Icon className={`w-5 h-5 ${isIncome ? 'text-green-600' : 'text-stone-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-stone-800 truncate">{tx.notes || cat?.label || tx.category}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-stone-400">{formatRelative(tx.created_at)}</span>
                    {wallet && <span className="text-xs text-stone-400">· {wallet.name}</span>}
                  </div>
                  <Badge color="stone" className="text-[10px] py-0.5 mt-0.5">{tx.spent_by}</Badge>
                </div>
                <p className={`font-bold text-sm whitespace-nowrap ${isIncome ? 'text-green-600' : 'text-stone-700'}`}>
                  {isIncome ? '+' : '-'}{formatIDR(tx.amount)}
                </p>
              </div>
            );
          })}
        </Card>
      )}

      <AddTransactionSheet open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}
