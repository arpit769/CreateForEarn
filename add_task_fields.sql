-- Add new fields to the tasks table for task creation
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS flair TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT;
