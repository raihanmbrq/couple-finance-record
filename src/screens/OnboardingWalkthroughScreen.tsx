import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import {
  Zap,
  PiggyBank,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Users,
  Smartphone,
  Lock,
  Sparkles,
  Receipt,
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  articlePath: string;
  renderVisual: () => JSX.Element;
}

export function OnboardingWalkthroughScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { profile } = useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const isDemoMode = searchParams.get('mode') === 'demo';
  const destination = isDemoMode ? '/demo' : profile ? '/app' : '/invite';

  const steps: OnboardingStep[] = [
    {
      id: 'pairing',
      title: 'Keuangan bareng, selalu sinkron',
      description: 'Scan QR, lalu pantau transaksi di dua layar.',
      articlePath: '/features/household-sync',
      renderVisual: () => (
        <div className="relative mx-auto w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-brand-500 animate-pulse-ring" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Status Sinkronisasi
              </span>
            </div>
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-800">
              Live Connected
            </span>
          </div>

          <div className="mt-4 flex items-center justify-around py-3">
            {/* Suami */}
            <div className="flex flex-col items-center">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-500 text-white shadow-md">
                <Users className="h-7 w-7" />
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white">
                  ✓
                </span>
              </div>
              <span className="mt-2 text-xs font-bold text-slate-800">Suami</span>
              <span className="text-[10px] text-slate-400">Admin</span>
            </div>

            {/* Sync icon in middle */}
            <div className="flex flex-col items-center px-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600 animate-bounce-subtle">
                <Smartphone className="h-4 w-4" />
              </div>
              <span className="mt-1 text-[10px] font-semibold text-brand-600">
                PWA Sync
              </span>
            </div>

            {/* Istri */}
            <div className="flex flex-col items-center">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-md">
                <Users className="h-7 w-7" />
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white">
                  ✓
                </span>
              </div>
              <span className="mt-2 text-xs font-bold text-slate-800">Istri</span>
              <span className="text-[10px] text-slate-400">Partner</span>
            </div>
          </div>

          <div className="mt-3 rounded-xl bg-slate-50 p-3 text-center border border-slate-100">
            <span className="text-[11px] text-slate-500">Kode Undangan Rumah Tangga:</span>
            <div className="mt-1 font-mono text-sm font-bold tracking-widest text-brand-700">
              PAIR-7729
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'multi-wallet',
      title: 'Semua dompet, satu ringkasan',
      description: 'Lihat saldo dan sumber dana tiap dompet.',
      articlePath: '/features/multi-wallet-source-of-funds',
      renderVisual: () => (
        <div className="mx-auto w-full max-w-sm space-y-2.5">
          {/* Card 1: BCA Rekening Bersama */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition-transform hover:scale-[1.02]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-sm text-xs">
                BCA
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Rekening Kas Bersama</p>
                <p className="text-[10px] text-slate-400">Bank Central Asia • Bersama</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-900">Rp 18.450.000</p>
              <span className="text-[10px] text-brand-600 font-medium">+ Kas Operasional</span>
            </div>
          </div>

          {/* Card 2: E-Wallet Mandiri Livin / GoPay */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition-transform hover:scale-[1.02]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 font-bold text-white shadow-sm text-xs">
                GOPAY
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">E-Wallet Jajan & Belanja</p>
                <p className="text-[10px] text-slate-400">Dompet Digital Harian</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-900">Rp 850.000</p>
              <span className="text-[10px] text-slate-400">Aktif</span>
            </div>
          </div>

          {/* Card 3: Dompet Tunai Cash */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition-transform hover:scale-[1.02]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 font-bold text-white shadow-sm text-xs">
                CASH
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Uang Kas Tunai</p>
                <p className="text-[10px] text-slate-400">Brankas Rumah</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-900">Rp 1.200.000</p>
              <span className="text-[10px] text-slate-400">Tersedia</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'fast-logging',
      title: 'Catat siapa yang membayar',
      description: 'Pilih dompet dan penanggung saat mencatat.',
      articlePath: '/features/attribution-tag-siapa-bayar',
      renderVisual: () => (
        <div className="mx-auto w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Contoh Transaksi</span>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              <Zap className="h-3 w-3" /> 2.8 Detik
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Belanja Bulanan Supermarket</p>
                <p className="text-[10px] text-slate-400">Kebutuhan Dapur & Bayi</p>
              </div>
            </div>
            <span className="text-sm font-extrabold text-rose-600">-Rp 450.000</span>
          </div>

          {/* Attribution Tag */}
          <div className="mt-3">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Ditanggung Oleh:
            </span>
            <div className="mt-1.5 flex gap-1.5">
              <span className="rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm flex items-center gap-1">
                ✓ Suami (BCA)
              </span>
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                Istri
              </span>
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                Kas Bersama
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'budgets-goals',
      title: 'Anggaran dan tujuan bersama',
      description: 'Lihat pengeluaran dan tabungan keluarga.',
      articlePath: '/features/smart-budgeting-limits',
      renderVisual: () => (
        <div className="mx-auto w-full max-w-sm space-y-3">
          {/* Budget bar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">🍽️ Kuliner & Makan Luar</span>
              <span className="font-semibold text-slate-500">Rp 2.100.000 / Rp 3.000.000</span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand-500" style={{ width: '70%' }} />
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] text-slate-400">
              <span>Terpakai 70%</span>
              <span className="text-brand-600 font-medium">Sisa Rp 900.000</span>
            </div>
          </div>

          {/* Sinking fund goal */}
          <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <PiggyBank className="h-4 w-4 text-brand-600" />
                <span className="font-bold text-brand-900">🏖️ Liburan Akhir Tahun</span>
              </div>
              <span className="font-bold text-brand-700">80%</span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-brand-200/60">
              <div className="h-full rounded-full bg-brand-600" style={{ width: '80%' }} />
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] text-brand-700">
              <span>Terkumpul: Rp 12.000.000</span>
              <span className="font-semibold">Target: Rp 15.000.000</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'bank-security',
      title: 'Keuangan keluarga tetap privat',
      description: 'Hanya anggota household yang dapat melihat data.',
      articlePath: '/features/bank-grade-data-security',
      renderVisual: () => (
        <div className="mx-auto w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-slate-900 text-white shadow-lg">
            <Lock className="h-8 w-8 text-brand-300" />
          </div>
          <h4 className="mt-3 text-sm font-extrabold text-slate-900">
            Perlindungan Row Level Security (RLS)
          </h4>
          <p className="mt-1 text-xs text-slate-500">
            Akses data dibatasi ketat per-Household. Tidak ada pengguna lain yang dapat mengintip kas Anda.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2 text-left">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <CheckCircle2 className="h-3.5 w-3.5 text-brand-600" />
                Auth Supabase
              </div>
              <p className="mt-0.5 text-[10px] text-slate-400">Token JWT aman</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <CheckCircle2 className="h-3.5 w-3.5 text-brand-600" />
                Cloud Backup
              </div>
              <p className="mt-0.5 text-[10px] text-slate-400">Aman & Terjamin</p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const current = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep((prev) => prev + 1);
    } else {
      navigate(destination);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    navigate(destination);
  };

  const handleStartPairFlow = () => {
    navigate(destination, { state: { pageTransition: 'onboarding' } });
  };

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        if (!isLastStep) setCurrentStep((prev) => prev + 1);
      } else if (e.key === 'ArrowLeft') {
        if (currentStep > 0) setCurrentStep((prev) => prev - 1);
      } else if (e.key === 'Escape') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, isLastStep]);

  return (
    <div className="onboarding-walkthrough bg-slate-50/80 font-figtree text-slate-900 flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Top Header */}
      <header className="onboarding-walkthrough__header mx-auto w-full max-w-5xl px-5 sm:px-8 pt-3 sm:pt-4 pb-1 flex shrink-0 items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 group transition-opacity hover:opacity-80"
        >
          <img
            src="/icons/icon-192.png"
            alt="PairFlow Logo"
            className="h-8 w-8 rounded-xl object-contain shadow-sm"
          />
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Pair<span className="text-brand-600">Flow</span>
          </span>
        </button>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-xs font-semibold text-slate-400">
            Langkah {currentStep + 1} dari {steps.length}
          </span>
          <button
            type="button"
            onClick={handleSkip}
            className="min-h-11 rounded-xl px-3.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
          >
            Lewati
          </button>
        </div>
      </header>

      {/* Main Walkthrough Container */}
      <main className="onboarding-walkthrough__main mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col justify-center px-5 py-2 sm:px-8 sm:py-3">
        {/* Step Progress Bar & Segmented Indicator */}
        <div className="onboarding-walkthrough__progress mb-3">
          <div className="grid grid-cols-5 gap-2">
            {steps.map((step, idx) => (
              <button
                key={step.id}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep
                    ? 'bg-brand-500 shadow-sm'
                    : idx < currentStep
                    ? 'bg-brand-300'
                    : 'bg-slate-200'
                }`}
                aria-label={`Buka slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Content Card */}
        <div className="onboarding-walkthrough__card relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-xl transition-all duration-300 sm:p-6 lg:p-8">
          <div className="grid items-center gap-4 lg:grid-cols-2 lg:gap-8">
            {/* Left Column: Description & Highlights */}
            <div className="order-last flex flex-col items-start text-left lg:order-first">
              <h2 className="onboarding-walkthrough__title text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl text-balance lg:text-3xl">
                {current.title}
              </h2>

              {/* Main Description */}
              <p className="onboarding-walkthrough__description mt-2 text-sm leading-relaxed text-slate-600">
                {current.description}
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate(current.articlePath, {
                    state: {
                      returnTo: `${location.pathname}${location.search}${location.hash}`,
                      returnScrollY: window.scrollY,
                      returnLabel: 'walkthrough',
                    },
                  })
                }
                className="onboarding-walkthrough__details mt-2 inline-flex min-h-11 items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-xs font-bold text-brand-700 transition-colors hover:bg-brand-100"
              >
                Detail fitur
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Right Column: Visual Preview Card */}
            <div className="onboarding-walkthrough__visual order-first flex items-center justify-center rounded-2xl border border-slate-100 bg-slate-50/80 p-2 sm:p-4 lg:order-last">
              {current.renderVisual()}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation Controls */}
      <footer className="onboarding-walkthrough__footer mx-auto w-full max-w-4xl shrink-0 px-5 pt-2 pb-3 sm:px-8">
        <div className="flex flex-row items-center justify-between gap-3">
          {/* Back button or Login link */}
          <div className="flex items-center gap-3">
            {currentStep > 0 ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="inline-flex min-h-11 items-center text-xs font-semibold text-slate-500 transition-colors hover:text-slate-800"
              >
                Sudah punya akun? <span className="text-brand-600 underline">Masuk</span>
              </button>
            )}
          </div>

          {/* Next or Finish CTA */}
          <div className="flex items-center gap-3">
            {!isLastStep ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-3 text-sm font-bold text-white shadow-glow-emerald transition-all hover:brightness-105 active:scale-[0.97] sm:px-7"
              >
                <span>Lanjut</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleStartPairFlow}
                  className="group relative inline-flex min-h-11 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-3 text-xs font-bold text-white shadow-glow-emerald transition-all hover:brightness-105 active:scale-[0.97] sm:px-8 sm:py-3.5 sm:text-sm"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    {isDemoMode ? (
                      <>
                        <span className="sm:hidden">Coba Demo</span>
                        <span className="hidden sm:inline">Coba Demo Interaktif</span>
                      </>
                    ) : (
                      <>
                        <span className="sm:hidden">Daftar</span>
                        <span className="hidden sm:inline">Punya Undangan? Daftar</span>
                      </>
                    )}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 animate-shimmer" />
                </button>
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default OnboardingWalkthroughScreen;
