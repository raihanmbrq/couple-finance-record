-- Fix circle mode: role-aware membership, personal household on leave,
-- and repair existing wrong data (all-owner memberships, orphaned users).

-- 1) Resume existing data: guarantee a membership row for every profile
--    that has a household_id (old buggy code skipped this on join).
INSERT INTO public.household_members (user_id, household_id, role)
SELECT p.id, p.household_id,
       CASE WHEN p.role IN ('single', 'suami', 'owner') THEN 'owner' ELSE 'member' END
FROM public.profiles p
WHERE p.household_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.household_members m WHERE m.user_id = p.id
  );

-- 2) Normalize roles: exactly one owner per household (the earliest member),
--    everyone else becomes member.
UPDATE public.household_members m
SET role = CASE
  WHEN m.id = (
    SELECT m2.id
    FROM public.household_members m2
    WHERE m2.household_id = m.household_id
    ORDER BY m2.created_at ASC, m2.user_id ASC
    LIMIT 1
  ) THEN 'owner' ELSE 'member' END;

-- 3) Role-aware membership trigger.
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
    -- Joining an existing household: member, unless they are already owner.
    hh_id := NEW.household_id;
    m_role := 'member';
  END IF;

  INSERT INTO public.household_members (user_id, household_id, role)
  VALUES (NEW.id, hh_id, m_role)
  ON CONFLICT (user_id) DO UPDATE
  SET household_id = EXCLUDED.household_id,
      role = CASE
        WHEN public.household_members.role = 'owner' AND EXCLUDED.role = 'owner' THEN 'owner'
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

-- 4) Join: never clear household_id (avoids orphaned/empty state). Trigger
--    moves the membership row and downgrades owner -> member on conflict.
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

  SELECT count(*) INTO member_count
  FROM public.household_members
  WHERE household_id = target.id;

  IF member_count >= 10 THEN
    RAISE EXCEPTION 'Circle ini sudah mencapai batas maksimal 10 anggota.';
  END IF;

  -- Solo user's old household keeps its data; it simply no longer owns the
  -- membership row. Data is preserved, only this user's pointer moves.
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

-- 5) Leave: solo household keeps user's data (fresh invite code); circle
--    members get a brand-new personal household with a fresh invite code.
CREATE OR REPLACE FUNCTION public.leave_current_household()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  my_hh uuid;
  member_count int;
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
    -- Personal household: keep all wallets/transactions, rotate the code.
    UPDATE public.households
    SET invite_code = public.unique_invite_code(),
        mode = 'single'
    WHERE id = my_hh;

    UPDATE public.profiles
    SET role = 'single'
    WHERE id = auth.uid();
    RETURN;
  END IF;

  -- Circle: leave, then get a fresh personal household (trigger inserts the
  -- owner membership). Circle data stays with the circle.
  DELETE FROM public.household_members WHERE user_id = auth.uid();

  INSERT INTO public.households (name, invite_code, mode, partner_name)
  VALUES (my_name, public.unique_invite_code(), 'single', NULL)
  RETURNING id INTO my_hh;

  UPDATE public.profiles
  SET household_id = my_hh,
      role = 'single'
  WHERE id = auth.uid();
END;
$$;

-- 6) Guarantee a household exists for the current user. Used by the client
--    on every login so no user is ever in an "orphaned" state.
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

  INSERT INTO public.households (name, invite_code, mode, partner_name)
  VALUES (my_name, public.unique_invite_code(), 'single', NULL)
  RETURNING * INTO result;

  -- Trigger creates the owner membership row.
  UPDATE public.profiles
  SET household_id = result.id,
      role = 'single'
  WHERE id = auth.uid();

  RETURN result;
END;
$$;
