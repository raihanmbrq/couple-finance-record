import { useMemo } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Landmark,
  Lock,
  PieChart,
  ReceiptText,
  ShieldCheck,
  Target,
  TrendingUp,
  UserCheck,
  Wallet,
} from 'lucide-react';
import Footer from './components/Footer';
import PageTransition from './components/PageTransition';
import { getArticleEntryState } from './articleNavigation';

const articleBySlug = {
  'multi-wallet-source-of-funds': {
    badge: 'Multi-Wallet & Source of Funds',
    icon: Wallet,
    eyebrowClass: 'border-rose-200 bg-rose-50 text-rose-700',
    iconClass: 'bg-rose-50 text-rose-700',
    heroTitle: 'Pisahkan sumber dana tanpa kehilangan gambaran total kas',
    intro:
      'PRD PairFlow mendefinisikan Multi-Wallet sebagai dukungan dompet tunai, rekening bank, e-wallet, wallet bersama, dan wallet custom dalam satu agregasi saldo Household. Fitur ini membuat pasangan bisa tahu dana berasal dari mana, dipakai untuk apa, dan tetap melihat total likuiditas rumah tangga.',
    visualTitle: 'Wallet Directory',
    visualRows: [
      ['Kas Bersama', 'Joint wallet', 'Rp 18.450.000'],
      ['BCA Payroll', 'Bank account', 'Rp 7.800.000'],
      ['GoPay Harian', 'E-wallet', 'Rp 850.000'],
    ],
    flow: [
      ['Buat wallet', 'Nama dan tipe wallet wajib, saldo awal opsional, lalu PairFlow menyimpan wallet ke scope Household.'],
      ['Deteksi brand', 'Nama seperti BCA, Livin, GoPay, OVO, DANA, BRI, dan Jago bisa dipasangkan dengan ikon brand jika tipe wallet cocok.'],
      ['Transfer internal', 'Transfer antar-wallet dicatat sebagai type transfer sehingga saldo sumber turun, saldo tujuan naik, dan total kekayaan Household tidak berubah.'],
    ],
    capabilities: [
      'Mendukung tipe sistem joint, cash, bank, dan e-wallet.',
      'Tipe wallet custom dapat dibuat per Household.',
      'Wallet picker dikelompokkan antara My Wallets dan Member Wallets.',
      'Top Up adalah transfer dengan wallet tujuan yang sudah dipilih.',
      'Riwayat transaksi tetap terbaca meski wallet lama dihapus atau diarsipkan.',
      'Transfer internal tidak masuk income, expense, budget, analytics, atau export summary.',
    ],
    detailTitle: 'Dibangun untuk uang bersama dan uang pribadi',
    detailBody:
      'Di Circle Mode, wallet milik pengguna dan anggota lain tetap bisa dikenali melalui pemiliknya, tetapi seluruhnya berada dalam konteks Household yang sama. Ini membuat kas bersama, rekening operasional, e-wallet belanja, dan uang tunai bisa dipantau tanpa mencampur arti tiap sumber dana.',
    guardTitle: 'Saldo direkonsiliasi dari transaksi',
    guardBody:
      'Saat transaksi ditambah, diubah, dipindah wallet, atau dihapus, PairFlow membalik efek lama dan menerapkan efek baru. Pola ini menjaga saldo wallet tetap konsisten dengan riwayat aktivitas.',
  },
  'attribution-tag-siapa-bayar': {
    badge: 'Attribution Tag - Siapa Bayar?',
    icon: UserCheck,
    eyebrowClass: 'border-blue-200 bg-blue-50 text-blue-700',
    iconClass: 'bg-blue-50 text-blue-700',
    heroTitle: 'Setiap transaksi punya konteks siapa yang mencatat',
    intro:
      'Attribution di PairFlow berpusat pada field spent_by atau Logged by. PRD menempatkannya sebagai cara pasangan melihat siapa mencatat apa, menyaring transaksi per anggota, dan membaca kontribusi pengeluaran tanpa menebak-nebak dari catatan manual.',
    visualTitle: 'Recent Activity',
    visualRows: [
      ['Belanja Bulanan', 'Logged by Alda', '-Rp 450.000'],
      ['Bayar Internet', 'Logged by Raihan', '-Rp 389.000'],
      ['Gaji Masuk', 'Logged by Raihan', '+Rp 12.000.000'],
    ],
    flow: [
      ['Catat transaksi', 'Saat transaksi dibuat, PairFlow menyimpan badge Logged by dari nama profil pengguna.'],
      ['Tampil di semua layar', 'Home, Recent Activity, Transactions, dan desktop data grid menampilkan pencatat transaksi.'],
      ['Filter per anggota', 'Mode circle menyediakan filter Logged by agar aktivitas tiap anggota bisa diperiksa sendiri.'],
    ],
    capabilities: [
      'Field spent_by disimpan sebagai nama pencatat untuk kebutuhan display.',
      'Recent Activity menampilkan transaksi dari setiap member.',
      'Transaction list bisa mencari notes, kategori, dan spent_by.',
      'Desktop table menampilkan kolom Logged By.',
      'Analytics desktop membaca nominal dan kategori terbesar per anggota.',
      'Semua anggota circle melihat transaksi yang sama dengan atribusi yang benar.',
    ],
    detailTitle: 'Transparansi yang operasional, bukan drama',
    detailBody:
      'Tujuan attribution bukan menghitung salah siapa, tetapi memberi konteks saat membaca arus kas. Pasangan bisa melihat pengeluaran rumah, pembayaran tagihan, dan catatan belanja dengan sumber pencatat yang jelas.',
    guardTitle: 'Atribusi tetap mengikuti transaksi',
    guardBody:
      'Karena attribution tersimpan di transaksi, data tetap bisa difilter dan diekspor bersama detail kategori, wallet, notes, tanggal, dan nominal.',
  },
  'smart-budgeting-limits': {
    badge: 'Smart Budgeting & Limits',
    icon: PieChart,
    eyebrowClass: 'border-amber-200 bg-amber-50 text-amber-700',
    iconClass: 'bg-amber-50 text-amber-700',
    heroTitle: 'Batas bulanan per kategori yang langsung kebaca',
    intro:
      'Budgeting di PRD PairFlow dirancang per kategori expense dalam scope Household. Pengeluaran bulan berjalan dihitung per kategori, lalu ditampilkan sebagai total budget, total spent, remaining, progress bar, dan status visual saat mendekati atau melewati limit.',
    visualTitle: 'Monthly Budget',
    visualRows: [
      ['Food & Groceries', '70% used', 'Rp 900.000 left'],
      ['Bills & Utilities', '82% used', 'Warning'],
      ['Shopping', '108% used', 'Over budget'],
    ],
    flow: [
      ['Pilih kategori', 'Budget hanya bisa dibuat untuk kategori expense atau both yang relevan dan belum punya budget.'],
      ['Set limit', 'PairFlow menyimpan satu budget per kategori per Household dengan constraint unik di server.'],
      ['Pantau progres', 'Expense bulan berjalan dihitung per kategori dan ditampilkan sebagai sisa anggaran.'],
    ],
    capabilities: [
      'Satu kategori hanya punya satu budget aktif per Household.',
      'Transfer internal tidak mengonsumsi limit budget.',
      'Rekap bulanan menampilkan Total Budget, Total Spent, dan Remaining.',
      'Budget bisa dibuat, diedit, dan dihapus dengan konfirmasi.',
      'Status visual membantu membaca kategori normal, warning, dan over-budget.',
      'Budget duplikat saat join circle mengikuti aturan: budget circle menang.',
    ],
    detailTitle: 'Limit yang mengikuti cara rumah tangga belanja',
    detailBody:
      'Budget PairFlow menempel pada kategori, bukan pada satu orang. Dengan begitu, groceries, tagihan, transport, kesehatan, dan kategori custom bisa dipantau sebagai pengeluaran rumah tangga bersama.',
    guardTitle: 'Perhitungan menjaga transfer internal tetap netral',
    guardBody:
      'Perpindahan dana antar-wallet sendiri tidak dihitung sebagai expense budget. Ini mencegah top up atau transfer internal terlihat seperti pengeluaran riil.',
  },
  'kantong-impian-sinking-funds': {
    badge: 'Kantong Impian (Sinking Funds)',
    icon: Target,
    eyebrowClass: 'border-violet-200 bg-violet-50 text-violet-700',
    iconClass: 'bg-violet-50 text-violet-700',
    heroTitle: 'Ubah target besar jadi progres yang bisa ditabung bareng',
    intro:
      'Goals atau Kantong Impian di PRD PairFlow adalah sinking fund untuk rencana seperti liburan, dana darurat, renovasi, pendidikan, atau aset investasi. Setiap goal punya target amount, current amount, target date, kategori aset, estimasi kontribusi bulanan, dan aksi deposit dana.',
    visualTitle: 'Goal Progress',
    visualRows: [
      ['Liburan Akhir Tahun', '80% funded', 'Rp 12 jt / Rp 15 jt'],
      ['Dana Darurat', '45% funded', 'Rp 22,5 jt / Rp 50 jt'],
      ['DP Rumah', '18% funded', 'Rp 36 jt / Rp 200 jt'],
    ],
    flow: [
      ['Buat goal', 'Isi target, dana terkumpul, tanggal target, dan kategori aset seperti tabungan, deposito, emas, atau saham.'],
      ['Hitung kontribusi', 'PairFlow menyimpan estimasi monthly contribution agar target punya ritme nabung yang jelas.'],
      ['Deposit dana', 'Add Money membuat transaksi expense kategori goals, mengurangi saldo wallet, dan menaikkan current amount goal.'],
    ],
    capabilities: [
      'Goal terlihat oleh seluruh anggota circle.',
      'Kartu goal menampilkan progress bar, persen, target date, dan durasi tersisa.',
      'Deposit ditolak jika saldo wallet tidak cukup.',
      'Edit atau delete transaksi deposit akan menyinkronkan current amount goal.',
      'Kategori aset mencakup Tabungan Biasa, Reksadana, Saham, Deposito, Emas, dan Lainnya.',
      'Goal dapat diedit dan dihapus dengan konfirmasi.',
    ],
    detailTitle: 'Target finansial yang tidak hilang di tengah transaksi harian',
    detailBody:
      'Kantong Impian memisahkan rencana masa depan dari cashflow harian. Pasangan bisa melihat progres, menambah dana dari wallet tertentu, dan tetap punya jejak transaksi deposit yang tercatat.',
    guardTitle: 'Deposit selalu terkait saldo wallet',
    guardBody:
      'Saat pengguna menambah dana ke goal, PairFlow memvalidasi nominal dan saldo wallet. Jika berhasil, wallet berkurang dan goal bertambah dalam satu alur yang bisa dilacak.',
  },
  'bank-grade-data-security': {
    badge: 'Bank-grade Data Security',
    icon: ShieldCheck,
    eyebrowClass: 'border-slate-200 bg-slate-100 text-slate-800',
    iconClass: 'bg-slate-100 text-slate-800',
    heroTitle: 'Privasi finansial dijaga dari level database',
    intro:
      'Security di PRD PairFlow bertumpu pada Supabase Auth, Postgres, Row Level Security, RPC, dan trigger. Aturan akses memastikan pengguna hanya membaca dan mengubah data yang berada dalam Household miliknya.',
    visualTitle: 'Access Scope',
    visualRows: [
      ['Profiles', 'Self + same Household', 'RLS'],
      ['Wallets/Budgets/Goals', 'household_id match', 'Protected'],
      ['Transactions', 'via wallet Household', 'Protected'],
    ],
    flow: [
      ['Login aman', 'Session pengguna berasal dari Supabase Auth dan menjadi dasar identitas untuk aturan database.'],
      ['Resolve Household', 'Helper user_household_id menentukan Household aktif milik pengguna login.'],
      ['Batasi akses', 'RLS membatasi profiles, wallets, transactions, budgets, goals, categories, dan wallet types sesuai scope.'],
    ],
    capabilities: [
      'Wallet, budget, dan goal hanya terbaca jika household_id cocok.',
      'Transactions mengikuti Household dari wallet induknya.',
      'Kategori dan wallet type sistem bisa dibaca semua, tetapi row custom hanya milik Household sendiri.',
      'Row sistem dilindungi dan tidak bisa dimutasi pengguna.',
      'Join/create/leave circle memakai RPC dan trigger untuk menjaga membership tetap konsisten.',
      'Rehome data dilakukan sebelum profile dipindah agar aturan RLS tetap terpenuhi.',
    ],
    detailTitle: 'Data bersama bukan berarti data publik',
    detailBody:
      'Dalam PairFlow, data finansial memang shared untuk anggota Household yang sama. Namun scope itu berhenti di Household tersebut, sehingga circle lain tidak ikut terbaca atau tercampur.',
    guardTitle: 'Guardrail ada di server, bukan hanya UI',
    guardBody:
      'Batas anggota, invite code, membership, ownership, dan data rehoming dijaga di database melalui constraint, policy, trigger, dan RPC. UI membantu alur, tetapi server tetap menjadi sumber aturan utama.',
  },
} as const;

