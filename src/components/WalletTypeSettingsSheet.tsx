import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/context/ToastContext';
import { WALLET_ICON_MAP } from '@/lib/walletIcons';
import { ICON_OPTIONS } from '@/components/CreateWalletTypeSheet';
import { CreateWalletTypeSheet } from '@/components/CreateWalletTypeSheet';
import { Pencil, Trash2, Plus } from 'lucide-react';
import type { WalletTypeRow } from '@/lib/types';

interface WalletTypeSettingsSheetProps {
  open: boolean;
  onClose: () => void;
}

export function WalletTypeSettingsSheet({ open, onClose }: WalletTypeSettingsSheetProps) {
  const { walletTypes, updateWalletType, deleteWalletType } = useApp();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WalletTypeRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const customTypes = walletTypes.filter((wt) => !wt.is_system);

  const startEdit = (id: string, name: string, icon: string) => {
    setEditingId(id);
    setEditName(name);
    setEditIcon(icon);
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setError('');
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim()) {
      setError(t('wallet.typeNameRequired'));
      return;
    }
    setError('');
    setSaving(true);
    try {
      const updates: { name: string; icon?: string } = { name: editName.trim() };
      if (editIcon) updates.icon = editIcon;
      await updateWalletType(id, updates);
      setEditingId(null);
      showToast(t('wallet.typeUpdatedToast'));
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      setError(msg || t('wallet.typeFailedUpdate'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteWalletType(deleteTarget.id);
      setDeleteTarget(null);
      showToast(t('wallet.typeDeletedToast'));
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      setError(msg || t('wallet.typeFailedDelete'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title={t('wallet.manageTypesTitle')}>
      <div className="space-y-4">
        {/* Permanent entry point: always visible */}
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-primary/40 text-primary hover:border-primary hover:bg-primary/5 transition-all text-left"
        >
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Plus className="w-5 h-5 text-primary" />
          </div>
          <span className="text-sm font-semibold">{t('wallet.addNewType')}</span>
        </button>

        {customTypes.length === 0 && (
          <p className="text-sm text-text-secondary text-center py-6">
            {t('wallet.noCustomTypes')}
          </p>
        )}

        {customTypes.map((wt) => {
          const Icon = WALLET_ICON_MAP[wt.icon] ?? WALLET_ICON_MAP.Wallet;
          return (
            <div
              key={wt.id}
              className={editingId === wt.id ? 'space-y-3' : 'p-3 rounded-xl border border-secondary bg-secondary space-y-3'}
            >
              {editingId === wt.id ? (
                <div className="space-y-5">
                  <Input
                    label={t('wallet.typeNameLabel')}
                    placeholder={t('wallet.typeNamePlaceholder')}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">{t('cat.iconLabel')}</label>
                    <div className="grid grid-cols-4 gap-2">
                      {ICON_OPTIONS.map(({ name: iconName, icon: IconOption }) => {
                        const isActive = editIcon === iconName;
                        return (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => setEditIcon(iconName)}
                            className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all border-2 ${
                              isActive ? 'border-primary bg-primary/10' : 'border-transparent bg-secondary'
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isActive ? 'bg-primary/20' : 'bg-secondary'}`}>
                              <IconOption className={`w-4.5 h-4.5 ${isActive ? 'text-primary' : 'text-text-secondary'}`} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {error && <p className="text-sm text-expense">{error}</p>}

                  <Button fullWidth onClick={() => saveEdit(wt.id)} disabled={saving}>
                    {saving ? t('wallet.saving') : t('wallet.saveType')}
                  </Button>
                  <Button fullWidth variant="secondary" onClick={cancelEdit}>
                    {t('common.cancel')}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-white shrink-0" />
                    <span className="flex-1 text-sm font-medium text-text-primary">{wt.name}</span>
                    <button
                      onClick={() => startEdit(wt.id, wt.name, wt.icon)}
                      className="p-2 rounded-lg text-text-secondary hover:bg-secondary-hover"
                      aria-label={t('wallet.editType')}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(wt)}
                      className="p-2 rounded-lg text-expense hover:bg-expense/10"
                      aria-label={t('common.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}

        <Button fullWidth variant="secondary" onClick={onClose}>
          {t('common.close')}
        </Button>
      </div>

      <CreateWalletTypeSheet
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {}}
      />

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-surface rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 rounded-full bg-expense/10 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-expense" />
              </div>
              <h3 className="font-display font-bold text-lg text-text-primary">{t('wallet.deleteTypeTitle')}</h3>
              <p className="text-sm text-text-secondary">
                {t('wallet.deleteTypeDesc', { name: deleteTarget.name })}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl font-semibold text-text-primary bg-secondary hover:bg-secondary/80 transition-all disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl font-semibold text-white bg-expense hover:bg-expense/90 transition-all disabled:opacity-50"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </Sheet>
  );
}