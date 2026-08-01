import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, Users, LogIn, Copy, Check, ArrowLeft, Home, Sparkles } from 'lucide-react';

type Step = 'decision' | 'create' | 'join' | 'created';

export function OnboardingScreen() {
  const { profile, createHousehold, joinHousehold, enterDemo } = useApp();
  const [step, setStep] = useState<Step>('decision');
  const [partnerName, setPartnerName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [createdCode, setCreatedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setError('');
    setLoading(true);
    try {
      const code = await createHousehold('couple', partnerName.trim());
      setCreatedCode(code);
      setStep('created');
    } catch {
      setError('Failed to create household. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (inviteCode.trim().length !== 6) {
      setError('Invite code must be 6 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await joinHousehold(inviteCode.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join household');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(createdCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

   return (
     <div className="min-h-screen bg-background flex flex-col">
       {/* Header */}
       <div className="px-6 pt-12 pb-4">
         {step !== 'decision' && step !== 'created' && (
           <button
             onClick={() => { setStep('decision'); setError(''); }}
             className="flex items-center gap-1.5 text-text-secondary font-medium text-sm mb-4"
           >
             <ArrowLeft className="w-4 h-4" />
             Back
           </button>
         )}
         <h1 className="font-display font-extrabold text-2xl text-text-primary">
           {step === 'decision' && 'Welcome!'}
           {step === 'create' && 'Create Household'}
           {step === 'join' && 'Join Household'}
           {step === 'created' && 'Household Created!'}
         </h1>
         <p className="text-sm text-text-secondary mt-1">
           {step === 'decision' && `Hi ${profile?.full_name ?? 'there'}, let's set up your shared space.`}
           {step === 'create' && 'Create a shared space for your household and invite a partner.'}
           {step === 'join' && 'Enter the invite code from your partner to join the shared space.'}
           {step === 'created' && 'Share this code with your partner to connect.'}
         </p>
       </div>

      <div className="flex-1 px-6 pb-8">
         {step === 'decision' && (
           <div className="space-y-4 animate-fade-in">
             {/* Single Mode */}
             {error && step === 'decision' && <p className="text-sm text-expense mb-2">{error}</p>}
             <button
               onClick={async () => {
                 setError('');
                 setLoading(true);
                 try {
                   await createHousehold('single');
                 } catch {
                   setError('Failed to set up. Please try again.');
                 } finally {
                   setLoading(false);
                 }
               }}
               disabled={loading}
               className="w-full text-left card-elevated p-5 hover:shadow-card active:scale-[0.98] transition-all duration-150"
             >
               <div className="flex items-start gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                   <User className="w-6 h-6 text-primary" />
                 </div>
                 <div>
                   <h3 className="font-display font-bold text-text-primary mb-0.5">Personal Space</h3>
                   <p className="text-sm text-text-secondary">Manage your budget independently. Perfect for solo tracking.</p>
                 </div>
               </div>
             </button>
 
             {/* Couple Mode */}
             <button
               onClick={() => setStep('create')}
               className="w-full text-left card-elevated p-5 hover:shadow-card active:scale-[0.98] transition-all duration-150"
             >
               <div className="flex items-start gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-warning/10 flex items-center justify-center flex-shrink-0">
                   <Users className="w-6 h-6 text-warning" />
                 </div>
                 <div>
                   <h3 className="font-display font-bold text-text-primary mb-0.5">Shared Space</h3>
                   <p className="text-sm text-text-secondary">Sync finances with your partner or household in one circle.</p>
                 </div>
               </div>
             </button>
 
             {/* Join existing */}
             <button
               onClick={() => setStep('join')}
               className="w-full text-left card p-5 hover:shadow-card active:scale-[0.98] transition-all duration-150 border-dashed"
             >
               <div className="flex items-start gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center flex-shrink-0">
                   <LogIn className="w-6 h-6 text-text-secondary" />
                 </div>
                 <div>
                   <h3 className="font-display font-bold text-text-primary mb-0.5">Join Shared Space</h3>
                   <p className="text-sm text-text-secondary">Already have a 6-character invite code? Join your partner's space.</p>
                 </div>
               </div>
             </button>
 
             {/* Skip to demo */}
             <div className="pt-4">
               <button
                 onClick={enterDemo}
                 className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-primary font-semibold border-2 border-primary/30 border-dashed hover:bg-primary/10 active:bg-primary/20 transition-colors"
               >
                 <Sparkles className="w-5 h-5" />
                 Skip & Explore Demo Data
               </button>
             </div>
           </div>
         )}

         {step === 'create' && (
           <div className="space-y-5 animate-fade-in">
             <Input
               label="Partner's Name"
               placeholder="e.g., Sari Wulandari"
               value={partnerName}
               onChange={(e) => setPartnerName(e.target.value)}
               autoFocus
             />
             {error && <p className="text-sm text-expense">{error}</p>}
             <Button fullWidth onClick={handleCreate} disabled={loading}>
               {loading ? 'Creating...' : 'Create & Generate Invite Code'}
             </Button>
           </div>
         )}

         {step === 'join' && (
           <div className="space-y-5 animate-fade-in">
             <Input
               label="Invite Code"
               placeholder="6-character code"
               value={inviteCode}
               onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
               maxLength={6}
               className="text-center text-2xl font-bold tracking-widest"
               autoFocus
             />
             {error && <p className="text-sm text-expense">{error}</p>}
             <Button fullWidth onClick={handleJoin} disabled={loading}>
               {loading ? 'Joining...' : 'Join Household'}
             </Button>
           </div>
         )}

         {step === 'created' && (
           <div className="space-y-6 animate-fade-in flex flex-col items-center">
             <div className="card-elevated p-6 flex flex-col items-center gap-4 w-full">
               <div className="w-16 h-16 rounded-2xl bg-income/10 flex items-center justify-center">
                 <Check className="w-8 h-8 text-income" strokeWidth={2.5} />
               </div>
               <div className="text-center">
                 <p className="text-sm text-text-secondary mb-1">Your invite code</p>
                 <p className="font-display font-extrabold text-3xl tracking-widest text-text-primary">{createdCode}</p>
               </div>
             </div>
 
             <button
               onClick={handleCopy}
               className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary/10 text-primary font-semibold border border-primary/20 hover:bg-primary/20 transition-colors"
             >
               {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
               {copied ? 'Copied!' : 'Copy Code'}
             </button>
 
             <Button fullWidth onClick={enterDemo} className="mt-4">
               <Home className="w-5 h-5 inline mr-2" />
               Go to Dashboard
             </Button>
           </div>
         )}
      </div>
    </div>
  );
}
