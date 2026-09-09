import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';
import { formatMoney, formatMoneyInput, parseMoneyInput } from '@/lib/format';
import { getCategory, type Budget } from '@/lib/types';
import { CustomDesktopDropdown } from '@/components/desktop/ui/CustomDesktopDropdown';
import { Target, Plus, Trash2, Edit3, PiggyBank, AlertTriangle, X, Check } from 'lucide-react';

export const DesktopBudgetCrud: React.FC = () => {
  const { budgets, transactions, setBudget, deleteBudget, categories, profile } = useApp();
  const currency = profile?.currency || 'IDR';
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [showAdd, setShowAdd] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [inputLimit, setInputLimit] = useState<string>('');
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(false);

  // Calculate spent per category this month
  const spentByCategory = useMemo(() => {
    const now = new Date();
    const map = new Map<string, number>();
    transactions
      .filter((t) => t.type === 'expense')
      .filter((t) => {
        const d = new Date(t.transaction_date || t.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .forEach((t) => {
        map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
      });
    return map;
  }, [transactions]);

  const totalBudget = budgets.reduce((s, b) => s + b.limit_amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + (spentByCategory.get(b.category) ?? 0), 0);
  const totalRemaining = totalBudget - totalSpent;

  // Handler for number input with thousand separator & rejecting leading zeros
  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, ''); // strip non-digits
    // Reject leading zero if length > 1
    raw = raw.replace(/^0+/, '');
    if (!raw) {
      setInputLimit('');
      return;
    }
    const num = parseInt(raw, 10);
    setInputLimit(formatMoneyInput(num, currency));
  };

  const handleSaveBudget = async () => {
    if (!selectedCategory) return;
    const numVal = parseMoneyInput(inputLimit);
    if (!numVal || numVal <= 0) return;
    setLoading(true);
    try {
      await setBudget(selectedCategory, numVal);
      setShowAdd(false);
      setSelectedCategory('');
      setInputLimit('');
      showToast(t('toast.saved') || 'Budget saved successfully!');
    } finally {
      setLoading(false);
    }
  };

  const openSetBudget = (catKey?: string, currentLimit?: number) => {
    if (catKey) {
      setSelectedCategory(catKey);
      setInputLimit(currentLimit ? formatMoneyInput(currentLimit, currency) : '');
    } else {
      setSelectedCategory(availableCategories[0]?.key || 'food');
      setInputLimit('');
    }
    setShowAdd(true);
  };

  const handleDeleteBudget = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      await deleteBudget(deleteTarget.id);
      setDeleteTarget(null);
      showToast(t('toast.deleted') || 'Budget deleted', 'error');
    } finally {
      setLoading(false);
    }
  };

  const availableCategories = categories
    .filter((c) => c.type === 'expense' || c.type === 'both')
    .filter((c) => c.id !== 'salary')
    .map((c) => ({ key: c.id, label: c.name || c.id }));

  const dropdownCategoryOptions = availableCategories.map((c) => ({
    value: c.key,
    label: c.label,
  }));

  return (
    <div data-testid="desktop-budget-crud" className="bg-surface p-6 rounded-2xl border border-border shadow-xs space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <Target className="w-5 h-5 text-accent" />
            <span>Monthly Category Budgets Management</span>
          </h2>
          <p className="text-xs text-text-muted mt-0.5">Set category spending limits and monitor monthly progress</p>
        </div>

        <button
          onClick={() => openSetBudget()}
          disabled={availableCategories.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-accent-text text-xs font-bold hover:opacity-90 transition-all shadow-xs cursor-pointer disabled:opacity-40"
        >
          <Plus className="w-4 h-4" />
          <span>Set Category Budget</span>
        </button>
      </div>

      {/* Recap Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface-hover/30 p-4 rounded-xl border border-border">
        <div>
          <span className="text-xs text-text-muted font-medium">Total Monthly Budget</span>
          <p className="text-xl font-extrabold text-text-primary mt-0.5">{formatMoney(totalBudget, currency)}</p>
        </div>
        <div>
          <span className="text-xs text-text-muted font-medium">Total Spent This Month</span>
          <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">{formatMoney(totalSpent, currency)}</p>
        </div>
        <div>
          <span className="text-xs text-text-muted font-medium">Total Remaining Budget</span>
          <p className={`text-xl font-extrabold mt-0.5 ${totalRemaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
            {formatMoney(totalRemaining, currency)}
          </p>
        </div>
      </div>

      {/* Active Budgets Grid */}
      {budgets.length === 0 ? (
        <div className="py-10 text-center border-2 border-dashed border-border rounded-2xl p-6 space-y-3">
          <PiggyBank className="w-10 h-10 text-text-muted mx-auto" />
          <p className="text-sm font-bold text-text-primary">No Category Budgets Set</p>
          <p className="text-xs text-text-muted">Create your first monthly category budget to prevent overspending!</p>
          <button
            onClick={() => openSetBudget()}
            className="px-4 py-2 rounded-xl bg-accent text-accent-text text-xs font-bold hover:opacity-90 inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Set Budget Now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => {
            const spent = spentByCategory.get(b.category) ?? 0;
            const pct = b.limit_amount > 0 ? Math.min(100, (spent / b.limit_amount) * 100) : 0;
            const remaining = b.limit_amount - spent;
            const catInfo = getCategory(b.category);

            return (
              <div key={b.id} className="bg-surface border border-border p-4 rounded-xl space-y-3 hover:border-accent/50 transition-colors shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-text-primary capitalize">{catInfo?.label || b.category}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openSetBudget(b.category, b.limit_amount)}
                      title="Edit Budget"
                      className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(b)}
                      title="Delete Budget"
                      className="p-1.5 rounded-lg hover:bg-rose-500/15 text-text-muted hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-text-muted">
                  Spent: <strong className="text-text-primary">{formatMoney(spent, currency)}</strong> of {formatMoney(b.limit_amount, currency)}
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 bg-surface-hover rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      pct >= 100 ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} 
                    style={{ width: `${pct}%` }} 
                  />
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-text-muted font-medium">{pct.toFixed(0)}% spent</span>
                  <span className={`font-bold ${remaining >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {remaining >= 0 ? `${formatMoney(remaining, currency)} left` : `${formatMoney(-remaining, currency)} over`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Set/Edit Budget Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-surface p-6 rounded-2xl max-w-md w-full border border-border shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-text-primary">Set Category Budget</h3>
              <button onClick={() => setShowAdd(false)} className="p-1 rounded-lg text-text-muted hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Select Expense Category</label>
                <CustomDesktopDropdown
                  options={dropdownCategoryOptions}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Monthly Budget Limit ({currency})</label>
                <input
                  type="text"
                  value={inputLimit}
                  onChange={handleAmountInputChange}
                  placeholder="3.000.000"
                  className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-lg font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <p className="text-[11px] text-text-muted mt-1">Number formatted with thousand separators; leading 0s rejected.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-border text-text-muted hover:bg-surface-hover"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveBudget}
                  disabled={loading || !parseMoneyInput(inputLimit)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-accent text-accent-text hover:opacity-90 disabled:opacity-40"
                >
                  {loading ? 'Saving...' : 'Save Budget'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Budget Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-surface p-6 rounded-2xl max-w-sm w-full border border-border shadow-2xl space-y-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-text-primary">Delete Budget?</h3>
              <p className="text-xs text-text-muted">
                Are you sure you want to delete the budget limit for <strong className="text-text-primary capitalize">{getCategory(deleteTarget.category)?.label || deleteTarget.category}</strong>?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-border text-text-muted hover:bg-surface-hover"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteBudget}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
              >
                {loading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

