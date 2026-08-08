import { useState, useEffect } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import type { AppearanceMode, ColorPreset } from '@/lib/types';
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
  const { profile, loading } = useApp();
  const { setAppearanceMode, setColorPreset } = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    return (localStorage.getItem('activeTab') as TabKey) || 'home';
  });
  const [showAddTx, setShowAddTx] = useState(false);

  const isAuthenticated = Boolean(profile);

  // Sinkron preferensi tema dari profil Supabase ke ThemeProvider
  useEffect(() => {
    if (isAuthenticated && profile?.appearance_mode) {
      setAppearanceMode(profile.appearance_mode as AppearanceMode);
    }
    if (isAuthenticated && profile?.color_preset) {
      setColorPreset(profile.color_preset as ColorPreset);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, profile?.appearance_mode, profile?.color_preset]);

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  // Reset tab when leaving app
  useEffect(() => {
    if (!isAuthenticated) setActiveTab('home');
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-bg-app">
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
