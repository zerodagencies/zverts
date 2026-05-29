GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

ALTER TABLE public.payments REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'payments'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.payments';
  END IF;
END $$;