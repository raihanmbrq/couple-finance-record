import React, { useCallback, useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { getInvitationStatus, type InvitationStatus, type InvitationToken } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ShieldAlert, Ticket, Copy, Check, RefreshCw, Send, Mail, Link2, AlertTriangle } from 'lucide-react';

const statusStyles: Record<InvitationStatus, string> = {
  pending: 'bg-amber-500/15 text-amber-600 border-amber-500/25',
  used: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/25',
  expired: 'bg-rose-500/15 text-rose-600 border-rose-500/25',
};

interface GeneratedInvite {
  email: string;
  token: string;
  shareLink: string;
  delivered: boolean;
}

/**
 * Admin-only, desktop-only workspace to generate invitation tokens for the
 * closed-registration flow and review the token history.
 */
export const DesktopAdminInvitationsScreen: React.FC = () => {
  const { profile, createInvitation, listInvitations } = useApp();

  const isAdmin = Boolean(profile?.is_admin);

  const [email, setEmail] = useState('');
  const [generating, setGenerating] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [invitations, setInvitations] = useState<InvitationToken[]>([]);
  const [error, setError] = useState('');
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<GeneratedInvite | null>(null);

  const refresh = useCallback(async () => {
    setLoadingList(true);
    try {
      setInvitations(await listInvitations());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invitations.');
    } finally {
      setLoadingList(false);
    }
  }, [listInvitations]);

  useEffect(() => {
    if (isAdmin) void refresh();
  }, [isAdmin, refresh]);

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(value);
      setTimeout(() => setCopiedValue((current) => (current === value ? null : current)), 2000);
    } catch {
      setError('Could not copy to clipboard.');
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const target = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
      setError('Enter a valid email address.');
      return;
    }
    setGenerating(true);
    try {
      const { invitation, emailResult, shareLink } = await createInvitation(target);
      setLastResult({
        email: invitation.email,
        token: invitation.token,
        shareLink,
        delivered: emailResult.delivered,
      });
      setEmail('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate invitation.');
    } finally {
      setGenerating(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-2xl bg-expense/10 text-expense flex items-center justify-center mb-4">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-text-primary">Access restricted</h2>
        <p className="text-sm text-text-muted mt-1 max-w-sm">
          Admin invitations are only available to administrator accounts.
        </p>
      </div>
    );
  }

  return (
    <div data-testid="desktop-admin-invitations-screen" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">Invitation Tokens</h1>
            <p className="text-xs text-text-muted">Generate invite-only access for closed registration testers</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loadingList}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border text-xs font-semibold text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${loadingList ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Generate form */}
      <form onSubmit={handleGenerate} className="rounded-2xl border border-border bg-surface p-5 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-text-primary">Generate Invitation</h2>
          <p className="text-xs text-text-muted mt-0.5">Tokens expire after 7 days and can only be redeemed by the bound email.</p>
        </div>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Input
              label="Target Email"
              type="email"
              placeholder="tester@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={generating} className="shrink-0 inline-flex items-center gap-2">
            <Send className="w-4 h-4" />
            {generating ? 'Generating…' : 'Generate & Send Invitation'}
          </Button>
        </div>
        {error && (
          <div className="text-xs text-expense bg-expense/10 border border-expense/20 rounded-lg px-3 py-2">{error}</div>
        )}
      </form>

      {/* Last generated result */}
      {lastResult && (
        <div className="rounded-2xl border border-accent/25 bg-accent/5 p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
            <Check className="w-4 h-4 text-accent" />
            Invitation created for <span className="text-accent">{lastResult.email}</span>
          </div>
          {!lastResult.delivered && (
            <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Email delivery is not configured yet. Copy the token or share link below and send it to the tester manually.</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-surface px-4 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Invitation Token</span>
              <div className="mt-1 flex items-center justify-between gap-2">
                <code className="text-base font-bold tracking-widest text-text-primary">{lastResult.token}</code>
                <button
                  type="button"
                  onClick={() => void copy(lastResult.token)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-surface-hover transition-colors"
                  title="Copy token"
                >
                  {copiedValue === lastResult.token ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-surface px-4 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Share Link</span>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="truncate text-xs text-text-secondary">{lastResult.shareLink}</span>
                <button
                  type="button"
                  onClick={() => void copy(lastResult.shareLink)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-surface-hover transition-colors shrink-0"
                  title="Copy share link"
                >
                  {copiedValue === lastResult.shareLink ? <Check className="w-4 h-4 text-accent" /> : <Link2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History table */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Mail className="w-4 h-4 text-text-muted" />
          <h2 className="text-sm font-bold text-text-primary">Invitation History</h2>
          <span className="text-xs text-text-muted">({invitations.length})</span>
        </div>

        {loadingList ? (
          <div className="px-5 py-10 text-center text-sm text-text-muted">Loading invitations…</div>
        ) : invitations.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-text-muted">
            No invitations yet. Generate the first one above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-text-muted border-b border-border">
                  <th className="px-5 py-3 font-semibold">Email</th>
                  <th className="px-5 py-3 font-semibold">Token</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Expires</th>
                  <th className="px-5 py-3 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((invitation) => {
                  const status = getInvitationStatus(invitation);
                  return (
                    <tr key={invitation.id} className="border-b border-border/60 last:border-0 hover:bg-surface-hover/40">
                      <td className="px-5 py-3 text-text-primary">{invitation.email}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <code className="font-semibold tracking-widest text-text-secondary">{invitation.token}</code>
                          <button
                            type="button"
                            onClick={() => void copy(invitation.token)}
                            className="p-1 rounded-md text-text-muted hover:text-accent hover:bg-surface-hover transition-colors"
                            title="Copy token"
                          >
                            {copiedValue === invitation.token ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${statusStyles[status]}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-text-muted text-xs">
                        {new Date(invitation.expires_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 text-text-muted text-xs">
                        {new Date(invitation.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DesktopAdminInvitationsScreen;

