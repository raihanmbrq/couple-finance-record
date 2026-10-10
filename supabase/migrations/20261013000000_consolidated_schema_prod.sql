/*
# Consolidated Production Release - Closed Registration + Admin Console + Circle Refactor

## Purpose
One-shot migration that bundles the three feature migrations below so production
can be brought up to date with a single paste into the Supabase SQL editor:

  1. 20261010000000_closed_registration.sql
  2. 20261011000000_admin_console.sql
  3. 20261012000000_circle_household_management_refactor.sql

The original files are kept unchanged for history. This file is the union of
their contents, in the same order they were authored. Every statement is
idempotent, so it is safe to paste again if a run is interrupted.

## Scope
Schema / RLS / RPC changes only. The destructive data normalisation that resets
every user back to Single Mode lives in a SEPARATE file:
supabase/scripts/reset_circles.sql. Run that one afterwards only if you really
want to disband the existing circles.

## Ordering (do not reorder)
- closed_registration creates public.is_admin() and public.invitation_tokens,
  which the admin console and the refactor depend on.
- admin_console GRANTs DELETE on invitation_tokens, so that table must exist.
- In the refactor, households_owner_id_fkey is DEFERRABLE and is added last
  (section 5b), after every other ALTER TABLE / DML on households; otherwise a
  later ALTER TABLE households fails with SQLSTATE 55006 (pending trigger
  events) when the whole file runs in a single transaction.

## How to apply
Paste this entire file into the Supabase SQL editor for the target project. It
runs as the DB owner, bypasses RLS and executes in a single transaction, so any
error rolls everything back. There is no Supabase CLI config in this repository
and no CLI is installed, therefore validate on a staging project first.

## Contents
  Section A. Closed Registration (invited-tester gate + admin flag)
  Section B. Admin Console (admin RLS policies + admin RPCs)
  Section C. Circle / Household Management Refactor
*/

-- ###################################################################
-- # SECTION A - Closed Registration (from 20261010000000)           #
-- ###################################################################
/*
# Closed Registration (Invited Tester Only)

## Overview
Restricts PairFlow signups to invited testers only. Adds admin/first-login flags
to `profiles`, an `invitation_tokens` table, and a server-side gate on
`auth.users` so the public signup API cannot be bypassed (e.g. via Postman).

## Changes

1. **profiles**
   - `is_admin` (boolean, default false) — flags admin users (generate invites).
   - `is_first_login` (boolean, default false) — drives the one-time
     "Adjust Nama Lengkap" popup. Existing users stay `false` so nothing changes
     for them.
   - `mubaroqraihan@gmail.com` is backfilled to `is_admin = true`.

2. **invitation_tokens** (new)
   - `id` (uuid, PK, default gen_random_uuid())
   - `email` (text, not null) — the only email allowed to redeem the token
   - `token` (text, unique, not null)
   - `is_used` (boolean, default false)
   - `created_by` (uuid, references profiles(id))
   - `expires_at` (timestamptz, default now() + 7 days)
   - `created_at` (timestamptz, default now())

3. **Helpers (SECURITY DEFINER)**
   - `is_admin(user_id)` — true when the caller's profile has `is_admin`.
   - `verify_invitation_token(token)` — returns the bound email for a token that
     is unused and unexpired, otherwise NULL. Kept as an RPC so anonymous users
     can validate *their own* token without being able to enumerate the table.

4. **Signup gate**
   - `validate_invitation_on_signup()` BEFORE INSERT trigger on `auth.users`
     requires a valid, unused, unexpired token matching the new user's email
     (passed via signUp metadata `invitation_token`) and consumes it atomically.

## Security (RLS)
- `invitation_tokens` RLS enabled. SELECT/INSERT/UPDATE restricted to admins.
- Token consumption inside the signup trigger runs as SECURITY DEFINER and
  therefore bypasses RLS for the atomic UPDATE.

## Important Notes
1. Existing registered users are unaffected (the `auth.users` trigger only fires
   on INSERT).
2. `verify_invitation_token` is granted to `anon` + `authenticated` because the
   token entry page is public; it only reveals the email bound to a token the
   caller already possesses.
*/

-- ==================== 1) profiles flags ====================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_first_login boolean NOT NULL DEFAULT false;

-- Backfill the admin account (case-insensitive match).
UPDATE public.profiles
SET is_admin = true
WHERE lower(email) = 'mubaroqraihan@gmail.com';

-- Enforce the admin flag server-side for that email, so it also applies when the
-- admin profile is created later (they cannot be locked out or self-demoted).
CREATE OR REPLACE FUNCTION public.enforce_admin_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(NEW.email) = 'mubaroqraihan@gmail.com' THEN
    NEW.is_admin := true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_admin_email ON public.profiles;
CREATE TRIGGER enforce_admin_email
BEFORE INSERT OR UPDATE OF email, is_admin ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_admin_email();

-- ==================== 2) invitation_tokens table ====================
CREATE TABLE IF NOT EXISTS public.invitation_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text UNIQUE NOT NULL,
  is_used boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS invitation_tokens_email_idx
  ON public.invitation_tokens (lower(email));

CREATE INDEX IF NOT EXISTS invitation_tokens_token_idx
  ON public.invitation_tokens (token);

-- ==================== 3) Helper functions ====================
-- Admin check for RLS + frontend gating.
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = p_user_id),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, anon;

-- Public token verification. Returns the bound email only when the token is
-- valid, unused and unexpired; otherwise NULL. Avoids exposing the table.
CREATE OR REPLACE FUNCTION public.verify_invitation_token(p_token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) = 0 THEN
    RETURN NULL;
  END IF;

  SELECT email INTO v_email
  FROM public.invitation_tokens
  WHERE token = trim(p_token)
    AND is_used = false
    AND expires_at > now()
  LIMIT 1;

  RETURN v_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_invitation_token(text) TO authenticated, anon;

-- ==================== 4) Signup gate (server-side, bypass-proof) ====================
CREATE OR REPLACE FUNCTION public.validate_invitation_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token text;
  v_match uuid;
BEGIN
  v_token := NEW.raw_user_meta_data ->> 'invitation_token';

  IF v_token IS NULL OR length(trim(v_token)) = 0 THEN
    RAISE EXCEPTION 'Registrasi tertutup. Diperlukan token undangan untuk membuat akun.';
  END IF;

  SELECT id INTO v_match
  FROM public.invitation_tokens
  WHERE token = trim(v_token)
    AND lower(email) = lower(NEW.email)
    AND is_used = false
    AND expires_at > now()
  LIMIT 1;

  IF v_match IS NULL THEN
    RAISE EXCEPTION 'Token undangan tidak valid, sudah digunakan, atau sudah kadaluarsa.';
  END IF;

  -- Consume the token atomically with the account creation.
  UPDATE public.invitation_tokens
  SET is_used = true
  WHERE id = v_match;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_invitation_on_signup ON auth.users;
CREATE TRIGGER validate_invitation_on_signup
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.validate_invitation_on_signup();

-- ==================== 5) RLS & policies ====================
ALTER TABLE public.invitation_tokens ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.invitation_tokens TO authenticated;

-- Only admins may read invitation tokens (history table on the admin page).
DROP POLICY IF EXISTS "select_invitation_tokens_admin" ON public.invitation_tokens;
CREATE POLICY "select_invitation_tokens_admin" ON public.invitation_tokens
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Only admins may insert invitation tokens (they author them as themselves).
DROP POLICY IF EXISTS "insert_invitation_tokens_admin" ON public.invitation_tokens;
CREATE POLICY "insert_invitation_tokens_admin" ON public.invitation_tokens
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() AND created_by = auth.uid());

-- Only admins may update invitation tokens (e.g. revoke / manual consume).
DROP POLICY IF EXISTS "update_invitation_tokens_admin" ON public.invitation_tokens;
CREATE POLICY "update_invitation_tokens_admin" ON public.invitation_tokens
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ###################################################################
-- # SECTION B - Admin Console (from 20261011000000)                 #
-- ###################################################################
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


-- ###################################################################
-- # SECTION C - Circle / Household Refactor (from 20261012000000)   #
-- ###################################################################
/*
# Circle / Household Management Refactor

## Overview
Aligns the household schema and business logic with the Circle/Household
specification:

- `households.mode` uses the values `'Single'` / `'Circle'` (was `'single'` /
  `'couple'`). `Single` = the user stands alone; `Circle` = two or more members
  share the household.
- `households.partner_name` is dropped — membership lives entirely in
  `household_members`.
- `households.owner_id` records the owner of the household's invite code so a
  member's original personal household can be re-used (updated, never
  re-created) when they leave a circle.
- `household_members.created_at` is renamed to `joined_at`.
- `invite_code` keeps its UNIQUE constraint.
- RPCs are (re)defined: `join_circle`, `leave_circle`, `remove_member`,
  plus the recreated `ensure_personal_household` / `create_household`
  (Single-only) and the auto-create trigger.

NOTE: the physical table name stays `household_members` (not
`households_members`) to avoid churn across RLS policies and the admin console.

## Applying
There is no Supabase CLI config in this repository. Apply this file to the
target project through the Supabase SQL editor (or `supabase db push` once the
project is linked).
*/

-- =====================================================================
-- 1) household_members.created_at -> joined_at
-- =====================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'household_members'
      AND column_name = 'created_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'household_members'
      AND column_name = 'joined_at'
  ) THEN
    ALTER TABLE public.household_members RENAME COLUMN created_at TO joined_at;
  END IF;
END $$;

-- =====================================================================
-- 2) households.owner_id column
--    NOTE: the FOREIGN KEY is added in section 5b, AFTER every other
--    ALTER TABLE / DML on `households`. A DEFERRABLE constraint queues
--    pending trigger events on any later write, which makes a subsequent
--    `ALTER TABLE households` fail with SQLSTATE 55006
--    ("cannot ALTER TABLE ... because it has pending trigger events")
--    when the whole file runs in one transaction (Supabase SQL editor).
-- =====================================================================
ALTER TABLE public.households
  ADD COLUMN IF NOT EXISTS owner_id uuid;

ALTER TABLE public.households
  DROP CONSTRAINT IF EXISTS households_owner_id_fkey;

-- =====================================================================
-- 3) households.mode -> 'Single' | 'Circle'
-- =====================================================================
ALTER TABLE public.households
  DROP CONSTRAINT IF EXISTS households_mode_check;

ALTER TABLE public.households
  ALTER COLUMN mode SET DEFAULT 'Single';

-- Only touch legacy values so a re-run never downgrades an existing 'Circle'.
UPDATE public.households
SET mode = CASE lower(mode) WHEN 'couple' THEN 'Circle' ELSE 'Single' END
WHERE mode NOT IN ('Single', 'Circle');

ALTER TABLE public.households
  ADD CONSTRAINT households_mode_check CHECK (mode IN ('Single', 'Circle'));

-- =====================================================================
-- 4) Ensure invite_code stays UNIQUE
-- =====================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'households'
      AND c.contype = 'u'
      AND pg_get_constraintdef(c.oid) LIKE '%invite_code%'
  ) THEN
    ALTER TABLE public.households
      ADD CONSTRAINT households_invite_code_key UNIQUE (invite_code);
  END IF;
END $$;

-- =====================================================================
-- 5) Drop the deprecated partner_name column
-- =====================================================================
ALTER TABLE public.households
  DROP COLUMN IF EXISTS partner_name;

-- =====================================================================
-- 5b) Backfill owner_id, THEN add the FOREIGN KEY + index LAST.
--     CRITICAL: `households_owner_id_fkey` is DEFERRABLE INITIALLY
--     DEFERRED, so any DML on `households` after it exists queues a
--     pending trigger event; a following `ALTER TABLE households` then
--     fails with 55006. Adding it after every other ALTER + the backfill
--     UPDATE keeps this migration order-safe in a single transaction.
-- =====================================================================
UPDATE public.households h
SET owner_id = m.user_id
FROM (
  SELECT DISTINCT ON (household_id) household_id, user_id
  FROM public.household_members
  WHERE role = 'owner'
  ORDER BY household_id, joined_at ASC, user_id ASC
) m
WHERE m.household_id = h.id
  AND h.owner_id IS NULL;

ALTER TABLE public.households
  ADD CONSTRAINT households_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE SET NULL
  DEFERRABLE INITIALLY DEFERRED;

CREATE INDEX IF NOT EXISTS idx_households_owner ON public.households(owner_id);

-- =====================================================================
-- 6) ensure_household_member trigger: creator becomes owner of a fresh
--    'Single' household; joiners become 'member'. Mode is managed by the
--    RPCs (never forced to 'Circle' here, so a personal household stays
--    'Single' when a profile points back to it).
-- =====================================================================
CREATE OR REPLACE FUNCTION public.ensure_household_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code text;
  hh_id uuid;
  m_role text;
  existing int;
BEGIN
  -- Leaving a household clears household_id: never auto-recreate a new one.
  IF TG_OP = 'UPDATE' AND NEW.household_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.household_id IS NULL THEN
    -- New user (or re-created personal household): creator becomes owner.
    code := public.unique_invite_code();
    INSERT INTO public.households (name, invite_code, mode, owner_id)
    VALUES (COALESCE(NULLIF(NEW.full_name, ''), 'My Household'), code, 'Single', NEW.id)
    RETURNING id INTO hh_id;

    NEW.household_id := hh_id;
    NEW.role := 'single';
    m_role := 'owner';
  ELSE
    -- Joining an existing household: member unless they are the first member.
    hh_id := NEW.household_id;
    SELECT count(*) + 1 INTO existing
    FROM public.household_members m2
    WHERE m2.household_id = hh_id
      AND m2.user_id <> NEW.id;

    IF existing > 10 THEN
      RAISE EXCEPTION 'Circle ini sudah mencapai batas maksimal 10 anggota.';
    END IF;

    m_role := CASE WHEN existing = 1 THEN 'owner' ELSE 'member' END;

    -- Record an owner for legacy households that predate owner_id.
    UPDATE public.households
    SET owner_id = COALESCE(owner_id, NEW.id)
    WHERE id = hh_id;
  END IF;

  INSERT INTO public.household_members (user_id, household_id, role, joined_at)
  VALUES (NEW.id, hh_id, m_role, now())
  ON CONFLICT (user_id) DO UPDATE
  SET household_id = EXCLUDED.household_id,
      role = CASE
        -- Only preserve 'owner' when the existing membership row already
        -- belongs to the SAME household (i.e. the user is not moving).
        WHEN public.household_members.household_id = EXCLUDED.household_id
             AND public.household_members.role = 'owner'
        THEN 'owner'
        ELSE EXCLUDED.role
      END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_profile_household_member ON public.profiles;
CREATE TRIGGER ensure_profile_household_member
BEFORE INSERT OR UPDATE OF household_id ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.ensure_household_member();

-- =====================================================================
-- 7) create_household: always creates a personal 'Single' household and
--    moves the caller's data into it. (Circle mode is reached by joining.)
-- =====================================================================
DROP FUNCTION IF EXISTS public.create_household(text, text, text);

CREATE OR REPLACE FUNCTION public.create_household(p_name text DEFAULT NULL)
RETURNS public.households
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_row public.profiles;
  result public.households;
  member_count int;
BEGIN
  SELECT * INTO profile_row FROM public.profiles WHERE id = auth.uid();
  IF profile_row.id IS NULL THEN
    RAISE EXCEPTION 'Profil tidak ditemukan';
  END IF;

  -- Already in a circle: must leave it first.
  IF profile_row.household_id IS NOT NULL THEN
    SELECT count(*) INTO member_count
    FROM public.household_members
    WHERE household_id = profile_row.household_id;

    IF member_count > 1 THEN
      RAISE EXCEPTION 'Keluar dari circle saat ini terlebih dahulu.';
    END IF;
  END IF;

  INSERT INTO public.households (name, invite_code, mode, owner_id)
  VALUES (
    COALESCE(NULLIF(p_name, ''), NULLIF(profile_row.full_name, ''), 'My Household'),
    public.unique_invite_code(),
    'Single',
    auth.uid()
  )
  RETURNING * INTO result;

  PERFORM public.rehome_user_data(result.id);

  -- Explicitly insert the owner membership row before updating the profile.
  INSERT INTO public.household_members (user_id, household_id, role, joined_at)
  VALUES (auth.uid(), result.id, 'owner', now())
  ON CONFLICT (user_id) DO UPDATE
  SET household_id = result.id,
      role = 'owner';

  UPDATE public.profiles
  SET household_id = result.id,
      role = 'single'
  WHERE id = auth.uid();

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_household(text) TO authenticated;

-- =====================================================================
-- 8) ensure_personal_household: guarantee the caller has a 'Single' home.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.ensure_personal_household()
RETURNS public.households
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.households;
  my_name text;
BEGIN
  SELECT h.* INTO result
  FROM public.profiles p
  JOIN public.households h ON h.id = p.household_id
  WHERE p.id = auth.uid();

  IF result.id IS NOT NULL THEN
    RETURN result;
  END IF;

  SELECT COALESCE(NULLIF(full_name, ''), 'My Household') INTO my_name
  FROM public.profiles WHERE id = auth.uid();

  INSERT INTO public.households (name, invite_code, mode, owner_id)
  VALUES (my_name, public.unique_invite_code(), 'Single', auth.uid())
  RETURNING * INTO result;

  -- Trigger creates the owner membership row.
  UPDATE public.profiles
  SET household_id = result.id,
      role = 'single'
  WHERE id = auth.uid();

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_personal_household() TO authenticated;

-- =====================================================================
-- 9) join_circle: validate the invite code, add the caller to the target
--    household as 'member' and switch the household to 'Circle' mode.
--    The joiner's own personal household row is preserved untouched; only
--    their profile pointer (and their own data rows) move.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.join_circle(p_invite_code text)
RETURNS public.households
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target public.households;
  profile_row public.profiles;
  member_count int;
BEGIN
  SELECT * INTO profile_row FROM public.profiles WHERE id = auth.uid();
  IF profile_row.id IS NULL THEN
    RAISE EXCEPTION 'Profil tidak ditemukan';
  END IF;

  SELECT * INTO target
  FROM public.households
  WHERE invite_code = upper(trim(p_invite_code));

  IF target.id IS NULL THEN
    RAISE EXCEPTION 'Kode undangan tidak ditemukan. Periksa kembali 6 digit kode Anda.';
  END IF;

  -- Already in this household: no-op.
  IF profile_row.household_id = target.id THEN
    RETURN target;
  END IF;

  SELECT count(*) INTO member_count
  FROM public.household_members
  WHERE household_id = target.id;

  IF member_count >= 10 THEN
    RAISE EXCEPTION 'Circle ini sudah mencapai batas maksimal 10 anggota.';
  END IF;

  -- Move the joiner's wallets/budgets/goals (and their transactions via
  -- wallet_id) into the circle BEFORE repointing the profile.
  PERFORM public.rehome_user_data(target.id);

  -- Membership is always 'member' for a joiner.
  INSERT INTO public.household_members (user_id, household_id, role, joined_at)
  VALUES (auth.uid(), target.id, 'member', now())
  ON CONFLICT (user_id) DO UPDATE
  SET household_id = target.id,
      role = 'member';

  UPDATE public.profiles
  SET household_id = target.id,
      role = 'partner'
  WHERE id = auth.uid();

  UPDATE public.households
  SET mode = 'Circle',
      owner_id = COALESCE(
        owner_id,
        (SELECT user_id FROM public.household_members
         WHERE household_id = target.id AND role = 'owner'
         ORDER BY joined_at ASC, user_id ASC LIMIT 1)
      )
  WHERE id = target.id
  RETURNING * INTO target;

  RETURN target;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_circle(text) TO authenticated;

-- Backward-compatible alias for older clients.
CREATE OR REPLACE FUNCTION public.join_household_by_code(code text)
RETURNS public.households
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.join_circle(code);
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_household_by_code(text) TO authenticated;

-- =====================================================================
-- 10) leave_circle: a solo user just rotates their code; a circle member is
--     detached, their original personal household row is UPDATED (never
--     re-created) with a fresh code and 'Single' mode, and the circle drops
--     back to 'Single' when only the owner remains.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.leave_circle()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  my_hh uuid;
  personal_hh uuid;
  member_count int;
  remaining int;
  my_name text;
