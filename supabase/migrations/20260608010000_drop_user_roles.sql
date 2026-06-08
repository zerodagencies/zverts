-- ===========================================================
-- Remove user_roles table; store role directly on profiles
-- referencing the roles lookup table.
--
-- Each user has exactly one role. Super admin inherits admin
-- permissions (has_role checks role >= threshold).
-- ===========================================================

-- 1. Add role column to profiles (FK → roles.name)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role app_role NOT NULL DEFAULT 'student'
    REFERENCES public.roles(name);

-- 2. Migrate: each user gets their highest role from user_roles
--    (super_admin > admin > student)
UPDATE public.profiles p
SET role = (
  SELECT
    CASE
      WHEN EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role = 'super_admin') THEN 'super_admin'
      WHEN EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role = 'admin')       THEN 'admin'
      ELSE 'student'
    END
);

-- 3. Protect the role field from self-promotion via protect_profile_fields
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN RETURN NEW; END IF;
  IF public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') THEN RETURN NEW; END IF;
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
  NEW.role                 := OLD.role;
  RETURN NEW;
END $$;

-- 4. Update has_role: reads from profiles.role; super_admin inherits admin
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id
      AND (
        role = _role
        OR (_role = 'admin' AND role = 'super_admin')
      )
  )
$$;

-- 5. Update handle_new_user: set role on profiles, no user_roles insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _role app_role := 'student';
BEGIN
  IF lower(NEW.email) IN ('tauhidrana00@gmail.com', 'tauhidrana03@gmail.com') THEN
    _role := 'super_admin';
  END IF;

  INSERT INTO public.profiles (id, name, email, avatar_url, certificate_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    _role
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END $$;

-- 6. Update admin_set_role: update profiles.role instead of user_roles
CREATE OR REPLACE FUNCTION public.admin_set_role(_email text, _role public.app_role, _grant boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _actor  uuid := auth.uid();
  _target uuid;
BEGIN
  IF NOT public.has_role(_actor, 'super_admin') THEN
    RAISE EXCEPTION 'Only super_admin can manage roles';
  END IF;
  IF _role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Only admin/super_admin assignable here';
  END IF;
  SELECT id INTO _target FROM public.profiles WHERE lower(email) = lower(_email);
  IF _target IS NULL THEN RAISE EXCEPTION 'No user with that email'; END IF;

  IF _grant THEN
    UPDATE public.profiles SET role = _role WHERE id = _target;
    INSERT INTO public.audit_logs(actor_id, action, target_user, metadata)
      VALUES (_actor, 'role_granted', _target, jsonb_build_object('role', _role));
  ELSE
    IF _target = _actor AND _role = 'super_admin' THEN
      RAISE EXCEPTION 'Cannot demote yourself';
    END IF;
    UPDATE public.profiles SET role = 'student' WHERE id = _target;
    INSERT INTO public.audit_logs(actor_id, action, target_user, metadata)
      VALUES (_actor, 'role_revoked', _target, jsonb_build_object('role', _role));
  END IF;

  RETURN jsonb_build_object('ok', true, 'user_id', _target);
END $$;

-- 7. Update list_admin_users: query profiles directly
CREATE OR REPLACE FUNCTION public.list_admin_users()
RETURNS TABLE(user_id uuid, email text, name text, roles text[])
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, email, name, ARRAY[role::text]
  FROM public.profiles
  WHERE role IN ('admin', 'super_admin')
  ORDER BY email;
$$;

-- 8. Drop user_roles table (all references updated above)
DROP TABLE IF EXISTS public.user_roles CASCADE;
