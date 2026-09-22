# Product Requirements Document (PRD) — Web Dashboard (Desktop View)

> **Nama Produk**: PairFlow (Desktop Web Dashboard)
> **Versi Dokumen**: 1.0 (As-Implemented)
> **Tanggal**: 9 September 2026
> **Status**: Dokumen Spesifikasi Retrospektif
> **Referensi Utama**: `docs/prd/00-master-prd.md` (PWA Core)

---

## 1. Executive Summary & Architecture Overview

### 1.1 Deskripsi Produk

**PairFlow Desktop Web Dashboard** adalah ekstensi antarmuka berbasis desktop dari PWA PairFlow. Dashboard ini dirancang khusus untuk layar laptop/PC yang luas guna menyajikan visualisasi data keuangan rumah tangga yang lebih mendalam, alat analisis yang kaya (_deep analytics_), _data grid_ berkerapatan tinggi, serta alat simulator keuangan yang tidak muat dalam tampilan mobile PWA.

### 1.2 Prinsip Arsitektur: Single Codebase (Shared Engine)

- **Codebase & Backend Tunggal**: Berjalan di dalam repositori React 18 + Vite + Tailwind CSS yang sama dengan PWA. Terhubung 100% ke database PostgreSQL Supabase yang sama.
- **Viewport-Based Routing (Entry Point)**:
  - Layar $\ge 1024\text{px}$: Merender `<DesktopDashboardLayout/>`.
  - Layar $< 1024\text{px}$: Merender `<MobilePwaLayout/>`.
- **Design Tokens & Theme Synchronization**: Menggunakan CSS variables (`--bg-app`, `--bg-card`, `--color-primary`, `--border-border`, dll.) yang terpetakan di `tailwind.config.js`. Mendukung Light/Dark Mode serta 4 Preset Warna (Emerald, Amber Gold, Rose, Slate).
- **Automation Testing Ready**: Seluruh komponen interaktif dilengkapi atribut `data-testid` untuk pengujian otomatis (Playwright/Selenium).

---

## 2. Navigasi & Shell Desktop Layout

### 2.1 Sidebar Navigasi Collapsible (Left Sidebar)

- **Komponen**: Collapsible Left Navigation Bar.
- **Menu Items**:
  1. `Dashboard` (`data-testid="sidebar-link-dashboard"`)
  2. `Analytics` (`data-testid="sidebar-link-analytics"`)
  3. `Transactions` (`data-testid="sidebar-link-transactions"`)
  4. `Budgets & Goals` (`data-testid="sidebar-link-budgets"`)
  5. `Import & Export` (`data-testid="sidebar-link-import-export"`)
  6. `Circle Members` (`data-testid="sidebar-link-circle"`)
  7. `Settings` (Akses Slide-in Sub-panel / Modal)

### 2.2 Top Header Bar

- **Global Household Indicator**: Menampilkan nama _Circle_ aktif dan stack avatar anggota.
- **Privacy Toggle**: Tombol Mata/Eye Toggle (`data-testid="global-privacy-toggle"`) untuk menyembunyikan/menampilkan angka saldo (`Rp ••••••••`) dengan persistensi `localStorage`.
- **Quick Action Button**: `+ Add Transaction` (`data-testid="add-transaction-btn"`) memicu Bottom Sheet / Modal Tambah Transaksi.
- **Profile Dropdown**: Menu profil user (Avatar, Nama, Email, Bahasa, Tema, Sign Out).

---

## 3. Fitur & Modul Utama Dashboard Desktop

### 3.1 Overview / Dashboard Screen (`/dashboard`)

#### A. Global Quick Date Filter Header

- **Functionality**: Menyediakan dropdown/pill filter tanggal global di bagian atas Overview.
- **Rules**: Opsi _This Month_ (default), _Last 30 Days_, _This Year_, dan _Custom Date Range_.
- **Behavior**: Perubahan filter secara dinamis memperbarui kalkulasi pada Metric Cards, Cashflow Trend, dan Category Allocation.

#### B. Ringkasan Metric Cards

- Menyajikan 4 Kartu Ringkasan Keuangan Utama:
  1. **Total Net Balance**: Akumulasi seluruh wallet terikat `household_id`.
  2. **Total Income**: Pemasukan pada periode terpilih.
  3. **Total Expenses**: Pengeluaran pada periode terpilih.
  4. **Net Cashflow**: Selisih bersih (`Income - Expenses`).

#### C. Financial Health & Spending Anomaly Alert Banner

- **Functionality**: Widget Banner Otomatis (`data-testid="spending-anomaly-banner"`).
- **Business Logic**:
  - Menghitung lonjakan pengeluaran kategori bulan berjalan vs bulan sebelumnya.
  - Peringatan Spike: _"⚠️ Pengeluaran Kebutuhan Dapur naik 35% dari bulan lalu"_.
  - Informasional Positif: _"💡 Net Cashflow kamu positif! Tersedia Rp X untuk dialokasikan ke Financial Goals"_.

