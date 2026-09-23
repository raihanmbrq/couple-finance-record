import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { TRANSFER_CATEGORY, type Profile, type Household, type HouseholdMember, type Wallet, type WalletTypeRow, type Transaction, type Budget, type Goal, type GoalInput, type TransactionCategory, type BulkImportRow } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { uploadAvatarToCloudinary } from '@/lib/cloudinary';
import { accumulateEffects, invertEffects, walletEffects } from '@/lib/transactionMath';
import { findLegacyIncomeLeg, normalizeLegacyTransfers } from '@/lib/transferNormalize';
import {
  mockProfile, mockPartner, mockHousehold, mockWallets, mockWalletTypes, mockCategories, mockTransactions, mockBudgets, mockGoals,
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
  walletTypes: WalletTypeRow[];
  categories: TransactionCategory[];
  loading: boolean;
  error: string | null;
  // Auth
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  updateCurrency: (code: string) => Promise<void>;
  updateAvatar: (file: File) => Promise<void>;
  // Onboarding
  setMode: (mode: 'single' | 'couple', partnerName?: string) => Promise<void>;
  createHousehold: (mode: 'single' | 'couple', partnerName?: string) => Promise<string>;
  joinHousehold: (inviteCode: string) => Promise<void>;
  leaveHousehold: () => Promise<void>;
  // Wallets
  addWallet: (name: string, type: Wallet['type'], balance: number, icon?: string | null) => Promise<Wallet>;
  updateWallet: (id: string, updates: Partial<Wallet>) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  addCustomWalletType: (name: string, icon: string) => Promise<WalletTypeRow>;
  updateWalletType: (id: string, updates: Partial<WalletTypeRow>) => Promise<void>;
  deleteWalletType: (id: string) => Promise<void>;
  addCustomCategory: (name: string, icon: string, type: TransactionCategory['type']) => Promise<TransactionCategory>;
  updateCategory: (id: string, updates: Partial<TransactionCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  // Transactions
  addTransaction: (tx: Omit<Transaction, 'id' | 'created_at'>) => Promise<void>;
  bulkImportTransactions: (rows: BulkImportRow[]) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  bulkUpdateTransactions: (ids: string[], updates: Partial<Pick<Transaction, 'category' | 'wallet_id' | 'spent_by' | 'transaction_date' | 'notes'>>) => Promise<void>;
  bulkDeleteTransactions: (ids: string[]) => Promise<void>;
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

const slugify = (s: string) =>
  s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

const sortByDateDesc = (a: Transaction, b: Transaction) => {
  const dateDiff =
    new Date(b.transaction_date ?? b.created_at).getTime() -
    new Date(a.transaction_date ?? a.created_at).getTime();
  if (dateDiff !== 0) return dateDiff;
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

/** Postgres `check_violation` raised by the `transactions.type` CHECK constraint. */
function isTransferTypeUnsupported(error: { code?: string; message?: string }): boolean {
  if (error.code !== '23514') return false;
  return (error.message ?? '').toLowerCase().includes('type');
}

/**
 * Legacy write fallback used while the `type = 'transfer'` migration has not
 * been applied yet: persists the old expense + income pair instead. The
 * read-time normalizer collapses the pair back into one transfer row, so
 * analytics and balances stay identical either way.
 */
async function insertLegacyTransferPair(
  tx: Omit<Transaction, 'id' | 'created_at'>,
  sourceWallet: Wallet | undefined,
  destinationWallet: Wallet | undefined,
): Promise<Transaction[]> {
  const now = new Date().toISOString();
  const sourceId = tx.source_wallet_id ?? tx.wallet_id;
  const destinationId = tx.destination_wallet_id;

  if (!destinationId) throw new Error('Transfer is missing its destination wallet.');

  const sourceRow: Transaction = {
    id: crypto.randomUUID(),
    wallet_id: sourceId,
    user_id: tx.user_id,
    wallet_name: sourceWallet?.name ?? tx.wallet_name ?? null,
    amount: tx.amount,
    type: 'expense',
    category: TRANSFER_CATEGORY,
    notes: tx.notes ?? null,
    spent_by: tx.spent_by,
    transaction_date: tx.transaction_date || now,
    receipt_url: tx.receipt_url ?? null,
    created_at: now,
  };

  const destinationRow: Transaction = {
    ...sourceRow,
    id: crypto.randomUUID(),
    wallet_id: destinationId,
    wallet_name: destinationWallet?.name ?? tx.destination_wallet_name ?? null,
    type: 'income',
  };

  const { error } = await supabase.from('transactions').insert([
    {
      user_id: sourceRow.user_id,
      wallet_id: sourceRow.wallet_id,
      wallet_name: sourceRow.wallet_name,
      amount: sourceRow.amount,
      type: sourceRow.type,
      category: sourceRow.category,
      notes: sourceRow.notes,
      spent_by: sourceRow.spent_by,
      transaction_date: sourceRow.transaction_date,
    },
    {
      user_id: destinationRow.user_id,
      wallet_id: destinationRow.wallet_id,
      wallet_name: destinationRow.wallet_name,
      amount: destinationRow.amount,
      type: destinationRow.type,
      category: destinationRow.category,
      notes: destinationRow.notes,
      spent_by: destinationRow.spent_by,
      transaction_date: destinationRow.transaction_date,
    },
  ]);
  if (error) throw error;

  return [sourceRow, destinationRow];
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
  const [walletTypes, setWalletTypes] = useState<WalletTypeRow[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  /**
   * DB-truth transaction rows. `transactions` below is the *effective* view:
   * legacy transfer pairs (expense + income legs) collapsed into a single
   * `type = 'transfer'` row so every consumer can simply test
   * `type !== 'transfer'`.
   */
  const rawTransactionsRef = useRef<Transaction[]>([]);

  /** The one write path for transaction state (keeps ref + view in sync). */
  const applyRawTransactions = useCallback((next: Transaction[]) => {
    rawTransactionsRef.current = next;
    setTransactions(normalizeLegacyTransfers(next).transactions);
  }, []);

  /** Raw rows for mutation bookkeeping (falls back to the view on first render). */
  const rawTransactions = useCallback(
    () => (rawTransactionsRef.current.length > 0 ? rawTransactionsRef.current : transactions),
    [transactions],
  );

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
          currency: 'IDR',
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
        applyRawTransactions([]);
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
      let members = (memberRows as unknown as HouseholdMember[]) ?? [];

      // Fallback: if household_members returned empty (e.g. trigger didn't
      // create the row), derive members directly from the profiles table.
      if (members.length === 0 && householdId) {
        const { data: profileRows } = await supabase
          .from('profiles')
          .select('*')
          .eq('household_id', householdId);
        if (profileRows && profileRows.length > 0) {
          members = profileRows.map((p: Profile) => ({
            id: p.id,
            user_id: p.id,
            household_id: householdId,
            role: (p.id === userId ? 'owner' : 'member') as 'owner' | 'member',
            created_at: p.created_at,
            profile: p,
          }));
        }
      }

      setHouseholdMembers(members);

      const { data: wt } = await supabase
        .from('wallet_types')
        .select('*')
        .or(`household_id.eq.${householdId},is_system.eq.true`);
      const rows = (wt as WalletTypeRow[]) ?? [];
      const systemRows = rows.filter((r) => r.is_system);
      const customRows = rows.filter((r) => !r.is_system);
      setWalletTypes([...systemRows, ...customRows]);

      const { data: cat } = await supabase
        .from('categories')
        .select('*')
        .or(`household_id.eq.${householdId},is_system.eq.true`);
      const catRows = (cat as TransactionCategory[]) ?? [];
      const systemCatRows = catRows.filter((r) => r.is_system);
      const customCatRows = catRows.filter((r) => !r.is_system);
      setCategories([...systemCatRows, ...customCatRows]);

      const { data: w } = await supabase
        .from('wallets')
        .select('*')
        .eq('household_id', householdId)
        .is('archived_at', null);
      const walletRows = (w as Wallet[]) ?? [];
      setWallets(walletRows);

      // Include archived (deleted) wallet ids when loading transactions so
      // history created before a wallet was deleted stays visible.
      const { data: allWalletRows } = await supabase
        .from('wallets')
        .select('id')
        .eq('household_id', householdId);
      const walletIds = ((allWalletRows ?? []) as { id: string }[]).map((row) => row.id);
      let txRows: Transaction[] = [];
      if (walletIds.length > 0) {
        const { data: tx } = await supabase
          .from('transactions')
          .select('*')
          .in('wallet_id', walletIds)
          .order('transaction_date', { ascending: false });
        txRows = (tx as Transaction[]) ?? [];
      }
      applyRawTransactions(txRows.sort(sortByDateDesc));

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
  }, [applyRawTransactions]);

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
    applyRawTransactions([...mockTransactions].sort(sortByDateDesc));
    setBudgets(mockBudgets);
    setGoals(mockGoals);
    setWalletTypes(mockWalletTypes);
    setCategories(mockCategories);
    localStorage.setItem('duitbersama_session', 'demo');
  }, [applyRawTransactions]);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      localStorage.removeItem('duitbersama_session');
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
        currency: 'IDR',
        created_at: new Date().toISOString(),
      };

      const { error: profileUpsertError } = await supabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' });

      if (profileUpsertError) throw profileUpsertError;

      localStorage.removeItem('duitbersama_session');
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

  const updateCurrency = useCallback(async (code: string) => {
    await updateProfile({ currency: code });
  }, [updateProfile]);

  const updateAvatar = useCallback(async (file: File) => {
    if (!profile) return;
    if (mode === 'demo') {
      throw new Error('Upload avatar tidak tersedia di demo mode.');
    }
    const avatarUrl = await uploadAvatarToCloudinary(file, profile.id);
    const { error } = await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', profile.id);
    if (error) throw error;
    setProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : prev);
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
        if (k.includes('supabase') || k.includes('gotrue') || k.startsWith('sb-') || k.includes('@supabase')) {
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
    applyRawTransactions([]);
    setBudgets([]);
    setGoals([]);
    setWalletTypes([]);
    setCategories([]);
  }, [mode, applyRawTransactions]);

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
    applyRawTransactions([]);
    setBudgets([]);
    setGoals([]);
    setProfile({ ...profile, household_id: null, role: 'single' });
  }, [loadLiveData, mode, profile, applyRawTransactions]);

  const addWallet = useCallback(async (name: string, type: Wallet['type'], balance: number, icon?: string | null) => {
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
      icon: icon ?? null,
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
        icon: icon ?? null,
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
    // Snapshot the wallet name onto its transactions first so the history
    // keeps showing the wallet name after the wallet is deleted. The wallet
    // itself is soft-deleted (archived) so existing FK/RLS rules and the
    // transaction records remain intact in live mode.
    const target = wallets.find((w) => w.id === id);
    const walletName = target?.name ?? null;

    if (mode === 'live') {
      if (walletName) {
        const { error: txErr } = await supabase
          .from('transactions')
          .update({ wallet_name: walletName })
          .eq('wallet_id', id)
          .is('wallet_name', null);
        if (txErr) throw txErr;
      }
      const { error: walletErr } = await supabase
        .from('wallets')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id);
      if (walletErr) throw walletErr;
    }

    applyRawTransactions(
      rawTransactions().map((tx) =>
        tx.wallet_id === id ? { ...tx, wallet_name: walletName ?? tx.wallet_name } : tx,
      ),
    );
    setWallets(prev => prev.filter(w => w.id !== id));
  }, [mode, wallets, applyRawTransactions, rawTransactions]);

  const addCustomWalletType = useCallback(async (name: string, icon: string): Promise<WalletTypeRow> => {
    const createdAt = new Date().toISOString();
    const baseId = slugify(name) || 'custom';
    let id = baseId;
    let n = 2;
    while (walletTypes.some(t => t.id === id)) {
      id = `${baseId}_${n++}`;
    }
    const local = {
      id,
      name,
      icon,
      user_id: profile?.id,
      household_id: household?.id,
      is_system: false,
      created_at: createdAt,
    };

    if (mode === 'live' && profile && household) {
      const { data, error } = await supabase.from('wallet_types').insert({
        id,
        name,
        icon,
        user_id: profile.id,
        household_id: household.id,
        is_system: false,
      }).select().single();
      if (error) throw error;
      const inserted = (data as WalletTypeRow) ?? local;
      setWalletTypes(prev => [...prev, inserted]);
      return inserted;
    }

    setWalletTypes(prev => [...prev, local]);
    return local;
  }, [household, mode, profile, walletTypes]);

  const updateWalletType = useCallback(async (id: string, updates: Partial<WalletTypeRow>) => {
    if (mode === 'live') {
      const { error } = await supabase.from('wallet_types').update(updates).eq('id', id);
      if (error) throw error;
    }
    setWalletTypes(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, [mode]);

  const deleteWalletType = useCallback(async (id: string) => {
    const inUse = wallets.some(w => w.type === id);
    if (inUse) {
      throw new Error('Tipe wallet ini masih dipakai oleh wallet. Pindahkan wallet tersebut ke tipe lain terlebih dahulu.');
    }
    if (mode === 'live') {
      const { error } = await supabase.from('wallet_types').delete().eq('id', id);
      if (error) throw error;
    }
    setWalletTypes(prev => prev.filter(t => t.id !== id));
  }, [mode, wallets]);

  const addCustomCategory = useCallback(async (name: string, icon: string, type: TransactionCategory['type']): Promise<TransactionCategory> => {
    const createdAt = new Date().toISOString();
    const baseId = slugify(name) || 'custom';
    let id = baseId;
    let n = 2;
    while (categories.some(c => c.id === id)) {
      id = `${baseId}_${n++}`;
    }
    const local = {
      id,
      name,
      icon,
      type,
      user_id: profile?.id,
      household_id: household?.id,
      is_system: false,
      created_at: createdAt,
    };

    if (mode === 'live' && profile && household) {
      const { data, error } = await supabase.from('categories').insert({
        id,
        name,
        icon,
        type,
        user_id: profile.id,
        household_id: household.id,
        is_system: false,
      }).select().single();
      if (error) throw error;
      const inserted = (data as TransactionCategory) ?? local;
      setCategories(prev => [...prev, inserted]);
      return inserted;
    }

    setCategories(prev => [...prev, local]);
    return local;
  }, [categories, household, mode, profile]);

  const updateCategory = useCallback(async (id: string, updates: Partial<TransactionCategory>) => {
    if (mode === 'live') {
      const { error } = await supabase.from('categories').update(updates).eq('id', id);
      if (error) throw error;
    }
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, [mode]);

  const deleteCategory = useCallback(async (id: string) => {
    const inUse = transactions.some(tx => tx.category === id);
    if (inUse) {
      throw new Error('Kategori ini masih dipakai oleh transaksi. Pindahkan transaksi tersebut ke kategori lain terlebih dahulu. / This category is still used by a transaction. Move that transaction to another category first.');
    }
    if (mode === 'live') {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    }
    setCategories(prev => prev.filter(c => c.id !== id));
  }, [mode, transactions]);

  const addTransaction = useCallback(async (tx: Omit<Transaction, 'id' | 'created_at'>) => {
    const targetWallet = wallets.find(w => w.id === tx.wallet_id);
    const destinationWallet = tx.destination_wallet_id
      ? wallets.find(w => w.id === tx.destination_wallet_id)
      : undefined;

    const createdAt = new Date().toISOString();
    const newTx: Transaction = {
      ...tx,
      id: crypto.randomUUID(),
      wallet_name: targetWallet?.name ?? tx.wallet_name ?? null,
      destination_wallet_name: tx.type === 'transfer'
        ? destinationWallet?.name ?? tx.destination_wallet_name ?? null
        : tx.destination_wallet_name ?? null,
      transaction_date: tx.transaction_date || createdAt,
      created_at: createdAt,
    };

    // A transfer debits the source AND credits the destination; income/expense
    // only ever touch their own wallet.
    const effectMap = new Map<string, number>();
    accumulateEffects(effectMap, walletEffects(newTx));

    let persistedRows: Transaction[] = [newTx];

    if (mode === 'live') {
      const { error } = await supabase.from('transactions').insert({
        user_id: profile?.id,
        wallet_id: tx.wallet_id,
        amount: tx.amount,
        type: tx.type,
        category: tx.category,
        notes: tx.notes,
        spent_by: tx.spent_by,
        wallet_name: newTx.wallet_name,
        transaction_date: tx.transaction_date,
        receipt_url: tx.receipt_url ?? null,
        source_wallet_id: newTx.source_wallet_id ?? null,
        destination_wallet_id: newTx.destination_wallet_id ?? null,
        destination_wallet_name: newTx.destination_wallet_name ?? null,
      });

      if (error) {
        if (newTx.type === 'transfer' && isTransferTypeUnsupported(error)) {
          // `type = 'transfer'` migration not applied yet — persist the legacy
          // pair instead. The normalizer collapses it back on read.
          persistedRows = await insertLegacyTransferPair(newTx, targetWallet, destinationWallet);
        } else {
          throw error;
        }
      }

      for (const [walletId, delta] of effectMap) {
        const wallet = wallets.find(w => w.id === walletId);
        if (!wallet || delta === 0) continue;
        const { error: walletError } = await supabase
          .from('wallets')
          .update({ balance: wallet.balance + delta })
          .eq('id', walletId);
        if (walletError) throw walletError;
      }
    }

    applyRawTransactions([...persistedRows, ...rawTransactions()].sort(sortByDateDesc));
    setWallets(prev => prev.map(w => {
      const delta = effectMap.get(w.id);
      return delta ? { ...w, balance: w.balance + delta } : w;
    }));
  }, [mode, profile, wallets, applyRawTransactions, rawTransactions]);

  const bulkImportTransactions = useCallback(async (rows: BulkImportRow[]) => {
    if (rows.length === 0) return;
    if (mode === 'live') {
      const { error } = await supabase.rpc('bulk_import_transactions', { p_rows: rows });
      if (error) throw error;
      if (profile?.id && profile.email) await loadLiveData(profile.id, profile.email);
      return;
    }

    const categoryMap = new Map(categories.map((category) => [category.name.toLowerCase(), category.id]));
    const walletMap = new Map(wallets.map((wallet) => [wallet.name.toLowerCase(), wallet]));
    for (const row of rows) {
      let categoryId = categoryMap.get(row.category.toLowerCase());
      if (!categoryId) {
        const created = await addCustomCategory(row.category, 'Sparkles', row.type);
        categoryId = created.id;
        categoryMap.set(row.category.toLowerCase(), categoryId);
      }
      let wallet = walletMap.get(row.wallet.toLowerCase());
      if (!wallet) {
        wallet = await addWallet(row.wallet, 'cash', 0);
        walletMap.set(row.wallet.toLowerCase(), wallet);
      }
      await addTransaction({
        wallet_id: wallet.id,
        wallet_name: wallet.name,
        amount: row.amount,
        type: row.type,
        category: categoryId,
        notes: row.notes || null,
        spent_by: row.spentBy,
        transaction_date: row.date,
      });
    }
  }, [addCustomCategory, addTransaction, addWallet, categories, loadLiveData, mode, profile, wallets]);

  const goalTitleFromDeposit = (tx: Transaction) => {
    const prefix = 'Deposit ke Goal: ';
    if (tx.category !== 'goals' || !tx.notes?.startsWith(prefix)) return null;
    return tx.notes.slice(prefix.length);
  };

  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    const currentTx = transactions.find((tx) => tx.id === id);
    if (!currentTx) return;

    const updatedTransaction: Transaction = {
      ...currentTx,
      ...updates,
      id,
      amount: updates.amount ?? currentTx.amount,
      type: updates.type ?? currentTx.type,
      category: updates.category ?? currentTx.category,
      notes: updates.notes ?? currentTx.notes,
      spent_by: updates.spent_by ?? currentTx.spent_by,
      transaction_date: updates.transaction_date ?? currentTx.transaction_date,
      wallet_id: updates.wallet_id ?? currentTx.wallet_id,
      user_id: updates.user_id ?? currentTx.user_id,
    };

    // A transfer that was collapsed from a legacy pair still has an income
    // counter-leg in the DB until the migration is applied.
    const rawRows = rawTransactions();
    const legacyIncomeLeg = findLegacyIncomeLeg(rawRows, currentTx);
    const sourceWallet = wallets.find((w) => w.id === updatedTransaction.wallet_id);

    if (updatedTransaction.type === 'transfer') {
      // `wallet_id` always mirrors the source wallet of a transfer.
      updatedTransaction.source_wallet_id = updatedTransaction.wallet_id;
      const destinationId = updatedTransaction.destination_wallet_id ?? null;
      const destinationWallet = wallets.find((w) => w.id === destinationId);
      updatedTransaction.destination_wallet_id = destinationId;
      updatedTransaction.destination_wallet_name =
        destinationWallet?.name ?? updatedTransaction.destination_wallet_name ?? null;
      updatedTransaction.wallet_name = sourceWallet?.name ?? updatedTransaction.wallet_name;
    } else {
      // Removing the transfer semantics: only the edited side keeps a balance
      // effect, so the destination columns are cleared too.
      updatedTransaction.wallet_name = sourceWallet?.name ?? updatedTransaction.wallet_name;
      updatedTransaction.source_wallet_id = null;
      updatedTransaction.destination_wallet_id = null;
      updatedTransaction.destination_wallet_name = null;
    }

    // Net balance change = reverse the old transaction, then apply the new one.
    const effectMap = new Map<string, number>();
    accumulateEffects(effectMap, invertEffects(walletEffects(currentTx)));
    accumulateEffects(effectMap, walletEffects(updatedTransaction));

    const persistedIds = new Set<string>([id]);
    let nextRawRows = rawRows.map((row) => {
      if (row.id !== id) return row;
      return {
        ...row,
        ...updates,
        id,
        wallet_id: updatedTransaction.wallet_id,
        amount: updatedTransaction.amount,
        type: updatedTransaction.type,
        category: updatedTransaction.category,
        notes: updatedTransaction.notes,
        spent_by: updatedTransaction.spent_by,
        transaction_date: updatedTransaction.transaction_date,
        wallet_name: updatedTransaction.wallet_name,
        source_wallet_id: updatedTransaction.source_wallet_id ?? null,
        destination_wallet_id: updatedTransaction.destination_wallet_id ?? null,
        destination_wallet_name: updatedTransaction.destination_wallet_name ?? null,
      };
    });

    if (mode === 'live') {
      if (legacyIncomeLeg) {
        // Pre-migration shape: keep the row as the expense leg of the pair and
        // mirror the edit onto the leftover income leg.
        nextRawRows = nextRawRows.map((row) => {
          if (row.id === legacyIncomeLeg.id) {
            return {
              ...row,
              category: TRANSFER_CATEGORY,
              type: 'income' as const,
              wallet_id: updatedTransaction.destination_wallet_id ?? row.wallet_id,
              wallet_name: updatedTransaction.destination_wallet_name ?? row.wallet_name,
              amount: updatedTransaction.amount,
              notes: updatedTransaction.notes,
              spent_by: updatedTransaction.spent_by,
              transaction_date: updatedTransaction.transaction_date,
            };
          }
          if (row.id !== id) return row;
          return {
            ...row,
            category: TRANSFER_CATEGORY,
            type: 'expense' as const,
            wallet_id: updatedTransaction.source_wallet_id ?? row.wallet_id,
            amount: updatedTransaction.amount,
            notes: updatedTransaction.notes,
            spent_by: updatedTransaction.spent_by,
            transaction_date: updatedTransaction.transaction_date,
            source_wallet_id: null,
            destination_wallet_id: null,
            destination_wallet_name: null,
          };
        });

        persistedIds.add(legacyIncomeLeg.id);
        for (const row of nextRawRows) {
          if (!persistedIds.has(row.id)) continue;
          const { error } = await supabase
            .from('transactions')
            .update({
              category: row.category,
              type: row.type,
              wallet_id: row.wallet_id,
              wallet_name: row.wallet_name ?? null,
              amount: row.amount,
              notes: row.notes,
              spent_by: row.spent_by,
              transaction_date: row.transaction_date,
            })
            .eq('id', row.id);
          if (error) throw error;
        }
      } else {
        const { error } = await supabase
          .from('transactions')
          .update({
            user_id: profile?.id ?? currentTx.user_id,
            wallet_id: updatedTransaction.wallet_id,
            amount: updatedTransaction.amount,
            type: updatedTransaction.type,
            category: updatedTransaction.category,
            notes: updatedTransaction.notes,
            spent_by: updatedTransaction.spent_by,
            wallet_name: updatedTransaction.wallet_name,
            transaction_date: updatedTransaction.transaction_date,
            receipt_url: updatedTransaction.receipt_url ?? null,
            source_wallet_id: updatedTransaction.source_wallet_id ?? null,
            destination_wallet_id: updatedTransaction.destination_wallet_id ?? null,
            destination_wallet_name: updatedTransaction.destination_wallet_name ?? null,
          })
          .eq('id', id);
        if (error) throw error;
      }

      for (const [walletId, delta] of effectMap) {
        const wallet = wallets.find((w) => w.id === walletId);
        if (!wallet || delta === 0) continue;
        const { error: walletError } = await supabase
          .from('wallets')
          .update({ balance: wallet.balance + delta })
          .eq('id', walletId);
        if (walletError) throw walletError;
      }
    }

    const previousAmount = currentTx.amount;
    const nextAmount = updatedTransaction.amount;
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
    applyRawTransactions(nextRawRows.sort(sortByDateDesc));
    setWallets(prev => prev.map((w) => {
      const delta = effectMap.get(w.id);
      return delta ? { ...w, balance: w.balance + delta } : w;
    }));
  }, [mode, profile, transactions, wallets, applyRawTransactions, rawTransactions]);

  const deleteTransaction = useCallback(async (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    const goalTitle = goalTitleFromDeposit(tx);
    const rawRows = rawTransactions();
    // Pre-migration shape: also remove the leftover income leg of the pair.
    const legacyIncomeLeg = findLegacyIncomeLeg(rawRows, tx);

    // Deleting reverses every wallet the transaction had touched. For a
    // transfer that means crediting the source and debiting the destination.
    const effectMap = new Map<string, number>();
    accumulateEffects(effectMap, invertEffects(walletEffects(tx)));

    const removedIds = new Set<string>([id, ...(legacyIncomeLeg ? [legacyIncomeLeg.id] : [])]);

    if (mode === 'live') {
      const { error } = await supabase.from('transactions').delete().in('id', [...removedIds]);
      if (error) throw error;

      for (const [walletId, delta] of effectMap) {
        const wallet = wallets.find(w => w.id === walletId);
        if (!wallet || delta === 0) continue;
        const { error: walletError } = await supabase
          .from('wallets')
          .update({ balance: wallet.balance + delta })
          .eq('id', walletId);
        if (walletError) throw walletError;
      }
    }

    if (goalTitle) {
      setGoals(prev => prev.map((goal) => goal.title === goalTitle
        ? { ...goal, current_amount: Math.max(0, goal.current_amount - tx.amount) }
        : goal));
    }
    applyRawTransactions(rawRows.filter(t => !removedIds.has(t.id)));
    setWallets(prev => prev.map((w) => {
      const delta = effectMap.get(w.id);
      return delta ? { ...w, balance: w.balance + delta } : w;
    }));
  }, [mode, transactions, wallets, applyRawTransactions, rawTransactions]);

  const bulkUpdateTransactions = useCallback(async (
    ids: string[],
    updates: Partial<Pick<Transaction, 'category' | 'wallet_id' | 'spent_by' | 'transaction_date' | 'notes'>>,
  ) => {
    if (ids.length === 0 || Object.keys(updates).length === 0) return;
    // Internal transfers expose a synthetic source -> destination movement, so
    // re-categorising or re-walleting them through the bulk editor is not
    // meaningful. They are edited through the transfer form instead.
    const selected = transactions.filter((tx) => ids.includes(tx.id) && tx.type !== 'transfer');
    const effectiveIds = selected.map((tx) => tx.id);
    if (effectiveIds.length === 0) return;

    const targetWallet = updates.wallet_id ? wallets.find((wallet) => wallet.id === updates.wallet_id) : undefined;
    const databaseUpdates = updates.wallet_id
      ? { ...updates, wallet_name: targetWallet?.name ?? null }
      : updates;
    if (mode === 'live') {
      const { error } = await supabase.from('transactions').update(databaseUpdates).in('id', effectiveIds);
      if (error) throw error;
    }

    const walletChanges = new Map<string, number>();
    for (const tx of selected) {
      const nextWalletId = updates.wallet_id ?? tx.wallet_id;
      if (nextWalletId === tx.wallet_id) continue;
      // Move the whole balance effect of the row to its new wallet.
      for (const effect of walletEffects(tx)) {
        accumulateEffects(walletChanges, invertEffects([effect]));
        accumulateEffects(walletChanges, [{ walletId: nextWalletId, delta: effect.delta }]);
      }
    }
    if (mode === 'live') {
      for (const [walletId, delta] of walletChanges) {
        const wallet = wallets.find((item) => item.id === walletId);
        if (!wallet || delta === 0) continue;
        const { error } = await supabase.from('wallets').update({ balance: wallet.balance + delta }).eq('id', walletId);
        if (error) throw error;
      }
    }

    applyRawTransactions(rawTransactions().map((tx) => {
      if (!effectiveIds.includes(tx.id)) return tx;
      const nextWallet = wallets.find((wallet) => wallet.id === (updates.wallet_id ?? tx.wallet_id));
      return { ...tx, ...updates, wallet_name: nextWallet?.name ?? tx.wallet_name };
    }).sort(sortByDateDesc));
    setWallets((prev) => prev.map((wallet) => {
      const delta = walletChanges.get(wallet.id) ?? 0;
      return delta === 0 ? wallet : { ...wallet, balance: wallet.balance + delta };
    }));
  }, [mode, transactions, wallets, applyRawTransactions, rawTransactions]);

  const bulkDeleteTransactions = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    const rawRows = rawTransactions();
    const selected = transactions.filter((tx) => ids.includes(tx.id));
    if (selected.length === 0) return;

    const removedIds = new Set<string>(selected.map((tx) => tx.id));
    const walletChanges = new Map<string, number>();
    for (const tx of selected) {
      // Reversing a transfer credits its source and debits its destination.
      accumulateEffects(walletChanges, invertEffects(walletEffects(tx)));
      // Drop any leftover legacy income leg so the pair disappears completely.
      const leg = findLegacyIncomeLeg(rawRows, tx);
      if (leg) removedIds.add(leg.id);
    }

    if (mode === 'live') {
      const { error } = await supabase.from('transactions').delete().in('id', [...removedIds]);
      if (error) throw error;

      for (const [walletId, delta] of walletChanges) {
        const wallet = wallets.find((item) => item.id === walletId);
        if (!wallet || delta === 0) continue;
        const { error } = await supabase.from('wallets').update({ balance: wallet.balance + delta }).eq('id', walletId);
        if (error) throw error;
      }
    }

    applyRawTransactions(rawRows.filter((tx) => !removedIds.has(tx.id)));
    setWallets((prev) => prev.map((wallet) => {
      const delta = walletChanges.get(wallet.id) ?? 0;
      return delta === 0 ? wallet : { ...wallet, balance: wallet.balance + delta };
    }));
  }, [mode, transactions, wallets, applyRawTransactions, rawTransactions]);

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
    if (amount <= 0) throw new Error('Jumlah deposit harus lebih dari 0. / Deposit amount must be greater than 0.');
    if (wallet.balance < amount) throw new Error('Saldo wallet tidak mencukupi. / Wallet balance is insufficient.');

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
      wallet_name: wallet.name,
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
        wallet_name: newTx.wallet_name,
        transaction_date: newTx.transaction_date,
      });
      if (txErr) throw txErr;

      const { error: wErr } = await supabase.from('wallets').update({ balance: nextBalance }).eq('id', walletId);
      if (wErr) throw wErr;

      const { error: gErr } = await supabase.from('goals').update({ current_amount: nextCurrent }).eq('id', goalId);
      if (gErr) throw gErr;
    }

    applyRawTransactions([newTx, ...rawTransactions()].sort(sortByDateDesc));
    setWallets(prev => prev.map(w => w.id === walletId ? { ...w, balance: nextBalance } : w));
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, current_amount: nextCurrent } : g));
  }, [goals, mode, profile, wallets, applyRawTransactions, rawTransactions]);

  const value: AppState = {
    mode,
    profile,
    household,
    householdMembers,
    wallets,
    transactions,
    budgets,
    goals,
    walletTypes,
    categories,
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    updateProfile,
    updateCurrency,
    updateAvatar,
    setMode,
    createHousehold,
    joinHousehold,
    leaveHousehold,
    addWallet,
    updateWallet,
    deleteWallet,
    addCustomWalletType,
    updateWalletType,
    deleteWalletType,
    addCustomCategory,
    updateCategory,
    deleteCategory,
    addTransaction,
    bulkImportTransactions,
    updateTransaction,
    deleteTransaction,
    bulkUpdateTransactions,
    bulkDeleteTransactions,
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
