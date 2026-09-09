import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatMoney } from '@/lib/format';
import { calculateMonthlyContribution, monthsBetween, durationLabel } from '@/lib/goalMath';
import { ASSET_CATEGORIES, type AssetCategory } from '@/lib/types';
import { Calculator, Target, TrendingUp, PiggyBank, Sparkles, Check } from 'lucide-react';

export const GoalsAnnuitySimulator: React.FC = () => {
  const { saveGoal, profile } = useApp();
  const currency = profile?.currency || 'IDR';

  // Simulator Inputs State
  const [goalTitle, setGoalTitle] = useState('Dana Darurat / Impian');
  const [targetAmount, setTargetAmount] = useState<number>(50_000_000);
  const [currentAmount, setCurrentAmount] = useState<number>(5_000_000);
  const [targetDate, setTargetDate] = useState<string>('2027-12-31');
  const [assetCategory, setAssetCategory] = useState<AssetCategory>('Reksadana');
  const [expectedReturnRate, setExpectedReturnRate] = useState<number>(7); // 7% per annum default
  const [isSaved, setIsSaved] = useState(false);

  const months = monthsBetween(new Date(), new Date(targetDate));

  // Compound Annuity ($r > 0)
  const monthlyRequiredAnnuity = calculateMonthlyContribution({
    targetAmount,
    currentAmount,
    months,
    annualReturnPct: expectedReturnRate,
  });

  // Zero-Return Savings ($r = 0)
  const monthlyRequiredLinear = calculateMonthlyContribution({
    targetAmount,
    currentAmount,
    months,
    annualReturnPct: 0,
  });

  const monthlySavingsDiff = Math.max(0, monthlyRequiredLinear - monthlyRequiredAnnuity);

  const handleSaveGoal = async () => {
    try {
      await saveGoal({
        title: goalTitle,
        target_amount: targetAmount,
        current_amount: currentAmount,
        target_date: targetDate,
        asset_category: assetCategory,
        expected_return_rate: expectedReturnRate,
        monthly_contribution: monthlyRequiredAnnuity,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div data-testid="goals-annuity-simulator" className="bg-surface p-6 rounded-2xl border border-border shadow-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <Calculator className="w-5 h-5 text-accent" />
            <span>Financial Goals Annuity Simulator</span>
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Calculate required monthly savings based on target date, compounding expected annual return rate ($r &gt; 0$ vs $r = 0$), and asset class.
          </p>
        </div>
      </div>

      {/* Inputs Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-surface-hover/30 p-4 rounded-xl border border-border">
        {/* Goal Title */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Goal Title</label>
          <input
            type="text"
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
            className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Target Amount */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Target Amount ({currency})</label>
          <input
            type="number"
            value={targetAmount}
            onChange={(e) => setTargetAmount(Number(e.target.value))}
            data-testid="simulator-target-amount"
            className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Current Accumulated Amount */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Initial Accumulated ({currency})</label>
          <input
            type="number"
            value={currentAmount}
            onChange={(e) => setCurrentAmount(Number(e.target.value))}
            className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Target Date */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Target Completion Date</label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            data-testid="simulator-target-date"
            className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Asset Category */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Asset Class / Vehicle</label>
          <select
            value={assetCategory}
            onChange={(e) => setAssetCategory(e.target.value as AssetCategory)}
            className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {ASSET_CATEGORIES.map((cat) => (
              <option key={cat.key} value={cat.key}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* Expected Annual Return Rate (%) */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">
            Expected Annual Return (r %/year)
          </label>
          <input
            type="number"
            step="0.5"
            value={expectedReturnRate}
            onChange={(e) => setExpectedReturnRate(Number(e.target.value))}
            data-testid="simulator-expected-return"
            className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      {/* Simulator Output Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Compound Return Scenario Card */}
        <div className="bg-accent/10 border border-accent/30 p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-accent uppercase tracking-wider">Compound Investment Scenario (r = {expectedReturnRate}%)</span>
            <Sparkles className="w-4 h-4 text-accent" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-accent">
              {formatMoney(monthlyRequiredAnnuity, currency)} <span className="text-xs font-normal text-text-muted">/ month</span>
            </div>
            <p className="text-xs text-text-muted mt-1">
              Duration: <strong className="text-text-primary">{durationLabel(months)}</strong>
            </p>
          </div>
        </div>

        {/* Regular Savings Zero Return Card */}
        <div className="bg-surface-hover/50 border border-border p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Zero Return Savings Scenario (r = 0%)</span>
            <PiggyBank className="w-4 h-4 text-text-muted" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-text-primary">
              {formatMoney(monthlyRequiredLinear, currency)} <span className="text-xs font-normal text-text-muted">/ month</span>
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              Compounding saves you {formatMoney(monthlySavingsDiff, currency)}/month!
            </p>
          </div>
        </div>
      </div>

      {/* Save Action Bar */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-text-muted">
          Asset vehicle: <span className="font-semibold text-text-primary">{assetCategory}</span>
        </div>
        <button
          onClick={handleSaveGoal}
          data-testid="save-simulated-goal-btn"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-text text-xs font-bold hover:opacity-90 transition-all shadow-sm"
        >
          {isSaved ? (
            <>
              <Check className="w-4 h-4" />
              <span>Saved to Household Goals!</span>
            </>
          ) : (
            <>
              <Target className="w-4 h-4" />
              <span>Save Goal to PairFlow</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

