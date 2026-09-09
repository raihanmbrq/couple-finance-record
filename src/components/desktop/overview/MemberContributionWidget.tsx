import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { formatMoney } from '@/lib/format';
import { UserCheck } from 'lucide-react';

export const MemberContributionWidget: React.FC = () => {
  const { transactions, householdMembers, profile } = useApp();
  const currency = profile?.currency || 'IDR';

  const [hideBalance, setHideBalance] = useState<boolean>(() => {
    return localStorage.getItem('pairflow_privacy_hide_balance') === 'true';
  });

  useEffect(() => {
    const handlePrivacy = () => {
      setHideBalance(localStorage.getItem('pairflow_privacy_hide_balance') === 'true');
    };
    window.addEventListener('pairflow_privacy_change', handlePrivacy);
    return () => window.removeEventListener('pairflow_privacy_change', handlePrivacy);
  }, []);

  const expenseTx = transactions.filter((tx) => tx.type === 'expense');
  const totalExpenses = expenseTx.reduce((acc, tx) => acc + tx.amount, 0);

  // Group expenses by spent_by
  const spentByMap: Record<string, number> = {};
  expenseTx.forEach((tx) => {
    const key = tx.spent_by || 'Other';
    spentByMap[key] = (spentByMap[key] || 0) + tx.amount;
  });

  const memberEntries = Object.entries(spentByMap).sort((a, b) => b[1] - a[1]);

  return (
    <div 
      data-testid="widget-member-contribution"
      className="bg-surface p-5 rounded-2xl border border-border shadow-xs flex flex-col justify-between"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-text-primary">Member Contribution Split</h3>
          <p className="text-xs text-text-muted">Expense breakdown by household member</p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
          <UserCheck className="w-4 h-4" />
        </div>
      </div>

      {memberEntries.length === 0 ? (
        <div className="py-6 text-center text-xs text-text-muted">
          No expenses recorded yet.
        </div>
      ) : (
        <div className="space-y-3">
          {memberEntries.map(([spentBy, amount]) => {
            const percentage = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
            // Match with householdMember profile if available
            const matchedMember = householdMembers.find(
              (m) => m.profile?.full_name?.toLowerCase() === spentBy.toLowerCase() || m.profile?.role === spentBy
            );
            const avatarUrl = matchedMember?.profile?.avatar_url;

            return (
              <div key={spentBy} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-[10px] font-bold overflow-hidden">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={spentBy} className="w-full h-full object-cover" />
                      ) : (
                        <span>{spentBy[0]?.toUpperCase()}</span>
                      )}
                    </div>
                    <span className="text-text-primary capitalize">{spentBy}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted">{percentage}%</span>
                    <span className="font-semibold text-text-primary">
                      {hideBalance ? '••••••' : formatMoney(amount, currency)}
                    </span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 bg-surface-hover rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent transition-all duration-300 rounded-full" 
                    style={{ width: `${percentage}%` }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

