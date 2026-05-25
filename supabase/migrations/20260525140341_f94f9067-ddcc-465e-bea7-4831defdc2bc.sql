CREATE OR REPLACE FUNCTION public.admin_broadcast_notification(
  _title text, _body text, _deep_link text DEFAULT NULL, _priority text DEFAULT 'high'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _actor uuid := auth.uid(); _count int := 0; _prio notification_priority;
BEGIN
  IF NOT (public.has_role(_actor,'admin') OR public.has_role(_actor,'super_admin')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF length(coalesce(_title,'')) < 1 OR length(_title) > 120 THEN RAISE EXCEPTION 'Invalid title'; END IF;
  IF length(coalesce(_body,'')) < 1 OR length(_body) > 500 THEN RAISE EXCEPTION 'Invalid body'; END IF;
  _prio := COALESCE(NULLIF(_priority,'')::notification_priority, 'high');
  INSERT INTO public.notifications(user_id, category, priority, title, body, deep_link, payload, dedupe_key)
  SELECT p.id, 'system_success'::notification_category, _prio, _title, _body, _deep_link,
         jsonb_build_object('broadcast', true, 'actor', _actor),
         'broadcast:'|| md5(_title||'|'||_body||'|'|| now()::text)
  FROM public.profiles p;
  GET DIAGNOSTICS _count = ROW_COUNT;
  INSERT INTO public.audit_logs(actor_id, action, metadata)
    VALUES (_actor,'broadcast_sent', jsonb_build_object('title',_title,'count',_count,'priority',_prio));
  RETURN jsonb_build_object('ok', true, 'count', _count);
END $$;

-- realtime for notifications already needed for popups
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='notifications';
  IF NOT FOUND THEN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications'; END IF;
END $$;