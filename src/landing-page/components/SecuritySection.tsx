import { Database, EyeOff, KeyRound, LockKeyhole, ShieldCheck, Smartphone } from 'lucide-react';

const securityPoints = [
  {
    icon: LockKeyhole,
    title: 'Akses dibatasi per Household',
    desc: 'Data wallet, transaksi, budget, dan goal hanya terbaca oleh akun yang berada dalam Household yang sama.',
  },
  {
    icon: Database,
    title: 'Row Level Security',
    desc: 'PairFlow memakai Supabase RLS agar pembatasan akses berjalan dari level database, bukan hanya dari tampilan aplikasi.',
  },
  {
    icon: KeyRound,
    title: 'Login berbasis sesi aman',
    desc: 'Identitas pengguna diverifikasi lewat Supabase Auth sebelum aplikasi membaca atau mengubah data finansial.',
  },
  {
    icon: EyeOff,
    title: 'Tidak menjual data pengguna',
    desc: 'PairFlow dirancang sebagai ruang pencatatan rumah tangga, bukan mesin iklan yang memonetisasi kebiasaan finansial.',
  },
];

export default function SecuritySection() {
  return (
    <section id="keamanan" className="relative border-y border-slate-200 bg-slate-50/80 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-semibold text-slate-700">
              <ShieldCheck className="h-4 w-4 text-brand-600" />
              Keamanan & Privasi
            </div>

            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] text-balance">
              Aman untuk dicatat bersama, tetap privat dari luar Household
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600 sm:text-lg">
              PairFlow menyimpan data finansial sebagai catatan manual yang Anda masukkan sendiri. Aplikasi ini tidak meminta kredensial mobile banking, tidak login ke rekening bank, dan tidak menarik data langsung dari e-wallet pribadi Anda.
            </p>

            <div className="mt-7 rounded-3xl border border-brand-200 bg-white p-5 shadow-card">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900">
                    Tidak akses langsung mobile banking atau e-wallet
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Nama bank dan e-wallet hanya dipakai sebagai label wallet atau ikon brand. PairFlow tidak membaca saldo asli, mutasi rekening, OTP, PIN, password, token, maupun data login dari aplikasi keuangan Anda.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {securityPoints.map((point) => {
              const Icon = point.icon;

              return (
                <div key={point.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-800">
                    <Icon className="h-6 w-6" strokeWidth={1.8} />
                  </div>
                  <h3 className="mt-5 text-lg font-extrabold text-slate-900">{point.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{point.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
