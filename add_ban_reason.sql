-- Add ban_reason column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ban_reason TEXT;
