import React from 'react';
import { LayoutDashboard, Search, CalendarRange } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useFinanceDateRange } from '@/context/FinanceDateRangeContext';
import { GlobalQuickDateFilter } from '@/components/desktop/overview/GlobalQuickDateFilter';

interface OverviewTopBarProps {
  onOpenCommandPalette?: () => void;
}

const localLong = (dateKey: string, locale: string): string => {
  const d = new Date(`${dateKey}T00:00:00`);
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
};

export const OverviewTopBar: React.FC<OverviewTopBarProps> = ({ onOpenCommandPalette }) => {
  const { t, language } = useLanguage();
  const { range } = useFinanceDateRange();
  const locale = language === 'id' ? 'id-ID' : 'en-US';

  const isMacLike = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || '');
  const kbdLabel = isMacLike ? '⌘ K' : 'Ctrl K';

  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
          <LayoutDashboard className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-text-primary">{t('overview.title') || 'Dashboard Overview'}</h1>
          <p className="text-xs text-text-muted inline-flex items-center gap-1">
            <CalendarRange className="w-3 h-3" />
            {localLong(range.startKey, locale)} — {localLong(range.endKey, locale)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Global Quick Date Filter pill */}
        <GlobalQuickDateFilter />

        {/* Command Palette hint */}
        {onOpenCommandPalette && (
          <button
            type="button"
            onClick={onOpenCommandPalette}
            data-testid="open-command-palette-overview"
            title={t('palette.hint') || 'Quick actions & navigation'}
            className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-xl text-xs font-medium text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-accent" />
            <span className="hidden sm:inline">{t('palette.hint') || 'Quick actions & navigation'}</span>
            <kbd className="px-1.5 py-0.5 rounded-md bg-surface-hover border border-border text-[10px] font-bold">
              {kbdLabel}
            </kbd>
          </button>
        )}
      </div>
    </div>
  );
};
