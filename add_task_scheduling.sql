-- ============================================
-- TASK SCHEDULING MIGRATION - STEP 1 of 2
-- Run this FIRST, then run Step 2 separately
-- ============================================

-- Add 'scheduled' to the task_status enum
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'scheduled';

-- Add scheduled_for column to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ DEFAULT NULL;
