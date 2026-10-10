/**
 * Honest, dependency-free status checks.
 *
 * Everything here runs in the visitor's browser and pings the same services the
 * app depends on. There is no server-side monitor, so this reflects the current
 * moment (and whatever the browser can reach) — not 24/7 uptime history.
 */

export type ComponentStatus = 'operational' | 'degraded' | 'down' | 'unconfigured';

export type OverallStatus = 'operational' | 'degraded' | 'partial_outage' | 'major_outage';

export interface ProbeResult {
  status: ComponentStatus;
  latencyMs: number | null;
  detail?: string;
}

export interface StatusProbe {
  id: string;
  name: string;
  description: string;
  run: () => Promise<ProbeResult>;
}

export interface ClientMetrics {
  online: boolean;
  effectiveType: string | null;
  downlinkMbps: number | null;
  rttMs: number | null;
  serviceWorkerActive: boolean;
  standalone: boolean;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
const CLOUDINARY_CLOUD_NAME = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? '') as string;

const PROBE_TIMEOUT_MS = 8000;
const DEGRADED_THRESHOLD_MS = 1500;
export const HISTORY_LIMIT = 24;
export const AUTO_REFRESH_MS = 30000;

async function fetchProbe(url: string, init?: RequestInit): Promise<ProbeResult> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  const started = performance.now();

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      ...init,
      signal: controller.signal,
    });
    const latencyMs = Math.round(performance.now() - started);

    // Opaque responses (no-cors) still prove the host is reachable.
    if (response.type === 'opaque') {
      return { status: 'operational', latencyMs };
    }
    if (!response.ok) {
      return { status: 'down', latencyMs, detail: `HTTP ${response.status}` };
    }
    return {
      status: latencyMs > DEGRADED_THRESHOLD_MS ? 'degraded' : 'operational',
      latencyMs,
    };
  } catch {
    return { status: 'down', latencyMs: null };
  } finally {
    window.clearTimeout(timer);
  }
}

function probeSupabase(path: string): Promise<ProbeResult> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return Promise.resolve({ status: 'unconfigured', latencyMs: null });
  }
  return fetchProbe(`${SUPABASE_URL}${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
}

function probeImageCdn(): Promise<ProbeResult> {
  if (!CLOUDINARY_CLOUD_NAME) {
    return Promise.resolve({ status: 'unconfigured', latencyMs: null });
  }
  return fetchProbe(
    `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/sample.jpg`,
    { mode: 'no-cors' },
  );
}

export const statusProbes: StatusProbe[] = [
  {
    id: 'web',
    name: 'Aplikasi Web',
    description: 'Halaman PairFlow yang sedang Anda buka di perangkat ini.',
    run: () => Promise.resolve({ status: 'operational', latencyMs: 0 }),
  },
  {
    id: 'auth',
    name: 'Autentikasi',
    description: 'Login, registrasi, dan sesi pengguna (Supabase Auth).',
    run: () => probeSupabase('/auth/v1/health'),
  },
  {
    id: 'database',
    name: 'Database & API',
    description: 'Wallet, transaksi, budget, dan goal (Supabase Postgres).',
    run: () => probeSupabase('/rest/v1/profiles?select=id&limit=1'),
  },
  {
    id: 'storage',
    name: 'Penyimpanan File',
    description: 'Unggah avatar dan lampiran struk (Supabase Storage).',
    run: () => probeSupabase('/storage/v1/health'),
  },
  {
    id: 'cdn',
    name: 'Pengiriman Gambar',
    description: 'Distribusi gambar dan avatar (Cloudinary CDN).',
    run: () => probeImageCdn(),
  },
];

export function deriveOverall(componentStatuses: ComponentStatus[]): OverallStatus {
  const relevant = componentStatuses.filter((status) => status !== 'unconfigured');
  if (relevant.length === 0) return 'operational';

  const downCount = relevant.filter((status) => status === 'down').length;
  const degradedCount = relevant.filter((status) => status === 'degraded').length;

  if (downCount === 0 && degradedCount === 0) return 'operational';
  if (downCount === 0) return 'degraded';
  if (downCount === relevant.length) return 'major_outage';
  return 'partial_outage';
}

export function formatLatency(latencyMs: number | null): string {
  if (latencyMs === null) return '—';
  if (latencyMs <= 1) return '< 1 ms';
  return `${latencyMs} ms`;
}

export function formatRelativeTime(from: number, now: number): string {
  const seconds = Math.max(0, Math.round((now - from) / 1000));
  if (seconds < 5) return 'baru saja';
  if (seconds < 60) return `${seconds} detik lalu`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  return `${hours} jam lalu`;
}

export function getClientMetrics(): ClientMetrics {
  const connection = (
    navigator as Navigator & {
      connection?: { effectiveType?: string; downlink?: number; rtt?: number };
    }
  ).connection;

  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

  return {
    online: navigator.onLine,
    effectiveType: connection?.effectiveType ?? null,
    downlinkMbps: typeof connection?.downlink === 'number' ? connection.downlink : null,
    rttMs: typeof connection?.rtt === 'number' ? connection.rtt : null,
    serviceWorkerActive: 'serviceWorker' in navigator && Boolean(navigator.serviceWorker.controller),
    standalone,
  };
}
