/*
# Reset all Circle / Household data  (one-off maintenance script)

Resets every user back to **Single Mode** with a **brand-new invite code**,
clearing all circle memberships — WITHOUT deleting any wallet, transaction,
budget, goal, custom category, or custom wallet type.

## Why not just `DELETE FROM households`?
`wallets.household_id` is `ON DELETE CASCADE` and `transactions.wallet_id` is
`ON DELETE CASCADE`. Deleting a household would cascade-delete its wallets and
therefore ALL their transactions. This script instead re-homes each user's own
rows into a fresh personal household first, then removes only the truly empty
legacy households (guarded so it can never cascade into wallets).

## What it does
1. Deletes every `household_members` row (clears all circles).
2. Detaches every profile (`household_id = NULL`, `role = 'single'`).
3. Creates a fresh `Single` household per profile (new unique `invite_code`,
   `owner_id` = the user) and moves that user's own wallets/budgets/goals +
   custom categories/wallet_types into it.
4. Deletes the now-empty legacy households (only those with ZERO references).
5. Prints before/after counts + integrity checks.

## NOT touched
- `transactions` (never referenced directly)
- `invitation_tokens` (closed-registration tester invites — a different system)

## Prerequisites
- Migration `20261012000000_circle_household_management_refactor.sql` applied
  (needs `households.owner_id`, `household_members.joined_at`,
  `mode IN ('Single','Circle')`, and `unique_invite_code()`).

## How to run
Paste this whole file into the Supabase SQL editor (runs as the DB owner, so it
bypasses RLS and executes in a single transaction — any error rolls back).
Prefer running while users are idle; their open sessions just need a refresh.
*/

-- =====================================================================
-- 0) Prerequisite checks
-- =====================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'households' AND column_name = 'owner_id'
  ) THEN
    RAISE EXCEPTION 'Kolom households.owner_id belum ada. Apply migration 20261012000000_circle_household_management_refactor.sql dulu.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'household_members' AND column_name = 'joined_at'
  ) THEN
    RAISE EXCEPTION 'Kolom household_members.joined_at belum ada. Apply migration 20261012000000_circle_household_management_refactor.sql dulu.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'unique_invite_code'
  ) THEN
    RAISE EXCEPTION 'Fungsi unique_invite_code() tidak ditemukan. Apply migration 20260803060000_circle_mode.sql dulu.';
  END IF;
END $$;

-- =====================================================================
-- 1) PRE-CHECK — catat angka ini sebelum reset
-- =====================================================================
SELECT 'households'             AS entity, count(*) AS rows FROM public.households
UNION ALL SELECT 'household_members',     count(*) FROM public.household_members
UNION ALL SELECT 'profiles',              count(*) FROM public.profiles
UNION ALL SELECT 'wallets',               count(*) FROM public.wallets
UNION ALL SELECT 'transactions',          count(*) FROM public.transactions
UNION ALL SELECT 'budgets',               count(*) FROM public.budgets
UNION ALL SELECT 'goals',                 count(*) FROM public.goals
UNION ALL SELECT 'categories (custom)',   count(*) FROM public.categories   WHERE is_system = false
UNION ALL SELECT 'wallet_types (custom)', count(*) FROM public.wallet_types WHERE is_system = false
ORDER BY entity;

-- =====================================================================
-- 2) RESET — everyone back to their own Single household
-- =====================================================================
DO $$
DECLARE
  p       record;
  new_hh  uuid;
  moved   int := 0;
BEGIN
  -- 2a) Clear every circle membership.
  DELETE FROM public.household_members;

  -- 2b) Detach every profile. The ensure_household_member trigger skips
  --     auto-create when household_id becomes NULL, so nothing is created here.
  UPDATE public.profiles
  SET household_id = NULL,
      role = 'single';

  -- 2c) Fresh personal household per profile; move that user's own data.
  FOR p IN
    SELECT id,
           COALESCE(NULLIF(full_name, ''), NULLIF(email, ''), 'My Household') AS nm
    FROM public.profiles
  LOOP
    INSERT INTO public.households (name, invite_code, mode, owner_id)
    VALUES (p.nm, public.unique_invite_code(), 'Single', p.id)
    RETURNING id INTO new_hh;

    -- Wallets / budgets / goals each carry user_id; transactions follow
    -- wallets via wallet_id, so they move with the wallet and are never lost.
    UPDATE public.wallets SET household_id = new_hh WHERE user_id = p.id;
    UPDATE public.budgets SET household_id = new_hh WHERE user_id = p.id;
    UPDATE public.goals   SET household_id = new_hh WHERE user_id = p.id;

    -- Custom categories: move the earliest row per name first …
    UPDATE public.categories c
    SET household_id = new_hh
    WHERE c.user_id = p.id
      AND c.is_system = false
      AND c.id = (
        SELECT c2.id
        FROM public.categories c2
        WHERE c2.user_id = p.id AND c2.is_system = false AND c2.name = c.name
        ORDER BY c2.created_at ASC NULLS LAST, c2.id ASC
        LIMIT 1
      );

    -- … then move any remaining duplicates, disambiguating the name so the
    -- UNIQUE (household_id, name) constraint cannot be violated (the id is
    -- kept intact, so existing transactions keep resolving to the category).
    UPDATE public.categories c
    SET name = c.name || ' (' || c.id || ')',
        household_id = new_hh
    WHERE c.user_id = p.id
      AND c.is_system = false
      AND c.household_id IS DISTINCT FROM new_hh;

    -- Custom wallet types: same treatment.
    UPDATE public.wallet_types wt
    SET household_id = new_hh
    WHERE wt.user_id = p.id
      AND wt.is_system = false
      AND wt.id = (
        SELECT wt2.id
        FROM public.wallet_types wt2
        WHERE wt2.user_id = p.id AND wt2.is_system = false AND wt2.name = wt.name
        ORDER BY wt2.created_at ASC NULLS LAST, wt2.id ASC
        LIMIT 1
      );

    UPDATE public.wallet_types wt
    SET name = wt.name || ' (' || wt.id || ')',
        household_id = new_hh
    WHERE wt.user_id = p.id
      AND wt.is_system = false
      AND wt.household_id IS DISTINCT FROM new_hh;

    -- The user becomes the owner of their fresh household.
    INSERT INTO public.household_members (user_id, household_id, role, joined_at)
    VALUES (p.id, new_hh, 'owner', now())
    ON CONFLICT (user_id) DO UPDATE
      SET household_id = EXCLUDED.household_id,
          role = 'owner';

    -- Point the profile at the new household.
    UPDATE public.profiles
    SET household_id = new_hh,
        role = 'single'
    WHERE id = p.id;

    moved := moved + 1;
  END LOOP;

  RAISE NOTICE '[reset_circles] % profile(s) reset ke household Single masing-masing.', moved;
