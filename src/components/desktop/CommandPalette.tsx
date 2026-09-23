import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Plus,
  FileSpreadsheet,
  Download,
  LayoutDashboard,
  BarChart3,
  TableProperties,
  Target,
  FileSpreadsheet as FileIcon,
  Users2,
  Wallet,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
  Receipt,
  Command as CommandIcon,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { useFinanceDateRange } from '@/context/FinanceDateRangeContext';
import { useToast } from '@/context/ToastContext';
import { formatMoneyShort, formatDateShort } from '@/lib/format';
import { resolveCategoryMeta } from '@/lib/categoryStyle';
import { downloadExcelReport, downloadPDFReport, downloadPPTXReport, generateReportId } from '@/lib/exportReport';
import type { DesktopTabKey } from '@/components/desktop/DesktopSidebar';

interface CommandPaletteProps {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onNavigate: (tab: DesktopTabKey) => void;
  onAddTransaction: () => void;
}

type CommandItem = {
  id: string;
  group: 'actions' | 'navigation' | 'transactions';
  label: string;
  hint?: string;
  icon: React.ElementType;
  keywords: string;
  run: () => void;
};

const NAV_TABS: { tab: DesktopTabKey; icon: React.ElementType }[] = [
  { tab: 'overview', icon: LayoutDashboard },
  { tab: 'wallets', icon: Wallet },
  { tab: 'analytics', icon: BarChart3 },
  { tab: 'transactions', icon: TableProperties },
  { tab: 'budgets-goals', icon: Target },
  { tab: 'bulk-import-export', icon: FileIcon },
  { tab: 'circle-members', icon: Users2 },
];

const GROUP_LABEL: Record<CommandItem['group'], { tKey: string; fallback: string }> = {
  actions: { tKey: 'palette.groupActions', fallback: 'Quick Actions' },
  navigation: { tKey: 'palette.groupNav', fallback: 'Navigate To' },
  transactions: { tKey: 'palette.groupTx', fallback: 'Transactions' },
};

