-- ==============================================================================
-- CLIENT CAMPAIGNS TABLE — Campaign-to-Admin-to-Task Workflow
-- ==============================================================================
--
-- When a brand client creates a campaign, it is stored here with status
-- 'pending_review'. The admin reviews it, can approve/reject, and split
-- approved campaigns into individual tasks in the `tasks` table.
--
-- Run this in Supabase Dashboard → SQL Editor
-- ==============================================================================

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║ 1. CREATE TABLE: client_campaigns                                          ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.client_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('reddit', 'youtube', 'x', 'instagram', 'linkedin', 'quora')),
  task_type TEXT NOT NULL CHECK (task_type IN ('post', 'comment', 'upvote', 'reshare', 'follow')),
  task_count INTEGER NOT NULL CHECK (task_count > 0),
  unit_rate DECIMAL(10,2) NOT NULL CHECK (unit_rate >= 0),
  total_budget DECIMAL(10,2) NOT NULL CHECK (total_budget >= 0),
  target_url TEXT,
  instructions TEXT,
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected', 'partially_approved')),
  admin_notes TEXT,
  tasks_created INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║ 2. INDEXES                                                                  ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

CREATE INDEX IF NOT EXISTS idx_client_campaigns_client_id ON public.client_campaigns(client_id);
CREATE INDEX IF NOT EXISTS idx_client_campaigns_status ON public.client_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_client_campaigns_created_at ON public.client_campaigns(created_at DESC);

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║ 3. ROW LEVEL SECURITY                                                       ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

ALTER TABLE public.client_campaigns ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "admin_full_access_client_campaigns"
  ON public.client_campaigns
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Clients can insert their own campaigns
CREATE POLICY "client_insert_own_campaigns"
  ON public.client_campaigns
  FOR INSERT
  WITH CHECK (client_id = auth.uid());

-- Clients can read their own campaigns
CREATE POLICY "client_read_own_campaigns"
  ON public.client_campaigns
  FOR SELECT
  USING (client_id = auth.uid());

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║ 4. COMMENTS                                                                 ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

COMMENT ON TABLE public.client_campaigns IS 
  'Campaigns submitted by brand clients. Admin reviews and splits into individual tasks.';
COMMENT ON COLUMN public.client_campaigns.status IS 
  'pending_review = awaiting admin, approved = tasks created, rejected = declined by admin';
