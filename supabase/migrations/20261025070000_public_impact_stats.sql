-- Totals for the public landing page ("ZverTs so far"). Platform-wide sums
-- only — no names, emails or per-user rows — so anyone may read them.
CREATE OR REPLACE FUNCTION public.public_impact_stats()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'learners',          (SELECT count(*) FROM profiles),
    'courses',           (SELECT count(*) FROM courses WHERE NOT is_system),
    'watch_seconds',     (SELECT COALESCE(sum(watch_time_seconds), 0) FROM module_progress),
    'videos_completed',  (SELECT count(*) FROM module_progress WHERE completed),
    'certificates',      (SELECT count(*) FROM certificates)
  );
$$;

REVOKE EXECUTE ON FUNCTION public.public_impact_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_impact_stats() TO anon, authenticated;
