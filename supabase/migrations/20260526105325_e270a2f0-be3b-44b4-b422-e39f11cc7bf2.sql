-- Explicit deny-direct-writes policies on tables that should only be written
-- through SECURITY DEFINER RPCs. RLS already default-denies when no policy
-- matches, but adding RESTRICTIVE policies makes the intent explicit and
-- satisfies write-protection scanners.

-- payments: only submit_payment / approve_payment / reject_payment / refund RPCs
CREATE POLICY payments_block_direct_writes ON public.payments
  AS RESTRICTIVE FOR ALL TO authenticated, anon
  USING (false) WITH CHECK (false);

-- achievements: only award_achievement RPC
CREATE POLICY achievements_block_direct_writes ON public.achievements
  AS RESTRICTIVE FOR ALL TO authenticated, anon
  USING (false) WITH CHECK (false);

-- ai_usage: only consume_ai_message RPC
CREATE POLICY ai_usage_block_direct_writes ON public.ai_usage
  AS RESTRICTIVE FOR ALL TO authenticated, anon
  USING (false) WITH CHECK (false);

-- daily_challenges: only grade_and_submit_daily_challenge / submit_daily_challenge RPC
CREATE POLICY daily_challenges_block_direct_writes ON public.daily_challenges
  AS RESTRICTIVE FOR ALL TO authenticated, anon
  USING (false) WITH CHECK (false);

-- mcq_attempts: only submit_mcq RPC
CREATE POLICY mcq_attempts_block_direct_writes ON public.mcq_attempts
  AS RESTRICTIVE FOR ALL TO authenticated, anon
  USING (false) WITH CHECK (false);

-- user_behavior: only trg_behavior_update trigger
CREATE POLICY user_behavior_block_direct_writes ON public.user_behavior
  AS RESTRICTIVE FOR ALL TO authenticated, anon
  USING (false) WITH CHECK (false);