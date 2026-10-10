import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { AdminUsersPanel } from '@/components/desktop/admin/AdminUsersPanel';
import { AdminInvitationsPanel } from '@/components/desktop/admin/AdminInvitationsPanel';
import { AdminHouseholdsPanel } from '@/components/desktop/admin/AdminHouseholdsPanel';
import { AdminWalletsTransactionsPanel } from '@/components/desktop/admin/AdminWalletsTransactionsPanel';
import { AdminRawTablesPanel } from '@/components/desktop/admin/AdminRawTablesPanel';
import type { AdminPanelKey } from '@/lib/types';
import { ShieldAlert, Users, Ticket, Home, Wallet, Database } from 'lucide-react';

const TABS: { key: AdminPanelKey; label: string; icon: React.ElementType }[] = [
  { key: 'users', label: 'Users & Profiles', icon: Users },
  { key: 'invitations', label: 'Invitation Tokens', icon: Ticket },
  { key: 'households', label: 'Households & Couples', icon: Home },
  { key: 'wallets-transactions', label: 'Wallets & Transactions', icon: Wallet },
  { key: 'raw', label: 'All Tables (Raw)', icon: Database },
];

/**
 * Admin-only, desktop-only "Admin Console": a Database GUI Management workspace
 * with sub-tabs for users, invitation tokens, households/couples, and the
 * centralized wallets/transactions monitor. Access is double-gated: this
 * component shows a restricted state for non-admins, and the Postgres RLS
 * policies + `SECURITY DEFINER` RPCs reject non-admin queries regardless.
 */
export const DesktopAdminConsoleScreen: React.FC = () => {
  const { profile } = useApp();
  const [panel, setPanel] = useState<AdminPanelKey>('users');

  const isAdmin = Boolean(profile?.is_admin);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-expense/10 text-expense">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-bold text-text-primary">Access restricted</h2>
        <p className="mt-1 max-w-sm text-sm text-text-muted">
          The Admin Console is only available to administrator accounts.
        </p>
      </div>
    );
  }

  return (
    <div data-testid="desktop-admin-console-screen" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">Admin Control Panel</h1>
            <p className="text-xs text-text-muted">Database GUI management for users, invitations, households and finance data</p>
          </div>
        </div>
      </div>

      {/* Sub-tab nav */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-border bg-surface p-1.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = panel === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setPanel(tab.key)}
              data-testid={`admin-tab-${tab.key}`}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
                isActive ? 'bg-accent text-accent-text shadow-sm' : 'text-text-muted hover:bg-surface-hover hover:text-text-primary'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active panel */}
      {panel === 'users' && <AdminUsersPanel />}
      {panel === 'invitations' && <AdminInvitationsPanel />}
      {panel === 'households' && <AdminHouseholdsPanel />}
      {panel === 'wallets-transactions' && <AdminWalletsTransactionsPanel />}
      {panel === 'raw' && <AdminRawTablesPanel />}
    </div>
  );
};

export default DesktopAdminConsoleScreen;
