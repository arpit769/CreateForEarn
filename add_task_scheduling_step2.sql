-- ============================================
-- TASK SCHEDULING MIGRATION - STEP 2 of 2
-- Run this AFTER Step 1 has been executed
-- ============================================

-- Create index for efficient lookup of scheduled tasks
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled 
ON tasks (status, scheduled_for) 
WHERE status = 'scheduled';

-- Comment for documentation
COMMENT ON COLUMN tasks.scheduled_for IS 'Optional future timestamp. Task remains hidden (status=scheduled) until this time.';
