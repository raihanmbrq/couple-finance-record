import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Profile, Household, HouseholdMember, Wallet, Transaction, Budget, Goal, GoalInput } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import {
  mockProfile, mockPartner, mockHousehold, mockWallets, mockTransactions, mockBudgets, mockGoals,
  generateInviteCode,
} from '@/lib/mockData';

type AppMode = 'demo' | 'live';

interface AppState {
  mode: AppMode;
  profile: Profile | null;
  household: Household | null;
  householdMembers: HouseholdMember[];
  wallets: Wallet[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  loading: boolean;
  error: string | null;
  // Auth
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  // Onboarding
  setMode: (mode: 'single' | 'couple', partnerName?: string) => Promise<void>;
  createHousehold: (mode: 'single' | 'couple', partnerName?: string) => Promise<string>;
  joinHousehold: (inviteCode: string) => Promise<void>;
  leaveHousehold: () => Promise<void>;
  // Wallets
  addWallet: (name: string, type: Wallet['type'], balance: number) => Promise<Wallet>;
  updateWallet: (id: string, updates: Partial<Wallet>) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  // Transactions
  addTransaction: (tx: Omit<Transaction, 'id' | 'created_at'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  // Budgets
  setBudget: (category: string, limitAmount: number) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  // Goals
  saveGoal: (input: GoalInput) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  depositToGoal: (goalId: string, walletId: string, amount: number) => Promise<void>;
  // Demo
  enterDemo: () => void;
  isDemo: boolean;
}

const AppContext = createContext<AppState | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [mode, setAppMode] = useState<AppMode>('demo');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Restore demo session from localStorage or check live session
  useEffect(() => {
    if (sessionChecked) return;

    const saved = localStorage.getItem('duitbersama_session');
    if (saved === 'demo') {
      enterDemo();
      setLoading(false);
      setSessionChecked(true);
      return;
    }
    
    checkLiveSession();
  }, [sessionChecked]);

  const checkLiveSession = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setAppMode('live');
        await loadLiveData(session.user.id, session.user.email ?? '');
      }
    } catch {
      // No live session — stay in default state
    } finally {
      setLoading(false);
      setSessionChecked(true);
    }
  }, []);

  const loadLiveData = useCallback(async (userId: string, email: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const metaFullName = sessionData.session?.user?.user_metadata?.full_name as string | undefined;

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      let currentProfile: Profile;
      if (!prof) {
        const newProfile = {
          id: userId,
          email,
          full_name: metaFullName?.trim() || email.split('@')[0] || 'User',
          role: 'single',
          avatar_url: null,
          created_at: new Date().toISOString(),
        };
        const { error: insertErr } = await supabase.from('profiles').insert(newProfile);
        if (insertErr) {
          throw insertErr;
        }
        const { data: insertedProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        currentProfile = insertedProfile as Profile;
      } else {
        currentProfile = prof as Profile;
      }
      setProfile(currentProfile);

      let householdId = currentProfile.household_id;
      let householdData: Household | null = null;

      if (householdId) {
        const { data: hh } = await supabase
          .from('households')
          .select('*')
          .eq('id', householdId)
          .maybeSingle();
        householdData = hh as Household | null;
      }

      if (!householdData) {
        // No household yet (legacy user or deleted household): guarantee one.
        const { data: ensured, error: ensureErr } = await supabase
          .rpc('ensure_personal_household');
        if (ensureErr) throw ensureErr;
        householdData = ensured as Household;
        householdId = householdData.id;
      }

      if (!householdData) {
        setHousehold(null);
        setWallets([]);
        setTransactions([]);
        setHouseholdMembers([]);
        setBudgets([]);
        setGoals([]);
        return;
      }

      setHousehold(householdData);
      householdId = householdData.id;

      const { data: memberRows } = await supabase
        .from('household_members')
        .select('id, user_id, household_id, role, created_at, profile:profiles(*)')
        .eq('household_id', householdId);
      const members = (memberRows as unknown as HouseholdMember[]) ?? [];
      setHouseholdMembers(members);

      const { data: w } = await supabase
        .from('wallets')
        .select('*')
        .eq('household_id', householdId);
      const walletRows = (w as Wallet[]) ?? [];
      setWallets(walletRows);

      const walletIds = walletRows.map((wallet) => wallet.id);
      let txRows: Transaction[] = [];
      if (walletIds.length > 0) {
        const { data: tx } = await supabase
          .from('transactions')
          .select('*')
          .in('wallet_id', walletIds)
          .order('transaction_date', { ascending: false });
        txRows = (tx as Transaction[]) ?? [];
      }
      setTransactions(txRows);

      const { data: bg } = await supabase
        .from('budgets')
        .select('*')
        .eq('household_id', householdId);
      setBudgets((bg as Budget[]) ?? []);

      const { data: gl } = await supabase
        .from('goals')
        .select('*')
        .eq('household_id', householdId);
      setGoals((gl as Goal[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  const enterDemo = useCallback(() => {
    setAppMode('demo');
    setIsDemo(true);
    setProfile(mockProfile);
    setHousehold(mockHousehold);
    setHouseholdMembers([
      {
        id: mockProfile.id,
        user_id: mockProfile.id,
        household_id: mockHousehold.id,
        role: 'owner',
        created_at: mockProfile.created_at,
        profile: mockProfile,
      },
      {
        id: mockPartner.id,
        user_id: mockPartner.id,
        household_id: mockHousehold.id,
        role: 'member',
        created_at: mockPartner.created_at,
        profile: mockPartner,
      },
    ]);
    setWallets(mockWallets);
    setTransactions(mockTransactions);
    setBudgets(mockBudgets);
    setGoals(mockGoals);
    localStorage.setItem('duitbersama_session', 'demo');
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      setAppMode('live');
      setIsDemo(false);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadLiveData(session.user.id, session.user.email ?? '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadLiveData]);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      if (signUpError) throw signUpError;

      const user = data.user;
      if (!user) {
        throw new Error('Sign up did not return a user record.');
      }

      let finalSession = data.session;
      if (!finalSession) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        finalSession = signInData.session;
      }

      if (!finalSession) {
        throw new Error('Registration completed, but the app could not start an authenticated session.');
      }

      const profilePayload = {
        id: user.id,
        email,
        full_name: fullName.trim() || email.split('@')[0] || 'User',
        role: 'single',
        avatar_url: null,
        created_at: new Date().toISOString(),
      };

      const { error: profileUpsertError } = await supabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' });

      if (profileUpsertError) throw profileUpsertError;

      setAppMode('live');
      setIsDemo(false);
      await loadLiveData(user.id, email);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadLiveData]);

  const signInWithGoogle = useCallback(async () => {
    setError('Google sign-in is not available in this build. Use email/password or try the demo mode.');
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!profile) return;
    if (mode === 'live') {
      const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id);
      if (error) throw error;
    }
    setProfile(prev => prev ? { ...prev, ...updates } : prev);
  }, [mode, profile]);

  const signOut = useCallback(async () => {
    if (mode === 'live') {
      const { error } = await supabase.auth.signOut();
      if (error) {
        // If signOut failed, still try to clear client-side storage below.
        console.warn('supabase signOut error:', error.message ?? error);
      }
    }
    localStorage.removeItem('duitbersama_session');
    // Remove Supabase/Gotrue-related tokens from localStorage to fully clear session
    try {
      for (const key of Object.keys(localStorage)) {
        const k = String(key);
        if (k.includes('supabase') || k.includes('gotrue') || k.startsWith('sb:') || k.includes('@supabase')) {
          localStorage.removeItem(k);
        }
      }
    } catch {}

    // Clear auth-related cookies (best-effort).
    try {
      const cookies = document.cookie.split(';').map(c => c.trim());
      for (const c of cookies) {
        const [name] = c.split('=');
        if (/supabase|sb-|sb:|gotrue|access_token/i.test(name)) {
          document.cookie = `${name}=; Max-Age=0; path=/;`; 
          document.cookie = `${name}=; Max-Age=0; path=/; domain=${location.hostname};`;
        }
      }
    } catch {}
    setAppMode('demo');
    setIsDemo(false);
    setProfile(null);
    setHousehold(null);
    setHouseholdMembers([]);
    setWallets([]);
    setTransactions([]);
    setBudgets([]);
    setGoals([]);
  }, [mode]);

  const setMode = useCallback(async (_mode: 'single' | 'couple', _partnerName?: string) => {
    // This is handled by createHousehold/joinHousehold
  }, []);

  const createHousehold = useCallback(async (hhMode: 'single' | 'couple', partnerName?: string): Promise<string> => {
    const code = generateInviteCode();
    const newHousehold: Household = {
      id: crypto.randomUUID(),
      name: hhMode === 'couple'
        ? `${profile?.full_name ?? 'Me'}${partnerName ? ` & ${partnerName}` : ''}`
        : 'My Personal Finance',
      invite_code: code,
      mode: hhMode,
      partner_name: partnerName || null,
      created_at: new Date().toISOString(),
    };

    if (mode === 'live' && profile) {
      const { data: hh, error } = await supabase.rpc('create_household', {
        p_name: hhMode === 'couple'
          ? `${profile.full_name ?? 'Me'}${partnerName ? ` & ${partnerName}` : ''}`
          : 'My Personal Finance',
        p_partner: partnerName ?? null,
        p_mode: hhMode,
      });
      if (error) throw error;
      await loadLiveData(profile.id, profile.email);
      return (hh as Household).invite_code;
    }

    // Demo mode
    setHousehold(newHousehold);
    setProfile(prev => prev ? { ...prev, household_id: newHousehold.id, role: hhMode === 'couple' ? 'suami' : 'single' } : prev);
    setWallets([]);
    setGoals([]);
    return code;
  }, [mode, profile]);

  const joinHousehold = useCallback(async (inviteCode: string) => {
    if (mode === 'live' && profile) {
      const { data: hh, error } = await supabase.rpc('join_household_by_code', { code: inviteCode });
      if (error) throw error;
      setHousehold(hh as Household);
      await loadLiveData(profile.id, profile.email);
      return;
    }
    // Demo: simulate joining
    setHousehold({ ...mockHousehold, invite_code: inviteCode.toUpperCase() });
    setProfile(prev => prev ? { ...prev, household_id: mockHousehold.id, role: 'istri' } : prev);
  }, [loadLiveData, mode, profile]);

  const leaveHousehold = useCallback(async () => {
    if (!profile) return;

    if (mode === 'live') {
      const { error } = await supabase.rpc('leave_current_household');
      if (error) throw error;
      await loadLiveData(profile.id, profile.email);
      return;
    }

    setHousehold(null);
    setHouseholdMembers([]);
    setWallets([]);
    setTransactions([]);
    setBudgets([]);
    setGoals([]);
    setProfile({ ...profile, household_id: null, role: 'single' });
  }, [loadLiveData, mode, profile]);

  const addWallet = useCallback(async (name: string, type: Wallet['type'], balance: number) => {
    let hh = household;

    // If user has no household (single-user case), create a personal household
    // so DB constraints (wallets.household_id NOT NULL) are satisfied.
    if (!hh) {
      const newHousehold: Household = {
        id: crypto.randomUUID(),
        name: 'My Personal Finance',
        invite_code: generateInviteCode(),
        mode: 'single',
        partner_name: null,
        created_at: new Date().toISOString(),
      };

      if (mode === 'live' && profile) {
        const { error: hhErr } = await supabase.from('households').insert({
          id: newHousehold.id,
          name: newHousehold.name,
          invite_code: newHousehold.invite_code,
          mode: newHousehold.mode,
          partner_name: newHousehold.partner_name,
        });
        if (hhErr) throw hhErr;

        const { error: profileError } = await supabase.from('profiles').update({ household_id: newHousehold.id, role: 'single' }).eq('id', profile.id);
        if (profileError) throw profileError;

        hh = newHousehold;
        setHousehold(newHousehold);
        setProfile({ ...profile, household_id: newHousehold.id, role: 'single' });
      } else {
        // Demo: create locally
        setHousehold(newHousehold);
        setProfile(prev => prev ? { ...prev, household_id: newHousehold.id, role: 'single' } : prev);
        hh = newHousehold;
      }
    }

    const newWallet: Wallet = {
      id: crypto.randomUUID(),
      household_id: hh.id,
      user_id: profile?.id,
      name,
      type,
      balance,
      owner_role: null,
      created_at: new Date().toISOString(),
    };

    if (mode === 'live' && profile) {
      const { data, error } = await supabase.from('wallets').insert({
        user_id: profile.id,
        household_id: hh.id,
        name,
        type,
        balance,
      }).select().single();
      if (error) throw error;
      const inserted = (data as Wallet) ?? newWallet;
      setWallets(prev => [...prev, inserted]);
      return inserted;
    } else {
      setWallets(prev => [...prev, newWallet]);
      return newWallet;
    }
  }, [household, mode, profile]);

  const updateWallet = useCallback(async (id: string, updates: Partial<Wallet>) => {
    if (mode === 'live') {
      const { error } = await supabase.from('wallets').update(updates).eq('id', id);
      if (error) throw error;
    }
    setWallets(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  }, [mode]);

  const deleteWallet = useCallback(async (id: string) => {
    const walletTransactions = transactions.filter((tx) => tx.wallet_id === id);
    if (walletTransactions.length > 0) {
      throw new Error('This wallet has linked transactions. Delete those transactions first.');
    }

    if (mode === 'live') {
      const { error } = await supabase.from('wallets').delete().eq('id', id);
      if (error) throw error;
    }
    setWallets(prev => prev.filter(w => w.id !== id));
  }, [mode, transactions]);

  const addTransaction = useCallback(async (tx: Omit<Transaction, 'id' | 'created_at'>) => {
    const newTx: Transaction = {
      ...tx,
      id: crypto.randomUUID(),
      transaction_date: tx.transaction_date || new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const targetWallet = wallets.find(w => w.id === tx.wallet_id);
    const nextWalletBalance = targetWallet
      ? targetWallet.balance + (tx.type === 'income' ? tx.amount : -tx.amount)
      : tx.amount;

    if (mode === 'live') {
      const { error } = await supabase.from('transactions').insert({
        user_id: profile?.id,
        wallet_id: tx.wallet_id,
        amount: tx.amount,
        type: tx.type,
        category: tx.category,
        notes: tx.notes,
        spent_by: tx.spent_by,
        transaction_date: tx.transaction_date,
      });
      if (error) throw error;

      if (targetWallet) {
        const { error: walletError } = await supabase.from('wallets').update({ balance: nextWalletBalance }).eq('id', tx.wallet_id);
        if (walletError) throw walletError;
      }
    }

    setTransactions(prev => [newTx, ...prev]);
    setWallets(prev => prev.map(w => {
      if (w.id === tx.wallet_id) {
        return { ...w, balance: nextWalletBalance };
      }
      return w;
    }));
  }, [mode, profile, wallets]);

  const goalTitleFromDeposit = (tx: Transaction) => {
    const prefix = 'Deposit ke Goal: ';
    if (tx.category !== 'goals' || !tx.notes?.startsWith(prefix)) return null;
    return tx.notes.slice(prefix.length);
  };

  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    const currentTx = transactions.find((tx) => tx.id === id);
    if (!currentTx) return;

    const walletId = updates.wallet_id ?? currentTx.wallet_id;
    const previousWalletId = currentTx.wallet_id;
    const previousAmount = currentTx.amount;
    const previousType = currentTx.type;
    const nextAmount = updates.amount ?? currentTx.amount;
    const nextType = updates.type ?? currentTx.type;
    const previousEffect = previousType === 'income' ? previousAmount : -previousAmount;
    const nextEffect = nextType === 'income' ? nextAmount : -nextAmount;
    const previousWallet = wallets.find((w) => w.id === previousWalletId);
    const nextWallet = wallets.find((w) => w.id === walletId);

    const updatedTransaction: Transaction = {
      ...currentTx,
      ...updates,
      id,
      amount: nextAmount,
      type: nextType,
      category: updates.category ?? currentTx.category,
      notes: updates.notes ?? currentTx.notes,
      spent_by: updates.spent_by ?? currentTx.spent_by,
      transaction_date: updates.transaction_date ?? currentTx.transaction_date,
      wallet_id: walletId,
      user_id: updates.user_id ?? currentTx.user_id,
    };

    if (mode === 'live') {
      const { error } = await supabase
        .from('transactions')
        .update({
          user_id: profile?.id ?? currentTx.user_id,
          wallet_id: walletId,
          amount: nextAmount,
          type: nextType,
          category: updatedTransaction.category,
          notes: updatedTransaction.notes,
          spent_by: updatedTransaction.spent_by,
          transaction_date: updatedTransaction.transaction_date,
        })
        .eq('id', id);
      if (error) throw error;

      if (previousWallet) {
        const prevWalletBalance = previousWalletId === walletId
          ? previousWallet.balance - previousEffect + nextEffect
          : previousWallet.balance - previousEffect;
        const { error: prevWalletError } = await supabase
          .from('wallets')
          .update({ balance: prevWalletBalance })
          .eq('id', previousWalletId);
        if (prevWalletError) throw prevWalletError;
      }

      if (nextWallet && previousWalletId !== walletId) {
        const nextWalletBalance = nextWallet.balance + nextEffect;
        const { error: nextWalletError } = await supabase
          .from('wallets')
          .update({ balance: nextWalletBalance })
          .eq('id', walletId);
        if (nextWalletError) throw nextWalletError;
      }
    }

    const previousGoalTitle = goalTitleFromDeposit(currentTx);
    const nextGoalTitle = goalTitleFromDeposit(updatedTransaction);
    setGoals(prev => prev.map((goal) => {
      if (goal.title === previousGoalTitle && goal.title === nextGoalTitle) {
        return { ...goal, current_amount: goal.current_amount - previousAmount + nextAmount };
      }
      if (goal.title === previousGoalTitle) {
        return { ...goal, current_amount: Math.max(0, goal.current_amount - previousAmount) };
      }
      if (goal.title === nextGoalTitle) {
        return { ...goal, current_amount: goal.current_amount + nextAmount };
      }
      return goal;
    }));
    setTransactions(prev => prev.map((tx) => tx.id === id ? updatedTransaction : tx));
    setWallets(prev => prev.map((w) => {
      if (w.id === previousWalletId && previousWalletId === walletId) {
        return { ...w, balance: w.balance - previousEffect + nextEffect };
      }
      if (w.id === previousWalletId && previousWalletId !== walletId) {
        return { ...w, balance: w.balance - previousEffect };
      }
      if (w.id === walletId && previousWalletId !== walletId) {
        return { ...w, balance: w.balance + nextEffect };
      }
      return w;
    }));
  }, [mode, profile, transactions, wallets]);

  const deleteTransaction = useCallback(async (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    const goalTitle = goalTitleFromDeposit(tx);

    if (mode === 'live') {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;

      const targetWallet = wallets.find(w => w.id === tx.wallet_id);
      if (targetWallet) {
        const nextBalance = targetWallet.balance + (tx.type === 'income' ? -tx.amount : tx.amount);
        const { error: walletError } = await supabase.from('wallets').update({ balance: nextBalance }).eq('id', tx.wallet_id);
        if (walletError) throw walletError;

        setWallets(prev => prev.map(w => w.id === tx.wallet_id ? { ...w, balance: nextBalance } : w));
      }
    }

    if (goalTitle) {
      setGoals(prev => prev.map((goal) => goal.title === goalTitle
        ? { ...goal, current_amount: Math.max(0, goal.current_amount - tx.amount) }
        : goal));
    }
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, [mode, transactions, wallets]);

  const setBudget = useCallback(async (category: string, limitAmount: number) => {
    if (!household) return;
    const existing = budgets.find(b => b.category === category);

    if (mode === 'live') {
      if (existing) {
        const { error } = await supabase.from('budgets').update({ limit_amount: limitAmount }).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('budgets').insert({
          user_id: profile?.id,
          household_id: household.id,
          category,
          limit_amount: limitAmount,
        }).select().single();
        if (error) throw error;
        setBudgets(prev => [...prev, data as Budget]);
        return;
      }
    }

    if (existing) {
      setBudgets(prev => prev.map(b => b.category === category ? { ...b, limit_amount: limitAmount } : b));
    } else {
      setBudgets(prev => [...prev, {
        id: crypto.randomUUID(),
        household_id: household.id,
        category,
        limit_amount: limitAmount,
        created_at: new Date().toISOString(),
      }]);
    }
  }, [household, budgets, mode]);

  const deleteBudget = useCallback(async (id: string) => {
    if (mode === 'live') {
      const { error } = await supabase.from('budgets').delete().eq('id', id);
      if (error) throw error;
    }
    setBudgets(prev => prev.filter(b => b.id !== id));
  }, [mode]);

  const saveGoal = useCallback(async (input: GoalInput) => {
    if (!household) return;
    if (mode === 'live') {
      if (input.id) {
        const { id, ...updates } = input;
        const { error } = await supabase.from('goals').update(updates).eq('id', id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('goals').insert({
          household_id: household.id,
          user_id: profile?.id,
          title: input.title,
          target_amount: input.target_amount,
          current_amount: input.current_amount ?? 0,
          target_date: input.target_date,
          asset_category: input.asset_category,
          expected_return_rate: input.expected_return_rate,
          monthly_contribution: input.monthly_contribution,
        }).select().single();
        if (error) throw error;
        setGoals(prev => [...prev, data as Goal]);
        return;
      }
    }
    if (input.id) {
      setGoals(prev => prev.map(g => g.id === input.id ? { ...g, ...input } : g));
    } else {
      setGoals(prev => [...prev, {
        id: crypto.randomUUID(),
        household_id: household.id,
        user_id: profile?.id,
        title: input.title,
        target_amount: input.target_amount,
        current_amount: input.current_amount ?? 0,
        target_date: input.target_date,
        asset_category: input.asset_category,
        expected_return_rate: input.expected_return_rate,
        monthly_contribution: input.monthly_contribution,
        created_at: new Date().toISOString(),
      }]);
    }
  }, [household, mode, profile]);

  const deleteGoal = useCallback(async (id: string) => {
    if (mode === 'live') {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) throw error;
    }
    setGoals(prev => prev.filter(g => g.id !== id));
  }, [mode]);

  const depositToGoal = useCallback(async (goalId: string, walletId: string, amount: number) => {
    const goal = goals.find(g => g.id === goalId);
    const wallet = wallets.find(w => w.id === walletId);
    if (!goal || !wallet) return;
    if (amount <= 0) throw new Error('Jumlah deposit harus lebih dari 0.');
    if (wallet.balance < amount) throw new Error('Saldo wallet tidak mencukupi.');

    const now = new Date().toISOString();
    const nextBalance = wallet.balance - amount;
    const nextCurrent = goal.current_amount + amount;
    const newTx: Transaction = {
      id: crypto.randomUUID(),
      user_id: profile?.id,
      wallet_id: walletId,
      amount,
      type: 'expense',
      category: 'goals',
      notes: `Deposit ke Goal: ${goal.title}`,
      spent_by: profile?.full_name ?? 'Me',
      transaction_date: now,
      created_at: now,
    };

    if (mode === 'live') {
      const { error: txErr } = await supabase.from('transactions').insert({
        id: newTx.id,
        user_id: newTx.user_id,
        wallet_id: newTx.wallet_id,
        amount: newTx.amount,
        type: newTx.type,
        category: newTx.category,
        notes: newTx.notes,
        spent_by: newTx.spent_by,
        transaction_date: newTx.transaction_date,
      });
      if (txErr) throw txErr;

      const { error: wErr } = await supabase.from('wallets').update({ balance: nextBalance }).eq('id', walletId);
      if (wErr) throw wErr;

      const { error: gErr } = await supabase.from('goals').update({ current_amount: nextCurrent }).eq('id', goalId);
      if (gErr) throw gErr;
    }

    setTransactions(prev => [newTx, ...prev]);
    setWallets(prev => prev.map(w => w.id === walletId ? { ...w, balance: nextBalance } : w));
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, current_amount: nextCurrent } : g));
  }, [goals, mode, profile, wallets]);

  const value: AppState = {
    mode,
    profile,
    household,
    householdMembers,
    wallets,
    transactions,
    budgets,
    goals,
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    updateProfile,
    setMode,
    createHousehold,
    joinHousehold,
    leaveHousehold,
    addWallet,
    updateWallet,
    deleteWallet,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    setBudget,
    deleteBudget,
    saveGoal,
    deleteGoal,
    depositToGoal,
    enterDemo,
    isDemo,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
