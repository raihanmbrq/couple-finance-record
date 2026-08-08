import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AvatarActionSheet } from '@/components/AvatarActionSheet';
import { AvatarCropSheet } from '@/components/AvatarCropSheet';
import { WalletTypeSettingsSheet } from '@/components/WalletTypeSettingsSheet';
import { CategorySettingsSheet } from '@/components/CategorySettingsSheet';
import { CurrencySettingsSheet } from '@/components/CurrencySettingsSheet';
import { ThemeSettingsSheet, getAppearanceLabel, getPresetLabel } from '@/components/ThemeSettingsSheet';
import { useTheme } from '@/context/ThemeContext';
import { getCurrencyInfo } from '@/lib/currencies';
import { User, Mail, Users, LogOut, Copy, Check, X, Wallet, Receipt, PiggyBank, Sparkles, Pencil, Settings2, Coins, Palette, ChevronRight, Loader2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

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
  const [showWalletTypes, setShowWalletTypes] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showCurrency, setShowCurrency] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const isCircle = householdMembers.length > 1 || household?.mode === 'couple';
  const activeCurrency = profile?.currency ?? 'IDR';
  const activeCurrencyInfo = getCurrencyInfo(activeCurrency);
  const { appearanceMode, colorPreset } = useTheme();

  const handleCopy = () => {
    if (household?.invite_code) {
      navigator.clipboard.writeText(household.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoin = async () => {
    if (inviteCode.trim().length !== 6) {
      setJoinError('Invite code must be 6 characters');
      return;
    }

    setJoinError('');
    setJoining(true);
    try {
      await joinHousehold(inviteCode.trim());
      setInviteCode('');
      showToast('Berhasil bergabung ke circle.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Permintaan gagal. Periksa koneksi Anda.';
      const normalizedMessage = message.includes('Circle ini sudah mencapai batas maksimal 10 anggota')
        ? 'Circle ini sudah mencapai batas maksimal 10 anggota.'
        : message.includes('Kode undangan tidak ditemukan')
          ? 'Kode undangan tidak ditemukan. Periksa kembali 6 digit kode Anda.'
          : 'Permintaan gagal. Periksa koneksi Anda.';
      setJoinError(normalizedMessage);
      showToast(normalizedMessage, 'error');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    try {
      await leaveHousehold();
      showToast('Anda keluar dari circle.');
    } catch {
      showToast('Permintaan gagal. Periksa koneksi Anda.', 'error');
    }
  };

  const handleAvatarFileSelected = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('File harus berupa gambar.', 'error');
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
      showToast('Foto profil berhasil diperbarui!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload gagal. Periksa koneksi Anda.';
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
      showToast('Nama tidak boleh kosong.', 'error');
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
      showToast('Nama berhasil diperbarui.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memperbarui nama.';
      showToast(message, 'error');
    } finally {
      setSavingName(false);
    }
  };

  return (
    <div className="px-5 py-5 space-y-5">
      <h1 className="font-display font-extrabold text-2xl text-text-primary">Profile</h1>

      {/* Profile Card */}
      <Card elevated className="p-5">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setShowAvatarAction(true)}
            disabled={uploadingAvatar}
            className="relative shrink-0 disabled:opacity-60"
            aria-label="Opsi foto profil"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-display font-bold text-2xl overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Foto profil" className="w-full h-full object-cover" />
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
                aria-label="Simpan nama"
              >
                {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setEditingName(false)}
                disabled={savingName}
                className="p-2 rounded-xl bg-secondary text-text-secondary disabled:opacity-50"
                aria-label="Batal ubah nama"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={startEditName}
              className="p-2 rounded-xl bg-secondary text-text-secondary"
              aria-label="Ubah nama"
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
              <p className="text-xs text-text-secondary">Mode</p>
              <p className="font-semibold text-sm text-text-primary">
                {isCircle ? `Circle Mode — ${household?.name}` : 'Single Mode'}
              </p>
            </div>
            {isCircle && (
              <Badge color="primary">Connected</Badge>
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
              <h3 className="font-display font-bold text-text-primary">Shared Space Invite</h3>
            </div>
            <p className="text-sm text-text-secondary">Share this code with your partner to join the same circle.</p>
          </div>

          {!showInviteCode ? (
            <Button fullWidth onClick={() => setShowInviteCode(true)}>
              Show Invitation Code
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
                label="Join with invitation code"
                placeholder="6-Invitation Code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="text-center text-xl font-bold tracking-widest"
              />
              {joinError && <p className="text-sm text-expense">{joinError}</p>}
              <Button fullWidth onClick={handleJoin} disabled={joining}>
                {joining ? 'Joining...' : 'Join Circle'}
              </Button>
            </div>
          )}
        </Card>
      )}

      {householdMembers.length > 0 && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-text-primary">Circle Members</h3>
            <Badge color="primary">{householdMembers.length}/10</Badge>
          </div>
          <div className="space-y-3">
            {householdMembers.map((member) => {
              const memberProfile = member.profile;
              const displayName = memberProfile?.full_name || memberProfile?.email || 'Member';
              return (
                <div key={member.user_id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center font-bold text-text-primary">
                    {displayName.charAt(0).toUpperCase()}
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
              Leave Circle
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
              <p className="font-semibold text-sm text-warning">Demo Mode Active</p>
              <p className="text-xs text-text-secondary">You're exploring with sample data. Sign out to use real auth.</p>
            </div>
          </div>
        </Card>
      )}

      {/* Wallet Type Settings */}
      <Card className="p-4">
        <button
          type="button"
          onClick={() => setShowWalletTypes(true)}
          className="w-full flex items-center gap-3 text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Settings2 className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm text-text-primary">Kelola Tipe Wallet</p>
            <p className="text-xs text-text-secondary">Tambah, ubah, atau hapus tipe wallet kustom</p>
          </div>
        </button>
      </Card>

      {/* Category Settings */}
      <Card className="p-4">
        <button
          type="button"
          onClick={() => setShowCategories(true)}
          className="w-full flex items-center gap-3 text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-warning" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm text-text-primary">Kelola Kategori Transaksi</p>
            <p className="text-xs text-text-secondary">Tambah, ubah, atau hapus kategori transaksi kustom</p>
          </div>
        </button>
      </Card>

      {/* Currency Settings */}
      <Card className="p-4">
        <button
          type="button"
          onClick={() => setShowCurrency(true)}
          className="w-full flex items-center gap-3 text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Coins className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm text-text-primary">Mata Uang / Currency</p>
            <p className="text-xs text-text-secondary">Atur mata uang untuk menampilkan nominal</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-sm font-semibold text-text-primary">
              {activeCurrency} ({activeCurrencyInfo.symbol})
            </span>
            <ChevronRight className="w-4 h-4 text-text-secondary" />
          </div>
        </button>
      </Card>

      {/* Theme Settings */}
      <Card className="p-4">
        <button
          type="button"
          onClick={() => setShowTheme(true)}
          className="w-full flex items-center gap-3 text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Palette className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm text-text-primary">Tema Aplikasi / App Theme</p>
            <p className="text-xs text-text-secondary">Pilih tampilan warna aplikasi</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-sm font-semibold text-text-primary">
              {getAppearanceLabel(appearanceMode)} · {getPresetLabel(colorPreset)}
            </span>
            <ChevronRight className="w-4 h-4 text-text-secondary" />
          </div>
        </button>
      </Card>

      {/* Sign Out */}
      <Button variant="danger" fullWidth onClick={signOut}>
        <LogOut className="w-5 h-5 inline mr-2" />
        Sign Out
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
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={profile.avatar_url}
            alt="Foto profil"
            className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      <WalletTypeSettingsSheet open={showWalletTypes} onClose={() => setShowWalletTypes(false)} />
      <CategorySettingsSheet open={showCategories} onClose={() => setShowCategories(false)} />
      <CurrencySettingsSheet open={showCurrency} onClose={() => setShowCurrency(false)} />
      <ThemeSettingsSheet open={showTheme} onClose={() => setShowTheme(false)} />
    </div>
  );
}