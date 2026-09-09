import { useState, useEffect } from 'react';
import { AppShell, type TabKey } from '@/components/AppShell';
import { TopBar } from '@/components/TopBar';
import { HomeScreen } from '@/screens/HomeScreen';
import { TransactionsScreen } from '@/screens/TransactionsScreen';
import { BudgetScreen } from '@/screens/BudgetScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { AddTransactionSheet } from '@/components/AddTransactionSheet';
import { Monitor, X } from 'lucide-react';

export function MobilePwaLayout() {
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    return (localStorage.getItem('activeTab') as TabKey) || 'home';
  });
  const [showAddTx, setShowAddTx] = useState(false);
  const [txDateFilter, setTxDateFilter] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  return (
    <>
      {showBanner && (
        <div 
          data-testid="mobile-desktop-advisory-banner"
          className="bg-accent/15 border-b border-accent/20 text-text-primary px-3 py-1.5 text-xs flex items-center justify-between gap-2 z-50 sticky top-0"
        >
          <div className="flex items-center gap-1.5 truncate">
            <Monitor className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="truncate">Optimized for Mobile PWA. Switch to Desktop PC for the full Dashboard view.</span>
          </div>
          <button 
            onClick={() => setShowBanner(false)} 
            className="p-1 hover:bg-surface-hover rounded text-text-muted hover:text-text-primary"
            aria-label="Dismiss banner"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <AppShell 
        showNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onAddClick={() => setShowAddTx(true)}
      >
        <TopBar />
        {activeTab === 'home' && (
          <HomeScreen onOpenDate={(d) => {
            setTxDateFilter(d);
            setActiveTab('transactions');
          }} />
        )}
        {activeTab === 'transactions' && (
          <TransactionsScreen dateFilter={txDateFilter} onDateFilterConsumed={() => setTxDateFilter(null)} />
        )}
        {activeTab === 'budget' && <BudgetScreen />}
        {activeTab === 'profile' && <ProfileScreen />}
      </AppShell>

      <AddTransactionSheet 
        open={showAddTx} 
        onClose={() => setShowAddTx(false)} 
      />
    </>
  );
}

