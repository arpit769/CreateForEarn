-- System Settings Table for Platform Configuration (e.g., Maintenance Mode)
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read system settings (needed to check maintenance mode status)
CREATE POLICY "Allow authenticated read system_settings"
    ON public.system_settings
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow anon users to read system settings (if needed for landing page)
CREATE POLICY "Allow anon read system_settings"
    ON public.system_settings
    FOR SELECT
    TO anon
    USING (true);

-- Only admins can insert/update/delete system settings
CREATE POLICY "Allow admin full access to system_settings"
    ON public.system_settings
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Seed default maintenance mode record
INSERT INTO public.system_settings (key, value)
VALUES (
    'maintenance_mode',
    '{"enabled": false, "message": "We are currently performing scheduled maintenance and updates to improve your experience. Worker tasks and submissions are temporarily paused. We will be back online shortly!", "estimatedEndTime": null}'::jsonb
)
ON CONFLICT (key) DO NOTHING;
