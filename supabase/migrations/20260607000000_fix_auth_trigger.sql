-- Restore the on_auth_user_created trigger which was missing from production.
-- This trigger creates a profile and student role for every new Google OAuth (or any) sign-up.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Make handle_new_user idempotent so re-runs / race conditions never break sign-up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url, certificate_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1))
  )
  ON CONFLICT (id) DO NOTHING;

  IF lower(NEW.email) IN ('tauhidrana00@gmail.com','tauhidrana03@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin') ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student') ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Backfill any existing auth users who are missing a profile row.
INSERT INTO public.profiles (id, name, email, avatar_url, certificate_name)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email,'@',1)),
  u.email,
  u.raw_user_meta_data->>'avatar_url',
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email,'@',1))
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT
  u.id,
  CASE WHEN lower(u.email) IN ('tauhidrana00@gmail.com','tauhidrana03@gmail.com')
       THEN 'admin'::app_role ELSE 'student'::app_role END
FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id AND r.role = 'student'
WHERE r.user_id IS NULL
  AND lower(u.email) NOT IN ('tauhidrana00@gmail.com','tauhidrana03@gmail.com')
ON CONFLICT DO NOTHING;
