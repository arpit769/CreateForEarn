-- Migration: Add rejection_reason column to withdrawals table
-- Run this in your Supabase SQL Editor

ALTER TABLE public.withdrawals 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
