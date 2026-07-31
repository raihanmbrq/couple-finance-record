import { CheckCircle2, XCircle, X } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 left-0 right-0 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 w-full max-w-sm px-4 py-3 rounded-2xl shadow-lg pointer-events-auto
            ${toast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
            }`}
        >
          {toast.type === 'success'
            ? <CheckCircle2 className="w-5 h-5 shrink-0" />
            : <XCircle className="w-5 h-5 shrink-0" />
          }
          <span className="text-sm font-semibold flex-1">{toast.message}</span>
          <button
            onClick={() => dismiss(toast.id)}
            className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}