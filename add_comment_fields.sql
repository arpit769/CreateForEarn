-- Add post_link field for comment tasks
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS post_link TEXT;
