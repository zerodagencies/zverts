-- Migration: fix notify_admin_payment() referencing dropped package_type column
-- Root cause: DROP TYPE package_type CASCADE removed the column from
-- public.payments, but trigger function bodies are plain text as far as
-- Postgres' dependency graph is concerned -- CASCADE does not inspect or
-- rewrite them. notify_admin_payment() still referenced NEW.package_type,
-- so it only failed at execution time with:
--   record "new" has no field "package_type"
--
-- Fix: drop the package_type key from the notification payload.
--
-- NOTE: anon key is hardcoded below rather than pulled from a GUC/Vault
-- secret. Hosted Supabase does not grant permission to ALTER DATABASE ...
-- SET custom parameters (superuser-only), and this is the anon key, not
-- service_role -- it's designed to be public-facing (it already ships in
-- the frontend bundle), so hardcoding it here is not a meaningful
-- exposure. Actual access control should rely on RLS policies, not on
-- this key being secret.

CREATE OR REPLACE FUNCTION public.notify_admin_payment()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  payload   jsonb;
  prior_ct  integer;
BEGIN
  SELECT count(*) INTO prior_ct
    FROM public.payments
   WHERE lower(trx_id) = lower(NEW.trx_id)
     AND id <> NEW.id;

  payload := jsonb_build_object(
    'record', jsonb_build_object(
      'id',            NEW.id,
      'user_id',       NEW.user_id,
      'credits',       NEW.credits,
      'amount',        NEW.amount,
      'method',        NEW.method,
      'sender_number', NEW.sender_number,
      'trx_id',        NEW.trx_id,
      'status',        NEW.status,
      'prior_count',   prior_ct
    )
  );

  BEGIN
    PERFORM net.http_post(
      url     := 'https://jiprvhotnoobsutdlnrf.supabase.co/functions/v1/notify-admin',
      body    := payload,
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppcHJ2aG90bm9vYnN1dGRsbnJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MzU4NzUsImV4cCI6MjA5NjMxMTg3NX0.bs4n5HxjnfVDBEr9Qzsg9fntu_ANZhsVoiEB5Uj7suU',
        'apikey',        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppcHJ2aG90bm9vYnN1dGRsbnJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MzU4NzUsImV4cCI6MjA5NjMxMTg3NX0.bs4n5HxjnfVDBEr9Qzsg9fntu_ANZhsVoiEB5Uj7suU'
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_admin_payment: failed to queue HTTP request: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;