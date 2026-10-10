import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BatteryFull,
  CalendarDays,
  Check,
  DollarSign,
  FileSpreadsheet,
  Home,
  Landmark,
  LayoutDashboard,
  Play,
  PiggyBank,
  Plus,
  Settings,
  ShoppingBag,
  TableProperties,
  Target,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  Users2,
  Wallet,
  Wifi,
  Zap,
} from 'lucide-react';

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
                <span className="relative z-10">Punya Undangan? Masuk</span>
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
    <div className="relative mx-auto w-full min-w-0 max-w-lg lg:min-h-[500px] lg:max-w-none">
      {/* Sync indicator between devices */}
      <div className="absolute left-[39%] top-1/2 z-20 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
        <div className="relative">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-brand-200 bg-white shadow-float">
            <Zap className="h-6 w-6 text-brand-500 fill-brand-500" />
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-brand-300 animate-pulse-ring" />
        </div>
      </div>

      {/* Mobile phone frame */}
      <div className="relative z-10 mx-auto w-[280px] animate-float sm:w-[300px] lg:absolute lg:left-0 lg:top-14 lg:mx-0 lg:w-[250px]">
        <PhoneMockup />
      </div>

      {/* Laptop/Dashboard frame */}
      <div className="relative z-0 mx-auto mt-6 w-full max-w-[420px] animate-float-delayed lg:absolute lg:right-0 lg:top-0 lg:mt-0">
        <DashboardMockup />
      </div>
    </div>
  );
}

