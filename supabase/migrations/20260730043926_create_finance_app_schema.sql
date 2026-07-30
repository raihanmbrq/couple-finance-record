/*
# Create Couple Finance App Schema

## Overview
Sets up the full database schema for the "Duit Bersama" couple & personal financial recap app.
Supports single-user mode and couple/household mode with shared wallets, transactions, and budgets.

## New Tables

1. **households** — a financial group (single or couple)
   - `id` (uuid, PK)
   - `name` (text)
   - `invite_code` (text, unique, 6 chars)
   - `mode` (text: 'single' | 'couple')
   - `partner_name` (text, nullable — name of the partner who hasn't joined yet)
   - `created_at` (timestamptz)

2. **profiles** — extends auth.users with display info
   - `id` (uuid, PK, references auth.users)
   - `email` (text, unique)
   - `full_name` (text)
   - `role` (text: 'suami' | 'istri' | 'single' | 'partner')
   - `avatar_url` (text, nullable)
   - `household_id` (uuid, nullable, references households)
   - `created_at` (timestamptz)

3. **wallets** — fund sources belonging to a household
   - `id` (uuid, PK)
   - `household_id` (uuid, FK -> households)
   - `name` (text)
   - `type` (text: 'joint' | 'cash' | 'bank' | 'ewallet')
   - `balance` (bigint, default 0 — stored in rupiah, no decimals)
   - `owner_role` (text, nullable — which partner owns this wallet)
   - `created_at` (timestamptz)

4. **transactions** — income/expense entries
   - `id` (uuid, PK)
   - `wallet_id` (uuid, FK -> wallets)
   - `amount` (bigint — rupiah, no decimals)
   - `type` (text: 'income' | 'expense')
   - `category` (text)
   - `notes` (text, nullable)
   - `spent_by` (text — the name of the user who logged/spent it)
   - `created_at` (timestamptz)

5. **budgets** — monthly category spending limits
   - `id` (uuid, PK)
   - `household_id` (uuid, FK -> households)
   - `category` (text)
   - `limit_amount` (bigint — rupiah)
   - `created_at` (timestamptz)

## Security (RLS)
- All tables have RLS enabled.
- Policies are scoped to `authenticated` users.
- Access is granted through household membership: a user can only access
  wallets, transactions, and budgets that belong to a household they are a member of
  (checked via `profiles.household_id`).
- Profiles: a user can read/update only their own profile row.
- Households: a user can read/update the household they belong to; can insert a new household.
- Wallets: read/insert/update/delete scoped to the user's household.
- Transactions: read/insert/update/delete scoped to wallets in the user's household.
- Budgets: read/insert/update/delete scoped to the user's household.

## Important Notes
1. `household_id` on profiles links a user to their financial group.
2. Invite codes are unique 6-character strings for pairing partners.
3. All monetary amounts are stored as bigint rupiah (no decimals) for simplicity.
4. A helper function `user_household_id()` returns the current user's household_id for policy reuse.
*/

-- ==================== TABLES (create in dependency order) ====================

-- households table (no dependencies)
CREATE TABLE IF NOT EXISTS public.households (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'My Household',
  invite_code text UNIQUE NOT NULL,
  mode text NOT NULL DEFAULT 'single' CHECK (mode IN ('single', 'couple')),
  partner_name text,
  created_at timestamptz DEFAULT now()
);

-- profiles table (depends on households + auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'single',
  avatar_url text,
  household_id uuid REFERENCES public.households(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- wallets table (depends on households)
CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'cash' CHECK (type IN ('joint', 'cash', 'bank', 'ewallet')),
  balance bigint NOT NULL DEFAULT 0,
  owner_role text,
  created_at timestamptz DEFAULT now()
);

-- transactions table (depends on wallets)
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  amount bigint NOT NULL DEFAULT 0,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category text NOT NULL DEFAULT 'other',
  notes text,
  spent_by text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- budgets table (depends on households)
CREATE TABLE IF NOT EXISTS public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  category text NOT NULL,
  limit_amount bigint NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (household_id, category)
);

-- ==================== HELPER FUNCTION ====================
-- Returns the current user's household_id for policy reuse
CREATE OR REPLACE FUNCTION public.user_household_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT household_id FROM public.profiles WHERE id = auth.uid();
$$;

