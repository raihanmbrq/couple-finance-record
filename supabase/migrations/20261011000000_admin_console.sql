/*
# Admin Control Panel (Database GUI Management)

## Overview
Backs the admin-only "Admin Console" desktop workspace (route `/admin/dashboard`,
tab `admin-console`). Gives an administrator a GUI to manage every core table:
profiles, invitation tokens, households/couples, wallets and transactions.

## Changes

1. **profiles**
   - `deactivated_at` (timestamptz, nullable) — soft-delete / deactivate marker.
     Deactivated accounts are blocked at login by the client.

2. **transactions**
   - `archived_at` (timestamptz, nullable) — soft-delete marker so admins can
     remove a bad row without losing the audit trail.

3. **Admin RLS policies (API-level guard)**
   The existing policies scope every table to the caller's own household. New
   policies OR'd on top let a caller for whom `public.is_admin()` is true read
   (and where required, mutate) rows across all households. Non-admins are
   unaffected because `public.is_admin()` returns false for them.

4. **Admin RPCs (SECURITY DEFINER)**
   - `admin_set_admin(user, bool)`      — toggle admin flag (guards self-demote).
   - `admin_deactivate_user(user, bool)`— deactivate / reactivate an account.
   - `admin_unpair_household(household)`— detach every member from a household.
   Each re-verifies `public.is_admin()` and raises when called by a non-admin.

## Security (RLS)
- `public.is_admin()` (created in `20261010000000_closed_registration.sql`) is
  the single source of truth for the admin check in every policy and RPC.
- Hard-deleting `auth.users` is intentionally NOT performed here: it requires
  the service-role key and cannot run from the browser. "Delete account" is a
  soft deactivate instead. A future Edge Function can add hard deletes.
*/

-- ==================== 1) profiles.deactivated_at ====================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deactivated_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_profiles_deactivated_at
  ON public.profiles(deactivated_at);

-- ==================== 2) transactions.archived_at ====================
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_transactions_archived_at
  ON public.transactions(archived_at);

-- ==================== 3) Admin RLS policies ====================

-- --- profiles: read + edit every row ---
DROP POLICY IF EXISTS "select_admin_profiles" ON public.profiles;
CREATE POLICY "select_admin_profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "update_admin_profiles" ON public.profiles;
CREATE POLICY "update_admin_profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- --- households: read + edit every row ---
DROP POLICY IF EXISTS "select_admin_households" ON public.households;
CREATE POLICY "select_admin_households" ON public.households
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "update_admin_households" ON public.households;
CREATE POLICY "update_admin_households" ON public.households
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- --- household_members: read every row ---
DROP POLICY IF EXISTS "select_admin_household_members" ON public.household_members;
CREATE POLICY "select_admin_household_members" ON public.household_members
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- --- wallets: read + edit / soft-delete every row ---
DROP POLICY IF EXISTS "select_admin_wallets" ON public.wallets;
CREATE POLICY "select_admin_wallets" ON public.wallets
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "update_admin_wallets" ON public.wallets;
CREATE POLICY "update_admin_wallets" ON public.wallets
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- --- transactions: read + edit + soft-delete every row ---
DROP POLICY IF EXISTS "select_admin_transactions" ON public.transactions;
CREATE POLICY "select_admin_transactions" ON public.transactions
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "update_admin_transactions" ON public.transactions;
CREATE POLICY "update_admin_transactions" ON public.transactions
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "delete_admin_transactions" ON public.transactions;
CREATE POLICY "delete_admin_transactions" ON public.transactions
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- --- read-only monitoring tables ---
DROP POLICY IF EXISTS "select_admin_budgets" ON public.budgets;
CREATE POLICY "select_admin_budgets" ON public.budgets
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "select_admin_goals" ON public.goals;
CREATE POLICY "select_admin_goals" ON public.goals
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "select_admin_wallet_types" ON public.wallet_types;
CREATE POLICY "select_admin_wallet_types" ON public.wallet_types
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "select_admin_categories" ON public.categories;
CREATE POLICY "select_admin_categories" ON public.categories
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- --- invitation_tokens: delete (revoke + purge) ---
GRANT DELETE ON public.invitation_tokens TO authenticated;

DROP POLICY IF EXISTS "delete_invitation_tokens_admin" ON public.invitation_tokens;
CREATE POLICY "delete_invitation_tokens_admin" ON public.invitation_tokens
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ==================== 4) Admin RPCs ====================

-- Toggle the admin flag of another user. Self-demotion is blocked; the
-- `enforce_admin_email` trigger keeps the protected admin account admin.
CREATE OR REPLACE FUNCTION public.admin_set_admin(p_user_id uuid, p_is_admin boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: hanya admin yang dapat mengubah status admin.';
  END IF;
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Anda tidak dapat mengubah status admin akun Anda sendiri.';
  END IF;

  UPDATE public.profiles
  SET is_admin = p_is_admin
  WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_admin(uuid, boolean) TO authenticated;

-- Deactivate / reactivate an account (soft delete). Self-deactivation blocked.
CREATE OR REPLACE FUNCTION public.admin_deactivate_user(p_user_id uuid, p_deactivate boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: hanya admin yang dapat menonaktifkan akun.';
  END IF;
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Anda tidak dapat menonaktifkan akun Anda sendiri.';
  END IF;

  UPDATE public.profiles
  SET deactivated_at = CASE WHEN p_deactivate THEN now() ELSE NULL END
  WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_deactivate_user(uuid, boolean) TO authenticated;

-- Detach every member from a household (unpair). Data rows are preserved; the
-- household simply becomes memberless and reverts to single mode.
CREATE OR REPLACE FUNCTION public.admin_unpair_household(p_household_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: hanya admin yang dapat memisahkan household.';
  END IF;

  DELETE FROM public.household_members WHERE household_id = p_household_id;

  UPDATE public.profiles
  SET household_id = NULL,
      role = 'single'
  WHERE household_id = p_household_id;

  UPDATE public.households
  SET mode = 'single'
  WHERE id = p_household_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_unpair_household(uuid) TO authenticated;
