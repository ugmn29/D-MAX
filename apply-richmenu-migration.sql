-- Apply rich menu migration to production database
-- Execute this in Supabase SQL Editor: https://supabase.com/dashboard/project/obdfmwpdkwraqqqyjgwu/sql

-- Add rich menu ID columns to clinic_settings
ALTER TABLE clinic_settings
ADD COLUMN IF NOT EXISTS line_registered_rich_menu_id TEXT,
ADD COLUMN IF NOT EXISTS line_unregistered_rich_menu_id TEXT;

-- Add comments
COMMENT ON COLUMN clinic_settings.line_registered_rich_menu_id IS 'Rich menu ID for registered users';
COMMENT ON COLUMN clinic_settings.line_unregistered_rich_menu_id IS 'Rich menu ID for unregistered users';

-- Record this migration in the migration history
INSERT INTO supabase_migrations.schema_migrations (version, statements, name)
VALUES (
  '20251205132347',
  ARRAY['ALTER TABLE clinic_settings ADD COLUMN IF NOT EXISTS line_registered_rich_menu_id TEXT, ADD COLUMN IF NOT EXISTS line_unregistered_rich_menu_id TEXT'],
  'add_richmenu_ids_to_notification_settings'
)
ON CONFLICT (version) DO NOTHING;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'clinic_settings'
  AND column_name LIKE '%rich_menu%'
ORDER BY column_name;
