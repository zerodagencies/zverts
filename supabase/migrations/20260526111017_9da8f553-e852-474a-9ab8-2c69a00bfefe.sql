
-- 1) Revoke EXECUTE from anon/PUBLIC on every SECURITY DEFINER function in public schema
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC, anon',
                   r.nspname, r.proname, r.args);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO authenticated',
                   r.nspname, r.proname, r.args);
  END LOOP;
END $$;

-- 2) Re-grant verify_certificate to anon (intentionally public)
GRANT EXECUTE ON FUNCTION public.verify_certificate(text) TO anon;

-- 3) Block direct writes to attendance (only mark_attendance RPC may write)
CREATE POLICY attendance_block_direct_writes
ON public.attendance
AS RESTRICTIVE
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);
