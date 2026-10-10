import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { formatDate } from '@/lib/format';
import { RemoveMemberDialog, type RemoveMemberTarget } from '@/components/desktop/circle/RemoveMemberDialog';
import { Users2, Copy, Check, ShieldCheck, Heart, UserPlus, LogIn, LogOut, Loader2, UserMinus } from 'lucide-react';

export const CircleMembersManager: React.FC = () => {
  const { household, householdMembers, profile, joinHousehold, leaveHousehold, removeMember } = useApp();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<RemoveMemberTarget | null>(null);
  const [joinError, setJoinError] = useState('');

  const isCircle = householdMembers.length > 1 || household?.mode === 'Circle';
  const isOwner = householdMembers.some((m) => m.user_id === profile?.id && m.role === 'owner');

  const handleCopyInvite = () => {
    if (household?.invite_code) {
      navigator.clipboard.writeText(household.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoin = async () => {
    const code = inviteCode.trim().toUpperCase();
    if (code.length !== 6) {
      setJoinError(t('onboard.inviteInvalid'));
      return;
    }

    setJoinError('');
    setJoining(true);
    try {
      await joinHousehold(code);
      setInviteCode('');
      showToast(t('toast.joined'));
    } catch (err) {
      const message = err instanceof Error ? err.message : t('toast.error');
      const normalizedMessage = message.includes('Circle ini sudah mencapai batas maksimal 10 anggota')
        ? t('profile.joinFull')
        : message.includes('Kode undangan tidak ditemukan')
          ? t('profile.joinNotFound')
          : t('toast.error');
      setJoinError(normalizedMessage);
      showToast(normalizedMessage, 'error');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    setLeaving(true);
    try {
      await leaveHousehold();
      showToast(t('toast.left'));
    } catch (err) {
      const message = err instanceof Error ? err.message : t('toast.error');
      showToast(message, 'error');
    } finally {
      setLeaving(false);
    }
  };

  const confirmRemoveMember = async () => {
    if (!removeTarget) return;
    setRemovingId(removeTarget.userId);
    try {
      await removeMember(removeTarget.userId);
      showToast(t('profile.removeMemberSuccess'));
      setRemoveTarget(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('toast.error');
      showToast(message, 'error');
    } finally {
      setRemovingId(null);
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
              Household Mode: <span className="font-semibold text-text-primary capitalize">{household?.mode || 'Single'} Mode</span> &bull; {householdMembers.length} Active Member(s)
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

      {/* Join a Circle / Already Connected */}
      {isCircle ? (
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <LogOut className="w-4 h-4 text-warning" />
            <h3 className="text-sm font-bold text-text-primary">{t('circle.connectedTitle')}</h3>
          </div>
          <p className="text-xs text-text-muted">
            {t('circle.connectedDesc', { name: household?.name || '' })}
          </p>
          {isOwner ? (
            <p className="text-xs text-text-muted">{t('circle.ownerCannotLeave')}</p>
          ) : (
            <button
              onClick={handleLeave}
              disabled={leaving}
              data-testid="leave-circle-btn"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-expense/10 text-expense text-sm font-semibold border border-expense/20 hover:bg-expense/20 disabled:opacity-50 transition-colors"
            >
              {leaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              <span>{leaving ? t('circle.leaving') : t('circle.leaveBtn')}</span>
            </button>
          )}
        </div>
      ) : (
        <div data-testid="join-circle-card" className="bg-surface p-6 rounded-2xl border border-border shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-bold text-text-primary">{t('circle.joinTitle')}</h3>
          </div>
          <p className="text-xs text-text-muted">{t('circle.joinDesc')}</p>

          <div className="flex flex-col sm:flex-row sm:items-start gap-3">
            <div className="flex-1 space-y-1.5">
              <label htmlFor="join-invite-code" className="block text-xs font-medium text-text-secondary">
                {t('circle.joinInputLabel')}
              </label>
              <input
                id="join-invite-code"
                data-testid="join-invite-code-input"
                value={inviteCode}
                onChange={(e) => {
                  setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
                  if (joinError) setJoinError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !joining) void handleJoin();
                }}
                maxLength={6}
                autoComplete="off"
                placeholder={t('circle.joinPlaceholder')}
                aria-invalid={Boolean(joinError)}
                className={`input-field font-mono tracking-[0.3em] uppercase text-center sm:text-left ${joinError ? 'border-expense focus:ring-expense/30 focus:border-expense' : ''}`}
              />
              {joinError && <p className="text-xs text-expense">{joinError}</p>}
            </div>
            <button
              onClick={handleJoin}
              disabled={joining || inviteCode.trim().length !== 6}
              data-testid="join-circle-btn"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-accent text-accent-text text-sm font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shrink-0"
            >
              {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              <span>{joining ? t('circle.joining') : t('circle.joinBtn')}</span>
            </button>
          </div>
        </div>
      )}

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
                <th className="py-2.5 px-3 font-semibold text-right">{t('circle.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {householdMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-text-muted">
                    No circle members found.
                  </td>
                </tr>
              ) : (
                householdMembers.map((member, idx) => {
                  const mProfile = member.profile;
                  const name = mProfile?.full_name || 'Household Member';
                  const avatar = mProfile?.avatar_url;
                  const canRemove = isOwner && member.role !== 'owner' && member.user_id !== profile?.id;

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
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${
                          member.role === 'owner' ? 'bg-accent/15 text-accent' : 'bg-surface-hover text-text-muted'
                        }`}>
                          {member.role === 'owner' ? t('profile.roleOwner') : t('profile.roleMember')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-text-muted">
                        {formatDate(member.joined_at || new Date().toISOString())}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {canRemove ? (
                          <button
                            type="button"
                            onClick={() =>
                              setRemoveTarget({
                                userId: member.user_id,
                                name,
                                email: mProfile?.email,
                                avatarUrl: mProfile?.avatar_url,
                              })
                            }
                            disabled={removingId === member.user_id}
                            data-testid={`remove-member-${member.user_id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-expense/10 text-expense text-[11px] font-semibold hover:bg-expense/20 disabled:opacity-50 transition-colors"
                          >
                            {removingId === member.user_id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <UserMinus className="w-3.5 h-3.5" />}
                            <span>{t('circle.removeMember')}</span>
                          </button>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Owner confirmation dialog for removing a member */}
      <RemoveMemberDialog
        open={Boolean(removeTarget)}
        member={removeTarget}
        loading={Boolean(removeTarget && removingId === removeTarget.userId)}
        onConfirm={confirmRemoveMember}
        onClose={() => setRemoveTarget(null)}
      />
    </div>
  );
};

