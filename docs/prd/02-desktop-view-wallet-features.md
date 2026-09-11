# Product Requirements Document (PRD) — Desktop Wallet Management Workspace

> **Nama Fitur**: Desktop Wallet Management Workspace (Kelola Dompet / Wallet Management)
> **Versi Dokumen**: 1.0
> **Tanggal**: 11 September 2026
> **Status**: Ready for Implementation / Technical Design
> **Target Scope**: PairFlow Desktop View (`viewport >= 1024px`)
> **Referensi Utama**: `docs/prd/00-master-prd.md` & `docs/prd/01-desktop-web-dashboard.md`

---

## 1. Executive Summary & Product Goals

### 1.1 Deskripsi Fitur

**Desktop Wallet Management Workspace** adalah ruang kerja manajemen dompet khusus tampilan desktop yang menghadirkan seluruh kapabilitas pengelolaan dompet versi mobile (Listing, CRUD Wallet, Custom Wallet Types, Transfer, Top Up, dan visibilitas Circle) ke dalam antarmuka _multi-panel desktop-native_.

Fitur ini dirancang murni sebagai _Desktop-Native Workspace_ (bukan antarmuka mobile PWA yang diperbesar), memanfaatkan lebar layar PC/Laptop untuk menyajikan tampilan grid interaktif, panel aksi cepat, serta riwayat transaksi terfilter secara simultan.

### 1.2 Objective & Scope

1. **Desktop-Native Layout**: Menggunakan arsitektur 2-kolom (_Left Panel_: 8 Kolom, _Right Panel_: 4 Kolom) untuk efisiensi ruang layar lebar.
2. **Feature Parity**: Mendukung seluruh fungsionalitas wallet mobile PWA tanpa ada fitur yang hilang:
   - Wallet Listing (Personal & Circle/Spouse Wallets).
   - CRUD Wallet (Create, Read, Update, Delete).
   - Custom Wallet Type Management (Create/Edit/Delete jenis dompet kustom dengan ikon).
   - Quick Actions: Direct Transfer Balance, Top Up, dan Toggle Visibilitas Circle.
3. **Accessibility & Keyboard Navigation**: Mendukung navigasi 2D Arrow Keys, pemicu shortcut keyboard global, dan visual focus state yang jelas (`focus-visible:ring-2`).

---

## 2. Architecture & UI/UX Layout Specification

### 2.1 Layout Overview

Workspace ini ditempatkan pada komponen `src/screens/desktop/DesktopWalletsWorkspace.tsx` dengan struktur pembagian layar berikut:

- **Header Bar Top Navigation**:
  - Judul & Subtitle Ruang Kerja.
  - Search Bar Wallet instan.
  - Action Group: `+ Add New Wallet` (Primary CTA) & `⚙️ Manage Wallet Types` (Secondary CTA).
- **Main Content Area (12-Column Grid, `gap-6`)**:
  - **LEFT PANEL (8 Columns)**: Active Wallets Grid (3-Column Desktop Grid Card).
  - **RIGHT PANEL (4 Columns)**: Selected Wallet Workspace & Quick Actions.

### 2.2 Wireframe ASCII Layout

