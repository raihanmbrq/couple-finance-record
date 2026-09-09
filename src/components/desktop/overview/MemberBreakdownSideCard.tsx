import React, { useEffect, useMemo, useState } from 'react';
import { Users2, TrendingUp } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { useFinanceDateRange } from '@/context/FinanceDateRangeContext';
import { formatMoney } from '@/lib/format';
import { resolveCategoryMeta, getCategoryBarClass } from '@/lib/categoryStyle';
import { CategoryChip } from '@/components/desktop/ui/CategoryChip';

interface MemberRow {
  memberId: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
  spent: number;
  sharePct: number;
  topCategory: string;
  topAmount: number;
}

const EMPTY: MemberRow[] = [];

function slugify(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'unknown';
}

/**
 * "Siapa Belanja Apa?" — per-household-member activity side panel for Overview.
 * Each member card shows total logged in the active global period, top category
 * and a contribution progress bar of the spending ratio between partners.
 */
export const MemberBreakdownSideCard: React.FC = () => {
  const { transactions, householdMembers, categories, profile } = useApp();
  const { t } = useLanguage();
  const { filterTransactions } = useFinanceDateRange();
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

  const rows: MemberRow[] = useMemo(() => {
    const periodTx = filterTransactions(transactions);
    const expenseTx = periodTx.filter((tx) => tx.type === 'expense' && tx.category !== 'transfer');

    // Aggregate amounts + per-category totals per spent_by name.
    const totalsBySpentBy = new Map<string, number>();
    const catBySpentBy = new Map<string, Map<string, number>>();
    for (const tx of expenseTx) {
      const name = tx.spent_by || 'Other';
      totalsBySpentBy.set(name, (totalsBySpentBy.get(name) || 0) + tx.amount);
      const perCat = catBySpentBy.get(name) || new Map<string, number>();
      perCat.set(tx.category, (perCat.get(tx.category) || 0) + tx.amount);
      catBySpentBy.set(name, perCat);
    }
    if (totalsBySpentBy.size === 0) return EMPTY;

    // Rows = real household members (matched or zero) plus unmatched "spent by" names.
    const built: MemberRow[] = [];
    householdMembers.forEach((m) => {
      const name = m.profile?.full_name || m.profile?.role || 'Member';
      const spent = totalsBySpentBy.get(name) || 0;
      const perCat = catBySpentBy.get(name);
      let topCategory = '';
      let topAmount = 0;
      perCat?.forEach((amt, cat) => {
        if (amt > topAmount) {
          topAmount = amt;
          topCategory = cat;
        }
      });
      built.push({
        memberId: m.id,
        name,
        role: m.profile?.role || m.role,
        avatarUrl: m.profile?.avatar_url,
        spent,
        sharePct: 0,
        topCategory,
        topAmount,
      });
    });

    totalsBySpentBy.forEach((spent, name) => {
      const already = built.some((r) => r.name.toLowerCase() === name.toLowerCase());
      if (!already) {
        const perCat = catBySpentBy.get(name) || new Map<string, number>();
        let topCategory = '';
        let topAmount = 0;
        perCat.forEach((amt, cat) => {
          if (amt > topAmount) {
            topAmount = amt;
            topCategory = cat;
          }
        });
        built.push({ memberId: `spent-${slugify(name)}`, name, role: 'member', spent, sharePct: 0, topCategory, topAmount });
      }
    });

    const grandTotal = built.reduce((sum, r) => sum + r.spent, 0);
    return built
      .map((r) => ({ ...r, sharePct: grandTotal > 0 ? Math.round((r.spent / grandTotal) * 100) : 0 }))
      .sort((a, b) => b.spent - a.spent);
  }, [transactions, householdMembers, filterTransactions]);

  const activeRows = rows.filter((r) => r.spent > 0);

  return (
    <div
      data-testid="widget-member-breakdown"
      className="bg-surface p-5 rounded-2xl border border-border shadow-xs flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-text-primary">
            {t('memberBreakdown.title') || 'Siapa Belanja Apa?'}
          </h3>
          <p className="text-xs text-text-muted">
            {t('memberBreakdown.subtitle') || 'Circle member activity this period'}
          </p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
          <Users2 className="w-4 h-4" />
        </div>
      </div>

      {activeRows.length === 0 ? (
        <div className="py-8 text-center text-xs text-text-muted">
          {t('memberBreakdown.empty') || 'No member expenses recorded in this period.'}
        </div>
      ) : (
        <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1 no-scrollbar">
          {activeRows.map((row) => {
            const meta = resolveCategoryMeta(row.topCategory, categories);
            return (
              <div
                key={row.memberId}
                data-testid={`member-breakdown-card-${row.memberId}`}
                className="rounded-2xl border border-border bg-surface-hover/40 p-3.5 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-bold overflow-hidden shrink-0 border border-border">
                      {row.avatarUrl ? (
                        <img src={row.avatarUrl} alt={row.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{row.name[0]?.toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-text-primary truncate capitalize">{row.name}</p>
                      <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
                        {row.role}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-extrabold text-text-primary tabular-nums">
                      {hideBalance ? '••••••' : formatMoney(row.spent, currency)}
                    </p>
                    <p className="text-[10px] text-text-muted font-semibold">{row.sharePct}%</p>
                  </div>
                </div>

                {/* Top category expense for this member */}
                {row.topCategory ? (
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <CategoryChip categoryKey={row.topCategory} iconName={meta.icon} label={meta.label} />
                    <span className="text-[11px] text-text-muted tabular-nums font-medium">
                      {t('memberBreakdown.topSpend') || 'Top spend:'}{' '}
                      <strong className="text-text-primary">
                        {hideBalance ? '••••••' : formatMoney(row.topAmount, currency)}
                      </strong>
                    </span>
                  </div>
                ) : (
                  <p className="text-[11px] text-text-muted italic">
                    {t('memberBreakdown.noSpend') || 'No top category yet'}
                  </p>
                )}

                {/* Spending ratio progress bar */}
                <div>
                  <div className="flex items-center justify-between text-[10px] text-text-muted mb-1">
                    <span className="inline-flex items-center gap-1 font-semibold uppercase tracking-wide">
                      <TrendingUp className="w-3 h-3" />
                      {t('memberBreakdown.shareLabel') || 'Share'}
                    </span>
                    <span>{row.sharePct}%</span>
                  </div>
                  <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${getCategoryBarClass(row.topCategory || 'other')}`}
                      style={{ width: `${Math.max(row.sharePct, 2)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
