import React from 'react';
import { MetricCardsWidget } from '@/components/desktop/overview/MetricCardsWidget';
import { OverviewTopBar } from '@/components/desktop/overview/OverviewTopBar';
import { SpendingAnomalyBanner } from '@/components/desktop/overview/SpendingAnomalyBanner';
import { MemberBreakdownSideCard } from '@/components/desktop/overview/MemberBreakdownSideCard';
import { CashflowTrendChart } from '@/components/desktop/overview/CashflowTrendChart';
import { SpouseRatioChart } from '@/components/desktop/overview/SpouseRatioChart';
import { CategoryAllocationChart } from '@/components/desktop/overview/CategoryAllocationChart';
import { MonthlyActivityCalendar } from '@/components/MonthlyActivityCalendar';

interface DesktopOverviewScreenProps {
  onOpenCommandPalette?: () => void;
}

export const DesktopOverviewScreen: React.FC<DesktopOverviewScreenProps> = ({ onOpenCommandPalette }) => {
  return (
    <div data-testid="desktop-overview-screen" className="space-y-6">
      {/* Global Quick Date Filter + title */}
      <OverviewTopBar onOpenCommandPalette={onOpenCommandPalette} />

      {/* Spending Anomaly & Financial Health Alert */}
      <SpendingAnomalyBanner />

      {/* Top Metric Cards */}
      <MetricCardsWidget />

      {/* Main Charts & Member Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (Spans 2 cols) */}
        <div className="lg:col-span-2">
          <CashflowTrendChart />
        </div>

        {/* Circle Member Activity Side Card ("Siapa Belanja Apa?") */}
        <div className="lg:col-span-1">
          <MemberBreakdownSideCard />
        </div>
      </div>

      {/* Distribution Charts & Monthly Activity Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spouse Ratio Chart */}
        <div className="lg:col-span-1">
          <SpouseRatioChart />
        </div>

        {/* Category Allocation Chart */}
        <div className="lg:col-span-1">
          <CategoryAllocationChart />
        </div>

        {/* Section 'Aktivitas Bulan Ini' */}
        <div className="lg:col-span-1 bg-surface p-5 rounded-2xl border border-border shadow-xs flex flex-col justify-between">
          <div className="flex-1">
            <MonthlyActivityCalendar onSelectDate={() => {}} />
          </div>
        </div>
      </div>
    </div>
  );
};

