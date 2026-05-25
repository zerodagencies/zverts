
DROP VIEW IF EXISTS public.profiles_public;
DROP VIEW IF EXISTS public.mcq_questions_public;

CREATE OR REPLACE FUNCTION public.list_public_profiles(_limit int DEFAULT 50)
RETURNS TABLE(
  id uuid, name text, avatar_url text, total_xp int, total_gems int,
  current_streak int, longest_streak int, certificate_name text,
  profile_public boolean, created_at timestamptz, last_active timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT id, name, avatar_url, total_xp, total_gems, current_streak, longest_streak,
         certificate_name, profile_public, created_at, last_active
  FROM public.profiles
  WHERE profile_public = true
  ORDER BY total_xp DESC
  LIMIT GREATEST(1, LEAST(_limit, 200));
$$;
GRANT EXECUTE ON FUNCTION public.list_public_profiles(int) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_mcq_questions(_module_ids uuid[], _limit int DEFAULT 20)
RETURNS TABLE(q_id uuid, module_id uuid, question text, options jsonb, q_position int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT id AS q_id, module_id, question, options, position AS q_position
  FROM public.mcq_questions
  WHERE (_module_ids IS NULL OR array_length(_module_ids,1) IS NULL OR module_id = ANY(_module_ids))
  LIMIT GREATEST(1, LEAST(_limit, 100));
$$;
GRANT EXECUTE ON FUNCTION public.get_mcq_questions(uuid[], int) TO authenticated;
