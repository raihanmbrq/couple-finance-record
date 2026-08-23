import { useRef, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { uploadReceipt } from '@/lib/receiptUpload';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';

interface ReceiptAttachButtonProps {
  receiptUrl: string | null;
  onUpload: (url: string) => void;
  onRemove: () => void;
}

export function ReceiptAttachButton({ receiptUrl, onUpload, onRemove }: ReceiptAttachButtonProps) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadReceipt(file);
      onUpload(url);
      showToast(t('tx.receiptUploaded'));
    } catch {
      showToast(t('tx.receiptFailed'), 'error');
    } finally {
      setUploading(false);
    }
  };

  // State: has existing receipt → show thumbnail
  if (receiptUrl) {
    return (
      <>
        <div className="relative w-16 h-16 shrink-0">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="w-full h-full rounded-xl border border-secondary overflow-hidden hover:opacity-80 transition-opacity"
          >
            <img src={receiptUrl} alt="" className="w-full h-full object-cover" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-surface/90 border border-secondary flex items-center justify-center hover:bg-secondary transition-colors shadow-sm"
          >
            <X className="w-3 h-3 text-text-secondary" />
          </button>
        </div>

        {/* Full-size image preview */}
        {previewOpen && (
          <div
            className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setPreviewOpen(false)}
          >
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={receiptUrl}
              alt={t('tx.receiptPreview')}
              className="max-w-full max-h-[80vh] object-contain rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </>
    );
  }

  // State: no receipt → show attach button
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-xl border border-primary/25 bg-primary/10 text-primary transition-all active:scale-95 disabled:opacity-60 shrink-0"
        aria-label={t('tx.attachReceipt')}
      >
        {uploading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Camera className="w-5 h-5" />
        )}
        <span className="text-[10px] font-semibold leading-none">
          {uploading ? t('tx.receiptUploading') : t('tx.attachReceipt')}
        </span>
      </button>
    </>
  );
}