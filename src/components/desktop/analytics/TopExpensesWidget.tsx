import React, { useMemo } from 'react';
import { Trophy } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { useFinanceDateRange } from '@/context/FinanceDateRangeContext';
import { formatMoney, formatDateShort } from '@/lib/format';
import { resolveCategoryMeta } from '@/lib/categoryStyle';
import { CategoryChip } from '@/components/desktop/ui/CategoryChip';

/**
 * Top 5 Highest Expenses — Analytics widget listing the largest individual
 * transaction items logged in the selected (global) period.
 */
export const TopExpensesWidget: React.FC = () => {
  const { transactions, householdMembers, categories, profile } = useApp();
  const { t } = useLanguage();
  const { filterTransactions } = useFinanceDateRange();
  const currency = profile?.currency || 'IDR';

  const topExpenses = useMemo(() => {
    return filterTransactions(transactions)
      .filter((tx) => tx.type === 'expense' && tx.category !== 'transfer')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions, filterTransactions]);

  const avatarFor = (spentByName: string) => {
    const member = householdMembers.find(
      (m) =>
        m.profile?.full_name?.toLowerCase() === spentByName.toLowerCase() ||
        (m.profile?.role || m.role) === spentByName
    );
    return { name: member?.profile?.full_name || spentByName, avatarUrl: member?.profile?.avatar_url };
  };

  return (
    <div
      data-testid="top-expenses-widget"
      className="bg-surface p-5 rounded-2xl border border-border shadow-xs flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-text-primary">{t('topExpenses.title') || 'Top 5 Highest Expenses'}</h3>
          <p className="text-xs text-text-muted">
            {t('topExpenses.subtitle') || 'Largest individual transactions this period'}
          </p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
          <Trophy className="w-4 h-4" />
        </div>
      </div>

      {topExpenses.length === 0 ? (
        <div className="py-8 text-center text-xs text-text-muted">
          {t('topExpenses.empty') || 'No expenses recorded in this period.'}
        </div>
      ) : (
        <div className="space-y-2.5">
          {topExpenses.map((tx, idx) => {
            const meta = resolveCategoryMeta(tx.category, categories);
            const member = avatarFor(tx.spent_by || '');
            return (
              <div
                key={tx.id}
                data-testid={`top-expense-item-${tx.id}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface-hover/40 px-3 py-2.5 hover:bg-surface-hover/70 transition-colors"
              >
                <span
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-extrabold shrink-0 ${
                    idx === 0
                      ? 'bg-amber-100 text-amber-700'
                      : idx === 1
                        ? 'bg-stone-200 text-stone-600'
                        : idx === 2
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-surface-hover text-text-muted'
                  }`}
                >
                  {idx + 1}
                </span>

                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <CategoryChip categoryKey={tx.category} iconName={meta.icon} label={meta.label} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-text-primary truncate">{tx.notes || meta.label}</p>
                    <p className="text-[10px] text-text-muted">{formatDateShort(tx.transaction_date || tx.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {/* spent_by avatar */}
                  <div
                    className="w-7 h-7 rounded-full bg-accent/15 text-accent flex items-center justify-center text-[10px] font-bold overflow-hidden border border-border"
                    title={member.name}
                  >
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{member.name[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
                    {formatMoney(tx.amount, currency)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
