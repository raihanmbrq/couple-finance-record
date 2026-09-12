import React from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { useFinanceDateRange } from '@/context/FinanceDateRangeContext';
import { formatMoneyShort } from '@/lib/format';
import { resolveCategoryMeta } from '@/lib/categoryStyle';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CATEGORY_COLORS = [
  '#f59e0b', // amber (food)
  '#3b82f6', // blue (bills)
  '#a855f7', // purple (shopping)
  '#14b8a6', // teal (entertainment)
  '#22c55e', // green (transport)
  '#ef4444', // red (health)
  '#6366f1', // indigo (education)
  '#78716c', // stone (other)
];

interface CategoryAllocationChartProps {
  onSelectCategory?: (categoryKey: string) => void;
}

export const CategoryAllocationChart: React.FC<CategoryAllocationChartProps> = ({ onSelectCategory }) => {
  const { transactions, categories, profile } = useApp();
  const { t } = useLanguage();
  const { filterTransactions } = useFinanceDateRange();
  const currency = profile?.currency || 'IDR';

  const expenses = filterTransactions(transactions).filter((tx) => tx.type === 'expense' && tx.category !== 'transfer');

  const catMap: Record<string, number> = {};
  expenses.forEach((tx) => {
    const key = tx.category || 'other';
    catMap[key] = (catMap[key] || 0) + tx.amount;
  });

  const chartData = Object.entries(catMap)
    .map(([key, value]) => ({ name: resolveCategoryMeta(key, categories).label, categoryKey: key, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div 
      data-testid="chart-category-allocation"
      className="bg-surface p-5 rounded-2xl border border-border shadow-xs flex flex-col h-80"
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-bold text-text-primary">{t('chart.categoryTitle') || 'Category Allocation'}</h3>
          <p className="text-xs text-text-muted">{t('chart.categorySub') || 'Expense breakdown by category'}</p>
        </div>
      </div>

      <div className="flex-1 w-full text-xs">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-text-muted">
            No category allocation data.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                onClick={(entry) => onSelectCategory?.(entry.categoryKey)}
                cursor={onSelectCategory ? 'pointer' : undefined}
              >
                {chartData.map((_, index) => (
                  <Cell key={`cat-cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(val: any) => [formatMoneyShort(Number(val) || 0, currency), t('budget.spent') || 'Spent']}
                contentStyle={{ 
                  backgroundColor: 'var(--surface)', 
                  borderColor: 'var(--border)',
                  borderRadius: '12px',
                  fontSize: '12px' 
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
