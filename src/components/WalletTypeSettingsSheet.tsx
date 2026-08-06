import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/context/ToastContext';
import { WALLET_ICON_MAP } from '@/lib/walletIcons';
import { ICON_OPTIONS } from '@/components/CreateWalletTypeSheet';
import { Pencil, Trash2 } from 'lucide-react';

interface WalletTypeSettingsSheetProps {
  open: boolean;
  onClose: () => void;
}

export function WalletTypeSettingsSheet({ open, onClose }: WalletTypeSettingsSheetProps) {
  const { walletTypes, updateWalletType, deleteWalletType } = useApp();
  const { showToast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const customTypes = walletTypes.filter((t) => !t.is_system);

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
      setError('Nama tipe wallet wajib diisi');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const updates: { name: string; icon?: string } = { name: editName.trim() };
      if (editIcon) updates.icon = editIcon;
      await updateWalletType(id, updates);
      setEditingId(null);
      showToast('Tipe wallet berhasil diperbarui');
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      setError(msg || 'Gagal memperbarui tipe wallet');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWalletType(id);
      showToast('Tipe wallet berhasil dihapus');
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      setError(msg || 'Gagal menghapus tipe wallet');
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Kelola Tipe Wallet">
      <div className="space-y-4">
        {customTypes.length === 0 && (
          <p className="text-sm text-text-secondary text-center py-6">
            Belum ada tipe wallet kustom. Buat lewat form tambah/edit wallet.
          </p>
        )}

        {customTypes.map((t) => {
          const Icon = WALLET_ICON_MAP[t.icon] ?? WALLET_ICON_MAP.Wallet;
          return (
            <div
              key={t.id}
              className="p-3 rounded-xl border border-secondary bg-secondary space-y-3"
            >
              {editingId === t.id ? (
                <div className="space-y-5">
                  <Input
                    label="Nama Tipe Wallet"
                    placeholder="misal Dana Darurat, Voucher"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Pilih Ikon</label>
                    <div className="grid grid-cols-4 gap-2">
                      {ICON_OPTIONS.map(({ name: iconName, icon: IconOption }) => (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => setEditIcon(iconName)}
                          className={`flex items-center justify-center p-3 rounded-xl border-2 transition-all ${
                            editIcon === iconName ? 'border-primary bg-primary/10' : 'border-secondary bg-secondary'
                          }`}
                        >
                          <IconOption className={`w-5 h-5 ${editIcon === iconName ? 'text-primary' : 'text-text-secondary'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && <p className="text-sm text-expense">{error}</p>}

                  <Button fullWidth onClick={() => saveEdit(t.id)} disabled={saving}>
                    {saving ? 'Menyimpan...' : 'Simpan Tipe Wallet'}
                  </Button>
                  <Button fullWidth variant="secondary" onClick={cancelEdit}>
                    Batal
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-white shrink-0" />
                    <span className="flex-1 text-sm font-medium text-text-primary">{t.name}</span>
                    <button
                      onClick={() => startEdit(t.id, t.name, t.icon)}
                      className="p-2 rounded-lg text-text-secondary hover:bg-secondary-hover"
                      aria-label="Ubah"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-2 rounded-lg text-expense hover:bg-expense/10"
                      aria-label="Hapus"
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
          Tutup
        </Button>
      </div>
    </Sheet>
  );
}