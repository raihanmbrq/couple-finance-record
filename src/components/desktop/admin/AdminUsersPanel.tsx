import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { AdminDataTable, type AdminColumn } from '@/components/desktop/admin/AdminDataTable';
import { ConfirmDialog } from '@/components/desktop/admin/ConfirmDialog';
import { DesktopDialog } from '@/components/desktop/ui/DesktopDialog';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/format';
import { listAdminProfiles, adminUpdateProfile, adminSetAdmin, adminSetDeactivated } from '@/lib/adminApi';
import { Eye, Pencil, ShieldCheck, ShieldOff, UserX, UserCheck, RefreshCw, AlertTriangle } from 'lucide-react';
import type { AdminProfileRow, UserRole } from '@/lib/types';

const ROLE_OPTIONS: UserRole[] = ['single', 'suami', 'istri', 'partner', 'owner', 'member'];

export const AdminUsersPanel: React.FC = () => {
  const { profile } = useApp();
  const { showToast } = useToast();

  const [rows, setRows] = useState<AdminProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [detail, setDetail] = useState<AdminProfileRow | null>(null);
  const [editing, setEditing] = useState<AdminProfileRow | null>(null);
  const [editForm, setEditForm] = useState<{ full_name: string; role: UserRole; currency: string }>({
    full_name: '',
    role: 'single',
    currency: 'IDR',
  });
  const [saving, setSaving] = useState(false);

  const [adminTarget, setAdminTarget] = useState<{ row: AdminProfileRow; next: boolean } | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<{ row: AdminProfileRow; next: boolean } | null>(null);
  const [mutating, setMutating] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRows(await listAdminProfiles());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openEdit = (row: AdminProfileRow) => {
    setEditing(row);
    setEditForm({ full_name: row.full_name ?? '', role: row.role ?? 'single', currency: row.currency ?? 'IDR' });
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await adminUpdateProfile(editing.id, {
        full_name: editForm.full_name.trim(),
        role: editForm.role,
        currency: editForm.currency,
      });
      showToast('Profile updated successfully.', 'success');
      setEditing(null);
      await refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAdmin = async () => {
    if (!adminTarget) return;
    setMutating(true);
    try {
      await adminSetAdmin(adminTarget.row.id, adminTarget.next);
      showToast(adminTarget.next ? 'Admin access granted.' : 'Admin access revoked.', 'success');
      setAdminTarget(null);
      await refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update admin status.', 'error');
    } finally {
      setMutating(false);
    }
  };

  const handleToggleDeactivate = async () => {
    if (!deactivateTarget) return;
    setMutating(true);
    try {
      await adminSetDeactivated(deactivateTarget.row.id, deactivateTarget.next);
      showToast(deactivateTarget.next ? 'Account deactivated.' : 'Account reactivated.', 'success');
      setDeactivateTarget(null);
      await refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update account status.', 'error');
    } finally {
      setMutating(false);
    }
  };

  const columns = useMemo<AdminColumn<AdminProfileRow>[]>(
    () => [
      {
        key: 'email',
        header: 'Email',
        sortable: true,
        accessor: (r) => r.email,
        render: (r) => (
          <div className="flex flex-col">
            <span className="font-semibold text-text-primary">{r.email}</span>
            {r.id === profile?.id && <span className="text-[10px] font-semibold uppercase text-accent">You</span>}
          </div>
        ),
      },
      {
        key: 'full_name',
        header: 'Full Name',
        sortable: true,
        accessor: (r) => r.full_name,
        render: (r) => <span className="text-text-primary">{r.full_name || '—'}</span>,
      },
      {
        key: 'household',
        header: 'Household',
        sortable: true,
        accessor: (r) => r.household_name ?? '',
        render: (r) => (
          <span className="text-text-muted">
            {r.household_name || (r.household_id ? r.household_id.slice(0, 8) : '—')}
          </span>
        ),
      },
      {
        key: 'is_first_login',
        header: 'First Login',
        sortable: true,
        accessor: (r) => (r.is_first_login ? 1 : 0),
        render: (r) => <Badge color={r.is_first_login ? 'warning' : 'income'}>{r.is_first_login ? 'Pending' : 'Done'}</Badge>,
      },
      {
        key: 'is_admin',
        header: 'Role',
        sortable: true,
        accessor: (r) => (r.is_admin ? 1 : 0),
        render: (r) =>
          r.is_admin ? (
            <Badge color="primary">
              <ShieldCheck className="h-3 w-3" /> Admin
            </Badge>
          ) : (
            <span className="text-xs capitalize text-text-muted">{r.role}</span>
          ),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        accessor: (r) => (r.deactivated_at ? 0 : 1),
        render: (r) =>
          r.deactivated_at ? <Badge color="expense">Deactivated</Badge> : <Badge color="income">Active</Badge>,
      },
      {
        key: 'created_at',
        header: 'Created',
        sortable: true,
        accessor: (r) => new Date(r.created_at).getTime(),
        render: (r) => <span className="text-xs text-text-muted">{formatDate(r.created_at)}</span>,
      },
    ],
    [profile?.id],
  );

  const actionButton =
    'inline-flex items-center justify-center rounded-lg border border-border p-1.5 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary disabled:opacity-40';

  return (
    <div className="space-y-4" data-testid="admin-users-panel">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-text-primary">Users &amp; Profiles</h2>
          <p className="text-xs text-text-muted">{rows.length} account(s) in the database</p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-text-muted transition-colors hover:bg-surface-hover disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && <div className="rounded-lg border border-expense/20 bg-expense/10 px-3 py-2 text-xs text-expense">{error}</div>}

      {/* RLS diagnostic: an admin should see every profile. If only the caller's
          own row appears, the admin migration was not applied to this project. */}
      {!loading && rows.length <= 1 && rows[0]?.id === profile?.id && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-600">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Only your own account is visible. This means the admin RLS policy is missing — run the migration{' '}
            <code className="font-semibold">20261011000000_admin_console.sql</code> in the Supabase SQL editor, then hit
            Refresh.
          </span>
        </div>
      )}

      <AdminDataTable<AdminProfileRow>
        rows={rows}
        columns={columns}
        getRowId={(r) => r.id}
        loading={loading}
        testId="admin-users-table"
        searchText={(r) => `${r.email} ${r.full_name} ${r.household_name ?? ''}`}
        searchPlaceholder="Search users by email, name or household…"
        emptyMessage="No users found."
        renderActions={(row) => (
          <div className="flex items-center justify-end gap-1.5">
            <button type="button" title="View detail" className={actionButton} onClick={() => setDetail(row)}>
              <Eye className="h-3.5 w-3.5" />
            </button>
            <button type="button" title="Edit profile" className={actionButton} onClick={() => openEdit(row)}>
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title={row.is_admin ? 'Revoke admin' : 'Grant admin'}
              className={actionButton}
              disabled={row.id === profile?.id}
              onClick={() => setAdminTarget({ row, next: !row.is_admin })}
            >
              {row.is_admin ? <ShieldOff className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              title={row.deactivated_at ? 'Reactivate account' : 'Deactivate account'}
              className={actionButton}
              disabled={row.id === profile?.id}
              onClick={() => setDeactivateTarget({ row, next: !row.deactivated_at })}
            >
              {row.deactivated_at ? <UserCheck className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
            </button>
          </div>
        )}
      />

      {/* Detail modal */}
      <DesktopDialog open={Boolean(detail)} onClose={() => setDetail(null)} title="User Detail" maxWidthClass="max-w-md" testId="admin-user-detail">
        {detail && (
          <dl className="space-y-3 text-sm">
            {([
              ['Email', detail.email],
              ['Full Name', detail.full_name || '—'],
              ['User ID', detail.id],
              ['Household', detail.household_name || detail.household_id || '—'],
              ['Role', detail.role],
              ['Admin', detail.is_admin ? 'Yes' : 'No'],
              ['First Login Pending', detail.is_first_login ? 'Yes' : 'No'],
              ['Status', detail.deactivated_at ? `Deactivated ${formatDate(detail.deactivated_at)}` : 'Active'],
              ['Created At', formatDate(detail.created_at)],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-4 border-b border-border/60 pb-2 last:border-0">
                <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</dt>
                <dd className="break-all text-right text-text-primary">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </DesktopDialog>

      {/* Edit modal */}
      <DesktopDialog open={Boolean(editing)} onClose={() => setEditing(null)} title="Edit Profile" maxWidthClass="max-w-md" testId="admin-user-edit">
        {editing && (
          <div className="space-y-4">
            <Input
              label="Full Name"
              value={editForm.full_name}
              onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))}
            />
            <Select
              label="Role"
              value={editForm.role}
              onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value as UserRole }))}
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </Select>
            <Input
              label="Currency"
              value={editForm.currency}
              onChange={(e) => setEditForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))}
            />
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditing(null)}
                disabled={saving}
                className="flex-1 rounded-xl border border-border py-2.5 text-xs font-semibold text-text-muted hover:bg-surface-hover disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSaveEdit()}
                disabled={saving}
                className="flex-1 rounded-xl bg-accent py-2.5 text-xs font-semibold text-accent-text hover:opacity-90 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </DesktopDialog>

      {/* Toggle admin confirm */}
      <ConfirmDialog
        open={Boolean(adminTarget)}
        title={adminTarget?.next ? 'Grant Admin Access?' : 'Revoke Admin Access?'}
        description={
          adminTarget && (
            <span>
              {adminTarget.next ? 'Grant' : 'Revoke'} admin access for{' '}
              <strong className="text-text-primary">{adminTarget.row.email}</strong>?
            </span>
          )
        }
        confirmLabel={adminTarget?.next ? 'Grant Admin' : 'Revoke Admin'}
        tone={adminTarget?.next ? 'primary' : 'danger'}
        loading={mutating}
        onConfirm={() => void handleToggleAdmin()}
        onClose={() => setAdminTarget(null)}
        testId="admin-confirm-toggle-admin"
      />

      {/* Deactivate confirm */}
      <ConfirmDialog
        open={Boolean(deactivateTarget)}
        title={deactivateTarget?.next ? 'Deactivate Account?' : 'Reactivate Account?'}
        description={
          deactivateTarget && (
            <span>
              {deactivateTarget.next ? (
                <>
                  Deactivating <strong className="text-text-primary">{deactivateTarget.row.email}</strong> blocks
                  their sign-in. Their data is preserved.
                </>
              ) : (
                <>
                  Reactivate <strong className="text-text-primary">{deactivateTarget.row.email}</strong> so they can
                  sign in again?
                </>
              )}
            </span>
          )
        }
        confirmLabel={deactivateTarget?.next ? 'Deactivate' : 'Reactivate'}
        tone={deactivateTarget?.next ? 'danger' : 'primary'}
        loading={mutating}
        onConfirm={() => void handleToggleDeactivate()}
        onClose={() => setDeactivateTarget(null)}
        testId="admin-confirm-deactivate"
      />
    </div>
  );
};

export default AdminUsersPanel;
