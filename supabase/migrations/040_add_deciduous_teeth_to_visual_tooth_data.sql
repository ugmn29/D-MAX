-- 乳歯番号を追加するために valid_tooth_number 制約を更新
ALTER TABLE visual_tooth_data DROP CONSTRAINT IF EXISTS valid_tooth_number;

ALTER TABLE visual_tooth_data ADD CONSTRAINT valid_tooth_number CHECK (
  tooth_number IN (
    -- 永久歯（Permanent teeth）
    18, 17, 16, 15, 14, 13, 12, 11,
    21, 22, 23, 24, 25, 26, 27, 28,
    48, 47, 46, 45, 44, 43, 42, 41,
    31, 32, 33, 34, 35, 36, 37, 38,
    -- 乳歯（Deciduous teeth）- FDI方式
    55, 54, 53, 52, 51,  -- 上顎右
    61, 62, 63, 64, 65,  -- 上顎左
    85, 84, 83, 82, 81,  -- 下顎左
    71, 72, 73, 74, 75   -- 下顎右
  )
);
