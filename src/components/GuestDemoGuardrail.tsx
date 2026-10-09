import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, ShieldCheck, Sparkles } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Sheet } from '@/components/ui/Sheet';
import { GUEST_DEMO_TRANSACTION_LIMIT } from '@/lib/guestDemo';

export function GuestDemoBanner() {
  const { isGuestDemo, guestDemoTransactionCount } = useApp();

  if (!isGuestDemo) return null;

  return (
    <div className="relative flex items-center justify-between gap-3 border-b border-brand-200 bg-brand-50 px-4 py-2 text-xs text-brand-900 sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <Sparkles className="h-4 w-4 shrink-0 text-brand-600" />
        <span className="truncate font-semibold">Mode Demo</span>
        <span className="hidden text-brand-800/80 sm:inline">Data tersimpan sementara di perangkat ini.</span>
      </div>
      <span className="shrink-0 rounded-full bg-white px-2.5 py-1 font-bold">
        {guestDemoTransactionCount}/{GUEST_DEMO_TRANSACTION_LIMIT} transaksi
      </span>
    </div>
  );
}

export function GuestDemoGuardrail() {
  const navigate = useNavigate();
  const { isGuestDemo, demoLimitReached, dismissDemoLimit } = useApp();

  if (!isGuestDemo) return null;

  return (
    <Sheet
      open={demoLimitReached}
      onClose={dismissDemoLimit}
      title="Suka dengan PairFlow? Simpan Catatan Keuanganmu!"
      zIndexClassName="z-[100]"
    >
      <div className="space-y-5 pb-2">
        <div className="flex items-start gap-3 rounded-2xl bg-brand-50 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">Batas demo tercapai</p>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">
              Buat akun untuk melanjutkan pencatatan. Progress dan transaksi demo kamu sudah tersimpan otomatis di perangkat ini dan tetap tersedia saat mendaftar.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <Check className="h-4 w-4 shrink-0 text-primary" />
          Wallet dan transaksi demo tetap tersimpan di perangkat ini.
        </div>

        <button
          type="button"
          onClick={() => navigate('/signup?fromDemo=true')}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-white shadow-lg transition hover:brightness-105 active:scale-[0.98]"
        >
          Daftar &amp; Simpan Data
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => navigate('/signin?fromDemo=true')}
          className="w-full rounded-xl border border-secondary px-5 py-3 text-sm font-semibold text-text-secondary transition hover:bg-secondary/50"
        >
          Sudah Punya Akun? Masuk
        </button>
      </div>
    </Sheet>
  );
}
