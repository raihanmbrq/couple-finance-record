-- Circle / household membership support.

CREATE TABLE IF NOT EXISTS public.household_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (household_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_household_members_household ON public.household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_household_members_user ON public.household_members(user_id);

ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.household_members TO authenticated;

DROP POLICY IF EXISTS "select_own_household_members" ON public.household_members;
CREATE POLICY "select_own_household_members" ON public.household_members
  FOR SELECT TO authenticated
  USING (household_id = public.user_household_id());

DROP POLICY IF EXISTS "insert_self_household_member" ON public.household_members;
CREATE POLICY "insert_self_household_member" ON public.household_members
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "delete_self_household_member" ON public.household_members;
CREATE POLICY "delete_self_household_member" ON public.household_members
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "select_household_profiles" ON public.profiles;
CREATE POLICY "select_household_profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR (
      household_id IS NOT NULL
      AND household_id = public.user_household_id()
    )
  );

CREATE OR REPLACE FUNCTION public.random_invite_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.unique_invite_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  code text;
BEGIN
  LOOP
    code := public.random_invite_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.households WHERE invite_code = code);
  END LOOP;
  RETURN code;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_household_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code text;
  hh_id uuid;
BEGIN
  -- Leaving a household clears household_id: never auto-recreate a new one.
  IF TG_OP = 'UPDATE' AND NEW.household_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.household_id IS NULL THEN
    code := public.unique_invite_code();
    INSERT INTO public.households (name, invite_code, mode, partner_name)
    VALUES (COALESCE(NULLIF(NEW.full_name, ''), 'My Household'), code, 'single', NEW.full_name)
    RETURNING id INTO hh_id;

    NEW.household_id := hh_id;
    NEW.role := 'single';
  ELSE
    hh_id := NEW.household_id;
  END IF;

  INSERT INTO public.household_members (user_id, household_id, role)
  VALUES (NEW.id, hh_id, 'owner')
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

CREATE OR REPLACE FUNCTION public.join_household_by_code(code text)
RETURNS public.households
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target public.households;
  member_count int;
  current_hh uuid;
BEGIN
  SELECT household_id INTO current_hh FROM public.profiles WHERE id = auth.uid();

  IF current_hh IS NOT NULL THEN
    SELECT count(*) INTO member_count
    FROM public.household_members
    WHERE household_id = current_hh;

    IF member_count > 1 THEN
      RAISE EXCEPTION 'Pengguna sudah terhubung';
    END IF;

    -- Abandon solo auto-created household so the user can join a circle.
    DELETE FROM public.household_members WHERE user_id = auth.uid();
    UPDATE public.profiles
    SET household_id = NULL,
        role = 'single'
    WHERE id = auth.uid();
  END IF;

  SELECT * INTO target
  FROM public.households
  WHERE invite_code = upper(trim(code));

  IF target.id IS NULL THEN
    RAISE EXCEPTION 'Kode undangan tidak ditemukan. Periksa kembali 6 digit kode Anda.';
  END IF;

  SELECT count(*) INTO member_count
  FROM public.household_members
  WHERE household_id = target.id;

  IF member_count >= 10 THEN
    RAISE EXCEPTION 'Circle ini sudah mencapai batas maksimal 10 anggota.';
  END IF;

  UPDATE public.profiles
  SET household_id = target.id,
      role = 'partner'
  WHERE id = auth.uid();

  INSERT INTO public.household_members (user_id, household_id, role)
  VALUES (auth.uid(), target.id, 'member')
  ON CONFLICT (user_id) DO UPDATE
  SET household_id = target.id,
      role = 'member';

  UPDATE public.households
  SET mode = 'couple'
  WHERE id = target.id
  RETURNING * INTO target;

  RETURN target;
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_current_household()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.household_members WHERE user_id = auth.uid();

  UPDATE public.profiles
  SET household_id = NULL,
      role = 'single'
  WHERE id = auth.uid();
END;
$$;