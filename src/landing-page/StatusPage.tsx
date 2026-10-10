import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Database,
  Gauge,
  HardDrive,
  Image as ImageIcon,
  Info,
  Loader2,
  RefreshCw,
  ServerCog,
  ShieldCheck,
  Smartphone,
  Wifi,
  XCircle,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import Footer from './components/Footer';
import PageTransition from './components/PageTransition';
import {
  AUTO_REFRESH_MS,
  HISTORY_LIMIT,
  deriveOverall,
  formatLatency,
  formatRelativeTime,
  getClientMetrics,
  statusProbes,
  type ClientMetrics,
  type ComponentStatus,
  type OverallStatus,
  type ProbeResult,
} from './statusChecks';

interface StatusVisual {
  label: string;
  badgeClass: string;
  dotClass: string;
  barClass: string;
}

const COMPONENT_VISUAL: Record<ComponentStatus, StatusVisual> = {
  operational: {
    label: 'Normal',
    badgeClass: 'border-brand-200 bg-brand-50 text-brand-700',
    dotClass: 'bg-brand-500',
    barClass: 'bg-brand-500',
  },
  degraded: {
    label: 'Melambat',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
    dotClass: 'bg-amber-500',
    barClass: 'bg-amber-400',
  },
  down: {
    label: 'Gangguan',
    badgeClass: 'border-rose-200 bg-rose-50 text-rose-700',
    dotClass: 'bg-rose-500',
    barClass: 'bg-rose-500',
  },
  unconfigured: {
    label: 'Tidak tersedia',
    badgeClass: 'border-slate-200 bg-slate-100 text-slate-600',
    dotClass: 'bg-slate-400',
    barClass: 'bg-slate-300',
  },
};

interface OverallVisual extends StatusVisual {
  description: string;
  icon: LucideIcon;
  cardClass: string;
}

const OVERALL_VISUAL: Record<OverallStatus, OverallVisual> = {
  operational: {
    label: 'Semua Sistem Normal',
    description: 'Semua layanan yang diperiksa merespons dengan baik.',
    badgeClass: 'border-brand-200 bg-brand-50 text-brand-700',
    dotClass: 'bg-brand-500',
    barClass: 'bg-brand-500',
    cardClass: 'border-brand-200 bg-brand-50/60',
    icon: CheckCircle2,
  },
  degraded: {
    label: 'Performa Menurun',
    description: 'Layanan tetap berjalan, tetapi ada yang merespons lebih lambat dari biasanya.',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
    dotClass: 'bg-amber-500',
    barClass: 'bg-amber-400',
    cardClass: 'border-amber-200 bg-amber-50/60',
    icon: Gauge,
  },
  partial_outage: {
    label: 'Gangguan Sebagian',
    description: 'Sebagian layanan sedang tidak dapat diakses. Fitur lain tetap bisa dipakai.',
    badgeClass: 'border-orange-200 bg-orange-50 text-orange-700',
    dotClass: 'bg-orange-500',
    barClass: 'bg-orange-500',
    cardClass: 'border-orange-200 bg-orange-50/60',
    icon: AlertTriangle,
  },
  major_outage: {
    label: 'Gangguan Besar',
    description: 'Layanan inti tidak dapat dihubungi. Coba muat ulang dalam beberapa saat.',
    badgeClass: 'border-rose-200 bg-rose-50 text-rose-700',
    dotClass: 'bg-rose-500',
    barClass: 'bg-rose-500',
    cardClass: 'border-rose-200 bg-rose-50/60',
    icon: XCircle,
  },
};

const COMPONENT_ICON: Record<string, LucideIcon> = {
  web: Activity,
  auth: ShieldCheck,
  database: Database,
  storage: HardDrive,
  cdn: ImageIcon,
};

