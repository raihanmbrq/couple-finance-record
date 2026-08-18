import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/Card';
import { formatMoney, formatMoneyShort, formatRelative } from '@/lib/format';
import { getCategory, type Wallet, type HouseholdMember } from '@/lib/types';
import { TrendingUp, TrendingDown, Plus, ArrowUpRight, ArrowDownRight, ChevronDown, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { getIcon } from '@/lib/icons';
import { walletTypeIcon } from '@/lib/walletIcons';
import { AddWalletSheet } from '@/components/AddWalletSheet';
import { WalletDetailsSheet } from '@/components/WalletDetailsSheet';
import { EditTransactionSheet } from '@/components/EditTransactionSheet';
import { CustomMonthPicker } from '@/components/ui/CustomMonthPicker';
import { CustomSelectSheet } from '@/components/ui/CustomSelectSheet';

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function SliderArrow({ position, disabled, onClick }: { position: 'left' | 'right'; disabled: boolean; onClick: () => void }) {
  const { t } = useLanguage();
  const Icon = position === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={position === 'left' ? t('home.prevSlide') : t('home.nextSlide')}
      disabled={disabled}
      onClick={onClick}
      className={`hidden sm:flex absolute top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center rounded-full bg-white border border-secondary shadow-card text-text-primary disabled:opacity-40 disabled:pointer-events-none ${position === 'left' ? '-left-3' : '-right-3'}`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

function SliderDots({ count, active, onSelect }: { count: number; active: number; onSelect: (i: number) => void }) {
  const { t } = useLanguage();
  if (count <= 1) return null;
  return (
    <div className="flex justify-center gap-1.5 pt-3">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={t('home.goToSlide', { n: i + 1 })}
          onClick={() => onSelect(i)}
          className={`h-2 rounded-full transition-all duration-300 ${i === active ? 'w-5 bg-primary' : 'w-2 bg-secondary'}`}
        />
      ))}
    </div>
  );
}

function AddWalletCard({ onClick }: { onClick: () => void }) {
  const { t } = useLanguage();
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-full flex flex-col items-start justify-center p-4 rounded-2xl border-2 border-dashed border-primary/40 text-primary hover:border-primary hover:bg-primary/5 transition-all text-left"
    >
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
        <Plus className="w-5 h-5 text-primary" />
      </div>
      <p className="text-xs font-semibold">{t('home.addNewWallet')}</p>
    </button>
  );
}

