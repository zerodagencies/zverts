CREATE OR REPLACE FUNCTION public.notify_admin_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, net
AS $$
DECLARE
  payload jsonb;
BEGIN
  payload := jsonb_build_object(
    'record', jsonb_build_object(
      'id', NEW.id,
      'user_id', NEW.user_id,
      'package_type', NEW.package_type,
      'credits', NEW.credits,
      'amount', NEW.amount,
      'method', NEW.method,
      'sender_number', NEW.sender_number,
      'trx_id', NEW.trx_id,
      'status', NEW.status
    )
  );

  PERFORM net.http_post(
    url := 'https://rehgfihjeuvtixjphzku.supabase.co/functions/v1/notify-admin',
    body := payload,
    headers := jsonb_build_object('Content-Type', 'application/json')
  );

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_admin_payment() FROM PUBLIC, anon, authenticated;