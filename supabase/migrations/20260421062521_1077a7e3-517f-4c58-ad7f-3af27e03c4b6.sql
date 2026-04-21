
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_roles_admin_all" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Modules
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position INT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  youtube_video_id TEXT NOT NULL,
  duration_seconds INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "modules_public_read" ON public.modules FOR SELECT USING (true);
CREATE POLICY "modules_admin_write" ON public.modules FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Module progress
CREATE TABLE public.module_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  watch_time_seconds INT NOT NULL DEFAULT 0,
  percent_watched NUMERIC(5,2) NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id)
);
ALTER TABLE public.module_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "progress_select_own" ON public.module_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "progress_admin_read" ON public.module_progress FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Profile auto-create trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Module unlock check
CREATE OR REPLACE FUNCTION public.is_module_unlocked(_user_id UUID, _module_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _pos INT;
  _prev_completed BOOLEAN;
BEGIN
  SELECT position INTO _pos FROM public.modules WHERE id = _module_id;
  IF _pos IS NULL THEN RETURN false; END IF;
  IF _pos = 1 THEN RETURN true; END IF;
  SELECT COALESCE(mp.completed, false) INTO _prev_completed
  FROM public.modules m
  LEFT JOIN public.module_progress mp ON mp.module_id = m.id AND mp.user_id = _user_id
  WHERE m.position = _pos - 1;
  RETURN COALESCE(_prev_completed, false);
END;
$$;

-- Update progress (server-validated, anti-bypass)
CREATE OR REPLACE FUNCTION public.update_module_progress(
  _module_id UUID,
  _watch_time INT,
  _force_complete BOOLEAN DEFAULT false
)
RETURNS public.module_progress LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _duration INT;
  _pct NUMERIC(5,2);
  _completed BOOLEAN;
  _existing public.module_progress%ROWTYPE;
  _result public.module_progress%ROWTYPE;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.is_module_unlocked(_uid, _module_id) THEN
    RAISE EXCEPTION 'Module is locked';
  END IF;

  SELECT duration_seconds INTO _duration FROM public.modules WHERE id = _module_id;
  IF _duration IS NULL OR _duration = 0 THEN _duration := 1; END IF;

  -- Clamp watch time
  IF _watch_time < 0 THEN _watch_time := 0; END IF;
  IF _watch_time > _duration THEN _watch_time := _duration; END IF;

  -- Never decrease watch time
  SELECT * INTO _existing FROM public.module_progress WHERE user_id = _uid AND module_id = _module_id;
  IF FOUND AND _existing.watch_time_seconds > _watch_time THEN
    _watch_time := _existing.watch_time_seconds;
  END IF;

  _pct := LEAST(100, ROUND((_watch_time::NUMERIC / _duration) * 100, 2));
  _completed := _force_complete OR _pct >= 90 OR (FOUND AND _existing.completed);

  INSERT INTO public.module_progress (user_id, module_id, watch_time_seconds, percent_watched, completed, completed_at, updated_at)
  VALUES (_uid, _module_id, _watch_time, _pct, _completed, CASE WHEN _completed THEN now() ELSE NULL END, now())
  ON CONFLICT (user_id, module_id) DO UPDATE SET
    watch_time_seconds = EXCLUDED.watch_time_seconds,
    percent_watched = EXCLUDED.percent_watched,
    completed = EXCLUDED.completed,
    completed_at = COALESCE(public.module_progress.completed_at, EXCLUDED.completed_at),
    updated_at = now()
  RETURNING * INTO _result;

  -- Touch last_active
  UPDATE public.profiles SET last_active = now() WHERE id = _uid;

  RETURN _result;
END;
$$;
