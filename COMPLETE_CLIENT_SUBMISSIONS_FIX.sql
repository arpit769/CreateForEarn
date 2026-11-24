-- ==============================================================================
-- COMPLETE FIX: Client Submissions Linking & Secure RPC (JSONB Edition)
-- Run this in your Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. Ensure tasks table has custom_id, client_id, and campaign_id columns
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS custom_id TEXT,
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.client_campaigns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_custom_id ON public.tasks(custom_id);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON public.tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_campaign_id ON public.tasks(campaign_id);

-- 2. Link existing tasks (like "Client post task test (#1)") to their campaign
UPDATE public.tasks t
SET 
  campaign_id = cc.id,
  client_id = cc.client_id,
  custom_id = COALESCE(t.custom_id, (regexp_match(t.instructions, '\[Client Task ID:\s*([A-Za-z0-9_-]+)\]'))[1], 'C1')
FROM public.client_campaigns cc
WHERE (t.campaign_id IS NULL OR t.client_id IS NULL)
  AND (
    t.title = cc.name 
    OR t.title LIKE cc.name || ' (#%)'
    OR t.title LIKE cc.name || '%'
  );

-- 3. Create high-performance secure function returning JSONB (immune to enum/type mismatches & RLS blocks)
DROP FUNCTION IF EXISTS public.get_client_campaign_submissions(UUID);

CREATE OR REPLACE FUNCTION public.get_client_campaign_submissions(
  p_campaign_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_client_id UUID := auth.uid();
  v_result JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(row_to_json(sub)), '[]'::jsonb) INTO v_result
  FROM (
    SELECT 
      tc.id,
      tc.task_id,
      tc.user_id,
      tc.status::text AS status,
      tc.proof_url,
      tc.reddit_url,
      COALESCE(tc.proof_url, tc.reddit_url) AS live_proof_url,
      tc.screenshot_url,
      COALESCE(tc.bonus_amount, 0)::numeric AS bonus_amount,
      tc.admin_notes,
      tc.submitted_at,
      tc.reviewed_at,
      tc.created_at,
      cc.id AS campaign_id,
      cc.name AS campaign_name,
      cc.platform AS campaign_platform,
      cc.task_type AS campaign_task_type,
      t.title AS task_title,
      COALESCE(t.custom_id, (regexp_match(t.instructions, '\[Client Task ID:\s*([A-Za-z0-9_-]+)\]'))[1], 'C1') AS task_custom_id,
      t.task_seq_id,
      t.payment_amount AS task_payment_amount,
      COALESCE(
        CASE 
          WHEN LOWER(COALESCE(t.platform, cc.platform)) = 'reddit' AND ra.reddit_profile_link IS NOT NULL THEN
            COALESCE('u/' || (regexp_match(ra.reddit_profile_link, '(?:reddit\.com/user/|reddit\.com/u/)([^/?#]+)'))[1], ra.reddit_profile_link)
          WHEN LOWER(COALESCE(t.platform, cc.platform)) = 'youtube' AND yta.channel_name IS NOT NULL THEN yta.channel_name
          WHEN LOWER(COALESCE(t.platform, cc.platform)) IN ('x', 'twitter') AND xa.username IS NOT NULL THEN '@' || REPLACE(xa.username, '@', '')
          WHEN LOWER(COALESCE(t.platform, cc.platform)) = 'instagram' AND ia.username IS NOT NULL THEN '@' || REPLACE(ia.username, '@', '')
          WHEN LOWER(COALESCE(t.platform, cc.platform)) = 'quora' AND qa.username IS NOT NULL THEN qa.username
          WHEN LOWER(COALESCE(t.platform, cc.platform)) = 'linkedin' AND la.username IS NOT NULL THEN la.username
          WHEN LOWER(COALESCE(t.platform, cc.platform)) = 'facebook' AND fa.username IS NOT NULL THEN fa.username
          ELSE NULL
        END,
        u.full_name,
        'Creator'
      ) AS worker_handle,
      CASE 
        WHEN LOWER(COALESCE(t.platform, cc.platform)) = 'reddit' AND ra.reddit_profile_link IS NOT NULL THEN
          CASE WHEN ra.reddit_profile_link LIKE 'http%' THEN ra.reddit_profile_link ELSE 'https://' || ra.reddit_profile_link END
        WHEN LOWER(COALESCE(t.platform, cc.platform)) = 'youtube' AND yta.channel_id IS NOT NULL THEN 'https://youtube.com/channel/' || yta.channel_id
        WHEN LOWER(COALESCE(t.platform, cc.platform)) IN ('x', 'twitter') AND xa.username IS NOT NULL THEN COALESCE(xa.profile_url, 'https://x.com/' || REPLACE(xa.username, '@', ''))
        WHEN LOWER(COALESCE(t.platform, cc.platform)) = 'instagram' AND ia.username IS NOT NULL THEN COALESCE(ia.profile_url, 'https://instagram.com/' || REPLACE(ia.username, '@', ''))
        WHEN LOWER(COALESCE(t.platform, cc.platform)) = 'quora' AND qa.username IS NOT NULL THEN COALESCE(qa.profile_url, 'https://quora.com/profile/' || qa.username)
        WHEN LOWER(COALESCE(t.platform, cc.platform)) = 'linkedin' AND la.profile_url IS NOT NULL THEN la.profile_url
        ELSE NULL
      END AS worker_profile_url
    FROM public.client_campaigns cc
    JOIN public.tasks t ON (
      t.campaign_id = cc.id 
      OR t.client_id = cc.client_id
      OR t.title = cc.name
      OR t.title LIKE cc.name || ' (#%)'
      OR t.title LIKE cc.name || '%'
    )
    JOIN public.task_claims tc ON tc.task_id = t.id
    LEFT JOIN public.users u ON u.id = tc.user_id
    LEFT JOIN public.reddit_accounts ra ON ra.id = tc.reddit_account_id
    LEFT JOIN public.youtube_accounts yta ON yta.id = tc.youtube_account_id
    LEFT JOIN public.x_accounts xa ON xa.id = tc.x_account_id
    LEFT JOIN public.quora_accounts qa ON qa.id = tc.quora_account_id
    LEFT JOIN public.instagram_accounts ia ON ia.id = tc.instagram_account_id
    LEFT JOIN public.linkedin_accounts la ON la.id = tc.linkedin_account_id
    LEFT JOIN public.facebook_accounts fa ON fa.id = tc.facebook_account_id
    WHERE (cc.client_id = v_client_id OR EXISTS (SELECT 1 FROM public.users WHERE id = v_client_id AND role = 'admin'))
      AND (p_campaign_id IS NULL OR cc.id = p_campaign_id)
    ORDER BY tc.submitted_at DESC NULLS LAST
  ) sub;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
