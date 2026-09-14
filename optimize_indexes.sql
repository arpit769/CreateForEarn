-- ============================================================================
-- HIGH-PERFORMANCE DATABASE INDEXES FOR TASKS & CLAIMS (1000+ TASKS)
-- Run this in Supabase Dashboard -> SQL Editor
-- ============================================================================

-- 1. Index foreign keys and statuses on task_claims (critical for claims counting, availability & user queries)
CREATE INDEX IF NOT EXISTS idx_task_claims_task_id ON public.task_claims(task_id);
CREATE INDEX IF NOT EXISTS idx_task_claims_task_status ON public.task_claims(task_id, status);
CREATE INDEX IF NOT EXISTS idx_task_claims_user_status ON public.task_claims(user_id, status);
CREATE INDEX IF NOT EXISTS idx_task_claims_reddit_acc ON public.task_claims(reddit_account_id, status);
CREATE INDEX IF NOT EXISTS idx_task_claims_youtube_acc ON public.task_claims(youtube_account_id, status);
CREATE INDEX IF NOT EXISTS idx_task_claims_claimed_at ON public.task_claims(claimed_at DESC);

-- 2. Index tasks table for fast filtering, scheduling & sorting
CREATE INDEX IF NOT EXISTS idx_tasks_status_created ON public.tasks(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_platform_status ON public.tasks(platform, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON public.tasks(task_category);
CREATE INDEX IF NOT EXISTS idx_tasks_subreddit ON public.tasks(subreddit_id);
CREATE INDEX IF NOT EXISTS idx_tasks_post_link ON public.tasks(post_link);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_for ON public.tasks(scheduled_for) WHERE status = 'scheduled';

-- 3. Index user and social account tables
CREATE INDEX IF NOT EXISTS idx_reddit_accounts_user_id ON public.reddit_accounts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_youtube_accounts_user_id ON public.youtube_accounts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ras_account_sub ON public.reddit_account_subreddits(reddit_account_id, subreddit_id);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON public.users(referral_code);