#### D. Member Breakdown Side-Card ("Siapa Belanja Apa?")

- **Functionality**: Widget kontribusi harian antar anggota circle (`data-testid="member-breakdown-card-{id}"`).
- **Details**: Total nominal yang diinput oleh masing-masing anggota (`spent_by`), kategori belanja terbesar per anggota, serta progress bar rasio pengeluaran pasangan.

---

### 3.2 Interactive Analytics Screen (`/analytics`)

#### A. Cashflow Trend Chart (Area / Line Chart)

- Visualisasi perbandingan _Income vs Expense trajectory_ berbasis waktu.
- Ditempatkan berdampingan dengan _Monthly Health Summary Card_ untuk optimasi _grid layout_.

#### B. Aktivitas Bulan Ini (Daily Activity Calendar)

- Kalender aktivitas bulanan lengkap dengan indikator badge total pengeluaran per hari (`-120RB`, `-1.5JT`).
- **Custom Month & Year Selector**: Dilengkapi navigasi panah kiri/kanan dan _popover month picker_ (`data-testid="month-selector-prev/next"`) untuk lompat antar bulan tanpa terikat bulan berjalan.

#### C. Top 5 Spending / Highest Expenses Breakdown Widget

- Widget daftar 5 transaksi tunggal terbesar dalam periode aktif (`data-testid="top-expense-item-{id}"`).
- Menampilkan nominal, tanggal, ikon kategori, dan avatar anggota pencatat (`spent_by`).

---

### 3.3 Advanced Transactions Data Grid (`/transactions`)

#### A. Layout & Density

- Tabel data rapat (_dense view_) yang menampilkan: Date, Category Badge, Wallet, Logged By (`spent_by`), Notes, Receipt Indicator, Amount, dan Actions.
- **Table Density Toggle**: Tombol pemilih moda tampilan (_Compact_ vs _Comfortable_).

#### B. Visual Category Badging & Receipt Preview

- **Category Badge**: Menggunakan background warna pastel lembut sesuai ikon kategori.
- **Receipt Column**:
  - Jika `receipt_url` ada: Menampilkan thumbnail foto 28x28px dengan efek _hover-zoom preview_ / modal gambar.
  - Jika null: Badge "No Receipt" berwarna gray.

#### C. Search & Multi-Select Filters

- Multi-column sorting (Date, Amount, Category).
- Search Bar real-time (mencari notes, nama kategori, dan nama pencatat).
- Combo Filter: Wallet Multi-select, Category Multi-select, Member Multi-select (`spent_by`), dan Date Range Picker.

---

### 3.4 Budgets Workspace & Goals Annuity Simulator (`/budgets`)

#### A. Monthly Category Budgeting

- Tracking limit anggaran bulanan per kategori expense dengan progress bar.
- Status visual: Normal (Hijau/Biru), Warning (>75%), Over-budget (Merah).

#### B. Financial Goals Annuity Simulator

- **Simulator Anuitas**:
  - Input: Target Amount, Target Date, Asset Class (Tabungan, Reksadana, Saham, Deposito, Emas), dan Expected Annual Return Rate ($r\%$).
  - Perhitungan Otomatis: Menghitung estimasi tabungan bulanan yang dibutuhkan.
  - Perbandingan Skenario: Menampilkan perbandingan nominal nabung/bulan antara skenario investasi compounding ($r > 0$) vs tabungan konvensional ($r = 0$).
  - **Kontrol input custom (bukan kontrol native browser)**:
    - Target Amount & Initial Accumulated memakai `MoneyInput` — input teks dengan thousand separator live (locale mengikuti currency profil), leading 0 ditolak, nilai dibaca via `parseMoneyInput` (tanpa spinner `input[type=number]`).
    - Target Completion Date memakai `CustomDatePicker variant="floating"` (kalender bertema aplikasi, `minDate` = hari ini).
    - Asset Class / Vehicle memakai `CustomDesktopDropdown floating` dengan opsi `ASSET_CATEGORIES` yang sama dengan form Create Goal (bukan `<select>` native), plus hint apakah kendaraan tersebut produk investasi.
    - Expected Annual Return memakai input teks dengan suffix `%`; sanitasi digit + maksimal satu pemisah desimal (`,` atau `.`).

#### C. Floating Popover Pattern (Desktop)

