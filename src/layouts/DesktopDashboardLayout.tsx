import React, { useState } from 'react';
import { DesktopSidebar, type DesktopTabKey } from '@/components/desktop/DesktopSidebar';
import { DesktopHeader } from '@/components/desktop/DesktopHeader';
import { SettingsSubPanel } from '@/components/desktop/SettingsSubPanel';
import { CommandPalette } from '@/components/desktop/CommandPalette';
import { DesktopAddTransactionModal } from '@/screens/desktop/DesktopAddTransactionModal';
import { FinanceDateRangeProvider } from '@/context/FinanceDateRangeContext';

import { DesktopOverviewScreen } from '@/screens/desktop/DesktopOverviewScreen';
import { DesktopWalletsWorkspace } from '@/screens/desktop/DesktopWalletsWorkspace';
import { DesktopAnalyticsScreen } from '@/screens/desktop/DesktopAnalyticsScreen';
import { DesktopTransactionsScreen } from '@/screens/desktop/DesktopTransactionsScreen';
import { DesktopBudgetsGoalsScreen } from '@/screens/desktop/DesktopBudgetsGoalsScreen';
import { DesktopBulkCenterScreen } from '@/screens/desktop/DesktopBulkCenterScreen';
import { DesktopCircleMembersScreen } from '@/screens/desktop/DesktopCircleMembersScreen';

interface TransactionFilter {
  category?: string;
  loggedBy?: string;
}

export const DesktopDashboardLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DesktopTabKey>(() => {
    return (localStorage.getItem('pairflow_desktop_active_tab') as DesktopTabKey) || 'overview';
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('pairflow_sidebar_collapsed') === 'true';
  });

  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [transactionDateFilter, setTransactionDateFilter] = useState<string | null>(null);
  const [transactionFilter, setTransactionFilter] = useState<TransactionFilter | null>(null);

  const handleTabChange = (tab: DesktopTabKey) => {
    setActiveTab(tab);
    if (tab !== 'transactions') setTransactionFilter(null);
    localStorage.setItem('pairflow_desktop_active_tab', tab);
  };

  const handleToggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem('pairflow_sidebar_collapsed', String(next));
  };

  const openPalette = () => setPaletteOpen(true);
  const closePalette = () => setPaletteOpen(false);

  const handleOpenTransactionsForDate = (dateKey: string) => {
    setTransactionFilter(null);
    setTransactionDateFilter(dateKey);
    handleTabChange('transactions');
  };

  const handleOpenTransactionsForMember = (memberName: string) => {
    setTransactionDateFilter(null);
    setTransactionFilter({ loggedBy: memberName });
    handleTabChange('transactions');
  };

  const handleOpenTransactionsForCategory = (categoryKey: string) => {
    setTransactionDateFilter(null);
    setTransactionFilter({ category: categoryKey });
    handleTabChange('transactions');
  };

  return (
    <FinanceDateRangeProvider>
      <div data-testid="desktop-dashboard-layout" className="h-screen bg-bg-app flex flex-row overflow-hidden font-sans">
        {/* Collapsible Sidebar Navigation */}
        <DesktopSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          collapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          onOpenSettings={() => setShowSettings(true)}
        />

        {/* Main Workspace Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          {/* Sticky Header Bar — stays fixed because only <main> scrolls */}
          <DesktopHeader
            onOpenAddTransaction={() => setShowAddTransaction(true)}
            onOpenSettings={() => setShowSettings(true)}
            onOpenCommandPalette={openPalette}
          />

          {/* Scrollable Viewport Content Container */}
          <main
            data-testid="desktop-dashboard-main"
            tabIndex={-1}
            className="flex-1 min-h-0 overflow-y-auto p-8 max-w-7xl w-full mx-auto space-y-6 focus:outline-none"
          >
            {activeTab === 'overview' && (
              <DesktopOverviewScreen
                onSelectActivityDate={handleOpenTransactionsForDate}
                onSelectMember={handleOpenTransactionsForMember}
                onSelectCategory={handleOpenTransactionsForCategory}
              />
            )}
            {activeTab === 'wallets' && (
              <DesktopWalletsWorkspace onViewAllTransactions={() => handleTabChange('transactions')} />
            )}
            {activeTab === 'analytics' && (
              <DesktopAnalyticsScreen
                onSelectMember={handleOpenTransactionsForMember}
                onSelectCategory={handleOpenTransactionsForCategory}
              />
            )}
            {activeTab === 'transactions' && (
              <DesktopTransactionsScreen
                dateFilter={transactionDateFilter}
                categoryFilter={transactionFilter?.category}
                loggedByFilter={transactionFilter?.loggedBy}
                onDateFilterConsumed={() => setTransactionDateFilter(null)}
              />
            )}
            {activeTab === 'budgets-goals' && <DesktopBudgetsGoalsScreen />}
            {activeTab === 'bulk-import-export' && <DesktopBulkCenterScreen />}
            {activeTab === 'circle-members' && <DesktopCircleMembersScreen />}
          </main>
        </div>

        {/* Global Command Palette (Ctrl/⌘ + K) */}
        <CommandPalette
          open={paletteOpen}
          onOpen={openPalette}
          onClose={closePalette}
          onNavigate={handleTabChange}
          onAddTransaction={() => setShowAddTransaction(true)}
        />

        {/* Modals & Slide-in Panels */}
        <DesktopAddTransactionModal
          isOpen={showAddTransaction}
          onClose={() => setShowAddTransaction(false)}
        />

        <SettingsSubPanel
          open={showSettings}
          onClose={() => setShowSettings(false)}
        />
      </div>
    </FinanceDateRangeProvider>
  );
};


