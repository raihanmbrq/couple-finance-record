Berikut adalah **Product Requirements Document (PRD)** resmi dan komprehensif untuk perombakan total modul **Import & Export Desktop** pada aplikasi PairFlow.

---

# Product Requirements Document (PRD)

**Project Name:** PairFlow – Desktop Import & Export Center Redesign

**Document Owner:** Product Engineer / Product Manager

**Status:** Draft / Ready for Engineering Review

**Target Platform:** Web Desktop App

---

## 1. Executive Summary & Goals

Modul Import/Export pada tampilan desktop PairFlow saat ini memiliki batasan pada rincian laporan PDF serta kerumitan pada proses impor (terlalu banyak opsi format mutasi bank CSV).

**Tujuan Redesign:**

1. Menyederhanakan alur impor dengan hanya mendukung format baku **Excel (.xlsx)** melalui template dinamis terstandarisasi.
2. Meningkatkan nilai guna laporan **PDF E-Statement** dengan menambahkan seksi ringkasan eksekutif dan analisis transaksi mendalam.
3. Menambahkan fitur **Export PPTX Presentation** untuk membantu pasangan meninjau keuangan bulanan secara visual dan interaktif saat evaluasi keuangan bersama.

---

## 2. User Persona & Use Cases

- **Target User:** Pasangan (Suami/Istri) atau Pengguna Personal yang mengelola keuangan rumah tangga di desktop/laptop.
- **Use Cases Utama:**
- Pengguna ingin mengunduh laporan PDF bulanan yang kaya akan grafik/tabel untuk diarsip atau dicetak.
- Pengguna ingin melakukan presentasi/diskusi bulanan menggunakan PowerPoint (.pptx) tanpa perlu membuat slide secara manual.
- Pengguna ingin mencatat transaksi harian dalam jumlah banyak secara sekaligus via file Excel yang mudah diisi.

---

## 3. Feature Specifications & Requirements

### 3.1. Enhanced PDF E-Statement

Dokumen PDF E-Statement yang di-download harus memuat rincian laporan eksekutif:

1. **Executive Summary Card:**

- Total Inflow, Total Outflow, Net Cashflow, serta perbandingan persentase pengeluaran antar anggota circle (misal: Suami vs Istri).

2. **Top 5 Pengeluaran Berdasarkan Nominal (Amount):**

- Tabel yang memuat 5 transaksi/kategori pengeluaran terbesar beserta porsinya dalam persen terhadap total pengeluaran.

3. **Top 5 Pengeluaran Berdasarkan Frekuensi (Frequency):**

- Tabel yang memuat 5 kategori/merchant dengan frekuensi transaksi terbanyak beserta jumlah kali transaksinya.

4. **Breakdown Kategori & Dompet:**

- Tabel alokasi pengeluaran per kategori (Kebutuhan Dapur, Tagihan, Hiburan) serta rincian saldo akhir tiap dompet (Bank, E-Wallet, Cash).

5. **Highlighted Transactions:**

- Daftar transaksi bernominal besar (di atas ambang batas tertentu, misal: > Rp 500.000).

---

### 3.2. Fitur Export PPTX (PowerPoint Deck)

Menghasilkan slide PowerPoint berbasis tema PairFlow (_Dark Navy_ `#0f172a`, _Emerald Green_ `#10b981`, _Rose_ `#f43f5e`).

**Struktur Slide PPTX:**

- **Slide 1: Title Slide**
- Judul: "PairFlow Household Financial Review", Nama Circle, Periode Laporan, dan Tanggal Generate.

- **Slide 2: Cashflow & Executive Overview**
- Card ringkasan Inflow, Outflow, Net Savings Rate (%), dan grafik perbandingan arus kas harian/mingguan.

- **Slide 3: Expense Analysis & Top Spending**
- Pie Chart kategori pengeluaran terbesar serta Tabel Top 5 Pengeluaran (Nominal & Frekuensi).

- **Slide 4: Budget Status & Wallet Balance**
- Indikator progres anggaran per kategori (Hijau/Kuning/Merah) dan posisi saldo akhir tiap dompet.

- **Slide 5: Savings Goal & Discussion Points**
- Progres _Kantong Impian_ (Sinking Fund) serta _bullet points_ evaluasi keuangan untuk diskusi pasangan.

---

### 3.3. Template Excel Generator & Validation Rules (Import Engine)

Proses **Import** hanya mendukung file `.xlsx` yang di-download melalui template bawaan aplikasi.

#### A. Struktur Kolom Template Excel (`.xlsx`)

File template yang di-download pengguna akan memiliki konfigurasi _Data Validation_ terintegrasi:

