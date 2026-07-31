import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Input } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { CATEGORIES, getCategory } from '@/lib/types';
import { formatIDR, formatIDRInput, parseIDRInput } from '@/lib/format';
import { Plus, PiggyBank, Trash2, Target } from 'lucide-react';
import { getIcon } from '@/lib/icons';
import { useToast } from '@/context/ToastContext';

export function BudgetScreen() {
  const { budgets, transactions, setBudget, deleteBudget } = useApp();
  const { showToast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [editCategory, setEditCategory] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
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
    const amt = parseIDRInput(editAmount);
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
    setEditAmount(currentLimit ? formatIDRInput(currentLimit) : '');
    setShowAdd(true);
  };

  const openAdd = () => {
    setEditCategory(null);
    setEditAmount('');
    setShowAdd(true);
  };

  const availableCategories = CATEGORIES.filter(c => !budgets.some(b => b.category === c.key) && c.key !== 'salary');

  return (
    <div className="px-5 py-5 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-extrabold text-2xl text-stone-800">Budget</h1>
        <button
          onClick={openAdd}
          disabled={availableCategories.length === 0}
          className="w-10 h-10 rounded-full bg-teal-700 text-white flex items-center justify-center shadow-card hover:bg-teal-800 active:scale-95 transition-all disabled:opacity-40"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
        </button>
      </div>

      {/* Monthly Recap Summary */}
      <Card elevated className="bg-gradient-to-br from-stone-800 to-stone-900 border-0 text-white p-5">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-amber-400" />
          <span className="text-stone-300 text-sm font-medium">Monthly Recap</span>
        </div>
        <div className={isLargeBudget ? 'flex flex-col gap-3' : 'grid grid-cols-3 gap-3'}>
          <div className={isLargeBudget ? 'flex justify-between items-center bg-white/5 rounded-lg p-2.5' : ''}>
            <p className={`text-xs text-stone-400 ${isLargeBudget ? '' : 'mb-1'}`}>Budgeted</p>
            <p className="font-display font-bold text-xs">{formatIDR(totalBudget)}</p>
          </div>
          <div className={isLargeBudget ? 'flex justify-between items-center bg-white/5 rounded-lg p-2.5' : ''}>
            <p className={`text-xs text-stone-400 ${isLargeBudget ? '' : 'mb-1'}`}>Spent</p>
            <p className="font-display font-bold text-xs text-red-300">{formatIDR(totalSpent)}</p>
          </div>
          <div className={isLargeBudget ? 'flex justify-between items-center bg-white/5 rounded-lg p-2.5' : ''}>
            <p className={`text-xs text-stone-400 ${isLargeBudget ? '' : 'mb-1'}`}>Remaining</p>
            <p className={`font-display font-bold text-xs ${totalRemaining >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {formatIDR(totalRemaining)}
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
                    <div className="w-9 h-9 rounded-lg bg-cream-100 flex items-center justify-center">
                      <Icon className="w-4.5 h-4.5 text-stone-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-stone-800">{cat?.label ?? budget.category}</p>
                      <p className="text-xs text-stone-400">
                        {formatIDR(spent)} of {formatIDR(budget.limit_amount)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(budget.category, budget.limit_amount)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={async () => { await deleteBudget(budget.id); showToast('Budget berhasil dihapus'); }}
                      className="p-1.5 rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <ProgressBar value={spent} max={budget.limit_amount} />

                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-medium text-stone-500">
                    {pct.toFixed(0)}% used
                  </span>
                  <span className={`text-xs font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {remaining >= 0 ? `${formatIDR(remaining)} left` : `${formatIDR(-remaining)} over`}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Budget Sheet */}
      <Sheet open={showAdd} onClose={() => setShowAdd(false)} title={editCategory ? 'Edit Budget' : 'Set Budget'}>
        <div className="space-y-5">
          {!editCategory ? (
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-2">Category</label>
              <div className="grid grid-cols-2 gap-2">
                {availableCategories.map((cat) => {
                  const Icon = getIcon(cat.icon);
                  return (
                    <button
                      key={cat.key}
                      onClick={() => setEditCategory(cat.key)}
                      className="flex items-center gap-2.5 p-3 rounded-xl bg-cream-50 border border-stone-200 hover:border-teal-300 transition-all text-left"
                    >
                      <Icon className="w-5 h-5 text-stone-500" />
                      <span className="text-sm font-semibold text-stone-700">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-teal-50">
                {(() => {
                  const cat = getCategory(editCategory);
                  const Icon = getIcon(cat?.icon ?? 'CircleDot');
                  return <Icon className="w-5 h-5 text-teal-700" />;
                })()}
                <span className="font-semibold text-teal-700">{getCategory(editCategory)?.label ?? editCategory}</span>
              </div>
              <Input
                label="Monthly Limit"
                prefix="Rp"
                placeholder="3.000.000"
                inputMode="numeric"
                value={editAmount ? formatIDRInput(parseIDRInput(editAmount)) : ''}
                onChange={(e) => setEditAmount(e.target.value)}
                className="text-xl font-bold"
                autoFocus
              />
            </div>
          )}

          {editCategory && (
            <Button fullWidth onClick={handleSetBudget} disabled={loading || !parseIDRInput(editAmount)}>
              {loading ? 'Saving...' : 'Save Budget'}
            </Button>
          )}
        </div>
      </Sheet>
    </div>
  );
}
