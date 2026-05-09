
DROP POLICY IF EXISTS modules_public_read ON public.modules;

CREATE POLICY modules_select_scoped
ON public.modules
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = modules.course_id
      AND (
        c.user_id = auth.uid()
        OR c.is_public = true
        OR c.is_system = true
        OR public.has_role(auth.uid(), 'admin'::app_role)
      )
  )
);