function ComponentRow({
  name,
  description,
  icon: Icon,
  result,
  checking,
}: {
  name: string;
  description: string;
  icon: LucideIcon;
  result?: ProbeResult;
  checking: boolean;
}) {
  const isPending = checking && !result;
  const visual = COMPONENT_VISUAL[result?.status ?? 'unconfigured'];

  return (
    <div className="flex items-start gap-4 p-5 sm:items-center sm:p-6">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-bold text-slate-900">{name}</p>
          {isPending ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              Memeriksa
            </span>
          ) : (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${visual.badgeClass}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${visual.dotClass}`} />
              {visual.label}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-sm font-extrabold tabular-nums text-slate-900">
          {isPending ? '…' : formatLatency(result?.latencyMs ?? null)}
        </p>
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">latensi</p>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-extrabold text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p>}
    </div>
  );
}

export function StatusPage() {
  const navigate = useNavigate();
  const [results, setResults] = useState<Record<string, ProbeResult>>({});
  const [checking, setChecking] = useState(true);
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [history, setHistory] = useState<OverallStatus[]>([]);
  const [metrics, setMetrics] = useState<ClientMetrics>(() => getClientMetrics());

  const runChecks = useCallback(async () => {
    setChecking(true);
    const settled = await Promise.all(
      statusProbes.map(async (probe) => [probe.id, await probe.run()] as const),
    );

    const next: Record<string, ProbeResult> = {};
    for (const [id, result] of settled) next[id] = result;

    setResults(next);
    setLastCheckedAt(Date.now());
    setChecking(false);
    setHistory((prev) =>
      [...prev, deriveOverall(Object.values(next).map((item) => item.status))].slice(-HISTORY_LIMIT),
    );
  }, []);

  useEffect(() => {
    void runChecks();
  }, [runChecks]);

  useEffect(() => {
    const interval = window.setInterval(() => void runChecks(), AUTO_REFRESH_MS);
    return () => window.clearInterval(interval);
  }, [runChecks]);

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    const refreshMetrics = () => setMetrics(getClientMetrics());
    const handleOnline = () => {
      refreshMetrics();
      void runChecks();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', refreshMetrics);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistration()
        .then((registration) => {
          if (registration?.active) {
            setMetrics((prev) => ({ ...prev, serviceWorkerActive: true }));
          }
        })
        .catch(() => undefined);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', refreshMetrics);
    };
  }, [runChecks]);

  const overall = useMemo(
    () => deriveOverall(Object.values(results).map((item) => item.status)),
    [results],
  );
  const overallVisual = OVERALL_VISUAL[overall];
  const OverallIcon = overallVisual.icon;

  const latencies = useMemo(
    () =>
      Object.values(results)
        .map((item) => item.latencyMs)
        .filter((value): value is number => typeof value === 'number' && value > 0),
    [results],
  );
  const averageLatency = latencies.length
    ? Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length)
    : null;

  const sessionUptime = history.length
    ? Math.round((history.filter((item) => item === 'operational').length / history.length) * 100)
    : null;

  const lastCheckedLabel = lastCheckedAt
    ? formatRelativeTime(lastCheckedAt, now)
    : 'menunggu pemeriksaan';

  return (
    <div className="min-h-screen bg-white font-figtree text-slate-900 antialiased selection:bg-brand-500 selection:text-white">
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:h-[72px] lg:px-10">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 text-left"
          >
            <img
              src="/icons/icon-192.png"
              alt="PairFlow Logo"
              className="h-9 w-9 rounded-xl object-contain"
            />
            <span className="text-xl font-bold tracking-tight">
              Pair<span className="text-brand-600">Flow</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/onboarding')}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-glow-emerald transition-all hover:brightness-105 active:scale-[0.98]"
          >
            Mulai
            <ArrowRight className="h-4 w-4" />
          </button>
        </nav>
      </header>

      <PageTransition>
        <section className="bg-slate-50/80">
          <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke landing page
            </button>

            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-700">
              <Activity className="h-4 w-4" />
              System Status
            </div>

            <h1 className="mt-5 max-w-4xl text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Status layanan PairFlow
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Pemeriksaan langsung dari browser Anda ke layanan yang dipakai PairFlow. Hasil di bawah
              mencerminkan kondisi saat halaman ini dimuat dan diperbarui otomatis.
            </p>

            <div className={`mt-8 rounded-3xl border p-6 shadow-card sm:p-7 ${overallVisual.cardClass}`}>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-slate-900">
                    <OverallIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xl font-extrabold tracking-tight text-slate-950">
                      {overallVisual.label}
                    </p>
                    <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
                      {overallVisual.description}
                    </p>
                    <p className="mt-3 inline-flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-500">
                      <Clock className="h-3.5 w-3.5" />
                      Terakhir diperiksa {lastCheckedLabel} · otomatis tiap{' '}
                      {AUTO_REFRESH_MS / 1000} detik
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void runChecks()}
                  disabled={checking}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
                  {checking ? 'Memeriksa…' : 'Periksa sekarang'}
                </button>
              </div>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Komponen layanan</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Setiap komponen diperiksa dari perangkat Anda. Latensi adalah waktu respons pada
            pemeriksaan terakhir.
          </p>

          <div className="mt-8 divide-y divide-slate-200 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
            {statusProbes.map((probe) => (
              <ComponentRow
                key={probe.id}
                name={probe.name}
                description={probe.description}
                icon={COMPONENT_ICON[probe.id] ?? ServerCog}
                result={results[probe.id]}
                checking={checking}
              />
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-50/70">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Sinyal lain saat sistem sehat
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Status di atas dipadukan dengan kondisi perangkat Anda, karena gangguan bisa datang
              dari jaringan maupun aplikasi yang belum terpasang.
            </p>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <MetricCard
                icon={Wifi}
                label="Koneksi perangkat"
                value={metrics.online ? 'Online' : 'Offline'}
                hint={
                  metrics.online
                    ? 'Perangkat terhubung ke internet.'
                    : 'Perangkat sedang offline; data bisa tertahan sampai koneksi kembali.'
                }
              />
              <MetricCard
                icon={Zap}
                label="Latensi rata-rata"
                value={averageLatency === null ? '—' : formatLatency(averageLatency)}
                hint="Rata-rata waktu respons layanan yang diperiksa."
              />
              <MetricCard
                icon={Activity}
                label="Kualitas jaringan"
                value={metrics.effectiveType ? metrics.effectiveType.toUpperCase() : 'Tidak diketahui'}
                hint={
                  metrics.downlinkMbps !== null || metrics.rttMs !== null
                    ? [
                        metrics.downlinkMbps !== null ? `≈${metrics.downlinkMbps} Mbps` : null,
                        metrics.rttMs !== null ? `RTT ${metrics.rttMs} ms` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')
                    : 'Metrik jaringan tidak tersedia di browser ini.'
                }
              />
              <MetricCard
                icon={Smartphone}
                label="PWA / Mode offline"
                value={metrics.serviceWorkerActive ? 'Aktif' : 'Tidak aktif'}
                hint={
                  metrics.serviceWorkerActive
                    ? 'Service worker siap menyajikan cache saat offline.'
                    : 'Muat ulang di koneksi stabil untuk mengaktifkan cache offline.'
                }
              />
              <MetricCard
                icon={ServerCog}
                label="Mode tampilan"
                value={metrics.standalone ? 'Aplikasi terpasang' : 'Browser'}
                hint={
                  metrics.standalone
                    ? 'Berjalan sebagai PWA yang dipasang di layar utama.'
                    : 'Anda membuka PairFlow dari tab browser.'
                }
              />
              <MetricCard
                icon={Clock}
                label="Uptime sesi ini"
                value={sessionUptime === null ? '—' : `${sessionUptime}%`}
                hint={
                  history.length
                    ? `Dari ${history.length} pemeriksaan sejak halaman dibuka.`
                    : 'Belum ada pemeriksaan.'
                }
              />
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Riwayat pemeriksaan sesi ini
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Dirakit dari pemeriksaan yang berjalan selama halaman ini terbuka — bukan riwayat uptime
            24/7.
          </p>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
            {history.length === 0 ? (
              <p className="text-sm text-slate-500">Belum ada pemeriksaan yang tercatat.</p>
            ) : (
              <>
                <div className="flex items-end gap-1.5">
                  {history.map((item, index) => (
                    <span
                      key={`${item}-${index}`}
                      className={`h-12 flex-1 rounded-full ${OVERALL_VISUAL[item].barClass}`}
                      title={OVERALL_VISUAL[item].label}
                    />
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-brand-500" />
                    Normal
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    Melambat
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                    Gangguan sebagian
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    Gangguan besar
                  </span>
                </div>
              </>
            )}
          </div>
        </section>

        <section className="border-t border-slate-200 bg-slate-950">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
            <div>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-brand-200">
                <Info className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Insiden & batasan halaman ini
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Tidak ada insiden yang dilaporkan saat ini. Halaman ini menjalankan pemeriksaan
                langsung dari browser Anda, jadi hasilnya bergantung pada jaringan dan perangkat yang
                Anda pakai. Untuk uptime dan riwayat insiden 24/7, PairFlow memerlukan layanan
                pemantauan terpisah.
              </p>
            </div>

            <div className="flex flex-col justify-center gap-3 lg:items-end">
              <button
                type="button"
                onClick={() => void runChecks()}
                disabled={checking}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-glow-emerald transition-all hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
                Periksa ulang
              </button>
              <button
                type="button"
                onClick={() => navigate('/bantuan/contact-support')}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
              >
                Laporkan kendala
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </PageTransition>

      <Footer />
    </div>
  );
}

export default StatusPage;
