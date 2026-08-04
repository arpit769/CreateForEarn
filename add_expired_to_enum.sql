-- SQL migration to add 'expired' to the claim_status enum.
-- Copy and run this in your Supabase SQL Editor.

ALTER TYPE public.claim_status ADD VALUE IF NOT EXISTS 'expired';