const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || '');

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onOpen,
  onClose,
  onNavigate,
  onAddTransaction,
}) => {
  const { transactions, wallets, categories, household, profile } = useApp();
  const { t, language } = useLanguage();
  const { range } = useFinanceDateRange();
  const { showToast } = useToast();
  const currency = profile?.currency || 'IDR';

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const navLabel = (tab: DesktopTabKey): string =>
    t(`palette.nav.${tab}`) ||
    ({
      overview: 'Dashboard Overview',
      wallets: 'Wallet Management',
      analytics: 'Analytics',
      transactions: 'Transactions Data Grid',
      'budgets-goals': 'Budgets & Goals',
      'bulk-import-export': 'Import & Export Center',
      'circle-members': 'Circle Members',
    } as Record<DesktopTabKey, string>)[tab];

  // ⌘/Ctrl + K global trigger + Escape close (registered regardless of open state).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const combo = (e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'k');
      if (combo) {
        e.preventDefault();
        onOpen();
      } else if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onOpen, onClose]);

  // Focus the input + reset navigation when the overlay opens.
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);
  const runExport = async (format: 'excel' | 'pdf' | 'pptx') => {
    const options = {
      reportId: generateReportId(),
      transactions,
      wallets,
      categories: categories.map((c) => ({ id: c.id, name: c.name })),
      range: { start: range.startKey, end: range.endKey },
      format,
      currency,
      householdName: household?.name || 'PairFlow Household',
      language: (language as 'id' | 'en') || 'id',
      labels: {},
    };
    try {
      if (format === 'excel') {
        downloadExcelReport(options);
        showToast(t('palette.exportExcelDone') || 'Excel report downloaded');
      } else if (format === 'pdf') {
        await downloadPDFReport(options);
        showToast(t('palette.exportPdfDone') || 'PDF e-statement downloaded');
      } else {
        await downloadPPTXReport(options);
        showToast(t('palette.exportPptxDone') || 'PPTX presentation downloaded');
      }
      onClose();
    } catch (err) {
      console.error(err);
      showToast(t('palette.exportError') || 'Export failed — please try again.', 'error');
    }
  };

  const commands: CommandItem[] = useMemo(() => {
    const actionCommands: CommandItem[] = [
      {
        id: 'add-transaction',
        group: 'actions',
        label: t('palette.addTx') || 'Add Transaction',
        hint: t('palette.addTxHint') || 'Open the quick-add sheet',
        icon: Plus,
        keywords: 'add new transaction expense income catat transaksi baru',
        run: () => {
          onClose();
          onAddTransaction();
        },
      },
      {
        id: 'export-excel',
        group: 'actions',
        label: t('palette.exportExcel') || 'Export Excel (.xlsx)',
        hint: `${formatDateShort(range.startKey)} – ${formatDateShort(range.endKey)}`,
        icon: FileSpreadsheet,
        keywords: 'download excel report xlsx export',
        run: () => runExport('excel'),
      },
      {
        id: 'export-pdf',
        group: 'actions',
        label: t('palette.exportPdf') || 'Download PDF E-Statement',
        hint: `${formatDateShort(range.startKey)} – ${formatDateShort(range.endKey)}`,
        icon: Download,
        keywords: 'download pdf e-statement export report',
        run: () => runExport('pdf'),
      },
      {
        id: 'export-pptx',
        group: 'actions',
        label: t('palette.exportPptx') || 'Export PPTX Presentation',
        hint: `${formatDateShort(range.startKey)} – ${formatDateShort(range.endKey)}`,
        icon: FileIcon,
        keywords: 'download pptx presentation export powerpoint deck',
        run: () => runExport('pptx'),
      },
    ];

    const navCommands: CommandItem[] = NAV_TABS.map(({ tab, icon }) => ({
      id: `nav-${tab}`,
      group: 'navigation',
      label: navLabel(tab),
      hint: t('palette.navigateHint') || 'Go to page',
      icon,
      keywords: `${navLabel(tab)} page navigate`,
      run: () => {
        onClose();
        onNavigate(tab);
      },
    }));

    const q = query.trim().toLowerCase();
    const transactionCommands: CommandItem[] = transactions
      .filter((tx) => {
        if (!q) return false;
        const meta = resolveCategoryMeta(tx.category, categories);
        const haystack = `${tx.notes || ''} ${meta.label} ${tx.wallet_name || ''} ${tx.spent_by || ''} ${tx.amount}`.toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 6)
      .map((tx) => {
        const meta = resolveCategoryMeta(tx.category, categories);
        return {
          id: `tx-${tx.id}`,
          group: 'transactions' as const,
          label: tx.type === 'transfer'
            ? `${tx.notes || meta.label} · ${t('tx.internalTransfer')}`
            : tx.notes || meta.label,
          hint: `${tx.type === 'transfer' ? '' : tx.type === 'income' ? '+' : '-'}${formatMoneyShort(tx.amount, currency)} · ${formatDateShort(tx.transaction_date || tx.created_at)}`,
          icon: Receipt,
          keywords: `${tx.notes || ''} ${meta.label} ${tx.wallet_name || ''} ${tx.spent_by || ''} ${tx.amount}`,
          run: () => {
            onClose();
            onNavigate('transactions');
            // Let the screen mount, then prefill the grid search box.
            const searchText = tx.notes || meta.label || tx.spent_by || '';
            window.setTimeout(() => {
              window.dispatchEvent(new CustomEvent('pf:grid-search', { detail: searchText }));
            }, 60);
          },
        };
      });

    return [...actionCommands, ...navCommands, ...transactionCommands];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, transactions, categories, currency, language, t, range, onClose, onNavigate, onAddTransaction]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands.filter((c) => c.group !== 'transactions');
    return commands.filter((c) => c.keywords.toLowerCase().includes(q) || c.label.toLowerCase().includes(q));
  }, [query, commands]);

  const grouped = useMemo(() => {
    const order: CommandItem['group'][] = ['actions', 'navigation', 'transactions'];
    const map = new Map<CommandItem['group'], CommandItem[]>();
    for (const cmd of filtered) {
      const list = map.get(cmd.group) || [];
      list.push(cmd);
      map.set(cmd.group, list);
    }
    return order.filter((g) => map.get(g)?.length).map((g) => ({ group: g, items: map.get(g) || [] }));
  }, [filtered]);

  useEffect(() => setActiveIndex(0), [query]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[activeIndex]) {
      e.preventDefault();
      filtered[activeIndex].run();
    }
  };

  if (!open) return null;
  let runningIndex = -1;
  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center pt-[14vh] px-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <Search className="w-4.5 h-4.5 text-accent shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            data-testid="command-palette-input"
            placeholder={t('palette.placeholder') || 'Type a command or search transactions…'}
            className="flex-1 py-4 bg-transparent text-sm text-text-primary placeholder-text-muted focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 rounded-md bg-surface-hover border border-border text-[10px] font-bold text-text-muted shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[420px] overflow-y-auto py-2">
          {grouped.length === 0 ? (
            <p className="px-5 py-8 text-center text-xs text-text-muted">
              {t('palette.noResults') || 'No matching commands or transactions.'}
            </p>
          ) : (
            grouped.map(({ group, items }) => (
              <div key={group} className="mb-1">
                <p className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  {t(GROUP_LABEL[group].tKey) || GROUP_LABEL[group].fallback}
                </p>
                {items.map((cmd) => {
                  runningIndex += 1;
                  const itemIndex = runningIndex;
                  const Icon = cmd.icon;
                  const isActive = itemIndex === activeIndex;
                  return (
                    <button
                      key={cmd.id}
                      type="button"
                      data-testid={`command-option-${cmd.id}`}
                      onClick={cmd.run}
                      onMouseMove={() => setActiveIndex(itemIndex)}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                        isActive ? 'bg-accent/10' : 'hover:bg-surface-hover'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive ? 'bg-accent text-accent-text' : 'bg-surface-hover text-text-muted'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className={`block text-xs font-semibold truncate ${isActive ? 'text-accent' : 'text-text-primary'}`}>
                          {cmd.label}
                        </span>
                      </span>
                      {cmd.hint && (
                        <span className="text-[10px] text-text-muted truncate max-w-[180px]">{cmd.hint}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer kbd hints */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-border bg-surface-hover/40 text-[10px] text-text-muted">
          <span className="inline-flex items-center gap-1">
            <ArrowUp className="w-3 h-3" />
            <ArrowDown className="w-3 h-3" />
            {t('palette.kbdNavigate') || 'Navigate'}
          </span>
          <span className="inline-flex items-center gap-1">
            <CornerDownLeft className="w-3 h-3" />
            {t('palette.kbdSelect') || 'Select'}
          </span>
          <span className="ml-auto inline-flex items-center gap-1">
            <CommandIcon className="w-3 h-3" />
            {isMac() ? '⌘K' : 'Ctrl K'}
            {t('palette.kbdToggle') || 'Toggle'}
          </span>
        </div>
      </div>
    </div>
  );


};
