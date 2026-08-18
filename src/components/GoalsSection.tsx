import { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Input, Select } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ASSET_CATEGORIES, type Goal } from '@/lib/types';
import { formatMoney, formatMoneyInput, parseMoneyInput, formatDateShort, formatDate } from '@/lib/format';
import { getCurrencySymbol } from '@/lib/currencies';
import { calculateMonthlyContribution, durationLabel, monthsBetween } from '@/lib/goalMath';
import { PiggyBank, Plus, Trash2, Wallet, Pencil } from 'lucide-react';
import { CustomDateRangePicker } from '@/components/ui/CustomDateRangePicker';

function SummaryRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-text-secondary">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-primary' : 'text-text-primary'}`}>{value}</span>
    </div>
  );
}

export function GoalsSection() {
  const { goals, wallets, saveGoal, deleteGoal, depositToGoal, profile } = useApp();
  const currency = profile?.currency ?? 'IDR';
  const { showToast } = useToast();
  const { t } = useLanguage();

  // Create / Edit form
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [dateRangePickerOpen, setDateRangePickerOpen] = useState(false);
  const [category, setCategory] = useState<Goal['asset_category']>('Tabungan Biasa');
  const [returnRate, setReturnRate] = useState('5');
  const [saving, setSaving] = useState(false);
  const [deleteGoalTarget, setDeleteGoalTarget] = useState<Goal | null>(null);

  // Deposit
  const [depositGoal, setDepositGoal] = useState<Goal | null>(null);
  const [depositWallet, setDepositWallet] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositing, setDepositing] = useState(false);

  const isInvestment = ASSET_CATEGORIES.find(c => c.key === category)?.isInvestment ?? false;
  const rate = isInvestment ? (parseFloat(returnRate.replace(',', '.')) || 0) : 0;
  const amount = parseMoneyInput(targetAmount);
  const months = useMemo(() => {
    if (!targetDate || !startDate) return 0;
    return monthsBetween(new Date(startDate), new Date(targetDate));
  }, [startDate, targetDate]);

  const formattedRange = useMemo(() => {
    if (!startDate || !targetDate) return t('goals.dateLabel');
    return `${formatDate(startDate)} - ${formatDate(targetDate)}`;
  }, [startDate, targetDate, t]);

  const pmt = calculateMonthlyContribution({
    targetAmount: amount,
    currentAmount: editing?.current_amount ?? 0,
    months,
    annualReturnPct: rate,
  });
  const pmt0 = calculateMonthlyContribution({
    targetAmount: amount,
    currentAmount: editing?.current_amount ?? 0,
    months,
    annualReturnPct: 0,
  });
  const categoryLabel = ASSET_CATEGORIES.find(c => c.key === category)?.label ?? category;

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setTargetAmount('');
    setStartDate(new Date().toISOString().slice(0, 10));
    setTargetDate('');
    setCategory('Tabungan Biasa');
    setReturnRate('5');
    setShowForm(true);
  };

  const openEdit = (goal: Goal) => {
    setEditing(goal);
    setTitle(goal.title);
    setTargetAmount(formatMoneyInput(goal.target_amount, currency));
    setStartDate(goal.created_at ? goal.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setTargetDate(goal.target_date.slice(0, 10));
    setCategory(goal.asset_category);
    setReturnRate(goal.expected_return_rate ? String(goal.expected_return_rate) : '5');
    setShowForm(true);
  };

  const handleDateRangeChange = (start: string, end: string) => {
    setStartDate(start);
    setTargetDate(end);
  };

  const handleSave = async () => {
    if (!title.trim() || !amount || !targetDate) return;
    setSaving(true);
    try {
      await saveGoal({
        ...(editing ? { id: editing.id } : { current_amount: 0 }),
        title: title.trim(),
        target_amount: amount,
        target_date: new Date(`${targetDate}T23:59:59`).toISOString(),
        asset_category: category,
        expected_return_rate: rate,
        monthly_contribution: pmt,
      });
      showToast(editing ? t('goals.updated') : t('goals.created'));
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteGoalTarget) return;
    try {
      await deleteGoal(deleteGoalTarget.id);
      setDeleteGoalTarget(null);
      showToast(t('goals.deleted'), 'error');
    } catch {
      showToast(t('goals.deleteFailed'));
    }
  };

  const handleDeposit = async () => {
    const goal = depositGoal;
    if (!goal || !depositWallet) return;
    const amt = parseMoneyInput(depositAmount);
    if (!amt) return;
    setDepositing(true);
    try {
      await depositToGoal(goal.id, depositWallet, amt);
      showToast(t('goals.depositSuccess'));
      setDepositGoal(null);
      setDepositWallet('');
      setDepositAmount('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('goals.depositFailed'));
    } finally {
      setDepositing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-extrabold text-2xl text-text-primary">{t('goals.title')}</h2>
        <button
          onClick={openCreate}
          className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-card hover:bg-primary-hover active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
        </button>
      </div>

      <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
        <PiggyBank className="w-4 h-4 text-primary shrink-0" />
        <p className="text-xs text-text-secondary">
          {t('goals.sinkingFundDesc')}
        </p>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={<PiggyBank className="w-7 h-7" />}
          title={t('goals.emptyTitle')}
          description={t('goals.emptyDesc')}
          action={<Button size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 inline mr-1" />
            {t('goals.createBtn')}
          </Button>}
        />
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => {
            const pct = goal.target_amount > 0 ? Math.round((goal.current_amount / goal.target_amount) * 100) : 0;
            return (
              <Card key={goal.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <PiggyBank className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-text-primary truncate">{goal.title}</p>
                      <p className="text-xs text-text-secondary">
                        {goal.asset_category}
                        {goal.expected_return_rate ? ` • ${t('goals.returnPerYear', { rate: goal.expected_return_rate })}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(goal)}
                      className="p-1.5 rounded-lg text-text-secondary hover:bg-secondary hover:text-primary transition-colors"
                      aria-label={t('goals.editAria')}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteGoalTarget(goal)}
                      className="p-1.5 rounded-lg text-text-secondary hover:bg-expense/10 hover:text-expense transition-colors"
                      aria-label={t('goals.deleteAria')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <ProgressBar value={goal.current_amount} max={goal.target_amount} />

                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary">
                    {formatMoney(goal.current_amount, currency)} {t('goals.of')} {formatMoney(goal.target_amount, currency)}
                  </span>
                  <span className="text-xs font-bold text-primary">{pct}%</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-secondary">
                  <div className="text-xs space-y-0.5">
                    <p className="text-text-secondary">
                      {t('goals.target')} {formatDateShort(goal.target_date)} • {durationLabel(monthsBetween(new Date(), new Date(goal.target_date)))}
                    </p>
                    <p className="text-text-secondary">
                      {t('goals.estimatedSavings')} <span className="font-semibold text-text-primary">{formatMoney(goal.monthly_contribution, currency)}{t('goals.perMonth')}</span>
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => { setDepositGoal(goal); setDepositWallet(''); setDepositAmount(''); }}
                  >
                    <Wallet className="w-4 h-4 inline mr-1" />
                    {t('goals.addMoney')}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Goal Sheet */}
      <Sheet open={showForm} onClose={() => setShowForm(false)} title={editing ? t('goals.edit') : t('goals.create')}>
        <div className="space-y-4">
          <Input
            label={t('goals.nameLabel')}
            placeholder={t('goals.namePlaceholder')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <Input
            label={t('goals.targetLabel')}
            prefix={getCurrencySymbol(currency)}
            placeholder="150.000.000"
            inputMode="numeric"
            value={targetAmount ? formatMoneyInput(parseMoneyInput(targetAmount), currency) : ''}
            onChange={(e) => setTargetAmount(e.target.value)}
            className="text-xl font-bold"
          />
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">{t('goals.dateLabel')}</label>
            <CustomDateRangePicker
              startDate={startDate}
              endDate={targetDate}
              onChange={handleDateRangeChange}
              open={dateRangePickerOpen}
              onClose={() => setDateRangePickerOpen(false)}
            />
            <button
              type="button"
              onClick={() => setDateRangePickerOpen(true)}
              className="w-full flex items-center justify-between px-4 py-3 bg-secondary/50 border border-secondary/35 rounded-xl hover:border-primary/50 transition-all font-medium text-sm text-text-primary min-h-[48px]"
            >
              <span>{formattedRange}</span>
              <span className="text-primary font-bold text-xs">Change</span>
            </button>
          </div>
          <Select
            label={t('goals.categoryLabel')}
            value={category}
            onChange={(e) => setCategory(e.target.value as Goal['asset_category'])}
          >
            {ASSET_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </Select>

          {isInvestment && (
            <>
              <Input
                label={t('goals.returnLabel')}
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={returnRate}
                onChange={(e) => setReturnRate(e.target.value)}
              />
              <p className="text-xs text-text-secondary -mt-2">{t('goals.defaultRateHint')}</p>
            </>
          )}

          <div className="rounded-xl bg-secondary/60 p-4 space-y-2">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">{t('goals.summary')}</p>
            <SummaryRow label={t('goals.totalTarget')} value={formatMoney(amount, currency)} />
            <SummaryRow label={t('goals.duration')} value={durationLabel(months)} />
            <SummaryRow
              label={t('goals.asset')}
              value={isInvestment ? t('goals.assetWithReturn', { label: categoryLabel, rate }) : categoryLabel}
            />
            <SummaryRow label={t('goals.savingsPerMonth')} value={formatMoney(pmt, currency)} highlight />
            {isInvestment && rate > 0 && (
              <p className="text-xs text-income font-medium">
                {t('goals.savingsVsNoReturn', { amount: formatMoney(pmt0 - pmt, currency), base: formatMoney(pmt0, currency) })}
              </p>
            )}
          </div>

          <Button
            fullWidth
            onClick={handleSave}
            disabled={saving || !title.trim() || !amount || !targetDate}
          >
            {saving ? t('goals.saving') : editing ? t('goals.saveChanges') : t('goals.create')}
          </Button>
        </div>
      </Sheet>

      {/* Deposit Sheet */}
      <Sheet
        open={!!depositGoal}
        onClose={() => setDepositGoal(null)}
        title={depositGoal ? t('goals.depositTitle', { title: depositGoal.title }) : t('goals.deposit')}
      >
        <div className="space-y-4">
          <Select
            label={t('goals.fromWallet')}
            value={depositWallet}
            onChange={(e) => setDepositWallet(e.target.value)}
          >
            <option value="">{t('goals.selectWallet')}</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>{w.name} — {formatMoney(w.balance, currency)}</option>
            ))}
          </Select>
          <Input
            label={t('goals.depositAmount')}
            prefix={getCurrencySymbol(currency)}
            placeholder="500.000"
            inputMode="numeric"
            value={depositAmount ? formatMoneyInput(parseMoneyInput(depositAmount), currency) : ''}
            onChange={(e) => setDepositAmount(e.target.value)}
            className="text-xl font-bold"
            autoFocus
          />
          <Button
            fullWidth
            onClick={handleDeposit}
            disabled={depositing || !depositWallet || !parseMoneyInput(depositAmount)}
          >
            {depositing ? t('goals.processing') : t('goals.confirmDeposit')}
          </Button>
        </div>
      </Sheet>

      {deleteGoalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-surface rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 rounded-full bg-expense/10 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-expense" />
              </div>
              <h3 className="font-display font-bold text-lg text-text-primary">{t('goals.deleteGoalTitle')}</h3>
              <p className="text-sm text-text-secondary">
                {t('goals.deleteDesc', { title: deleteGoalTarget.title })}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteGoalTarget(null)}
                className="flex-1 py-3 rounded-xl font-semibold text-text-primary bg-secondary hover:bg-secondary/80 transition-all"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-3 rounded-xl font-semibold text-white bg-expense hover:bg-expense/90 transition-all"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}