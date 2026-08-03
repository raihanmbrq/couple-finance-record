-- Circle mode fixes:
--   1) First member of a household = owner, joiner = member (creator badge bug).
--   2) Re-home the user's wallets/budgets/goals (and thus transactions via
--      wallet_id) into the household they join/create, and back out on leave.
--   3) Add create_household RPC so client-side creation goes through the same
--      data-moving logic as join.

-- 0) Shared helper: move the current user's data rows to another household.
--    Wallets move (transactions follow via wallet_id); budgets move unless the
--    target already shares that category (shared circle budget wins).
CREATE OR REPLACE FUNCTION public.rehome_user_data(target_hh uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.wallets
  SET household_id = target_hh
  WHERE user_id = p_user_id
    AND household_id IS DISTINCT FROM target_hh;

  DELETE FROM public.budgets
  WHERE user_id = p_user_id
    AND household_id IS DISTINCT FROM target_hh
    AND category IN (
      SELECT category FROM public.budgets WHERE household_id = target_hh
    );

  UPDATE public.budgets
  SET household_id = target_hh
  WHERE user_id = p_user_id
    AND household_id IS DISTINCT FROM target_hh;

  UPDATE public.goals
  SET household_id = target_hh
  WHERE user_id = p_user_id
    AND household_id IS DISTINCT FROM target_hh;
END;
$$;

-- 1) Role-aware membership trigger: creator of a new household becomes owner,
--    anyone joining an existing household becomes member.
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
        WHEN public.household_members.role = 'owner' THEN 'owner'
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

-- 2) Join: verify code, enforce capacity + already-in-circle guard, then move
--    the user's data into the circle so their old transactions/wallets appear.
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

-- 3) Create a household (single or couple) and move the user's data into it.
--    The trigger above marks the creator as owner.
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

  UPDATE public.profiles
  SET household_id = result.id,
      role = CASE WHEN result.mode = 'couple' THEN 'owner' ELSE 'single' END
  WHERE id = auth.uid();

  RETURN result;
END;
$$;

-- 4) Leave: a circle member gets a fresh personal household and their own
--    wallets/budgets/goals move back out; solo household just rotates the code.
CREATE OR REPLACE FUNCTION public.leave_current_household()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  my_hh uuid;
  new_hh uuid;
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
    -- Personal household: keep all the data, rotate the code.
    UPDATE public.households
    SET invite_code = public.unique_invite_code(),
        mode = 'single'
    WHERE id = my_hh;

    UPDATE public.profiles
    SET role = 'single'
    WHERE id = auth.uid();
    RETURN;
  END IF;

  -- Circle: leave, taking the user's own data into a fresh personal household.
  INSERT INTO public.households (name, invite_code, mode, partner_name)
  VALUES (my_name, public.unique_invite_code(), 'single', NULL)
  RETURNING id INTO new_hh;

  PERFORM public.rehome_user_data(new_hh);

  DELETE FROM public.household_members WHERE user_id = auth.uid();

  UPDATE public.profiles
  SET household_id = new_hh,
      role = 'single'
  WHERE id = auth.uid();
END;
$$;

-- 5) Repair existing wrong data: exactly one owner per household (earliest
--    member), everyone else member. Fixes creators already marked as 'member'.
UPDATE public.household_members m
SET role = CASE
  WHEN m.id = (
    SELECT m2.id
    FROM public.household_members m2
    WHERE m2.household_id = m.household_id
    ORDER BY m2.created_at ASC, m2.user_id ASC
    LIMIT 1
  ) THEN 'owner' ELSE 'member' END;

-- 6) Re-home any existing users whose data never followed them into a circle
--    (created before this migration).
DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT id, household_id FROM public.profiles
    WHERE household_id IS NOT NULL
  LOOP
    PERFORM public.rehome_user_data(p.household_id, p.id);
  END LOOP;
END;
$$;