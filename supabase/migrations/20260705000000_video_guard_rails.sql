BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. New columns on module_progress
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.module_progress
  ADD COLUMN IF NOT EXISTS video_finished   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS quiz_fail_streak INTEGER NOT NULL DEFAULT 0;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Backfill: existing completed rows count as video_finished + mcq_passed
--    so existing users are not locked out.
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE public.module_progress
SET video_finished = true,
    mcq_passed     = true
WHERE completed = true;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. update_module_progress – now also sets video_finished when force_complete
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_module_progress(
  _module_id     uuid,
  _watch_time    integer,
  _force_complete boolean DEFAULT false
)
RETURNS module_progress
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uid            UUID := auth.uid();
  _duration       INT;
  _pct            NUMERIC(5,2);
  _completed      BOOLEAN;
  _video_finished BOOLEAN;
  _existing       public.module_progress%ROWTYPE;
  _result         public.module_progress%ROWTYPE;
  _newly_completed BOOLEAN := false;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.is_module_unlocked(_uid, _module_id) THEN RAISE EXCEPTION 'Module is locked'; END IF;

  SELECT duration_seconds INTO _duration FROM public.modules WHERE id = _module_id;
  IF _duration IS NULL OR _duration = 0 THEN _duration := 1; END IF;
  IF _watch_time < 0  THEN _watch_time := 0; END IF;
  IF _watch_time > _duration THEN _watch_time := _duration; END IF;

  SELECT * INTO _existing
  FROM public.module_progress
  WHERE user_id = _uid AND module_id = _module_id;

  IF FOUND AND _existing.watch_time_seconds > _watch_time THEN
    _watch_time := _existing.watch_time_seconds;
  END IF;

  _pct := LEAST(100, ROUND((_watch_time::NUMERIC / _duration) * 100, 2));
  _completed      := _force_complete OR _pct >= 90 OR (FOUND AND _existing.completed);
  -- video_finished is sticky once true; also set true by force_complete
  _video_finished := _force_complete OR (FOUND AND _existing.video_finished);

  IF _completed AND (NOT FOUND OR NOT _existing.completed) THEN
    _newly_completed := true;
  END IF;

  INSERT INTO public.module_progress (
    user_id, module_id, watch_time_seconds, percent_watched,
    completed, completed_at, video_finished, updated_at
  )
  VALUES (
    _uid, _module_id, _watch_time, _pct,
    _completed,
    CASE WHEN _completed THEN now() ELSE NULL END,
    _video_finished,
    now()
  )
  ON CONFLICT (user_id, module_id) DO UPDATE SET
    watch_time_seconds = EXCLUDED.watch_time_seconds,
    percent_watched    = EXCLUDED.percent_watched,
    completed          = EXCLUDED.completed,
    completed_at       = COALESCE(public.module_progress.completed_at, EXCLUDED.completed_at),
    -- video_finished never goes back to false via progress update
    video_finished     = EXCLUDED.video_finished OR public.module_progress.video_finished,
    updated_at         = now()
  RETURNING * INTO _result;

  UPDATE public.profiles SET last_active = now() WHERE id = _uid;

  IF _newly_completed THEN
    PERFORM public.award_progress(_uid, 2, 50);
  END IF;

  RETURN _result;
END;
$function$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. is_module_unlocked – now requires prev completed AND mcq_passed
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_module_unlocked(_user_id UUID, _module_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _pos            INT;
  _course         UUID;
  _prev_unlocked  BOOLEAN;
BEGIN
  SELECT position, course_id INTO _pos, _course
  FROM public.modules WHERE id = _module_id;

  IF _pos IS NULL THEN RETURN false; END IF;
  IF _pos = 1     THEN RETURN true;  END IF;

  SELECT COALESCE(mp.completed AND mp.mcq_passed, false) INTO _prev_unlocked
  FROM public.modules m
  LEFT JOIN public.module_progress mp
    ON mp.module_id = m.id AND mp.user_id = _user_id
  WHERE m.course_id = _course AND m.position = _pos - 1;

  RETURN COALESCE(_prev_unlocked, false);
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. submit_mcq – tracks consecutive fails; 3 in a row resets progress
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.submit_mcq(_module_id UUID, _answers JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid            UUID := auth.uid();
  _q              RECORD;
  _score          INT := 0;
  _total          INT := 0;
  _passed         BOOLEAN;
  _user_ans       INT;
  _already_passed BOOLEAN;
  _current_streak INT;
  _new_streak     INT := 0;
  _must_rewatch   BOOLEAN := false;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  FOR _q IN
    SELECT id, correct_index
    FROM public.mcq_questions
    WHERE module_id = _module_id
    ORDER BY position
  LOOP
    _total    := _total + 1;
    _user_ans := COALESCE((_answers ->> _q.id::text)::int, -1);
    IF _user_ans = _q.correct_index THEN _score := _score + 1; END IF;
  END LOOP;

  IF _total = 0 THEN RAISE EXCEPTION 'No questions for module'; END IF;

  _passed := _score >= 8;

  INSERT INTO public.mcq_attempts (user_id, module_id, score, total, passed, answers)
  VALUES (_uid, _module_id, _score, _total, _passed, _answers);

  IF _passed THEN
    -- Clear fail streak, mark quiz as passed
    SELECT mcq_passed INTO _already_passed
    FROM public.module_progress
    WHERE user_id = _uid AND module_id = _module_id;

    UPDATE public.module_progress
    SET mcq_passed      = true,
        quiz_fail_streak = 0
    WHERE user_id = _uid AND module_id = _module_id;

    IF NOT COALESCE(_already_passed, false) THEN
      PERFORM public.award_progress(_uid, 1, 30);
    END IF;

    _new_streak := 0;

  ELSE
    -- Increment fail streak
    SELECT COALESCE(quiz_fail_streak, 0) INTO _current_streak
    FROM public.module_progress
    WHERE user_id = _uid AND module_id = _module_id;

    _new_streak := COALESCE(_current_streak, 0) + 1;

    IF _new_streak >= 3 THEN
      -- Three consecutive fails: reset video progress so user must rewatch
      UPDATE public.module_progress
      SET quiz_fail_streak  = 0,
          completed          = false,
          video_finished     = false,
          mcq_passed         = false,
          completed_at       = NULL,
          watch_time_seconds = 0,
          percent_watched    = 0,
          updated_at         = now()
      WHERE user_id = _uid AND module_id = _module_id;

      _must_rewatch := true;
      _new_streak   := 0;
    ELSE
      UPDATE public.module_progress
      SET quiz_fail_streak = _new_streak,
          updated_at       = now()
      WHERE user_id = _uid AND module_id = _module_id;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'score',        _score,
    'total',        _total,
    'passed',       _passed,
    'must_rewatch', _must_rewatch,
    'fail_streak',  _new_streak
  );
END;
$$;

COMMIT;
