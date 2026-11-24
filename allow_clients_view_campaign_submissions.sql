-- ==============================================================================
-- Allow Brand Clients to View Tasks, Submissions, and Social Handles for Their Campaigns
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor)
-- ==============================================================================

-- 1. Ensure users can always read their own profile without recursion
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
FOR SELECT TO authenticated
USING (id = auth.uid());

-- 2. Drop any recursive policy on users
DROP POLICY IF EXISTS "Clients can view workers who submitted tasks" ON public.users;

-- 3. Ensure clients can view tasks belonging to their campaigns
DROP POLICY IF EXISTS "Clients can view own tasks" ON public.tasks;

CREATE POLICY "Clients can view own tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (
    tasks.client_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.client_campaigns
        WHERE client_campaigns.id = tasks.campaign_id
        AND client_campaigns.client_id = auth.uid()
    )
);

-- 4. Ensure clients can view completed/submitted task claims on their tasks
DROP POLICY IF EXISTS "Clients can view task_claims for their campaigns" ON public.task_claims;

CREATE POLICY "Clients can view task_claims for their campaigns"
ON public.task_claims
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.tasks
        WHERE tasks.id = task_claims.task_id
        AND (
            tasks.client_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.client_campaigns
                WHERE client_campaigns.id = tasks.campaign_id
                AND client_campaigns.client_id = auth.uid()
            )
        )
    )
);

-- 5. Allow clients to view worker social accounts (Reddit, YouTube, X, etc.) linked to their campaign submissions
DROP POLICY IF EXISTS "Clients can view reddit_accounts for their tasks" ON public.reddit_accounts;
CREATE POLICY "Clients can view reddit_accounts for their tasks"
ON public.reddit_accounts
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.task_claims
        JOIN public.tasks ON tasks.id = task_claims.task_id
        WHERE task_claims.reddit_account_id = reddit_accounts.id
        AND (
            tasks.client_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.client_campaigns
                WHERE client_campaigns.id = tasks.campaign_id
                AND client_campaigns.client_id = auth.uid()
            )
        )
    )
);

DROP POLICY IF EXISTS "Clients can view youtube_accounts for their tasks" ON public.youtube_accounts;
CREATE POLICY "Clients can view youtube_accounts for their tasks"
ON public.youtube_accounts
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.task_claims
        JOIN public.tasks ON tasks.id = task_claims.task_id
        WHERE task_claims.youtube_account_id = youtube_accounts.id
        AND (
            tasks.client_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.client_campaigns
                WHERE client_campaigns.id = tasks.campaign_id
                AND client_campaigns.client_id = auth.uid()
            )
        )
    )
);

DROP POLICY IF EXISTS "Clients can view x_accounts for their tasks" ON public.x_accounts;
CREATE POLICY "Clients can view x_accounts for their tasks"
ON public.x_accounts
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.task_claims
        JOIN public.tasks ON tasks.id = task_claims.task_id
        WHERE task_claims.x_account_id = x_accounts.id
        AND (
            tasks.client_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.client_campaigns
                WHERE client_campaigns.id = tasks.campaign_id
                AND client_campaigns.client_id = auth.uid()
            )
        )
    )
);