- Overlay input di dalam dialog desktop — kalender tanggal, Asset Category, Source Wallet (Deposit to Goal), dan kategori (Set Category Budget) — dirender lewat portal `FloatingPanel` (`createPortal` ke `document.body`, `position: fixed`) yang di-anchor ke elemen trigger, bukan lagi panel in-flow/absolute.
- **Efek yang diharapkan**: membuka kalender atau dropdown **tidak menambah tinggi dan tidak memicu scroll** pada modal; panel flip ke atas saat ruang bawah sempit, di-clamp ke viewport, dan ikut mengikuti trigger ketika modal/page di-scroll.
- Tutup otomatis saat klik di luar panel atau `Esc` (tanpa menutup dialog induk); kalender memakai focus trap bertingkat (`useFocusTrap`) sehingga navigasi Tab tetap berada di dalam popover, lalu kembali ke dialog setelah ditutup.

---

### 3.5 Bulk Actions, Import & Export Center (`/import-export`)

#### A. CSV / Bank Statement Importer

- **Drag-and-Drop Uploader**: Mendukung mutasi bank BCA, Mandiri, BSI, GoPay, dll.
- **Column Mapping Preview**: Interface untuk memetakan kolom file CSV (Date, Amount, Category, Wallet, Notes) sebelum mengeksekusi _batch insert_ ke Supabase `transactions`.

#### B. Export Report Center

- **Live Preview**: Pratinjau _Net Cashflow_ dan ringkasan sebelum diunduh.
- **Export Excel (.xlsx)**: Sheet 1 (Ringkasan) dan Sheet 2 (Detail Transaksi).
- **Export PDF E-Statement**: Format laporan perbankan resmi beraksen warna tema aktif, mendukung bilingual (ID/EN), dan dilengkapi Report ID unik (`PF-YYYYMMDD-XXXX`).

---

### 3.6 Desktop Command Palette (`Ctrl + K` / `Cmd + K`)

- **Functionality**: Overlay _quick action_ pintasan keyboard global (`data-testid="command-palette-input"`).
- **Pintasan Akses**:
  - Pencarian transaksi instan.
  - Navigasi cepat antar halaman (Dashboard, Analytics, Data Grid, Budgets, Import/Export).
  - Pemicu aksi `+ Add Transaction` dan `Export Report`.

---

## 4. Matriks Atribut Automation Testing (`data-testid`)

Untuk mendukung _automated E2E testing_, seluruh komponen desktop utama telah mengimplementasikan atribut lokasi berikut:

| Modul / Komponen | Elemen UI             | Atribut `data-testid`                                                               |
| :--------------- | :-------------------- | :---------------------------------------------------------------------------------- |
| **Sidebar**      | Navigasi Menu         | `sidebar-link-{dashboard\|analytics\|transactions\|budgets\|import-export\|circle}` |
| **Header**       | Filter Tanggal Global | `global-date-filter`                                                                |
| **Header**       | Privacy Toggle        | `global-privacy-toggle`                                                             |
| **Overview**     | Anomaly Banner        | `spending-anomaly-banner`                                                           |
| **Overview**     | Card Anggota Circle   | `member-breakdown-card-{memberId}`                                                  |
| **Analytics**    | Panah Selector Bulan  | `month-selector-prev`, `month-selector-next`                                        |
| **Analytics**    | Item Top 5 Expense    | `top-expense-item-{txId}`                                                           |
| **Transactions** | Data Grid Row         | `transaction-row-{txId}`                                                            |
| **Transactions** | Thumbnail Struk       | `receipt-thumbnail-{txId}`                                                          |
| **Budgets & Goals** | Input Amount Simulator | `simulator-target-amount`, `simulator-current-amount`                            |
| **Budgets & Goals** | Trigger Tanggal Target Simulator | `simulator-target-date`                                                 |
| **Budgets & Goals** | Dropdown Asset Class Simulator | `simulator-asset-class` (+ `simulator-asset-class-listbox`)              |
| **Global (Desktop)** | Popover Kalender Floating | `date-picker-floating`, `date-picker-grid`, `date-picker-day-{YYYY-MM-DD}`     |
| **Global**       | Command Palette Input | `command-palette-input`                                                             |

---

## 5. Penerimaan System & Verifikasi (Acceptance Criteria)

1. **Responsive Viewport Routing**:
   - Membuka halaman di resolusi $\ge 1024\text{px}$ secara otomatis menampilkan Sidebar & Layout Desktop.
   - Mengubah ukuran layar ke $< 1024\text{px}$ mengembalikan tampilan ke PWA Mobile Bottom Navigation tanpa kehilangan _state_.
2. **Sinkronisasi Data Real-Time**:
   - Transaksi yang ditambahkan via Desktop View langsung memperbarui saldo wallet, chart analytics, dan kalender harian.
   - Aturan isolasi data Supabase RLS bekerja penuh (data dibatasi sesuai `household_id` pengguna).
3. **Integritas Tema & Styling**:
   - Perubahan preset warna (Emerald, Gold, Rose, Slate) dan Mode (Light/Dark) di menu Settings langsung tercermin di seluruh token CSS shell desktop (`bg-app`, `bg-card`, `border-border`, dll).
