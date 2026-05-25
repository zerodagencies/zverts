
-- =========================================================
-- 1. CATEGORY ENUM + TABLES
-- =========================================================
DO $$ BEGIN
  CREATE TYPE public.notification_category AS ENUM (
    'lesson_completed','module_unlocked','course_completed','playlist_ready',
    'xp_gain','level_up','streak_milestone','streak_risk','badge_unlocked',
    'ai_summary','ai_quiz','ai_recommendation','weak_topic',
    'system_success','system_failure','payment','subscription',
    'comeback_1d','comeback_3d','comeback_7d','comeback_14d',
    'morning_push','afternoon_push','evening_push','night_push',
    'unfinished_lesson','quiz_reminder'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_priority AS ENUM ('critical','high','normal','low');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category public.notification_category NOT NULL,
  priority public.notification_priority NOT NULL DEFAULT 'normal',
  title text NOT NULL,
  body text NOT NULL,
  deep_link text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  dedupe_key text,
  scheduled_for timestamptz,
  sent_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notif_user_unread ON public.notifications(user_id, read_at, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_dedupe ON public.notifications(user_id, dedupe_key) WHERE dedupe_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid PRIMARY KEY,
  mute_all boolean NOT NULL DEFAULT false,
  study_reminders boolean NOT NULL DEFAULT true,
  ai_suggestions boolean NOT NULL DEFAULT true,
  system_alerts boolean NOT NULL DEFAULT true,
  gamification boolean NOT NULL DEFAULT true,
  comeback boolean NOT NULL DEFAULT true,
  max_per_day int NOT NULL DEFAULT 4,
  quiet_hours_start int NOT NULL DEFAULT 0,  -- 0-23 (local hour)
  quiet_hours_end int NOT NULL DEFAULT 7,
  timezone_offset_minutes int NOT NULL DEFAULT 360, -- BD default +6:00
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  event_type text NOT NULL, -- delivered | opened | clicked | dismissed | ignored
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notif_events_user ON public.notification_events(user_id, event_type, created_at DESC);

CREATE TABLE IF NOT EXISTS public.user_behavior (
  user_id uuid PRIMARY KEY,
  most_active_hour int,             -- 0-23
  avg_session_minutes numeric(6,2) DEFAULT 0,
  total_study_minutes int DEFAULT 0,
  streak_risk boolean DEFAULT false,
  last_lesson_at timestamptz,
  last_quiz_at timestamptz,
  weak_topic text,
  favorite_subject text,
  pattern text, -- morning|afternoon|evening|night
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================================
-- 2. RLS
-- =========================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_behavior ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notif_select_own ON public.notifications;
CREATE POLICY notif_select_own ON public.notifications FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS notif_update_own ON public.notifications;
CREATE POLICY notif_update_own ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS notif_delete_own ON public.notifications;
CREATE POLICY notif_delete_own ON public.notifications FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS prefs_all_own ON public.notification_preferences;
CREATE POLICY prefs_all_own ON public.notification_preferences FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS events_select_own ON public.notification_events;
CREATE POLICY events_select_own ON public.notification_events FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS events_insert_own ON public.notification_events;
CREATE POLICY events_insert_own ON public.notification_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS behavior_select_own ON public.user_behavior;
CREATE POLICY behavior_select_own ON public.user_behavior FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- =========================================================
-- 3. SMART DISPATCH
-- =========================================================
CREATE OR REPLACE FUNCTION public.dispatch_notification(
  _user_id uuid,
  _category public.notification_category,
  _title text,
  _body text,
  _priority public.notification_priority DEFAULT 'normal',
  _deep_link text DEFAULT NULL,
  _payload jsonb DEFAULT '{}'::jsonb,
  _dedupe_key text DEFAULT NULL,
  _cooldown_hours int DEFAULT 4
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _prefs public.notification_preferences%ROWTYPE;
  _today_count int;
  _last_same timestamptz;
  _existing uuid;
  _new_id uuid;
  _local_hour int;
  _quiet boolean := false;
BEGIN
  -- prefs (create defaults if missing)
  SELECT * INTO _prefs FROM public.notification_preferences WHERE user_id = _user_id;
  IF NOT FOUND THEN
    INSERT INTO public.notification_preferences(user_id) VALUES (_user_id) RETURNING * INTO _prefs;
  END IF;

  IF _prefs.mute_all AND _priority <> 'critical' THEN RETURN NULL; END IF;

  -- category-level mute checks
  IF NOT _prefs.gamification AND _category IN ('xp_gain','level_up','streak_milestone','badge_unlocked') THEN RETURN NULL; END IF;
  IF NOT _prefs.ai_suggestions AND _category IN ('ai_summary','ai_quiz','ai_recommendation','weak_topic') THEN RETURN NULL; END IF;
  IF NOT _prefs.system_alerts  AND _category IN ('system_success','system_failure','payment','subscription','playlist_ready') THEN RETURN NULL; END IF;
  IF NOT _prefs.study_reminders AND _category IN ('morning_push','afternoon_push','evening_push','night_push','unfinished_lesson','quiz_reminder','streak_risk') THEN RETURN NULL; END IF;
  IF NOT _prefs.comeback AND _category IN ('comeback_1d','comeback_3d','comeback_7d','comeback_14d') THEN RETURN NULL; END IF;

  -- dedupe within 24h
  IF _dedupe_key IS NOT NULL THEN
    SELECT id INTO _existing FROM public.notifications
      WHERE user_id = _user_id AND dedupe_key = _dedupe_key AND sent_at > now() - interval '24 hours'
      LIMIT 1;
    IF _existing IS NOT NULL THEN RETURN _existing; END IF;
  END IF;

  -- category cooldown
  SELECT MAX(sent_at) INTO _last_same FROM public.notifications
    WHERE user_id = _user_id AND category = _category;
  IF _last_same IS NOT NULL AND _last_same > now() - make_interval(hours => _cooldown_hours) AND _priority NOT IN ('critical','high') THEN
    RETURN NULL;
  END IF;

  -- daily cap (non-critical)
  IF _priority <> 'critical' THEN
    SELECT COUNT(*) INTO _today_count FROM public.notifications
      WHERE user_id = _user_id AND sent_at > now() - interval '24 hours';
    IF _today_count >= _prefs.max_per_day THEN RETURN NULL; END IF;
  END IF;

  -- quiet hours (respect local TZ offset). Critical bypasses quiet hours.
  _local_hour := EXTRACT(HOUR FROM (now() + make_interval(mins => _prefs.timezone_offset_minutes)))::int;
  IF _prefs.quiet_hours_start <= _prefs.quiet_hours_end THEN
    _quiet := _local_hour >= _prefs.quiet_hours_start AND _local_hour < _prefs.quiet_hours_end;
  ELSE
    _quiet := _local_hour >= _prefs.quiet_hours_start OR _local_hour < _prefs.quiet_hours_end;
  END IF;
  IF _quiet AND _priority <> 'critical' THEN RETURN NULL; END IF;

  INSERT INTO public.notifications(user_id, category, priority, title, body, deep_link, payload, dedupe_key)
  VALUES (_user_id, _category, _priority, _title, _body, _deep_link, COALESCE(_payload,'{}'::jsonb), _dedupe_key)
  RETURNING id INTO _new_id;

  INSERT INTO public.notification_events(notification_id, user_id, event_type) VALUES (_new_id, _user_id, 'delivered');
  RETURN _new_id;
END $$;

-- helpers used by client
CREATE OR REPLACE FUNCTION public.mark_notification_read(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.notifications SET read_at = COALESCE(read_at, now())
    WHERE id = _id AND user_id = auth.uid();
END $$;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.notifications SET read_at = now()
    WHERE user_id = auth.uid() AND read_at IS NULL;
END $$;

CREATE OR REPLACE FUNCTION public.dismiss_notification(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.notifications SET dismissed_at = now(), read_at = COALESCE(read_at, now())
    WHERE id = _id AND user_id = auth.uid();
  INSERT INTO public.notification_events(notification_id, user_id, event_type)
    VALUES (_id, auth.uid(), 'dismissed');
END $$;

CREATE OR REPLACE FUNCTION public.log_notification_event(_id uuid, _type text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notification_events(notification_id, user_id, event_type)
    VALUES (_id, auth.uid(), _type);
END $$;

CREATE OR REPLACE FUNCTION public.unread_notification_count()
RETURNS int LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COUNT(*)::int FROM public.notifications
    WHERE user_id = auth.uid() AND read_at IS NULL AND dismissed_at IS NULL;
$$;

-- =========================================================
-- 4. EVENT TRIGGERS (event-driven, not timer-based)
-- =========================================================

-- Lesson / module / course completion off module_progress
CREATE OR REPLACE FUNCTION public.trg_module_progress_notify()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _mod RECORD; _course RECORD; _next RECORD; _total int; _done int;
BEGIN
  IF NEW.completed = true AND (OLD IS NULL OR OLD.completed = false) THEN
    SELECT m.id, m.title, m.course_id, m.position INTO _mod
      FROM public.modules m WHERE m.id = NEW.module_id;
    SELECT c.id, c.title INTO _course FROM public.courses c WHERE c.id = _mod.course_id;

    PERFORM public.dispatch_notification(
      NEW.user_id, 'lesson_completed',
      'Lesson শেষ! 🔥',
      'দারুণ চলতেছেন — "' || COALESCE(_mod.title,'lesson') || '" complete!',
      'normal', '/learn/' || _course.id,
      jsonb_build_object('module_id', _mod.id, 'course_id', _course.id),
      'lesson_done:' || _mod.id::text, 1);

    -- next unlocked
    SELECT m.id, m.title INTO _next FROM public.modules m
      WHERE m.course_id = _mod.course_id AND m.position = _mod.position + 1;
    IF FOUND THEN
      PERFORM public.dispatch_notification(
        NEW.user_id, 'module_unlocked',
        'Next lesson unlock! 🔓',
        '"' || _next.title || '" এখন খেলার জন্য ready 😎',
        'high', '/learn/' || _course.id,
        jsonb_build_object('module_id', _next.id, 'course_id', _course.id),
        'unlock:' || _next.id::text, 2);
    END IF;

    -- course completed?
    SELECT COUNT(*) INTO _total FROM public.modules WHERE course_id = _mod.course_id;
    SELECT COUNT(*) INTO _done FROM public.module_progress mp
      JOIN public.modules m ON m.id = mp.module_id
      WHERE m.course_id = _mod.course_id AND mp.user_id = NEW.user_id AND mp.completed = true;
    IF _total > 0 AND _done = _total THEN
      PERFORM public.dispatch_notification(
        NEW.user_id, 'course_completed',
        'Course শেষ! 🏆',
        '"' || _course.title || '" পুরা শেষ — certificate claim করেন!',
        'high', '/certificate/' || _course.id,
        jsonb_build_object('course_id', _course.id),
        'course_done:' || _course.id::text, 24);
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS module_progress_notify ON public.module_progress;
CREATE TRIGGER module_progress_notify AFTER INSERT OR UPDATE ON public.module_progress
  FOR EACH ROW EXECUTE FUNCTION public.trg_module_progress_notify();

-- XP / streak / level milestones via profiles UPDATE
CREATE OR REPLACE FUNCTION public.trg_profile_milestone_notify()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _old_level int := COALESCE(OLD.total_xp,0)/500;
  _new_level int := COALESCE(NEW.total_xp,0)/500;
BEGIN
  -- Level up
  IF _new_level > _old_level THEN
    PERFORM public.dispatch_notification(
      NEW.id, 'level_up',
      'Level Up! 🚀 Level ' || _new_level,
      'Boss মুডে আছেন 🔥 আরেকটা lesson দিলে আরও এগাবেন!',
      'high', '/dashboard', jsonb_build_object('level', _new_level),
      'level_up:' || _new_level::text, 6);
  END IF;

  -- Streak milestones
  IF NEW.current_streak IN (3,7,14,30,60,100) AND NEW.current_streak > COALESCE(OLD.current_streak,0) THEN
    PERFORM public.dispatch_notification(
      NEW.id, 'streak_milestone',
      'Streak ' || NEW.current_streak || ' দিন! 🔥',
      'Consistency-ই king 👑 চালায়া যান!',
      'high', '/dashboard', jsonb_build_object('streak', NEW.current_streak),
      'streak:' || NEW.current_streak::text, 12);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS profile_milestone_notify ON public.profiles;
CREATE TRIGGER profile_milestone_notify AFTER UPDATE OF total_xp, current_streak ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.trg_profile_milestone_notify();

-- Certificate issued
CREATE OR REPLACE FUNCTION public.trg_certificate_notify()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.dispatch_notification(
    NEW.user_id, 'badge_unlocked',
    'Certificate ready 🎓',
    '"' || NEW.course_title || '" — গর্ব করার মতো achievement!',
    'high', '/certificate/' || NEW.course_id,
    jsonb_build_object('cert_code', NEW.certificate_code),
    'cert:' || NEW.id::text, 24);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS certificate_notify ON public.certificates;
CREATE TRIGGER certificate_notify AFTER INSERT ON public.certificates
  FOR EACH ROW EXECUTE FUNCTION public.trg_certificate_notify();

-- Behavior tracker (lightweight): update last_lesson_at + most_active_hour on watch progress
CREATE OR REPLACE FUNCTION public.trg_behavior_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _hour int := EXTRACT(HOUR FROM (now() + interval '6 hours'))::int; _pattern text;
BEGIN
  _pattern := CASE
    WHEN _hour BETWEEN 5 AND 11 THEN 'morning'
    WHEN _hour BETWEEN 12 AND 16 THEN 'afternoon'
    WHEN _hour BETWEEN 17 AND 20 THEN 'evening'
    ELSE 'night' END;
  INSERT INTO public.user_behavior(user_id, most_active_hour, last_lesson_at, pattern, updated_at)
    VALUES (NEW.user_id, _hour, now(), _pattern, now())
    ON CONFLICT (user_id) DO UPDATE
      SET most_active_hour = _hour,
          last_lesson_at = now(),
          pattern = _pattern,
          updated_at = now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS behavior_update ON public.module_progress;
CREATE TRIGGER behavior_update AFTER INSERT OR UPDATE ON public.module_progress
  FOR EACH ROW EXECUTE FUNCTION public.trg_behavior_update();

-- =========================================================
-- 5. REALTIME
-- =========================================================
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='notifications';
  IF NOT FOUND THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