| No  | Nama Kolom  | Excel Data Control / Validation    | Mandatory | Keterangan                  |
| --- | ----------- | ---------------------------------- | --------- | --------------------------- |
| 1   | **Tanggal** | Date Picker / Format `YYYY-MM-DD`  | Ya        | Input tanggal transaksi     |
| 2   | **Tipe**    | Dropdown List: `Expense`, `Income` | Ya        | Jenis arus kas              |
| 3   | **Nominal** | Whole Number / Decimal Input (> 0) | Ya        | Nilai transaksi dalam angka |

|
| 4 | **Kategori** | Dynamic Dropdown (Daftar Kategori User) | Ya | Mengambil Kategori aktif

|
| 5 | **Dompet** | Dynamic Dropdown (Daftar Dompet User) | Ya | Mengambil Dompet aktif

|
| 6 | **Oleh** | Dynamic Dropdown (Daftar Anggota Circle) | Ya | Mengambil nama Anggota Circle

|
| 7 | **Catatan** | Free Text String | Tidak | Deskripsi/catatan tambahan

|

#### B. Engine Validation & Fallback Handling

Saat file Excel di-upload ke sistem, parser engine akan menjalankan validasi per baris (`row {i}`):

```text
1. [Tanggal Kosong]
   └─> Set nilai default: Hari Ini (Today's Date).

2. [Tipe Kosong]
   └─> Throw Error: "Kolom tipe pada row {row_number} perlu di-isi."

3. [Tipe Invalid] (Bukan Expense/Income)
   └─> Throw Error: "Kolom tipe pada row {row_number} tidak sesuai, perlu input Expense / Income."

4. [Nominal Invalid] (Bukan Angka Valid)
   └─> Throw Error: "Kolom nominal pada row {row_number} bukan angka valid."

5. [Kategori Kosong]
   └─> Throw Error: "Kolom kategori pada row {row_number} perlu di-isi."

6. [Kategori Tidak Ada di Dropdown]
   └─> Auto-Fallback: Force create Kategori baru secara otomatis menggunakan nama tersebut dengan atribut default.

7. [Dompet Kosong]
   └─> Throw Error: "Kolom dompet pada row {row_number} perlu di-isi."

8. [Dompet Tidak Ada di Dropdown]
   └─> Auto-Fallback: Force create Dompet baru secara otomatis menggunakan nama tersebut dengan atribut default.

9. [Oleh Kosong]
   └─> Throw Error: "Kolom oleh pada row {row_number} perlu di-isi."

10. [Oleh Invalid] (Nama tidak terdaftar di Anggota Circle)
    └─> Throw Error: "Kolom oleh pada row {row_number} tidak sesuai."

```

---

## 4. UI Layout & Wireframe (Desktop View)

Perubahan pada halaman **Impor & Ekspor** desktop menyederhanakan layout menjadi 2 section utama:

```
+---------------------------------------------------------------------------------------+
|  Impor & Ekspor Center                                                                |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|  [ SECTION 1: FINANCIAL EXPORT REPORT CENTER ]                                         |
|  Filter Periode: [ Bulan Ini | Bulan Lalu | Tahun Ini | Custom Date ]                  |
|  -----------------------------------------------------------------------------------  |
|  Ringkasan Periode:                                                                   |
|  Total Inflow: Rp 2.500.000   | Outflow: Rp 340.000   | Net Cashflow: Rp 2.160.000      |
|  -----------------------------------------------------------------------------------  |
|  Aksi Ekspor:                                                                         |
|  [ 🟢 Export Excel (.xlsx) ]   [ 🔵 Download PDF E-Statement ]   [ 🟣 Export PPTX ]   |
|                                                                                       |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|  [ SECTION 2: BULK IMPORT TRANSAKSI VIA EXCEL ]                                       |
|  Import seluruh data transaksi bulanan Anda secara praktis menggunakan template Excel.|
|  -----------------------------------------------------------------------------------  |
|  Langkah 1: Unduh format baku transaksi                                               |
|  [ 📥 Download Template Excel (.xlsx) ]                                                |
|                                                                                       |
|  Langkah 2: Upload file yang telah diisi                                              |
|  [ 📤 Upload & Process File Excel ]                                                   |
|                                                                                       |
+---------------------------------------------------------------------------------------+

```

---

## 5. Non-Functional Requirements (NFR)

1. **Performance:** Ekspor file (PDF, Excel, PPTX) tidak boleh memakan waktu lebih dari 3 detik untuk data hingga 1.000 baris transaksi.
2. **Reliability & Data Integrity:**

- Jika terdapat kesalahan pada satu baris saat _bulk import_ yang menghasilkan _Error_, proses impor dibatalkan (_rollback_) dan sistem menampilkan pesan baris mana yang perlu diperbaiki.
- Kategori/Dompet baru yang dibuat melalui mekanisme _Force Create_ (Aturan 6 & 8) harus langsung disinkronkan secara _real-time_ ke database (Supabase).
