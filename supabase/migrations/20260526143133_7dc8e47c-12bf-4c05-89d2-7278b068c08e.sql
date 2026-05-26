
-- 1) Block direct INSERT/UPDATE/DELETE on module_progress (writes go through update_module_progress RPC)
CREATE POLICY "module_progress_block_direct_writes"
  ON public.module_progress
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- 2) Remove support_contacts from realtime publication to prevent PII broadcast
ALTER PUBLICATION supabase_realtime DROP TABLE public.support_contacts;
