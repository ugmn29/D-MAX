-- 口腔機能発達不全症評価システム
-- 習慣チェック表の回答から自動的にC分類を評価

-- 1. 口腔機能発達不全症評価結果テーブル
CREATE TABLE IF NOT EXISTS oral_function_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  assessment_type TEXT NOT NULL DEFAULT '離乳完了後', -- 離乳前/離乳開始後/離乳完了後

  -- C分類17項目の評価結果
  c1_result BOOLEAN, -- 歯の欠損がある
  c1_source TEXT,    -- 評価根拠（'staff'=スタッフ評価, 'questionnaire'=問診票から自動判定）
  c1_notes TEXT,     -- 備考

  c2_result BOOLEAN, -- 口唇・口蓋裂等がある
  c2_source TEXT,
  c2_notes TEXT,

  c3_result BOOLEAN, -- 舌小帯、上唇小帯に異常がある
  c3_source TEXT,
  c3_notes TEXT,

  c4_result BOOLEAN, -- 口唇閉鎖不全がある
  c4_source TEXT,
  c4_notes TEXT,

  c5_result BOOLEAN, -- 食べこぼしがある
  c5_source TEXT,
  c5_notes TEXT,

  c6_result BOOLEAN, -- 口腔習癖がある
  c6_source TEXT,
  c6_notes TEXT,

  c7_result BOOLEAN, -- 歯の萌出に遅れがある
  c7_source TEXT,
  c7_notes TEXT,

  c8_result BOOLEAN, -- 咀嚼に時間がかかる・咀嚼ができない
  c8_source TEXT,
  c8_notes TEXT,

  c9_result BOOLEAN, -- 咬み合わせに異常がある
  c9_source TEXT,
  c9_notes TEXT,

  c10_result BOOLEAN, -- 鼻呼吸の障害がある
  c10_source TEXT,
  c10_notes TEXT,

  c11_result BOOLEAN, -- 口で呼吸する癖がある
  c11_source TEXT,
  c11_notes TEXT,

  c12_result BOOLEAN, -- 咀嚼時、舌の動きに問題がある
  c12_source TEXT,
  c12_notes TEXT,

  c13_result BOOLEAN, -- 身長、体重の増加に問題がある
  c13_source TEXT,
  c13_notes TEXT,

  c14_result BOOLEAN, -- 食べ方が遅い
  c14_source TEXT,
  c14_notes TEXT,

  c15_result BOOLEAN, -- 偏食がある
  c15_source TEXT,
  c15_notes TEXT,

  c16_result BOOLEAN, -- 睡眠時のいびきがある
  c16_source TEXT,
  c16_notes TEXT,

  c17_result BOOLEAN, -- その他の症状
  c17_source TEXT,
  c17_notes TEXT,

  -- メタデータ
  questionnaire_response_id UUID REFERENCES questionnaire_responses(id),
  evaluated_by_staff_id UUID REFERENCES staff(id),
  confirmed_at TIMESTAMP WITH TIME ZONE, -- スタッフが確認した日時
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_oral_function_assessments_patient ON oral_function_assessments(patient_id);
CREATE INDEX idx_oral_function_assessments_date ON oral_function_assessments(assessment_date);
CREATE INDEX idx_oral_function_assessments_response ON oral_function_assessments(questionnaire_response_id);

-- 2. 問診票質問とC分類の紐付けマッピングテーブル
CREATE TABLE IF NOT EXISTS c_classification_question_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  c_classification_item TEXT NOT NULL, -- 'C-4', 'C-5'など
  section_name TEXT NOT NULL,          -- '睡眠中', '食生活'など
  question_text TEXT NOT NULL,         -- 質問文
  matching_condition JSONB,            -- どの選択肢が該当するか {"operator": "contains", "value": "該当する"}
  priority INTEGER DEFAULT 1,          -- 優先度（同じC分類に複数の質問がある場合）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_c_classification_mapping_item ON c_classification_question_mapping(c_classification_item);

-- 3. C分類マッピングデータの挿入

-- C-4: 口唇閉鎖不全がある
INSERT INTO c_classification_question_mapping (c_classification_item, section_name, question_text, matching_condition) VALUES
('C-4', '睡眠中', '口が開いている', '{"operator": "contains", "value": "該当する"}'::jsonb),
('C-4', '口唇', '日中開いていることが多い', '{"operator": "has_any_value", "value": null}'::jsonb);

