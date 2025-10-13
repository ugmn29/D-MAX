-- PC（プラークコントロール）を4部位（上・右・下・左）に対応

-- 既存のplaque_presentカラムを削除し、4部位のカラムを追加
ALTER TABLE periodontal_tooth_data
  DROP COLUMN IF EXISTS plaque_present,
  ADD COLUMN plaque_top BOOLEAN DEFAULT FALSE,
  ADD COLUMN plaque_right BOOLEAN DEFAULT FALSE,
  ADD COLUMN plaque_bottom BOOLEAN DEFAULT FALSE,
  ADD COLUMN plaque_left BOOLEAN DEFAULT FALSE;

-- コメント追加
COMMENT ON COLUMN periodontal_tooth_data.plaque_top IS 'プラーク 上部';
COMMENT ON COLUMN periodontal_tooth_data.plaque_right IS 'プラーク 右側';
COMMENT ON COLUMN periodontal_tooth_data.plaque_bottom IS 'プラーク 下部';
COMMENT ON COLUMN periodontal_tooth_data.plaque_left IS 'プラーク 左側';
