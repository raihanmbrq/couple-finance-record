import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { AdminDataTable, type AdminColumn } from '@/components/desktop/admin/AdminDataTable';
import { ConfirmDialog } from '@/components/desktop/admin/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getInvitationStatus, type InvitationStatus, type InvitationToken } from '@/lib/types';
import {
  listAdminInvitations,
  adminCreateInvitation,
  adminResendInvitation,
  adminRevokeInvitation,
  adminDeleteInvitation,
  type AdminInvitationResult,
} from '@/lib/adminApi';
import { Send, Copy, Check, RefreshCw, RotateCw, Ban, Trash2, Link2, AlertTriangle } from 'lucide-react';

const statusStyles: Record<InvitationStatus, string> = {
  pending: 'bg-amber-500/15 text-amber-600 border-amber-500/25',
  used: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/25',
  expired: 'bg-rose-500/15 text-rose-600 border-rose-500/25',
};

export const AdminInvitationsPanel: React.FC = () => {
  const { profile } = useApp();
  const { showToast } = useToast();

  const [rows, setRows] = useState<InvitationToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [generating, setGenerating] = useState(false);
  const [lastResult, setLastResult] = useState<AdminInvitationResult | null>(null);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const [revokeTarget, setRevokeTarget] = useState<InvitationToken | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InvitationToken | null>(null);
  const [mutating, setMutating] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRows(await listAdminInvitations());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invitations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(value);
      showToast('Copied to clipboard.', 'success');
      setTimeout(() => setCopiedValue((current) => (current === value ? null : current)), 2000);
    } catch {
      showToast('Could not copy to clipboard.', 'error');
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
      showToast('Enter a valid email address.', 'error');
      return;
    }
    if (!profile) return;
    setGenerating(true);
    try {
      const result = await adminCreateInvitation(profile.id, target);
      setLastResult(result);
      setEmail('');
      showToast(`Invitation created for ${result.invitation.email}.`, 'success');
      await refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to generate invitation.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleResend = async (row: InvitationToken) => {
    setMutating(true);
    try {
      const result = await adminResendInvitation(row);
      setLastResult(result);
      showToast(`New token generated for ${row.email}. Copy the share link to resend.`, 'success');
      await refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to resend invitation.', 'error');
    } finally {
      setMutating(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    setMutating(true);
    try {
      await adminRevokeInvitation(revokeTarget.id);
      showToast('Invitation revoked.', 'success');
      setRevokeTarget(null);
      await refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to revoke invitation.', 'error');
    } finally {
      setMutating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setMutating(true);
    try {
      await adminDeleteInvitation(deleteTarget.id);
      showToast('Invitation deleted.', 'success');
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete invitation.', 'error');
    } finally {
      setMutating(false);
    }
  };

  const columns = useMemo<AdminColumn<InvitationToken>[]>(
    () => [
      {
        key: 'email',
        header: 'Email Target',
        sortable: true,
        accessor: (r) => r.email,
        render: (r) => <span className="font-semibold text-text-primary">{r.email}</span>,
      },
      {
        key: 'token',
        header: 'Token Code',
        sortable: true,
        accessor: (r) => r.token,
        render: (r) => (
          <div className="flex items-center gap-2">
            <code className="font-semibold tracking-widest text-text-secondary">{r.token}</code>
            <button
              type="button"
              onClick={() => void copy(r.token)}
              className="rounded-md p-1 text-text-muted transition-colors hover:bg-surface-hover hover:text-accent"
              title="Copy token"
            >
              {copiedValue === r.token ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        accessor: (r) => getInvitationStatus(r),
        render: (r) => {
          const status = getInvitationStatus(r);
          return (
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${statusStyles[status]}`}>
              {status}
            </span>
          );
        },
      },
      {
        key: 'expires_at',
        header: 'Expires',
        sortable: true,
        accessor: (r) => new Date(r.expires_at).getTime(),
        render: (r) => <span className="text-xs text-text-muted">{new Date(r.expires_at).toLocaleDateString()}</span>,
      },
      {
        key: 'created_at',
        header: 'Created',
        sortable: true,
        accessor: (r) => new Date(r.created_at).getTime(),
        render: (r) => <span className="text-xs text-text-muted">{new Date(r.created_at).toLocaleDateString()}</span>,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [copiedValue],
  );

  const actionButton =
    'inline-flex items-center justify-center rounded-lg border border-border p-1.5 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary disabled:opacity-40';

  return (
    <div className="space-y-4" data-testid="admin-invitations-panel">
      {/* Generate form */}
      <form onSubmit={handleGenerate} className="space-y-4 rounded-2xl border border-border bg-surface p-5">
        <div>
          <h2 className="text-sm font-bold text-text-primary">Generate Invitation</h2>
          <p className="mt-0.5 text-xs text-text-muted">
            Tokens expire after 7 days and can only be redeemed by the bound email. Email delivery is not configured —
            copy the token / share link and send it manually.
          </p>
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
          <Button type="submit" disabled={generating} className="inline-flex shrink-0 items-center gap-2">
            <Send className="h-4 w-4" />
            {generating ? 'Generating…' : 'Generate Invitation'}
          </Button>
        </div>
      </form>

      {lastResult && (
        <div className="space-y-3 rounded-2xl border border-accent/25 bg-accent/5 p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
            <Check className="h-4 w-4 text-accent" />
            Invitation for <span className="text-accent">{lastResult.invitation.email}</span>
          </div>
          {!lastResult.emailResult.delivered && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-600">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{lastResult.emailResult.reason ?? 'Email not sent — copy the link below.'}</span>
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface px-4 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Token</span>
              <div className="mt-1 flex items-center justify-between gap-2">
                <code className="text-base font-bold tracking-widest text-text-primary">{lastResult.invitation.token}</code>
                <button type="button" onClick={() => void copy(lastResult.invitation.token)} className="rounded-lg p-1.5 text-text-muted hover:bg-surface-hover hover:text-accent" title="Copy token">
                  {copiedValue === lastResult.invitation.token ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-surface px-4 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Share Link</span>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="truncate text-xs text-text-secondary">{lastResult.shareLink}</span>
                <button type="button" onClick={() => void copy(lastResult.shareLink)} className="shrink-0 rounded-lg p-1.5 text-text-muted hover:bg-surface-hover hover:text-accent" title="Copy share link">
                  {copiedValue === lastResult.shareLink ? <Check className="h-4 w-4 text-accent" /> : <Link2 className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && <div className="rounded-lg border border-expense/20 bg-expense/10 px-3 py-2 text-xs text-expense">{error}</div>}

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-text-primary">Invitation History</h2>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-text-muted transition-colors hover:bg-surface-hover disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <AdminDataTable<InvitationToken>
        rows={rows}
        columns={columns}
        getRowId={(r) => r.id}
        loading={loading}
        testId="admin-invitations-table"
        searchText={(r) => `${r.email} ${r.token}`}
        searchPlaceholder="Search invitations by email or token…"
        emptyMessage="No invitations yet."
        renderActions={(row) => {
          const status = getInvitationStatus(row);
          return (
            <div className="flex items-center justify-end gap-1.5">
              <button type="button" title="Resend (new token)" className={actionButton} disabled={mutating} onClick={() => void handleResend(row)}>
                <RotateCw className="h-3.5 w-3.5" />
              </button>
              <button type="button" title="Revoke" className={actionButton} disabled={mutating || status !== 'pending'} onClick={() => setRevokeTarget(row)}>
                <Ban className="h-3.5 w-3.5" />
              </button>
              <button type="button" title="Delete" className={actionButton} disabled={mutating} onClick={() => setDeleteTarget(row)}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        }}
      />

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        title="Revoke Invitation?"
        description={
          revokeTarget && (
            <span>
              Revoke the pending invitation for <strong className="text-text-primary">{revokeTarget.email}</strong>? The
              token will expire immediately and can no longer be redeemed.
            </span>
          )
        }
        confirmLabel="Revoke"
        loading={mutating}
        onConfirm={() => void handleRevoke()}
        onClose={() => setRevokeTarget(null)}
        testId="admin-confirm-revoke"
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Invitation?"
        description={
          deleteTarget && (
            <span>
              Permanently delete the token for <strong className="text-text-primary">{deleteTarget.email}</strong>? This
              cannot be undone.
            </span>
          )
        }
        confirmLabel="Delete"
        loading={mutating}
        onConfirm={() => void handleDelete()}
        onClose={() => setDeleteTarget(null)}
        testId="admin-confirm-delete-invitation"
      />
    </div>
  );
};

export default AdminInvitationsPanel;
