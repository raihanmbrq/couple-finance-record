import { useNavigate } from 'react-router-dom';
import { Globe, Plus, Smartphone, Zap, Download } from 'lucide-react';

const steps = [
  {
    icon: Globe,
    num: '01',
    title: 'Buka Browser',
    desc: 'Akses app.pairflow.id dari Chrome, Safari, atau browser apa pun di HP Anda. Tidak perlu install dari App Store atau Play Store.',
  },
  {
    icon: Plus,
    num: '02',
    title: 'Klik "Add to Home Screen"',
    desc: 'Tekan ikon share/browser menu, pilih "Add to Home Screen". PairFlow akan muncul seperti aplikasi native di HP Anda.',
  },
  {
    icon: Smartphone,
    num: '03',
    title: 'Langsung Pakai',
    desc: 'Ringan, cepat, dan responsif. PairFlow berjalan sebagai PWA — semua fitur tersedia tanpa download dari toko aplikasi.',
  },
];

interface PwaBannerProps {
  onSignUp?: () => void;
}

export default function PwaBanner({ onSignUp }: PwaBannerProps) {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (onSignUp) onSignUp();
    else navigate('/onboarding');
  };
  return (
    <section id="pwa" className="relative py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        {/* Banner card */}
        <div className="relative overflow-hidden rounded-[2rem] lg:rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 sm:p-12 lg:p-16">
          {/* Background decorations */}
          <div className="absolute inset-0 -z-0">
            <div className="absolute -top-40 -right-20 h-80 w-80 rounded-full bg-brand-500/20 blur-[100px]" />
            <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-rose-500/15 blur-[100px]" />
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
            />
          </div>

          <div className="relative">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-medium text-brand-300 backdrop-blur-sm">
              <Zap className="h-3.5 w-3.5 fill-brand-300 text-brand-300" />
              Progressive Web App
            </div>

            {/* Heading */}
            <h2 className="mt-5 max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] text-balance">
              Tanpa download di{' '}
              <span className="text-brand-400">App Store</span> atau{' '}
              <span className="text-brand-400">Play Store</span>!
            </h2>
            <p className="mt-4 max-w-xl text-base text-slate-300 sm:text-lg">
              PairFlow adalah PWA — install langsung dari browser, pakai seperti
              aplikasi native. Ringan, cepat, dan hemat penyimpanan HP.
            </p>

            {/* 3-Step guide */}
            <div className="mt-12 grid gap-6 sm:grid-cols-3 lg:gap-8">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.num}
                    className="group relative"
                  >
                    {/* Connector line */}
                    {index < steps.length - 1 && (
                      <div className="absolute top-7 left-full hidden h-px w-full bg-gradient-to-r from-white/20 to-transparent sm:block" />
                    )}

                    <div className="flex items-center gap-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm transition-all group-hover:border-brand-400/50 group-hover:bg-brand-500/10">
                        <Icon className="h-7 w-7 text-brand-400 transition-transform group-hover:scale-110" strokeWidth={1.8} />
                      </div>
                      <span className="text-3xl font-extrabold text-white/10 transition-colors group-hover:text-white/15">
                        {step.num}
                      </span>
                    </div>

                    <h3 className="mt-4 text-lg font-bold text-white">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                      {step.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <div className="mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleGetStarted}
                className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-400 to-brand-500 px-7 py-3.5 text-base font-semibold text-slate-900 shadow-glow-emerald transition-all hover:brightness-110 active:scale-[0.97]"
              >
                <Download className="h-5 w-5 transition-transform group-hover:translate-y-0.5" />
                Punya Undangan? Masuk
              </button>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="flex h-2 w-2 rounded-full bg-brand-400 animate-pulse-ring" />
                Ukuran {'<'}2MB — Super Ringan
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
