import { useState, useEffect } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { AppShell, type TabKey } from '@/components/AppShell';
import { TopBar } from '@/components/TopBar';
import { LoginScreen } from '@/screens/LoginScreen';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { TransactionsScreen } from '@/screens/TransactionsScreen';
import { BudgetScreen } from '@/screens/BudgetScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';

function AppContent() {
  const { profile, household, isDemo } = useApp();
  const [activeTab, setActiveTab] = useState<TabKey>('home');

  // Determine which screen to show
  const isAuthenticated = Boolean(profile);
  const needsOnboarding = isAuthenticated && !household && !isDemo;
  const showApp = isAuthenticated && (Boolean(household) || isDemo);

  // Reset tab when leaving app
  useEffect(() => {
    if (!showApp) setActiveTab('home');
  }, [showApp]);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  if (needsOnboarding) {
    return <OnboardingScreen />;
  }

  if (showApp) {
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

  return <LoginScreen />;
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
