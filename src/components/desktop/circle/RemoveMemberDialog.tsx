import React from 'react';
import { DesktopDialog } from '@/components/desktop/ui/DesktopDialog';
import { useLanguage } from '@/context/LanguageContext';
import { AlertTriangle, Loader2, UserMinus } from 'lucide-react';

export interface RemoveMemberTarget {
  userId: string;
  name: string;
  email?: string | null;
  avatarUrl?: string | null;
}

interface RemoveMemberDialogProps {
  open: boolean;
  member: RemoveMemberTarget | null;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Custom confirmation dialog shown to a circle owner before removing a member.
 * Replaces the native `window.confirm` with a themed dialog that surfaces who
 * is being removed and what happens to their data.
 */
export const RemoveMemberDialog: React.FC<RemoveMemberDialogProps> = ({
  open,
  member,
  loading = false,
  onConfirm,
  onClose,
}) => {
  const { t } = useLanguage();
  const initial = member?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <DesktopDialog
      open={open && Boolean(member)}
      onClose={loading ? () => {} : onClose}
      title={t('circle.removeMemberTitle')}
      maxWidthClass="max-w-md"
      testId="remove-member-dialog"
    >
      {member && (
        <div className="space-y-5">
          {/* Prompt */}
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-expense/15 text-expense">
              <UserMinus className="h-5 w-5" />
            </div>
            <p className="text-sm text-text-secondary">
              {t('profile.removeMemberConfirm', { name: member.name })}
            </p>
          </div>

          {/* Member identity */}
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-hover/60 px-4 py-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-expense/15 font-bold text-expense">
              {member.avatarUrl ? (
                <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
              ) : (
                initial
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text-primary">{member.name}</p>
              {member.email && <p className="truncate text-xs text-text-muted">{member.email}</p>}
            </div>
          </div>

          {/* Consequence note */}
          <div className="flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning/10 p-3.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <p className="text-xs text-text-secondary">
              {t('circle.removeMemberWarning', { name: member.name })}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              data-testid="remove-member-dialog-cancel"
              className="flex-1 rounded-xl border border-border py-2.5 text-xs font-semibold text-text-muted transition-colors hover:bg-surface-hover disabled:opacity-60"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              data-testid="remove-member-dialog-confirm"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <UserMinus className="h-3.5 w-3.5" />
              )}
              {loading ? t('circle.removeMemberRemoving') : t('circle.removeMemberConfirmBtn')}
            </button>
          </div>
        </div>
      )}
    </DesktopDialog>
  );
};
