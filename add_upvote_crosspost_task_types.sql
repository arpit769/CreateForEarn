-- =========================================================
-- RUN THIS IN YOUR SUPABASE SQL EDITOR
-- =========================================================

-- Add 'upvote' and 'crosspost' to task_type_enum
ALTER TYPE task_type_enum ADD VALUE IF NOT EXISTS 'upvote';
ALTER TYPE task_type_enum ADD VALUE IF NOT EXISTS 'crosspost';
