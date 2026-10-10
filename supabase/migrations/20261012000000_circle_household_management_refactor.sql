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
