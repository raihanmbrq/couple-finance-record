import React from 'react';
import { 
  LayoutDashboard, 
  BarChart3, 
  TableProperties, 
  Target, 
  FileSpreadsheet, 
  Users2, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Heart,
  Wallet
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export type DesktopTabKey = 
  | 'overview' 
  | 'wallets'
  | 'analytics' 
  | 'transactions' 
  | 'budgets-goals' 
  | 'bulk-import-export' 
  | 'circle-members';

interface DesktopSidebarProps {
  activeTab: DesktopTabKey;
  onTabChange: (tab: DesktopTabKey) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenSettings: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
  onOpenSettings,
}) => {
  const { t } = useLanguage();

  const navItems: { id: DesktopTabKey; label: string; icon: React.ElementType; testId: string }[] = [
    { id: 'overview', label: t('sidebar.dashboard') || 'Dashboard', icon: LayoutDashboard, testId: 'sidebar-link-overview' },
    { id: 'wallets', label: t('sidebar.wallets') || 'Wallets', icon: Wallet, testId: 'sidebar-link-wallets' },
    { id: 'analytics', label: t('sidebar.analytics') || 'Analytics', icon: BarChart3, testId: 'sidebar-link-analytics' },
    { id: 'transactions', label: t('sidebar.transactions') || 'Transactions', icon: TableProperties, testId: 'sidebar-link-transactions' },
    { id: 'budgets-goals', label: t('sidebar.budgets-goals') || 'Budgets & Goals', icon: Target, testId: 'sidebar-link-budgets-goals' },
    { id: 'bulk-import-export', label: t('sidebar.bulk-import-export') || 'Bulk Import/Export', icon: FileSpreadsheet, testId: 'sidebar-link-bulk-import-export' },
    { id: 'circle-members', label: t('sidebar.circle-members') || 'Circle Members', icon: Users2, testId: 'sidebar-link-circle-members' },
  ];

  return (
    <aside 
      className={`bg-surface border-r border-border flex flex-col transition-all duration-300 ease-in-out relative z-30 select-none h-full shrink-0 overflow-visible ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className={`border-b border-border ${
        collapsed ? 'h-20 flex flex-col items-center justify-center gap-1.5 px-2' : 'h-16 flex items-center justify-between px-4'
      }`}>
        <div className={`flex items-center overflow-hidden ${
          collapsed ? 'justify-center' : 'gap-3'
        }`}>
          <div className={`${collapsed ? 'w-8 h-8' : 'w-9 h-9'} rounded-xl bg-accent flex items-center justify-center text-accent-text shrink-0 shadow-sm`}>
            <Heart className="w-5 h-5 fill-current" />
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="font-bold text-lg text-text-primary leading-none tracking-tight">PairFlow</span>
              <span className="text-[10px] text-text-muted font-medium mt-0.5 tracking-wider uppercase">Household Finance</span>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          data-testid="sidebar-toggle-btn"
          className={`rounded-lg hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors shrink-0 ${
            collapsed ? 'w-8 h-7 flex items-center justify-center' : 'p-1.5'
          }`}
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Nav Items */}
      <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              data-testid={item.testId}
              title={collapsed ? item.label : undefined}
              className={`group relative flex text-sm font-medium transition-all duration-150 ${
                collapsed
                  ? 'w-full h-11 items-center justify-center rounded-xl px-0 py-0'
                  : 'w-full items-center gap-3 px-3 py-2.5 rounded-xl'
              } ${
                isActive
                  ? 'bg-accent text-accent-text shadow-sm'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-accent-text' : 'text-text-muted'}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {collapsed && (
                <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-text-primary opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-border">
        <button
          onClick={onOpenSettings}
          data-testid="sidebar-link-settings"
          title={collapsed ? (t('profile_settings') || 'Settings') : undefined}
          className={`group relative flex text-sm font-medium text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors ${
            collapsed
              ? 'w-full h-11 items-center justify-center rounded-xl px-0 py-0'
              : 'w-full items-center gap-3 px-3 py-2.5 rounded-xl'
          }`}
        >
          <Settings className="w-5 h-5 shrink-0 text-text-muted" />
          {!collapsed && <span className="truncate">{t('profile_settings') || 'Settings'}</span>}
          {collapsed && (
            <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-text-primary opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
              {t('profile_settings') || 'Settings'}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
};
