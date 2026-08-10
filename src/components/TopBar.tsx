import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { Users, User } from 'lucide-react';

export function TopBar() {
  const { household, householdMembers, isDemo } = useApp();
  const { t } = useLanguage();

  const isCircle = householdMembers.length > 1 || household?.mode === 'couple';
  const statusText = isCircle
    ? t('topbar.circleMode', { name: household?.name ?? 'Household' })
    : t('topbar.singleMode');

   return (
     <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-lg border-b border-secondary safe-top">
       <div className="px-5 py-3.5 flex items-center justify-between">
         {/* Logo */}
         <div className="flex items-center gap-2.5">
            <img src="/icons/icon-512.png" alt="PairFlow logo" className="w-9 h-9 rounded-xl object-contain" />
           <div>
             <h2 className="font-display font-bold text-base text-text-primary leading-tight">PairFlow</h2>
             {isDemo && (
             <span className="text-[10px] font-semibold text-warning bg-warning/10 px-1.5 py-0.5 rounded">{t('common.demo')}</span>
             )}
           </div>
         </div>
 
         {/* Household Status */}
         <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-secondary">
            {isCircle ? (
             <Users className="w-4 h-4 text-primary" />
           ) : (
             <User className="w-4 h-4 text-text-secondary" />
           )}
           <span className="text-xs font-medium text-text-secondary max-w-[140px] truncate">
             {statusText}
           </span>
         </div>
       </div>
     </header>
   );
}
