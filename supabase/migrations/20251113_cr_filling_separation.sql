-- CR充填を形成料・充填料・材料代の3つに分離
-- Based on 厚生局　歯科保険点数.pdf Page 68-74

-- ===================================================
-- 1. 形成料（窩洞形成）
-- M001-3 窩洞形成
-- ===================================================

-- 既存のレコードを削除（重複を防ぐ）
DELETE FROM treatment_codes WHERE code IN ('140000310', '140000410');

-- M001-3 窩洞形成（単純なもの）
INSERT INTO treatment_codes (
  code,
  name,
  category,
  points,
  inclusion_rules,
  exclusion_rules,
  frequency_limits,
  effective_from,
  requires_documents,
  metadata
) VALUES (
  '140000310', -- M001-3-イ
  '窩洞形成（単純なもの）',
  '歯冠修復',
  60,
  '[]'::jsonb,
  '{
    "same_day": [],
    "same_month": [],
    "simultaneous": [],
    "same_site": [],
    "same_week": []
  }'::jsonb,
  '[]'::jsonb,
  '2025-01-01',
  '[]'::jsonb,
  '{
    "pdf_reference": "Page 68, M001-3-イ",
    "notes": "麻酔、薬剤等の費用及び保険医療材料料は所定点数に含まれる",
    "section": "第12部 歯冠修復及び欠損補綴",
    "sub_category": "形成料"
  }'::jsonb
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  points = EXCLUDED.points,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- M001-3 窩洞形成（複雑なもの）
INSERT INTO treatment_codes (
  code,
  name,
  category,
  points,
  inclusion_rules,
  exclusion_rules,
  frequency_limits,
  effective_from,
  requires_documents,
  metadata
) VALUES (
  '140000410', -- M001-3-ロ
  '窩洞形成（複雑なもの）',
  '歯冠修復',
  86,
  '[]'::jsonb,
  '{
    "same_day": [],
    "same_month": [],
    "simultaneous": [],
    "same_site": [],
    "same_week": []
  }'::jsonb,
  '[]'::jsonb,
  '2025-01-01',
  '[]'::jsonb,
  '{
    "pdf_reference": "Page 68, M001-3-ロ",
    "notes": "麻酔、薬剤等の費用及び保険医療材料料は所定点数に含まれる",
    "section": "第12部 歯冠修復及び欠損補綴",
    "sub_category": "形成料"
  }'::jsonb
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  points = EXCLUDED.points,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ===================================================
-- 2. 充填料
-- M009 充填
-- ===================================================

-- 既存のレコードを削除（重複を防ぐ）
DELETE FROM treatment_codes WHERE code IN ('140009110', '140009210', '140009310', '140009410');

-- M009 充填１（単純なもの）
INSERT INTO treatment_codes (
  code,
  name,
  category,
  points,
  inclusion_rules,
  exclusion_rules,
  frequency_limits,
  effective_from,
  requires_documents,
  metadata
) VALUES (
  '140009110', -- M009-1-イ
  '充填１（単純なもの）',
  '歯冠修復',
  106,
  '[]'::jsonb,
  '{
    "same_day": [],
    "same_month": [],
    "simultaneous": [],
    "same_site": [],
    "same_week": []
  }'::jsonb,
  '[]'::jsonb,
  '2025-01-01',
  '[]'::jsonb,
  '{
    "pdf_reference": "Page 71, M009-1-イ",
    "notes": "歯質に対する接着性を付与又は向上させるために歯面処理を行う場合。歯面処理に係る費用は所定点数に含まれる",
    "section": "第12部 歯冠修復及び欠損補綴",
    "sub_category": "充填料",
    "material_type": "CR充填（歯面処理あり）"
  }'::jsonb
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  points = EXCLUDED.points,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- M009 充填１（複雑なもの）
INSERT INTO treatment_codes (
  code,
  name,
  category,
  points,
  inclusion_rules,
  exclusion_rules,
  frequency_limits,
  effective_from,
  requires_documents,
  metadata
) VALUES (
  '140009210', -- M009-1-ロ
  '充填１（複雑なもの）',
  '歯冠修復',
  158,
  '[]'::jsonb,
  '{
    "same_day": [],
    "same_month": [],
    "simultaneous": [],
    "same_site": [],
    "same_week": []
  }'::jsonb,
  '[]'::jsonb,
  '2025-01-01',
  '[]'::jsonb,
  '{
    "pdf_reference": "Page 71, M009-1-ロ",
    "notes": "歯質に対する接着性を付与又は向上させるために歯面処理を行う場合。歯面処理に係る費用は所定点数に含まれる",
    "section": "第12部 歯冠修復及び欠損補綴",
    "sub_category": "充填料",
    "material_type": "CR充填（歯面処理あり）"
  }'::jsonb
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  points = EXCLUDED.points,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- M009 充填２（単純なもの）
INSERT INTO treatment_codes (
  code,
  name,
  category,
  points,
  inclusion_rules,
  exclusion_rules,
  frequency_limits,
  effective_from,
  requires_documents,
  metadata
) VALUES (
  '140009310', -- M009-2-イ
  '充填２（単純なもの）',
  '歯冠修復',
  59,
  '[]'::jsonb,
  '{
    "same_day": [],
    "same_month": [],
    "simultaneous": [],
    "same_site": [],
    "same_week": []
  }'::jsonb,
  '[]'::jsonb,
  '2025-01-01',
  '[]'::jsonb,
  '{
    "pdf_reference": "Page 71, M009-2-イ",
    "notes": "充填１以外（歯面処理を行わない場合）",
    "section": "第12部 歯冠修復及び欠損補綴",
    "sub_category": "充填料",
    "material_type": "充填（歯面処理なし）"
  }'::jsonb
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  points = EXCLUDED.points,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- M009 充填２（複雑なもの）
INSERT INTO treatment_codes (
  code,
  name,
  category,
  points,
  inclusion_rules,
  exclusion_rules,
  frequency_limits,
  effective_from,
  requires_documents,
  metadata
) VALUES (
  '140009410', -- M009-2-ロ
  '充填２（複雑なもの）',
  '歯冠修復',
  107,
  '[]'::jsonb,
  '{
    "same_day": [],
    "same_month": [],
    "simultaneous": [],
    "same_site": [],
    "same_week": []
  }'::jsonb,
  '[]'::jsonb,
  '2025-01-01',
  '[]'::jsonb,
  '{
    "pdf_reference": "Page 71, M009-2-ロ",
    "notes": "充填１以外（歯面処理を行わない場合）",
    "section": "第12部 歯冠修復及び欠損補綴",
    "sub_category": "充填料",
    "material_type": "充填（歯面処理なし）"
  }'::jsonb
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  points = EXCLUDED.points,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ===================================================
-- 3. う蝕歯即時充填形成（形成と充填が一体）
-- M001-2
-- ===================================================

