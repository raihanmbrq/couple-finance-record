import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  HelpCircle,
  Laptop,
  LifeBuoy,
  Lock,
  Mail,
  Map,
  MessageCircle,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import Footer from './components/Footer';
import PageTransition from './components/PageTransition';
import ContactSupportForm from './components/ContactSupportForm';

const articles = {
  'produk/fitur': {
    badge: 'Produk',
    icon: Sparkles,
    title: 'Fitur PairFlow untuk mengelola cashflow bersama',
    intro:
      'Keuangan rumah tangga sering tersebar di beberapa rekening, e-wallet, dan catatan. PairFlow menyatukan gambaran itu agar pasangan dapat memahami uang masuk, uang keluar, dan tujuan bersama dengan konteks yang jelas.',
    sections: [
      ['Satu ruang untuk keuangan bersama', 'Household Sync menghubungkan akun ke Household yang sama melalui kode undangan. Setelah terhubung, anggota dapat melihat informasi keuangan yang dibagikan di ruang tersebut tanpa harus bertukar catatan secara manual.'],
      ['Wallet dengan sumber dana yang jelas', 'Catat saldo rekening bank, e-wallet, kas tunai, dan wallet bersama secara terpisah. Saat melihat transaksi, pasangan tetap dapat mengetahui wallet asalnya dan memahami perubahan saldo tiap wallet.'],
      ['Transaksi yang punya konteks', 'Catatan transaksi memuat nominal, kategori, tanggal, wallet, dan siapa yang mencatatnya. Konteks ini membantu pasangan meninjau aktivitas tanpa mengandalkan ingatan atau percakapan yang tercecer.'],
      ['Rencana yang bisa dipantau', 'Budget membantu menetapkan batas pengeluaran per kategori, sementara goal atau Kantong Impian memberi tempat untuk memantau target seperti liburan atau dana darurat. Keduanya membantu mengubah rencana menjadi progres yang terlihat.'],
    ],
    checklist: ['Hubungkan Household dengan kode undangan', 'Kelola beberapa wallet dan sumber dana', 'Catat transaksi beserta kategorinya', 'Pantau budget dan target bersama'],
    closingTitle: 'Mulai dari kebiasaan yang paling sederhana',
    closingBody:
      'Tambahkan wallet yang paling sering digunakan, lalu catat pemasukan dan pengeluaran secara konsisten. Setelah itu, pasangan dapat menentukan budget atau goal berdasarkan gambaran keuangan yang lebih nyata.',
  },
  'produk/cara-kerja': {
    badge: 'Produk',
    icon: Compass,
    title: 'Cara kerja PairFlow dari onboarding sampai Circle Mode',
    intro:
      'PairFlow dapat digunakan sendiri terlebih dahulu. Saat siap mengelola keuangan bersama, pengguna dapat menghubungkan akun pasangan ke Household yang sama dan mulai berbagi catatan sesuai ruang tersebut.',
    sections: [
      ['1. Siapkan akun dan Household', 'Buat akun PairFlow dan lengkapi profil. Pengguna memulai dengan Household personal sehingga wallet dan transaksi dapat dicatat langsung, tanpa menunggu orang lain bergabung.'],
      ['2. Tambahkan wallet dan catatan', 'Buat wallet untuk sumber dana yang ingin dipantau, misalnya rekening, e-wallet, atau kas. Catat pemasukan, pengeluaran, maupun transfer antar-wallet agar saldo dan riwayat memiliki konteks.'],
      ['3. Hubungkan pasangan bila siap', 'Bagikan kode undangan Household kepada pasangan, lalu minta pasangan bergabung menggunakan kode tersebut. Pastikan kode dibagikan kepada orang yang tepat sebelum digunakan.'],
      ['4. Tinjau keuangan bersama', 'Di Circle Mode, anggota Household dapat melihat informasi bersama dan tetap mengenali konteks wallet maupun pencatat transaksi. Gunakan budget dan goal untuk menyepakati langkah berikutnya.'],
    ],
    checklist: ['Buat akun dan profil', 'Tambahkan wallet pribadi', 'Catat transaksi rutin', 'Bagikan kode untuk menghubungkan pasangan'],
    closingTitle: 'Tidak perlu menunggu semua siap',
    closingBody:
      'Mulai dengan data yang sudah diketahui, lalu lengkapi pencatatan seiring waktu. Menghubungkan Household adalah pilihan saat Anda dan pasangan sudah siap melihat keuangan di ruang yang sama.',
  },
  'produk/keamanan': {
    badge: 'Produk',
    icon: ShieldCheck,
    title: 'Keamanan data finansial di PairFlow',
    intro:
      'Data transaksi dan saldo adalah informasi pribadi. PairFlow menggunakan autentikasi dan pembatasan akses di tingkat database untuk menjaga agar data tetap berada dalam konteks akun dan Household yang berhak mengaksesnya.',
    sections: [
      ['Autentikasi akun', 'Akses ke fitur akun dimulai dengan proses autentikasi. Jaga kerahasiaan kredensial dan gunakan perangkat pribadi atau perangkat tepercaya saat membuka informasi finansial.'],
      ['Akses mengikuti Household', 'Wallet, transaksi, budget, goal, dan data terkait dibatasi berdasarkan Household. Anggota dalam Household yang sama dapat mengakses informasi yang dibagikan di sana; pengguna dari Household lain tidak seharusnya mendapat akses tersebut.'],
      ['Pembatasan di database', 'Row Level Security (RLS) dan aturan database digunakan untuk memeriksa akses terhadap data, bukan hanya menyembunyikan tampilan di antarmuka. Alur seperti bergabung atau meninggalkan Household juga mengikuti aturan server.'],
      ['Peran pengguna dalam menjaga keamanan', 'Jangan bagikan kata sandi atau kode undangan kepada orang yang tidak dituju. Periksa kembali anggota Household dan informasi transaksi yang dicatat, terutama saat menggunakan perangkat bersama.'],
    ],
    checklist: ['Autentikasi untuk akses akun', 'Aturan akses data per Household', 'Validasi alur berbagi di sisi server', 'Jaga kredensial dan kode undangan'],
    closingTitle: 'Berbagi dengan orang yang tepat',
    closingBody:
      'Household memang dirancang untuk berbagi data dengan anggotanya. Sebelum mengundang seseorang atau memakai perangkat bersama, pastikan Anda memahami siapa yang akan dapat melihat informasi di ruang tersebut.',
  },
  'produk/edukasi-pwa': {
    badge: 'Produk',
    icon: Laptop,
    title: 'Akses PairFlow seperti aplikasi dengan PWA',
    intro:
      'PairFlow berjalan sebagai Progressive Web App (PWA). Anda dapat membukanya melalui browser dan, pada browser serta perangkat yang mendukung, menambahkannya ke layar utama agar lebih mudah dijangkau.',
    sections: [
      ['Buka PairFlow di browser', 'Akses alamat PairFlow menggunakan browser modern pada ponsel atau komputer. Masuk dengan akun Anda untuk melanjutkan ke data yang terkait dengan akun tersebut.'],
      ['Tambahkan ke layar utama', 'Jika browser menawarkan opsi Install atau Add to Home Screen, ikuti petunjuk pada layar. Nama menu dan ketersediaan opsi dapat berbeda antara Android, iPhone, dan browser yang digunakan.'],
      ['Gunakan pintasan untuk rutinitas harian', 'Setelah ditambahkan, ikon PairFlow dapat digunakan sebagai pintasan untuk membuka layanan. PWA tetap menggunakan kemampuan browser dan koneksi perangkat, sehingga perilaku tertentu bisa berbeda menurut perangkat.'],
      ['Akun yang sama di perangkat berbeda', 'Anda dapat membuka PairFlow dari perangkat lain dan masuk ke akun yang sama. Pastikan selalu keluar dari akun pada perangkat yang bukan milik Anda dan jangan menyimpan kredensial pada perangkat umum.'],
    ],
    checklist: ['Buka melalui browser modern', 'Pasang lewat opsi browser bila tersedia', 'Akses pintasan dari layar utama', 'Masuk dengan akun yang sama di perangkat lain'],
    closingTitle: 'PWA tidak selalu berperilaku sama di semua perangkat',
    closingBody:
      'Jika opsi pemasangan tidak muncul, PairFlow tetap dapat digunakan langsung dari browser. Periksa menu browser dan panduan perangkat Anda untuk mengetahui dukungan PWA yang tersedia.',
  },
  'produk/roadmap': {
    badge: 'Produk',
    icon: Map,
    title: 'Roadmap PairFlow untuk finansial rumah tangga yang makin matang',
    intro:
      'Arah pengembangan PairFlow berangkat dari kebutuhan sehari-hari: pencatatan yang konsisten, gambaran cashflow yang mudah dibaca, serta cara yang aman untuk menyusun tujuan bersama. Prioritas dapat berubah mengikuti masukan dan evaluasi produk.',
    sections: [
      ['Fondasi produk', 'Fokus utama PairFlow adalah membantu pengguna mencatat transaksi, mengatur wallet, memahami ringkasan keuangan, dan—bila dibutuhkan—menghubungkannya dengan Household pasangan.'],
      ['Perencanaan yang lebih terarah', 'Budget dan goal membantu pengguna membandingkan rencana dengan aktivitas yang tercatat. Pengembangan lanjutan perlu menjaga agar informasi tetap mudah dipahami dan dapat ditindaklanjuti.'],
      ['Kolaborasi yang tetap terkendali', 'Fitur bersama perlu membuat siapa-melihat-apa tetap jelas. Pengalaman mengundang, berbagi, dan mengelola data Household harus tetap sejalan dengan kontrol akses.'],
      ['Prioritas berdasarkan kebutuhan', 'Masukan pengguna membantu menemukan bagian yang membingungkan atau memerlukan perbaikan. Roadmap adalah arah kerja, bukan janji tanggal rilis atau jaminan bahwa setiap ide akan menjadi fitur.'],
    ],
    checklist: ['Pencatatan dan wallet yang mudah dipahami', 'Budget dan goal yang berguna untuk rencana', 'Kolaborasi dengan batas akses yang jelas', 'Prioritas yang mengikuti masukan pengguna'],
    closingTitle: 'Roadmap berkembang bersama penggunaan nyata',
    closingBody:
      'Gunakan PairFlow sesuai kebutuhan saat ini dan sampaikan masukan melalui jalur dukungan yang tersedia. Kami tidak mencantumkan tanggal rilis untuk ide yang belum diumumkan sebagai fitur tersedia.',
  },
  'perusahaan/tentang-kami': {
    badge: 'Perusahaan',
    icon: Users,
    title: 'Tentang PairFlow',
    intro:
      'PairFlow adalah aplikasi untuk membantu pasangan dan rumah tangga mencatat serta memahami keuangan bersama. Tujuannya sederhana: membuat percakapan tentang uang lebih terbuka, teratur, dan berangkat dari informasi yang sama.',
    sections: [
      ['Tantangan keuangan bersama', 'Saldo bisa berada di banyak rekening dan e-wallet, sedangkan pengeluaran dicatat oleh orang yang berbeda. Tanpa satu gambaran yang sama, pasangan lebih sulit mengetahui posisi keuangan rumah tangga.'],
      ['Dibangun untuk transparansi', 'PairFlow menyediakan wallet, catatan transaksi, dan konteks pencatat agar informasi lebih mudah ditinjau. Fitur Household memungkinkan pengguna berbagi dalam ruang yang sama ketika mereka memilih untuk terhubung.'],
      ['Rencana yang dapat ditinjau', 'Budget dan goal membantu pasangan mengubah rencana menjadi angka yang bisa dipantau. Keduanya mendukung diskusi dan pengambilan keputusan, bukan menggantikan kesepakatan pasangan.'],
      ['Prinsip yang kami pegang', 'Pengalaman harus mudah digunakan, informasi harus memiliki konteks, dan data bersama harus memiliki batas akses yang jelas. Kami terus belajar dari cara rumah tangga menggunakan produk.'],
    ],
    checklist: ['Catatan keuangan dengan konteks', 'Kolaborasi sesuai pilihan pengguna', 'Perencanaan yang bisa dipantau', 'Pengalaman yang praktis untuk rutinitas'],
    closingTitle: 'Keuangan bersama dimulai dari percakapan',
    closingBody:
      'PairFlow menyediakan alat untuk membuat percakapan itu lebih terarah. Keputusan dan kesepakatan tetap berada di tangan Anda dan pasangan.',
  },
  'perusahaan/kontak': {
    badge: 'Perusahaan',
    icon: Mail,
    title: 'Kontak PairFlow',
    intro:
      'Punya pertanyaan tentang PairFlow, ingin menyampaikan masukan, atau membicarakan kemungkinan kolaborasi? Pilih topik dan siapkan konteks yang relevan agar pesan Anda lebih mudah ditindaklanjuti.',
    sections: [
      ['Pertanyaan tentang produk', 'Sebutkan fitur yang sedang digunakan dan apa yang ingin Anda pahami—misalnya wallet, transaksi, budget, goal, atau Household. Hindari menyertakan kata sandi, kode autentikasi, dan informasi rekening sensitif.'],
      ['Masukan atau ide', 'Ceritakan kebutuhan yang ingin diselesaikan, bagaimana Anda menggunakan fitur saat ini, dan bagian yang terasa kurang jelas. Contoh situasi nyata yang tidak memuat data pribadi akan membantu kami memahami konteksnya.'],
      ['Kerja sama', 'Untuk usulan kolaborasi, sertakan tujuan, pihak yang terlibat, bentuk kegiatan, dan waktu yang diharapkan. Informasi ini membantu menentukan apakah topik tersebut sesuai dengan kebutuhan produk.'],
      ['Kendala teknis atau akun', 'Untuk masalah yang menghambat penggunaan, halaman Contact Support menyediakan panduan informasi yang perlu disiapkan. Jangan kirim kredensial atau data finansial lengkap melalui pesan.'],
    ],
    checklist: ['Jelaskan tujuan pesan dengan singkat', 'Sertakan fitur dan konteks penggunaan', 'Jangan sertakan kata sandi atau data sensitif', 'Gunakan panduan Contact Support untuk kendala teknis'],
    closingTitle: 'Kirim pertanyaan Anda lewat formulir di atas',
    closingBody:
      'Isi formulir Contact Support dan pesan akan diteruskan ke pairflowappcontact@gmail.com. Untuk keamanan, jangan menyertakan kata sandi, kode OTP, atau data rekening lengkap.',
  },
  'bantuan/pusat-bantuan': {
    badge: 'Bantuan',
    icon: HelpCircle,
    title: 'Pusat Bantuan PairFlow',
    intro:
      'Temukan panduan untuk memulai, menjaga catatan tetap rapi, serta menggunakan fitur PairFlow bersama pasangan. Jika Anda belum tahu harus mulai dari mana, ikuti alur dasar di bawah ini.',
    sections: [
      ['Akun dan Household', 'Mulai dengan akun personal dan pahami ruang data Anda. Jika ingin berbagi, undang pasangan ke Household yang sama menggunakan kode undangan; pastikan kode diberikan kepada orang yang tepat.'],
      ['Wallet dan transaksi', 'Tambahkan wallet sesuai sumber dana, lalu catat pemasukan, pengeluaran, atau transfer internal. Pilih kategori dan tanggal yang tepat agar riwayat lebih mudah dicari dan ringkasan lebih berguna.'],
      ['Budget dan goal', 'Gunakan budget untuk menetapkan batas pengeluaran kategori dalam periode yang dipilih. Buat goal untuk target tabungan dan tinjau progresnya bersama secara berkala.'],
      ['Jika ada perbedaan saldo', 'Periksa transaksi terbaru, wallet yang dipilih, tanggal, dan jenis transaksi. Transfer antar-wallet berbeda dari pengeluaran karena hanya memindahkan dana di antara wallet Anda.'],
    ],
    checklist: ['Siapkan akun dan Household', 'Tambahkan wallet yang digunakan', 'Catat transaksi dengan kategori', 'Gunakan budget atau goal bila diperlukan'],
    closingTitle: 'Cari panduan sesuai kendala',
    closingBody:
      'Untuk masalah yang berulang, catat langkah sebelum kendala muncul dan halaman yang terdampak. Informasi ini membantu proses pemeriksaan tanpa perlu membagikan data rahasia.',
  },
  'bantuan/privacy-policy': {
    badge: 'Bantuan',
    icon: Lock,
    title: 'Privacy Policy PairFlow',
    intro:
      'Privasi adalah bagian penting dari aplikasi keuangan. Halaman ini menjelaskan jenis informasi yang digunakan PairFlow untuk menjalankan fitur, bagaimana informasi tersebut terkait dengan Household, dan langkah yang dapat Anda lakukan untuk menjaga akun.',
    sections: [
      ['Informasi yang Anda masukkan', 'Untuk menyediakan layanan, PairFlow menggunakan informasi akun dan profil serta data yang Anda tambahkan, seperti Household, wallet, transaksi, kategori, budget, dan goal. Preferensi aplikasi juga dapat disimpan agar pengalaman tetap sesuai pilihan Anda.'],
      ['Mengapa informasi digunakan', 'Informasi tersebut diperlukan untuk menampilkan saldo dan riwayat, menghitung ringkasan, menyinkronkan data Household, serta menjalankan fitur yang Anda pilih. PairFlow tidak memerlukan kata sandi bank atau PIN pembayaran untuk mencatat transaksi secara manual.'],
      ['Siapa yang dapat melihat data', 'Data keuangan dibatasi menurut akun dan Household. Jika Anda bergabung atau mengundang anggota ke Household, anggota di ruang yang sama dapat melihat data yang dibagikan di sana. Jangan bergabung dengan Household yang tidak Anda kenali.'],
      ['Keamanan dan kendali akun', 'Pembatasan akses diterapkan melalui autentikasi dan aturan database, termasuk Row Level Security. Anda bertanggung jawab menjaga kredensial dan perangkat; keluar dari akun pada perangkat bersama dan hubungi dukungan jika menduga akses tidak sah.'],
    ],
    checklist: ['Data profil dan akun', 'Data keuangan yang Anda catat', 'Berbagi mengikuti keanggotaan Household', 'Jaga kredensial dan akses perangkat'],
    closingTitle: 'Tinjau keanggotaan dan data yang dibagikan',
    closingBody:
      'Sebelum menghubungkan akun, pastikan Household dan anggotanya sesuai. Untuk pertanyaan tentang akses atau pengelolaan data akun, hubungi dukungan tanpa mengirim kata sandi, kode autentikasi, atau detail rekening.',
  },
  'bantuan/terms-of-service': {
    badge: 'Bantuan',
    icon: ScrollText,
    title: 'Terms of Service PairFlow',
    intro:
      'Dengan menggunakan PairFlow, pengguna diharapkan memakai layanan secara bertanggung jawab dan menjaga keamanan akunnya. Ketentuan berikut menjelaskan batas dasar penggunaan aplikasi dan tanggung jawab atas data yang dicatat.',
    sections: [
      ['Tujuan layanan', 'PairFlow adalah alat untuk mencatat, mengatur, dan meninjau informasi keuangan yang dimasukkan pengguna. Informasi dan perhitungan aplikasi bukan nasihat investasi, pajak, hukum, atau rekomendasi profesional.'],
      ['Akun dan penggunaan wajar', 'Gunakan akun sendiri, jaga kredensial, dan hanya bagikan kode undangan kepada orang yang memang ingin Anda hubungkan. Jangan mencoba mengakses Household atau data milik pengguna lain tanpa izin.'],
      ['Tanggung jawab atas catatan', 'Pengguna bertanggung jawab memastikan nominal, tanggal, kategori, dan wallet yang dicatat sudah benar. Kesalahan input dapat memengaruhi saldo, budget, dan ringkasan yang ditampilkan.'],
      ['Ketersediaan dan perubahan', 'Fitur dapat diperbaiki atau berubah seiring pengembangan produk. Jangan mengandalkan PairFlow sebagai satu-satunya arsip atau sumber untuk keputusan finansial penting; simpan catatan penting sesuai kebutuhan Anda.'],
    ],
    checklist: ['Gunakan aplikasi sebagai alat pencatatan', 'Jaga akun dan kode undangan', 'Periksa akurasi transaksi', 'Simpan catatan penting sesuai kebutuhan'],
    closingTitle: 'Keputusan finansial tetap milik Anda',
    closingBody:
      'Gunakan ringkasan PairFlow sebagai alat bantu memahami catatan, bukan sebagai pengganti pertimbangan atau nasihat profesional. Jika terdapat perbedaan, periksa data sumber dan transaksi yang mendasarinya.',
  },
  'bantuan/contact-support': {
    badge: 'Bantuan',
    icon: LifeBuoy,
    title: 'Contact Support PairFlow',
    intro:
      'Jika mengalami kendala saat menggunakan PairFlow, laporan yang jelas membantu masalah lebih mudah diperiksa. Siapkan informasi teknis yang relevan, tetapi jangan kirim kredensial atau data keuangan rahasia.',
    sections: [
      ['Jelaskan masalah secara ringkas', 'Sebutkan halaman atau fitur yang bermasalah, apa yang Anda coba lakukan, apa yang diharapkan, dan apa yang terjadi. Jika masalah dapat diulang, tuliskan langkah-langkahnya secara berurutan.'],
      ['Sertakan informasi perangkat', 'Cantumkan jenis perangkat, sistem operasi, browser, dan perkiraan waktu kejadian. Bila mengirim tangkapan layar, pastikan nama, saldo, nomor rekening, dan informasi pribadi lain sudah disamarkan.'],
      ['Untuk Household atau sinkronisasi', 'Sebutkan apakah Anda menggunakan Household personal atau bersama, tindakan terakhir sebelum data tidak muncul, dan apakah anggota lain mengalami hal yang sama. Jangan mengirim kode undangan aktif ke ruang publik.'],
      ['Untuk transaksi atau saldo', 'Jelaskan jenis transaksi, wallet terkait, tanggal, dan langkah yang sudah dicoba. Hindari mengirim nomor rekening lengkap, bukti pembayaran yang belum disamarkan, atau kredensial.'],
    ],
    checklist: ['Fitur dan langkah yang memicu kendala', 'Perangkat, sistem operasi, dan browser', 'Waktu kejadian serta hasil yang terlihat', 'Tangkapan layar yang sudah disamarkan'],
    closingTitle: 'Lindungi informasi sensitif saat meminta bantuan',
    closingBody:
      'Tim dukungan tidak memerlukan kata sandi, PIN bank, kode OTP, atau nomor kartu lengkap untuk memahami masalah aplikasi. Jika kanal dukungan belum tersedia di aplikasi Anda, gunakan kanal resmi proyek yang diberikan oleh pengelola PairFlow.',
  },
} as const;

