-- スタッフデータの確認
SELECT
  s.id,
  s.name,
  s.name_kana,
  s.clinic_id,
  sp.name as position_name,
  s.role,
  s.is_active,
  s.created_at
FROM staff s
LEFT JOIN staff_positions sp ON s.position_id = sp.id
ORDER BY s.created_at ASC;

-- 役職データの確認
SELECT
  id,
  name,
  clinic_id,
  sort_order,
  created_at
FROM staff_positions
ORDER BY sort_order ASC;
