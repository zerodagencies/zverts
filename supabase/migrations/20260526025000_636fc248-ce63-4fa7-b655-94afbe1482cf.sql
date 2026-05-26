
-- User requests a refund on their own approved payment
CREATE OR REPLACE FUNCTION public.request_refund(_payment_id uuid, _reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _uid uuid := auth.uid(); _p public.payments%ROWTYPE;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF length(coalesce(_reason,'')) < 5 OR length(_reason) > 500 THEN
    RAISE EXCEPTION 'Please describe your refund reason (5-500 chars)';
  END IF;
  SELECT * INTO _p FROM public.payments WHERE id = _payment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found'; END IF;
  IF _p.user_id <> _uid THEN RAISE EXCEPTION 'Not your payment'; END IF;
  IF _p.status <> 'approved' THEN RAISE EXCEPTION 'Only approved payments can be refunded'; END IF;
  UPDATE public.payments
    SET status = 'refund_pending',
        refund_requested_at = now(),
        refund_reason = _reason
    WHERE id = _payment_id;
  INSERT INTO public.audit_logs(actor_id, action, target_user, metadata)
    VALUES (_uid, 'refund_requested', _uid, jsonb_build_object('payment_id', _p.id, 'reason', _reason));
  RETURN jsonb_build_object('ok', true);
END $$;

-- Admin approves or rejects a refund request
CREATE OR REPLACE FUNCTION public.process_refund(_payment_id uuid, _approve boolean, _note text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _actor uuid := auth.uid(); _p public.payments%ROWTYPE;
BEGIN
  IF NOT (public.has_role(_actor,'admin') OR public.has_role(_actor,'super_admin')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT * INTO _p FROM public.payments WHERE id = _payment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found'; END IF;
  IF _p.status <> 'refund_pending' THEN RAISE EXCEPTION 'No refund pending for this payment'; END IF;

  IF _approve THEN
    UPDATE public.payments
      SET status = 'refunded',
          refunded = true,
          refunded_by = _actor,
          refunded_at = now(),
          refund_note = _note
      WHERE id = _payment_id;
    INSERT INTO public.audit_logs(actor_id, action, target_user, metadata)
      VALUES (_actor, 'refund_approved', _p.user_id,
        jsonb_build_object('payment_id', _p.id, 'amount', _p.amount, 'note', _note));
    PERFORM public.dispatch_notification(
      _p.user_id, 'system_success', 'Refund approved 💸',
      COALESCE(_note,'Your refund has been approved and will be processed in 3-7 business days.'),
      'high', '/payments', jsonb_build_object('payment_id', _p.id),
      'refund_ok:'|| _p.id::text, 1);
  ELSE
    UPDATE public.payments
      SET status = 'refund_rejected',
          refunded_by = _actor,
          refunded_at = now(),
          refund_note = _note
      WHERE id = _payment_id;
    INSERT INTO public.audit_logs(actor_id, action, target_user, metadata)
      VALUES (_actor, 'refund_rejected', _p.user_id,
        jsonb_build_object('payment_id', _p.id, 'note', _note));
    PERFORM public.dispatch_notification(
      _p.user_id, 'system_failure', 'Refund rejected',
      COALESCE(_note,'Your refund request was rejected. Please contact support if you have questions.'),
      'high', '/payments', jsonb_build_object('payment_id', _p.id),
      'refund_no:'|| _p.id::text, 1);
  END IF;

  RETURN jsonb_build_object('ok', true);
END $$;
