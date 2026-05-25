
-- 1) Certificates: restrict public select to owner/admin; allow lookup by code via SECURITY DEFINER fn
DROP POLICY IF EXISTS certs_public_select ON public.certificates;
CREATE POLICY certs_select_own ON public.certificates
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.verify_certificate(_code text)
RETURNS TABLE(certificate_code text, issued_to_name text, course_title text, issued_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT certificate_code, issued_to_name, course_title, issued_at
  FROM public.certificates WHERE certificate_code = _code LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.verify_certificate(text) TO anon, authenticated;

-- 2) Profiles: drop broad public select; expose only safe columns via view
DROP POLICY IF EXISTS profiles_select_public ON public.profiles;

CREATE OR REPLACE VIEW public.profiles_public AS
  SELECT id, name, avatar_url, total_xp, total_gems, current_streak, longest_streak,
         certificate_name, profile_public, created_at, last_active
  FROM public.profiles
  WHERE profile_public = true;
GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- Achievements RLS still needs to check public profile status without seeing the row
CREATE OR REPLACE FUNCTION public.is_profile_public(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT COALESCE((SELECT profile_public FROM public.profiles WHERE id = _uid), false);
$$;
GRANT EXECUTE ON FUNCTION public.is_profile_public(uuid) TO anon, authenticated;

DROP POLICY IF EXISTS achievements_select_public ON public.achievements;
CREATE POLICY achievements_select_public ON public.achievements
  FOR SELECT USING (public.is_profile_public(user_id));

-- 3) MCQ questions: hide correct_index/explanation from clients; expose a safe view + server-side grader
DROP POLICY IF EXISTS mcq_questions_read ON public.mcq_questions;
-- only admin can read raw table (admin policy already exists)

CREATE OR REPLACE VIEW public.mcq_questions_public AS
  SELECT id, module_id, question, options, position FROM public.mcq_questions;
GRANT SELECT ON public.mcq_questions_public TO authenticated;

CREATE OR REPLACE FUNCTION public.grade_and_submit_daily_challenge(_answers jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _uid uuid := auth.uid(); _today date := (now() AT TIME ZONE 'UTC')::date;
        _q record; _score int := 0; _total int := 0; _correct jsonb := '{}'::jsonb;
        _module_id uuid; _passed boolean; _existing public.daily_challenges%ROWTYPE;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO _existing FROM public.daily_challenges WHERE user_id=_uid AND date=_today;
  IF FOUND THEN
    RETURN jsonb_build_object('already', true, 'passed', _existing.passed, 'score', _existing.score, 'total', _existing.total, 'correct', '{}'::jsonb);
  END IF;

  FOR _q IN SELECT id, module_id, correct_index FROM public.mcq_questions
            WHERE id::text = ANY (SELECT jsonb_object_keys(_answers))
  LOOP
    _total := _total + 1;
    IF _module_id IS NULL THEN _module_id := _q.module_id; END IF;
    IF COALESCE((_answers ->> _q.id::text)::int, -1) = _q.correct_index THEN
      _score := _score + 1;
      _correct := _correct || jsonb_build_object(_q.id::text, true);
    ELSE
      _correct := _correct || jsonb_build_object(_q.id::text, false);
    END IF;
  END LOOP;

  IF _total = 0 THEN RAISE EXCEPTION 'No questions provided'; END IF;
  _passed := (_score::numeric / _total) >= 0.6;
  INSERT INTO public.daily_challenges(user_id, date, module_id, score, total, passed)
    VALUES (_uid, _today, _module_id, _score, _total, _passed);
  IF _passed THEN PERFORM public.award_progress(_uid, 2, 75); END IF;
  RETURN jsonb_build_object('already', false, 'passed', _passed, 'score', _score, 'total', _total, 'correct', _correct);
END $$;
GRANT EXECUTE ON FUNCTION public.grade_and_submit_daily_challenge(jsonb) TO authenticated;

-- 4) Lock down internal helpers that take a user_id argument so users can't self-grant
REVOKE EXECUTE ON FUNCTION public.award_progress(uuid,int,int) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.award_achievement(uuid,text,int,int) FROM anon, authenticated, public;
