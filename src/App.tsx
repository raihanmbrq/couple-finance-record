import { useState, useEffect } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { AppShell, type TabKey } from '@/components/AppShell';
import { TopBar } from '@/components/TopBar';
import { LoginScreen } from '@/screens/LoginScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { TransactionsScreen } from '@/screens/TransactionsScreen';
import { BudgetScreen } from '@/screens/BudgetScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';

function AppContent() {
  const { profile } = useApp();
  const [activeTab, setActiveTab] = useState<TabKey>('home');

  const isAuthenticated = Boolean(profile);

  // Reset tab when leaving app
  useEffect(() => {
    if (!isAuthenticated) setActiveTab('home');
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <AppShell showNav activeTab={activeTab} onTabChange={setActiveTab}>
      <TopBar />
      {activeTab === 'home' && <HomeScreen />}
      {activeTab === 'transactions' && <TransactionsScreen />}
      {activeTab === 'budget' && <BudgetScreen />}
      {activeTab === 'profile' && <ProfileScreen />}
    </AppShell>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
