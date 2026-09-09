import React from 'react';
import { CircleMembersManager } from '@/components/desktop/circle/CircleMembersManager';
import { Users2 } from 'lucide-react';

export const DesktopCircleMembersScreen: React.FC = () => {
  return (
    <div data-testid="desktop-circle-members-screen" className="space-y-6">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
            <Users2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">Circle Members Management</h1>
            <p className="text-xs text-text-muted">Manage household partner invites, member roles, and directory</p>
          </div>
        </div>
      </div>

      {/* Circle Members Directory */}
      <CircleMembersManager />
    </div>
  );
};

