-- Fix: guarantee household_members row is always created when a user
-- joins or creates a household, and repair stale data from earlier
-- migrations where the BEFORE-UPDATE trigger on profiles was the sole
-- mechanism (it could silently skip the insert in edge cases).

-- =====================================================================
-- 1) Fix ensure_household_member trigger
--    The old ON CONFLICT clause always preserved 'owner' role even when
--    the user moved from their solo household into someone else's circle.
--    Fix: only preserve 'owner' when the EXISTING row is in the SAME
--    household; otherwise overwrite with the new role.
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
    INSERT INTO public.households (name, invite_code, mode, partner_name)
    VALUES (COALESCE(NULLIF(NEW.full_name, ''), 'My Household'), code, 'single', NEW.full_name)
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
  END IF;

  INSERT INTO public.household_members (user_id, household_id, role, created_at)
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
-- 2) Fix join_household_by_code: add explicit household_members insert
--    so the membership row is guaranteed even if the trigger is skipped.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.join_household_by_code(code text)
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
  WHERE invite_code = upper(trim(code));

  IF target.id IS NULL THEN
    RAISE EXCEPTION 'Kode undangan tidak ditemukan. Periksa kembali 6 digit kode Anda.';
  END IF;

  -- Already in this household: no-op.
  IF profile_row.household_id = target.id THEN
    RETURN target;
  END IF;

  -- Already in another circle: must leave it first.
  IF profile_row.household_id IS NOT NULL THEN
    SELECT count(*) INTO member_count
    FROM public.household_members
    WHERE household_id = profile_row.household_id;

    IF member_count > 1 THEN
      RAISE EXCEPTION 'Keluar dari circle saat ini terlebih dahulu.';
    END IF;
  END IF;

  SELECT count(*) INTO member_count
  FROM public.household_members
  WHERE household_id = target.id;

  IF member_count >= 10 THEN
    RAISE EXCEPTION 'Circle ini sudah mencapai batas maksimal 10 anggota.';
  END IF;

  -- Move the user's wallets/budgets/goals (and their transactions) into the
  -- circle BEFORE repointing the profile, so RLS stays satisfied throughout.
  PERFORM public.rehome_user_data(target.id);

  -- Explicitly insert the membership row BEFORE the profile update so the
  -- row exists regardless of trigger timing.  Role is always 'member' for
  -- a joiner -- never carry over a stale 'owner' from a solo household.
  INSERT INTO public.household_members (user_id, household_id, role, created_at)
  VALUES (auth.uid(), target.id, 'member', now())
  ON CONFLICT (user_id) DO UPDATE
  SET household_id = target.id,
      role = 'member';

  UPDATE public.profiles
  SET household_id = target.id,
      role = 'partner'
  WHERE id = auth.uid();

  UPDATE public.households
  SET mode = 'couple'
  WHERE id = target.id
  RETURNING * INTO target;

  RETURN target;
END;
$$;

-- =====================================================================
-- 3) Fix create_household: add explicit household_members insert.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.create_household(p_name text DEFAULT NULL, p_partner text DEFAULT NULL, p_mode text DEFAULT 'single')
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

  INSERT INTO public.households (name, invite_code, mode, partner_name)
  VALUES (
    COALESCE(NULLIF(p_name, ''), NULLIF(profile_row.full_name, ''), 'My Household'),
    public.unique_invite_code(),
    CASE WHEN p_mode = 'couple' THEN 'couple' ELSE 'single' END,
    NULLIF(p_partner, '')
  )
  RETURNING * INTO result;

  PERFORM public.rehome_user_data(result.id);

  -- Explicitly insert the owner membership row before updating the profile.
  INSERT INTO public.household_members (user_id, household_id, role, created_at)
  VALUES (auth.uid(), result.id, 'owner', now())
  ON CONFLICT (user_id) DO UPDATE
  SET household_id = result.id,
      role = 'owner';

  UPDATE public.profiles
  SET household_id = result.id,
      role = CASE WHEN result.mode = 'couple' THEN 'owner' ELSE 'single' END
  WHERE id = auth.uid();

  RETURN result;
END;
$$;

-- =====================================================================
-- 4) Repair existing stale data
-- =====================================================================

-- 4a) Insert missing household_members rows for every profile that has a
--     household_id but no matching membership row.
INSERT INTO public.household_members (user_id, household_id, role, created_at)
SELECT p.id,
       p.household_id,
       CASE WHEN p.role IN ('single', 'owner') THEN 'owner' ELSE 'member' END,
       p.created_at
FROM public.profiles p
WHERE p.household_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.household_members m WHERE m.user_id = p.id
  )
ON CONFLICT (user_id) DO NOTHING;

-- 4b) Normalize roles: exactly one owner per household (the earliest
--     member by created_at, ties broken by user_id).  Everyone else
--     becomes 'member'.
UPDATE public.household_members m
SET role = CASE
  WHEN m.id = (
    SELECT m2.id
    FROM public.household_members m2
    WHERE m2.household_id = m.household_id
    ORDER BY m2.created_at ASC, m2.user_id ASC
    LIMIT 1
  ) THEN 'owner'
  ELSE 'member'
END;

-- 4c) Fix any membership rows whose household_id drifted out of sync
--     with the profile's household_id (e.g. from old trigger bugs).
UPDATE public.household_members m
SET household_id = p.household_id
FROM public.profiles p
WHERE m.user_id = p.id
  AND p.household_id IS NOT NULL
  AND m.household_id <> p.household_id;
