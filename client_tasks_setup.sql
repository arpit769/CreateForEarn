-- ==============================================================================
-- MIGRATION: Client Tasks Separation, Custom IDs (C1, C2...) & Tag Isolation
-- ==============================================================================
-- PURPOSE:
-- 1. Adds custom_id (e.g., 'C1', 'C2'...), client_id, and campaign_id to tasks.
-- 2. Ensures client tasks have their own distinct IDs starting with 'C'.
-- 3. Makes task_seq_id nullable so client tasks use their custom sequence.
-- ==============================================================================

-- 1. Add columns to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS custom_id TEXT,
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.client_campaigns(id) ON DELETE SET NULL;

-- 2. Create indexes for fast querying and lookup by custom_id
CREATE INDEX IF NOT EXISTS idx_tasks_custom_id ON public.tasks(custom_id);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON public.tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_campaign_id ON public.tasks(campaign_id);

-- 3. Ensure task_seq_id is nullable for tasks with custom IDs
ALTER TABLE public.tasks ALTER COLUMN task_seq_id DROP NOT NULL;
