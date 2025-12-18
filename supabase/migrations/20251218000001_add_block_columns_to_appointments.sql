-- ブロック機能用のカラムをappointmentsテーブルに追加
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_block BOOLEAN DEFAULT false;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS block_color TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS block_text TEXT;

-- コメント追加
COMMENT ON COLUMN appointments.is_block IS 'ブロック枠かどうか（true=ブロック、false=通常予約）';
COMMENT ON COLUMN appointments.block_color IS 'ブロックの色（red, yellow, black, blue, green）';
COMMENT ON COLUMN appointments.block_text IS 'ブロックに表示するテキスト';
