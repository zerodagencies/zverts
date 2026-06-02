-- Attach the existing protect_profile_fields function as a BEFORE UPDATE trigger
-- so non-admin users cannot overwrite sensitive gamification/payment columns
-- (total_xp, total_gems, streaks, is_paid_user, ai_enabled, convert_credits, locked, etc.)
DROP TRIGGER IF EXISTS protect_profile_sensitive_fields ON public.profiles;
CREATE TRIGGER protect_profile_sensitive_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_fields();