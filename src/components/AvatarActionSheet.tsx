import { useRef } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { Eye, ImagePlus } from 'lucide-react';

interface AvatarActionSheetProps {
  open: boolean;
  onClose: () => void;
  hasAvatar: boolean;
  onView: () => void;
  onFileSelected: (file: File) => void;
}

export function AvatarActionSheet({ open, onClose, hasAvatar, onView, onFileSelected }: AvatarActionSheetProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    onFileSelected(file);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Foto Profil">
      <div className="space-y-2">
        {hasAvatar && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onView();
            }}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-secondary hover:bg-secondary/80 active:bg-secondary/60 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Eye className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-text-primary">Lihat Foto Profil</p>
              <p className="text-xs text-text-secondary">Tampilkan foto profil secara penuh</p>
            </div>
          </button>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-secondary hover:bg-secondary/80 active:bg-secondary/60 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ImagePlus className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm text-text-primary">Ganti Foto Profil</p>
            <p className="text-xs text-text-secondary">Pilih gambar dari perangkat, lalu atur crop</p>
          </div>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </Sheet>
  );
}