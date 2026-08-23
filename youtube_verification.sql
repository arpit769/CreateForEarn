-- Run this in your Supabase SQL Editor!

-- 1. Create youtube_accounts table
CREATE TABLE IF NOT EXISTS public.youtube_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  channel_name TEXT NOT NULL,
  email_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_approval', -- 'pending_approval', 'verified', 'rejected', 'banned'
  rejection_reason TEXT,
  ban_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a channel email/name pair is somewhat unique (or at least the email)
  CONSTRAINT unique_youtube_email UNIQUE (email_id)
);

-- 2. Add active_youtube_account_id to users
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS active_youtube_account_id UUID REFERENCES public.youtube_accounts(id) ON DELETE SET NULL;

-- 3. Enable RLS on youtube_accounts
ALTER TABLE public.youtube_accounts ENABLE ROW LEVEL SECURITY;

-- 4. Policies for youtube_accounts
-- Users can see their own accounts
CREATE POLICY "Users can view their own youtube accounts"
  ON public.youtube_accounts FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all accounts
CREATE POLICY "Admins can view all youtube accounts"
  ON public.youtube_accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Users can insert their own accounts
CREATE POLICY "Users can insert their own youtube accounts"
  ON public.youtube_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own accounts
CREATE POLICY "Users can delete their own youtube accounts"
  ON public.youtube_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can update any account (for approval, banning)
CREATE POLICY "Admins can update youtube accounts"
  ON public.youtube_accounts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );
