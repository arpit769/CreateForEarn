-- Run this in your Supabase Dashboard -> SQL Editor
-- This adds an auto-incrementing serial number column to the tasks table
-- to give every task a unique short ID (like #1, #2, #3, etc.)

ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS task_seq_id SERIAL;
