import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatIDR, formatIDRShort, formatRelative } from '@/lib/format';
import { getCategory, type Wallet, type WalletType } from '@/lib/types';
import { TrendingUp, TrendingDown, Wallet as WalletIcon, Plus, ArrowUpRight, ArrowDownRight, Landmark, Smartphone, Banknote, PiggyBank } from 'lucide-react';
import { useState } from 'react';
import { AddTransactionSheet } from '@/components/AddTransactionSheet';
import { AddWalletSheet } from '@/components/AddWalletSheet';
import { WalletActionSheet } from '@/components/WalletActionSheet';

const walletTypeConfig: Record<WalletType, { icon: typeof WalletIcon; color: string; bg: string }> = {
  joint: { icon: PiggyBank, color: 'text-teal-600', bg: 'bg-teal-50' },
  cash: { icon: Banknote, color: 'text-amber-600', bg: 'bg-amber-50' },
  bank: { icon: Landmark, color: 'text-blue-600', bg: 'bg-blue-50' },
  ewallet: { icon: Smartphone, color: 'text-purple-600', bg: 'bg-purple-50' },
};

export function HomeScreen() {
  const { wallets, transactions, profile, isDemo } = useApp();
  const [showAddTx, setShowAddTx] = useState(false);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [activeWallet, setActiveWallet] = useState<Wallet | null>(null);

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  // This month's income/expense
  const now = new Date();
  const monthTx = transactions.filter(t => {
    const d = new Date(t.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthIncome = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const monthExpense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const recentTx = transactions.slice(0, 5);

  return (
    <div className="px-5 py-5 space-y-5">
      {/* Total Balance Hero */}
      <Card elevated className="bg-gradient-to-br from-teal-700 to-teal-800 border-0 text-white p-5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-teal-100 text-sm font-medium">Total Balance</span>
          {isDemo && <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">DEMO</span>}
        </div>
        <p className="font-display font-extrabold text-3xl mb-4">{formatIDR(totalBalance)}</p>
        <div className="flex gap-3">
          <div className="flex-1 bg-white/10 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowUpRight className="w-4 h-4 text-green-300" />
              <span className="text-xs text-teal-100">Income</span>
            </div>
            <p className="font-bold text-sm">{formatIDRShort(monthIncome)}</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowDownRight className="w-4 h-4 text-red-300" />
              <span className="text-xs text-teal-100">Expense</span>
            </div>
            <p className="font-bold text-sm">{formatIDRShort(monthExpense)}</p>
          </div>
        </div>
      </Card>

      {/* Quick Action */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowAddTx(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-teal-700 text-white font-semibold shadow-card hover:bg-teal-800 active:scale-[0.98] transition-all"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
          Add Transaction
        </button>
      </div>

      {/* Wallets */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-stone-800">My Wallets</h3>
          <button
            onClick={() => setShowAddWallet(true)}
            className="text-sm font-semibold text-teal-700 flex items-center gap-1"
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
                className="text-left"
              >
                <Card className="p-4">
                  <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${cfg.color}`} />
                  </div>
                  <p className="text-xs text-stone-500 font-medium mb-0.5 truncate">{wallet.name}</p>
                  <p className="font-display font-bold text-stone-800 text-lg">{formatIDRShort(wallet.balance)}</p>
                </Card>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="font-display font-bold text-stone-800 mb-3">Recent Activity</h3>
        <Card className="divide-y divide-stone-100">
          {recentTx.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-6">No transactions yet</p>
          ) : (
            recentTx.map((tx) => {
              const cat = getCategory(tx.category);
              const isIncome = tx.type === 'income';
              return (
                <div key={tx.id} className="flex items-center gap-3 p-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isIncome ? 'bg-green-50' : 'bg-cream-100'}`}>
                    {isIncome ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-stone-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-stone-800 truncate">{tx.notes || cat?.label || tx.category}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-400">{formatRelative(tx.created_at)}</span>
                      <Badge color="stone" className="text-[10px] py-0.5">{tx.spent_by}</Badge>
                    </div>
                  </div>
                  <p className={`font-bold text-sm ${isIncome ? 'text-green-600' : 'text-stone-700'}`}>
                    {isIncome ? '+' : '-'}{formatIDRShort(tx.amount)}
                  </p>
                </div>
              );
            })
          )}
        </Card>
      </div>

      <AddTransactionSheet open={showAddTx} onClose={() => setShowAddTx(false)} />
      <AddWalletSheet open={showAddWallet} onClose={() => setShowAddWallet(false)} />
      <WalletActionSheet wallet={activeWallet} open={Boolean(activeWallet)} onClose={() => setActiveWallet(null)} />
    </div>
  );
}
