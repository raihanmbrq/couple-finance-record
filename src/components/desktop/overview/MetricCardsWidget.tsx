import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { useFinanceDateRange } from '@/context/FinanceDateRangeContext';
import { formatMoney } from '@/lib/format';
import { Wallet, TrendingUp, TrendingDown, DollarSign, ChevronLeft, ChevronRight, User } from 'lucide-react';

export const MetricCardsWidget: React.FC = () => {
  const { wallets, transactions, household, householdMembers, profile } = useApp();
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

  // Total Wallet Net Balance
  const totalBalance = wallets.reduce((acc, w) => acc + (w.balance || 0), 0);

  // Income & Expenses — scoped to the active Global Quick Date Filter period
  const periodTransactions = filterTransactions(transactions);
  const totalIncome = periodTransactions
    .filter((tx) => tx.type === 'income')
    .reduce((acc, tx) => acc + (tx.amount || 0), 0);

  const totalExpense = periodTransactions
    .filter((tx) => tx.type === 'expense')
    .reduce((acc, tx) => acc + (tx.amount || 0), 0);

  const netCashflow = totalIncome - totalExpense;

  const displayVal = (val: number) => (hideBalance ? '••••••••' : formatMoney(val, currency));

  // Circle member slides if in couple/circle mode
  const isCircleMode = household?.mode === 'couple' || householdMembers.length > 1;

  // Compute balance breakdown per member
  const memberBalances: { name: string; role: string; balance: number; avatarUrl?: string | null }[] = [];

  if (isCircleMode && householdMembers.length > 0) {
    householdMembers.forEach((m) => {
      const mProfile = m.profile;
      const mName = mProfile?.full_name || mProfile?.role || 'Member';
      const mRole = mProfile?.role || m.role;
      // Sum wallets owned by this user or role
      const memberWallets = wallets.filter(
        (w) => w.user_id === m.user_id || w.owner_role === mRole
      );
      const mBalance = memberWallets.reduce((sum, w) => sum + (w.balance || 0), 0);
      memberBalances.push({
        name: mName,
        role: mRole,
        balance: mBalance,
        avatarUrl: mProfile?.avatar_url,
      });
    });
  }

  // Slide items: Slide 0 is Total Net Balance, Slide 1..N are member balances
  const slides = [
    {
      title: t('metric.balance'),
      subtitle: t('metric.balanceSub1') + ` ${wallets.length} ` + t('metric.balanceSub2'),
      balance: totalBalance,
      isTotal: true,
    },
    ...memberBalances.map((mb) => ({
      title: `${mb.name}'s Balance`,
      subtitle: `${mb.role.toUpperCase()} Wallet Total`,
      balance: mb.balance,
      isTotal: false,
    })),
  ];

  const [activeSlide, setActiveSlide] = useState(0);

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const currentSlide = slides[activeSlide] || slides[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Net Balance Card with Slider for Circle Users */}
      <div 
        data-testid="metric-total-balance"
        className="bg-surface p-5 rounded-2xl border border-border shadow-xs flex flex-col justify-between relative group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            {currentSlide.title}
          </span>
          <div className="flex items-center gap-1">
            {isCircleMode && slides.length > 1 && (
              <div className="flex items-center gap-0.5 mr-1">
                <button
                  type="button"
                  onClick={handlePrevSlide}
                  aria-label="Previous Balance Slide"
                  className="p-1 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] text-text-muted font-bold">
                  {activeSlide + 1}/{slides.length}
                </span>
                <button
                  type="button"
                  onClick={handleNextSlide}
                  aria-label="Next Balance Slide"
                  className="p-1 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
              {currentSlide.isTotal ? <Wallet className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-2xl font-extrabold text-text-primary tracking-tight">
            {displayVal(currentSlide.balance)}
          </div>
          <p className="text-xs text-text-muted mt-1">{currentSlide.subtitle}</p>
        </div>

        {/* Slide Indicator Dots for Circle Users */}
        {isCircleMode && slides.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  idx === activeSlide ? 'w-4 bg-accent' : 'w-1.5 bg-border'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Total Income Card */}
      <div 
        data-testid="metric-total-income"
        className="bg-surface p-5 rounded-2xl border border-border shadow-xs flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t('metric.income') || 'Total Income'}</span>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-500">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
            {displayVal(totalIncome)}
          </div>
          <p className="text-xs text-text-muted mt-1">{t('metric.incomeSub') || 'Logged inflow'}</p>
        </div>
      </div>

      {/* Total Expense Card */}
      <div 
        data-testid="metric-total-expense"
        className="bg-surface p-5 rounded-2xl border border-border shadow-xs flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t('metric.expense') || 'Total Expenses'}</span>
          <div className="w-9 h-9 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-500">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">
            {displayVal(totalExpense)}
          </div>
          <p className="text-xs text-text-muted mt-1">{t('metric.expenseSub') || 'Logged outflow'}</p>
        </div>
      </div>

      {/* Net Cashflow Card */}
      <div 
        data-testid="metric-total-cashflow"
        className="bg-surface p-5 rounded-2xl border border-border shadow-xs flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t('metric.net') || 'Net Cashflow'}</span>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            netCashflow >= 0 ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'
          }`}>
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <div className={`text-2xl font-extrabold tracking-tight ${
            netCashflow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {displayVal(netCashflow)}
          </div>
          <p className="text-xs text-text-muted mt-1">{t('metric.netSub') || 'Income - Expenses ratio'}</p>
        </div>
      </div>
    </div>
  );
};
