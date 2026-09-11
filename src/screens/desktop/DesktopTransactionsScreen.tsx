import React from 'react';
import { TransactionsDataGrid } from '@/components/desktop/grid/TransactionsDataGrid';
import { TableProperties } from 'lucide-react';

interface DesktopTransactionsScreenProps {
  dateFilter?: string | null;
  onDateFilterConsumed?: () => void;
}

export const DesktopTransactionsScreen: React.FC<DesktopTransactionsScreenProps> = ({
  dateFilter,
  onDateFilterConsumed,
}) => {
  return (
    <div data-testid="desktop-transactions-screen" className="space-y-4">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
            <TableProperties className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">Advanced Transactions Data Grid</h1>
            <p className="text-xs text-text-muted">Dense desktop view with real-time sorting, search, multi-filters, and inline editing</p>
          </div>
        </div>
      </div>

      {/* Main Data Grid */}
      <TransactionsDataGrid dateFilter={dateFilter} onDateFilterConsumed={onDateFilterConsumed} />
    </div>
  );
};