END $$;

-- =====================================================================
-- 3) Delete the now-empty legacy households.
--    The guards make it IMPOSSIBLE to cascade into wallets/transactions:
--    any household still holding a wallet/budget/goal/member/category/
--    wallet_type/profile is left untouched.
-- =====================================================================
DELETE FROM public.households h
WHERE NOT EXISTS (SELECT 1 FROM public.household_members m WHERE m.household_id = h.id)
  AND NOT EXISTS (SELECT 1 FROM public.wallets      w  WHERE w.household_id  = h.id)
  AND NOT EXISTS (SELECT 1 FROM public.budgets      b  WHERE b.household_id  = h.id)
  AND NOT EXISTS (SELECT 1 FROM public.goals        g  WHERE g.household_id  = h.id)
  AND NOT EXISTS (SELECT 1 FROM public.categories   c  WHERE c.household_id  = h.id)
  AND NOT EXISTS (SELECT 1 FROM public.wallet_types wt WHERE wt.household_id = h.id)
  AND NOT EXISTS (SELECT 1 FROM public.profiles     pr WHERE pr.household_id = h.id);

-- =====================================================================
-- 4) POST-CHECK
-- =====================================================================

-- 4a) Counts — wallets/transactions/budgets/goals/custom rows MUST match
--     the pre-check numbers (households/household_members will differ).
SELECT 'households'             AS entity, count(*) AS rows FROM public.households
UNION ALL SELECT 'household_members',     count(*) FROM public.household_members
UNION ALL SELECT 'profiles',              count(*) FROM public.profiles
UNION ALL SELECT 'wallets',               count(*) FROM public.wallets
UNION ALL SELECT 'transactions',          count(*) FROM public.transactions
UNION ALL SELECT 'budgets',               count(*) FROM public.budgets
UNION ALL SELECT 'goals',                 count(*) FROM public.goals
UNION ALL SELECT 'categories (custom)',   count(*) FROM public.categories   WHERE is_system = false
UNION ALL SELECT 'wallet_types (custom)', count(*) FROM public.wallet_types WHERE is_system = false
ORDER BY entity;

-- 4b) Integrity — every value below MUST be 0.
SELECT 'profiles tanpa owner-membership yang cocok' AS check_name, count(*) AS violations
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.household_members m
  WHERE m.user_id = p.id
    AND m.role = 'owner'
    AND m.household_id = p.household_id
)
UNION ALL
SELECT 'profiles tanpa household_id', count(*)
FROM public.profiles WHERE household_id IS NULL
UNION ALL
SELECT 'households bukan mode Single', count(*)
FROM public.households WHERE mode <> 'Single'
UNION ALL
SELECT 'households tanpa owner_id', count(*)
FROM public.households WHERE owner_id IS NULL
UNION ALL
SELECT 'household_members bukan owner', count(*)
FROM public.household_members WHERE role <> 'owner'
UNION ALL
SELECT 'households dengan > 1 member', count(*)
FROM (
  SELECT household_id FROM public.household_members
  GROUP BY household_id HAVING count(*) > 1
) multi
UNION ALL
SELECT 'wallets orphan (household hilang)', count(*)
FROM public.wallets w
WHERE NOT EXISTS (SELECT 1 FROM public.households h WHERE h.id = w.household_id)
UNION ALL
SELECT 'transactions orphan (wallet hilang)', count(*)
FROM public.transactions t
WHERE NOT EXISTS (SELECT 1 FROM public.wallets w WHERE w.id = t.wallet_id)
ORDER BY check_name;

-- =====================================================================
-- Done. Jika semua angka integritas 0 dan wallets/transactions sama
-- dengan pre-check, reset berhasil.
-- =====================================================================
