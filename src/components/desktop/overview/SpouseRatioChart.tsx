import React from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { useFinanceDateRange } from '@/context/FinanceDateRangeContext';
import { formatMoneyShort } from '@/lib/format';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6'];

interface SpouseRatioChartProps {
  onSelectMember?: (memberName: string) => void;
}

export const SpouseRatioChart: React.FC<SpouseRatioChartProps> = ({ onSelectMember }) => {
  const { transactions, profile } = useApp();
  const { t } = useLanguage();
  const { filterTransactions } = useFinanceDateRange();
  const currency = profile?.currency || 'IDR';

  // Internal wallet transfers must not skew the who-spent-what ratio.
  const expenses = filterTransactions(transactions).filter((tx) => tx.type === 'expense');

  const ratioMap: Record<string, number> = {};
  expenses.forEach((tx) => {
    const key = tx.spent_by || 'Other';
    ratioMap[key] = (ratioMap[key] || 0) + tx.amount;
  });

  const chartData = Object.entries(ratioMap).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    memberName: name,
    value,
  }));

  return (
    <div 
      data-testid="chart-spouse-ratio"
      className="bg-surface p-5 rounded-2xl border border-border shadow-xs flex flex-col h-80"
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-bold text-text-primary">{t('chart.spouseTitle') || 'Spouse Contribution Ratio'}</h3>
          <p className="text-xs text-text-muted">{t('chart.spouseSub') || 'Proportional spending per partner'}</p>
        </div>
      </div>

      <div className="flex-1 w-full text-xs">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-text-muted">
            No spending ratio data.
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
                paddingAngle={4}
                dataKey="value"
                onClick={(entry) => onSelectMember?.((entry as unknown as { memberName: string }).memberName)}
                cursor={onSelectMember ? 'pointer' : undefined}
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(val: any) => [formatMoneyShort(Number(val) || 0, currency), t('analytics.totalSpent') || 'Total Spent']}
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
