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
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, testId: 'sidebar-link-overview' },
    { id: 'wallets', label: t('nav.wallets') || 'Wallets', icon: Wallet, testId: 'sidebar-link-wallets' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, testId: 'sidebar-link-analytics' },
    { id: 'transactions', label: 'Transactions', icon: TableProperties, testId: 'sidebar-link-transactions' },
    { id: 'budgets-goals', label: t('nav.budget') || 'Budget and Goals', icon: Target, testId: 'sidebar-link-budgets-goals' },
    { id: 'bulk-import-export', label: 'Import & Export', icon: FileSpreadsheet, testId: 'sidebar-link-bulk-import-export' },
    { id: 'circle-members', label: 'Circle Members', icon: Users2, testId: 'sidebar-link-circle-members' },
  ];

  return (
    <aside 
      className={`bg-surface border-r border-border flex flex-col transition-all duration-300 relative z-30 select-none h-full shrink-0 overflow-hidden ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-accent-text shrink-0 shadow-sm">
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
          className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors"
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-accent text-accent-text shadow-sm'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-accent-text' : 'text-text-muted'}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
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
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
        >
          <Settings className="w-5 h-5 shrink-0 text-text-muted" />
          {!collapsed && <span className="truncate">{t('profile_settings') || 'Settings'}</span>}
        </button>
      </div>
    </aside>
  );
};
