import React, { useMemo } from 'react';
import { AlertTriangle, PiggyBank, TrendingUp, CheckCircle2, CircleDollarSign } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { useFinanceDateRange } from '@/context/FinanceDateRangeContext';
import { formatMoney } from '@/lib/format';
import { resolveCategoryMeta } from '@/lib/categoryStyle';
import type { Transaction } from '@/lib/types';

type Tone = 'warning' | 'success' | 'danger' | 'neutral';

const TONE_STYLES: Record<Tone, { box: string; icon: string; title: string }> = {
  warning: {
    box: 'border-amber-500/40 bg-amber-500/10',
    icon: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
    title: 'text-amber-700 dark:text-amber-300',
  },
  success: {
    box: 'border-emerald-500/40 bg-emerald-500/10',
    icon: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    title: 'text-emerald-700 dark:text-emerald-300',
  },
  danger: {
    box: 'border-rose-500/40 bg-rose-500/10',
    icon: 'bg-rose-500/20 text-rose-600 dark:text-rose-400',
    title: 'text-rose-700 dark:text-rose-300',
  },
  neutral: {
    box: 'border-border bg-surface-hover/40',
    icon: 'bg-accent/15 text-accent',
    title: 'text-text-primary',
  },
};

const inMonth = (tx: Transaction, y: number, m: number): boolean => {
  const d = new Date(tx.transaction_date || tx.created_at);
  return d.getFullYear() === y && d.getMonth() === m;
};

/**
 * Dynamic financial-health insight banner:
 *  - flags the single biggest category spending spike vs the previous month,
 *  - otherwise surfaces a positive/negative net cashflow insight.
 */
export const SpendingAnomalyBanner: React.FC = () => {
  const { transactions, categories, profile } = useApp();
  const { t } = useLanguage();
  const { range } = useFinanceDateRange();
  const currency = profile?.currency || 'IDR';

  const end = range.end;
  const curY = end.getFullYear();
  const curM = end.getMonth();
  const curStart = new Date(curY, curM, 1).getTime();
  const curEnd = new Date(curY, curM + 1, 0, 23, 59, 59, 999).getTime();

  const insights = useMemo(() => {
    const current = new Map<string, number>();
    const previous = new Map<string, number>();
    let curIncome = 0;
    const prevY = curM === 0 ? curY - 1 : curY;
    const prevM = curM === 0 ? 11 : curM - 1;

    for (const tx of transactions) {
      // Internal wallet transfers are not income or expense.
      if (tx.type === 'transfer') continue;
      const time = new Date(tx.transaction_date || tx.created_at).getTime();
      if (inMonth(tx, curY, curM)) {
        if (time < curStart || time > curEnd) continue;
        if (tx.type === 'income') {
          curIncome += tx.amount;
          continue;
        }
        current.set(tx.category, (current.get(tx.category) || 0) + tx.amount);
      } else if (tx.type === 'expense' && inMonth(tx, prevY, prevM)) {
        previous.set(tx.category, (previous.get(tx.category) || 0) + tx.amount);
      }
    }

    let curExpense = 0;
    current.forEach((v) => (curExpense += v));

    // Biggest genuine spike: previous month exists and current is ≥20% higher.
    const spike = Array.from(current.entries()).reduce<{
      category: string;
      pct: number;
      delta: number;
      prev: number;
      cur: number;
    } | null>((best, [cat, cur]) => {
      const prev = previous.get(cat) || 0;
      if (prev <= 0 || cur < prev * 1.2) return best;
      const delta = cur - prev;
      if (!best || delta > best.delta) {
        return { category: cat, pct: Math.round(((cur - prev) / prev) * 100), delta, prev, cur };
      }
      return best;
    }, null);

    const net = curIncome - curExpense;
    return { spike, curExpense, curIncome, net };
  }, [transactions, curY, curM, curStart, curEnd]);

  let tone: Tone = 'neutral';
  let title = t('anomaly.noDataTitle') || 'No activity to analyze yet';
  let body: string | null = null;
  let Icon: React.ElementType = CheckCircle2;

  if (insights.spike) {
    const meta = resolveCategoryMeta(insights.spike.category, categories);
    tone = 'warning';
    Icon = AlertTriangle;
    title = t('anomaly.spikeTitle', { category: meta.label, pct: insights.spike.pct }) ||
      `${meta.label} spending increased ${insights.spike.pct}% vs last month`;
    body =
      t('anomaly.spikeBody', { amount: formatMoney(insights.spike.delta, currency) }) ||
      `That's ${formatMoney(insights.spike.delta, currency)} more than last month. Review recent ${meta.label.toLowerCase()} transactions.`;
  } else if (insights.net > 0) {
    tone = 'success';
    Icon = PiggyBank;
    title = t('anomaly.netPositiveTitle') || 'Positive net cashflow!';
    body =
      t('anomaly.netPositiveBody', { amount: formatMoney(insights.net, currency) }) ||
      `You have ${formatMoney(insights.net, currency)} available for Financial Goals.`;
  } else if (insights.net < 0) {
    tone = 'danger';
    Icon = TrendingUp;
    title = t('anomaly.netNegativeTitle') || 'Expenses exceeded income';
    body =
      t('anomaly.netNegativeBody', { amount: formatMoney(Math.abs(insights.net), currency) }) ||
      `You spent ${formatMoney(Math.abs(insights.net), currency)} more than you earned this period.`;
  } else {
    tone = 'neutral';
    Icon = CircleDollarSign;
    title = t('anomaly.balancedTitle') || 'You are on track — spending is balanced';
    body = t('anomaly.balancedBody') || 'No category spikes detected for this period.';
  }

  const styles = TONE_STYLES[tone];

  return (
    <div
      data-testid="spending-anomaly-banner"
      className={`flex items-start gap-3.5 px-5 py-4 rounded-2xl border ${styles.box}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${styles.icon}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className={`text-sm font-bold ${styles.title}`}>{title}</p>
        {body && <p className="text-xs text-text-muted mt-0.5">{body}</p>}
      </div>
    </div>
  );
};
