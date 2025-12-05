-- Add rich menu ID columns to clinic_settings
ALTER TABLE clinic_settings
ADD COLUMN IF NOT EXISTS line_registered_rich_menu_id TEXT,
ADD COLUMN IF NOT EXISTS line_unregistered_rich_menu_id TEXT;

-- Add comments
COMMENT ON COLUMN clinic_settings.line_registered_rich_menu_id IS 'Rich menu ID for registered users';
COMMENT ON COLUMN clinic_settings.line_unregistered_rich_menu_id IS 'Rich menu ID for unregistered users';