DELETE FROM treatment_codes WHERE code = '140000210';

INSERT INTO treatment_codes (
  code,
  name,
  category,
  points,
  inclusion_rules,
  exclusion_rules,
  frequency_limits,
  effective_from,
  requires_documents,
  metadata
) VALUES (
  '140000210', -- M001-2
  'う蝕歯即時充填形成',
  '歯冠修復',
  128,
  '[]'::jsonb,
  '{
    "same_day": [],
    "same_month": [],
    "simultaneous": [],
    "same_site": [],
    "same_week": []
  }'::jsonb,
  '[]'::jsonb,
  '2025-01-01',
  '[]'::jsonb,
  '{
    "pdf_reference": "Page 69, M001-2",
    "notes": "麻酔、歯髄保護処置、特定薬剤、窩洞形成等の費用は所定点数に含まれる",
    "section": "第12部 歯冠修復及び欠損補綴",
    "sub_category": "形成・充填一体",
    "includes": ["麻酔", "歯髄保護処置", "窩洞形成", "充填"]
  }'::jsonb
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  points = EXCLUDED.points,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ===================================================
-- 4. 材料代（特定保険医療材料）
-- M100 - 別途設定が必要
-- ===================================================

-- 材料代はM100として別コードで管理
-- 実際の材料価格は「別に厚生労働大臣が定める」ため、
-- 実装時には材料マスタテーブルを参照する必要がある

COMMENT ON COLUMN treatment_codes.metadata IS 'メタデータ: pdf_reference, notes, section, sub_category, material_type等を格納';

-- ===================================================
-- 5. 既存の古いCR充填コードの更新
-- ===================================================

-- 古いコードがあれば、新しいコードへの参照を追加
UPDATE treatment_codes
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{replaced_by}',
  '["140000310", "140009110"]'::jsonb
)
WHERE name LIKE '%CR充填%'
  AND code NOT IN ('140000310', '140000410', '140009110', '140009210', '140009310', '140009410', '140000210');

-- ===================================================
-- 6. 検証クエリ
-- ===================================================

-- 確認用: 新しく追加されたCR充填関連のレコード
DO $$
BEGIN
  RAISE NOTICE '=== CR充填関連の処置コード ===';
  RAISE NOTICE '形成料:';
  RAISE NOTICE '  140000310: 窩洞形成（単純） - 60点';
  RAISE NOTICE '  140000410: 窩洞形成（複雑） - 86点';
  RAISE NOTICE '';
  RAISE NOTICE '充填料:';
  RAISE NOTICE '  140009110: 充填１（単純） - 106点';
  RAISE NOTICE '  140009210: 充填１（複雑） - 158点';
  RAISE NOTICE '  140009310: 充填２（単純） - 59点';
  RAISE NOTICE '  140009410: 充填２（複雑） - 107点';
  RAISE NOTICE '';
  RAISE NOTICE '形成・充填一体:';
  RAISE NOTICE '  140000210: う蝕歯即時充填形成 - 128点';
  RAISE NOTICE '';
  RAISE NOTICE '※材料代は別途M100として管理';
END $$;