export function FooterArticlePage() {
  const navigate = useNavigate();
  const { section, slug } = useParams();
  const articleKey = `${section}/${slug}` as keyof typeof articles;
  const article = articles[articleKey];

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
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke landing page
              </button>

              <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-700">
                <Icon className="h-4 w-4" />
                {article.badge}
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                {article.title}
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
              <div className="rounded-3xl bg-slate-950 p-6 text-white">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-200">Ringkasan</p>
                    <h2 className="mt-1 text-xl font-bold">{article.badge}</h2>
                  </div>
                </div>
                <ul className="mt-5 space-y-3">
                  {article.checklist.map((item) => (
                    <li key={item} className="flex gap-2.5 text-sm leading-6 text-slate-100">
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-brand-300" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
          <div className="grid gap-5 md:grid-cols-3">
            {article.sections.map(([title, body]) => (
              <div key={title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-xl font-extrabold">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {articleKey === 'bantuan/contact-support' && (
          <section className="mx-auto max-w-4xl px-5 py-16 sm:px-8 lg:px-10">
            <ContactSupportForm />
          </section>
        )}

        <section className="border-y border-slate-200 bg-slate-50/70">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:px-10">
            <div>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                <MessageCircle className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
                {article.closingTitle}
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                {article.closingBody}
              </p>
            </div>

            <div className="flex items-center">
              <button
                type="button"
                onClick={() => navigate('/onboarding')}
                className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-glow-emerald transition-all hover:brightness-105 active:scale-[0.98]"
              >
                Jelajahi PairFlow
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

export default FooterArticlePage;
