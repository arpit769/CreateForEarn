-- ==============================================================================
-- MIGRATION: Per-Platform Sequential Task IDs
-- ==============================================================================
-- PURPOSE:
-- 1. Optimizes querying and ordering of task_seq_id per platform.
-- 2. Reddit retains its existing sequence (5762+).
-- 3. Every other platform (X, YouTube, LinkedIn, Instagram, Facebook, Quora, etc.)
--    has its own independent sequence starting from 1, 2, 3...
-- ==============================================================================

-- Create composite index on (platform, task_seq_id) for instantaneous sequence lookup
CREATE INDEX IF NOT EXISTS idx_tasks_platform_task_seq_id 
ON public.tasks(platform, task_seq_id DESC NULLS LAST);
