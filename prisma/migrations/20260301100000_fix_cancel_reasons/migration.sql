-- system_cancel_reasons を4件に更新
DELETE FROM system_cancel_reasons;

INSERT INTO system_cancel_reasons (name, description, sort_order, is_active) VALUES
  ('無断キャンセル', '連絡なしのキャンセル', 1, true),
  ('当日事前連絡', '当日に連絡があったキャンセル', 2, true),
  ('前日事前連絡', '前日以前に連絡があったキャンセル', 3, true),
  ('医院都合', '医院側の都合によるキャンセル', 4, true);
