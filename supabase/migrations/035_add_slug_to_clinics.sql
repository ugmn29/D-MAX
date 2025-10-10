-- clinicsテーブルにslugカラムを追加

ALTER TABLE clinics ADD COLUMN IF NOT EXISTS slug TEXT;

-- slugにユニーク制約を追加
ALTER TABLE clinics ADD CONSTRAINT unique_clinic_slug UNIQUE (slug);

-- インデックスを作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_clinics_slug ON clinics(slug);

-- 既存のクリニックにslugを自動生成（例）
UPDATE clinics
SET slug = 'demo-clinic'
WHERE id = '11111111-1111-1111-1111-111111111111'
AND slug IS NULL;

UPDATE clinics
SET slug = 'demo-clinic-2'
WHERE id = '11111111-1111-1111-1111-111111111112'
AND slug IS NULL;

-- コメント
COMMENT ON COLUMN clinics.slug IS 'クリニック専用のURL識別子（例: tanaka-dental）';
