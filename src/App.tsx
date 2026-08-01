import { useState, useEffect } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { ToastProvider } from '@/context/ToastContext';
import { Toaster } from '@/components/ui/Toaster';
import { AppShell, type TabKey } from '@/components/AppShell';
import { TopBar } from '@/components/TopBar';
import { LoginScreen } from '@/screens/LoginScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { TransactionsScreen } from '@/screens/TransactionsScreen';
import { BudgetScreen } from '@/screens/BudgetScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { AddTransactionSheet } from '@/components/AddTransactionSheet';

function AppContent() {
  const { profile } = useApp();
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [showAddTx, setShowAddTx] = useState(false);

  const isAuthenticated = Boolean(profile);

  // Reset tab when leaving app
  useEffect(() => {
    if (!isAuthenticated) setActiveTab('home');
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <>
      <AppShell 
        showNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onAddClick={() => setShowAddTx(true)}
      >
        <TopBar />
        {activeTab === 'home' && <HomeScreen />}
        {activeTab === 'transactions' && <TransactionsScreen />}
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

export default function App() {
  return (
    <ToastProvider>
      <AppProvider>
        <AppContent />
        <Toaster />
      </AppProvider>
    </ToastProvider>
  );
}