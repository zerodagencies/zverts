
DROP POLICY IF EXISTS courses_update_own ON public.courses;
CREATE POLICY courses_update_own ON public.courses
  FOR UPDATE
  USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (
    ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role))
    AND (is_system = false OR has_role(auth.uid(), 'admin'::app_role))
  );

DROP POLICY IF EXISTS email_logs_admin ON public.email_logs;
CREATE POLICY email_logs_super_admin ON public.email_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'::app_role));
