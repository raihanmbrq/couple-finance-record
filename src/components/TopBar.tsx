import { useApp } from '@/context/AppContext';
import { Wallet, Users, User } from 'lucide-react';

export function TopBar() {
  const { profile, household, isDemo } = useApp();

  const isCouple = household?.mode === 'couple';
  const statusText = isCouple
    ? `Connected with ${household?.partner_name ?? 'Partner'}`
    : 'Single Mode';

   return (
     <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-lg border-b border-secondary safe-top">
       <div className="px-5 py-3.5 flex items-center justify-between">
         {/* Logo */}
         <div className="flex items-center gap-2.5">
           <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
             <Wallet className="w-5 h-5 text-white" strokeWidth={2.5} />
           </div>
           <div>
             <h2 className="font-display font-bold text-base text-text-primary leading-tight">PairFlow</h2>
             {isDemo && (
               <span className="text-[10px] font-semibold text-warning bg-warning/10 px-1.5 py-0.5 rounded">DEMO</span>
             )}
           </div>
         </div>
 
         {/* Household Status */}
         <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-secondary">
           {isCouple ? (
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
