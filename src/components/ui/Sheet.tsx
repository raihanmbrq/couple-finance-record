import { type KeyboardEvent, type ReactNode, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useBackHandler } from '../../hooks/useBackHandler';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Sheet({ open, onClose, title, children }: SheetProps) {
  useBackHandler(open, onClose);
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  // Escape closes the sheet. `stopPropagation` keeps a nested sheet's Escape
  // from also closing its parent.
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      event.preventDefault();
      onClose();
    }
  };

   return (
     <div className="fixed inset-0 z-[60] flex items-end justify-center">
       <div
         className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-fade-in"
         onClick={onClose}
       />
       <div
         ref={panelRef}
         role="dialog"
         aria-modal="true"
         aria-label={title}
         onKeyDown={handleKeyDown}
         className="relative w-full max-w-md bg-surface rounded-t-3xl shadow-float animate-slide-up safe-bottom max-h-[90vh] overflow-y-auto no-scrollbar"
       >
         <div className="sticky top-0 bg-surface/90 backdrop-blur-md px-5 pt-4 pb-3 border-b border-secondary flex items-center justify-between z-10">
           <div className="w-10 h-1.5 bg-secondary rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
           <h3 className="font-display font-bold text-lg text-text-primary mt-2">{title}</h3>
           <button
             onClick={onClose}
             className="p-2 -mr-2 rounded-full hover:bg-secondary active:bg-secondary/80 transition-colors mt-2"
           >
             <X className="w-5 h-5 text-text-secondary" />
           </button>
         </div>
         <div className="px-5 py-4">{children}</div>
       </div>
     </div>
   );
}