```text
========================================================================================================================
 HEADER BAR [Desktop Top Navigation & Actions]
 ----------------------------------------------------------------------------------------------------------------------
 [Icon Wallet] Kelola Dompet / Wallet Management                      [ Search Wallet... 🔍 ]  [ + Add New Wallet ]  [ ⚙️ Manage Wallet Types ]
 Subtitle: Atur rekening, e-wallet, dan tipe dompet keluarga Anda
========================================================================================================================

 MAIN CONTENT AREA (Grid 12-Columns, gap-6)
 ----------------------------------------------------------------------------------------------------------------------
 [ LEFT PANEL: WALLET CARDS GRID (Col 1-8) ]                         │ [ RIGHT PANEL: SELECTED WALLET DETAILS (Col 9-12) ]
 ─────────────────────────────────────────────────────────────────── │ ────────────────────────────────────────────────
                                                                     │
 ┌─ SECTION 1: MY PERSONAL WALLETS (DOMPET PRIBADI) ───────────────┐ │ ┌─ SELECTED WALLET CARD OVERVIEW ──────────────────────┐
 │ Filter: [ All Types ▼ ]  [ Active (6) ] [ Hidden (1) ]          │ │ │ [Bank Mandiri Logo]              [ Badge: Joint/Shared ]│
 │                                                                 │ │ │ BANK MANDIRI UTAMA                                   │
 │ ┌───────────────────────┐ ┌───────────────────────┐ ┌─────────┐ │ │ │ Rp 12.450.000                                        │
 │ │ [Mandiri] Bank Utama  │ │ [BCA] Tabungan        │ │ [GoPay] │ │ │ │ No. Rek: 1370012345678 (Owner: Raihan)               │
 │ │ Rp 12.450.000         │ │ Rp 5.200.000          │ │ Rp 350K │ │ │ └──────────────────────────────────────────────────────┘
 │ │ (● Selected State)    │ │ (Hover: [Edit] [Trf]) │ │         │ │
 │ └───────────────────────┘ └───────────────────────┘ └─────────┘ │ ┌─ QUICK ACTIONS BAR (DESKTOP) ────────────────────────┐
 │ ┌───────────────────────┐ ┌───────────────────────┐ ┌─────────┐ │ │ │ [ ✏️ Edit Wallet ]       [ ⇄ Transfer Balance ]       │
 │ │ [Cash] Uang Tunai     │ │ [Bibit] Investasi     │ │ [ + ]   │ │ │ │ [ ➕ Top Up ]            [ 🗑️ Delete Wallet ]        │
 │ │ Rp 850.000            │ │ Rp 18.500.000         │ │ Add New │ │ │ └──────────────────────────────────────────────────────┘
 │ └───────────────────────┘ └───────────────────────┘ └─────────┘ │
 └─────────────────────────────────────────────────────────────────┘ │ ┌─ RECENT TRANSACTIONS (FILTERED TO THIS WALLET) ──────┐
                                                                     │ │ Date       Category        Logged By     Amount      │
 ┌─ SECTION 2: CIRCLE / SPOUSE WALLETS (DOMPET PASANGAN) ──────────┐ │ │ ───────────────────────────────────────────────────  │
 │ Badge: 👥 Household Circle: "Raihan & Alda"                     │ │ │ 12 Sep     Groceries       Alda          -Rp 150.000 │
 │                                                                 │ │ │ 10 Sep     Gaji Utama      Raihan        +Rp 8.500k  │
 │ ┌───────────────────────┐ ┌───────────────────────┐             │ │ │ 08 Sep     Listrik/PLN     Raihan        -Rp 450.000 │
 │ │ [BCA] Alda Payroll    │ │ [OVO] Alda Jajan      │             │ │ │ [ View All Wallet Transactions → ]                   │
 │ │ Rp 8.120.000          │ │ Rp 120.000            │             │ │ └──────────────────────────────────────────────────────┘
 │ │ Owner: Alda Ayu       │ │ Owner: Alda Ayu       │             │ │
 │ └───────────────────────┘ └───────────────────────┘             │ │ ┌─ STATS & VISIBILITY SETTINGS ────────────────────────┐
 └─────────────────────────────────────────────────────────────────┘ │ │ Visibilitas Pasangan:  [ Toggle: Visible to Circle 👁️ ]│
                                                                     │ │ Total Outflow (Bulan ini): Rp 2.450.000               │
                                                                     │ └──────────────────────────────────────────────────────┘
========================================================================================================================

+-------------------------------------------------------------------+
| KELOLA TIPE DOMPET (MANAGE WALLET TYPES)                        X |
+-------------------------------------------------------------------+
| Tambah atau sesuaikan jenis dompet kustom untuk rumah tangga Anda.|
|                                                                   |
| + ADD NEW CUSTOM WALLET TYPE                                      |
| [ Nama Tipe Dompet...     ] [ Pilih Ikon ▼ ] [ + Buat Tipe ]      |
|                                                                   |
| TIPE DOMPET SAAT INI:                                             |
| ┌───────────────────────────────────────────────────────────────┐ |
| │ 🏦 Bank / Rekening Utama               [ System Default ]     │ |
| │ 📱 E-Wallet / Digital Money            [ System Default ]     │ |
| │ 💵 Uang Tunai / Cash                   [ System Default ]     │ |
| │ 📈 Investasi / Saham / Reksadana       [ Custom ] [✏️] [🗑️]   │ |
| │ 🪙 Emas & Tabungan Logam               [ Custom ] [✏️] [🗑️]   │ |
| └───────────────────────────────────────────────────────────────┘ |
+-------------------------------------------------------------------+
```