export function HomeScreen() {
  const { wallets, transactions, profile, isDemo, householdMembers, walletTypes, categories } = useApp();
  const currency = profile?.currency ?? 'IDR';
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [activeWallet, setActiveWallet] = useState<Wallet | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<(typeof transactions)[number] | null>(null);
  const [timeFilter, setTimeFilter] = useState<'fullMonth' | 'last30Days' | 'last7Days' | 'today'>('fullMonth');
  const now = new Date();
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [timeFilterOpen, setTimeFilterOpen] = useState(false);

  const [balanceIdx, setBalanceIdx] = useState(0);
  const [walletIdx, setWalletIdx] = useState(0);
  const balanceRef = useRef<HTMLDivElement>(null);
  const walletRef = useRef<HTMLDivElement>(null);

  const selectedMonthDate = new Date(`${selectedMonth}-01T00:00:00`);
  const { t, language } = useLanguage();
  const monthName = selectedMonthDate.toLocaleString(language === 'id' ? 'id-ID' : 'en-US', { month: 'long', year: 'numeric' });

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  const memberBalances = householdMembers.map((m) => ({
    member: m,
    balance: wallets.filter((w) => w.user_id === m.user_id).reduce((s, w) => s + w.balance, 0),
  })).filter((x) => x.balance > 0 || x.member.user_id === profile?.id);

  const memberWalletGroups = householdMembers.map((m) => ({
    member: m,
    wallets: wallets.filter((w) => w.user_id === m.user_id),
  })).filter((g) => g.wallets.length > 0 || g.member.user_id === profile?.id);

  const sortedMemberWalletGroups = [...memberWalletGroups].sort((a, b) =>
    a.member.user_id === profile?.id ? -1 : b.member.user_id === profile?.id ? 1 : 0
  );

  const memberName = (m: HouseholdMember) => m.profile?.full_name || m.profile?.email?.split('@')[0] || 'Member';

  // This month's income/expense
  const monthTx = transactions.filter(t => {
    const d = new Date(t.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthIncomeFor = (uid: string) =>
    monthTx.filter(t => t.type === 'income' && t.category !== 'transfer' && t.user_id === uid).reduce((s, t) => s + t.amount, 0);
  const monthExpenseFor = (uid: string) =>
    monthTx.filter(t => t.type === 'expense' && t.category !== 'transfer' && t.user_id === uid).reduce((s, t) => s + t.amount, 0);
  const allIncome = monthTx.filter(t => t.type === 'income' && t.category !== 'transfer').reduce((s, t) => s + t.amount, 0);
  const allExpense = monthTx.filter(t => t.type === 'expense' && t.category !== 'transfer').reduce((s, t) => s + t.amount, 0);

  const sortedMemberBalances = [...memberBalances].sort((a, b) =>
    a.member.user_id === profile?.id ? -1 : b.member.user_id === profile?.id ? 1 : 0
  );

  const balanceSlides =
    sortedMemberBalances.length > 0
      ? sortedMemberBalances.map(({ member, balance }) => {
          const isMe = member.user_id === profile?.id;
          const incomeStr = formatMoneyShort(monthIncomeFor(member.user_id), currency);
          const expenseStr = formatMoneyShort(monthExpenseFor(member.user_id), currency);
          return {
            key: member.user_id,
            label: isMe ? t('home.myTotalBalance') : memberName(member),
            balance,
            incomeStr,
            expenseStr,
          };
        })
      : [{
          key: profile?.id ?? 'me',
          label: t('home.myTotalBalance'),
          balance: totalBalance,
          incomeStr: formatMoneyShort(allIncome, currency),
          expenseStr: formatMoneyShort(allExpense, currency),
        }];

  const myWalletChunks = chunk(wallets, 4);
  const walletSlides =
    sortedMemberWalletGroups.length > 0
      ? sortedMemberWalletGroups.flatMap(({ member, wallets: memberWallets }) => {
          const baseLabel = member.user_id === profile?.id ? t('home.myWallets') : t('home.theirWallets', { name: memberName(member) });
          const isMe = member.user_id === profile?.id;
          if (memberWallets.length === 0) {
            return [{ key: member.user_id, label: baseLabel, wallets: memberWallets, empty: true, showAddCard: isMe }];
          }
          const chunks = chunk(memberWallets, 4);
          return chunks.map((cw, i) => ({
            key: `${member.user_id}-${i}`,
            label: chunks.length > 1 ? `${baseLabel} (${i + 1}/${chunks.length})` : baseLabel,
            wallets: cw,
            empty: false,
            showAddCard: isMe && i === chunks.length - 1,
          }));
        })
      : myWalletChunks.length > 0
        ? myWalletChunks.map((cw, i) => ({
            key: `me-${i}`,
            label: myWalletChunks.length > 1 ? `${t('home.myWallets')} (${i + 1}/${myWalletChunks.length})` : t('home.myWallets'),
            wallets: cw,
            empty: false,
            showAddCard: i === myWalletChunks.length - 1,
          }))
        : [{ key: 'me-empty', label: t('home.myWallets'), wallets: [], empty: true, showAddCard: true }];

  const balanceKey = balanceSlides.map((s) => s.key).join(',');
  const lastBalanceKey = useRef('');

  useEffect(() => {
    const el = balanceRef.current;
    if (!el || balanceSlides.length <= 1) return;
    
    if (lastBalanceKey.current !== balanceKey) {
      const init = () => {
        if (el.clientWidth > 0) {
          el.style.scrollBehavior = 'auto';
          el.scrollLeft = el.clientWidth;
          el.style.scrollBehavior = '';
          setBalanceIdx(0);
          lastBalanceKey.current = balanceKey;
        }
      };
      
      const ob = new ResizeObserver(() => {
        init();
        if (lastBalanceKey.current === balanceKey) {
          ob.disconnect();
        }
      });
      ob.observe(el);
      return () => ob.disconnect();
    }
  }, [balanceKey, balanceSlides.length]);

  const walletKey = walletSlides.map((s) => s.key).join(',');
  const lastWalletKey = useRef('');

  useEffect(() => {
    const el = walletRef.current;
    if (!el || walletSlides.length <= 1) return;
    
    if (lastWalletKey.current !== walletKey) {
      const init = () => {
        if (el.clientWidth > 0) {
          el.style.scrollBehavior = 'auto';
          el.scrollLeft = el.clientWidth;
          el.style.scrollBehavior = '';
          setWalletIdx(0);
          lastWalletKey.current = walletKey;
        }
      };
      
      const ob = new ResizeObserver(() => {
        init();
        if (lastWalletKey.current === walletKey) {
          ob.disconnect();
        }
      });
      ob.observe(el);
      return () => ob.disconnect();
    }
  }, [walletKey, walletSlides.length]);

  const scrollBalanceTo = (targetIdx: number) => {
    const el = balanceRef.current;
    if (!el || balanceSlides.length <= 1) return;
    const domIdx = targetIdx + 1;
    el.scrollTo({ left: domIdx * el.clientWidth, behavior: 'smooth' });
  };

  const scrollWalletTo = (targetIdx: number) => {
    const el = walletRef.current;
    if (!el || walletSlides.length <= 1) return;
    const domIdx = targetIdx + 1;
    el.scrollTo({ left: domIdx * el.clientWidth, behavior: 'smooth' });
  };

  const recentTx = transactions.slice(0, 5);

  const filteredBreakdownTx = transactions.filter(t => {
    if (t.type !== 'expense') return false;
    if (t.category === 'transfer') return false;
    const txDate = new Date(t.transaction_date || t.created_at);
    
    if (timeFilter === 'fullMonth') {
      return txDate.getMonth() === selectedMonthDate.getMonth() && txDate.getFullYear() === selectedMonthDate.getFullYear();
    } else if (timeFilter === 'last30Days') {
      const diffTime = now.getTime() - txDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 30;
    } else if (timeFilter === 'last7Days') {
      const diffTime = now.getTime() - txDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    } else if (timeFilter === 'today') {
      return txDate.getDate() === now.getDate() && txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    }
    return false;
  });

  const totalFilteredExpense = filteredBreakdownTx.reduce((sum, t) => sum + t.amount, 0);

  const expenseByCategory = filteredBreakdownTx.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const breakdownData = Object.entries(expenseByCategory)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalFilteredExpense > 0 ? (amount / totalFilteredExpense) * 100 : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  const renderedBalanceSlides = balanceSlides.length > 1
    ? [
        { ...balanceSlides[balanceSlides.length - 1], key: `${balanceSlides[balanceSlides.length - 1].key}-clone-last` },
        ...balanceSlides,
        { ...balanceSlides[0], key: `${balanceSlides[0].key}-clone-first` },
      ]
    : balanceSlides;

  const renderedWalletSlides = walletSlides.length > 1
    ? [
        { ...walletSlides[walletSlides.length - 1], key: `${walletSlides[walletSlides.length - 1].key}-clone-last` },
        ...walletSlides,
        { ...walletSlides[0], key: `${walletSlides[0].key}-clone-first` },
      ]
    : walletSlides;

  return (
    <div className="px-5 py-5 space-y-5">
      {/* Total Balance Hero Slider */}
      {balanceSlides.length > 0 && (
        <div className="relative">
          <div
            ref={balanceRef}
            onScroll={(e) => {
              const el = e.currentTarget;
              if (balanceSlides.length <= 1) return;
              const rounded = Math.round(el.scrollLeft / el.clientWidth);
              const active = (rounded - 1 + balanceSlides.length) % balanceSlides.length;
              setBalanceIdx(active);

              if (Math.abs(el.scrollLeft - rounded * el.clientWidth) < 1) {
                if (rounded === 0) {
                  el.style.scrollBehavior = 'auto';
                  el.scrollLeft = balanceSlides.length * el.clientWidth;
                  el.style.scrollBehavior = '';
                } else if (rounded === balanceSlides.length + 1) {
                  el.style.scrollBehavior = 'auto';
                  el.scrollLeft = 1 * el.clientWidth;
                  el.style.scrollBehavior = '';
                }
              }
            }}
            className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
          >
            {renderedBalanceSlides.map((slide) => (
              <div key={slide.key} className="w-full shrink-0 snap-start">
                <Card elevated className="bg-total-balance border-0 text-white p-5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-text-secondary-dark text-sm font-medium">{slide.label}</span>
                    {isDemo && <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">{t('common.demo')}</span>}
                  </div>
                  <p className="font-display font-extrabold text-3xl mb-4">{formatMoney(slide.balance, currency)}</p>
                  <div className="flex gap-3">
                    <div className="flex-1 bg-white/10 rounded-xl p-3 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <ArrowUpRight className="w-4 h-4 text-income-dark shrink-0" />
                        <span className="text-xs text-text-secondary-dark truncate">{t('home.income')}</span>
                      </div>
                      <p className={`font-bold truncate ${slide.incomeStr.length > 13 ? 'text-xs' : 'text-sm'}`}>{slide.incomeStr}</p>
                    </div>
                    <div className="flex-1 bg-white/10 rounded-xl p-3 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <ArrowDownRight className="w-4 h-4 text-expense-dark shrink-0" />
                        <span className="text-xs text-text-secondary-dark truncate">{t('home.expense')}</span>
                      </div>
                      <p className={`font-bold truncate ${slide.expenseStr.length > 13 ? 'text-xs' : 'text-sm'}`}>{slide.expenseStr}</p>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
          {balanceSlides.length > 1 && (
            <>
              <SliderArrow position="left" disabled={false} onClick={() => scrollBalanceTo(balanceIdx - 1)} />
              <SliderArrow position="right" disabled={false} onClick={() => scrollBalanceTo(balanceIdx + 1)} />
              <SliderDots count={balanceSlides.length} active={balanceIdx} onSelect={scrollBalanceTo} />
            </>
          )}
        </div>
      )}

      {/* Wallets Slider */}
      <div>
        <div className="mb-3">
          <h3 className="font-display font-bold text-text-primary">{t('home.myWallets')}</h3>
        </div>
        <div className="relative">
          <div
            ref={walletRef}
            onScroll={(e) => {
              const el = e.currentTarget;
              if (walletSlides.length <= 1) return;
              const rounded = Math.round(el.scrollLeft / el.clientWidth);
              const active = (rounded - 1 + walletSlides.length) % walletSlides.length;
              setWalletIdx(active);

              if (Math.abs(el.scrollLeft - rounded * el.clientWidth) < 1) {
                if (rounded === 0) {
                  el.style.scrollBehavior = 'auto';
                  el.scrollLeft = walletSlides.length * el.clientWidth;
                  el.style.scrollBehavior = '';
                } else if (rounded === walletSlides.length + 1) {
                  el.style.scrollBehavior = 'auto';
                  el.scrollLeft = 1 * el.clientWidth;
                  el.style.scrollBehavior = '';
                }
              }
            }}
            className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
          >
            {renderedWalletSlides.map((slide) => (
              <div key={slide.key} className="w-full shrink-0 snap-start">
                <Card className="p-4">
                  <p className="text-xs font-semibold text-text-secondary mb-3">{slide.label}</p>
                  {slide.empty ? (
                    <div className="grid grid-cols-2 gap-3">
                      <AddWalletCard onClick={() => setShowAddWallet(true)} />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {slide.wallets.map((wallet) => {
                        const typeRow = walletTypes.find((t) => t.id === wallet.type);
                        const Icon = walletTypeIcon(typeRow?.icon);
                        return (
                          <button
                            key={wallet.id}
                            type="button"
                            onClick={() => setActiveWallet(wallet)}
                            className="text-left min-w-0"
                          >
                            <Card className="p-4 overflow-hidden">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                                <Icon className="w-5 h-5 text-primary" />
                              </div>
                              <p className="text-xs text-text-secondary font-medium mb-0.5 truncate">{wallet.name}</p>
                              <p className="font-display font-bold text-text-primary truncate text-xs">
                                {formatMoneyShort(wallet.balance, currency)}
                              </p>
                            </Card>
                          </button>
                        );
                      })}
                      {slide.showAddCard && <AddWalletCard onClick={() => setShowAddWallet(true)} />}
                    </div>
                  )}
                </Card>
              </div>
            ))}
          </div>
          {walletSlides.length > 1 && (
            <>
              <SliderArrow position="left" disabled={false} onClick={() => scrollWalletTo(walletIdx - 1)} />
              <SliderArrow position="right" disabled={false} onClick={() => scrollWalletTo(walletIdx + 1)} />
              <SliderDots count={walletSlides.length} active={walletIdx} onSelect={scrollWalletTo} />
            </>
          )}
        </div>
      </div>

      {/* Expense Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-text-primary">{t('home.expenseBreakdown')}</h3>
          <div className="flex items-center gap-2">
            {timeFilter === 'fullMonth' && (
              <button
                onClick={() => setMonthPickerOpen(true)}
                className="w-10 h-10 flex items-center justify-center bg-secondary/50 border border-secondary/30 rounded-xl hover:border-primary/50 hover:bg-secondary active:scale-95 transition-all text-text-primary min-h-[44px]"
                aria-label="Select month"
              >
                <CalendarIcon className="w-4.5 h-4.5 text-primary" />
              </button>
            )}
            <button
              onClick={() => setTimeFilterOpen(true)}
              className="flex items-center gap-1.5 bg-secondary/50 border border-secondary/30 text-text-primary text-xs font-semibold py-2.5 px-3 rounded-xl hover:bg-secondary hover:border-primary/30 transition-all select-none min-h-[44px]"
            >
              <span>{timeFilter === 'fullMonth' ? monthName : t(`home.${timeFilter}`)}</span>
              <ChevronDown className="w-3.5 h-3.5 text-text-secondary stroke-[2.5px]" />
            </button>
          </div>
        </div>
        <Card className="p-1">
          {breakdownData.length === 0 ? (
            <p className="text-sm text-text-secondary text-center py-6">{t('home.noExpenses')}</p>
          ) : (
            <div className="divide-y divide-secondary">
              {breakdownData.map((item) => {
                const catInfo = getCategory(item.category);
                const dynCat = categories.find((c) => c.id === item.category);
                const Icon = getIcon(dynCat?.icon || catInfo?.icon || 'CircleDot');
                
                return (
                  <div key={item.category} className="flex items-center gap-3 p-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-end mb-1.5">
                        <p className="font-semibold text-sm text-text-primary truncate pr-2">
                          {dynCat?.name || catInfo?.label || item.category}
                        </p>
                        <p className="font-bold text-sm text-text-primary">
                          {formatMoneyShort(item.amount, currency)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full" 
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-text-secondary w-8 text-right">
                          {item.percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="font-display font-bold text-text-primary mb-3">{t('home.recentActivity')}</h3>
        <Card className="divide-y divide-secondary">
          {recentTx.length === 0 ? (
            <p className="text-sm text-text-secondary text-center py-6">{t('home.noTransactions')}</p>
          ) : (
            recentTx.map((tx) => {
              const cat = getCategory(tx.category);
              const dynCat = categories.find((c) => c.id === tx.category);
              const isIncome = tx.type === 'income';
              return (
                <button
                  key={tx.id}
                  type="button"
                  onClick={() => setEditingTransaction(tx)}
                  className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-secondary transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isIncome ? 'bg-income/10' : 'bg-secondary'}`}>
                    {isIncome ? (
                      <TrendingUp className="w-5 h-5 text-income" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-text-secondary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="font-semibold text-sm text-text-primary truncate mb-0.5">{tx.notes || dynCat?.name || cat?.label || tx.category}</p>
                    <p className="text-[11px] text-text-secondary truncate">{tx.spent_by}</p>
                    <p className="text-[10px] text-text-secondary/70 truncate">{formatRelative(tx.created_at)}</p>
                  </div>
                  <div className="shrink-0 flex items-center">
                    <p className={`font-bold ${formatMoneyShort(tx.amount, currency).length > 12 ? 'text-xs' : 'text-sm'} ${isIncome ? 'text-income' : 'text-text-primary'}`}>
                      {isIncome ? '+' : '-'}{formatMoneyShort(tx.amount, currency)}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </Card>
      </div>

      <AddWalletSheet open={showAddWallet} onClose={() => setShowAddWallet(false)} />
      <WalletDetailsSheet wallet={activeWallet} open={Boolean(activeWallet)} onClose={() => setActiveWallet(null)} />
      <EditTransactionSheet open={Boolean(editingTransaction)} transaction={editingTransaction} onClose={() => setEditingTransaction(null)} />

      <CustomMonthPicker
        value={selectedMonth}
        onChange={setSelectedMonth}
        open={monthPickerOpen}
        onClose={() => setMonthPickerOpen(false)}
      />

      <CustomSelectSheet
        title={t('common.type')}
        open={timeFilterOpen}
        onClose={() => setTimeFilterOpen(false)}
        value={timeFilter}
        onChange={(val) => setTimeFilter(val as typeof timeFilter)}
        options={[
          { value: 'fullMonth', label: monthName },
          { value: 'last30Days', label: t('home.last30Days') },
          { value: 'last7Days', label: t('home.last7Days') },
          { value: 'today', label: t('home.today') },
        ]}
      />
    </div>
  );
}
