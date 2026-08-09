import * as XLSX from 'xlsx';
import { pdf } from '@react-pdf/renderer';
import type { Transaction, Wallet } from '@/lib/types';
import { EStatementPDFDocument, PRESET_ACCENT } from '@/components/EStatementPDFDocument';
import type { ReportTxRow } from '@/components/EStatementPDFDocument';
import { formatDateShort, formatMoney } from '@/lib/format';
import { getCategory } from '@/lib/types';
import {
  filterTransactionsByRange,
  computeReportData,
  generateReportId,
  type ReportRange,
  type ReportFormat,
  type ReportData,
} from '@/lib/reportUtils';

export type { ReportRange, ReportFormat, ReportData };
export { filterTransactionsByRange, computeReportData, generateReportId };

export interface ReportOptions {
  reportId: string;
  transactions: Transaction[];
  wallets: Wallet[];
  categories: { id: string; name: string }[];
  range: ReportRange;
  format: ReportFormat;
  currency: string;
  householdName: string;
  language: 'id' | 'en';
  accent?: string;
  labels: Record<string, string>;
}

const LABELS_TABLE: Record<'id' | 'en', Record<string, string>> = {
  id: {
    summarySheet: 'Ringkasan', detailSheet: 'Detail Transaksi',
    totalIncome: 'Total Pemasukan', totalExpense: 'Total Pengeluaran', netCashflow: 'Arus Kas / Net Balance',
    category: 'Kategori', percentage: 'Persentase', amount: 'Nominal',
    date: 'Tanggal', type: 'Tipe', typeIncome: 'Pemasukan', typeExpense: 'Pengeluaran',
    wallet: 'Wallet', loggedBy: 'Diinput Oleh', notes: 'Catatan',
    reportId: 'ID Laporan', period: 'Periode', printedAt: 'Tanggal Cetak',
    disclaimer: 'Dokumen ini bersifat rahasia dan hanya untuk penggunaan internal. Mohon tidak menyebarluaskan tanpa izin.',
    categoryBreakdown: 'Rincian Pengeluaran per Kategori', transactionDetails: 'Detail Transaksi',
    share: 'Porsi', formatCurrency: 'Mata Uang', noTransactions: 'Tidak ada transaksi pada periode ini',
  },
  en: {
    summarySheet: 'Summary', detailSheet: 'Transaction Details',
    totalIncome: 'Total Income', totalExpense: 'Total Expense', netCashflow: 'Net Cashflow',
    category: 'Category', percentage: 'Percentage', amount: 'Amount',
    date: 'Date', type: 'Type', typeIncome: 'Income', typeExpense: 'Expense',
    wallet: 'Wallet', loggedBy: 'Logged By', notes: 'Notes',
    reportId: 'Report ID', period: 'Period', printedAt: 'Printed At',
    disclaimer: 'This document is confidential and for internal use only. Please do not distribute without permission.',
    categoryBreakdown: 'Expense Breakdown by Category', transactionDetails: 'Transaction Details',
    share: 'Share', formatCurrency: 'Currency', noTransactions: 'No transactions in this period',
  },
};

function resolveLabel(labels: Record<string, string>, lang: 'id' | 'en', key: string): string {
  return labels[key] ?? LABELS_TABLE[lang][key] ?? key;
}

function reportFileBase(reportId: string): string {
  return `PairFlow_${reportId}`;
}

