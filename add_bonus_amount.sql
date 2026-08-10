-- Run this in your Supabase Dashboard -> SQL Editor
-- This adds a bonus_amount column to the task_claims table to support admin-granted bonuses on task approval.

ALTER TABLE public.task_claims 
ADD COLUMN IF NOT EXISTS bonus_amount NUMERIC DEFAULT 0.00;