export function FeatureArticlePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams();
  const entry = getArticleEntryState(location.state, '/onboarding');
  const article = useMemo(
    () => (slug ? articleBySlug[slug as keyof typeof articleBySlug] : undefined),
    [slug],
  );

  if (!article) {
    return <Navigate to="/" replace />;
  }

  const Icon = article.icon;

  return (
    <div className="min-h-screen bg-white font-figtree text-slate-900 antialiased selection:bg-brand-500 selection:text-white">
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:h-[72px] lg:px-10">
          <button type="button" onClick={() => navigate('/')} className="flex items-center gap-2.5 text-left">
            <img src="/icons/icon-192.png" alt="PairFlow Logo" className="h-9 w-9 rounded-xl object-contain" />
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

              <div className={`mt-8 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold ${article.eyebrowClass}`}>
                <Icon className="h-4 w-4" />
                {article.badge}
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                {article.heroTitle}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">{article.intro}</p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => navigate('/signup')}
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
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-200">Feature Preview</p>
                    <h2 className="mt-1 text-xl font-bold">{article.visualTitle}</h2>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${article.iconClass}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {article.visualRows.map(([title, meta, value]) => (
                    <div key={title} className="flex items-center justify-between gap-4 rounded-2xl bg-white p-3 text-slate-900">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${article.iconClass}`}>
                          <ReceiptText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">{title}</p>
                          <p className="truncate text-xs text-slate-500">{meta}</p>
                        </div>
                      </div>
                      <span className="shrink-0 text-right text-sm font-extrabold">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
          <div className="grid gap-5 md:grid-cols-3">
            {article.flow.map(([title, body], index) => (
              <div key={title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-extrabold ${article.iconClass}`}>
                  {index + 1}
                </div>
                <h2 className="mt-5 text-xl font-extrabold">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-50/70">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:px-10">
            <div>
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${article.iconClass}`}>
                <TrendingUp className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">{article.detailTitle}</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">{article.detailBody}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {article.capabilities.map((item) => (
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
              <Landmark className="h-8 w-8 text-brand-600" />
              <h2 className="mt-5 text-2xl font-extrabold">{article.guardTitle}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{article.guardBody}</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-950 p-7 text-white shadow-card">
              <Lock className="h-8 w-8 text-brand-200" />
              <h2 className="mt-5 text-2xl font-extrabold">Tetap berada dalam scope Household</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Fitur ini mengikuti aturan shared-per-Household PairFlow: data bisa dibaca anggota circle yang sama, tetapi tetap dibatasi dari Household lain melalui aturan database.
              </p>
            </div>
          </div>
        </section>
      </PageTransition>

      <Footer />
    </div>
  );
}

export default FeatureArticlePage;
