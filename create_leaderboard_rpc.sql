-- Migration: Create get_leaderboard RPC
-- Run this in your Supabase Dashboard -> SQL Editor

CREATE OR REPLACE FUNCTION public.get_leaderboard(
  p_platform TEXT,
  p_days INT,
  p_limit INT
)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  total_earnings NUMERIC,
  total_tasks BIGINT,
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH RankedUsers AS (
    SELECT 
      u.id AS user_id,
      u.full_name,
      SUM(COALESCE(t.payment_amount, 0) + COALESCE(tc.bonus_amount, 0)) AS total_earnings,
      COUNT(tc.id) AS total_tasks
    FROM public.task_claims tc
    JOIN public.tasks t ON t.id = tc.task_id
    JOIN public.users u ON u.id = tc.user_id
    WHERE tc.status = 'approved'
      AND t.platform = p_platform
      AND COALESCE(tc.reviewed_at, tc.submitted_at, tc.claimed_at) >= (NOW() - (p_days || ' days')::INTERVAL)
    GROUP BY u.id, u.full_name
  )
  SELECT 
    ru.user_id,
    ru.full_name,
    ru.total_earnings,
    ru.total_tasks,
    ROW_NUMBER() OVER(ORDER BY ru.total_earnings DESC, ru.total_tasks DESC) AS rank
  FROM RankedUsers ru
  ORDER BY rank
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
