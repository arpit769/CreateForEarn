-- Migration: Add 'client' role to user_role enum
-- Run this in your Supabase Dashboard -> SQL Editor

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'client';
