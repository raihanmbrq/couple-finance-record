-- Signup fails: ensure_household_member BEFORE INSERT trigger on profiles
-- inserts a household_members row referencing NEW.id before the profile row
-- exists. Defer FK check to commit time so the same-statement insert passes.
ALTER TABLE public.household_members
  DROP CONSTRAINT IF EXISTS household_members_user_id_fkey;

ALTER TABLE public.household_members
  ADD CONSTRAINT household_members_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
  DEFERRABLE INITIALLY DEFERRED;