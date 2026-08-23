ALTER TABLE public.task_claims
ADD COLUMN IF NOT EXISTS youtube_account_id UUID REFERENCES public.youtube_accounts(id) ON DELETE CASCADE;
