import { useEffect } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import type { AppearanceMode, ColorPreset } from '@/lib/types';
import { ToastProvider } from '@/context/ToastContext';
import { Toaster } from '@/components/ui/Toaster';
import { LoginScreen } from '@/screens/LoginScreen';
import { PairFlowLoader } from '@/components/ui/PairFlowLoader';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { MobilePwaLayout } from '@/layouts/MobilePwaLayout';
import { DesktopDashboardLayout } from '@/layouts/DesktopDashboardLayout';

function AppContent() {
  const { profile, loading } = useApp();
  const { setAppearanceMode, setColorPreset } = useTheme();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const isAuthenticated = Boolean(profile);

  // Sync preference theme from profile
  useEffect(() => {
    if (isAuthenticated && profile?.appearance_mode) {
      setAppearanceMode(profile.appearance_mode as AppearanceMode);
    }
    if (isAuthenticated && profile?.color_preset) {
      setColorPreset(profile.color_preset as ColorPreset);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, profile?.appearance_mode, profile?.color_preset]);

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

  return isDesktop ? <DesktopDashboardLayout /> : <MobilePwaLayout />;
}

function BridgeWithLang() {
  const { profile } = useApp();

  return (
    <LanguageProvider userLanguage={profile?.language}>
      <ToastProvider>
        <ThemeProvider>
          <AppContent />
          <Toaster />
        </ThemeProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BridgeWithLang />
    </AppProvider>
  );
}
