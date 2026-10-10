import React from 'react';
import { AlertTriangle, ShieldQuestion } from 'lucide-react';
import { DesktopDialog } from '@/components/desktop/ui/DesktopDialog';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  testId?: string;
}

/**
 * Reusable confirmation dialog for destructive admin actions (delete, unpair,
 * revoke). Wraps the shared `DesktopDialog` shell so styling and focus-trap
 * behavior stay consistent across the dashboard.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading = false,
  onConfirm,
  onClose,
  testId = 'admin-confirm-dialog',
}) => {
  const Icon = tone === 'danger' ? AlertTriangle : ShieldQuestion;
  const iconClass = tone === 'danger' ? 'bg-rose-500/15 text-rose-500' : 'bg-accent/15 text-accent';
  const confirmClass =
    tone === 'danger'
      ? 'bg-rose-600 hover:bg-rose-700 text-white'
      : 'bg-accent text-accent-text hover:opacity-90';

  return (
    <DesktopDialog
      open={open}
      onClose={onClose}
      title={title}
      maxWidthClass="max-w-sm"
      testId={testId}
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="text-sm text-text-secondary">{description}</div>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            data-testid={`${testId}-cancel`}
            className="flex-1 rounded-xl border border-border py-2.5 text-xs font-semibold text-text-muted transition-colors hover:bg-surface-hover disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            data-testid={`${testId}-confirm`}
            className={`flex-1 rounded-xl py-2.5 text-xs font-semibold transition-colors disabled:opacity-60 ${confirmClass}`}
          >
            {loading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </DesktopDialog>
  );
};
