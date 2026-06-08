-- ===========================================================
-- Comprehensive schema optimisation
-- ===========================================================

-- -------------------------------------------------------
-- 1. CRITICAL BUG FIX: protect_profile_fields breaks XP/gems
-- -------------------------------------------------------
-- The trigger calls has_role(auth.uid(), ...) even when invoked
-- from a SECURITY DEFINER function (award_progress, mark_attendance,
-- update_module_progress …). In that context current_user is 'postgres'
-- (function owner), not 'authenticated'. Previously it always fell through
-- to the "restore protected fields" branch, silently nullifying every reward.
-- Column-level GRANTs already prevent authenticated users from touching
-- sensitive columns, so this trigger only needs to guard SECURITY INVOKER
-- paths (i.e. current_user = 'authenticated').
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  -- Privileged SECURITY DEFINER context: current_user is the function owner
  -- (typically 'postgres'), not 'authenticated'. Allow unrestricted update.
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;
  -- Admins and super_admins may change anything.
  IF public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') THEN
    RETURN NEW;
  END IF;
  -- Restore every protected field to its pre-update value for normal users.
  NEW.total_xp             := OLD.total_xp;
  NEW.total_gems           := OLD.total_gems;
  NEW.current_streak       := OLD.current_streak;
  NEW.longest_streak       := OLD.longest_streak;
  NEW.last_attendance_date := OLD.last_attendance_date;
  NEW.free_playlist_used   := OLD.free_playlist_used;
  NEW.convert_credits      := OLD.convert_credits;
  NEW.ai_enabled           := OLD.ai_enabled;
  NEW.is_paid_user         := OLD.is_paid_user;
  NEW.total_paid           := OLD.total_paid;
  NEW.locked               := OLD.locked;
  RETURN NEW;
END $$;

-- -------------------------------------------------------
-- 2. ROLES lookup table (replaces implicit enum-only design)
-- -------------------------------------------------------
-- Provides a proper reference table so user_roles can FK into it,
-- and roles are self-documenting without reading the enum definition.
CREATE TABLE IF NOT EXISTS public.roles (
  name        app_role PRIMARY KEY,
  label       text     NOT NULL,
  description text
);

INSERT INTO public.roles (name, label, description) VALUES
  ('student',    'Student',    'Regular learner with access to all public courses'),
  ('admin',      'Admin',      'Content management and user administration'),
  ('super_admin','Super Admin','Full system access including role management')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roles_public_read ON public.roles;
CREATE POLICY roles_public_read ON public.roles FOR SELECT USING (true);

GRANT SELECT ON public.roles TO anon, authenticated;
GRANT ALL    ON public.roles TO service_role;

-- -------------------------------------------------------
-- 3. user_roles: change FK from auth.users → profiles
--    and add FK to roles lookup table
-- -------------------------------------------------------
ALTER TABLE public.user_roles
  DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_roles
  DROP CONSTRAINT IF EXISTS user_roles_role_fkey;
ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_role_fkey
    FOREIGN KEY (role) REFERENCES public.roles(name);

