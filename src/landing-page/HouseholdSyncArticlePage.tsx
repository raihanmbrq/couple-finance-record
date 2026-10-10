import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Copy,
  Lock,
  QrCode,
  ShieldCheck,
  Smartphone,
  Users,
  WalletCards,
} from 'lucide-react';
import Footer from './components/Footer';
import PageTransition from './components/PageTransition';
import { getArticleEntryState } from './articleNavigation';

const flowSteps = [
  {
    title: 'Buat Household',
    body: 'Pengguna baru otomatis punya Household personal dan invite code unik 6 karakter yang bisa dibagikan dari halaman Profile.',
  },
  {
    title: 'Bagikan Kode',
    body: 'Pasangan atau anggota rumah tangga memasukkan kode undangan untuk masuk ke circle yang sama.',
  },
  {
    title: 'Data Tersinkron',
    body: 'Wallet, transaksi, budget, dan goal berada pada scope Household yang sama sehingga aktivitas finansial bisa terlihat bersama.',
  },
];

const capabilities = [
  'Single Mode tetap tersedia untuk pengguna yang belum menghubungkan akun.',
  'Circle Mode aktif setelah pengguna membuat atau bergabung ke Household bersama.',
  'Satu Household mendukung hingga 10 anggota aktif.',
  'Home menampilkan total balance dan wallet per anggota.',
  'Recent Activity dan Transaction List menampilkan transaksi dari setiap member.',
  'Leave Circle mengembalikan pengguna ke Household personal tanpa kehilangan data sendiri.',
];

export function HouseholdSyncArticlePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const entry = getArticleEntryState(location.state, '/onboarding');

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
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-20">
            <article>
              <button
                type="button"
                onClick={() =>
                  navigate(entry.returnTo, {
                    state: { restoreScrollY: entry.returnScrollY },
                  })
                }
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke {entry.returnLabel}
              </button>

              <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-700">
                <QrCode className="h-4 w-4" />
                Real-time Household Sync
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Satu ruang finansial untuk pasangan dan rumah tangga
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Household Sync adalah fondasi PairFlow untuk menghubungkan akun pengguna ke satu Circle/Household. Dari PRD, fitur ini dirancang agar pasangan bisa membuat Household sendiri atau bergabung memakai kode undangan unik, lalu melihat pencatatan transaksi, budget, wallet, dan goal dalam ruang data yang sama.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => navigate('/invite')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 text-sm font-bold text-white shadow-glow-emerald transition-all hover:brightness-105 active:scale-[0.98]"
                >
                  Coba PairFlow
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/demo')}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Lihat demo
                </button>
              </div>
            </article>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl">
              <div className="rounded-3xl bg-slate-950 p-5 text-white">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-200">
                      Household Circle
                    </p>
                    <h2 className="mt-1 text-xl font-bold">Keluarga Raihan</h2>
                  </div>
                  <span className="rounded-full bg-brand-400/15 px-3 py-1 text-xs font-bold text-brand-200">
                    Circle Mode
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/10 p-4">
                    <Users className="h-5 w-5 text-brand-200" />
                    <p className="mt-3 text-2xl font-extrabold">2/10</p>
                    <p className="text-xs text-slate-300">anggota aktif</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4">
                    <Copy className="h-5 w-5 text-brand-200" />
                    <p className="mt-3 font-mono text-2xl font-extrabold tracking-widest">
                      X7K9P2
                    </p>
                    <p className="text-xs text-slate-300">invite code</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {['Kas Bersama', 'BCA Suami', 'E-Wallet Istri'].map((wallet, index) => (
                    <div key={wallet} className="flex items-center justify-between rounded-2xl bg-white p-3 text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                          <WalletCards className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">{wallet}</p>
                          <p className="text-xs text-slate-500">
                            {index === 0 ? 'Bersama' : index === 1 ? 'Raihan' : 'Alda'}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-extrabold">
                        {index === 0 ? 'Rp 18,4 jt' : index === 1 ? 'Rp 7,8 jt' : 'Rp 2,1 jt'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
          <div className="grid gap-5 md:grid-cols-3">
            {flowSteps.map((step, index) => (
              <div key={step.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-sm font-extrabold text-brand-700">
                  {index + 1}
                </div>
                <h2 className="mt-5 text-xl font-extrabold">{step.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-50/70">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:px-10">
            <div>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                <Smartphone className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Transparansi tanpa campur aduk antar rumah tangga
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                PRD PairFlow menempatkan data finansial sebagai data shared per Household. Artinya, begitu pengguna berada di circle yang sama, aktivitas keuangan rumah tangga bisa dipantau bersama, sementara circle lain tetap terisolasi.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {capabilities.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                  <p className="text-sm leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-card">
              <ShieldCheck className="h-8 w-8 text-brand-600" />
              <h2 className="mt-5 text-2xl font-extrabold">Dibatasi oleh Household ID</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Akses wallet, transaksi, budget, goal, kategori custom, dan tipe wallet custom mengikuti scope Household. Server menggunakan aturan RLS dan helper Household pengguna agar data circle lain tidak terbaca.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-950 p-7 text-white shadow-card">
              <Lock className="h-8 w-8 text-brand-200" />
              <h2 className="mt-5 text-2xl font-extrabold">Ada guardrail untuk edge case</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Kode undangan tidak valid, circle penuh, pengguna yang sudah terhubung, dan kegagalan jaringan ditangani sebagai kondisi khusus agar proses join Household tetap jelas.
              </p>
            </div>
          </div>
        </section>
      </PageTransition>

      <Footer />
    </div>
  );
}

export default HouseholdSyncArticlePage;
