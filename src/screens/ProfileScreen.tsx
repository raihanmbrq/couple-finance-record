import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AvatarActionSheet } from '@/components/AvatarActionSheet';
import { AvatarCropSheet } from '@/components/AvatarCropSheet';
import { useLanguage } from '@/context/LanguageContext';
import { User, Mail, Users, LogOut, Copy, Check, X, Wallet, Receipt, PiggyBank, Sparkles, Pencil, Settings2, Loader2, ChevronRight } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { SettingsScreen } from './SettingsScreen';

export function ProfileScreen() {
  const { profile, household, householdMembers, wallets, transactions, budgets, isDemo, signOut, joinHousehold, leaveHousehold, updateAvatar, updateProfile } = useApp();
  const { showToast } = useToast();
  const [showAvatarAction, setShowAvatarAction] = useState(false);
  const [showAvatarView, setShowAvatarView] = useState(false);
  const [showCrop, setShowCrop] = useState(false);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const isCircle = householdMembers.length > 1 || household?.mode === 'couple';
  const { t } = useLanguage();

  const handleCopy = () => {
    if (household?.invite_code) {
      navigator.clipboard.writeText(household.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoin = async () => {
    if (inviteCode.trim().length !== 6) {
      setJoinError(t('onboard.inviteInvalid'));
      return;
    }

    setJoinError('');
    setJoining(true);
    try {
      await joinHousehold(inviteCode.trim());
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
    try {
      await leaveHousehold();
      showToast(t('toast.left'));
    } catch {
      showToast(t('toast.error'), 'error');
    }
  };

  const handleAvatarFileSelected = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast(t('profile.avatarNotImage'), 'error');
      return;
    }
    setCropSource(URL.createObjectURL(file));
    setShowCrop(true);
  };

  const handleSaveCroppedAvatar = async (file: File) => {
    setUploadingAvatar(true);
    try {
      await updateAvatar(file);
      setShowCrop(false);
      showToast(t('profile.avatarUpdated'));
    } catch (err) {
      const message = err instanceof Error ? err.message : t('profile.avatarUploadFailed');
      showToast(message, 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const startEditName = () => {
    setNameDraft(profile?.full_name ?? '');
    setEditingName(true);
  };

  const saveName = async () => {
    if (!profile || !editingName) return;
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      showToast(t('profile.nameEmpty'), 'error');
      return;
    }
    if (trimmed === profile.full_name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      await updateProfile({ full_name: trimmed });
      setEditingName(false);
      showToast(t('profile.nameUpdated'));
    } catch (err) {
      const message = err instanceof Error ? err.message : t('profile.nameUpdateFailed');
      showToast(message, 'error');
    } finally {
      setSavingName(false);
    }
  };

  return (
    <div className="px-5 py-5 space-y-5">
      <h1 className="font-display font-extrabold text-2xl text-text-primary">{t('profile.title')}</h1>

      {/* Profile Card */}
      <Card elevated className="p-5">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setShowAvatarAction(true)}
            disabled={uploadingAvatar}
            className="relative shrink-0 disabled:opacity-60"
            aria-label={t('profile.avatarOptions')}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-display font-bold text-2xl overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={t('profile.avatarAlt')} className="w-full h-full object-cover" />
              ) : (
                profile?.full_name?.charAt(0).toUpperCase() ?? 'U'
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
          </button>
          <div className="flex-1 min-w-0">
            {editingName ? (
              <input
                autoFocus
                type="text"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveName();
                  if (e.key === 'Escape') setEditingName(false);
                }}
                disabled={savingName}
                className="w-full font-display font-bold text-lg text-text-primary bg-secondary rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-primary border border-transparent disabled:opacity-60"
              />
            ) : (
              <h2 className="font-display font-bold text-lg text-text-primary truncate">{profile?.full_name ?? 'User'}</h2>
            )}
            <p className="text-sm text-text-secondary truncate flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              {profile?.email ?? '—'}
            </p>
          </div>
          {editingName ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={saveName}
                disabled={savingName}
                className="p-2 rounded-xl bg-primary/10 text-primary disabled:opacity-50"
                aria-label={t('profile.saveName')}
              >
                {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setEditingName(false)}
                disabled={savingName}
                className="p-2 rounded-xl bg-secondary text-text-secondary disabled:opacity-50"
                aria-label={t('profile.cancelEditName')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={startEditName}
              className="p-2 rounded-xl bg-secondary text-text-secondary"
              aria-label={t('profile.editName')}
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Household Status */}
        <div className="mt-4 pt-4 border-t border-secondary">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isCircle ? 'bg-warning/10' : 'bg-primary/10'}`}>
              {isCircle ? <Users className="w-5 h-5 text-warning" /> : <User className="w-5 h-5 text-primary" />}
            </div>
            <div className="flex-1">
              <p className="text-xs text-text-secondary">{t('profile.mode')}</p>
              <p className="font-semibold text-sm text-text-primary">
                {isCircle ? t('topbar.circleMode', { name: household?.name ?? '' }) : t('topbar.singleMode')}
              </p>
            </div>
            {isCircle && (
              <Badge color="primary">{t('profile.connected')}</Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Shared Space Code */}
      {household?.invite_code && (
        <Card className="p-5 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-text-primary">{t('profile.inviteTitle')}</h3>
            </div>
            <p className="text-sm text-text-secondary">{t('profile.inviteDesc')}</p>
          </div>

          {!showInviteCode ? (
            <Button fullWidth onClick={() => setShowInviteCode(true)}>
              {t('profile.inviteBtn')}
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex-1 px-4 py-3 rounded-xl bg-secondary border border-secondary">
                <p className="font-display font-extrabold text-2xl tracking-widest text-text-primary text-center">
                  {household.invite_code}
                </p>
              </div>
              <button
                onClick={handleCopy}
                className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          )}

          {!isCircle && (
            <div className="space-y-3 pt-2 border-t border-secondary">
              <Input
                label={t('profile.joinCodeLabel')}
                placeholder={t('profile.joinCodePlaceholder')}
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="text-center text-xl font-bold tracking-widest"
              />
              {joinError && <p className="text-sm text-expense">{joinError}</p>}
              <Button fullWidth onClick={handleJoin} disabled={joining}>
                {joining ? t('profile.joining') : t('profile.joinCircle')}
              </Button>
            </div>
          )}
        </Card>
      )}

      {householdMembers.length > 0 && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-text-primary">{t('profile.members')}</h3>
            <Badge color="primary">{householdMembers.length}/10</Badge>
          </div>
          <div className="space-y-3">
            {householdMembers.map((member) => {
              const memberProfile = member.profile;
              const displayName = memberProfile?.full_name || memberProfile?.email || 'Member';
              return (
                <div key={member.user_id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center font-bold text-text-primary overflow-hidden">
                    {memberProfile?.avatar_url ? (
                      <img src={memberProfile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      displayName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-text-primary truncate">{displayName}</p>
                    <p className="text-xs text-text-secondary truncate">{memberProfile?.email ?? '—'}</p>
                  </div>
                  {/*{ <Badge>{member.role}</Badge> }  hide role badge for now */}
                </div>
              );
            })}
          </div>
          {isCircle && (
            <Button variant="danger" fullWidth onClick={handleLeave}>
              {t('profile.leaveCircle')}
            </Button>
          )}
        </Card>
      )}

      {/* Stats */}
      <div className="hidden grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <p className="font-display font-bold text-xl text-text-primary">{wallets.length}</p>
          <p className="text-xs text-text-secondary">Wallets</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center mx-auto mb-2">
            <Receipt className="w-5 h-5 text-warning" />
          </div>
          <p className="font-display font-bold text-xl text-text-primary">{transactions.length}</p>
          <p className="text-xs text-text-secondary">Transactions</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <PiggyBank className="w-5 h-5 text-primary" />
          </div>
          <p className="font-display font-bold text-xl text-text-primary">{budgets.length}</p>
          <p className="text-xs text-text-secondary">Budgets</p>
        </Card>
      </div>

      {/* Demo badge */}
      {isDemo && (
        <Card className="p-4 border-2 border-dashed border-warning/40 bg-warning/10">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-warning" />
            <div>
              <p className="font-semibold text-sm text-warning">{t('profile.demoActive')}</p>
              <p className="text-xs text-text-secondary">{t('profile.demoDesc')}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Settings / Pengaturan */}
      <Card className="p-4">
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          className="w-full flex items-center gap-3 text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Settings2 className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm text-text-primary">{t('profile.settings')}</p>
            <p className="text-xs text-text-secondary">{t('profile.settingsDesc')}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-text-secondary" />
        </button>
      </Card>

      {/* Sign Out */}
      <Button variant="danger" fullWidth onClick={signOut}>
        <LogOut className="w-5 h-5 inline mr-2" />
        {t('profile.signOut')}
      </Button>

      <AvatarActionSheet
        open={showAvatarAction}
        onClose={() => setShowAvatarAction(false)}
        hasAvatar={!!profile?.avatar_url}
        onView={() => setShowAvatarView(true)}
        onFileSelected={handleAvatarFileSelected}
      />
      <AvatarCropSheet
        open={showCrop}
        onClose={() => {
          setShowCrop(false);
          setCropSource(null);
        }}
        imageSrc={cropSource}
        onSave={handleSaveCroppedAvatar}
      />

      {showAvatarView && profile?.avatar_url && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
          onClick={() => setShowAvatarView(false)}
        >
          <button
            type="button"
            onClick={() => setShowAvatarView(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label={t('profile.close')}
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={profile.avatar_url}
            alt={t('profile.avatarAlt')}
            className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      <SettingsScreen open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}