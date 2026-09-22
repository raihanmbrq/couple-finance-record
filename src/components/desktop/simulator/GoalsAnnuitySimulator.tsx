import React, { useMemo, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatDate, formatMoney, formatMoneyInput, parseMoneyInput } from '@/lib/format';
import { calculateMonthlyContribution, monthsBetween, durationLabel } from '@/lib/goalMath';
import { ASSET_CATEGORIES, type AssetCategory } from '@/lib/types';
import { MoneyInput } from '@/components/desktop/ui/MoneyInput';
import { CustomDesktopDropdown } from '@/components/desktop/ui/CustomDesktopDropdown';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';
import { Calculator, Target, PiggyBank, Sparkles, Check, Calendar } from 'lucide-react';

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const GoalsAnnuitySimulator: React.FC = () => {
  const { saveGoal, profile } = useApp();
  const currency = profile?.currency || 'IDR';

  // Simulator Inputs State — money fields keep the *formatted* string so the
  // user always sees thousand separators; amounts are read via parseMoneyInput.
  const [goalTitle, setGoalTitle] = useState('Dana Darurat / Impian');
  const [targetAmountInput, setTargetAmountInput] = useState(() => formatMoneyInput(50_000_000, currency));
  const [currentAmountInput, setCurrentAmountInput] = useState(() => formatMoneyInput(5_000_000, currency));
  const [targetDate, setTargetDate] = useState<string>('2027-12-31');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [assetCategory, setAssetCategory] = useState<AssetCategory>('Reksadana');
  const [returnRateInput, setReturnRateInput] = useState('7'); // 7% per annum default
  const [isSaved, setIsSaved] = useState(false);
  const targetDateTriggerRef = useRef<HTMLButtonElement>(null);

  const targetAmount = parseMoneyInput(targetAmountInput);
  const currentAmount = parseMoneyInput(currentAmountInput);
  const expectedReturnRate = Number.parseFloat(returnRateInput.replace(',', '.')) || 0;
  const isInvestment = ASSET_CATEGORIES.find((c) => c.key === assetCategory)?.isInvestment ?? false;

  const assetCategoryOptions = useMemo(
    () => ASSET_CATEGORIES.map((c) => ({ value: c.key, label: c.label })),
    []
  );

  const months = useMemo(() => {
    if (!targetDate) return 0;
    const target = new Date(`${targetDate}T00:00:00`);
    return Number.isNaN(target.getTime()) ? 0 : monthsBetween(new Date(), target);
  }, [targetDate]);

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

  // Keep the rate field numeric without the native number-input chrome:
  // digits plus at most one decimal separator ("7", "7,5" or "7.5").
  const handleReturnRateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let next = event.target.value.replace(/[^\d.,]/g, '');
    const separatorIndex = next.search(/[.,]/);
    if (separatorIndex !== -1) {
      next = `${next.slice(0, separatorIndex + 1)}${next.slice(separatorIndex + 1).replace(/[.,]/g, '')}`;
    }
    setReturnRateInput(next);
  };

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
        <MoneyInput
          label={`Target Amount (${currency})`}
          value={targetAmountInput}
          onChange={setTargetAmountInput}
          currency={currency}
          testId="simulator-target-amount"
          placeholder="50.000.000"
          hint="Thousand separators are applied as you type."
        />

        {/* Current Accumulated Amount */}
        <MoneyInput
          label={`Initial Accumulated (${currency})`}
          value={currentAmountInput}
          onChange={setCurrentAmountInput}
          currency={currency}
          testId="simulator-current-amount"
          placeholder="5.000.000"
          hint="Balance already set aside for this goal."
        />

        {/* Target Completion Date — custom floating calendar, no native picker */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Target Completion Date</label>
          <button
            type="button"
            ref={targetDateTriggerRef}
            data-testid="simulator-target-date"
            aria-haspopup="dialog"
            aria-expanded={datePickerOpen}
            onClick={() => setDatePickerOpen((prev) => !prev)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-surface border border-border rounded-xl text-xs font-bold text-text-primary text-left transition-colors hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <span className={targetDate ? '' : 'text-text-muted font-medium'}>
              {targetDate ? formatDate(`${targetDate}T00:00:00`) : 'Select target date'}
            </span>
            <Calendar className="w-4 h-4 shrink-0 text-accent" aria-hidden="true" />
          </button>
          <CustomDatePicker
            value={targetDate}
            onChange={(value) => { setTargetDate(value); setDatePickerOpen(false); }}
            open={datePickerOpen}
            onClose={() => setDatePickerOpen(false)}
            title="Select target completion date"
            minDate={toDateKey(new Date())}
            variant="floating"
            anchorRef={targetDateTriggerRef}
          />
        </div>

        {/* Asset Category — custom themed dropdown, no native <select> */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Asset Class / Vehicle</label>
          <CustomDesktopDropdown
            options={assetCategoryOptions}
            value={assetCategory}
            onChange={(value) => setAssetCategory(value as AssetCategory)}
            className="w-full"
            testId="simulator-asset-class"
            floating
          />
          <p className="text-[11px] text-text-muted mt-1">
            {isInvestment
              ? 'Investment vehicle — compounding applies to the monthly contribution.'
              : 'Savings vehicle — compounding is optional, tune the return rate manually.'}
          </p>
        </div>

        {/* Expected Annual Return Rate (%) */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">
            Expected Annual Return (r %/year)
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={returnRateInput}
              onChange={handleReturnRateChange}
              data-testid="simulator-expected-return"
              className="w-full px-3 py-2 pr-9 bg-surface border border-border rounded-xl text-xs font-bold text-text-primary tabular-nums focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted">
              %
            </span>
          </div>
          <p className="text-[11px] text-text-muted mt-1">Set 0 for a plain savings scenario.</p>
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

