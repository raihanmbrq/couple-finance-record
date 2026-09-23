import * as XLSX from 'xlsx';
import pptxgen from 'pptxgenjs';
import { pdf } from '@react-pdf/renderer';
import type { Budget, Goal, Transaction, Wallet } from '@/lib/types';
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
  budgets?: Budget[];
  goals?: Goal[];
}

const LABELS_TABLE: Record<'id' | 'en', Record<string, string>> = {
  id: {
    summarySheet: 'Ringkasan', detailSheet: 'Detail Transaksi',
    totalIncome: 'Total Pemasukan', totalExpense: 'Total Pengeluaran', netCashflow: 'Arus Kas / Net Balance',
    category: 'Kategori', percentage: 'Persentase', amount: 'Nominal',
    date: 'Tanggal', type: 'Tipe', typeIncome: 'Pemasukan', typeExpense: 'Pengeluaran',
    typeTransfer: 'Transfer Internal',
    totalTransfer: 'Transfer Internal (tidak dihitung sebagai pemasukan/pengeluaran)',
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
    typeTransfer: 'Internal Transfer',
    totalTransfer: 'Internal Transfer (excluded from income/expense)',
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
  const { rows, totalIncome, totalExpense, totalTransfer, netCashflow, categoryBreakdown } = computeReportData(filterTransactionsByRange(transactions, range));

  const L = {
    summarySheet: resolveLabel(labels, language, 'summarySheet'),
    detailSheet: resolveLabel(labels, language, 'detailSheet'),
    totalIncome: resolveLabel(labels, language, 'totalIncome'),
    totalExpense: resolveLabel(labels, language, 'totalExpense'),
    totalTransfer: resolveLabel(labels, language, 'totalTransfer'),
    netCashflow: resolveLabel(labels, language, 'netCashflow'),
    category: resolveLabel(labels, language, 'category'),
    percentage: resolveLabel(labels, language, 'percentage'),
    amount: resolveLabel(labels, language, 'amount'),
    date: resolveLabel(labels, language, 'date'),
    type: resolveLabel(labels, language, 'type'),
    typeIncome: resolveLabel(labels, language, 'typeIncome'),
    typeExpense: resolveLabel(labels, language, 'typeExpense'),
    typeTransfer: resolveLabel(labels, language, 'typeTransfer'),
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
    // Internal transfers are listed separately and are NOT part of any total above.
    [L.totalTransfer, totalTransfer],
    [],
    [L.category, L.amount, L.percentage],
    ...categoryBreakdown.map((row) => [catName(row.category), row.total, `${row.percentage}%`]),
  ];

  const detailRows: (string | number)[][] = [
    [L.date, L.type, L.category, L.wallet, L.loggedBy, L.notes, L.amount],
    ...rows.map((tx) => [
      formatDateShort(tx.transaction_date || tx.created_at),
      tx.type === 'transfer' ? L.typeTransfer : tx.type === 'income' ? L.typeIncome : L.typeExpense,
      catName(tx.category),
      walletMap.get(tx.wallet_id) ?? tx.wallet_name ?? '—',
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

export function downloadExcelTemplate(options: {
  reportId?: string;
  householdName?: string;
  categories?: string[];
  wallets?: string[];
  members?: string[];
}) {
  const reportId = options.reportId ?? generateReportId();
  const categories = (options.categories ?? ['Food & Groceries', 'Bills & Utilities', 'Entertainment', 'Other']).filter(Boolean);
  const wallets = (options.wallets ?? ['Main Wallet', 'Emergency Fund']).filter(Boolean);
  const members = (options.members ?? ['Suami', 'Istri']).filter(Boolean);

  const ws = XLSX.utils.aoa_to_sheet([
    ['Tanggal', 'Tipe', 'Nominal', 'Kategori', 'Dompet', 'Oleh', 'Catatan'],
    ['2026-09-01', 'Expense', 250000, 'Food & Groceries', 'Main Wallet', 'Suami', 'Belanja kebutuhan rumah'],
    ['2026-09-02', 'Income', 5000000, 'Salary', 'Main Wallet', 'Istri', 'Gaji bulanan'],
    ['2026-09-03', 'Expense', 750000, 'Bills & Utilities', 'Emergency Fund', 'Suami', 'Tagihan listrik'],
  ]);

  ws['!cols'] = [
    { wch: 14 },
    { wch: 12 },
    { wch: 16 },
    { wch: 22 },
    { wch: 20 },
    { wch: 16 },
    { wch: 30 },
  ];

  const listFormula = (items: string[]) => `"${items.join(',')}"`;
  const validations = [
    { sqref: 'B2:B1000', type: 'list', allowBlank: false, formula1: listFormula(['Expense', 'Income']) },
    { sqref: 'D2:D1000', type: 'list', allowBlank: false, formula1: listFormula(categories) },
    { sqref: 'E2:E1000', type: 'list', allowBlank: false, formula1: listFormula(wallets) },
    { sqref: 'F2:F1000', type: 'list', allowBlank: false, formula1: listFormula(members) },
  ] as const;

  ws['!dataValidations'] = validations.map((v) => ({
    ...v,
    showDropDown: false,
    showInputMessage: true,
    showErrorMessage: true,
    operator: 'equal',
    errorStyle: 'stop',
    errorTitle: 'Nilai tidak valid',
    error: 'Gunakan opsi yang tersedia di daftar validasi.',
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  XLSX.writeFile(wb, `${options.householdName ? `${options.householdName.replace(/\s+/g, '_')}_` : ''}PairFlow_Import_Template_${reportId}.xlsx`);
}

export async function downloadPPTXReport(options: ReportOptions) {
  const { transactions, wallets, range, currency, householdName, language, labels } = options;
  const { rows, totalIncome, totalExpense, netCashflow, categoryBreakdown } = computeReportData(filterTransactionsByRange(transactions, range), { wallets, allTransactions: transactions, budgets: options.budgets, goals: options.goals });

  const periodLabel = `${formatDateShort(range.start)} — ${formatDateShort(range.end)}`;
  const L = {
    totalIncome: resolveLabel(labels, language, 'totalIncome'),
    totalExpense: resolveLabel(labels, language, 'totalExpense'),
    netCashflow: resolveLabel(labels, language, 'netCashflow'),
    reportId: resolveLabel(labels, language, 'reportId'),
    period: resolveLabel(labels, language, 'period'),
    date: resolveLabel(labels, language, 'date'),
  };

  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'PairFlow';
  pptx.company = 'PairFlow';
  pptx.subject = 'Household Financial Review';
  pptx.title = `${householdName} Financial Review`;
  const palette = {
    navy: '0F172A',
    emerald: '10B981',
    rose: 'F43F5E',
    slate: '64748B',
    cool: 'E2E8F0',
    soft: 'F8FAFC',
  };

  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: palette.navy };
  titleSlide.addText('PairFlow Household Financial Review', {
    x: 0.8, y: 2.1, w: 11.7, h: 0.7, fontSize: 28, bold: true, color: 'FFFFFF', align: 'center',
  });
  titleSlide.addText(`${householdName}\n${periodLabel}`, {
    x: 1.2, y: 3.1, w: 10.9, h: 0.8, fontSize: 16, color: palette.cool, align: 'center', breakLine: false,
  });
  titleSlide.addText(`Generated ${formatDateShort(new Date().toISOString())}`, {
    x: 3.5, y: 5.8, w: 6, h: 0.3, fontSize: 10, color: palette.emerald, align: 'center',
  });

  const summarySlide = pptx.addSlide();
  summarySlide.background = { color: 'FFFFFF' };
  summarySlide.addText('PairFlow Household Financial Review', {
    x: 0.5, y: 0.35, w: 8.5, h: 0.5, fontSize: 24, bold: true, color: palette.navy,
  });
  summarySlide.addText(`${householdName} • ${periodLabel}`, {
    x: 0.5, y: 0.9, w: 7, h: 0.35, fontSize: 11, color: palette.slate,
  });
  summarySlide.addText(`${L.reportId}: ${options.reportId}`, {
    x: 11.2, y: 0.45, w: 1.8, h: 0.35, fontSize: 9, bold: true, color: palette.navy, align: 'right',
  });

  const metricCards = [
    { label: L.totalIncome, value: formatMoney(totalIncome, currency), color: palette.emerald },
    { label: L.totalExpense, value: formatMoney(totalExpense, currency), color: palette.rose },
    { label: L.netCashflow, value: formatMoney(netCashflow, currency), color: palette.navy },
  ];

  metricCards.forEach((card, index) => {
    const x = 0.5 + index * 4.2;
    summarySlide.addShape(pptx.ShapeType.rect, {
      x, y: 1.6, w: 3.8, h: 1.4, fill: { color: 'F8FAFC' }, line: { color: 'DDE7F0', width: 1 },
    });
    summarySlide.addText(card.label, {
      x: x + 0.2, y: 1.8, w: 2.8, h: 0.25, fontSize: 9, color: palette.slate, bold: true,
    });
    summarySlide.addText(card.value, {
      x: x + 0.2, y: 2.3, w: 2.8, h: 0.55, fontSize: 20, bold: true, color: card.color,
    });
  });

  const barChartX = 0.7;
  const chartY = 3.3;
  const chartW = 8.5;
  const chartH = 3.4;
  summarySlide.addShape(pptx.ShapeType.rect, {
    x: barChartX, y: chartY, w: chartW, h: chartH, fill: { color: 'F8FAFC' }, line: { color: 'E2E8F0', width: 1 },
  });
  summarySlide.addText('Daily cashflow trend', { x: barChartX + 0.2, y: chartY + 0.15, w: 2.3, h: 0.25, fontSize: 12, bold: true, color: palette.navy });

  const daily = new Map<string, number>();
  rows.forEach((tx) => {
    const key = tx.transaction_date.slice(0, 10);
    const delta = tx.type === 'income' ? tx.amount : -tx.amount;
    daily.set(key, (daily.get(key) ?? 0) + delta);
  });

  const dailyEntries = Array.from(daily.entries()).slice(-7);
  if (dailyEntries.length === 0) {
    summarySlide.addText('No transactions available for this date range.', {
      x: 1.2, y: 4.5, w: 6, h: 0.3, fontSize: 12, color: palette.slate,
    });
  } else {
    const chartMax = Math.max(...dailyEntries.map(([, value]) => Math.abs(value)), 1);
    dailyEntries.forEach(([date, val], i) => {
      const columnWidth = 0.7;
      const columnHeight = Math.max((Math.abs(val) / chartMax) * 1.8, 0.18);
      const x = barChartX + 0.8 + i * 1.15;
      const y = chartY + 2.6 - columnHeight;
      const barColor = val >= 0 ? palette.emerald : palette.rose;
      summarySlide.addShape(pptx.ShapeType.rect, {
        x, y, w: columnWidth, h: columnHeight, fill: { color: barColor }, line: { color: barColor, width: 0.2 },
      });
      summarySlide.addText(date.slice(5), {
        x: x - 0.1, y: chartY + 2.95, w: 1.0, h: 0.2, fontSize: 7, color: palette.slate, align: 'center',
      });
    });
  }

  const topSpendSlide = pptx.addSlide();
  topSpendSlide.background = { color: 'FFFFFF' };
  topSpendSlide.addText('Top Spending & Category Mix', { x: 0.5, y: 0.4, w: 6, h: 0.5, fontSize: 24, bold: true, color: palette.navy });

  const topCategories = categoryBreakdown.slice(0, 5);
  const legendX = 0.8;
  topCategories.forEach((entry, idx) => {
    const barY = 1.5 + idx * 1.1;
    const categoryColor = idx % 2 === 0 ? palette.emerald : palette.rose;
    topSpendSlide.addShape(pptx.ShapeType.rect, {
      x: legendX, y: barY, w: 6.6, h: 0.42, fill: { color: 'F8FAFC' }, line: { color: 'E2E8F0', width: 1 },
    });
    topSpendSlide.addShape(pptx.ShapeType.rect, {
      x: legendX + 0.1, y: barY + 0.08, w: Math.max((entry.percentage / 100) * 6.2, 0.3), h: 0.26, fill: { color: categoryColor }, line: { color: categoryColor, width: 0.1 },
    });
    topSpendSlide.addText(`${entry.category} • ${entry.percentage}%`, { x: legendX + 0.2, y: barY + 0.1, w: 4.4, h: 0.2, fontSize: 10, bold: true, color: palette.navy });
    topSpendSlide.addText(formatMoney(entry.total, currency), { x: 7.2, y: barY + 0.08, w: 2, h: 0.2, fontSize: 10, bold: true, color: palette.slate, align: 'right' });
  });

  const donutX = 8.9;
  const donutY = 1.8;
  const donutW = 3.3;
  const donutH = 3.3;
  topSpendSlide.addShape(pptx.ShapeType.ellipse, {
    x: donutX, y: donutY, w: donutW, h: donutH, fill: { color: 'F8FAFC' }, line: { color: 'E2E8F0', width: 1 },
  });
  topSpendSlide.addText('Expense mix', { x: donutX + 0.2, y: donutY + 0.1, w: 2.5, h: 0.2, fontSize: 10, bold: true, color: palette.navy });
  topSpendSlide.addText(topCategories[0]?.category ?? 'Expense', { x: donutX + 0.3, y: donutY + 2.2, w: 2.5, h: 0.3, fontSize: 11, bold: true, color: palette.navy, align: 'center' });

  const walletSlide = pptx.addSlide();
  walletSlide.background = { color: 'FFFFFF' };
  walletSlide.addText('Budget Status & Wallet Balance', { x: 0.5, y: 0.4, w: 6.4, h: 0.5, fontSize: 24, bold: true, color: palette.navy });

  const walletRows = wallets.slice(0, 4);
  walletRows.forEach((wallet, idx) => {
    const y = 1.5 + idx * 1.3;
    walletSlide.addShape(pptx.ShapeType.rect, {
      x: 0.7, y, w: 11.8, h: 0.8, fill: { color: 'F8FAFC' }, line: { color: 'E2E8F0', width: 1 },
    });
    walletSlide.addText(wallet.name, { x: 1.0, y: y + 0.18, w: 3.2, h: 0.3, fontSize: 12, bold: true, color: palette.navy });
    walletSlide.addText(formatMoney(wallet.balance, currency), { x: 9.5, y: y + 0.18, w: 2.3, h: 0.3, fontSize: 12, bold: true, color: palette.emerald, align: 'right' });
  });

  const discussionSlide = pptx.addSlide();
  discussionSlide.background = { color: 'FFFFFF' };
  discussionSlide.addText('Savings Goal & Discussion Points', { x: 0.5, y: 0.4, w: 6.8, h: 0.5, fontSize: 24, bold: true, color: palette.navy });
  discussionSlide.addText('1. Track the biggest spending peaks and align them with monthly priorities.', {
    x: 0.8, y: 1.7, w: 8.5, h: 0.4, fontSize: 16, color: palette.navy,
  });
  discussionSlide.addText('2. Review wallet balances and maintain emergency reserves before lifestyle spending.', {
    x: 0.8, y: 2.4, w: 8.5, h: 0.4, fontSize: 16, color: palette.navy,
  });
  discussionSlide.addText('3. Celebrate the net cashflow surplus and set a joint savings target for the next cycle.', {
    x: 0.8, y: 3.1, w: 8.5, h: 0.4, fontSize: 16, color: palette.navy,
  });
  discussionSlide.addShape(pptx.ShapeType.rect, {
    x: 9.3, y: 1.7, w: 3.2, h: 2.3, fill: { color: 'F8FAFC' }, line: { color: 'E2E8F0', width: 1 },
  });
  discussionSlide.addText('Net Savings', { x: 9.8, y: 2.3, w: 2.3, h: 0.25, fontSize: 12, bold: true, color: palette.slate, align: 'center' });
  discussionSlide.addText(formatMoney(netCashflow, currency), {
    x: 9.8, y: 2.8, w: 2.3, h: 0.6, fontSize: 24, bold: true, color: netCashflow >= 0 ? palette.emerald : palette.rose, align: 'center',
  });

  const rawBlob = await pptx.write({ outputType: 'blob' });
  const blob = rawBlob instanceof Blob ? rawBlob : new Blob([rawBlob], {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, `${reportFileBase(options.reportId)}.pptx`);
}

export async function downloadPDFReport(options: ReportOptions) {
  const { transactions, wallets, categories, range, currency, language, householdName, accent, labels } = options;
  const report = computeReportData(filterTransactionsByRange(transactions, range), { wallets, allTransactions: transactions, budgets: options.budgets, goals: options.goals });
  const { rows, totalIncome, totalExpense, netCashflow, categoryBreakdown } = report;

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
    typeTransfer: resolveLabel(labels, language, 'typeTransfer'),
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
    typeLabel:
      tx.type === 'transfer' ? L.typeTransfer : tx.type === 'income' ? L.typeIncome : L.typeExpense,
    category: catName(tx.category),
    // Internal transfers are shown as a source -> destination movement.
    wallet:
      tx.type === 'transfer'
        ? `${walletMap.get(tx.source_wallet_id ?? tx.wallet_id) ?? tx.wallet_name ?? '—'} → ${
            walletMap.get(tx.destination_wallet_id ?? '') ?? tx.destination_wallet_name ?? '—'
          }`
        : walletMap.get(tx.wallet_id) ?? tx.wallet_name ?? '—',
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
    categoryBreakdown: categoryBreakdown.map((row) => ({ ...row, category: catName(row.category) })),
    rows: pdfRows,
    labels: L,
    formatAmount: (n: number) => formatMoney(n, currency),
    memberBreakdown: report.memberBreakdown.map((item) => ({ label: item.member, value: formatMoney(item.total, currency), detail: `${item.percentage}%` })),
    topExpensesByAmount: report.topExpensesByAmount.map((item) => ({ label: catName(item.transaction.category), value: formatMoney(item.transaction.amount, currency), detail: `${item.percentage}%` })),
    topExpensesByFrequency: report.topExpensesByFrequency.map((item) => ({ label: catName(item.key), value: `${item.count}x`, detail: formatMoney(item.total, currency) })),
    walletBreakdown: report.walletBreakdown.map((item) => ({ label: item.wallet.name, value: formatMoney(item.endingBalance, currency) })),
    highlightedTransactions: report.highlightedTransactions.map((item) => ({ label: `${formatDateShort(item.transaction_date || item.created_at)} · ${catName(item.category)}`, value: formatMoney(item.amount, currency) })),
  });

  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  triggerDownload(url, `${reportFileBase(options.reportId)}.pdf`);
}