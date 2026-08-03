import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EditProfileSheet } from '@/components/EditProfileSheet';
import { User, Mail, Users, LogOut, Copy, Check, Wallet, Receipt, PiggyBank, Sparkles, Pencil } from 'lucide-react';

export function ProfileScreen() {
  const { profile, household, wallets, transactions, budgets, isDemo, signOut, joinHousehold } = useApp();
  const [showEdit, setShowEdit] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);

  const handleCopy = () => {
    if (household?.invite_code) {
      navigator.clipboard.writeText(household.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoin = async () => {
    if (inviteCode.trim().length !== 6) {
      setJoinError('Invite code must be 6 characters');
      return;
    }

    setJoinError('');
    setJoining(true);
    try {
      await joinHousehold(inviteCode.trim());
      setInviteCode('');
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Failed to join household');
    } finally {
      setJoining(false);
    }
  };

  const isCouple = household?.mode === 'couple';

  return (
    <div className="px-5 py-5 space-y-5">
      <h1 className="font-display font-extrabold text-2xl text-stone-800">Profile</h1>

      {/* Profile Card */}
      <Card elevated className="p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center text-white font-display font-bold text-2xl">
            {profile?.full_name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-bold text-lg text-stone-800 truncate">{profile?.full_name ?? 'User'}</h2>
            <p className="text-sm text-stone-500 truncate flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              {profile?.email ?? '—'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowEdit(true)}
            className="p-2 rounded-xl bg-cream-100 text-stone-600"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>

        {/* Household Status */}
        <div className="mt-4 pt-4 border-t border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isCouple ? 'bg-amber-50' : 'bg-teal-50'}`}>
              {isCouple ? <Users className="w-5 h-5 text-amber-600" /> : <User className="w-5 h-5 text-teal-600" />}
            </div>
            <div className="flex-1">
              <p className="text-xs text-stone-400">Mode</p>
              <p className="font-semibold text-sm text-stone-800">
                {isCouple ? `Couple — ${household?.name}` : 'Single Mode'}
              </p>
            </div>
            {isCouple && (
              <Badge color="primary">Connected</Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Shared Space Code */}
      {household?.invite_code && (
        <Card className="p-5 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-teal-700" />
              <h3 className="font-display font-bold text-stone-800">Shared Space Invite</h3>
            </div>
            <p className="text-sm text-stone-500">Share this code with your partner to join the same circle.</p>
          </div>

          {!showInviteCode ? (
            <Button fullWidth onClick={() => setShowInviteCode(true)}>
              Show Invitation Code
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex-1 px-4 py-3 rounded-xl bg-cream-100 border border-stone-200">
                <p className="font-display font-extrabold text-2xl tracking-widest text-stone-800 text-center">
                  {household.invite_code}
                </p>
              </div>
              <button
                onClick={handleCopy}
                className="p-3 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition-colors"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          )}

          <div className="space-y-3 pt-2 border-t border-stone-100">
            <Input
              label="Join with invitation code"
              placeholder="6-Invitation Code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="text-center text-xl font-bold tracking-widest"
            />
            {joinError && <p className="text-sm text-expense">{joinError}</p>}
            <Button fullWidth onClick={handleJoin} disabled={joining}>
              {joining ? 'Joining...' : 'Join Circle'}
            </Button>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="hidden grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center mx-auto mb-2">
            <Wallet className="w-5 h-5 text-teal-600" />
          </div>
          <p className="font-display font-bold text-xl text-stone-800">{wallets.length}</p>
          <p className="text-xs text-stone-400">Wallets</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-2">
            <Receipt className="w-5 h-5 text-amber-600" />
          </div>
          <p className="font-display font-bold text-xl text-stone-800">{transactions.length}</p>
          <p className="text-xs text-stone-400">Transactions</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mx-auto mb-2">
            <PiggyBank className="w-5 h-5 text-purple-600" />
          </div>
          <p className="font-display font-bold text-xl text-stone-800">{budgets.length}</p>
          <p className="text-xs text-stone-400">Budgets</p>
        </Card>
      </div>

      {/* Demo badge */}
      {isDemo && (
        <Card className="p-4 border-2 border-dashed border-amber-200 bg-amber-50/50">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <div>
              <p className="font-semibold text-sm text-amber-700">Demo Mode Active</p>
              <p className="text-xs text-amber-600">You're exploring with sample data. Sign out to use real auth.</p>
            </div>
          </div>
        </Card>
      )}

      {/* Sign Out */}
      <Button variant="danger" fullWidth onClick={signOut}>
        <LogOut className="w-5 h-5 inline mr-2" />
        Sign Out
      </Button>

      <EditProfileSheet open={showEdit} onClose={() => setShowEdit(false)} />
    </div>
  );
}
