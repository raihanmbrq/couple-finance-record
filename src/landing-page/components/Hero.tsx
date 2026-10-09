import { useNavigate } from 'react-router-dom';
import { ArrowRight, Play, Heart, Wallet, TrendingUp, Users, Check, Zap } from 'lucide-react';

interface HeroProps {
  onSignUp?: () => void;
  onDemo?: () => void;
}

export default function Hero({ onSignUp, onDemo }: HeroProps) {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (onSignUp) onSignUp();
    else navigate('/onboarding');
  };

  const handleDemo = () => {
    if (onDemo) onDemo();
    else navigate('/onboarding?mode=demo');
  };
  return (
    <section className="relative overflow-hidden pt-28 pb-20 lg:pt-40 lg:pb-32">
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50/60 via-white to-white" />
        <div className="absolute -top-24 -right-24 h-[500px] w-[500px] rounded-full bg-brand-200/30 blur-[120px]" />
        <div className="absolute top-40 -left-32 h-[400px] w-[400px] rounded-full bg-rose-200/25 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #0f172a 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
          {/* Left: Content */}
          <div className="animate-fade-up text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200/60 bg-brand-50/80 px-4 py-1.5 text-sm font-medium text-brand-700 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-pulse-ring" />
              Platform Keuangan Pasangan #1
            </div>

            {/* Headline */}
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.5rem] text-balance">
              Kelola Kas Bersama{' '}
              <span className="relative whitespace-nowrap">
                <span className="relative z-10 bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent">
                  Pasangan
                </span>
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 300 12"
                  fill="none"
                >
                  <path
                    d="M2 9C50 3 150 3 298 9"
                    stroke="#34d399"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              , Real-time & Tanpa Drama.
            </h1>

            {/* Sub-headline */}
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg lg:mx-0">
              Satu akun rumah tangga, terhubung instan antara HP Suami & Istri.
              Catat transaksi {'<'}5 detik, pantau multi-wallet, dan wujudkan
              Kantong Impian bersama.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <button
                type="button"
                onClick={handleGetStarted}
                className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-7 py-3.5 text-base font-semibold text-white shadow-glow-emerald transition-all hover:shadow-lg hover:brightness-105 active:scale-[0.97] sm:w-auto"
              >
                <span className="relative z-10">Mulai Gratis Sekarang</span>
                <ArrowRight className="relative z-10 h-5 w-5 transition-transform group-hover:translate-x-1" />
                <div className="absolute inset-0 animate-shimmer" />
              </button>
              <button
                type="button"
                onClick={handleDemo}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-7 py-3.5 text-base font-semibold text-slate-700 backdrop-blur-sm transition-all hover:border-slate-300 hover:bg-white hover:shadow-card active:scale-[0.97] sm:w-auto"
              >
                <Play className="h-4 w-4 fill-slate-700 text-slate-700" />
                Lihat Demo Live
              </button>
            </div>

            {/* Trust signals */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 lg:justify-start">
              {['Gratis Selamanya', 'Tanpa Kartu Kredit', 'Data Terenkripsi'].map((item) => (
                <div key={item} className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                  <Check className="h-4 w-4 text-brand-500" strokeWidth={2.5} />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Dual-device mockup */}
          <div className="animate-scale-in relative mt-8 lg:mt-0">
            <DualDeviceMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

function DualDeviceMockup() {
  return (
    <div className="relative mx-auto max-w-lg lg:max-w-none">
      {/* Sync indicator between devices */}
      <div className="absolute left-1/2 top-1/2 z-20 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
        <div className="relative">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-brand-200 bg-white shadow-float">
            <Zap className="h-6 w-6 text-brand-500 fill-brand-500" />
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-brand-300 animate-pulse-ring" />
        </div>
      </div>

      {/* Mobile phone frame */}
      <div className="relative z-10 mx-auto w-[280px] animate-float sm:w-[300px] lg:absolute lg:left-0 lg:top-16 lg:mx-0 lg:w-[260px]">
        <PhoneMockup />
      </div>

      {/* Laptop/Dashboard frame */}
      <div className="relative z-0 mt-6 lg:absolute lg:right-0 lg:top-0 lg:mt-0 lg:w-[380px] animate-float-delayed">
        <DashboardMockup />
      </div>
    </div>
  );
}

function PhoneMockup() {
  return (
    <div className="rounded-[2.5rem] border-[3px] border-slate-800 bg-slate-800 p-2 shadow-float-lg">
      <div className="relative overflow-hidden rounded-[2rem] bg-white">
        {/* Notch */}
        <div className="absolute left-1/2 top-0 z-10 h-6 w-28 -translate-x-1/2 rounded-b-2xl bg-slate-800" />

        {/* Screen content */}
        <div className="px-4 pt-9 pb-4">
          {/* Status bar */}
          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
            <span>9:41</span>
            <span>PairFlow</span>
            <span>100%</span>
          </div>

          {/* Balance card */}
          <div className="mt-3 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 p-4 text-white shadow-glow-emerald">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-brand-100">Total Saldo Bersama</span>
              <Users className="h-3.5 w-3.5 text-brand-100" />
            </div>
            <p className="mt-1 text-2xl font-bold">Rp 12.450.000</p>
            <div className="mt-2 flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 text-brand-100" />
              <span className="text-[10px] text-brand-100">+8.2% bulan ini</span>
            </div>
          </div>

          {/* Quick actions */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {['Catat', 'Wallet', 'Impian'].map((label) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1 rounded-xl bg-slate-50 py-2"
              >
                <div className="h-7 w-7 rounded-lg bg-brand-100 flex items-center justify-center">
                  <Wallet className="h-3.5 w-3.5 text-brand-600" />
                </div>
                <span className="text-[9px] font-medium text-slate-600">{label}</span>
              </div>
            ))}
          </div>

          {/* Recent transactions */}
          <div className="mt-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700">Transaksi Terakhir</span>
              <span className="text-[9px] text-brand-600 font-medium">Lihat semua</span>
            </div>
            <div className="mt-2 space-y-2">
              {[
                { name: 'GrabFood', amt: '-45.000', who: 'Istri', color: 'bg-rose-100 text-rose-600' },
                { name: 'Gaji Bulanan', amt: '+8.500.000', who: 'Suami', color: 'bg-brand-100 text-brand-600' },
                { name: 'Listrik PLN', amt: '-340.000', who: 'Bersama', color: 'bg-blue-100 text-blue-600' },
              ].map((tx) => (
                <div key={tx.name} className="flex items-center justify-between rounded-xl border border-slate-100 p-2">
                  <div className="flex items-center gap-2">
                    <div className={`h-7 w-7 rounded-lg ${tx.color} flex items-center justify-center`}>
                      <Wallet className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-700">{tx.name}</p>
                      <p className="text-[8px] text-slate-400">{tx.who}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold ${tx.amt.startsWith('+') ? 'text-brand-600' : 'text-slate-700'}`}>
                    {tx.amt}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-float-lg">
      {/* Browser bar */}
      <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
        <div className="h-2.5 w-2.5 rounded-full bg-rose-300" />
        <div className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <div className="h-2.5 w-2.5 rounded-full bg-brand-300" />
        <div className="ml-2 flex-1 rounded-md bg-slate-50 px-2 py-0.5 text-[9px] text-slate-400">
          app.pairflow.id
        </div>
      </div>

      {/* Dashboard content */}
      <div className="pt-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400">Dashboard</p>
            <p className="text-sm font-bold text-slate-800">Ringkasan Keuangan</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1">
              <Heart className="h-3 w-3 text-brand-600 fill-brand-600" strokeWidth={0} />
              <span className="text-[9px] font-semibold text-brand-700">Synced</span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { label: 'Pemasukan', val: '18.5jt', color: 'text-brand-600', bg: 'bg-brand-50' },
            { label: 'Pengeluaran', val: '6.1jt', color: 'text-rose-600', bg: 'bg-rose-50' },
            { label: 'Tabungan', val: '12.4jt', color: 'text-slate-700', bg: 'bg-slate-100' },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-xl ${stat.bg} p-2.5`}>
              <p className="text-[8px] font-medium text-slate-500">{stat.label}</p>
              <p className={`text-sm font-bold ${stat.color}`}>Rp {stat.val}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="mt-3 rounded-xl border border-slate-100 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-700">Pengeluaran Mingguan</span>
            <span className="text-[9px] text-slate-400">7 hari</span>
          </div>
          <div className="mt-3 flex h-20 items-end gap-1.5">
            {[40, 65, 35, 80, 50, 70, 55].map((h, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-brand-400 to-brand-500 transition-all"
                  style={{ height: `${h}%` }}
                />
                <span className="text-[7px] text-slate-400">{['S', 'S', 'R', 'K', 'J', 'S', 'M'][i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Budget progress */}
        <div className="mt-3 space-y-2">
          {[
            { label: 'Makanan', pct: 72, color: 'bg-amber-400' },
            { label: 'Transport', pct: 45, color: 'bg-brand-500' },
          ].map((budget) => (
            <div key={budget.label}>
              <div className="flex items-center justify-between text-[9px]">
                <span className="font-medium text-slate-600">{budget.label}</span>
                <span className="text-slate-400">{budget.pct}%</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${budget.color} transition-all`}
                  style={{ width: `${budget.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
