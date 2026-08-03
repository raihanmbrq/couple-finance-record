import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatIDR, formatIDRShort, formatRelative } from '@/lib/format';
import { getCategory, type Wallet, type WalletType } from '@/lib/types';
import { TrendingUp, TrendingDown, Wallet as WalletIcon, Plus, ArrowUpRight, ArrowDownRight, Landmark, Smartphone, Banknote, PiggyBank, ChevronDown, Calendar } from 'lucide-react';
import { useState } from 'react';
import { getIcon } from '@/lib/icons';
import { AddWalletSheet } from '@/components/AddWalletSheet';
import { WalletActionSheet } from '@/components/WalletActionSheet';
import { EditTransactionSheet } from '@/components/EditTransactionSheet';

const walletTypeConfig: Record<WalletType, { icon: typeof WalletIcon; color: string; bg: string }> = {
  joint: { icon: PiggyBank, color: 'text-primary', bg: 'bg-primary/10' },
  cash: { icon: Banknote, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  bank: { icon: Landmark, color: 'text-blue-600', bg: 'bg-blue-50' },
  ewallet: { icon: Smartphone, color: 'text-purple-600', bg: 'bg-purple-50' },
};

export function HomeScreen() {
  const { wallets, transactions, profile, isDemo } = useApp();
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [activeWallet, setActiveWallet] = useState<Wallet | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<(typeof transactions)[number] | null>(null);
  const [timeFilter, setTimeFilter] = useState<'1 Bulan Penuh' | 'Last 30 Days' | 'Last 7 Days' | 'Todays'>('1 Bulan Penuh');
  const now = new Date();
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  const selectedMonthDate = new Date(`${selectedMonth}-01T00:00:00`);
  const monthName = selectedMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  // This month's income/expense
  const monthTx = transactions.filter(t => {
    const d = new Date(t.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthIncome = monthTx.filter(t => t.type === 'income' && t.category !== 'transfer').reduce((s, t) => s + t.amount, 0);
  const monthExpense = monthTx.filter(t => t.type === 'expense' && t.category !== 'transfer').reduce((s, t) => s + t.amount, 0);

  const recentTx = transactions.slice(0, 5);

  const incomeStr = formatIDRShort(monthIncome);
  const expenseStr = formatIDRShort(monthExpense);

  const filteredBreakdownTx = transactions.filter(t => {
    if (t.type !== 'expense') return false;
    if (t.category === 'transfer') return false;
    const txDate = new Date(t.transaction_date || t.created_at);
    
    if (timeFilter === '1 Bulan Penuh') {
      return txDate.getMonth() === selectedMonthDate.getMonth() && txDate.getFullYear() === selectedMonthDate.getFullYear();
    } else if (timeFilter === 'Last 30 Days') {
      const diffTime = now.getTime() - txDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 30;
    } else if (timeFilter === 'Last 7 Days') {
      const diffTime = now.getTime() - txDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    } else if (timeFilter === 'Todays') {
      return txDate.getDate() === now.getDate() && txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    }
    return false;
  });

  const totalFilteredExpense = filteredBreakdownTx.reduce((sum, t) => sum + t.amount, 0);

  const expenseByCategory = filteredBreakdownTx.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const breakdownData = Object.entries(expenseByCategory)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalFilteredExpense > 0 ? (amount / totalFilteredExpense) * 100 : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="px-5 py-5 space-y-5">
      {/* Total Balance Hero */}
      <Card elevated className="bg-total-balance border-0 text-white p-5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-text-secondary-dark text-sm font-medium">Total Balance</span>
          {isDemo && <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">DEMO</span>}
        </div>
        <p className="font-display font-extrabold text-3xl mb-4">{formatIDR(totalBalance)}</p>
        <div className="flex gap-3">
          <div className="flex-1 bg-white/10 rounded-xl p-3 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowUpRight className="w-4 h-4 text-income-dark shrink-0" />
              <span className="text-xs text-text-secondary-dark truncate">Income</span>
            </div>
            <p className={`font-bold truncate ${incomeStr.length > 13 ? 'text-xs' : 'text-sm'}`}>{incomeStr}</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl p-3 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowDownRight className="w-4 h-4 text-expense-dark shrink-0" />
              <span className="text-xs text-text-secondary-dark truncate">Expense</span>
            </div>
            <p className={`font-bold truncate ${expenseStr.length > 13 ? 'text-xs' : 'text-sm'}`}>{expenseStr}</p>
          </div>
        </div>
      </Card>

      {/* Wallets */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-text-primary">My Wallets</h3>
          <button
            onClick={() => setShowAddWallet(true)}
            className="text-sm font-semibold text-primary flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {wallets.map((wallet) => {
            const cfg = walletTypeConfig[wallet.type];
            const Icon = cfg.icon;
            return (
              <button
                key={wallet.id}
                type="button"
                onClick={() => setActiveWallet(wallet)}
                className="text-left min-w-0"
              >
                <Card className="p-4 overflow-hidden">
                  <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${cfg.color}`} />
                  </div>
                  <p className="text-xs text-text-secondary font-medium mb-0.5 truncate">{wallet.name}</p>
                  <p className="font-display font-bold text-text-primary truncate text-xs">
                    {formatIDRShort(wallet.balance)}
                  </p>
                </Card>
              </button>
            );
          })}
        </div>
      </div>

      {/* Expense Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-text-primary">Expense Breakdown</h3>
          <div className="flex items-center gap-2">
            {timeFilter === '1 Bulan Penuh' && (
              <div className="relative w-8 h-8 flex items-center justify-center bg-secondary border border-secondary rounded-lg hover:border-primary/50 transition-colors">
                <Calendar className="w-4 h-4 text-text-secondary" />
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            )}
            <div className="relative">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
                className="appearance-none bg-secondary border border-secondary text-text-secondary text-xs font-semibold py-1.5 pl-3 pr-8 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="1 Bulan Penuh">{monthName}</option>
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="Todays">Todays</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-text-secondary absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
        <Card className="p-1">
          {breakdownData.length === 0 ? (
            <p className="text-sm text-text-secondary text-center py-6">No expenses for this period</p>
          ) : (
            <div className="divide-y divide-secondary">
              {breakdownData.map((item) => {
                const catInfo = getCategory(item.category);
                const Icon = getIcon(catInfo?.icon || 'CircleDot');
                
                return (
                  <div key={item.category} className="flex items-center gap-3 p-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-end mb-1.5">
                        <p className="font-semibold text-sm text-text-primary truncate pr-2">
                          {catInfo?.label || item.category}
                        </p>
                        <p className="font-bold text-sm text-text-primary">
                          {formatIDRShort(item.amount)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full" 
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-text-secondary w-8 text-right">
                          {item.percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="font-display font-bold text-text-primary mb-3">Recent Activity</h3>
        <Card className="divide-y divide-secondary">
          {recentTx.length === 0 ? (
            <p className="text-sm text-text-secondary text-center py-6">No transactions yet</p>
          ) : (
            recentTx.map((tx) => {
              const cat = getCategory(tx.category);
              const isIncome = tx.type === 'income';
              return (
                <button
                  key={tx.id}
                  type="button"
                  onClick={() => setEditingTransaction(tx)}
                  className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-secondary transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isIncome ? 'bg-income/10' : 'bg-secondary'}`}>
                    {isIncome ? (
                      <TrendingUp className="w-5 h-5 text-income" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-text-secondary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="font-semibold text-sm text-text-primary truncate mb-0.5">{tx.notes || cat?.label || tx.category}</p>
                    <p className="text-[11px] text-text-secondary truncate">{tx.spent_by}</p>
                    <p className="text-[10px] text-text-secondary/70 truncate">{formatRelative(tx.created_at)}</p>
                  </div>
                  <div className="shrink-0 flex items-center">
                    <p className={`font-bold ${formatIDRShort(tx.amount).length > 12 ? 'text-xs' : 'text-sm'} ${isIncome ? 'text-income' : 'text-text-primary'}`}>
                      {isIncome ? '+' : '-'}{formatIDRShort(tx.amount)}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </Card>
      </div>

      <AddWalletSheet open={showAddWallet} onClose={() => setShowAddWallet(false)} />
      <WalletActionSheet wallet={activeWallet} open={Boolean(activeWallet)} onClose={() => setActiveWallet(null)} />
      <EditTransactionSheet open={Boolean(editingTransaction)} transaction={editingTransaction} onClose={() => setEditingTransaction(null)} />
    </div>
  );
}
