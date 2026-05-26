
-- 1) Realtime: restrict subscriptions on the notifications topic to the owning user
-- Topic convention used by clients: 'notifications' channel filters by user; we authorize
-- by requiring the topic to either be a generic 'notifications' subscription that postgres_changes
-- filters server-side by RLS on the underlying table, OR a per-user topic like 'notifications:<uid>'.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_can_receive_own_notification_topics" ON realtime.messages;
CREATE POLICY "authenticated_can_receive_own_notification_topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Allow only topics scoped to the current user, e.g. 'notifications:<uid>' or 'user:<uid>:*'
  (realtime.topic() = 'notifications:' || auth.uid()::text)
  OR (realtime.topic() LIKE 'user:' || auth.uid()::text || ':%')
);

-- 2) Profiles: allow admins to read all profiles
DROP POLICY IF EXISTS profiles_admin_select ON public.profiles;
CREATE POLICY profiles_admin_select
ON public.profiles
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- 3) user_roles: only super_admins can write; admins read-only
DROP POLICY IF EXISTS user_roles_admin_all ON public.user_roles;

DROP POLICY IF EXISTS user_roles_admin_read ON public.user_roles;
CREATE POLICY user_roles_admin_read
ON public.user_roles
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

DROP POLICY IF EXISTS user_roles_super_admin_write ON public.user_roles;
CREATE POLICY user_roles_super_admin_write
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));