-- -------------------------------------------------------
-- 4. Add FK constraints on all orphaned user_id columns
--    (cascade delete keeps DB clean when a user is removed)
-- -------------------------------------------------------
ALTER TABLE public.achievements
  DROP CONSTRAINT IF EXISTS achievements_user_id_fkey,
  ADD  CONSTRAINT achievements_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.mcq_attempts
  DROP CONSTRAINT IF EXISTS mcq_attempts_user_id_fkey,
  ADD  CONSTRAINT mcq_attempts_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.attendance
  DROP CONSTRAINT IF EXISTS attendance_user_id_fkey,
  ADD  CONSTRAINT attendance_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.notes
  DROP CONSTRAINT IF EXISTS notes_user_id_fkey,
  ADD  CONSTRAINT notes_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.certificates
  DROP CONSTRAINT IF EXISTS certificates_user_id_fkey,
  ADD  CONSTRAINT certificates_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.daily_challenges
  DROP CONSTRAINT IF EXISTS daily_challenges_user_id_fkey,
  ADD  CONSTRAINT daily_challenges_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.daily_missions
  DROP CONSTRAINT IF EXISTS daily_missions_user_id_fkey,
  ADD  CONSTRAINT daily_missions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_user_id_fkey,
  ADD  CONSTRAINT notifications_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.notification_events
  DROP CONSTRAINT IF EXISTS notification_events_user_id_fkey,
  ADD  CONSTRAINT notification_events_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.notification_preferences
  DROP CONSTRAINT IF EXISTS notification_preferences_user_id_fkey,
  ADD  CONSTRAINT notification_preferences_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_behavior
  DROP CONSTRAINT IF EXISTS user_behavior_user_id_fkey,
  ADD  CONSTRAINT user_behavior_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.ai_usage
  DROP CONSTRAINT IF EXISTS ai_usage_user_id_fkey,
  ADD  CONSTRAINT ai_usage_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_user_id_fkey,
  ADD  CONSTRAINT payments_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.support_contacts
  DROP CONSTRAINT IF EXISTS support_contacts_user_id_fkey,
  ADD  CONSTRAINT support_contacts_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.support_contact_dismissals
  DROP CONSTRAINT IF EXISTS support_contact_dismissals_user_id_fkey,
  ADD  CONSTRAINT support_contact_dismissals_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- -------------------------------------------------------
-- 5. Performance indexes
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_achievements_user
  ON public.achievements(user_id);

CREATE INDEX IF NOT EXISTS idx_mcq_attempts_user
  ON public.mcq_attempts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mcq_attempts_module
  ON public.mcq_attempts(module_id);

CREATE INDEX IF NOT EXISTS idx_notes_user
  ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_module_user
  ON public.notes(module_id, user_id);

CREATE INDEX IF NOT EXISTS idx_attendance_user
  ON public.attendance(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_certificates_user
  ON public.certificates(user_id);

CREATE INDEX IF NOT EXISTS idx_daily_challenges_user
  ON public.daily_challenges(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_missions_user
  ON public.daily_missions(user_id, date DESC);

-- Partial index for efficient "completed modules" queries
CREATE INDEX IF NOT EXISTS idx_module_progress_completed
  ON public.module_progress(user_id) WHERE completed = true;

CREATE INDEX IF NOT EXISTS idx_audit_logs_target
  ON public.audit_logs(target_user, created_at DESC) WHERE target_user IS NOT NULL;

-- -------------------------------------------------------
-- 6. RLS policy fixes
-- -------------------------------------------------------

-- 6a. Drop profiles_insert_own — handle_new_user trigger (SECURITY DEFINER)
--     is the only correct insert path; direct client inserts are not allowed.
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

-- 6b. Add admin read for notes (admins need to support users)
DROP POLICY IF EXISTS notes_admin_read ON public.notes;
CREATE POLICY notes_admin_read ON public.notes FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- 6c. Remove the legacy duplicate payments admin-select policy
--     (payments_select_own already covers both own + admin reads)
DROP POLICY IF EXISTS "admins can view all payments" ON public.payments;

-- 6d. Ensure payments RESTRICTIVE policy covers all write commands
--     (in production it was stored as INSERT-only — re-create explicitly)
DROP POLICY IF EXISTS payments_block_direct_writes ON public.payments;
CREATE POLICY payments_block_direct_writes ON public.payments
  AS RESTRICTIVE FOR ALL TO authenticated, anon
  USING (false) WITH CHECK (false);
-- Re-grant the SELECT permissive policy so reads still work
DROP POLICY IF EXISTS payments_select_own ON public.payments;
CREATE POLICY payments_select_own ON public.payments FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  );
-- Submit via RPC only
DROP POLICY IF EXISTS payments_insert_own ON public.payments;
CREATE POLICY payments_insert_own ON public.payments FOR INSERT
  WITH CHECK (user_id = auth.uid() AND status = 'pending');
