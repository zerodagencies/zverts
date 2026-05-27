
-- 1) award_progress also bumps last_active
CREATE OR REPLACE FUNCTION public.award_progress(_user_id uuid, _gems integer, _xp integer)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  UPDATE public.profiles
     SET total_gems = total_gems + _gems,
         total_xp   = total_xp + _xp,
         last_active = now()
   WHERE id = _user_id;
$function$;

-- 2) update_module_progress: also updates streak when a lesson is newly completed
CREATE OR REPLACE FUNCTION public.update_module_progress(_module_id uuid, _watch_time integer, _force_complete boolean DEFAULT false)
 RETURNS module_progress
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _uid UUID := auth.uid(); _duration INT; _pct NUMERIC(5,2); _completed BOOLEAN;
        _existing public.module_progress%ROWTYPE; _result public.module_progress%ROWTYPE; _newly_completed BOOLEAN := false;
        _today DATE := (now() AT TIME ZONE 'UTC')::date;
        _last DATE; _streak INT; _longest INT; _new_streak INT;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.is_module_unlocked(_uid, _module_id) THEN RAISE EXCEPTION 'Module is locked'; END IF;
  SELECT duration_seconds INTO _duration FROM public.modules WHERE id = _module_id;
  IF _duration IS NULL OR _duration = 0 THEN _duration := 1; END IF;
  IF _watch_time < 0 THEN _watch_time := 0; END IF;
  IF _watch_time > _duration THEN _watch_time := _duration; END IF;
  SELECT * INTO _existing FROM public.module_progress WHERE user_id = _uid AND module_id = _module_id;
  IF FOUND AND _existing.watch_time_seconds > _watch_time THEN _watch_time := _existing.watch_time_seconds; END IF;
  _pct := LEAST(100, ROUND((_watch_time::NUMERIC / _duration) * 100, 2));
  _completed := _force_complete OR _pct >= 90 OR (FOUND AND _existing.completed);
  IF _completed AND (NOT FOUND OR NOT _existing.completed) THEN _newly_completed := true; END IF;

  INSERT INTO public.module_progress (user_id, module_id, watch_time_seconds, percent_watched, completed, completed_at, updated_at)
  VALUES (_uid, _module_id, _watch_time, _pct, _completed, CASE WHEN _completed THEN now() ELSE NULL END, now())
  ON CONFLICT (user_id, module_id) DO UPDATE SET
    watch_time_seconds = EXCLUDED.watch_time_seconds,
    percent_watched = EXCLUDED.percent_watched,
    completed = EXCLUDED.completed,
    completed_at = COALESCE(public.module_progress.completed_at, EXCLUDED.completed_at),
    updated_at = now()
  RETURNING * INTO _result;

  UPDATE public.profiles SET last_active = now() WHERE id = _uid;

  IF _newly_completed THEN
    -- Award XP/gems
    PERFORM public.award_progress(_uid, 2, 50);

    -- Streak / attendance update inline
    INSERT INTO public.attendance (user_id, date) VALUES (_uid, _today) ON CONFLICT DO NOTHING;
    SELECT last_attendance_date, current_streak, longest_streak
      INTO _last, _streak, _longest
      FROM public.profiles WHERE id = _uid;

    IF _last IS DISTINCT FROM _today THEN
      IF _last = _today - INTERVAL '1 day' THEN
        _new_streak := COALESCE(_streak,0) + 1;
      ELSE
        _new_streak := 1;
      END IF;
      UPDATE public.profiles
         SET current_streak = _new_streak,
             longest_streak = GREATEST(COALESCE(_longest,0), _new_streak),
             last_attendance_date = _today
       WHERE id = _uid;
    END IF;
  END IF;

  RETURN _result;
END; $function$;

-- 3) Realtime publication: ensure live updates flow to clients
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.module_progress;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Ensure full row payloads for UPDATE events
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.module_progress REPLICA IDENTITY FULL;