function triggerDownload(url: string, filename: string) {
  const a = window.document.createElement('a');
  a.href = url;
  a.download = filename;
  window.document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getCatName(categories: { id: string; name: string }[], id: string): string {
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  return catMap.get(id) ?? getCategory(id)?.label ?? id;
}

export function downloadExcelReport(options: ReportOptions) {
  const { transactions, wallets, categories, range, language, householdName, labels } = options;
  const { rows, totalIncome, totalExpense, netCashflow, categoryBreakdown } = computeReportData(
    filterTransactionsByRange(transactions, range)
  );

  const L = {
    summarySheet: resolveLabel(labels, language, 'summarySheet'),
    detailSheet: resolveLabel(labels, language, 'detailSheet'),
    totalIncome: resolveLabel(labels, language, 'totalIncome'),
    totalExpense: resolveLabel(labels, language, 'totalExpense'),
    netCashflow: resolveLabel(labels, language, 'netCashflow'),
    category: resolveLabel(labels, language, 'category'),
    percentage: resolveLabel(labels, language, 'percentage'),
    amount: resolveLabel(labels, language, 'amount'),
    date: resolveLabel(labels, language, 'date'),
    type: resolveLabel(labels, language, 'type'),
    typeIncome: resolveLabel(labels, language, 'typeIncome'),
    typeExpense: resolveLabel(labels, language, 'typeExpense'),
    wallet: resolveLabel(labels, language, 'wallet'),
    loggedBy: resolveLabel(labels, language, 'loggedBy'),
    notes: resolveLabel(labels, language, 'notes'),
  };

  const walletMap = new Map(wallets.map((w) => [w.id, w.name]));
  const catName = (id: string) => getCatName(categories, id);

  const summaryRows: (string | number)[][] = [
    ['PairFlow', householdName],
    [L.summarySheet, `${range.start} s/d ${range.end}`],
    [],
    [L.totalIncome, totalIncome],
    [L.totalExpense, totalExpense],
    [L.netCashflow, netCashflow],
    [],
    [L.category, L.amount, L.percentage],
    ...categoryBreakdown.map((row) => [row.category, row.total, `${row.percentage}%`]),
  ];

  const detailRows: (string | number)[][] = [
    [L.date, L.type, L.category, L.wallet, L.loggedBy, L.notes, L.amount],
    ...rows.map((tx) => [
      formatDateShort(tx.transaction_date || tx.created_at),
      tx.type === 'income' ? L.typeIncome : L.typeExpense,
      catName(tx.category),
      walletMap.get(tx.wallet_id) ?? '—',
      tx.spent_by,
      tx.notes ?? '',
      tx.amount,
    ]),
  ];

  const wb = XLSX.utils.book_new();
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 26 }, { wch: 20 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, L.summarySheet.slice(0, 31));

  const wsDetail = XLSX.utils.aoa_to_sheet(detailRows);
  wsDetail['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 22 }, { wch: 18 }, { wch: 32 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, wsDetail, L.detailSheet.slice(0, 31));

  XLSX.writeFile(wb, `${reportFileBase(options.reportId)}.xlsx`);
}

export async function downloadPDFReport(options: ReportOptions) {
  const { transactions, wallets, categories, range, currency, language, householdName, accent, labels } = options;
  const { rows, totalIncome, totalExpense, netCashflow, categoryBreakdown } = computeReportData(
    filterTransactionsByRange(transactions, range)
  );

  const L = {
    totalIncome: resolveLabel(labels, language, 'totalIncome'),
    totalExpense: resolveLabel(labels, language, 'totalExpense'),
    netCashflow: resolveLabel(labels, language, 'netCashflow'),
    categoryBreakdown: resolveLabel(labels, language, 'categoryBreakdown'),
    transactionDetails: resolveLabel(labels, language, 'transactionDetails'),
    category: resolveLabel(labels, language, 'category'),
    share: resolveLabel(labels, language, 'share'),
    amount: resolveLabel(labels, language, 'amount'),
    date: resolveLabel(labels, language, 'date'),
    type: resolveLabel(labels, language, 'type'),
    typeIncome: resolveLabel(labels, language, 'typeIncome'),
    typeExpense: resolveLabel(labels, language, 'typeExpense'),
    wallet: resolveLabel(labels, language, 'wallet'),
    loggedBy: resolveLabel(labels, language, 'loggedBy'),
    notes: resolveLabel(labels, language, 'notes'),
    reportId: resolveLabel(labels, language, 'reportId'),
    period: resolveLabel(labels, language, 'period'),
    printedAt: resolveLabel(labels, language, 'printedAt'),
    disclaimer: resolveLabel(labels, language, 'disclaimer'),
    formatCurrency: resolveLabel(labels, language, 'formatCurrency'),
    noTransactions: resolveLabel(labels, language, 'noTransactions'),
  };

  const walletMap = new Map(wallets.map((w) => [w.id, w.name]));
  const catName = (id: string) => getCatName(categories, id);

  const pdfRows: ReportTxRow[] = rows.map((tx) => ({
    id: tx.id,
    date: formatDateShort(tx.transaction_date || tx.created_at),
    type: tx.type,
    typeLabel: tx.type === 'income' ? L.typeIncome : L.typeExpense,
    category: catName(tx.category),
    wallet: walletMap.get(tx.wallet_id) ?? '—',
    spentBy: tx.spent_by,
    notes: tx.notes ?? '',
    amount: tx.amount,
  }));

  const periodLabel = `${formatDateShort(range.start)} — ${formatDateShort(range.end)}`;
  const printedAtLabel = `${L.printedAt}: ${formatDateShort(new Date().toISOString())}`;

  const doc = EStatementPDFDocument({
    householdName,
    reportId: options.reportId,
    periodLabel,
    printedAtLabel,
    currency,
    accent: accent ?? PRESET_ACCENT.emerald,
    totalIncome,
    totalExpense,
    netCashflow,
    categoryBreakdown,
    rows: pdfRows,
    labels: L,
    formatAmount: (n: number) => formatMoney(n, currency),
  });

  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  triggerDownload(url, `${reportFileBase(options.reportId)}.pdf`);
}