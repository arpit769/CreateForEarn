-- Add missing values to content_mode_enum
ALTER TYPE content_mode_enum ADD VALUE IF NOT EXISTS 'image';
ALTER TYPE content_mode_enum ADD VALUE IF NOT EXISTS 'video';
ALTER TYPE content_mode_enum ADD VALUE IF NOT EXISTS 'text';
ALTER TYPE content_mode_enum ADD VALUE IF NOT EXISTS 'provided';
ALTER TYPE content_mode_enum ADD VALUE IF NOT EXISTS 'custom';
