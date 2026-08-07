import { useState, useEffect } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
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
import { PairFlowLoader } from './components/ui/PairFlowLoader';

function AppContent() {
  const { profile, loading, updateThemeLocal } = useApp();
  const { setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    return (localStorage.getItem('activeTab') as TabKey) || 'home';
  });
  const [showAddTx, setShowAddTx] = useState(false);

  const isAuthenticated = Boolean(profile);

  // Sinkron tema dari profil Supabase ke ThemeProvider
  useEffect(() => {
    if (isAuthenticated && profile?.theme) {
      setTheme(profile.theme);
      updateThemeLocal(profile.theme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, profile?.theme]);

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  // Reset tab when leaving app
  useEffect(() => {
    if (!isAuthenticated) setActiveTab('home');
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-cream-50">
        <PairFlowLoader />
      </div>
    );
  }

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
        <ThemeProvider>
          <AppContent />
          <Toaster />
        </ThemeProvider>
      </AppProvider>
    </ToastProvider>
  );
}
