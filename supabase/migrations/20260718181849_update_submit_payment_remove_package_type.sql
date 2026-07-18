-- Drop the package_type enum (cascades to submit_payment function)
DROP TYPE package_type CASCADE;

-- Recreate submit_payment without package_type param, fixed pricing
CREATE OR REPLACE FUNCTION public.submit_payment(
  _method text,
  _sender_number text,
  _trx_id text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE _uid uuid := auth.uid(); _id uuid; _pending int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  _sender_number := regexp_replace(coalesce(_sender_number,''),'\s','','g');
  _trx_id := upper(regexp_replace(coalesce(_trx_id,''),'\s','','g'));
  IF length(_sender_number) < 8 OR length(_sender_number) > 20 THEN RAISE EXCEPTION 'Invalid sender number'; END IF;
  IF length(_trx_id) < 4 OR length(_trx_id) > 40 THEN RAISE EXCEPTION 'Invalid transaction id'; END IF;
  SELECT count(*) INTO _pending FROM public.payments WHERE user_id = _uid AND status = 'pending';
  IF _pending >= 3 THEN RAISE EXCEPTION 'Too many pending requests'; END IF;
  INSERT INTO public.payments(user_id, credits, amount, method, sender_number, trx_id)
    VALUES (_uid, 100, 179, _method, _sender_number, _trx_id)
    RETURNING id INTO _id;
  PERFORM public.dispatch_notification(
    _uid, 'system_success', 'Payment submitted',
    'Your payment request is awaiting admin approval.',
    'normal', '/payments', jsonb_build_object('payment_id', _id),
    'pay_sub:'|| _id::text, 1);
  RETURN _id;
END;
$$;