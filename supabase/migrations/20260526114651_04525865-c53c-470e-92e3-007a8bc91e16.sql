
-- Attach the existing protect_profile_fields() guard as a BEFORE UPDATE trigger
-- so non-admin users cannot tamper with privilege/economy fields via direct table UPDATE.
DROP TRIGGER IF EXISTS protect_profile_fields_trg ON public.profiles;
CREATE TRIGGER protect_profile_fields_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_fields();

-- Tighten the UPDATE policy with an explicit WITH CHECK so the row owner constraint
-- is enforced on the new row as well (defence in depth alongside the trigger).
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
