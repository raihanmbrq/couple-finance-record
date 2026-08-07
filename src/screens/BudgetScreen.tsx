import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Input } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { getCategory, type Budget } from '@/lib/types';
import { formatMoney, formatMoneyInput, parseMoneyInput } from '@/lib/format';
import { getCurrencySymbol } from '@/lib/currencies';
import { Plus, PiggyBank, Trash2, Target } from 'lucide-react';
import { getIcon } from '@/lib/icons';
import { useToast } from '@/context/ToastContext';
import { GoalsSection } from '@/components/GoalsSection';

export function BudgetScreen() {
  const { budgets, transactions, setBudget, deleteBudget, categories, profile } = useApp();
  const currency = profile?.currency ?? 'IDR';
  const { showToast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [editCategory, setEditCategory] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [deleteBudgetTarget, setDeleteBudgetTarget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(false);

  // Calculate spent per category this month
  const spentByCategory = useMemo(() => {
    const now = new Date();
    const map = new Map<string, number>();
    transactions
      .filter(t => t.type === 'expense')
      .filter(t => {
        const d = new Date(t.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .forEach(t => {
        map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
      });
    return map;
  }, [transactions]);

  const totalBudget = budgets.reduce((s, b) => s + b.limit_amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + (spentByCategory.get(b.category) ?? 0), 0);
  const totalRemaining = totalBudget - totalSpent;

  const isLargeBudget = totalBudget >= 100_000_000;

  const handleSetBudget = async () => {
    if (!editCategory) return;
    const amt = parseMoneyInput(editAmount);
    if (!amt) return;
    setLoading(true);
    try {
      await setBudget(editCategory, amt);
      setEditCategory(null);
      setEditAmount('');
      setShowAdd(false);
      showToast('Budget berhasil disimpan');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (category: string, currentLimit: number) => {
    setEditCategory(category);
    setEditAmount(currentLimit ? formatMoneyInput(currentLimit, currency) : '');
    setShowAdd(true);
  };

  const openAdd = () => {
    setEditCategory(null);
    setEditAmount('');
    setShowAdd(true);
  };

  const handleDeleteBudget = async () => {
    if (!deleteBudgetTarget) return;
    setLoading(true);
    try {
      await deleteBudget(deleteBudgetTarget.id);
      setDeleteBudgetTarget(null);
      showToast('Budget berhasil dihapus', 'error');
    } finally {
      setLoading(false);
    }
  };

  const availableCategories = categories
    .filter((c) => c.type === 'expense' || c.type === 'both')
    .filter((c) => !budgets.some(b => b.category === c.id))
    .filter((c) => c.id !== 'salary')
    .map((c) => ({ key: c.id, label: c.name, icon: c.icon, color: 'stone' }));

  return (
    <div className="px-5 py-5 space-y-5">
       <div className="flex items-center justify-between">
         <h1 className="font-display font-extrabold text-2xl text-text-primary">Set Budgets</h1>
         <button
           onClick={openAdd}
           disabled={availableCategories.length === 0}
           className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-card hover:bg-primary-hover active:scale-95 transition-all disabled:opacity-40"
         >
           <Plus className="w-5 h-5" strokeWidth={2.5} />
         </button>
       </div>

       {/* Monthly Recap Summary */}
       <Card elevated className="bg-gradient-to-br from-text-primary to-text-primary/90 border-0 text-white p-5">
         <div className="flex items-center gap-2 mb-3">
           <Target className="w-5 h-5 text-warning" />
           <span className="text-text-secondary-dark text-sm font-medium">Monthly Recap</span>
         </div>
         <div className={isLargeBudget ? 'flex flex-col gap-3' : 'grid grid-cols-3 gap-3'}>
           <div className={isLargeBudget ? 'flex justify-between items-center bg-white/5 rounded-lg p-2.5' : ''}>
             <p className={`text-xs text-text-secondary-dark ${isLargeBudget ? '' : 'mb-1'}`}>Budget</p>
              <p className="font-display font-bold text-xs">{formatMoney(totalBudget, currency)}</p>
           </div>
           <div className={isLargeBudget ? 'flex justify-between items-center bg-white/5 rounded-lg p-2.5' : ''}>
             <p className={`text-xs text-text-secondary-dark ${isLargeBudget ? '' : 'mb-1'}`}>Spent</p>
              <p className="font-display font-bold text-xs text-expense-dark">{formatMoney(totalSpent, currency)}</p>
           </div>
           <div className={isLargeBudget ? 'flex justify-between items-center bg-white/5 rounded-lg p-2.5' : ''}>
             <p className={`text-xs text-text-secondary-dark ${isLargeBudget ? '' : 'mb-1'}`}>Remaining</p>
             <p className={`font-display font-bold text-xs ${totalRemaining >= 0 ? 'text-income-dark' : 'text-expense-dark'}`}>
                {formatMoney(totalRemaining, currency)}
             </p>
           </div>
         </div>
        </Card>
      {/* Budget List */}
      {budgets.length === 0 ? (
        <EmptyState
          icon={<PiggyBank className="w-7 h-7" />}
          title="No budgets set"
          description="Set monthly spending limits per category to track your progress."
          action={<Button size="sm" onClick={openAdd}>
            <Plus className="w-4 h-4 inline mr-1" />
            Set Budget
          </Button>}
        />
      ) : (
        <div className="space-y-3">
          {budgets.map((budget) => {
            const spent = spentByCategory.get(budget.category) ?? 0;
            const pct = budget.limit_amount > 0 ? (spent / budget.limit_amount) * 100 : 0;
            const remaining = budget.limit_amount - spent;
            const cat = getCategory(budget.category);
            const Icon = getIcon(cat?.icon ?? 'CircleDot');

            return (
              <Card key={budget.id} className="p-4">
                 <div className="flex items-center justify-between mb-3">
                   <div className="flex items-center gap-2.5">
                     <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                       <Icon className="w-4.5 h-4.5 text-text-secondary" />
                     </div>
                     <div>
                       <p className="font-semibold text-sm text-text-primary">{cat?.label ?? budget.category}</p>
                       <p className="text-xs text-text-secondary">
                          {formatMoney(spent, currency)} of {formatMoney(budget.limit_amount, currency)}
                       </p>
                     </div>
                   </div>
                   <div className="flex items-center gap-1">
                     <button
                       onClick={() => openEdit(budget.category, budget.limit_amount)}
                       className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
                     >
                       Edit
                     </button>
                     <button
                       onClick={() => setDeleteBudgetTarget(budget)}
                       className="p-1.5 rounded-lg text-text-secondary hover:bg-expense/10 hover:text-expense transition-colors"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                   </div>
                 </div>

                <ProgressBar value={spent} max={budget.limit_amount} />

                 <div className="flex items-center justify-between mt-2">
                   <span className="text-xs font-medium text-text-secondary">
                     {pct.toFixed(0)}% used
                   </span>
                   <span className={`text-xs font-bold ${remaining >= 0 ? 'text-income' : 'text-expense'}`}>
                      {remaining >= 0 ? `${formatMoney(remaining, currency)} left` : `${formatMoney(-remaining, currency)} over`}
                   </span>
                 </div>
              </Card>
            );
          })}
        </div>
      )}

      <GoalsSection />

      {/* Add/Edit Budget Sheet */}
      <Sheet open={showAdd} onClose={() => setShowAdd(false)} title={editCategory ? 'Edit Budget' : 'Set Budget'}>
        <div className="space-y-5">
           {!editCategory ? (
             <div>
               <label className="block text-sm font-medium text-text-secondary mb-2">Category</label>
               <div className="grid grid-cols-2 gap-2">
                 {availableCategories.map((cat) => {
                   const Icon = getIcon(cat.icon);
                   return (
                     <button
                       key={cat.key}
                       onClick={() => setEditCategory(cat.key)}
                       className="flex items-center gap-2.5 p-3 rounded-xl bg-secondary border border-secondary hover:border-primary/50 transition-all text-left"
                     >
                       <Icon className="w-5 h-5 text-text-secondary" />
                       <span className="text-sm font-semibold text-text-primary">{cat.label}</span>
                     </button>
                   );
                 })}
               </div>
             </div>
           ) : (
             <div className="space-y-4">
               <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10">
                 {(() => {
                   const cat = getCategory(editCategory);
                   const Icon = getIcon(cat?.icon ?? 'CircleDot');
                   return <Icon className="w-5 h-5 text-primary" />;
                 })()}
                 <span className="font-semibold text-primary">{getCategory(editCategory)?.label ?? editCategory}</span>
               </div>
               <Input
                label="Monthly Limit"
                prefix={getCurrencySymbol(currency)}
                placeholder="3.000.000"
                inputMode="numeric"
                value={editAmount ? formatMoneyInput(parseMoneyInput(editAmount), currency) : ''}
                onChange={(e) => setEditAmount(e.target.value)}
                className="text-xl font-bold"
                autoFocus
              />
            </div>
          )}

          {editCategory && (
            <Button fullWidth onClick={handleSetBudget} disabled={loading || !parseMoneyInput(editAmount)}>
              {loading ? 'Saving...' : 'Save Budget'}
            </Button>
          )}
        </div>
       </Sheet>

      {deleteBudgetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-display font-bold text-lg text-text-primary">Hapus Budget?</h3>
              <p className="text-sm text-text-secondary">
                Budget {getCategory(deleteBudgetTarget.category)?.label ?? deleteBudgetTarget.category} akan dihapus.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteBudgetTarget(null)}
                disabled={loading}
                className="flex-1 py-3 rounded-xl font-semibold text-text-primary bg-secondary hover:bg-secondary/80 transition-all disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteBudget}
                disabled={loading}
                className="flex-1 py-3 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 transition-all disabled:opacity-50"
              >
                {loading ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
     </div>
  );
}