BEGIN
  SELECT p.household_id, COALESCE(NULLIF(p.full_name, ''), 'My Household')
    INTO my_hh, my_name
  FROM public.profiles p
  WHERE p.id = auth.uid();

  IF my_hh IS NULL THEN
    RETURN;
  END IF;

  SELECT count(*) INTO member_count
  FROM public.household_members
  WHERE household_id = my_hh;

  IF member_count <= 1 THEN
    -- Personal household: keep all data, just rotate the code.
    UPDATE public.households
    SET invite_code = public.unique_invite_code(),
        mode = 'Single',
        owner_id = COALESCE(owner_id, auth.uid())
    WHERE id = my_hh;

    UPDATE public.profiles SET role = 'single' WHERE id = auth.uid();
    RETURN;
  END IF;

  -- A circle owner may not abandon members; hand over or remove them first.
  IF EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = my_hh AND user_id = auth.uid() AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Owner tidak dapat keluar selama masih ada anggota. Keluarkan anggota terlebih dahulu.';
  END IF;

  -- Find the caller's own personal household (created at signup / last leave).
  SELECT id INTO personal_hh
  FROM public.households
  WHERE owner_id = auth.uid()
    AND id <> my_hh
  ORDER BY created_at ASC
  LIMIT 1;

  IF personal_hh IS NULL THEN
    -- Legacy fallback: the user never had a personal row — create one.
    INSERT INTO public.households (name, invite_code, mode, owner_id)
    VALUES (my_name, public.unique_invite_code(), 'Single', auth.uid())
    RETURNING id INTO personal_hh;
  ELSE
    UPDATE public.households
    SET invite_code = public.unique_invite_code(),
        mode = 'Single'
    WHERE id = personal_hh;
  END IF;

  -- Move the caller's data back out of the circle.
  PERFORM public.rehome_user_data(personal_hh);

  DELETE FROM public.household_members WHERE user_id = auth.uid();

  UPDATE public.profiles
  SET household_id = personal_hh,
      role = 'single'
  WHERE id = auth.uid();

  -- Downgrade the former circle when only the owner is left.
  SELECT count(*) INTO remaining
  FROM public.household_members
  WHERE household_id = my_hh;

  IF remaining <= 1 THEN
    UPDATE public.households SET mode = 'Single' WHERE id = my_hh;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.leave_circle() TO authenticated;

-- Backward-compatible alias for older clients.
CREATE OR REPLACE FUNCTION public.leave_current_household()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.leave_circle();
END;
$$;

GRANT EXECUTE ON FUNCTION public.leave_current_household() TO authenticated;

-- =====================================================================
-- 11) remove_member: an owner removes a member from their circle. The
--     removed member gets their original personal household back (updated,
--     never re-created), and the circle drops to 'Single' when only the
--     owner remains.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.remove_member(p_member_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_hh uuid;
  target_hh uuid;
  personal_hh uuid;
  remaining int;
  target_name text;
BEGIN
  -- The caller must own a household.
  SELECT household_id INTO owner_hh
  FROM public.household_members
  WHERE user_id = auth.uid() AND role = 'owner'
  LIMIT 1;

  IF owner_hh IS NULL THEN
    RAISE EXCEPTION 'Akses ditolak: hanya owner yang dapat mengeluarkan anggota.';
  END IF;

  IF p_member_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Owner tidak dapat mengeluarkan dirinya sendiri. Gunakan "Keluar Circle".';
  END IF;

  SELECT household_id, COALESCE(NULLIF(full_name, ''), 'Member')
    INTO target_hh, target_name
  FROM public.profiles
  WHERE id = p_member_user_id;

  IF target_hh IS NULL OR target_hh <> owner_hh THEN
    RAISE EXCEPTION 'Anggota tersebut tidak berada di circle Anda.';
  END IF;

  -- Find the removed member's own personal household.
  SELECT id INTO personal_hh
  FROM public.households
  WHERE owner_id = p_member_user_id
    AND id <> owner_hh
  ORDER BY created_at ASC
  LIMIT 1;

  IF personal_hh IS NULL THEN
    -- Legacy fallback: create a personal household for the removed member.
    INSERT INTO public.households (name, invite_code, mode, owner_id)
    VALUES (target_name, public.unique_invite_code(), 'Single', p_member_user_id)
    RETURNING id INTO personal_hh;
  ELSE
    UPDATE public.households
    SET invite_code = public.unique_invite_code(),
        mode = 'Single'
    WHERE id = personal_hh;
  END IF;

  -- Move the removed member's data back out of the circle.
  PERFORM public.rehome_user_data(personal_hh, p_member_user_id);

  DELETE FROM public.household_members WHERE user_id = p_member_user_id;

  UPDATE public.profiles
  SET household_id = personal_hh,
      role = 'single'
  WHERE id = p_member_user_id;

  -- Downgrade the circle when only the owner is left.
  SELECT count(*) INTO remaining
  FROM public.household_members
  WHERE household_id = owner_hh;

  IF remaining <= 1 THEN
    UPDATE public.households SET mode = 'Single' WHERE id = owner_hh;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.remove_member(uuid) TO authenticated;

-- =====================================================================
-- 12) admin_unpair_household: keep the admin console consistent with the
--     new mode values.
-- =====================================================================
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
  SET mode = 'Single'
  WHERE id = p_household_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_unpair_household(uuid) TO authenticated;