function PhoneMockup() {
  const wallets = [
    { name: 'Joint Account', balance: '8.500.000', icon: PiggyBank, tone: 'bg-brand-50 text-brand-600' },
    { name: 'Andi Cash', balance: '1.250.000', icon: Wallet, tone: 'bg-amber-50 text-amber-600' },
    { name: 'Sari Bank', balance: '3.200.000', icon: Landmark, tone: 'bg-blue-50 text-blue-600' },
  ];

  const breakdown = [
    { name: 'Food & Groceries', amount: '2,4jt', pct: 72, bar: 'bg-amber-400' },
    { name: 'Bills & Utilities', amount: '1,7jt', pct: 52, bar: 'bg-blue-500' },
    { name: 'Transport', amount: '0,6jt', pct: 30, bar: 'bg-brand-500' },
  ];

  const recent = [
    { name: 'Groceries Indomaret', who: 'Sari', amount: '-85.000', icon: ShoppingBag, tone: 'bg-rose-50 text-rose-600', amountColor: 'text-slate-700' },
    { name: 'Monthly Salary', who: 'Andi', amount: '+5.000.000', icon: TrendingUp, tone: 'bg-emerald-50 text-emerald-600', amountColor: 'text-emerald-600' },
    { name: 'Electricity & Water', who: 'Bersama', amount: '-1.200.000', icon: Zap, tone: 'bg-slate-100 text-slate-600', amountColor: 'text-slate-700' },
  ];

  const leftNav = [
    { label: 'Home', icon: Home, active: true },
    { label: 'Transaksi', icon: ArrowLeftRight, active: false },
  ];
  const rightNav = [
    { label: 'Budget', icon: PiggyBank },
    { label: 'Profil', icon: User },
  ];

  return (
    <div className="rounded-[2.5rem] border-[3px] border-slate-800 bg-slate-800 p-2 shadow-2xl">
      <div className="relative overflow-hidden rounded-[2rem] bg-slate-50">
        {/* Dynamic island */}
        <div className="absolute left-1/2 top-1 z-20 h-4 w-16 -translate-x-1/2 rounded-full bg-slate-900" />

        {/* Screen content */}
        <div className="px-3.5 pb-16 pt-5">
          {/* Status bar */}
          <div className="flex items-center justify-between text-[9px] font-bold text-slate-800">
            <span>9:41</span>
            <span className="flex items-center gap-1.5" aria-label="Wi-Fi connected, battery full">
              <Wifi className="h-3 w-3" />
              <BatteryFull className="h-3.5 w-3.5" />
            </span>
          </div>

          {/* Top app bar */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/icons/icon-512.png" alt="PairFlow logo" className="h-7 w-7 rounded-lg object-contain" />
              <span className="text-sm font-extrabold tracking-tight text-slate-900">PairFlow</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-1">
              <div className="flex -space-x-1">
                <span className="flex h-4 w-4 items-center justify-center rounded-full border border-white bg-brand-500 text-[7px] font-bold text-white">A</span>
                <span className="flex h-4 w-4 items-center justify-center rounded-full border border-white bg-rose-400 text-[7px] font-bold text-white">S</span>
              </div>
              <span className="text-[8px] font-semibold text-slate-500">Andi &amp; Sari</span>
            </div>
          </div>

          {/* Greeting */}
          <div className="mt-3">
            <p className="text-sm font-extrabold tracking-tight text-slate-900">Dashboard</p>
            <p className="text-[9px] font-medium text-slate-400">Halo, Andi 👋</p>
          </div>

          {/* Total balance hero card */}
          <div className="mt-2.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-3.5 text-white shadow-lg shadow-emerald-900/15">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-medium text-emerald-50/90">Total Saldo Bersama</span>
              <Wallet className="h-3 w-3 text-emerald-50" />
            </div>
            <p className="mt-1 text-lg font-extrabold tracking-tight tabular-nums">Rp 12.450.000</p>
            <div className="mt-2.5 flex gap-2">
              <div className="flex-1 rounded-xl bg-white/10 p-2">
                <div className="flex items-center gap-1 text-[8px] text-emerald-50/90">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>Pemasukan</span>
                </div>
                <p className="mt-0.5 text-[10px] font-bold tabular-nums">+Rp 9.200.000</p>
              </div>
              <div className="flex-1 rounded-xl bg-white/10 p-2">
                <div className="flex items-center gap-1 text-[8px] text-emerald-50/90">
                  <ArrowDownRight className="h-3 w-3" />
                  <span>Pengeluaran</span>
                </div>
                <p className="mt-0.5 text-[10px] font-bold tabular-nums">-Rp 3.450.000</p>
              </div>
            </div>
          </div>

          {/* Wallet mini slider */}
          <div className="mt-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-700">Wallet Saya</span>
              <span className="text-[8px] font-medium text-brand-600">Lihat semua</span>
            </div>
            <div className="mt-1.5 flex gap-2">
              {wallets.map((w) => (
                <div key={w.name} className="min-w-0 flex-1 rounded-xl border border-slate-100 bg-white p-2 shadow-sm">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${w.tone}`}>
                    <w.icon className="h-3 w-3" strokeWidth={2.2} />
                  </div>
                  <p className="mt-1 truncate text-[8px] font-semibold text-slate-700">{w.name}</p>
                  <p className="truncate text-[8px] font-bold tabular-nums text-slate-900">Rp {w.balance}</p>
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex justify-center gap-1">
              <span className="h-1 w-4 rounded-full bg-brand-500" />
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span className="h-1 w-1 rounded-full bg-slate-300" />
            </div>
          </div>

          {/* Expense breakdown */}
          <div className="mt-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-700">Pengeluaran per Kategori</span>
              <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[7px] font-semibold text-slate-500">Bulan ini</span>
            </div>
            <div className="mt-1.5 space-y-2 rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm">
              {breakdown.map((item) => (
                <div key={item.name}>
                  <div className="flex items-center justify-between text-[8px]">
                    <span className="font-semibold text-slate-600">{item.name}</span>
                    <span className="font-bold tabular-nums text-slate-700">Rp {item.amount}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${item.bar}`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <div className="mt-3">
            <span className="text-[10px] font-bold text-slate-700">Aktivitas Terakhir</span>
            <div className="mt-1.5 space-y-1.5">
              {recent.map((tx) => (
                <div key={tx.name} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-2 shadow-sm">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${tx.tone}`}>
                      <tx.icon className="h-3 w-3" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[8px] font-semibold text-slate-700">{tx.name}</p>
                      <p className="text-[7px] text-slate-400">{tx.who}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 text-[9px] font-bold tabular-nums ${tx.amountColor}`}>{tx.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom navigation */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-slate-200 bg-white/95 px-2.5 pb-2.5 pt-2 backdrop-blur">
          {leftNav.map((item) => (
            <div key={item.label} className="flex w-11 flex-col items-center gap-0.5">
              <item.icon className={`h-4 w-4 ${item.active ? 'text-brand-600' : 'text-slate-400'}`} strokeWidth={item.active ? 2.5 : 2} />
              <span className={`text-[7px] font-semibold ${item.active ? 'text-brand-600' : 'text-slate-400'}`}>{item.label}</span>
            </div>
          ))}
          <div className="-mt-5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-4 border-slate-50 bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/30">
            <Plus className="h-5 w-5" strokeWidth={2.5} />
          </div>
          {rightNav.map((item) => (
            <div key={item.label} className="flex w-11 flex-col items-center gap-0.5">
              <item.icon className="h-4 w-4 text-slate-400" strokeWidth={2} />
              <span className="text-[7px] font-semibold text-slate-400">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardMockup() {
  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, active: true },
    { label: 'Wallets', icon: Wallet, active: false },
    { label: 'Analytics', icon: BarChart3, active: false },
    { label: 'Transactions', icon: TableProperties, active: false },
    { label: 'Budgets & Goals', icon: Target, active: false },
    { label: 'Import / Export', icon: FileSpreadsheet, active: false },
    { label: 'Circle Members', icon: Users2, active: false },
  ];

  const metrics = [
    { label: 'Total Balance', value: 'Rp 13,4jt', tone: 'text-slate-900', icon: Wallet, iconTone: 'bg-brand-500/15 text-brand-600' },
    { label: 'Total Income', value: 'Rp 9,2jt', tone: 'text-emerald-600', icon: TrendingUp, iconTone: 'bg-emerald-500/15 text-emerald-600' },
    { label: 'Total Expenses', value: 'Rp 3,45jt', tone: 'text-rose-600', icon: TrendingDown, iconTone: 'bg-rose-500/15 text-rose-600' },
    { label: 'Net Cashflow', value: 'Rp 5,75jt', tone: 'text-emerald-600', icon: DollarSign, iconTone: 'bg-emerald-500/15 text-emerald-600' },
  ];

  const members = [
    { name: 'Andi (Suami)', spent: 'Rp 1,05jt', pct: 45, bar: 'bg-brand-500' },
    { name: 'Sari (Istri)', spent: 'Rp 1,28jt', pct: 55, bar: 'bg-amber-400' },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      {/* Browser bar */}
      <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50/70 px-3 py-2">
        <div className="h-2.5 w-2.5 rounded-full bg-rose-300" />
        <div className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <div className="h-2.5 w-2.5 rounded-full bg-brand-300" />
        <div className="ml-2 flex-1 rounded-md bg-white px-2 py-0.5 text-[8px] text-slate-400">app.pairflow.id/dashboard</div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-[88px] shrink-0 border-r border-slate-100 bg-slate-50/60 p-2">
          <div className="flex items-center gap-1.5">
            <img src="/icons/icon-512.png" alt="PairFlow logo" className="h-5 w-5 rounded-md object-contain" />
            <span className="text-[9px] font-extrabold tracking-tight text-slate-900">PairFlow</span>
          </div>
          <p className="mt-0.5 text-[5px] font-medium uppercase tracking-wider text-slate-400">Household Finance</p>
          <div className="mt-2 space-y-1">
            {navItems.map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[7px] font-semibold ${
                  item.active ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-sm' : 'text-slate-500'
                }`}
              >
                <item.icon className="h-2.5 w-2.5 shrink-0" strokeWidth={2.2} />
                <span className="truncate">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[7px] font-semibold text-slate-400">
            <Settings className="h-2.5 w-2.5 shrink-0" />
            <span>Settings</span>
          </div>
        </div>

        {/* Workspace */}
        <div className="min-w-0 flex-1 p-2.5">
          {/* Top header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 px-2 py-1">
              <div className="flex h-4 w-4 items-center justify-center rounded-md bg-brand-500/15 text-brand-600">
                <Users className="h-2.5 w-2.5" />
              </div>
              <div className="leading-tight">
                <p className="text-[7px] font-medium text-slate-400">Andi &amp; Sari</p>
                <p className="text-[7px] font-semibold text-slate-700">Couple Mode · Suami</p>
              </div>
            </div>
            <div className="flex h-5 items-center gap-1 rounded-md bg-gradient-to-r from-brand-500 to-brand-600 px-2 text-[7px] font-semibold text-white shadow-sm">
              <Plus className="h-2.5 w-2.5" strokeWidth={2.5} />
              Add Transaction
            </div>
          </div>

          {/* Title row */}
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-brand-500/15 text-brand-600">
                <LayoutDashboard className="h-2.5 w-2.5" />
              </div>
              <div className="leading-tight">
                <p className="text-[9px] font-bold text-slate-900">Dashboard Overview</p>
                <p className="flex items-center gap-0.5 text-[6px] text-slate-400">
                  <CalendarDays className="h-2 w-2" />
                  1 Sep — 30 Sep 2026
                </p>
              </div>
            </div>
            <div className="flex h-5 items-center gap-1 rounded-md border border-brand-200 bg-brand-50 px-1.5 text-[7px] font-semibold text-brand-700">
              <CalendarDays className="h-2.5 w-2.5" />
              Bulan Ini
            </div>
          </div>

          {/* Financial insight banner */}
          <div className="mt-2.5 flex items-start gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-1.5">
            <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-amber-500/20 text-amber-600">
              <AlertTriangle className="h-2.5 w-2.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[7px] font-bold text-amber-700">Food &amp; Groceries naik 24% vs bulan lalu</p>
              <p className="text-[6px] tabular-nums text-slate-500">Kelebihan Rp 320.000 — tinjau transaksi terbaru.</p>
            </div>
          </div>

          {/* Metric cards */}
          <div className="mt-2.5 grid grid-cols-4 gap-1.5">
            {metrics.map((m) => (
              <div key={m.label} className="rounded-lg border border-slate-100 bg-white p-1.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[6px] font-semibold uppercase tracking-wide text-slate-400">{m.label}</span>
                  <div className={`flex h-3.5 w-3.5 items-center justify-center rounded ${m.iconTone}`}>
                    <m.icon className="h-2 w-2" />
                  </div>
                </div>
                <p className={`mt-1 text-[9px] font-extrabold tabular-nums ${m.tone}`}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="mt-2.5 grid grid-cols-3 gap-1.5">
            {/* Cashflow trend */}
            <div className="col-span-2 rounded-lg border border-slate-100 bg-white p-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[7px] font-bold text-slate-700">Cashflow Trend</span>
                <span className="text-[6px] text-slate-400">Income vs Expense</span>
              </div>
              <svg viewBox="0 0 200 56" preserveAspectRatio="none" className="mt-1.5 h-16 w-full">
                <defs>
                  <linearGradient id="heroIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity="0.35" />
                    <stop offset="95%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="heroExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity="0.3" />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0 14 H200 M0 28 H200 M0 42 H200" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2 2" />
                <path d="M0 44 L25 30 L50 36 L75 18 L100 24 L125 12 L150 20 L175 10 L200 16 L200 56 L0 56 Z" fill="url(#heroIncomeGrad)" />
                <path d="M0 44 L25 30 L50 36 L75 18 L100 24 L125 12 L150 20 L175 10 L200 16" fill="none" stroke="#10b981" strokeWidth="1.4" />
                <path d="M0 50 L25 46 L50 52 L75 40 L100 46 L125 38 L150 44 L175 36 L200 42 L200 56 L0 56 Z" fill="url(#heroExpenseGrad)" />
                <path d="M0 50 L25 46 L50 52 L75 40 L100 46 L125 38 L150 44 L175 36 L200 42" fill="none" stroke="#f43f5e" strokeWidth="1.4" />
              </svg>
              <div className="mt-0.5 flex items-center justify-center gap-3 text-[6px] text-slate-400">
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Income</span>
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-rose-500" />Expense</span>
              </div>
            </div>

            {/* Member breakdown */}
            <div className="rounded-lg border border-slate-100 bg-white p-2 shadow-sm">
              <span className="text-[7px] font-bold text-slate-700">Siapa Belanja Apa?</span>
              <div className="mt-1.5 space-y-1.5">
                {members.map((mb) => (
                  <div key={mb.name} className="rounded-md bg-slate-50 p-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate text-[6px] font-semibold text-slate-600">{mb.name}</span>
                      <span className="shrink-0 text-[6px] font-bold tabular-nums text-slate-700">{mb.spent}</span>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-200">
                      <div className={`h-full rounded-full ${mb.bar}`} style={{ width: `${mb.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Distribution donuts */}
          <div className="mt-2.5 grid grid-cols-2 gap-1.5">
            <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white p-2 shadow-sm">
              <div className="relative h-11 w-11 shrink-0 rounded-full" style={{ background: 'conic-gradient(#10b981 0% 45%, #f59e0b 45% 100%)' }}>
                <div className="absolute inset-[22%] rounded-full bg-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[7px] font-bold text-slate-700">Kontribusi Pasangan</p>
                <p className="mt-0.5 flex items-center gap-1 text-[6px] text-slate-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Suami 45%</p>
                <p className="flex items-center gap-1 text-[6px] text-slate-400"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />Istri 55%</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white p-2 shadow-sm">
              <div className="relative h-11 w-11 shrink-0 rounded-full" style={{ background: 'conic-gradient(#f59e0b 0% 38%, #3b82f6 38% 62%, #a855f7 62% 82%, #14b8a6 82% 100%)' }}>
                <div className="absolute inset-[22%] rounded-full bg-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[7px] font-bold text-slate-700">Alokasi Kategori</p>
                <p className="mt-0.5 flex items-center gap-1 text-[6px] text-slate-400"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />Food 38%</p>
                <p className="flex items-center gap-1 text-[6px] text-slate-400"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" />Bills 24%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
