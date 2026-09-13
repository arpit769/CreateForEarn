-- Migration: Create get_admin_task_stats RPC for lightning-fast and permanent lifetime stats
-- Run this in your Supabase Dashboard -> SQL Editor

CREATE OR REPLACE FUNCTION public.get_admin_task_stats(
  p_platform TEXT DEFAULT 'all'
)
RETURNS TABLE (
  total_approved_tasks BIGINT,
  total_base_amount NUMERIC,
  total_bonus_amount NUMERIC,
  total_money_given NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(tc.id)::BIGINT AS total_approved_tasks,
    COALESCE(SUM(COALESCE(t.payment_amount, 0)), 0)::NUMERIC AS total_base_amount,
    COALESCE(SUM(COALESCE(tc.bonus_amount, 0)), 0)::NUMERIC AS total_bonus_amount,
    COALESCE(SUM(COALESCE(t.payment_amount, 0) + COALESCE(tc.bonus_amount, 0)), 0)::NUMERIC AS total_money_given
  FROM public.task_claims tc
  JOIN public.tasks t ON t.id = tc.task_id
  WHERE tc.status = 'approved'
    AND (
      p_platform = 'all' 
      OR (p_platform = 'reddit' AND (t.platform = 'reddit' OR t.platform IS NULL))
      OR (p_platform = 'youtube' AND t.platform = 'youtube')
      OR t.platform = p_platform
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
