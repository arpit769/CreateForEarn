-- Add task_category column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS task_category TEXT DEFAULT 'standard';
