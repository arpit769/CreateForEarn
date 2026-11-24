-- ==============================================================================
-- IMMEDIATE FIX: Restore User Profile Access & Fix RLS Recursion
-- Run this in Supabase Dashboard -> SQL Editor IMMEDIATELY!
-- ==============================================================================

-- 1. DROP the recursive policy on users that caused the login error
DROP POLICY IF EXISTS "Clients can view workers who submitted tasks" ON public.users;

-- 2. Ensure every authenticated user can ALWAYS read and update their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
FOR SELECT TO authenticated
USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 3. Ensure admins have full access to users via secure SECURITY DEFINER function
DROP POLICY IF EXISTS "Admins have full access to users" ON public.users;
CREATE POLICY "Admins have full access to users" ON public.users
FOR ALL USING (public.is_admin());

-- 4. Fix client_campaigns policy so it doesn't query public.users directly
DROP POLICY IF EXISTS "admin_full_access_client_campaigns" ON public.client_campaigns;
CREATE POLICY "admin_full_access_client_campaigns" ON public.client_campaigns
FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 5. Clean, non-recursive policies for tasks and task_claims
DROP POLICY IF EXISTS "Clients can view own tasks" ON public.tasks;
CREATE POLICY "Clients can view own tasks" ON public.tasks
FOR SELECT TO authenticated
USING (
    tasks.client_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.client_campaigns
        WHERE client_campaigns.id = tasks.campaign_id
        AND client_campaigns.client_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Clients can view task_claims for their campaigns" ON public.task_claims;
CREATE POLICY "Clients can view task_claims for their campaigns" ON public.task_claims
FOR SELECT TO authenticated
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

-- 6. Clean policies for social accounts so clients can view creator handles
DROP POLICY IF EXISTS "Clients can view reddit_accounts for their tasks" ON public.reddit_accounts;
CREATE POLICY "Clients can view reddit_accounts for their tasks" ON public.reddit_accounts
FOR SELECT TO authenticated
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
CREATE POLICY "Clients can view youtube_accounts for their tasks" ON public.youtube_accounts
FOR SELECT TO authenticated
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
CREATE POLICY "Clients can view x_accounts for their tasks" ON public.x_accounts
FOR SELECT TO authenticated
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