-- ==================== INDEXES ====================
CREATE INDEX IF NOT EXISTS idx_wallets_household ON public.wallets(household_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON public.transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_budgets_household ON public.budgets(household_id);
CREATE INDEX IF NOT EXISTS idx_profiles_household ON public.profiles(household_id);

-- ==================== ENABLE RLS ====================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- ==================== PROFILES POLICIES ====================
DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
CREATE POLICY "select_own_profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON public.profiles;
CREATE POLICY "insert_own_profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
CREATE POLICY "update_own_profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ==================== HOUSEHOLDS POLICIES ====================
DROP POLICY IF EXISTS "select_own_household" ON public.households;
CREATE POLICY "select_own_household" ON public.households
  FOR SELECT TO authenticated
  USING (id = public.user_household_id());

DROP POLICY IF EXISTS "insert_household" ON public.households;
CREATE POLICY "insert_household" ON public.households
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_own_household" ON public.households;
CREATE POLICY "update_own_household" ON public.households
  FOR UPDATE TO authenticated
  USING (id = public.user_household_id())
  WITH CHECK (id = public.user_household_id());

-- ==================== WALLETS POLICIES ====================
DROP POLICY IF EXISTS "select_household_wallets" ON public.wallets;
CREATE POLICY "select_household_wallets" ON public.wallets
  FOR SELECT TO authenticated
  USING (household_id = public.user_household_id());

DROP POLICY IF EXISTS "insert_household_wallets" ON public.wallets;
CREATE POLICY "insert_household_wallets" ON public.wallets
  FOR INSERT TO authenticated
  WITH CHECK (household_id = public.user_household_id());

DROP POLICY IF EXISTS "update_household_wallets" ON public.wallets;
CREATE POLICY "update_household_wallets" ON public.wallets
  FOR UPDATE TO authenticated
  USING (household_id = public.user_household_id())
  WITH CHECK (household_id = public.user_household_id());

DROP POLICY IF EXISTS "delete_household_wallets" ON public.wallets;
CREATE POLICY "delete_household_wallets" ON public.wallets
  FOR DELETE TO authenticated
  USING (household_id = public.user_household_id());

-- ==================== TRANSACTIONS POLICIES ====================
DROP POLICY IF EXISTS "select_household_transactions" ON public.transactions;
CREATE POLICY "select_household_transactions" ON public.transactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.wallets w
      WHERE w.id = transactions.wallet_id
      AND w.household_id = public.user_household_id()
    )
  );

DROP POLICY IF EXISTS "insert_household_transactions" ON public.transactions;
CREATE POLICY "insert_household_transactions" ON public.transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.wallets w
      WHERE w.id = transactions.wallet_id
      AND w.household_id = public.user_household_id()
    )
  );

DROP POLICY IF EXISTS "update_household_transactions" ON public.transactions;
CREATE POLICY "update_household_transactions" ON public.transactions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.wallets w
      WHERE w.id = transactions.wallet_id
      AND w.household_id = public.user_household_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.wallets w
      WHERE w.id = transactions.wallet_id
      AND w.household_id = public.user_household_id()
    )
  );

DROP POLICY IF EXISTS "delete_household_transactions" ON public.transactions;
CREATE POLICY "delete_household_transactions" ON public.transactions
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.wallets w
      WHERE w.id = transactions.wallet_id
      AND w.household_id = public.user_household_id()
    )
  );

-- ==================== BUDGETS POLICIES ====================
DROP POLICY IF EXISTS "select_household_budgets" ON public.budgets;
CREATE POLICY "select_household_budgets" ON public.budgets
  FOR SELECT TO authenticated
  USING (household_id = public.user_household_id());

DROP POLICY IF EXISTS "insert_household_budgets" ON public.budgets;
CREATE POLICY "insert_household_budgets" ON public.budgets
  FOR INSERT TO authenticated
  WITH CHECK (household_id = public.user_household_id());

DROP POLICY IF EXISTS "update_household_budgets" ON public.budgets;
CREATE POLICY "update_household_budgets" ON public.budgets
  FOR UPDATE TO authenticated
  USING (household_id = public.user_household_id())
  WITH CHECK (household_id = public.user_household_id());

DROP POLICY IF EXISTS "delete_household_budgets" ON public.budgets;
CREATE POLICY "delete_household_budgets" ON public.budgets
  FOR DELETE TO authenticated
  USING (household_id = public.user_household_id());
