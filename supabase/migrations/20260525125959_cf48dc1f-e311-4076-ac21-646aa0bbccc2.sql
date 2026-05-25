
-- 1) Install the missing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2) Backfill profiles + roles for existing users
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
SELECT u.id, CASE WHEN lower(u.email) = 'tauhidrana00@gmail.com' THEN 'admin'::app_role ELSE 'student'::app_role END
FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE r.user_id IS NULL
ON CONFLICT DO NOTHING;
