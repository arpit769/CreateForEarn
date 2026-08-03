-- Run this in the Supabase SQL Editor to support the Rejection Flow!

-- 1. Add 'rejected' to the user_status ENUM
ALTER TYPE user_status ADD VALUE IF NOT EXISTS 'rejected';

-- 2. Add a new column to store the rejection reason
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
