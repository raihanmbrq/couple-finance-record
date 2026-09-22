import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { useFinanceDateRange } from '@/context/FinanceDateRangeContext';
import { formatMoney } from '@/lib/format';
import { resolveCategoryMeta } from '@/lib/categoryStyle';
import { CategoryChip } from '@/components/desktop/ui/CategoryChip';
import { CashflowTrendChart } from '@/components/desktop/overview/CashflowTrendChart';
import { MonthlyHealthSummaryCard } from '@/components/desktop/overview/MonthlyHealthSummaryCard';
import { CategoryAllocationChart } from '@/components/desktop/overview/CategoryAllocationChart';
import { SpouseRatioChart } from '@/components/desktop/overview/SpouseRatioChart';
import { MonthlyActivityCalendar } from '@/components/MonthlyActivityCalendar';
import { GlobalQuickDateFilter } from '@/components/desktop/overview/GlobalQuickDateFilter';
import { MonthNavigationPicker } from '@/components/desktop/ui/MonthNavigationPicker';
import { TopExpensesWidget } from '@/components/desktop/analytics/TopExpensesWidget';
import { PieChart as PieIcon } from 'lucide-react';

interface DesktopAnalyticsScreenProps {
  onSelectMember?: (memberName: string) => void;
  onSelectCategory?: (categoryKey: string) => void;
}

export const DesktopAnalyticsScreen: React.FC<DesktopAnalyticsScreenProps> = ({ onSelectMember, onSelectCategory }) => {
  const { transactions, categories, profile } = useApp();
  const { t } = useLanguage();
  const { filterTransactions } = useFinanceDateRange();
  const currency = profile?.currency || 'IDR';

  // Independent month view for the "Aktivitas Bulan Ini" calendar.
  const now = new Date();
  const defaultMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [viewMonthKey, setViewMonthKey] = useState(defaultMonthKey);
  const [viewYear, viewMonth] = viewMonthKey.split('-').map((v, i) => (i === 0 ? Number(v) : Number(v) - 1));

  const filteredTx = filterTransactions(transactions);
  // `type === 'expense'` already excludes internal wallet transfers (they carry
  // the dedicated `transfer` type). An EXPENSE with the "Transfer" category is
  // an external payment and correctly shows up in the table below.
  const expenses = filteredTx.filter((tx) => tx.type === 'expense');
  const totalExpense = expenses.reduce((acc, tx) => acc + tx.amount, 0);

  // Group by category for the detailed analysis table
  const catSummary: Record<string, { count: number; total: number }> = {};
  expenses.forEach((tx) => {
    const key = tx.category || 'other';
    if (!catSummary[key]) catSummary[key] = { count: 0, total: 0 };
    catSummary[key].count += 1;
    catSummary[key].total += tx.amount;
  });

  const catRows = Object.entries(catSummary).sort((a, b) => b[1].total - a[1].total);

  return (
    <div data-testid="desktop-analytics-screen" className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-surface p-4 rounded-2xl border border-border flex items-center justify-between flex-wrap gap-4 shadow-xs">
        <div className="flex items-center gap-2">
          <PieIcon className="w-5 h-5 text-accent" />
          <h2 className="text-base font-bold text-text-primary">
            {t('analytics.title') || 'Interactive Financial Analytics'}
          </h2>
        </div>
        <GlobalQuickDateFilter />
      </div>

      {/* Row 1: Cashflow Trend Chart side-by-side with Monthly Health Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CashflowTrendChart />
        </div>
        <div className="lg:col-span-1">
          <MonthlyHealthSummaryCard />
        </div>
      </div>
      {/* Row 2: Spouse Ratio, Category Allocation & Daily Calendar Activity with month nav */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <SpouseRatioChart onSelectMember={onSelectMember} />
        </div>

        <div className="lg:col-span-1">
          <CategoryAllocationChart onSelectCategory={onSelectCategory} />
        </div>

        {/* Aktivitas Bulan Ini + custom month & year selector */}
        <div className="lg:col-span-1 bg-surface p-5 rounded-2xl border border-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                {t('analytics.monthlyActivity') || 'Aktivitas Bulan Ini'}
              </h3>
              <p className="text-xs text-text-muted">
                {t('analytics.monthlyActivitySub') || 'Daily calendar activity recap'}
              </p>
            </div>
            <MonthNavigationPicker value={viewMonthKey} onChange={setViewMonthKey} />
          </div>
          <div className="flex-1">
            <MonthlyActivityCalendar onSelectDate={() => {}} year={viewYear} month={viewMonth} />
          </div>
        </div>
      </div>

      {/* Row 3: Top 5 Highest Expenses + Detailed Category Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <TopExpensesWidget />
        </div>

        <div className="lg:col-span-2 bg-surface p-5 rounded-2xl border border-border shadow-xs flex flex-col">
          <h3 className="text-sm font-bold text-text-primary mb-3">
            {t('analytics.categoryTableTitle') || 'Category Detailed Expenses'}
          </h3>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-text-muted">
                  <th className="py-2 font-semibold">{t('common.category') || 'Category'}</th>
                  <th className="py-2 font-semibold text-center">{t('analytics.txCount') || 'Tx Count'}</th>
                  <th className="py-2 font-semibold text-right">{t('analytics.totalSpent') || 'Total Spent'}</th>
                  <th className="py-2 font-semibold text-right">{t('analytics.share') || '% Share'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {catRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-text-muted">
                      {t('analytics.emptyTable') || 'No expense data found for this period.'}
                    </td>
                  </tr>
                ) : (
                  catRows.map(([catKey, data]) => {
                    const meta = resolveCategoryMeta(catKey, categories);
                    const share = totalExpense > 0 ? ((data.total / totalExpense) * 100).toFixed(1) : '0';
                    return (
                      <tr key={catKey} className="hover:bg-surface-hover/50">
                        <td className="py-2.5 font-medium text-text-primary">
                          <CategoryChip categoryKey={catKey} iconName={meta.icon} label={meta.label} />
                        </td>
                        <td className="py-2.5 text-center text-text-muted">{data.count}</td>
                        <td className="py-2.5 text-right font-semibold text-text-primary">
                          {formatMoney(data.total, currency)}
                        </td>
                        <td className="py-2.5 text-right font-medium text-accent">{share}%</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};
