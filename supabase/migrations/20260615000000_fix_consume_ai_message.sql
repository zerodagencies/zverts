-- consume_ai_message and get_ai_usage_today were reading is_paid_user from
-- profiles, but that column was moved to user_entitlements in
-- 20260608020000_split_profiles_table. Fix both functions to query
-- user_entitlements instead.

CREATE OR REPLACE FUNCTION public.consume_ai_message(_daily_limit int DEFAULT 10)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _today date := (now() AT TIME ZONE 'UTC')::date;
  _is_paid boolean;
  _count int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE='42501'; END IF;
  SELECT is_paid_user INTO _is_paid FROM public.user_entitlements WHERE user_id = _uid;

  INSERT INTO public.ai_usage(user_id, day, count) VALUES (_uid, _today, 0)
    ON CONFLICT (user_id, day) DO NOTHING;

  -- lock row
  SELECT count INTO _count FROM public.ai_usage
    WHERE user_id = _uid AND day = _today FOR UPDATE;

  IF NOT COALESCE(_is_paid, false) AND _count >= _daily_limit THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'limit_reached',
      'count', _count,
      'limit', _daily_limit,
      'remaining', 0,
      'paid', false
    );
  END IF;

  UPDATE public.ai_usage SET count = count + 1
    WHERE user_id = _uid AND day = _today
    RETURNING count INTO _count;

  RETURN jsonb_build_object(
    'ok', true,
    'count', _count,
    'limit', _daily_limit,
    'remaining', CASE WHEN COALESCE(_is_paid, false) THEN NULL ELSE GREATEST(0, _daily_limit - _count) END,
    'paid', COALESCE(_is_paid, false)
  );
END $$;

CREATE OR REPLACE FUNCTION public.get_ai_usage_today(_daily_limit int DEFAULT 10)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _today date := (now() AT TIME ZONE 'UTC')::date;
  _is_paid boolean;
  _count int;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('ok', false); END IF;
  SELECT is_paid_user INTO _is_paid FROM public.user_entitlements WHERE user_id = _uid;
  SELECT count INTO _count FROM public.ai_usage WHERE user_id = _uid AND day = _today;
  _count := COALESCE(_count, 0);
  RETURN jsonb_build_object(
    'count', _count,
    'limit', _daily_limit,
    'remaining', CASE WHEN COALESCE(_is_paid, false) THEN NULL ELSE GREATEST(0, _daily_limit - _count) END,
    'paid', COALESCE(_is_paid, false)
  );
END $$;
