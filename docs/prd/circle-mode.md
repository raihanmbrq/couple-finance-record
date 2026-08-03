# PRD Fitur: Connect Circle / Household Management

## 1. Goal & Context
Memungkinkan pengguna untuk membuat grup/lingkaran keuangan ("Household/Circle") atau bergabung ke dalam circle yang sudah ada menggunakan 6 digit kode unik. Fitur ini memfasilitasi sinkronisasi data transaksi dan anggaran secara real-time di antara anggota circle (hingga maksimal 10 anggota).

## 2. User Story
- **Sebagai pengguna baru**, saya ingin bisa memilih antara membuat Household baru atau langsung mengintegrasikan akun ke Household pasangan/anggota lain menggunakan kode unik 6 digit.
- **Sebagai pembuat Household**, saya ingin mendapatkan kode unik 6 digit pada saat berhasil sign up yang bisa disalin dan dibagikan ke anggota lain.
- **Sebagai anggota yang diundang**, saya ingin memasukkan kode 6 digit agar bisa langsung terhubung dan melihat pencatatan keuangan bersama secara real-time.

## 3. Acceptance Criteria (AC)
- [ ] **Onboarding & State Check**: Pengguna yang belum terhubung ke circle dapat menggunakan aplikasi secara mandiri (Single Mode) atau memilih untuk terhubung ke circle.
- [ ] **Create Circle/Household**:
  - User baru yang sudah terdaftar (sukses sign up) akan langsung mendapatkan kode unik 6 digit pada tabel 'households' dan akan ditampilkan langsung pada halaman Profile
  - Otomatis men-generate **6 digit invite code** alfanumerik (misal: `X7K9P2`) yang unik.
  - Pengguna yang membuat circle otomatis menjadi anggota pertama dengan role `owner` / `member`.
- [ ] **Join Circle/Household**:
  - Input field 6 digit kode unik untuk bergabung.
  - Tombol "Join Circle" memverifikasi validitas kode.
  - Jika kode valid dan kapasitas circle belum penuh (maksimal 10 anggota), pengguna berhasil ditambahkan ke `household_id` terkait.
  - Jika sudah berhasil bergabung atau membuat households, maka keterangan pada header apps berubah dari 'Single Mode' ke 'Circle Mode'
- [ ] **Circle Capacity**: Satu circle/household dibatasi maksimal **10 anggota**.
- [ ] **Member Management & Display**:
  - Menampilkan daftar anggota yang berada di dalam circle beserta nama/email dan avatar.
  - Opsi "Leave Circle" bagi anggota yang ingin keluar dari circle.
  - Fitur ini dibuat pada halaman Profile
- [ ] **Transparacy between Member**:
  - Pada halaman Home, user dapat menggeser Total Balance card untuk melihat Total Balance dari setiap member yang tergabung kedalam Household.
  - Pada halaman Home, user dapat menggeser My Wallets card section untuk melihat Wallets dari tiap member household.
  - Recent Activity pada halaman Home menampilkan transaksi yang dilakukan oleh setiap member, dengan detail Judul Transaksi, Logged by, Waktu transaksi, dan nominal transaksi. Sama seperti yang sudah di implementasi saat ini
  - List Trasactions pada halaman Transactions menampilkan transaksi yang dilakukan oleh setiap member
  
## 4. Technical Specifications & Data Flow

### Database Schema (Supabase / PostgreSQL)
1. **Tabel `households`**:
   - `id`: `uuid` (Primary Key, default: `gen_random_uuid()`)
   - `name`: `text` (misal: "Keluarga Raihan")
   - `invite_code`: `text` (UNIQUE, 6 digit string)
   - `created_at`: `timestamptz`
   - 'mode': 'text' (single / circle)
   - partner_name: 'text'  (pick owner households)

2. **Tabel `household_members`**:
   - `id`: `uuid` (Primary Key, references `auth.users`)
   - `user_id`: `uuid` (Foreign Key -> `profiles.id`)
   - `household_id`: `uuid` (Foreign Key -> `households.id`, nullable)
   - `role`: `text` (`owner` / `member`)

### Inner Join & Relationship Rule
- Setiap query aksi transaksi/data antar tabel harus menyertakan `INNER JOIN` ke `profiles` dengan `user_id` dan `household_id` agar isolasi data antar circle tetap bersih dan aman.

### Keamanan
- Pengguna hanya bisa melihat/membaca data transaksi & budget jika `household_id` milik pengguna sama dengan `household_id` pada record data tersebut.

## 5. Edge Cases & Error Handling
- **Kode Tidak Ditemukan**: Jika pengguna memasukkan kode 6 digit yang tidak valid/salah, tampilkan error toast: *"Kode undangan tidak ditemukan. Periksa kembali 6 digit kode Anda."*
- **Circle Penuh**: Jika circle sudah mencapai 10 anggota, tampilkan error toast: *"Circle ini sudah mencapai batas maksimal 10 anggota."* 
- **Pengguna Sudah Terhubung**: Pengguna yang sudah memiliki `household_id` aktif tidak bisa membuat atau bergabung ke circle lain sebelum keluar (*leave*) dari circle saat ini.
- **Koneksi Terputus**: Berikan indikator *loading* saat memverifikasi kode dan tampilkan notifikasi jika permintaan gagal karena masalah jaringan.