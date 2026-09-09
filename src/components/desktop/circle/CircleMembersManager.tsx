import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatDate } from '@/lib/format';
import { Users2, Copy, Check, ShieldCheck, Heart, UserPlus } from 'lucide-react';

export const CircleMembersManager: React.FC = () => {
  const { household, householdMembers, profile } = useApp();
  const [copied, setCopied] = useState(false);

  const handleCopyInvite = () => {
    if (household?.invite_code) {
      navigator.clipboard.writeText(household.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div data-testid="circle-members-manager" className="space-y-6">
      {/* Header Info Banner */}
      <div className="bg-surface p-6 rounded-2xl border border-border shadow-xs flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-accent/15 flex items-center justify-center text-accent">
            <Users2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              {household?.name || 'PairFlow Household Circle'}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Household Mode: <span className="font-semibold text-text-primary capitalize">{household?.mode || 'Couple'} Mode</span> &bull; {householdMembers.length} Active Member(s)
            </p>
          </div>
        </div>

        {/* Invite Code Quick Box */}
        <div className="flex items-center gap-3 bg-surface-hover/80 px-4 py-2.5 rounded-xl border border-border">
          <div className="flex flex-col">
            <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Household Invite Code</span>
            <span className="text-base font-mono font-extrabold text-accent tracking-widest">
              {household?.invite_code || 'CODE123'}
            </span>
          </div>
          <button
            onClick={handleCopyInvite}
            data-testid="copy-circle-invite-btn"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-accent-text text-xs font-bold hover:opacity-90 transition-opacity"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>
      </div>

      {/* Active Household Members Table */}
      <div className="bg-surface p-6 rounded-2xl border border-border shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Heart className="w-4 h-4 text-accent fill-accent" />
            <span>Circle Members Directory</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-text-muted">
                <th className="py-2.5 px-3 font-semibold">Member</th>
                <th className="py-2.5 px-3 font-semibold">Email</th>
                <th className="py-2.5 px-3 font-semibold">Role</th>
                <th className="py-2.5 px-3 font-semibold">Joined Date</th>
                <th className="py-2.5 px-3 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {householdMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-text-muted">
                    No circle members found.
                  </td>
                </tr>
              ) : (
                householdMembers.map((member, idx) => {
                  const mProfile = member.profile;
                  const name = mProfile?.full_name || 'Household Member';
                  const role = mProfile?.role || member.role;
                  const avatar = mProfile?.avatar_url;

                  return (
                    <tr key={member.id || idx} className="hover:bg-surface-hover/50">
                      <td className="py-3 px-3 font-medium text-text-primary flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold text-xs overflow-hidden shrink-0">
                          {avatar ? (
                            <img src={avatar} alt={name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{name[0]?.toUpperCase()}</span>
                          )}
                        </div>
                        <span className="font-semibold">{name}</span>
                      </td>
                      <td className="py-3 px-3 text-text-muted">{mProfile?.email || 'N/A'}</td>
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-1 rounded-full bg-accent/15 text-accent text-[11px] font-semibold capitalize">
                          {role}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-text-muted">
                        {formatDate(member.created_at || new Date().toISOString())}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

