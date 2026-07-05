BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. get_leaderboard_playlists
--    Returns distinct YouTube playlists that have at least 1 public participant.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_leaderboard_playlists()
RETURNS TABLE (
  source_playlist_id text,
  title              text,
  thumbnail_url      text,
  participant_count  integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.source_playlist_id,
    (ARRAY_AGG(c.title ORDER BY c.updated_at DESC))[1]         AS title,
    (ARRAY_AGG(c.thumbnail_url ORDER BY c.updated_at DESC))[1] AS thumbnail_url,
    COUNT(DISTINCT c.user_id)::integer                          AS participant_count
  FROM public.courses c
  JOIN public.profiles p ON p.id = c.user_id
  LEFT JOIN public.user_preferences upref ON upref.user_id = c.user_id
  WHERE c.source_playlist_id IS NOT NULL
    AND COALESCE(upref.profile_public, true) = true
  GROUP BY c.source_playlist_id
  ORDER BY COUNT(DISTINCT c.user_id) DESC, title ASC
  LIMIT 50;
$$;

GRANT EXECUTE ON FUNCTION public.get_leaderboard_playlists() TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. get_playlist_leaderboard
--    Ranked participants for a specific YouTube playlist, ordered by:
--    completion % → quiz passes → completed module count → name
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_playlist_leaderboard(
  _source_playlist_id text,
  _limit              integer DEFAULT 50
)
RETURNS TABLE (
  user_id         uuid,
  name            text,
  avatar_url      text,
  completed_count integer,
  quiz_passes     integer,
  total_modules   integer,
  completion_pct  numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id                                                                                    AS user_id,
    p.name,
    p.avatar_url,
    COALESCE(SUM(CASE WHEN mp.completed  THEN 1 ELSE 0 END), 0)::integer                   AS completed_count,
    COALESCE(SUM(CASE WHEN mp.mcq_passed THEN 1 ELSE 0 END), 0)::integer                   AS quiz_passes,
    COUNT(m.id)::integer                                                                    AS total_modules,
    CASE
      WHEN COUNT(m.id) = 0 THEN 0
      ELSE ROUND(
        SUM(CASE WHEN mp.completed THEN 1 ELSE 0 END)::numeric / COUNT(m.id) * 100, 1
      )
    END                                                                                     AS completion_pct
  FROM public.profiles p
  LEFT JOIN public.user_preferences upref ON upref.user_id = p.id
  JOIN  public.courses c  ON c.user_id = p.id AND c.source_playlist_id = _source_playlist_id
  JOIN  public.modules m  ON m.course_id = c.id
  LEFT JOIN public.module_progress mp ON mp.module_id = m.id AND mp.user_id = p.id
  WHERE COALESCE(upref.profile_public, true) = true
  GROUP BY p.id, p.name, p.avatar_url
  ORDER BY
    completion_pct  DESC,
    quiz_passes     DESC,
    completed_count DESC,
    p.name ASC NULLS LAST
  LIMIT GREATEST(1, LEAST(_limit, 200));
$$;

GRANT EXECUTE ON FUNCTION public.get_playlist_leaderboard(text, integer) TO anon, authenticated;

COMMIT;
