import React, { useMemo } from 'react';
import { HeartPulse, ArrowUpRight, ArrowDownRight, Minus, Wallet, PiggyBank, Receipt } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { useFinanceDateRange } from '@/context/FinanceDateRangeContext';
import { formatMoney, formatMoneyCompact } from '@/lib/format';
import { resolveCategoryMeta } from '@/lib/categoryStyle';
import type { Transaction } from '@/lib/types';

const inMonthRange = (tx: Transaction, y: number, m: number, min: number, max: number): boolean => {
  const d = new Date(tx.transaction_date || tx.created_at);
  const t = d.getTime();
  return d.getFullYear() === y && d.getMonth() === m && t >= min && t <= max;
};

/**
 * "Monthly Health Summary" — sits beside the Cashflow Trend chart on Analytics.
 * Compares spending in the anchor (latest) month against the previous month.
 */
export const MonthlyHealthSummaryCard: React.FC = () => {
  const { transactions, categories, profile } = useApp();
  const { t, language } = useLanguage();
  const { range } = useFinanceDateRange();
  const currency = profile?.currency || 'IDR';
  const locale = language === 'id' ? 'id-ID' : 'en-US';

  const end = range.end;
  const anchorY = end.getFullYear();
  const anchorM = end.getMonth();
  const curStart = new Date(anchorY, anchorM, 1).getTime();
  const curEnd = new Date(anchorY, anchorM + 1, 0, 23, 59, 59, 999).getTime();
  const rangeMin = Math.max(range.start.getTime(), curStart);
  const rangeMax = Math.min(range.end.getTime(), curEnd);

  const data = useMemo(() => {
    let curExpense = 0;
    let curIncome = 0;
    let prevExpense = 0;
    let curTxCount = 0;
    const catTotals = new Map<string, number>();

    const prevStart = new Date(anchorY, anchorM - 1, 1).getTime();
    const prevEnd = new Date(anchorY, anchorM, 0, 23, 59, 59, 999).getTime();

    for (const tx of transactions) {
      const time = new Date(tx.transaction_date || tx.created_at).getTime();
      if (tx.category === 'transfer') continue;
      if (inMonthRange(tx, anchorY, anchorM, rangeMin, rangeMax)) {
        if (tx.type === 'income') curIncome += tx.amount;
        else {
          curExpense += tx.amount;
          curTxCount += 1;
          catTotals.set(tx.category, (catTotals.get(tx.category) || 0) + tx.amount);
        }
      } else if (tx.type === 'expense' && time >= prevStart && time <= prevEnd) {
        prevExpense += tx.amount;
      }
    }

    let topCategory = '';
    let topAmount = 0;
    catTotals.forEach((amt, cat) => {
      if (amt > topAmount) {
        topAmount = amt;
        topCategory = cat;
      }
    });

    const net = curIncome - curExpense;
    const delta = curExpense - prevExpense;
    const deltaPct = prevExpense > 0 ? Math.round((delta / prevExpense) * 100) : null;
    const savingsRate = curIncome > 0 ? Math.round((net / curIncome) * 100) : null;
    return { curExpense, curIncome, prevExpense, curTxCount, net, delta, deltaPct, savingsRate, topCategory, topAmount };
  }, [transactions, anchorY, anchorM, rangeMin, rangeMax]);

  const monthLabel = end.toLocaleDateString(locale, { month: 'long' });
  const deltaClass =
    data.delta > 0
      ? 'text-rose-600 dark:text-rose-400'
      : data.delta < 0
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-text-muted';
  const DeltaIcon = data.delta > 0 ? ArrowUpRight : data.delta < 0 ? ArrowDownRight : Minus;
  const meta = resolveCategoryMeta(data.topCategory, categories);

  return (
    <div
      data-testid="monthly-health-summary"
      className="bg-surface p-5 rounded-2xl border border-border shadow-xs flex flex-col h-80"
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-bold text-text-primary">{t('health.title') || 'Monthly Health Summary'}</h3>
          <p className="text-xs text-text-muted capitalize">{monthLabel}</p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
          <HeartPulse className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
          {t('health.spend') || 'Spending'}
        </p>
        <div className="flex items-end gap-2.5 mt-0.5">
          <span className="text-2xl font-extrabold text-text-primary tracking-tight tabular-nums">
            {formatMoney(data.curExpense, currency)}
          </span>
          <span className={`inline-flex items-center gap-0.5 pb-1 text-xs font-bold ${deltaClass}`}>
            <DeltaIcon className="w-3.5 h-3.5" />
            {data.deltaPct !== null ? `${Math.abs(data.deltaPct)}%` : '—'}
          </span>
        </div>
        <p className="text-[11px] text-text-muted mt-0.5">
          {data.deltaPct !== null
            ? `${data.delta > 0 ? '+' : ''}${formatMoneyCompact(Math.abs(data.delta), currency)} ${t('health.vsLastMonth') || 'vs last month'}`
            : t('health.noPrevMonth') || 'No spending recorded last month'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <Wallet className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{t('health.income') || 'Income'}</span>
          </div>
          <p className="text-sm font-extrabold text-text-primary mt-1 tabular-nums">
            {formatMoneyCompact(data.curIncome, currency)}
          </p>
        </div>
        <div className={`rounded-xl p-3 border ${data.net >= 0 ? 'bg-accent/10 border-accent/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
          <div className={`flex items-center gap-1.5 ${data.net >= 0 ? 'text-accent' : 'text-rose-600 dark:text-rose-400'}`}>
            <PiggyBank className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{t('health.net') || 'Net'}</span>
          </div>
          <p className="text-sm font-extrabold text-text-primary mt-1 tabular-nums">
            {formatMoneyCompact(data.net, currency)}
          </p>
        </div>
      </div>

      <div className="mt-auto pt-3 flex items-center justify-between gap-2 flex-wrap">
        {data.topCategory ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-hover border border-border text-[11px] font-semibold text-text-primary">
            <span className="capitalize">{meta.label}</span>
            <span className="text-text-muted">·</span>
            <span className="tabular-nums">{formatMoneyCompact(data.topAmount, currency)}</span>
          </span>
        ) : (
          <span className="text-[11px] text-text-muted">{t('health.noCategory') || 'No category data yet'}</span>
        )}
        <span className="inline-flex items-center gap-1 text-[11px] text-text-muted">
          <Receipt className="w-3 h-3" />
          {data.curTxCount} {t('health.txCount') || 'transactions'}
        </span>
      </div>
    </div>
  );
};
