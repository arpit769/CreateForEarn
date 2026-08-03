-- Migration: Multiple Reddit Accounts

-- 1. Create reddit_accounts table
CREATE TABLE public.reddit_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    reddit_profile_link TEXT,
    reddit_karma INTEGER,
    reddit_account_age TEXT,
    status TEXT DEFAULT 'pending_details',
    rejection_reason TEXT,
    ban_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create reddit_account_subreddits table
CREATE TABLE public.reddit_account_subreddits (
    reddit_account_id UUID REFERENCES public.reddit_accounts(id) ON DELETE CASCADE,
    subreddit_id UUID REFERENCES public.subreddits(id) ON DELETE CASCADE,
    PRIMARY KEY (reddit_account_id, subreddit_id)
);

-- 3. Add active_reddit_account_id to users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS active_reddit_account_id UUID REFERENCES public.reddit_accounts(id) ON DELETE SET NULL;

-- 4. Add reddit_account_id to task_claims
ALTER TABLE public.task_claims ADD COLUMN IF NOT EXISTS reddit_account_id UUID REFERENCES public.reddit_accounts(id) ON DELETE SET NULL;

-- 5. Add reddit_account_id to transactions (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions') THEN
        ALTER TABLE public.transactions ADD COLUMN reddit_account_id UUID REFERENCES public.reddit_accounts(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 6. Migrate existing data
DO $$
DECLARE
    u RECORD;
    new_acc_id UUID;
BEGIN
    FOR u IN SELECT * FROM public.users WHERE role = 'worker' AND reddit_profile_link IS NOT NULL LOOP
        -- Insert into reddit_accounts
        INSERT INTO public.reddit_accounts (
            user_id,
            reddit_profile_link,
            reddit_karma,
            reddit_account_age,
            status,
            rejection_reason,
            ban_reason,
            created_at
        ) VALUES (
            u.id,
            u.reddit_profile_link,
            u.reddit_karma,
            u.reddit_account_age,
            u.status,
            u.rejection_reason,
            u.ban_reason,
            u.created_at
        ) RETURNING id INTO new_acc_id;

        -- Update user to set active_reddit_account_id
        UPDATE public.users SET active_reddit_account_id = new_acc_id WHERE id = u.id;

        -- Migrate tags from user_subreddits to reddit_account_subreddits
        INSERT INTO public.reddit_account_subreddits (reddit_account_id, subreddit_id)
        SELECT new_acc_id, subreddit_id FROM public.user_subreddits WHERE user_id = u.id;
        
        -- Migrate task_claims
        UPDATE public.task_claims SET reddit_account_id = new_acc_id WHERE user_id = u.id;
        
        -- Migrate transactions
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions') THEN
            EXECUTE 'UPDATE public.transactions SET reddit_account_id = $1 WHERE user_id = $2' USING new_acc_id, u.id;
        END IF;
    END LOOP;
END $$;

-- Enable RLS for new tables
ALTER TABLE public.reddit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reddit_account_subreddits ENABLE ROW LEVEL SECURITY;

-- Create policies for reddit_accounts
CREATE POLICY "Users can view their own reddit accounts" ON public.reddit_accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reddit accounts" ON public.reddit_accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reddit accounts" ON public.reddit_accounts
    FOR UPDATE USING (auth.uid() = user_id);
    
CREATE POLICY "Users can delete their own reddit accounts" ON public.reddit_accounts
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins have full access to reddit_accounts" ON public.reddit_accounts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create policies for reddit_account_subreddits
CREATE POLICY "Users can view their own tags" ON public.reddit_account_subreddits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.reddit_accounts 
            WHERE id = reddit_account_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Admins have full access to tags" ON public.reddit_account_subreddits
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Note: We are keeping the old columns on `users` table temporarily to prevent hard crashes 
-- while migrating backend logic. They can be dropped later.
