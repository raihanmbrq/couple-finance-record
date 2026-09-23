import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '@/context/AppContext';
import { downloadExcelTemplate } from '@/lib/exportReport';
import type { BulkImportRow } from '@/lib/types';
import { AlertCircle, Check, FileSpreadsheet, Upload, X } from 'lucide-react';

interface StatementUploaderModalProps { open: boolean; onClose: () => void; }
interface ImportRow extends BulkImportRow { rowNumber: number; }
const HEADERS = ['Tanggal', 'Tipe', 'Nominal', 'Kategori', 'Dompet', 'Oleh', 'Catatan'];
const todayKey = () => new Date().toISOString().slice(0, 10);
const text = (value: unknown) => String(value ?? '').trim();

function parseDate(value: unknown) {
  if (value === null || value === undefined || value === '') return todayKey();
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
  }
  const raw = text(value);
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? raw : parsed.toISOString().slice(0, 10);
}

export const StatementUploaderModal: React.FC<StatementUploaderModalProps> = ({ open, onClose }) => {
  const { wallets, categories, householdMembers, household, bulkImportTransactions } = useApp();
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const memberNames = useMemo(() => householdMembers.map((member) => member.profile?.full_name || member.user_id), [householdMembers]);
  if (!open) return null;

  const reset = () => { setFileName(''); setRows([]); setErrors([]); setMessage(null); };
  const close = () => { reset(); onClose(); };
  const handleTemplate = () => downloadExcelTemplate({ householdName: household?.name, categories: categories.map((category) => category.name), wallets: wallets.map((wallet) => wallet.name), members: memberNames });

  const parseFile = async (file: File) => {
    setFileName(file.name); setErrors([]); setMessage(null);
    if (!file.name.toLowerCase().endsWith('.xlsx')) { setErrors(['File import harus berformat .xlsx.']); return; }
    const workbook = XLSX.read(await file.arrayBuffer(), { cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
    const header = (data[0] ?? []).map(text);
    const missingHeaders = HEADERS.filter((expected) => !header.includes(expected));
    if (missingHeaders.length > 0) { setErrors([`Template tidak sesuai. Kolom wajib hilang: ${missingHeaders.join(', ')}.`]); return; }
    const indexes = Object.fromEntries(HEADERS.map((name) => [name, header.indexOf(name)]));
    const nextRows: ImportRow[] = []; const nextErrors: string[] = [];
    data.slice(1).forEach((rawRow, index) => {
      const rowNumber = index + 2; const row = rawRow as unknown[];
      if (row.every((value) => text(value) === '')) return;
      const rawType = text(row[indexes.Tipe]); const category = text(row[indexes.Kategori]); const wallet = text(row[indexes.Dompet]); const spentBy = text(row[indexes.Oleh]);
      const rawAmount = row[indexes.Nominal]; const amount = typeof rawAmount === 'number' ? rawAmount : Number(text(rawAmount).replace(/[^0-9.-]/g, ''));
      if (!rawType) nextErrors.push(`Kolom tipe pada row ${rowNumber} perlu di-isi.`); else if (rawType !== 'Expense' && rawType !== 'Income') nextErrors.push(`Kolom tipe pada row ${rowNumber} tidak sesuai, perlu input Expense / Income.`);
      if (!Number.isFinite(amount) || amount <= 0) nextErrors.push(`Kolom nominal pada row ${rowNumber} bukan angka valid.`);
      if (!category) nextErrors.push(`Kolom kategori pada row ${rowNumber} perlu di-isi.`);
      if (!wallet) nextErrors.push(`Kolom dompet pada row ${rowNumber} perlu di-isi.`);
      if (!spentBy) nextErrors.push(`Kolom oleh pada row ${rowNumber} perlu di-isi.`); else if (!memberNames.includes(spentBy)) nextErrors.push(`Kolom oleh pada row ${rowNumber} tidak sesuai.`);
      nextRows.push({ date: parseDate(row[indexes.Tanggal]), type: rawType === 'Income' ? 'income' : 'expense', amount, category, wallet, spentBy, notes: text(row[indexes.Catatan]), rowNumber });
    });
    setRows(nextRows); setErrors(nextErrors); setMessage(nextErrors.length === 0 ? `${nextRows.length} baris siap diproses.` : `${nextErrors.length} kesalahan validasi ditemukan.`);
  };

  const handleImport = async () => {
    if (errors.length > 0 || rows.length === 0) return;
    setIsImporting(true);
    try {
      await bulkImportTransactions(rows.map((row) => ({ date: row.date, type: row.type, amount: row.amount, category: row.category, wallet: row.wallet, spentBy: row.spentBy, notes: row.notes })));
      setMessage(`${rows.length} transaksi berhasil diimpor.`); setTimeout(close, 900);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Import gagal diproses.'); } finally { setIsImporting(false); }
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
    <div data-testid="statement-uploader-modal" className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
      <div className="flex h-14 items-center justify-between border-b border-border px-6"><div className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5 text-accent" /><h2 className="text-base font-bold text-text-primary">Import Transaksi Excel</h2></div><button onClick={close} className="rounded-lg p-1.5 text-text-muted" aria-label="Tutup"><X className="h-4 w-4" /></button></div>
      <div className="flex-1 space-y-5 overflow-y-auto p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-hover/40 p-4"><div><p className="text-sm font-bold text-text-primary">Template baku PairFlow</p><p className="text-xs text-text-muted">Gunakan file .xlsx dengan dropdown kategori, dompet, dan anggota circle.</p></div><button onClick={handleTemplate} data-testid="download-import-template-btn" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white"><FileSpreadsheet className="h-4 w-4" />Download Template</button></div>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-surface-hover/20 p-8 text-center hover:border-accent"><Upload className="h-6 w-6 text-accent" /><span className="text-sm font-bold text-text-primary">Pilih atau tarik file Excel (.xlsx)</span><span className="text-xs text-text-muted">{fileName || 'Belum ada file dipilih'}</span><input type="file" accept=".xlsx" className="hidden" data-testid="import-xlsx-file-input" onChange={(event) => { const file = event.target.files?.[0]; if (file) void parseFile(file); }} /></label>
        {message && <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-hover p-3 text-xs text-text-primary"><Check className="h-4 w-4 text-emerald-500" />{message}</div>}
        {errors.length > 0 && <div className="space-y-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"><div className="flex items-center gap-2 font-bold"><AlertCircle className="h-4 w-4" />Perbaiki validasi sebelum impor</div>{errors.map((error) => <p key={error}>{error}</p>)}</div>}
        {rows.length > 0 && <div className="overflow-x-auto rounded-xl border border-border"><table className="min-w-[760px] w-full text-left text-xs"><thead className="bg-surface-hover"><tr><th className="p-2">Row</th><th className="p-2">Tanggal</th><th className="p-2">Tipe</th><th className="p-2">Nominal</th><th className="p-2">Kategori</th><th className="p-2">Dompet</th><th className="p-2">Oleh</th><th className="p-2">Catatan</th></tr></thead><tbody>{rows.slice(0, 8).map((row) => <tr key={row.rowNumber} className="border-t border-border"><td className="p-2">{row.rowNumber}</td><td className="p-2 whitespace-nowrap">{row.date}</td><td className="p-2">{row.type}</td><td className="p-2 whitespace-nowrap">{row.amount}</td><td className="p-2">{row.category}</td><td className="p-2">{row.wallet}</td><td className="p-2">{row.spentBy}</td><td className="max-w-48 p-2 truncate" title={row.notes}>{row.notes || '-'}</td></tr>)}</tbody></table></div>}
      </div>
      <div className="flex justify-end gap-3 border-t border-border px-6 py-4"><button onClick={close} className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-text-muted">Batal</button><button onClick={() => void handleImport()} disabled={isImporting || rows.length === 0 || errors.length > 0} data-testid="process-xlsx-import-btn" className="rounded-xl bg-accent px-4 py-2 text-xs font-bold text-accent-text disabled:cursor-not-allowed disabled:opacity-50">{isImporting ? 'Memproses...' : 'Proses Impor'}</button></div>
    </div>
  </div>;
};
