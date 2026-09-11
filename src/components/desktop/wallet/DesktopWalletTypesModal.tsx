import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { DesktopDialog } from '@/components/desktop/ui/DesktopDialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { WALLET_ICON_MAP } from '@/lib/walletIcons';
import { ICON_OPTIONS } from '@/components/CreateWalletTypeSheet';
import { Settings2, Plus, Pencil, Trash2, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { WalletTypeRow } from '@/lib/types';

interface DesktopWalletTypesModalProps {
  open: boolean;
  onClose: () => void;
}

const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

/**
 * Desktop-native "Manage Wallet Types" dialog: add custom wallet types with an
 * icon, edit/delete the custom ones, and review the read-only system defaults.
 * Backed by the same AppContext mutations as the mobile `WalletTypeSettingsSheet`.
 */
export const DesktopWalletTypesModal: React.FC<DesktopWalletTypesModalProps> = ({ open, onClose }) => {
  const { walletTypes, addCustomWalletType, updateWalletType, deleteWalletType, wallets } = useApp();
  const { t } = useLanguage();
  const { showToast } = useToast();

  // Create form
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Wallet');
  const [addError, setAddError] = useState('');
  const [creating, setCreating] = useState(false);

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<WalletTypeRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const customTypes = walletTypes.filter((wt) => !wt.is_system);
  const systemTypes = walletTypes.filter((wt) => wt.is_system);

  const resetCreateForm = () => {
    setName('');
    setIcon('Wallet');
    setAddError('');
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setAddError(t('wallet.typeNameRequired'));
      return;
    }
    setAddError('');
    setCreating(true);
    try {
      await addCustomWalletType(name.trim(), icon);
      resetCreateForm();
      showToast(t('wallet.typeAddedToast'));
    } catch (err) {
      setAddError(err instanceof Error ? err.message : t('wallet.typeFailedAdd'));
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (wt: WalletTypeRow) => {
    setEditingId(wt.id);
    setEditName(wt.name);
    setEditIcon(wt.icon);
    setEditError('');
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    if (!editName.trim()) {
      setEditError(t('wallet.typeNameRequired'));
      return;
    }
    setEditError('');
    setSaving(true);
    try {
      await updateWalletType(editingId, { name: editName.trim(), icon: editIcon });
      setEditingId(null);
      showToast(t('wallet.typeUpdatedToast'));
    } catch (err) {
      setEditError(err instanceof Error ? err.message : t('wallet.typeFailedUpdate'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError('');
    setDeleting(true);
    try {
      await deleteWalletType(deleteTarget.id);
      setDeleteTarget(null);
      showToast(t('wallet.typeDeletedToast'));
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : t('wallet.typeFailedDelete'));
    } finally {
      setDeleting(false);
    }
  };

  const usageCount = (typeId: string) => wallets.filter((w) => w.type === typeId).length;

  const IconPicker = ({ value, onSelect }: { value: string; onSelect: (name: string) => void }) => (
    <div className="grid grid-cols-6 gap-2">
      {ICON_OPTIONS.map(({ name: iconName, icon: Icon }) => (
        <button
          key={iconName}
          type="button"
          onClick={() => onSelect(iconName)}
          aria-pressed={value === iconName}
          data-testid={`wallet-type-icon-${iconName}`}
          className={`flex items-center justify-center rounded-lg border-2 p-2 transition-all ${FOCUS_RING} ${
            value === iconName ? 'border-accent bg-accent/10' : 'border-border bg-surface'
          }`}
        >
          <Icon className={`h-4 w-4 ${value === iconName ? 'text-accent' : 'text-text-muted'}`} />
        </button>
      ))}
    </div>
  );

  return (
    <DesktopDialog
      open={open}
      onClose={onClose}
      title={t('wallet.manageTypesTitle')}
      description={t('walletWs.typesDesc')}
      icon={Settings2}
      maxWidthClass="max-w-2xl"
      testId="desktop-wallet-types-modal"
    >
      <div className="space-y-6">
        {/* Create custom type */}
        <section className="space-y-3 rounded-xl border border-border bg-surface-hover/50 p-4" data-testid="wallet-types-create">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-muted">
            <Plus className="h-3.5 w-3.5" />
            {t('wallet.addNewType')}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end">
            <Input
              label={t('wallet.typeNameLabel')}
              placeholder={t('wallet.typeNamePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="wallet-type-name-input"
            />
            <Button onClick={handleCreate} disabled={creating} data-testid="wallet-type-create-btn">
              {creating ? t('wallet.saving') : t('wallet.saveType')}
            </Button>
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-text-muted">{t('cat.iconLabel')}</label>
            <IconPicker value={icon} onSelect={setIcon} />
          </div>
          {addError && <p className="text-xs text-expense">{addError}</p>}
        </section>

        {/* Current types */}
        <section className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
            {t('walletWs.typesListTitle')}
          </p>

          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
            {/* System defaults (read-only) */}
            {systemTypes.map((wt) => {
              const Icon = WALLET_ICON_MAP[wt.icon] ?? WALLET_ICON_MAP.Wallet;
              return (
                <div key={wt.id} className="flex items-center gap-3 bg-surface px-4 py-3" data-testid={`wallet-type-row-${wt.id}`}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <Icon className="h-4 w-4 text-accent" />
                  </div>
                  <span className="flex-1 truncate text-sm font-medium text-text-primary">{wt.name}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-hover px-2.5 py-1 text-[11px] font-semibold text-text-muted">
                    <ShieldCheck className="h-3 w-3" />
                    {t('walletWs.systemDefault')}
                  </span>
                </div>
              );
            })}

            {/* Custom types (editable) */}
            {customTypes.length === 0 && (
              <p className="bg-surface px-4 py-6 text-center text-xs text-text-muted">
                {t('wallet.noCustomTypes')}
              </p>
            )}

            {customTypes.map((wt) => {
              const Icon = WALLET_ICON_MAP[wt.icon] ?? WALLET_ICON_MAP.Wallet;
              const isEditing = editingId === wt.id;
              if (isEditing) {
                return (
                  <div key={wt.id} className="space-y-3 bg-surface px-4 py-4">
                    <Input
                      label={t('wallet.typeNameLabel')}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                    <div>
                      <label className="mb-2 block text-xs font-medium text-text-muted">{t('cat.iconLabel')}</label>
                      <IconPicker value={editIcon} onSelect={setEditIcon} />
                    </div>
                    {editError && <p className="text-xs text-expense">{editError}</p>}
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" size="sm" onClick={() => setEditingId(null)}>
                        {t('common.cancel')}
                      </Button>
                      <Button size="sm" onClick={handleSaveEdit} disabled={saving}>
                        {saving ? t('wallet.saving') : t('wallet.saveType')}
                      </Button>
                    </div>
                  </div>
                );
              }
              return (
                <div key={wt.id} className="flex items-center gap-3 bg-surface px-4 py-3" data-testid={`wallet-type-row-${wt.id}`}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <Icon className="h-4 w-4 text-accent" />
                  </div>
                  <span className="flex-1 truncate text-sm font-medium text-text-primary">{wt.name}</span>
                  <span className="hidden rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent sm:inline">
                    {t('walletWs.custom')}
                  </span>
                  <span className="hidden text-[11px] text-text-muted md:inline">
                    {usageCount(wt.id)}x
                  </span>
                  <button
                    type="button"
                    onClick={() => startEdit(wt)}
                    aria-label={t('wallet.editType')}
                    data-testid={`wallet-type-edit-${wt.id}`}
                    className={`rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-hover hover:text-accent ${FOCUS_RING}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDeleteTarget(wt); setDeleteError(''); }}
                    aria-label={t('common.delete')}
                    data-testid={`wallet-type-delete-${wt.id}`}
                    className={`rounded-lg p-2 text-expense transition-colors hover:bg-expense/10 ${FOCUS_RING}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Delete confirmation overlay */}
        {deleteTarget && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-float">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-expense/10">
                  <AlertTriangle className="h-6 w-6 text-expense" />
                </div>
                <h3 className="text-base font-bold text-text-primary">{t('wallet.deleteTypeTitle')}</h3>
                <p className="text-xs text-text-muted">
                  {t('wallet.deleteTypeDesc', { name: deleteTarget.name })}
                </p>
                {deleteError && <p className="text-xs text-expense">{deleteError}</p>}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="flex-1 rounded-xl bg-secondary py-2.5 text-sm font-semibold text-text-primary transition-all hover:bg-secondary/80 disabled:opacity-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleting}
                  data-testid="wallet-type-confirm-delete"
                  className="flex-1 rounded-xl bg-expense py-2.5 text-sm font-semibold text-white transition-all hover:bg-expense/90 disabled:opacity-50"
                >
                  {deleting ? t('wallet.saving') : t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DesktopDialog>
  );
};
