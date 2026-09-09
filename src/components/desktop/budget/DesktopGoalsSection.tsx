import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';
import { formatMoney, formatMoneyInput, parseMoneyInput, formatDate } from '@/lib/format';
import { calculateMonthlyContribution, durationLabel, monthsBetween } from '@/lib/goalMath';
import { ASSET_CATEGORIES, type Goal } from '@/lib/types';
import { CustomDesktopDropdown } from '@/components/desktop/ui/CustomDesktopDropdown';
import { Target, Plus, Trash2, Edit3, PiggyBank, Wallet, Sparkles, AlertTriangle, X, Check, ArrowRight } from 'lucide-react';

export const DesktopGoalsSection: React.FC = () => {
  const { goals, wallets, saveGoal, deleteGoal, depositToGoal, profile } = useApp();
  const currency = profile?.currency || 'IDR';
  const { showToast } = useToast();
  const { t } = useLanguage();

  // Create / Edit Form State
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [title, setTitle] = useState('');
  const [targetAmountInput, setTargetAmountInput] = useState('');
  const [startDate, setStartDate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState<Goal['asset_category']>('Tabungan Biasa');
  const [returnRate, setReturnRate] = useState('5');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Goal | null>(null);

  // Deposit State
  const [depositGoal, setDepositGoal] = useState<Goal | null>(null);
  const [depositWalletId, setDepositWalletId] = useState('');
  const [depositAmountInput, setDepositAmountInput] = useState('');
  const [depositing, setDepositing] = useState(false);

  const isInvestment = ASSET_CATEGORIES.find((c) => c.key === category)?.isInvestment ?? false;
  const rate = isInvestment ? parseFloat(returnRate.replace(',', '.')) || 0 : 0;
  const numTargetAmount = parseMoneyInput(targetAmountInput);

  const months = useMemo(() => {
    if (!targetDate || !startDate) return 0;
    return monthsBetween(new Date(startDate), new Date(targetDate));
  }, [startDate, targetDate]);

  const pmtAnnuity = calculateMonthlyContribution({
    targetAmount: numTargetAmount,
    currentAmount: editing?.current_amount ?? 0,
    months,
    annualReturnPct: rate,
  });

  const pmtLinear = calculateMonthlyContribution({
    targetAmount: numTargetAmount,
    currentAmount: editing?.current_amount ?? 0,
    months,
    annualReturnPct: 0,
  });

  // Number input formatter rejecting leading 0s
  const handleMoneyInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    let raw = e.target.value.replace(/\D/g, '');
    raw = raw.replace(/^0+/, '');
    if (!raw) {
      setter('');
      return;
    }
    const num = parseInt(raw, 10);
    setter(formatMoneyInput(num, currency));
  };

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setTargetAmountInput('');
    setStartDate(new Date().toISOString().slice(0, 10));
    setTargetDate('');
    setCategory('Tabungan Biasa');
    setReturnRate('5');
    setShowForm(true);
  };

  const openEdit = (goal: Goal) => {
    setEditing(goal);
    setTitle(goal.title);
    setTargetAmountInput(formatMoneyInput(goal.target_amount, currency));
    setStartDate(goal.created_at ? goal.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setTargetDate(goal.target_date.slice(0, 10));
    setCategory(goal.asset_category);
    setReturnRate(goal.expected_return_rate ? String(goal.expected_return_rate) : '5');
    setShowForm(true);
  };

  const handleSaveGoal = async () => {
    if (!title.trim() || !numTargetAmount || !targetDate) return;
    setSaving(true);
    try {
      await saveGoal({
        id: editing?.id,
        title,
        target_amount: numTargetAmount,
        current_amount: editing?.current_amount ?? 0,
        target_date: targetDate,
        asset_category: category,
        expected_return_rate: isInvestment ? rate : 0,
        monthly_contribution: pmtAnnuity,
      });
      setShowForm(false);
      showToast(t('toast.saved') || 'Goal saved successfully!');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGoal = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteGoal(deleteTarget.id);
      setDeleteTarget(null);
      showToast(t('toast.deleted') || 'Goal deleted', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExecuteDeposit = async () => {
    if (!depositGoal || !depositWalletId) return;
    const depAmt = parseMoneyInput(depositAmountInput);
    if (!depAmt || depAmt <= 0) return;
    setDepositing(true);
    try {
      await depositToGoal(depositGoal.id, depositWalletId, depAmt);
      setDepositGoal(null);
      setDepositAmountInput('');
      showToast('Deposit added to goal!');
    } finally {
      setDepositing(false);
    }
  };

  const assetDropdownOptions = ASSET_CATEGORIES.map((c) => ({
    value: c.key,
    label: c.label,
  }));

  const walletDropdownOptions = wallets.map((w) => ({
    value: w.id,
    label: `${w.name} (${formatMoney(w.balance, currency)})`,
  }));

  return (
    <div data-testid="desktop-goals-section" className="bg-surface p-6 rounded-2xl border border-border shadow-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-accent" />
            <span>Household Financial Goals Directory</span>
          </h2>
          <p className="text-xs text-text-muted mt-0.5">Track financial goals, monthly contributions, and deposit progress</p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-accent-text text-xs font-bold hover:opacity-90 transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create New Goal</span>
        </button>
      </div>

      {/* Goals Cards List */}
      {goals.length === 0 ? (
        <div className="py-10 text-center border-2 border-dashed border-border rounded-2xl p-6 space-y-3">
          <Target className="w-10 h-10 text-text-muted mx-auto" />
          <p className="text-sm font-bold text-text-primary">No Financial Goals Set</p>
          <p className="text-xs text-text-muted">Set target dates and monthly contribution plans for major household milestones!</p>
          <button
            onClick={openCreate}
            className="px-4 py-2 rounded-xl bg-accent text-accent-text text-xs font-bold hover:opacity-90 inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Goal</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g) => {
            const pct = g.target_amount > 0 ? Math.min(100, Math.round((g.current_amount / g.target_amount) * 100)) : 0;
            const remaining = Math.max(0, g.target_amount - g.current_amount);

            return (
              <div key={g.id} className="bg-surface border border-border p-5 rounded-2xl space-y-3 hover:border-accent/50 transition-colors shadow-xs flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-text-primary truncate">{g.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent font-semibold">
                      {g.asset_category}
                    </span>
                  </div>

                  <div className="text-xs text-text-muted flex justify-between">
                    <span>Accumulated: <strong className="text-text-primary">{formatMoney(g.current_amount, currency)}</strong></span>
                    <span>Target: <strong className="text-text-primary">{formatMoney(g.target_amount, currency)}</strong></span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 bg-surface-hover rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                  </div>

                  <div className="flex justify-between text-[11px] text-text-muted">
                    <span>{pct}% Completed</span>
                    <span>Monthly: <strong className="text-accent">{formatMoney(g.monthly_contribution || 0, currency)}</strong></span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setDepositGoal(g);
                      setDepositWalletId(wallets[0]?.id || '');
                      setDepositAmountInput('');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/15 text-accent hover:bg-accent/25 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>+ Deposit</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(g)}
                      className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(g)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/15 text-text-muted hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Goal Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-surface p-6 rounded-2xl max-w-lg w-full border border-border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-text-primary">
                {editing ? 'Edit Financial Goal' : 'Create New Financial Goal'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg text-text-muted hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Goal Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Dana Darurat / Beli Rumah"
                  className="w-full px-3.5 py-2 bg-surface border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Target Amount ({currency})</label>
                <input
                  type="text"
                  value={targetAmountInput}
                  onChange={(e) => handleMoneyInputChange(e, setTargetAmountInput)}
                  placeholder="50.000.000"
                  className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-lg font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <p className="text-[11px] text-text-muted mt-1">Formatted with thousand separators; leading 0s rejected.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Target Date</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Asset Category</label>
                <CustomDesktopDropdown
                  options={assetDropdownOptions}
                  value={category}
                  onChange={(val) => setCategory(val as Goal['asset_category'])}
                  className="w-full"
                />
              </div>

              {isInvestment && (
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Expected Annual Return (%/year)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={returnRate}
                    onChange={(e) => setReturnRate(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              )}

              {numTargetAmount > 0 && targetDate && (
                <div className="bg-accent/10 border border-accent/30 p-3 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center justify-between font-bold text-accent">
                    <span>Required Monthly Savings:</span>
                    <span>{formatMoney(pmtAnnuity, currency)}/mo</span>
                  </div>
                  <p className="text-[11px] text-text-muted">Duration: {durationLabel(months)}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-border text-text-muted hover:bg-surface-hover"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveGoal}
                  disabled={saving || !title.trim() || !numTargetAmount || !targetDate}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-accent text-accent-text hover:opacity-90 disabled:opacity-40"
                >
                  {saving ? 'Saving...' : 'Save Goal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deposit to Goal Modal */}
      {depositGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-surface p-6 rounded-2xl max-w-md w-full border border-border shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-text-primary">Deposit to Goal</h3>
              <button onClick={() => setDepositGoal(null)} className="p-1 rounded-lg text-text-muted hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs text-text-muted">Target Goal:</span>
                <p className="font-bold text-sm text-text-primary">{depositGoal.title}</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Source Wallet</label>
                <CustomDesktopDropdown
                  options={walletDropdownOptions}
                  value={depositWalletId}
                  onChange={setDepositWalletId}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Deposit Amount ({currency})</label>
                <input
                  type="text"
                  value={depositAmountInput}
                  onChange={(e) => handleMoneyInputChange(e, setDepositAmountInput)}
                  placeholder="1.000.000"
                  className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-lg font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDepositGoal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-border text-text-muted hover:bg-surface-hover"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDeposit}
                  disabled={depositing || !depositWalletId || !parseMoneyInput(depositAmountInput)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-accent text-accent-text hover:opacity-90 disabled:opacity-40"
                >
                  {depositing ? 'Depositing...' : 'Confirm Deposit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Goal Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-surface p-6 rounded-2xl max-w-sm w-full border border-border shadow-2xl space-y-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-text-primary">Delete Goal?</h3>
              <p className="text-xs text-text-muted">
                Are you sure you want to delete <strong className="text-text-primary">{deleteTarget.title}</strong>?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-border text-text-muted hover:bg-surface-hover"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteGoal}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
              >
                {saving ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

