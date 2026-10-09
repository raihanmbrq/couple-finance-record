import { BookX, MessageCircleQuestion, FileSpreadsheet, Meh, RefreshCw, BarChart3, Smile, ShieldCheck } from 'lucide-react';

const oldProblems = [
  {
    icon: BookX,
    title: 'Catat di Buku Manual',
    desc: 'Sering lupa dicatat, tulisan berantakan, sulit dicari ulang.',
  },
  {
    icon: MessageCircleQuestion,
    title: 'Lupa Catat di WhatsApp',
    desc: 'Chat tenggelam, format tidak konsisten, siapa catat apa?',
  },
  {
    icon: FileSpreadsheet,
    title: 'Excel Rumit',
    desc: 'Formula bikin pusing, tidak bisa diakses dari mana saja.',
  },
  {
    icon: Meh,
    title: 'Komunikasi Kaku',
    desc: '"Kamu habis berapa tadi?" — percakapan memicu salah paham.',
  },
];

const pairflowSolutions = [
  {
    icon: RefreshCw,
    title: 'Sync Otomatis Real-time',
    desc: 'Transaksi muncul di kedua HP dalam hitungan detik. Tanpa refresh, tanpa tunggu.',
  },
  {
    icon: BarChart3,
    title: 'Statistik Visual Jernih',
    desc: 'Grafik interaktif, pie chart kategori, dan tren bulanan yang mudah dibaca.',
  },
  {
    icon: Smile,
    title: 'Komentar & Reaksi Emoji',
    desc: 'Beri komentar atau reaksi pada setiap transaksi. Diskusi keuangan jadi menyenangkan.',
  },
  {
    icon: ShieldCheck,
    title: 'Transparan & Damai',
    desc: 'Semua tercatat, semua terlihat. Kepercayaan tumbuh, drama berkurang.',
  },
];

export default function ProblemSolution() {
  return (
    <section id="cara-kerja" className="relative py-20 lg:py-28">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-slate-50/50 to-white" />

      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-600">
            Cara Lama vs Cara PairFlow
          </div>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] text-balance">
            Waktunya tinggalkan{' '}
            <span className="text-rose-500">cara lama</span> yang melelahkan
          </h2>
          <p className="mt-4 text-base text-slate-600 sm:text-lg text-balance">
            Beralih ke cara yang lebih cerdas, lebih cepat, dan lebih harmonis untuk
            mengelola keuangan rumah tangga.
          </p>
        </div>

        {/* Comparison grid */}
        <div className="mt-14 grid gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Left: Old way */}
          <div className="relative rounded-3xl border border-rose-100/80 bg-rose-50/40 p-6 lg:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100">
                <Meh className="h-6 w-6 text-rose-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Cara Lama</h3>
                <p className="text-sm text-slate-500">Ribet, kaku, bikin drama</p>
              </div>
            </div>
            <div className="space-y-3">
              {oldProblems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 rounded-2xl border border-rose-100/60 bg-white/60 p-4 transition-transform hover:translate-x-[-2px]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100">
                      <Icon className="h-5 w-5 text-rose-500" strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{item.title}</p>
                      <p className="mt-0.5 text-sm text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: PairFlow way */}
          <div className="relative overflow-hidden rounded-3xl border border-brand-200/80 bg-gradient-to-br from-brand-50/80 to-white p-6 lg:p-8">
            {/* Decorative glow */}
            <div className="absolute -top-20 -right-20 h-48 w-48 rounded-full bg-brand-200/30 blur-3xl" />

            <div className="relative mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500 shadow-glow-emerald">
                <ShieldCheck className="h-6 w-6 text-white" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Cara PairFlow</h3>
                <p className="text-sm text-slate-500">Mudah, cepat, transparan</p>
              </div>
            </div>
            <div className="relative space-y-3">
              {pairflowSolutions.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 rounded-2xl border border-brand-100/60 bg-white/80 p-4 shadow-card transition-all hover:translate-x-[2px] hover:shadow-card-hover"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100">
                      <Icon className="h-5 w-5 text-brand-600" strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{item.title}</p>
                      <p className="mt-0.5 text-sm text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
