import React from 'react';
import { useApp } from '@/context/AppContext';
import { getCategory } from '@/lib/types';
import { AlertTriangle, TrendingUp, CheckCircle2 } from 'lucide-react';

export const BudgetAnomaliesBanner: React.FC = () => {
  const { transactions } = useApp();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const prevYear = prevMonthDate.getFullYear();
  const prevMonth = prevMonthDate.getMonth();

  const currentMonthExpenses: Record<string, number> = {};
  const prevMonthExpenses: Record<string, number> = {};

  transactions
    .filter((tx) => tx.type === 'expense')
    .forEach((tx) => {
      const d = new Date(tx.transaction_date || tx.created_at);
      const cat = tx.category || 'other';

      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        currentMonthExpenses[cat] = (currentMonthExpenses[cat] || 0) + tx.amount;
      } else if (d.getFullYear() === prevYear && d.getMonth() === prevMonth) {
        prevMonthExpenses[cat] = (prevMonthExpenses[cat] || 0) + tx.amount;
      }
    });

  const anomalies: { category: string; pctIncrease: number; currentAmt: number; prevAmt: number }[] = [];

  Object.entries(currentMonthExpenses).forEach(([cat, currAmt]) => {
    const prevAmt = prevMonthExpenses[cat] || 0;
    if (prevAmt > 0) {
      const pct = Math.round(((currAmt - prevAmt) / prevAmt) * 100);
      if (pct >= 20) {
        anomalies.push({ category: cat, pctIncrease: pct, currentAmt: currAmt, prevAmt });
      }
    } else if (currAmt > 500000) {
      // New high expense category anomaly
      anomalies.push({ category: cat, pctIncrease: 100, currentAmt: currAmt, prevAmt: 0 });
    }
  });

  if (anomalies.length === 0) {
    return (
      <div 
        data-testid="budget-anomalies-banner"
        className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 p-4 rounded-2xl flex items-center gap-3 text-xs font-medium"
      >
        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
        <div>
          <span className="font-bold">Budget Status Normal:</span> No spending anomalies detected for the current month compared to last month.
        </div>
      </div>
    );
  }

  return (
    <div 
      data-testid="budget-anomalies-banner"
      className="bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 p-4 rounded-2xl space-y-2 text-xs"
    >
      <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400 text-sm">
        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
        <span>Spending Anomalies Alert Banner ({anomalies.length} detected)</span>
      </div>
      <div className="space-y-1.5 pl-6">
        {anomalies.map((anom) => {
          const catLabel = getCategory(anom.category)?.label || anom.category;
          return (
            <div key={anom.category} className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>
                <strong className="capitalize">{catLabel}</strong> expenses increased by{' '}
                <strong className="text-rose-500">{anom.pctIncrease}%</strong> vs last month.
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

