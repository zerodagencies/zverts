
CREATE OR REPLACE FUNCTION public.svc_approve_payment(_payment_id uuid, _actor_label text DEFAULT 'telegram_admin')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _p public.payments%ROWTYPE; _first_paid boolean := false;
BEGIN
  SELECT * INTO _p FROM public.payments WHERE id = _payment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found'; END IF;
  IF _p.status <> 'pending' THEN RAISE EXCEPTION 'Already processed'; END IF;
  UPDATE public.payments SET status='approved', approved_at=now() WHERE id=_payment_id;
  SELECT NOT is_paid_user INTO _first_paid FROM public.profiles WHERE id = _p.user_id;
  UPDATE public.profiles
    SET convert_credits = convert_credits + _p.credits,
        total_paid = total_paid + _p.amount,
        is_paid_user = true,
        ai_enabled = true
    WHERE id = _p.user_id;
  INSERT INTO public.audit_logs(actor_id, action, target_user, metadata)
    VALUES (NULL,'payment_approved',_p.user_id,
      jsonb_build_object('payment_id',_p.id,'credits',_p.credits,'amount',_p.amount,'package',_p.package_type,'first_paid',_first_paid,'via',_actor_label));
  PERFORM public.dispatch_notification(
    _p.user_id, 'system_success', 'Payment approved 🎉',
    _p.credits || ' convert credits added!' || CASE WHEN _first_paid THEN ' AI unlocked for lifetime ✨' ELSE '' END,
    'high', '/dashboard', jsonb_build_object('payment_id',_p.id),
    'pay_ok:'|| _p.id::text, 1);
  RETURN jsonb_build_object('ok',true,'first_paid',_first_paid);
END $$;

CREATE OR REPLACE FUNCTION public.svc_reject_payment(_payment_id uuid, _note text DEFAULT NULL, _actor_label text DEFAULT 'telegram_admin')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _p public.payments%ROWTYPE;
BEGIN
  SELECT * INTO _p FROM public.payments WHERE id = _payment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found'; END IF;
  IF _p.status <> 'pending' THEN RAISE EXCEPTION 'Already processed'; END IF;
  UPDATE public.payments SET status='rejected', rejected_at=now(), admin_note=_note WHERE id=_payment_id;
  INSERT INTO public.audit_logs(actor_id, action, target_user, metadata)
    VALUES (NULL,'payment_rejected',_p.user_id, jsonb_build_object('payment_id',_p.id,'note',_note,'via',_actor_label));
  PERFORM public.dispatch_notification(
    _p.user_id, 'system_failure', 'Payment rejected',
    COALESCE(_note,'Your payment was rejected. Please contact admin if this is a mistake.'),
    'high', '/payments', jsonb_build_object('payment_id',_p.id),
    'pay_no:'|| _p.id::text, 1);
  RETURN jsonb_build_object('ok',true);
END $$;

REVOKE ALL ON FUNCTION public.svc_approve_payment(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.svc_reject_payment(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.svc_approve_payment(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.svc_reject_payment(uuid, text, text) TO service_role;
