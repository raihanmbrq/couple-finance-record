import React from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { useFinanceDateRange } from '@/context/FinanceDateRangeContext';
import { formatMoneyCompact, formatMoneyShort } from '@/lib/format';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const DAY_MS = 86_400_000;

export const CashflowTrendChart: React.FC = () => {
  const { transactions, profile } = useApp();
  const { t, language } = useLanguage();
  const { filterTransactions, range } = useFinanceDateRange();
  const currency = profile?.currency || 'IDR';
  const locale = language === 'id' ? 'id-ID' : 'en-US';

  const spanDays = Math.max(1, Math.round((range.end.getTime() - range.start.getTime()) / DAY_MS));
  const monthlyBuckets = spanDays > 62;

  // Filter to the active Global Quick Date Filter period, then aggregate.
  const aggregated: Record<string, { date: string; Income: number; Expense: number }> = {};

  const sortedTx = filterTransactions(transactions).sort(
    (a, b) => new Date(a.transaction_date || a.created_at).getTime() - new Date(b.transaction_date || b.created_at).getTime()
  );

  sortedTx.forEach((tx) => {
    const d = new Date(tx.transaction_date || tx.created_at);
    const rawDate = tx.transaction_date ? tx.transaction_date.slice(0, 10) : '2026-01-01';
    let key: string;
    let label: string;
    if (monthlyBuckets) {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      label = d.toLocaleDateString(locale, { month: 'short', year: '2-digit' });
    } else {
      key = rawDate;
      label = d.toLocaleDateString(locale, { day: '2-digit', month: 'short' });
    }
    if (!aggregated[key]) {
      aggregated[key] = { date: label, Income: 0, Expense: 0 };
    }
    if (tx.type === 'income') {
      aggregated[key].Income += tx.amount;
    } else {
      aggregated[key].Expense += tx.amount;
    }
  });

  const chartData = Object.values(aggregated).slice(-60); // keep the chart readable for long custom ranges

  return (
    <div 
      data-testid="chart-cashflow-trend"
      className="bg-surface p-5 rounded-2xl border border-border shadow-xs flex flex-col h-80"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-text-primary">{t('chart.cashflowTitle') || 'Cashflow Trend Chart'}</h3>
          <p className="text-xs text-text-muted">
            {monthlyBuckets
              ? t('chart.cashflowMonthlySub') || 'Income vs Expense by month'
              : t('chart.cashflowSub') || 'Income vs Expense trajectory over time'}
          </p>
        </div>
      </div>

      <div className="flex-1 w-full text-xs">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-text-muted">
            No transaction timeline data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="date" tickLine={false} stroke="var(--text-muted)" fontSize={10} />
              <YAxis 
                tickLine={false} 
                stroke="var(--text-muted)" 
                fontSize={10} 
                width={48}
                tickMargin={6}
                axisLine={false}
                tickFormatter={(val) => formatMoneyCompact(Number(val) || 0, currency)}
              />
              <Tooltip 
                formatter={(val: any) => [formatMoneyShort(Number(val) || 0, currency), '']}
                contentStyle={{ 
                  backgroundColor: 'var(--surface)', 
                  borderColor: 'var(--border)',
                  borderRadius: '12px',
                  fontSize: '12px' 
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Area
                type="monotone"
                dataKey="Income"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#incomeGradient)"
              />
              <Area
                type="monotone"
                dataKey="Expense"
                stroke="#f43f5e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#expenseGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
