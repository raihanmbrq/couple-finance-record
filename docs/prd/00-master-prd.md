# Master Product Requirements Document (PRD) — PairFlow

> **Versi dokumen**: 1.0 (as-implemented)
> **Tanggal**: 24 Agustus 2026
> **Status**: Dokumentasi retrospektif — PRD ini diturunkan dari analisis menyeluruh codebase yang SUDAH terimplementasi (`src/`, `supabase/migrations/`), bukan spesifikasi forward-looking.
> **Referensi terkait**: `docs/prd/circle-mode.md`

---

## Daftar Isi

1. [Executive Summary & App Overview](#1-executive-summary--app-overview)
2. [System Architecture & Tech Stack](#2-system-architecture--tech-stack)
3. [Database Schema & Data Relations](#3-database-schema--data-relations)
4. [Feature Modules Breakdown](#4-feature-modules-breakdown)
5. [User Journey & UI Flow](#5-user-journey--ui-flow)

---

## 1. Executive Summary & App Overview

### 1.1 Deskripsi Aplikasi

**PairFlow** (nama internal/session: _DuitBersama_) adalah aplikasi pencatat keuangan rumah tangga berbasis **Progressive Web App (PWA) mobile-first** yang dirancang untuk pasangan, keluarga, atau kelompok kecil yang ingin mencatat dan memantau keuangan secara **bersama dan transparan**, sekaligus tetap dapat digunakan secara mandiri oleh pengguna tunggal.

Nilai utama aplikasi:

- **Pencatatan bersama real-time** — seluruh anggota "Circle/Household" melihat data wallet, transaksi, budget, dan goal yang sama.
- **Multi-wallet** — mendukung dompet tunai, rekening bank, e-wallet, dan dompet bersama dalam satu agregasi saldo.
- **Perencanaan keuangan** — budget bulanan per kategori dan goal (sinking fund) dengan kalkulasi kontribusi bulanan berbasis anuitas.
- **Personalisasi per pengguna** — mata uang, tema, dan bahasa adalah preferensi individual, tidak dipaksakan ke seluruh circle.
- **Laporan** — ekspor ringkasan keuangan ke Excel dan PDF (e-statement) dengan identitas visual tema pengguna.

### 1.2 Target Pengguna

| Segmen                                     | Kebutuhan utama                                                               |
| ------------------------------------------ | ----------------------------------------------------------------------------- |
| Pasangan suami-istri                       | Transparansi arus kas rumah tangga, siapa mencatat apa (`spent_by`/logged by) |
| Keluarga / circle kecil (maks. 10 anggota) | Dompet bersama + dompet pribadi dalam satu tampilan agregat                   |
| Pengguna tunggal                           | Pencatatan pribadi sederhana dengan budget & goal                             |
| Calon pengguna (trial)                     | **Demo mode** dengan data mock tanpa perlu mendaftar                          |

### 1.3 Dua Mode Operasional

| Aspek         | `live` mode                      | `demo` mode                                                     |
| ------------- | -------------------------------- | --------------------------------------------------------------- |
| Autentikasi   | Supabase Auth (email + password) | Tanpa akun; flag `localStorage['duitbersama_session'] = 'demo'` |
| Data          | Supabase Postgres + RLS          | Mock data in-memory (`mockData.ts`)                             |
| Persistensi   | Ya                               | Tidak (hilang saat sign out / refresh session)                  |
| Avatar upload | Cloudinary                       | Dinonaktifkan (throw error)                                     |
| Indikator UI  | —                                | Badge "Demo" pada TopBar & Profile                              |

### 1.4 Arsitektur Utama (Ringkas)

```
┌────────────────────────────┐
│  React 18 SPA (Vite, PWA)  │
│  Tailwind CSS + theming    │
│  Context-based state       │
└──────────┬─────────────────┘
           │ supabase-js (REST/PostgREST + RPC)
┌──────────▼─────────────────┐      ┌──────────────────────┐
│  Supabase                  │      │  Cloudinary          │
│  - Auth (email/password)   │      │  - Avatar (unsigned) │
│  - Postgres + RLS          │      │  - Receipt (unsigned)│
│  - RPC SECURITY DEFINER    │      └──────────────────────┘
│  - Triggers                │
└────────────────────────────┘
```

Struktur layar: 4 tab utama — **Home**, **Transactions**, **Budget**, **Profile** — dengan tombol FAB global untuk menambah transaksi. Navigasi tab dipersist di `localStorage['activeTab']`. Tidak ada router; seluruh layar sekunder berbentuk _sheet/modal_ dengan penanganan tombol back perangkat via hook `useBackHandler`.

---

## 2. System Architecture & Tech Stack

### 2.1 Teknologi Inti

| Lapisan              | Teknologi                                      | Catatan                                                         |
| -------------------- | ---------------------------------------------- | --------------------------------------------------------------- |
| Bahasa               | TypeScript 5.5                                 | Strict typing, shared types di `src/lib/types.ts`               |
| Framework UI         | React 18.3                                     | Function components + hooks                                     |
| Build tool           | Vite 5.4                                       | + `vite-plugin-pwa` (workbox) → installable PWA                 |
| Styling              | Tailwind CSS 3.4 (+ `@tailwindcss/forms`)      | Design token berbasis CSS variables                             |
| Ikon                 | lucide-react                                   | + ikon brand bank/e-wallet Indonesia (aset `.webp`)             |
| State management     | React Context                                  | `AppContext`, `ThemeContext`, `LanguageContext`, `ToastContext` |
| Backend              | Supabase                                       | Auth, Postgres, RLS, RPC, triggers                              |
| Media                | Cloudinary                                     | Unsigned upload preset (avatar & receipt)                       |
| Laporan              | `xlsx` 0.18 + `@react-pdf/renderer` 4.6        | Excel & PDF e-statement                                         |
| Gambar               | `browser-image-compression`, `react-easy-crop` | Kompresi receipt & crop avatar                                  |
| Hook back-navigation | `useBackHandler` (custom)                      | Stack `history.pushState` untuk sheet/modal                     |

> Catatan: `qrcode.react` terpasang di `package.json` namun **tidak digunakan** di codebase saat ini. Google sign-in tersedia sebagai stub yang secara eksplisit menolak (`"Google sign-in is not available in this build"`).

### 2.2 Pola State Management

Seluruh data domain dan aksi CRUD terpusat di **`AppContext`** (`src/context/AppContext.tsx`, ~1.100 baris), yang menyediakan:

- **State global**: `profile`, `household`, `householdMembers`, `wallets`, `transactions`, `budgets`, `goals`, `walletTypes`, `categories`, `mode` ('demo' | 'live'), `isDemo`.
- **Aksi**: auth (`signUp`, `signIn`, `signOut`, `signInWithGoogle`, `enterDemo`), household (`createHousehold`, `joinHousehold`, `leaveHousehold`, `updateProfile`, `updateAvatar`), wallet (`addWallet`, `updateWallet`, `deleteWallet`, wallet types CRUD), transaksi (`addTransaction`, `updateTransaction`, `deleteTransaction`), budget (`setBudget`, `deleteBudget`), goal (`saveGoal`, `deleteGoal`, `depositToGoal`).
- **Optimistic local update**: setiap mutasi memperbarui state lokal terlebih dahulu/bersamaan dengan insert-update-delete Supabase, tanpa refetch penuh.
- **Rekonsiliasi saldo client-side**: `addTransaction` menambah/mengurangi saldo wallet; `updateTransaction` membalik efek lama dan menerapkan efek baru (termasuk pindah wallet); `deleteTransaction` membalik efek — termasuk sinkronisasi `current_amount` goal untuk transaksi deposit.
- **Demo mode**: `enterDemo()` memuat seluruh mock entity; semua aksi tulis menolak atau beroperasi in-memory.

Urutan provider (`App.tsx`):

```
AppProvider → LanguageProvider(userLanguage = profile?.language)
            → ToastProvider → ThemeProvider → AppContent
```

### 2.3 Sistem Tema

- Dimensi: **mode** (`light` / `dark` / `system`) × **preset warna** (`emerald`, `gold`, `rose`, `slate`).
- Implementasi: atribut `html[data-mode][data-preset]` + CSS variables (`--color-primary`, `--color-primary-dark`, `--color-expense-dark`, dst.) yang dipetakan Tailwind via `rgb(var(--color-X) / <alpha-value>)`.
- Persistensi: `profiles.color_preset` dan `profiles.appearance_mode` (per-user), disinkronkan App → `ThemeProvider`.
- Font global: Figtree (sans & display).

### 2.4 Internasionalisasi (i18n)

- Bahasa: `id` (default) dan `en`, kamus tunggal `src/locales/translations.ts` dengan fungsi `t(lang, key, params)`.
- Persistensi ganda: `localStorage['pf-language']` (prioritas) + `profiles.language`; `LanguageContext` menerima `userLanguage` dari profil sebagai fallback ketika belum ada pilihan lokal.

### 2.5 Konvensi Penyimpanan Nilai Uang

- Database: `bigint` (integer satuan mata uang, tanpa desimal).
- Client: number biasa; formatting via `formatMoney`, input via `formatMoneyInput`/`parseMoneyInput` (`src/lib/format.ts`), simbol dari `getCurrencySymbol` (`src/lib/currencies.ts`).
- Tanggal transaksi disimpan sebagai ISO dengan jam **12:00 UTC** (`${yyyy-mm-dd}T12:00:00.000Z`) untuk menghindari pergeseran zona tanggal.

---

## 3. Database Schema & Data Relations

Bab ini merangkum 14 file migrasi di `supabase/migrations/` (2026-07-30 s.d. 2026-08-24).

### 3.1 Inventori Tabel

#### `households`

| Kolom          | Tipe            | Keterangan                                                                             |
| -------------- | --------------- | -------------------------------------------------------------------------------------- |
| `id`           | uuid PK         | `gen_random_uuid()`                                                                    |
| `name`         | text            | Nama circle, mis. "Keluarga Raihan"                                                    |
| `invite_code`  | text **UNIQUE** | 6 karakter, charset `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (tanpa karakter ambigu 0/O/1/I) |
| `mode`         | text            | `'single'` / `'couple'`                                                                |
| `partner_name` | text            | Nama pasangan (display)                                                                |
| `created_at`   | timestamptz     |                                                                                        |

#### `household_members`

| Kolom          | Tipe                                | Keterangan                                                                                      |
| -------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------- |
| `id`           | uuid PK                             |                                                                                                 |
| `user_id`      | uuid FK → `profiles.id`, **UNIQUE** | Satu pengguna = satu keanggotaan aktif                                                          |
| `household_id` | uuid FK → `households.id`           |                                                                                                 |
| `role`         | text                                | `'owner'` / `'member'` — tepat satu owner per household (dinormalisasi oleh migrasi 2026-08-14) |
| Constraint     |                                     | `UNIQUE(household_id, user_id)`                                                                 |

#### `profiles`

| Kolom                              | Tipe                         | Keterangan                                                                                                           |
| ---------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `id`                               | uuid PK FK → `auth.users.id` |                                                                                                                      |
| `full_name`, `email`, `avatar_url` | text                         |                                                                                                                      |
| `role`                             | text                         | `suami` / `istri` / `single` / `partner` / `owner` / `member`                                                        |
| `household_id`                     | uuid FK → `households.id`    | **DEFERRABLE INITIALLY DEFERRED** (memungkinkan signup: profile & household saling referencing dalam satu transaksi) |
| `currency`                         | text default `'IDR'`         | Preferensi per-user                                                                                                  |
| `color_preset`                     | text default `'emerald'`     | + legacy `theme` yang di-backfill                                                                                    |
| `appearance_mode`                  | text default `'system'`      | `light`/`dark`/`system`                                                                                              |
| `language`                         | text default `'id'`          | `id`/`en`                                                                                                            |

#### `wallets`

| Kolom          | Tipe                        | Keterangan                                                                      |
| -------------- | --------------------------- | ------------------------------------------------------------------------------- |
| `id`           | uuid PK                     |                                                                                 |
| `user_id`      | uuid FK → profiles          | Pembuat wallet                                                                  |
| `household_id` | uuid FK → households        | Scope berbagi data                                                              |
| `name`         | text                        |                                                                                 |
| `type`         | text FK → `wallet_types.id` | Semula CHECK (`joint/cash/bank/ewallet`), diganti FK sejak migrasi wallet_types |
| `balance`      | bigint                      | Saldo berjalan                                                                  |
| `icon`         | text                        | Kunci brand icon (mis. `bca`, `gopay`) atau null                                |
| `created_at`   | timestamptz                 |                                                                                 |

#### `wallet_types`

| Kolom          | Tipe          | Keterangan                                                                                |
| -------------- | ------------- | ----------------------------------------------------------------------------------------- |
| `id`           | text PK       | Sistem: `joint`, `cash`, `bank`, `ewallet`; custom: `slugify(nama)` + dedup `_2`, `_3`, … |
| `household_id` | uuid nullable | NULL untuk row sistem                                                                     |
| `name`, `icon` | text          | Icon lucide: PiggyBank/Banknote/Landmark/Smartphone                                       |
| `is_system`    | boolean       | Row sistem tidak dapat diubah/dihapus siapa pun                                           |
| Constraint     |               | `UNIQUE(household_id, name)`                                                              |

#### `transactions`

| Kolom              | Tipe              | Keterangan                                               |
| ------------------ | ----------------- | -------------------------------------------------------- |
| `id`               | uuid PK           |                                                          |
| `wallet_id`        | uuid FK → wallets | RLS transaksi diturunkan dari household wallet           |
| `amount`           | bigint            | Selalu positif; arah ditentukan `type`                   |
| `type`             | text              | `'income'` / `'expense'`                                 |
| `category`         | text              | ID kategori (mis. `food`, `salary`, `transfer`, `goals`) |
| `notes`            | text nullable     |                                                          |
| `spent_by`         | text              | Nama pencatat (denormalisasi display)                    |
| `transaction_date` | timestamptz       | Disimpan jam 12:00 UTC                                   |
| `receipt_url`      | text nullable     | URL Cloudinary bukti transaksi                           |
| `created_at`       | timestamptz       | Fallback urutan & tanggal                                |

#### `budgets`

| Kolom          | Tipe    | Keterangan                                                                |
| -------------- | ------- | ------------------------------------------------------------------------- |
| `id`           | uuid PK |                                                                           |
| `household_id` | uuid FK |                                                                           |
| `category`     | text    | Kategori expense                                                          |
| `amount`       | bigint  | Limit bulanan                                                             |
| Constraint     |         | `UNIQUE(household_id, category)` — satu budget per kategori per household |

#### `goals`

| Kolom                                                     | Tipe        | Keterangan                                                                 |
| --------------------------------------------------------- | ----------- | -------------------------------------------------------------------------- |
| `id`                                                      | uuid PK     |                                                                            |
| `household_id`                                            | uuid FK     |                                                                            |
| `title`                                                   | text        |                                                                            |
| `target_amount`, `current_amount`, `monthly_contribution` | bigint      | `current_amount` default 0                                                 |
| `target_date`                                             | timestamptz |                                                                            |
| `asset_category`                                          | text CHECK  | `Tabungan Biasa` / `Reksadana` / `Saham` / `Deposito` / `Emas` / `Lainnya` |
| `expected_return_rate`                                    | numeric     | % per tahun; hanya relevan untuk kategori investasi                        |
| `created_at`                                              | timestamptz | Dipakai sebagai tanggal mulai                                              |

#### `categories`

| Kolom          | Tipe          | Keterangan                                                                                                                                         |
| -------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`           | text PK       | Sistem: `food`, `bills`, `shopping`, `entertainment`, `transport`, `health`, `education`, `coffee`, `salary`, `other`, `transfer`, `goals`, `gift` |
| `household_id` | uuid nullable | NULL untuk row sistem                                                                                                                              |
| `name`, `icon` | text          | Icon dari 15 opsi lucide (`CATEGORY_ICON_OPTIONS`)                                                                                                 |
| `type`         | text          | `'expense'` / `'income'` / `'both'`                                                                                                                |
| `is_system`    | boolean       |                                                                                                                                                    |
| Constraint     |               | `UNIQUE(household_id, name)`                                                                                                                       |

### 3.2 Diagram Relasi

```
auth.users (1)────(1) profiles (N)────(1) households
                          │                    │
                          │                    ├──── household_members (role: owner/member)
                          │                    │
                          ├──── wallets (N)────┼── household_id
                          │        │           ├──── budgets
                          │        └── transactions
                          │                    ├──── goals
                          │
                          └─ prefs per-user: currency, color_preset,
                             appearance_mode, language

wallet_types / categories: row sistem (is_system=true, household_id NULL)
                           + row custom per household
```

### 3.3 Aturan RLS & Isolasi Data

Helper inti: **`user_household_id()`** — fungsi `SECURITY DEFINER` yang mengembalikan `household_id` profil pengguna login.

| Tabel                         | SELECT                                                              | INSERT/UPDATE/DELETE                                    |
| ----------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------- |
| `profiles`                    | Baris sendiri + profil satu household (`select_household_profiles`) | Hanya baris sendiri                                     |
| `households`                  | Household sendiri                                                   | Insert terbuka (digunakan RPC/trigger); update terbatas |
| `household_members`           | Anggota household sendiri                                           | Insert/delete untuk diri sendiri                        |
| `wallets`, `budgets`, `goals` | `household_id = user_household_id()`                                | Sama (household-scoped CRUD)                            |
| `transactions`                | Household dari wallet induk (`wallet_id → wallets.household_id`)    | Sama                                                    |
| `wallet_types`, `categories`  | `is_system = true` **OR** `household_id = user_household_id()`      | Hanya row non-sistem milik household sendiri            |

**Prinsip isolasi:**

- **Data finansial bersifat shared per household** — wallet, transaksi, budget, goal tidak pernah "milik pribadi" dalam hal visibilitas; begitu pengguna bergabung ke circle, datanya direhome dan terlihat seluruh anggota.
- **Preferensi bersifat per-user** — `currency`, `color_preset`, `appearance_mode`, `language` tersimpan di `profiles` dan tidak dibagikan; dua anggota circle dapat memakai mata uang/tema/bahasa berbeda tanpa saling memengaruhi (format uang mengikuti mata uang pengguna yang sedang login).
- **Row sistem tidak dapat dimutasi** — wallet type & kategori bawaan dilindungi flag `is_system`; pengguna hanya dapat menambah/mengubah/menghapus row custom miliknya.

### 3.4 Logika Server-Side (RPC & Trigger)

**Trigger:**

- `handle_new_user_profile` (AFTER INSERT pada `auth.users`): membuat row profil + household personal otomatis (ON CONFLICT update).
- `ensure_household_member` (BEFORE INSERT OR UPDATE OF `household_id` pada `profiles`): menjamin baris `household_members` tersinkron; role `owner` hanya dipertahankan bila pengguna tidak pindah household; menolak bila > 10 anggota; `household_id` di-set NULL (leave) tidak pernah memicu pembuatan household baru.

**RPC (SECURITY DEFINER):**

- `create_household(p_name, p_partner, p_mode)` — validasi "harus keluar dari circle aktif dulu", insert household + rehome data + membership `owner`.
- `join_household_by_code(code)` — validasi kode, bukan anggota yang sama, bukan sedang di circle lain, kapasitas < 10; `rehome_user_data`, membership selalu `'member'`, profil menjadi `'partner'`, household menjadi mode `'couple'`.
- `leave_current_household()` — pengguna solo: rotasi invite code; pengguna circle: dipindahkan ke household personal baru (`ensure_personal_household`).
- `rehome_user_data(target_hh)` — memindahkan wallets (beserta transaksi mengikuti `wallet_id`), budgets (**delete bila kategori sudah ada di target** — budget circle menang), dan goals ke household tujuan; dijalankan sebelum profile di-repoint agar RLS tetap terpenuhi.

**Invariant server-side:** maksimal **10 anggota per circle**; invite code unik 6 karakter; tepat satu owner per household (dinormalisasi migrasi `20260814000000` yang juga memperbaiki data legacy).

---

## 4. Feature Modules Breakdown

Setiap modul didokumentasikan dengan tiga bagian: **Functionality** (apa yang dilakukan), **Business Logic & Rules** (logika internal, batasan, state), dan **Acceptance Criteria** (poin verifikasi).

### 4.1 Auth & Pairing (Onboarding / Circle)

**Functionality**
Registrasi & login email/password, sesi demo tanpa akun, pembuatan Household/Circle, bergabung dengan kode undangan 6 digit, keluar dari circle, serta manajemen profil dasar (nama, avatar).

**Business Logic & Rules**

- **Sign up**: `supabase.auth.signUp` → fallback `signInWithPassword` bila sesi tidak otomatis terbentuk → upsert profil (`onConflict: id`). Trigger server otomatis membuat household personal + membership owner.
- **Sign in with Google**: stub — selalu menolak dengan pesan _"Google sign-in is not available in this build"_.
- **Session restore**: `localStorage['duitbersama_session'] === 'demo'` → demo mode; selain itu cek sesi Supabase.
- **Sign out**: menghapus sesi Supabase, key localStorage (`duitbersama_session`, key `sb-*`/gotrue), dan cookie auth.
- **Onboarding** (`OnboardingScreen`, langkah `decision | create | join | created`):
  - _Personal Finance_ → `createHousehold('single')` langsung ke dashboard.
  - _Shared/Couple_ → form nama pasangan → `createHousehold('couple', partnerName)`.
  - _Join existing_ → input kode 6 karakter (di-uppercase), `joinHouseholdByCode`.
  - _Skip to demo_ → `enterDemo()`.
  - Langkah `created`: menampilkan invite code + tombol copy.
- **Perpindahan circle**: pengguna yang sudah berada di circle (member_count > 1) **wajib leave dulu** sebelum create/join — divalidasi server (`'Keluar dari circle saat ini terlebih dahulu.'`).
- **Data rehoming**: saat join/create, wallet+transaksi, budget, dan goal pengguna dipindah ke household baru; budget duplikat per kategori dihapus (budget circle menang).
- **Leave circle**: anggota solo → household tetap, invite code dirotasi; anggota circle → dibuatkan household personal baru; data mengikuti pengguna.
- **Kapasitas**: hard limit 10 anggota, divalidasi di RPC dan trigger.
- **Error mapping UI**: `'Circle ini sudah mencapai batas maksimal 10 anggota'` → `t('profile.joinFull')`; `'Kode undangan tidak ditemukan…'` → `t('profile.joinNotFound')`.
- **Status header**: `TopBar` menampilkan _Circle Mode_ + nama household bila `members > 1` atau `mode === 'couple'`, selain itu _Single Mode_; circle menampilkan stack avatar (maks. 3 + overflow "+N").
- **Avatar**: action sheet (ganti/lihat) → `AvatarCropSheet` (react-easy-crop) → `uploadAvatarToCloudinary` (public*id `avatar*{userId}\_{ts}`, transform `w_300,h_300,c_fill,g_face,f_auto,q_auto`) → update `profiles.avatar_url`. Ditolak di demo mode.

**Acceptance Criteria**

- [ ] Pengguna baru dapat sign up dan langsung memiliki profil + household personal dengan invite code unik 6 karakter.
- [ ] Login, restore sesi, dan sign out bekerja; refresh halaman mempertahankan sesi live maupun demo.
- [ ] Join dengan kode valid memindahkan pengguna (role `member`) beserta seluruh datanya ke circle; mode household berubah `couple`.
- [ ] Join dengan kode salah menampilkan error terlokalisasi; circle penuh (10) ditolak dengan pesan terlokalisasi.
- [ ] Pengguna di dalam circle tidak dapat create/join circle lain sebelum leave.
- [ ] Leave circle mengembalikan pengguna ke household personal baru dengan data tetap utuh; data circle tidak ikut terbawa.
- [ ] Invite code dapat di-reveal & disalin dari halaman Profile; daftar anggota menampilkan avatar/nama dengan badge `N/10`.
- [ ] Upload avatar (crop → Cloudinary) tersimpan dan tampil di TopBar/daftar anggota.

### 4.2 Multi-Wallet

**Functionality**
CRUD wallet (dompet tunai, bank, e-wallet, joint, custom), tipe wallet sistem + custom, deteksi brand icon otomatis, tampilan detail wallet, **transfer antar-wallet**, dan **top-up**.

**Business Logic & Rules**

- **Tipe wallet**: 4 row sistem (`joint` PiggyBank, `cash` Banknote, `bank` Landmark, `ewallet` Smartphone) + custom per household. ID custom = `slugify(nama)` dengan suffix dedup `_2`, `_3`, dst. Fetch: `household_id.eq.X OR is_system.eq.true`, row sistem tampil lebih dulu.
- **Tambah wallet** (`AddWalletSheet`): nama wajib, tipe wajib, saldo awal opsional (default 0). Saat save, `getSaveTimeWalletIcon(name, type)` menentukan icon brand.
- **Brand icon auto-detect** (`walletIconDetect.ts`): keyword matching terhadap 10 brand Indonesia — Mandiri/Livin, BCA/blu, BNI, BTN, BRI, Jago, GoPay, OVO, DANA, ShopeePay. Icon brand hanya dipaksa bila **nama cocok DAN tipe sesuai** (bank brand ↔ tipe `bank`; ewallet brand ↔ tipe `ewallet`); selain itu null.
- **Wallet details** (`WalletDetailsSheet`): membaca wallet terbaru dari context (saldo live), 3 aksi — Edit, Transfer, Top Up — plus hapus dengan konfirmasi dua langkah.
- **Transfer** (`WalletTransferSheet`): transfer = **sepasang transaksi** kategori `transfer`: expense di wallet sumber (notes default `Transfer ke {tujuan}`) + income di wallet tujuan (notes default `Transfer dari {sumber}`), `spent_by` = nama pengguna, tanggal sama. Picker wallet dikelompokkan per pemilik (Saya dulu, lalu anggota circle) dan mengecualikan wallet yang dipilih di sisi lain; tersedia tombol "Add New Wallet" inline. **Top Up** = transfer dengan wallet tujuan ter-preselect.
- **Validasi transfer**: amount > 0; sumber & tujuan dipilih; sumber ≠ tujuan; saldo sumber ≥ amount (`transfer.insufficientBalance`).
- **Guard hapus**: wallet yang memiliki transaksi ter-link **tidak dapat dihapus** — error _"This wallet has linked transactions. Delete those transactions first."_. Delete tipe wallet ditolak bila masih dipakai wallet; delete kategori ditolak bila masih dipakai transaksi.

**Acceptance Criteria**

- [ ] Wallet baru muncul di Home & picker transaksi dengan saldo awal benar; icon brand muncul otomatis hanya untuk kombinasi nama+tipe yang cocok.
- [ ] Edit wallet (nama/tipe/saldo manual) tersimpan dan ter-rekonsiliasi di seluruh layar.
- [ ] Transfer antar-wallet mengurangi saldo sumber, menambah saldo tujuan, dan menghasilkan 2 transaksi berpasangan berkategori `transfer`.
- [ ] Transfer ke wallet yang sama, tanpa wallet, atau melebihi saldo ditolak dengan pesan error yang tepat.
- [ ] Wallet dengan riwayat transaksi tidak dapat dihapus; wallet tanpa transaksi dapat dihapus dengan konfirmasi.
- [ ] Tipe wallet custom dapat dibuat/dihapus; row sistem tidak dapat dimutasi.

### 4.3 Transactions & Receipt

**Functionality**
Pencatatan pemasukan/pengeluaran (tambah/edit/hapus/detail), filter & pencarian daftar transaksi, dan lampiran foto bukti transaksi (receipt).

**Business Logic & Rules**

- **Add** (`AddTransactionSheet`, FAB global): toggle expense/income; amount (input berformat ribuan); wallet (grid + tombol inline "Add Wallet"; auto-select wallet pertama); kategori (grid ikon, hanya kategori `both` atau sesuai tipe aktif, + inline "Add Category" yang dapat mengunci tipe tx bila kategori baru bertipe eksklusif); tanggal via `CustomDatePicker`; notes opsional; lampiran receipt; badge "Logged by" = nama profil.
- **Rekonsiliasi saldo** (AppContext):
  - add: `balance += amount` (income) / `balance -= amount` (expense).
  - update: hitung `previousEffect` & `nextEffect`; batalkan efek lama di wallet lama, terapkan efek baru di wallet baru (mendukung pindah wallet).
  - delete: balik efek saldo; bila transaksi adalah deposit goal, kurangi `current_amount` goal terkait.
- **Goal-sync**: transaksi dengan notes prefix `'Deposit ke Goal: '` dikenali oleh `goalTitleFromDeposit`; edit/delete transaksi deposit otomatis menyesuaikan `current_amount` goal.
- **Tanggal**: `transaction_date` disimpan `${date}T12:00:00.000Z`; pengurutan `transaction_date desc` lalu `created_at desc`.
- **Edit** (`EditTransactionSheet`) & **Detail** (`TransactionDetailSheet`): seluruh field dapat diubah; detail menampilkan receipt bila ada.
- **Hapus**: modal konfirmasi dua langkah di daftar transaksi.
- **Filter TransactionsScreen**: pencarian (notes/category/spent_by); wallet (hanya wallet yang memiliki transaksi, dikelompokkan _My Wallets_ / _Member Wallets_ dengan badge owner); kategori (hanya yang terpakai, dengan badge tipe); rentang tanggal (preset Today / Last 7 days / This month / Last 30 days + custom range). Hasil dikelompokkan per hari dengan label _Today_/_Yesterday_; pill "Reset filters" muncul saat ada filter aktif.
- **Handoff Home → Transactions**: tap tanggal di kalender Home mengirim `dateFilter` yang dikonsumsi sekali lalu di-reset (`onDateFilterConsumed`).
- **Receipt** (`ReceiptAttachButton` + `receiptUpload.ts`): capture kamera (`capture="environment"`) atau pilih gambar → kompresi `browser-image-compression` (maks 800px, JPEG q0.7) → unsigned upload Cloudinary (`public_id: receipt_{ts}_{rand}`, transform `w_800,f_auto,q_auto`) → thumbnail 64px dengan tombol hapus (X) + preview fullscreen `z-[80]`. Upload gagal → toast error; URL disimpan ke `transactions.receipt_url`.
- **Catatan implementasi (OCR)**: ekstraksi teks otomatis dari struk (OCR) **belum terimplementasi** pada build saat ini — tidak ada dependency OCR (hanya file eksperimen `tmp_ocr_test.mjs` di root). Modul receipt saat ini bersifat _attach, simpan, dan preview_ saja.

**Acceptance Criteria**

- [ ] Transaksi baru tercatat dengan saldo wallet ter-update instan di semua layar.
- [ ] Edit transaksi (termasuk pindah wallet) merekonsiliasi saldo wallet lama dan baru dengan benar.
- [ ] Hapus transaksi membalik efek saldo dan (untuk deposit goal) menurunkan progres goal.
- [ ] Filter search/wallet/kategori/tanggal bekerja independen dan kombinatif; hanya opsi yang relevan (wallet/kategori terpakai) yang ditampilkan.
- [ ] Tap tanggal dari kalender Home membuka tab Transactions terfilter tanggal tersebut.
- [ ] Foto receipt dapat diambil/diunggah, muncul sebagai thumbnail di form & detail, dapat di-preview fullscreen dan dihapus.
- [ ] Semua anggota circle melihat transaksi yang sama dengan atribusi `spent_by` yang benar.

### 4.4 Budgeting & Goals

**Functionality**
Budget bulanan per kategori dengan progres pengeluaran, dan Goal (sinking fund) dengan kalkulasi kontribusi bulanan, dukungan kategori aset investasi, serta deposit dana ke goal.

**Business Logic & Rules**

- **Budget** (`BudgetScreen`):
  - `spentByCategory` = total expense **bulan berjalan** per kategori.
  - Kartu rekap bulanan: Total Budget / Total Spent / Remaining; bila `totalBudget >= 100_000_000` layout beralih vertikal (`isLargeBudget`).
  - Kartu per kategori: `ProgressBar`, persentase spent, sisa (`remaining`) atau kelebihan (`over`) saat melewati limit.
  - Kategori yang dapat di-budget: bertipe `expense`/`both`, belum punya budget, dan **bukan** `salary`.
  - `setBudget`: upsert (update bila kategori sudah ada, insert bila belum); `UNIQUE(household_id, category)` dijaga server.
  - Hapus budget via modal konfirmasi.
- **Goals** (`GoalsSection` + `goalMath.ts`):
  - Form create/edit: judul, target amount, rentang tanggal (mulai default hari ini → target date), kategori aset (6 opsi: Tabungan Biasa, Reksadana, Saham, Deposito, Emas, Lainnya), return rate hanya untuk kategori `isInvestment` (default 5%).
  - **Matematika kontribusi** (`calculateMonthlyContribution`, anuitas future-value):
    - `remaining = target − current`; `remaining ≤ 0` → 0; `months ≤ 1` → `remaining`.
    - `r > 0`: `PMT = (remaining × r) / ((1 + r)^n − 1)` dengan `r` = rate bulanan.
    - `r = 0`: `remaining / n`.
  - `monthsBetween` menghitung bulan kalender utuh (min 1 untuk bulan berjalan); `durationLabel` menampilkan durasi manusiawi.
  - Ringkasan form live: total target, durasi, aset (+return), **tabungan/bulan** (highlight), dan selisih penghematan vs tanpa return untuk aset investasi.
  - `monthly_contribution` disimpan di tabel goal saat save.
  - **Deposit** (`depositToGoal`): validasi amount > 0 dan `wallet.balance ≥ amount`; membuat transaksi **expense** kategori `goals` dengan notes `Deposit ke Goal: {judul}`; mengurangi saldo wallet dan menambah `current_amount`.
  - Kartu goal: progress bar, `current of target` + persen, target date + durasi tersisa, estimasi nabung/bulan, aksi edit/hapus (konfirmasi modal) dan "Add Money".

**Acceptance Criteria**

- [ ] Budget dapat dibuat per kategori expense, satu per kategori per household; progres bulan berjalan terhitung benar termasuk status over-budget.
- [ ] Rekap bulanan menampilkan budget/spent/remaining; layout besar aktif pada total budget ≥ 100 juta.
- [ ] Goal baru menghitung kontribusi bulanan yang benar untuk skenario r = 0 dan r > 0; nilai tersimpan.
- [ ] Deposit goal menolak bila saldo wallet kurang; bila sukses, saldo wallet berkurang, progres goal bertambah, dan muncul transaksi expense kategori `goals`.
- [ ] Edit/delete transaksi deposit menyinkronkan `current_amount` goal.
- [ ] Goal dapat diedit dan dihapus (dengan konfirmasi); semua data goal terlihat oleh seluruh anggota circle.

### 4.5 Settings, Theme & i18n

**Functionality**
Panel pengaturan terpusat untuk tipe wallet, laporan keuangan, kategori, mata uang, tema, dan bahasa; seluruhnya preferensi/entitas per pengguna atau per household sesuai aturannya.

**Business Logic & Rules**

- **Akses**: `SettingsScreen` adalah panel fullscreen slide-in kanan (`z-[55]`) dari Profile, dengan `useBackHandler` untuk tombol back perangkat. Entri: Kelola Tipe Wallet, Laporan Keuangan, Kelola Kategori, Mata Uang (menampilkan kode+simbol aktif), Tema Aplikasi (menampilkan label mode+preset aktif), Bahasa.
- **Mata uang** (`CurrencySettingsSheet`): tersimpan di `profiles.currency` — **per-user, memengaruhi format display saja**, bukan konversi nilai. Seluruh layar membaca `profile?.currency ?? 'IDR'`.
- **Tema** (`ThemeSettingsSheet`): appearance `light/dark/system` + preset `emerald/gold/rose/slate`; persist ke `profiles.color_preset` & `profiles.appearance_mode`; `ThemeProvider` menerapkan atribut `data-mode`/`data-preset` pada `<html>`.
- **Bahasa** (`LanguageSettingsSheet`): `id`/`en`; urutan resolusi `localStorage['pf-language']` → `profiles.language` → default `'id'`; perubahan langsung ditulis ke localStorage dan profil Supabase.
- **Kelola tipe wallet** (`WalletTypeSettingsSheet` + `CreateWalletTypeSheet`): daftar sistem + custom; buat custom (nama + pilihan ikon), hapus custom dengan guard "masih dipakai wallet".
- **Kelola kategori** (`CategorySettingsSheet` + `CreateCategorySheet`): daftar sistem + custom dengan badge tipe; buat custom (nama, tipe expense/income/both, ikon dari 15 opsi), hapus custom dengan guard "masih dipakai transaksi".

**Acceptance Criteria**

- [ ] Panel Settings terbuka dari Profile dan dapat ditutup dengan tombol back perangkat.
- [ ] Perubahan mata uang/tema/bahasa langsung tercermin di seluruh UI dan bertahan setelah reload (persist profil + localStorage).
- [ ] Dua anggota circle dapat memiliki mata uang, tema, dan bahasa berbeda tanpa saling memengaruhi.
- [ ] Tipe wallet/kategori custom dapat dibuat dan dihapus; entitas sistem terkunci; penghapusan entitas yang masih dipakai ditolak dengan pesan jelas.

### 4.6 Export Report

**Functionality**
Ekspor laporan keuangan periode tertentu ke **Excel (.xlsx)** atau **PDF e-statement**, dengan ID laporan unik, label bilingual, dan aksen warna tema pengguna.

**Business Logic & Rules**

- **Entry point**: tombol Export di `TransactionsScreen` dan entri "Laporan Keuangan" di Settings.
- **Periode** (`reportUtils.ts`): preset _This Month_ (awal bulan → hari ini), _Last 30 Days_ (29 hari ke belakang inklusif), atau _Custom_ (validasi: kedua tanggal terisi dan start ≤ end, bila tidak → toast gagal).
- **Preview live**: jumlah transaksi periode + net cashflow berwarna (hijau ≥ 0, merah < 0).
- **Perhitungan** (`computeReportData`): total income, total expense, net cashflow, dan breakdown expense per kategori (porsi % dengan 1 desimal, diurutkan nominal terbesar).
- **Report ID**: `PF-YYYYMMDD-XXXX` (4 karakter acak base36 uppercase), nama file `PairFlow_{reportId}.{xlsx|pdf}`.
- **Excel** (`downloadExcelReport`, xlsx): sheet 1 _Ringkasan_ (judul PairFlow + nama household, periode, total income/expense/net, tabel kategori-amount-persen) dan sheet 2 _Detail Transaksi_ (Date, Type, Category, Wallet, Logged By, Notes, Amount).
- **PDF** (`downloadPDFReport`, @react-pdf/renderer → `EStatementPDFDocument`): header laporan, periode, tanggal cetak, ringkasan, breakdown kategori dengan porsi, tabel detail, disclaimer kerahasiaan; warna aksen mengikuti preset tema (`PRESET_ACCENT`).
- **i18n laporan**: seluruh label mengikuti bahasa aktif dengan fallback tabel label internal (id/en).
- **Performa**: library export di-_lazy import_ (`await import('@/lib/exportReport')`) agar tidak membebani bundle utama; state `downloading` mencegah submit ganda; sukses → toast + sheet tertutup; gagal → toast error.

**Acceptance Criteria**

- [ ] Laporan hanya memuat transaksi dalam rentang terpilih, terurut tanggal menurun.
- [ ] Custom range tanpa tanggal/start > end ditolak dengan toast error.
- [ ] File Excel terunduh dengan 2 sheet dan angka yang konsisten dengan preview.
- [ ] PDF terunduh sebagai e-statement beraksen tema pengguna, bilingual sesuai bahasa aktif.
- [ ] Setiap ekspor mendapat Report ID unik berformat `PF-YYYYMMDD-XXXX`.

---

## 5. User Journey & UI Flow

### 5.1 Journey Pengguna Baru (Live)

```
LoginScreen (Sign up)
  → akun + profil + household personal dibuat otomatis (trigger)
  → OnboardingScreen [decision]
      ├─ Personal Finance ────────────────→ Home (Single Mode)
      ├─ Shared/Couple → isi nama pasangan
      │    → create_household('couple') → [created] tampilkan invite code
      │    → salin kode → bagikan → Home
      ├─ Join existing → input 6 digit kode
      │    → join_household_by_code → rehome data → Home (Circle Mode)
      └─ Skip → demo mode → Home (badge Demo)
```

**Journey anggota yang diundang**: LoginScreen (sign up/login) → Onboarding/Profile → input kode → validasi (kapasitas, belum di circle lain) → bergabung → melihat seluruh data circle secara real-time.

### 5.2 Home Screen

Entry point utama setelah autentikasi. Alur interaksi:

1. **Hero balance card** — total saldo seluruh wallet household; pada circle, dapat digeser untuk melihat saldo per anggota.
2. **My Wallets carousel** — daftar wallet (milik sendiri + anggota circle), geser antar wallet; tap wallet membuka `WalletDetailsSheet` (Edit / Transfer / Top Up / Delete).
3. **Monthly Activity Calendar** ("Aktivitas Bulan Ini") — navigasi bulan; tanggal dengan transaksi mendapat highlight `bg-primary/20` dengan angka `text-primary-dark font-extrabold`; tanggal hari ini ditandai bulatan primary; badge ringkasan nominal per hari; **tap tanggal → pindah ke tab Transactions terfilter tanggal itu** (via `onOpenDate`).
4. **Recent Activity** — transaksi terbaru seluruh anggota (judul, logged by, waktu, nominal) → tap membuka `TransactionDetailSheet`.
5. **FAB "+"** (bottom nav tengah) → `AddTransactionSheet` dari layar mana pun.

### 5.3 Transactions Screen

```
Entry (tab / deep-link tanggal dari Home)
  → [opsional] pasang filter: search, wallet, kategori, rentang tanggal
  → daftar tergrup per hari (Today/Yesterday)
  → tap row        → TransactionDetailSheet (info lengkap + receipt)
  → tap ikon edit  → EditTransactionSheet → save (rekonsiliasi saldo)
  → tap ikon hapus → modal konfirmasi → delete (rekonsiliasi saldo)
  → tombol Export  → ExportReportSheet → unduh Excel/PDF
  → pill Reset     → semua filter kembali default
```

Filter wallet hanya menampilkan wallet yang memiliki transaksi (seksi My Wallets / Member Wallets dengan badge owner); filter kategori hanya menampilkan kategori terpakai dengan badge tipe; filter tanggal menyediakan preset cepat + custom range.

### 5.4 Budget Screen

```
Entry (tab)
  → kartu rekap bulanan (Budget / Spent / Remaining)
  → kartu budget per kategori dengan progress bar
      ├─ tap kategori tanpa budget → sheet set budget (input nominal berformat) → save
      ├─ tap budget ada            → sheet edit → save / hapus (konfirmasi)
  → GoalsSection
      ├─ [+] → Create Goal Sheet: judul, target, rentang tanggal,
      │        kategori aset, return rate (investasi)
      │        → ringkasan live (durasi, tabungan/bulan, selisih return)
      │        → save → goal muncul dengan progress 0%
      ├─ [Add Money] → Deposit Sheet: pilih wallet (dengan saldo) + nominal
      │        → validasi saldo → expense tx 'goals' terbentuk
      │        → saldo wallet turun, progres goal naik
      ├─ [Pencil] → Edit Goal Sheet (prefilled)
      └─ [Trash]  → modal konfirmasi → delete
```

### 5.5 Profile Screen

```
Entry (tab)
  → Avatar: tap → AvatarActionSheet (ganti foto / lihat)
      → ganti → AvatarCropSheet (crop persegi) → upload Cloudinary → avatar baru
  → Nama: edit inline (Enter simpan / Escape batal) → update profiles
  → Status household (Single Mode / Circle Mode + nama)
  → Invite code (circle): reveal + copy; (non-circle): input join code
      → join → error terlokalisasi bila kode salah/circle penuh
  → Daftar anggota: avatar, nama, badge N/10
  → Leave Circle → konfirmasi → household personal baru (data ikut)
  → Settings → panel fullscreen (lihat 5.6)
  → Sign Out → bersihkan sesi → LoginScreen
```

### 5.6 Settings Panel

```
Profile → ikon Settings → panel slide-in kanan (back button menutup)
  ├─ Kelola Tipe Wallet  → daftar sistem+custom → buat/hapus custom
  ├─ Laporan Keuangan    → ExportReportSheet (lihat 4.6)
  ├─ Kelola Kategori     → daftar sistem+custom → buat/hapus custom
  ├─ Mata Uang           → pilih currency → format uang berubah instan
  ├─ Tema Aplikasi       → mode (light/dark/system) + preset warna → apply instan
  └─ Bahasa              → id / en → seluruh UI berganti instan
```

### 5.7 Perilaku Sheet & Navigasi Back

- Seluruh layar sekunder berupa bottom-sheet/modal, bukan route — tab aktif dipersist di `localStorage['activeTab']`.
- Hook **`useBackHandler`**: setiap sheet terbuka mendorong entri `history.pushState`; tombol back perangkat menutup sheet teratas (stack global) alih-alih keluar aplikasi; saat sheet ditutup programatis, entri history dibersihkan dengan mekanisme `skipCount` agar tidak memicu handler ganda.
- Toast global (`ToastContext`) memberi umpan balik sukses/gagal untuk semua aksi (tambah transaksi, transfer, deposit, join circle, export, dsb.).

---

## Lampiran A — Batasan & Gap Implementasi Saat Ini

| Item                     | Status saat ini                                                                                |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| OCR ekstraksi data struk | **Belum terimplementasi** (hanya eksperimen `tmp_ocr_test.mjs`; receipt = attach/preview saja) |
| Google sign-in           | Stub — menolak dengan pesan eksplisit                                                          |
| Real-time subscription   | Belum memakai Supabase Realtime channel; sinkronisasi terjadi saat load/aksi                   |
| Konversi mata uang       | Tidak ada — currency hanya preferensi format per user                                          |
| Router SPA               | Tidak ada — navigasi tab + sheet dengan history polyfill                                       |