-- C-5: 食べこぼしがある
INSERT INTO c_classification_question_mapping (c_classification_item, section_name, question_text, matching_condition) VALUES
('C-5', '食生活', '食べながらよくこぼす', '{"operator": "contains", "value": "該当する"}'::jsonb),
('C-5', '食生活', '食べ物のかすが口唇の両端にたまる', '{"operator": "contains", "value": "該当する"}'::jsonb);

-- C-6: 口腔習癖がある
INSERT INTO c_classification_question_mapping (c_classification_item, section_name, question_text, matching_condition) VALUES
('C-6', '舌', '舌の先をまるめる', '{"operator": "has_any_value", "value": null}'::jsonb),
('C-6', '舌', 'かむ', '{"operator": "contains", "value": "該当する"}'::jsonb),
('C-6', '舌', 'もてあそぶ', '{"operator": "has_any_value", "value": null}'::jsonb),
('C-6', '舌', '舌で前歯を', '{"operator": "has_any_value", "value": null}'::jsonb),
('C-6', '舌', '舌を出す', '{"operator": "has_any_value", "value": null}'::jsonb),
('C-6', '口唇', '吸う', '{"operator": "contains", "value": "該当する"}'::jsonb),
('C-6', '口唇', 'かむ', '{"operator": "has_any_value", "value": null}'::jsonb),
('C-6', '口唇', '前方へ突き出す', '{"operator": "contains", "value": "該当する"}'::jsonb),
('C-6', '口唇', '内側にまき込む', '{"operator": "has_any_value", "value": null}'::jsonb),
('C-6', '口唇', 'なめる', '{"operator": "has_any_value", "value": null}'::jsonb),
('C-6', '口唇', 'すぼめる', '{"operator": "contains", "value": "該当する"}'::jsonb),
('C-6', 'その他の癖', '指しゃぶり（歳～歳頃）', '{"operator": "is_not_empty", "value": null}'::jsonb),
('C-6', 'その他の癖', 'おしゃぶり（歳～歳頃）', '{"operator": "is_not_empty", "value": null}'::jsonb),
('C-6', 'その他の癖', '爪かみ', '{"operator": "is_not_empty", "value": null}'::jsonb),
('C-6', 'その他の癖', 'エンピツをかむ（歳～歳頃）', '{"operator": "is_not_empty", "value": null}'::jsonb),
('C-6', 'その他の癖', 'タオルを', '{"operator": "is_not_empty", "value": null}'::jsonb),
('C-6', 'その他の癖', '哺乳瓶長期使用（歳 ヵ月頃まで）', '{"operator": "is_not_empty", "value": null}'::jsonb),
('C-6', 'その他の癖', '歯ぎしり（歳～歳頃）', '{"operator": "is_not_empty", "value": null}'::jsonb),
('C-6', 'その他の癖', '異常嚥下癖', '{"operator": "contains", "value": "該当する"}'::jsonb),
('C-6', 'その他の癖', '頬づえ', '{"operator": "contains", "value": "該当する"}'::jsonb);

-- C-8: 咀嚼に時間がかかる・咀嚼ができない
INSERT INTO c_classification_question_mapping (c_classification_item, section_name, question_text, matching_condition) VALUES
('C-8', '食生活', '食べ物がいつまでも口の中に残っている', '{"operator": "contains", "value": "該当する"}'::jsonb),
('C-8', '食生活', 'かむ回数が少ないと思う', '{"operator": "contains", "value": "該当する"}'::jsonb),
('C-8', '食生活', '奥歯であまりかまない', '{"operator": "contains", "value": "該当する"}'::jsonb),
('C-8', '食生活', '前歯をあまり使わない', '{"operator": "contains", "value": "該当する"}'::jsonb),
('C-8', '食生活', '一度でなかなか飲み込めない', '{"operator": "has_any_value", "value": null}'::jsonb);

