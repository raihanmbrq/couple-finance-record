import React from 'react';
import { LayoutDashboard, CalendarRange } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useFinanceDateRange } from '@/context/FinanceDateRangeContext';
import { GlobalQuickDateFilter } from '@/components/desktop/overview/GlobalQuickDateFilter';

const localLong = (dateKey: string, locale: string): string => {
  const d = new Date(`${dateKey}T00:00:00`);
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
};

export const OverviewTopBar: React.FC = () => {
  const { t, language } = useLanguage();
  const { range } = useFinanceDateRange();
  const locale = language === 'id' ? 'id-ID' : 'en-US';

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
      </div>
    </div>
  );
};
