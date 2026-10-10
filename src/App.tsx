import { useEffect, useLayoutEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigationType,
} from 'react-router-dom';
import { AppProvider, useApp } from '@/context/AppContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import type { AppearanceMode, ColorPreset } from '@/lib/types';
import { ToastProvider } from '@/context/ToastContext';
import { Toaster } from '@/components/ui/Toaster';
import { LoginScreen } from '@/screens/LoginScreen';
import { OnboardingWalkthroughScreen } from '@/screens/OnboardingWalkthroughScreen';
import { LandingPage } from '@/landing-page/LandingPage';
import { HouseholdSyncArticlePage } from '@/landing-page/HouseholdSyncArticlePage';
import { FeatureArticlePage } from '@/landing-page/FeatureArticlePage';
import { FooterArticlePage } from '@/landing-page/FooterArticlePage';
import { StatusPage } from '@/landing-page/StatusPage';
import { PairFlowLoader } from '@/components/ui/PairFlowLoader';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { MobilePwaLayout } from '@/layouts/MobilePwaLayout';
import { DesktopDashboardLayout } from '@/layouts/DesktopDashboardLayout';
import { getRestoreScrollY } from '@/landing-page/articleNavigation';

function ProtectedDashboardRoute() {
  const { profile } = useApp();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  return isDesktop ? <DesktopDashboardLayout /> : <MobilePwaLayout />;
}

function GuestDemoRoute() {
  const { enterGuestDemo } = useApp();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  useEffect(() => {
    enterGuestDemo();
  }, [enterGuestDemo]);

  return isDesktop ? <DesktopDashboardLayout /> : <MobilePwaLayout />;
}

function PublicAuthRoute({ initialSignUp }: { initialSignUp: boolean }) {
  const { profile, isGuestDemo } = useApp();

  if (profile && !isGuestDemo) {
    return <Navigate to="/app" replace />;
  }

  return <LoginScreen initialSignUp={initialSignUp} />;
}

function RouteScrollManager() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    const restoreScrollY = getRestoreScrollY(location.state);
    if (restoreScrollY !== undefined) {
      window.scrollTo(0, restoreScrollY);
    } else if (navigationType !== 'POP') {
      window.scrollTo(0, 0);
    }
  }, [location.key, location.state, navigationType]);

  return null;
}

function PublicLandingRoute() {
  const { profile, isGuestDemo } = useApp();

  if (profile && !isGuestDemo) {
    return <Navigate to="/app" replace />;
  }

  return <LandingPage />;
}

function AppContent() {
  const { profile, loading } = useApp();
  const { setAppearanceMode, setColorPreset } = useTheme();
  const location = useLocation();

  const isAuthenticated = Boolean(profile);
  const shouldAnimatePage =
    typeof location.state === 'object' &&
    location.state !== null &&
    (location.state as Record<string, unknown>).pageTransition === 'onboarding';

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

  return (
    <>
      <RouteScrollManager />
      <div className={shouldAnimatePage ? 'animate-page-enter' : undefined}>
        <Routes>
          {/* Root / Landing Page */}
          <Route path="/" element={<PublicLandingRoute />} />

          {/* Feature Onboarding Walkthrough */}
          <Route path="/onboarding" element={<OnboardingWalkthroughScreen />} />
          <Route path="/intro" element={<Navigate to="/onboarding" replace />} />
          <Route path="/features/household-sync" element={<HouseholdSyncArticlePage />} />
          <Route path="/features/:slug" element={<FeatureArticlePage />} />
          <Route path="/bantuan/status" element={<StatusPage />} />
          <Route path="/:section/:slug" element={<FooterArticlePage />} />

          {/* Auth Routes */}
          <Route path="/login" element={<PublicAuthRoute initialSignUp={false} />} />
          <Route path="/signin" element={<Navigate to="/login" replace />} />
          <Route path="/signup" element={<PublicAuthRoute initialSignUp={true} />} />
          <Route path="/register" element={<Navigate to="/signup" replace />} />

          {/* Main App Dashboard */}
          <Route path="/app" element={<ProtectedDashboardRoute />} />
          <Route path="/demo" element={<GuestDemoRoute />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
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
    <BrowserRouter>
      <AppProvider>
        <BridgeWithLang />
      </AppProvider>
    </BrowserRouter>
  );
}
