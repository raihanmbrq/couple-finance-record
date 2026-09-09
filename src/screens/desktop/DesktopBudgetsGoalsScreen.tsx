import React from 'react';
import { BudgetAnomaliesBanner } from '@/components/desktop/simulator/BudgetAnomaliesBanner';
import { DesktopBudgetCrud } from '@/components/desktop/budget/DesktopBudgetCrud';
import { DesktopGoalsSection } from '@/components/desktop/budget/DesktopGoalsSection';
import { GoalsAnnuitySimulator } from '@/components/desktop/simulator/GoalsAnnuitySimulator';
import { Target } from 'lucide-react';

export const DesktopBudgetsGoalsScreen: React.FC = () => {
  return (
    <div data-testid="desktop-budgets-goals-screen" className="space-y-6">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">Budgets & Goals Workspace</h1>
            <p className="text-xs text-text-muted">Manage category budgets, deposit to goals, and simulate compound annuity returns</p>
          </div>
        </div>
      </div>

      {/* Spending Anomalies Alert Banner */}
      <BudgetAnomaliesBanner />

      {/* Desktop Budget CRUD Management */}
      <DesktopBudgetCrud />

      {/* PWA-Aligned Household Goals Section */}
      <DesktopGoalsSection />

      {/* Compound Annuity Simulator Tool */}
      <GoalsAnnuitySimulator />
    </div>
  );
};
