import { useEffect, useMemo, useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import {
  last30DaysRange,
  startOfMonthRange,
  generateReportId,
  filterTransactionsByRange,
  computeReportData,
  type ReportRange,
} from '@/lib/reportUtils';
import { PRESET_ACCENT } from '@/lib/themeAccent';
import { formatMoney } from '@/lib/format';
import { DateRangePicker } from '@/components/DateRangePicker';
import { CalendarRange, FileDown, FileSpreadsheet, FileText, Loader2, Check } from 'lucide-react';

type PresetKey = 'thisMonth' | 'last30' | 'custom';

interface ExportReportSheetProps {
  open: boolean;
  onClose: () => void;
}

export function ExportReportSheet({ open, onClose }: ExportReportSheetProps) {
  const { transactions, wallets, categories, profile, household } = useApp();
  const { language, t } = useLanguage();
  const { colorPreset } = useTheme();
  const { showToast } = useToast();

  const currency = profile?.currency ?? 'IDR';
  const householdName = household?.name ?? profile?.full_name ?? 'PairFlow';

  const [preset, setPreset] = useState<PresetKey>('thisMonth');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [format, setFormat] = useState<'excel' | 'pdf'>('excel');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (open) {
      setPreset('thisMonth');
      setCustomStart('');
      setCustomEnd('');
      setFormat('excel');
      setDownloading(false);
    }
  }, [open]);

  function toDateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  const range: ReportRange = useMemo(() => {
    if (preset === 'thisMonth') return startOfMonthRange();
    if (preset === 'last30') return last30DaysRange();
    return { start: customStart || startOfMonthRange().start, end: customEnd || toDateKey(new Date()) };
  }, [preset, customStart, customEnd]);

  const filtered = useMemo(() => filterTransactionsByRange(transactions, range), [transactions, range]);
  const reportData = useMemo(() => computeReportData(filtered), [filtered]);
  const categoriesForMap = useMemo(() => categories.map((c) => ({ id: c.id, name: c.name })), [categories]);

  const periodLabel = `${formatRangeDate(range.start)} — ${formatRangeDate(range.end)}`;

  function formatRangeDate(dateKey: string): string {
    const [y, m, d] = dateKey.split('-').map(Number);
    return new Intl.DateTimeFormat(language === 'id' ? 'id-ID' : 'en-US', {
      day: 'numeric', month: 'short', year: 'numeric',
    }).format(new Date(y, m - 1, d));
  }

  const labels = useMemo<Record<string, string>>(() => ({
    summarySheet: t('report.summarySheet'),
    detailSheet: t('report.detailSheet'),
    totalIncome: t('report.totalIncome'),
    totalExpense: t('report.totalExpense'),
    netCashflow: t('report.netCashflow'),
    category: t('report.category'),
    percentage: t('report.percentage'),
    amount: t('report.amount'),
    date: t('report.date'),
    type: t('report.type'),
    typeIncome: t('report.income'),
    typeExpense: t('report.expense'),
    wallet: t('report.wallet'),
    loggedBy: t('report.loggedBy'),
    notes: t('report.notes'),
    reportId: t('report.reportId'),
    period: t('report.period'),
    printedAt: t('report.printedAt'),
    disclaimer: t('report.disclaimer'),
    categoryBreakdown: t('report.categoryBreakdown') ?? 'Rincian Pengeluaran per Kategori',
    transactionDetails: t('report.transactionDetails') ?? 'Detail Transaksi',
    share: t('report.share') ?? 'Porsi',
    formatCurrency: t('report.formatCurrency') ?? 'Mata Uang',
    noTransactions: t('report.noTransactions') ?? 'Tidak ada transaksi pada periode ini',
  }), [t]);

  const netColor = reportData.netCashflow >= 0 ? 'text-income' : 'text-expense';

  const presetOptions: { key: PresetKey; label: string }[] = [
    { key: 'thisMonth', label: t('report.presetThisMonth') },
    { key: 'last30', label: t('report.presetLast30') },
    { key: 'custom', label: t('report.presetCustom') },
  ];

  const formatOptions = [
    { key: 'excel' as const, label: t('report.formatExcel'), icon: FileSpreadsheet },
    { key: 'pdf' as const, label: t('report.formatPdf'), icon: FileText },
  ];

  const handleDownload = async () => {
    if (downloading) return;
    if (preset === 'custom' && (!customStart || !customEnd || customStart > customEnd)) {
      showToast(t('report.failed'), 'error');
      return;
    }
    setDownloading(true);
    try {
      const base = {
        reportId: generateReportId(),
        transactions,
        wallets,
        categories: categoriesForMap,
        range,
        format,
        currency,
        householdName,
        language,
        accent: PRESET_ACCENT[colorPreset],
        labels,
      };
      const { downloadExcelReport, downloadPDFReport } = await import('@/lib/exportReport');
      if (format === 'excel') {
        downloadExcelReport(base);
      } else {
        await downloadPDFReport(base);
      }
      showToast(t('report.downloaded'));
      onClose();
    } catch {
      showToast(t('report.failed'), 'error');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title={t('report.exportTitle')}>
      <div className="space-y-5">
        <p className="text-sm text-text-secondary -mt-1">{t('report.exportSubtitle')}</p>

        <div className="space-y-3">
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide">
            {t('report.periodLabel')}
          </label>
          <div className="flex gap-2 flex-wrap">
            {presetOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setPreset(opt.key)}
                className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
                  preset === opt.key
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-secondary text-text-secondary hover:bg-secondary/70'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {preset === 'custom' && (
            <div className="space-y-2 animate-fade-in">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    {t('report.customStart')}
                  </label>
                  <div className="px-3.5 py-2.5 rounded-xl bg-secondary/60 border border-secondary text-sm font-semibold text-text-primary">
                    {customStart ? formatRangeDate(customStart) : '—'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    {t('report.customEnd')}
                  </label>
                  <div className="px-3.5 py-2.5 rounded-xl bg-secondary/60 border border-secondary text-sm font-semibold text-text-primary">
                    {customEnd ? formatRangeDate(customEnd) : '—'}
                  </div>
                </div>
              </div>
              <DateRangePicker
                start={customStart}
                end={customEnd}
                onChange={(r) => {
                  setCustomStart(r.start);
                  setCustomEnd(r.end);
                }}
              />
            </div>
          )}

          <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl bg-secondary/60 border border-secondary">
            <CalendarRange className="w-4 h-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-text-primary truncate">{periodLabel}</p>
              <p className="text-xs text-text-secondary">
                {t('report.transactionsCount', { count: reportData.rows.length })}
              </p>
            </div>
            <p className={`text-sm font-bold whitespace-nowrap ${netColor}`}>
              {formatMoney(reportData.netCashflow, currency)}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide">
            {t('report.formatLabel')}
          </label>
          <div className="grid grid-cols-2 gap-3">
            {formatOptions.map((opt) => {
              const active = format === opt.key;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setFormat(opt.key)}
                  className={`relative flex flex-col items-center gap-2 px-4 py-5 rounded-2xl border-2 transition-all ${
                    active
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-secondary bg-surface hover:border-primary/40'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      active ? 'bg-primary/10 text-primary' : 'bg-secondary text-text-secondary'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs font-semibold ${active ? 'text-primary' : 'text-text-secondary'}`}>
                    {opt.label}
                  </span>
                  {active && (
                    <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-primary to-primary-hover text-white font-semibold text-sm shadow-lg shadow-primary/25 transition-all duration-150 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
        >
          {downloading ? (
            <Loader2 className="w-4.5 h-4.5 animate-spin" />
          ) : (
            <FileDown className="w-4.5 h-4.5" />
          )}
          <span>{downloading ? t('report.downloading') : t('report.download')}</span>
        </button>
      </div>
    </Sheet>
  );
}