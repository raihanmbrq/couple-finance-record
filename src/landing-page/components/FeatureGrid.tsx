import { QrCode, Wallet, UserCheck, PieChart, Target, ShieldCheck, ArrowRight } from 'lucide-react';

const features = [
  {
    icon: QrCode,
    title: 'Real-time Household Sync',
    desc: 'Hubungkan HP Suami & Istri dalam hitungan detik via QR Code atau invite link. Setiap transaksi sinkron instan tanpa refresh.',
    accent: 'from-brand-500 to-brand-600',
    bg: 'bg-brand-50',
    iconColor: 'text-brand-600',
    tag: 'Sinkronisasi',
  },
  {
    icon: Wallet,
    title: 'Multi-Wallet & Source of Funds',
    desc: 'Pisahkan Bank Bersama, E-Wallet, Cash, hingga Uang Pribadi. Lacak dari mana dana berasal dan ke mana mengalir.',
    accent: 'from-rose-400 to-rose-500',
    bg: 'bg-rose-50',
    iconColor: 'text-rose-600',
    tag: 'Multi Wallet',
  },
  {
    icon: UserCheck,
    title: 'Attribution Tag — Siapa Bayar?',
    desc: 'Tagging jelas untuk setiap transaksi: Suami, Istri, atau Bersama. Transparansi penuh, nol curiga.',
    accent: 'from-blue-500 to-indigo-500',
    bg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    tag: 'Attribution',
  },
  {
    icon: PieChart,
    title: 'Smart Budgeting & Limits',
    desc: 'Set anggaran bulanan dengan progress bar visual. Alert otomatis Green (Aman), Yellow (Hampir Limit), Red (Over Budget).',
    accent: 'from-amber-400 to-orange-500',
    bg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    tag: 'Budgeting',
  },
  {
    icon: Target,
    title: 'Kantong Impian (Sinking Funds)',
    desc: 'Tabungan khusus untuk liburan keluarga, dana darurat, atau barang impian. Lacak progres setiap kantong secara visual.',
    accent: 'from-violet-500 to-purple-500',
    bg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    tag: 'Sinking Fund',
  },
  {
    icon: ShieldCheck,
    title: 'Bank-grade Data Security',
    desc: 'Setiap record dilindungi Supabase Row Level Security (RLS) & end-to-end encryption. Data Anda hanya untuk Anda berdua.',
    accent: 'from-slate-600 to-slate-800',
    bg: 'bg-slate-100',
    iconColor: 'text-slate-700',
    tag: 'Security',
  },
];

export default function FeatureGrid() {
  return (
    <section id="fitur" className="relative py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200/60 bg-brand-50/80 px-4 py-1.5 text-sm font-medium text-brand-700">
            Fitur Unggulan
          </div>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] text-balance">
            Semua yang pasangan butuhkan untuk{' '}
            <span className="bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent">
              keuangan harmonis
            </span>
          </h2>
          <p className="mt-4 text-base text-slate-600 sm:text-lg text-balance">
            Dari pencatatan cepat hingga perencanaan masa depan. PairFlow hadirkan
            pengalaman kelola kas yang menyenangkan dan bebas drama.
          </p>
        </div>

        {/* Feature cards */}
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof features)[number];
  index: number;
}) {
  const Icon = feature.icon;
  return (
    <div
      id={`feature-${index}`}
      className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover hover:border-slate-300 lg:p-7"
    >
      {/* Hover gradient accent */}
      <div
        className={`absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r ${feature.accent} transition-transform duration-500 group-hover:scale-x-100`}
      />

      {/* Icon */}
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${feature.bg} transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}
      >
        <Icon className={`h-7 w-7 ${feature.iconColor}`} strokeWidth={1.8} />
      </div>

      {/* Tag */}
      <div className="mt-4">
        <span className={`inline-block rounded-full ${feature.bg} px-3 py-0.5 text-[11px] font-semibold ${feature.iconColor}`}>
          {feature.tag}
        </span>
      </div>

      {/* Title & Description */}
      <h3 className="mt-3 text-lg font-bold text-slate-900 lg:text-xl">
        {feature.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-500 lg:text-base">
        {feature.desc}
      </p>

      {/* Hover arrow */}
      <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-slate-400 transition-colors group-hover:text-slate-700">
        <span>Pelajari lebih lanjut</span>
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </div>
  );
}
