import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/context/ToastContext';
import { WALLET_ICON_MAP } from '@/lib/walletIcons';
import { Pencil, Trash2, Check, X } from 'lucide-react';

interface WalletTypeSettingsSheetProps {
  open: boolean;
  onClose: () => void;
}

export function WalletTypeSettingsSheet({ open, onClose }: WalletTypeSettingsSheetProps) {
  const { walletTypes, updateWalletType, deleteWalletType } = useApp();
  const { showToast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState('');

  const customTypes = walletTypes.filter((t) => !t.is_system);

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
    setError('');
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim()) {
      setError('Nama tipe wallet wajib diisi');
      return;
    }
    setError('');
    try {
      await updateWalletType(id, { name: editName.trim() });
      setEditingId(null);
      showToast('Tipe wallet berhasil diperbarui');
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      setError(msg || 'Gagal memperbarui tipe wallet');
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
              className="flex items-center gap-3 p-3 rounded-xl border border-secondary bg-secondary"
            >
              <Icon className="w-5 h-5 text-primary shrink-0" />
              {editingId === t.id ? (
                <>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Nama tipe"
                  />
                  <button
                    onClick={() => saveEdit(t.id)}
                    className="p-2 rounded-lg text-primary hover:bg-primary/10"
                    aria-label="Simpan"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-2 rounded-lg text-text-secondary hover:bg-secondary-hover"
                    aria-label="Batal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium text-text-primary">{t.name}</span>
                  <button
                    onClick={() => startEdit(t.id, t.name)}
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
                </>
              )}
            </div>
          );
        })}

        {error && <p className="text-sm text-expense">{error}</p>}

        <Button fullWidth variant="secondary" onClick={onClose}>
          Tutup
        </Button>
      </div>
    </Sheet>
  );
}