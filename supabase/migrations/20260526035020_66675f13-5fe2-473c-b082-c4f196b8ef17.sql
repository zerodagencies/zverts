
DROP POLICY IF EXISTS "authenticated_can_receive_own_notification_topics" ON realtime.messages;

CREATE POLICY "realtime_user_scoped_topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Per-user topics must include the user's uid
  realtime.topic() LIKE 'user:' || auth.uid()::text || ':%'
  -- Shared public topics (leaderboard reads profile_public rows, table RLS still applies)
  OR realtime.topic() LIKE 'leaderboard:%'
  -- Admin-only topics
  OR (
    realtime.topic() LIKE 'admin:%'
    AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
  )
);