-- C-10: 鼻呼吸の障害がある
INSERT INTO c_classification_question_mapping (c_classification_item, section_name, question_text, matching_condition) VALUES
('C-10', '鼻に関するもの', '花粉症', '{"operator": "contains", "value": "該当する"}'::jsonb),
('C-10', '鼻に関するもの', '蓄膿症', '{"operator": "contains", "value": "該当する"}'::jsonb),
('C-10', '鼻に関するもの', '鼻中隔湾曲症', '{"operator": "contains", "value": "該当する"}'::jsonb),
('C-10', '鼻に関するもの', 'アレルギー性鼻炎', '{"operator": "contains", "value": "該当する"}'::jsonb),
('C-10', '鼻に関するもの', '鼻をクンクン鳴らす', '{"operator": "contains", "value": "該当する"}'::jsonb),
('C-10', '鼻に関するもの', '鼻かみがへただ', '{"operator": "contains", "value": "該当する"}'::jsonb),
('C-10', '喉に関するもの', '扁桃腺肥大', '{"operator": "contains", "value": "該当する"}'::jsonb),
('C-10', '喉に関するもの', 'アデノイド肥大', '{"operator": "contains", "value": "該当する"}'::jsonb);

-- C-11: 口で呼吸する癖がある
INSERT INTO c_classification_question_mapping (c_classification_item, section_name, question_text, matching_condition) VALUES
('C-11', '睡眠中', '口が開いている', '{"operator": "contains", "value": "該当する"}'::jsonb),
('C-11', '口唇', '日中開いていることが多い', '{"operator": "has_any_value", "value": null}'::jsonb);

-- C-14: 食べ方が遅い
INSERT INTO c_classification_question_mapping (c_classification_item, section_name, question_text, matching_condition) VALUES
('C-14', '食生活', '食べ物がいつまでも口の中に残っている', '{"operator": "contains", "value": "該当する"}'::jsonb),
('C-14', '食生活', '一度でなかなか飲み込めない', '{"operator": "has_any_value", "value": null}'::jsonb);

-- C-16: 睡眠時のいびきがある
INSERT INTO c_classification_question_mapping (c_classification_item, section_name, question_text, matching_condition) VALUES
('C-16', '睡眠中', 'いびきがある', '{"operator": "contains", "value": "該当する"}'::jsonb);

-- C-17: その他の症状（姿勢、耳、喉、その他の病気など）
INSERT INTO c_classification_question_mapping (c_classification_item, section_name, question_text, matching_condition) VALUES
('C-17', '姿勢', '自分で姿勢が悪いと思う', '{"operator": "has_any_value", "value": null}'::jsonb),
('C-17', '姿勢', '頬づえをよくつく', '{"operator": "has_any_value", "value": null}'::jsonb),
('C-17', '姿勢', 'いつもアゴがあがっている', '{"operator": "contains", "value": "該当する"}'::jsonb),
('C-17', '耳に関するもの', '急性中耳炎', '{"operator": "contains", "value": "該当する"}'::jsonb),
('C-17', '耳に関するもの', '滲出性中耳炎', '{"operator": "contains", "value": "該当する"}'::jsonb),
('C-17', '喉に関するもの', '喘息気管支炎', '{"operator": "contains", "value": "該当する"}'::jsonb),
('C-17', '喉に関するもの', 'タンがからむ', '{"operator": "contains", "value": "該当する"}'::jsonb),
('C-17', '喉に関するもの', '風邪をひくとよく熱を出す', '{"operator": "contains", "value": "該当する"}'::jsonb),
('C-17', 'その他', '股関節脱臼', '{"operator": "contains", "value": "該当する"}'::jsonb),
('C-17', 'その他', '骨形成不全', '{"operator": "contains", "value": "該当する"}'::jsonb),
('C-17', 'その他', '骨折', '{"operator": "contains", "value": "該当する"}'::jsonb),
('C-17', 'その他', '顎関節症', '{"operator": "contains", "value": "該当する"}'::jsonb),
('C-17', 'その他', 'アキレス腱切断', '{"operator": "contains", "value": "該当する"}'::jsonb),
('C-17', 'その他', '自家中毒', '{"operator": "contains", "value": "該当する"}'::jsonb),
('C-17', 'その他', 'チック症', '{"operator": "contains", "value": "該当する"}'::jsonb);

-- RLS無効化（開発用）
ALTER TABLE oral_function_assessments DISABLE ROW LEVEL SECURITY;
ALTER TABLE c_classification_question_mapping DISABLE ROW LEVEL SECURITY;

-- updated_atトリガー
CREATE TRIGGER update_oral_function_assessments_updated_at
  BEFORE UPDATE ON oral_function_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE oral_function_assessments IS '口腔機能発達不全症評価結果を保存';
COMMENT ON TABLE c_classification_question_mapping IS '問診票質問とC分類項目の紐付けマッピング';
