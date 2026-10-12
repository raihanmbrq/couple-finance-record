import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, ArrowRight, BarChart3, MonitorSmartphone, Ticket, Users2, WalletCards } from 'lucide-react';

interface LoginScreenProps {
  onBackToLanding?: () => void;
}

export function LoginScreen({ onBackToLanding }: LoginScreenProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { signIn, enterDemo, loading, error } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleBack = () => {
    if (onBackToLanding) {
      onBackToLanding();
    } else {
      navigate('/');
    }
  };

  const handleDemoClick = async () => {
    await enterDemo();
    navigate('/app');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (!email || !password) {
      setLocalError(t('login.fillAll'));
      return;
    }
    try {
      await signIn(email, password);
      navigate('/app');
    } catch {
      // Error is set in context.
    }
  };

  const displayError = localError || error;

  const featureCards = [
    { icon: WalletCards, label: 'Wallet pribadi dan circle' },
    { icon: Users2, label: 'Pemilik dompet terlihat jelas' },
    { icon: BarChart3, label: 'Ringkasan cashflow bulanan' },
  ];

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(440px,0.95fr)]">
      <button
        type="button"
        onClick={handleBack}
        className="fixed left-5 top-5 z-20 inline-flex items-center gap-2 rounded-xl border border-secondary/60 bg-surface/90 px-3 py-2 text-xs font-semibold text-text-secondary shadow-soft transition-colors hover:bg-secondary hover:text-text-primary lg:left-8 lg:top-8"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Kembali ke Beranda</span>
      </button>

      <section className="hidden min-h-screen bg-primary px-10 py-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pt-20">
          <div className="mb-8 flex items-center gap-4">
            <img
              src="/icons/icon-512.png"
              alt="PairFlow logo"
              className="h-16 w-16 rounded-2xl object-contain shadow-card"
            />
            <div>
              <p className="font-display text-3xl font-extrabold leading-tight">PairFlow</p>
              <p className="text-sm font-medium text-white/75">{t('login.tagline')}</p>
            </div>
          </div>

          <div className="max-w-xl">
            <h1 className="font-display text-5xl font-extrabold leading-tight">
              Catat cashflow bareng pasangan tanpa salah pilih dompet.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/80">
              Semua transaksi, wallet, dan aktivitas circle tetap kebaca jelas dari satu tempat.
            </p>
          </div>
        </div>

        <div className="grid max-w-2xl grid-cols-3 gap-3">
          {featureCards.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-2xl bg-white/12 p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/16">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold leading-snug text-white/90">{item.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      <main className="flex min-h-screen flex-col justify-center px-6 py-24 lg:px-12 xl:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-surface shadow-card lg:hidden">
              <img
                src="/icons/icon-512.png"
                alt="PairFlow logo"
                className="h-16 w-16 rounded-2xl object-contain"
              />
            </div>
            <p className="hidden text-xs font-bold uppercase text-primary lg:block">PairFlow Account</p>
            <h1 className="mb-1 font-display text-3xl font-extrabold text-text-primary lg:mt-2 lg:text-4xl">
              PairFlow
            </h1>
            <p className="text-sm text-text-secondary">{t('login.tagline')}</p>
          </div>

          <div className="card-elevated space-y-4 p-6 lg:p-7">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label={t('login.email')}
                type="email"
                placeholder={t('login.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                label={t('login.password')}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {displayError && (
                <div className="rounded-lg border border-expense/20 bg-expense/10 px-3 py-2 text-sm text-expense">
                  {displayError}
                </div>
              )}

              <Button type="submit" fullWidth disabled={loading}>
                {loading ? t('login.pleaseWait') : t('login.signIn')}
              </Button>
            </form>

            <button
              type="button"
              onClick={() => navigate('/invite')}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              <Ticket className="h-4 w-4" />
              {t('invite.haveTokenCta')}
            </button>
          </div>

          <button
            type="button"
            onClick={handleDemoClick}
            className="mx-auto mt-6 flex items-center gap-2 rounded-xl border-2 border-dashed border-primary/30 px-5 py-3 font-semibold text-primary transition-colors hover:bg-primary/10 active:bg-primary/20 lg:w-full lg:justify-center"
          >
            <MonitorSmartphone className="h-5 w-5" />
            {t('login.tryDemo')}
            <ArrowRight className="h-4 w-4" />
          </button>

          <p className="mt-6 text-center text-xs text-text-secondary/80">
            {t('login.terms')}
          </p>
        </div>
      </main>
    </div>
  );
}
