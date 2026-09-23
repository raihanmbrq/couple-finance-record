import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { formatMoney, formatDateShort } from '@/lib/format';
import { 
  downloadExcelReport, 
  downloadPDFReport,
  downloadPPTXReport,
  generateReportId, 
  filterTransactionsByRange, 
  computeReportData,
  type ReportRange 
} from '@/lib/exportReport';
import { FileText, Download, FileSpreadsheet, Presentation } from 'lucide-react';

export const ExportReportCenter: React.FC = () => {
    const { transactions, wallets, categories, budgets, goals, household, profile } = useApp();
  const { language } = useLanguage();
  const currency = profile?.currency || 'IDR';

  const [rangeType, setRangeType] = useState<'this_month' | 'last_month' | 'this_year' | 'all' | 'custom'>('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [isExporting, setIsExporting] = useState<string | null>(null);

  // Compute start/end dates for range
  const getRangeDates = (): ReportRange => {
    const now = new Date();
    if (rangeType === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
      return { start, end };
    }
    if (rangeType === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
      const end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
      return { start, end };
    }
    if (rangeType === 'this_year') {
      const start = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
      const end = new Date(now.getFullYear(), 11, 31).toISOString().slice(0, 10);
      return { start, end };
    }
    if (rangeType === 'custom' && customStart && customEnd && customStart <= customEnd) {
      return { start: customStart, end: customEnd };
    }
    // all
    return { start: '2020-01-01', end: now.toISOString().slice(0, 10) };
  };

  const currentRange = getRangeDates();
  const filtered = filterTransactionsByRange(transactions, currentRange);
  const { totalIncome, totalExpense, netCashflow, rows } = computeReportData(filtered);

  const getReportOptions = (format: 'excel' | 'pdf' | 'pptx') => ({
    reportId: generateReportId(),
    transactions,
    wallets,
    categories: categories.map((c) => ({ id: c.id, name: c.name })),
    range: currentRange,
    format,
    currency,
    householdName: household?.name || 'PairFlow Household',
    language: (language as 'id' | 'en') || 'id',
    labels: {},
      budgets,
      goals,
  });

  const handleExportExcel = () => {
    setIsExporting('excel');
    try {
      downloadExcelReport(getReportOptions('excel'));
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsExporting(null), 1000);
    }
  };

  const handleExportPdf = async () => {
    setIsExporting('pdf');
    try {
      await downloadPDFReport(getReportOptions('pdf'));
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportPptx = async () => {
    setIsExporting('pptx');
    try {
      await downloadPPTXReport(getReportOptions('pptx'));
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div data-testid="export-report-center" className="bg-surface p-6 rounded-2xl border border-border shadow-xs space-y-6">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <FileText className="w-5 h-5 text-accent" />
            <span>Financial Export Report Center</span>
          </h2>
          <p className="text-xs text-text-muted mt-0.5">Generate and download official Excel statements (.xlsx) & PDF e-statements</p>
        </div>

        {/* Date Range Selector Buttons */}
        <div className="flex items-center gap-1 bg-surface-hover p-1 rounded-xl border border-border">
          {[
            { key: 'this_month', label: 'This Month' },
            { key: 'last_month', label: 'Last Month' },
            { key: 'this_year', label: 'This Year' },
            { key: 'all', label: 'All History' },
            { key: 'custom', label: 'Custom Date' },
          ].map((r) => (
            <button
              key={r.key}
              onClick={() => setRangeType(r.key as typeof rangeType)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                rangeType === r.key ? 'bg-accent text-accent-text font-bold' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {rangeType === 'custom' && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface-hover/40 p-4">
          <label className="text-xs font-medium text-text-muted">Start date<input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} className="mt-1 block rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-primary" /></label>
          <label className="text-xs font-medium text-text-muted">End date<input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} className="mt-1 block rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-primary" /></label>
        </div>
      )}

      {/* Report Summary Live Preview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface-hover/40 p-4 rounded-xl border border-border">
        <div>
          <span className="text-xs text-text-muted font-medium">Total Period Inflow</span>
          <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {formatMoney(totalIncome, currency)}
          </p>
        </div>
        <div>
          <span className="text-xs text-text-muted font-medium">Total Period Outflow</span>
          <p className="text-lg font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">
            {formatMoney(totalExpense, currency)}
          </p>
        </div>
        <div>
          <span className="text-xs text-text-muted font-medium">Net Period Cashflow</span>
          <p className={`text-lg font-extrabold mt-0.5 ${netCashflow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatMoney(netCashflow, currency)}
          </p>
        </div>
      </div>

      {/* Export Action Buttons */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="text-xs text-text-muted">
          Statement Period: <span className="font-bold text-text-primary">{formatDateShort(currentRange.start)} - {formatDateShort(currentRange.end)}</span> ({rows.length} transactions included)
        </div>

        <div className="flex items-center gap-3">
          {/* Excel Export Button */}
          <button
            onClick={handleExportExcel}
            disabled={isExporting !== null}
            data-testid="export-excel-btn"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isExporting === 'excel' ? 'Exporting Excel...' : 'Export Excel (.xlsx)'}</span>
          </button>

          {/* PDF Export Button */}
          <button
            onClick={handleExportPdf}
            disabled={isExporting !== null}
            data-testid="export-report-btn"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-text text-xs font-bold hover:opacity-90 transition-all shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting === 'pdf' ? 'Generating PDF...' : 'Download PDF E-Statement'}</span>
          </button>

          {/* PPTX Export Button */}
          <button
            onClick={handleExportPptx}
            disabled={isExporting !== null}
            data-testid="export-pptx-btn"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all shadow-xs"
          >
            <Presentation className="w-4 h-4" />
            <span>{isExporting === 'pptx' ? 'Generating PPTX...' : 'Export PPTX'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

