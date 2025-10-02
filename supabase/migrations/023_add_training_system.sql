-- 口腔機能トレーニングシステム - データベースマイグレーション
-- 作成日: 2025-10-02
-- 対象: 既存予約アプリへのトレーニング機能追加

-- =====================================
-- 1. 既存 patients テーブルへのカラム追加
-- =====================================

-- トレーニング機能用の認証情報を追加
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS password_set BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS training_last_login_at TIMESTAMPTZ;

-- インデックス追加（ログイン時の検索性能向上）
CREATE INDEX IF NOT EXISTS idx_patients_training_login
ON patients(clinic_id, patient_number, birth_date)
WHERE is_registered = true;

-- =====================================
-- 2. トレーニングマスタテーブル
-- =====================================

CREATE TABLE trainings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE, -- NULLの場合はグローバルデフォルト
    training_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    animation_storage_path TEXT, -- Supabase Storageのパス（例: "default/aiube.json"）
    mirror_display BOOLEAN DEFAULT false, -- 鏡像表示（左右反転）
    is_default BOOLEAN DEFAULT false, -- デフォルトトレーニングフラグ
    default_action_seconds INTEGER DEFAULT 10, -- デフォルトアクション時間（秒）
    default_rest_seconds INTEGER DEFAULT 5, -- デフォルト休憩時間（秒）
    default_sets INTEGER DEFAULT 1, -- デフォルトセット数
    is_deleted BOOLEAN DEFAULT false, -- 論理削除フラグ
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_trainings_clinic ON trainings(clinic_id) WHERE is_deleted = false;
CREATE INDEX idx_trainings_default ON trainings(is_default) WHERE is_default = true AND is_deleted = false;

-- =====================================
-- 3. 処方メニューテーブル
-- =====================================

CREATE TABLE training_menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    menu_name VARCHAR(255), -- オプション
    prescribed_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_training_menus_patient ON training_menus(patient_id) WHERE is_deleted = false;
CREATE INDEX idx_training_menus_clinic ON training_menus(clinic_id) WHERE is_deleted = false;
CREATE INDEX idx_training_menus_active ON training_menus(patient_id, is_active) WHERE is_deleted = false;

-- =====================================
-- 4. メニューとトレーニングの紐付けテーブル
-- =====================================

CREATE TABLE menu_trainings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_id UUID NOT NULL REFERENCES training_menus(id) ON DELETE CASCADE,
    training_id UUID NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL, -- 実施順序（1, 2, 3...）
    action_seconds INTEGER NOT NULL, -- アクション時間（秒）
    rest_seconds INTEGER NOT NULL, -- 休憩時間（秒）
    sets INTEGER NOT NULL, -- セット数
    auto_progress BOOLEAN DEFAULT false, -- 自動進行フラグ
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_menu_trainings_menu ON menu_trainings(menu_id, sort_order);
CREATE INDEX idx_menu_trainings_training ON menu_trainings(training_id);

-- =====================================
-- 5. トレーニング実施記録テーブル
-- =====================================

CREATE TABLE training_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    training_id UUID NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
    menu_id UUID NOT NULL REFERENCES training_menus(id) ON DELETE CASCADE,
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    completed BOOLEAN DEFAULT false, -- 完了フラグ
    interrupted BOOLEAN DEFAULT false, -- 中断フラグ
    time_of_day VARCHAR(10), -- 実施時間帯（morning/afternoon/evening/night）
    actual_duration_seconds INTEGER, -- 実際にかかった時間
    device_info TEXT, -- 使用デバイス情報
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス（パフォーマンス重視）
CREATE INDEX idx_training_records_patient_date ON training_records(patient_id, performed_at);
CREATE INDEX idx_training_records_clinic_date ON training_records(clinic_id, performed_at);
CREATE INDEX idx_training_records_clinic_training ON training_records(clinic_id, training_id, performed_at);
CREATE INDEX idx_training_records_menu ON training_records(menu_id);

-- =====================================
-- 6. テンプレートテーブル
-- =====================================

CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    template_name VARCHAR(255) NOT NULL,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_templates_clinic ON templates(clinic_id) WHERE is_deleted = false;

-- テンプレート数制限チェック関数
CREATE OR REPLACE FUNCTION check_template_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM templates
        WHERE clinic_id = NEW.clinic_id
        AND is_deleted = false) >= 10 THEN
        RAISE EXCEPTION 'Template limit exceeded: Maximum 10 templates per clinic';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー作成
CREATE TRIGGER enforce_template_limit
BEFORE INSERT ON templates
FOR EACH ROW
EXECUTE FUNCTION check_template_limit();

-- =====================================
-- 7. テンプレートとトレーニングの紐付けテーブル
-- =====================================

CREATE TABLE template_trainings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    training_id UUID NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL,
    action_seconds INTEGER NOT NULL,
    rest_seconds INTEGER NOT NULL,
    sets INTEGER NOT NULL,
    auto_progress BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_template_trainings_template ON template_trainings(template_id, sort_order);

-- =====================================
-- 8. 操作履歴テーブル
-- =====================================

CREATE TABLE operation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    operator_id UUID REFERENCES staff(id), -- 操作者（スタッフ）
    action_type VARCHAR(50) NOT NULL, -- 作成/更新/削除
    target_table VARCHAR(100) NOT NULL, -- 対象テーブル名
    target_record_id UUID NOT NULL, -- 対象レコードID
    before_data JSONB, -- 操作前データ
    after_data JSONB, -- 操作後データ
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_operation_logs_clinic ON operation_logs(clinic_id, created_at DESC);
CREATE INDEX idx_operation_logs_target ON operation_logs(target_table, target_record_id);

-- =====================================
-- 9. デバイス別保存アカウントテーブル
-- =====================================

CREATE TABLE device_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_identifier TEXT NOT NULL, -- デバイス識別子（ローカルストレージキー）
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    last_login_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(device_identifier, patient_id)
);

-- インデックス
CREATE INDEX idx_device_accounts_device ON device_accounts(device_identifier);

-- デバイスごとのアカウント数制限チェック関数
CREATE OR REPLACE FUNCTION check_device_account_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM device_accounts
        WHERE device_identifier = NEW.device_identifier) >= 5 THEN
        RAISE EXCEPTION 'Device account limit exceeded: Maximum 5 accounts per device';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー作成
CREATE TRIGGER enforce_device_account_limit
BEFORE INSERT ON device_accounts
FOR EACH ROW
EXECUTE FUNCTION check_device_account_limit();

-- =====================================
-- 10. RLS (Row Level Security) ポリシー
-- =====================================

-- trainings テーブル
ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;

CREATE POLICY trainings_clinic_access ON trainings
    FOR ALL TO authenticated
    USING (
        clinic_id IS NULL OR -- グローバルデフォルト
        clinic_id = (auth.jwt() ->> 'clinic_id')::uuid
    );

-- training_menus テーブル
ALTER TABLE training_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY training_menus_clinic_access ON training_menus
    FOR ALL TO authenticated
    USING (clinic_id = (auth.jwt() ->> 'clinic_id')::uuid);

CREATE POLICY training_menus_patient_access ON training_menus
    FOR SELECT TO authenticated
    USING (patient_id = (auth.jwt() ->> 'patient_id')::uuid);

-- menu_trainings テーブル
ALTER TABLE menu_trainings ENABLE ROW LEVEL SECURITY;

CREATE POLICY menu_trainings_access ON menu_trainings
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM training_menus tm
            WHERE tm.id = menu_trainings.menu_id
            AND (
                tm.clinic_id = (auth.jwt() ->> 'clinic_id')::uuid OR
                tm.patient_id = (auth.jwt() ->> 'patient_id')::uuid
            )
        )
    );

-- training_records テーブル
ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY training_records_clinic_access ON training_records
    FOR ALL TO authenticated
    USING (clinic_id = (auth.jwt() ->> 'clinic_id')::uuid);

CREATE POLICY training_records_patient_access ON training_records
    FOR SELECT TO authenticated
    USING (patient_id = (auth.jwt() ->> 'patient_id')::uuid);

CREATE POLICY training_records_patient_insert ON training_records
    FOR INSERT TO authenticated
    WITH CHECK (patient_id = (auth.jwt() ->> 'patient_id')::uuid);

-- templates テーブル
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY templates_clinic_access ON templates
    FOR ALL TO authenticated
    USING (clinic_id = (auth.jwt() ->> 'clinic_id')::uuid);

-- template_trainings テーブル
ALTER TABLE template_trainings ENABLE ROW LEVEL SECURITY;

CREATE POLICY template_trainings_access ON template_trainings
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM templates t
            WHERE t.id = template_trainings.template_id
            AND t.clinic_id = (auth.jwt() ->> 'clinic_id')::uuid
        )
    );

-- operation_logs テーブル
ALTER TABLE operation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY operation_logs_clinic_access ON operation_logs
    FOR ALL TO authenticated
    USING (clinic_id = (auth.jwt() ->> 'clinic_id')::uuid);

-- device_accounts テーブル
ALTER TABLE device_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY device_accounts_patient_access ON device_accounts
    FOR ALL TO authenticated
    USING (patient_id = (auth.jwt() ->> 'patient_id')::uuid);

-- =====================================
-- 11. 更新時刻自動更新トリガー
-- =====================================

CREATE TRIGGER update_trainings_updated_at BEFORE UPDATE ON trainings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_menus_updated_at BEFORE UPDATE ON training_menus
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================
-- 12. デフォルトトレーニングデータ投入
-- =====================================

INSERT INTO trainings (
    clinic_id, training_name, description, category,
    animation_storage_path, mirror_display, is_default,
    default_action_seconds, default_rest_seconds, default_sets
) VALUES
-- 1. 『あ』の口の確認
(NULL, '『あ』の口の確認',
'正しい姿勢で力を抜いて口を閉じ、『あ』を声に出しながら口を開ける。口の開ける大きさは人差し指と中指の2本分。下顎をあげない、口を大きく開けすぎない、正中を揃える。',
'基礎訓練', 'default/a-mouth.json', false, true, 10, 5, 10),

-- 2. 舌を前に出す
(NULL, '舌を前に出す',
'姿勢を正しくし、スティックを顔の前に持ち、舌を真っ直ぐ前に出す（3〜5秒間）。スティックを押し倒すように前へ出す。舌尖がつぶれないようにする。',
'舌訓練', 'default/tongue-forward.json', false, true, 5, 5, 10),

-- 3. 舌を左右に振る
(NULL, '舌を左右に振る',
'舌を思いきり前に出し、出した舌を左右に振る。顔、目、顎を動かさない。力を入れすぎない。',
'舌訓練', 'default/tongue-swing.json', false, true, 10, 5, 10),

-- 4. 口唇をなぞる
(NULL, '口唇をなぞる',
'舌を尖らせて口の端（口角）に置き、反対の端（口角）までゆっくり上唇をなぞる。一定の速さで、なめらかに動かす。',
'舌訓練', 'default/lip-trace.json', false, true, 10, 5, 10),

-- 5. スポットの位置確認
(NULL, 'スポットの位置確認',
'口を開け、スティックをスポットに当て押す（5秒間）。スティックを外し、舌尖をスポットに当てる（5秒間）。スポットにつけたまま奥歯を噛み、そのまま口唇も閉じる。',
'舌位置', 'default/spot-check.json', false, true, 5, 5, 10),

-- 6. 吸い上げ
(NULL, '吸い上げ',
'口を開け、舌の先をスポットに付ける。その位置から舌を上あごに吸い上げ、その状態ではじいて『ポン』と音を出す（可能なら唾液を飲み込む）。',
'舌訓練', 'default/suction.json', false, true, 5, 5, 5),

-- 7. 吸い上げができない場合
(NULL, '吸い上げができない場合',
'舌尖をスポットにつけ、その状態を維持しながら舌を後ろに持っていく。下の顎が動かないように、舌だけを動かす。',
'舌訓練', 'default/suction-alternative.json', false, true, 5, 5, 10),

-- 8. 舌筋の訓練
(NULL, '舌筋の訓練',
'舌の先端少し後ろの丸まっているところが当たるようにベロで上に押し付ける。',
'舌訓練', 'default/tongue-muscle.json', false, true, 10, 5, 3),

-- 9. 上唇小帯と下唇小帯を伸ばす
(NULL, '上唇小帯と下唇小帯を伸ばす',
'小帯を挟むように親指を深く入れ、付着部を持ち上げるようにする。',
'柔軟性', 'default/frenulum-stretch.json', false, true, 5, 5, 5),

-- 10. 口唇���緊張除去
(NULL, '口唇の緊張除去',
'上下の唇の内側に空気を入れる。',
'リラックス', 'default/lip-relax.json', false, true, 5, 5, 5),

-- 11. 息吹きかけ
(NULL, '息吹きかけ',
'紙風船やティッシュを使って息を吹きかける練習。',
'呼吸訓練', 'default/breath-blow.json', false, true, 10, 5, 10),

-- 12. 口輪筋訓練（リップルくん）
(NULL, '口輪筋訓練',
'リラックスして座り、奥歯を噛み合わせ唇に沿わせる。唇を閉じて「1、2、3」とカウントし、ホルダーが出ないように引っ張る。',
'筋力訓練', 'default/lip-muscle.json', false, true, 10, 5, 1),

-- 13. あいうべ体操
(NULL, 'あいうべ体操',
'正しい姿勢で力を抜き、口を大きく「あ〜い〜う〜べ〜」と動かす。1日30セット。',
'総合訓練', 'default/aiube.json', false, true, 5, 5, 30),

-- 14. タラ体操
(NULL, 'タラ体操',
'詳細は別途指導します。',
'総合訓練', 'default/tara.json', false, true, 10, 5, 10),

-- 15. ガムトレーニング
(NULL, 'ガムトレーニング',
'ガムを前後・左右で噛む（1分間）。舌の上に丸めたガムを載せ、上の顎にガムを押し付けて広げる。その状態で唾を飲み込む（3回繰り返す）。',
'総合訓練', 'default/gum-training.json', false, true, 60, 5, 10),

-- 16. 下顎を前に出すトレーニング
(NULL, '下顎を前に出すトレーニング',
'イーの口をし、下顎を滑らせ前に移動させて切端の位置で噛む。5秒かけてゆっくり開口（指2本分）、同じ時間かけて閉口。',
'顎訓練', 'default/jaw-forward.json', false, true, 5, 5, 3);

-- =====================================
-- 完了
-- =====================================

-- マイグレーション完了メッセージ
DO $$
BEGIN
    RAISE NOTICE 'Training system migration completed successfully';
    RAISE NOTICE 'Created 9 new tables and added columns to patients table';
    RAISE NOTICE 'Inserted 16 default training exercises';
    RAISE NOTICE 'RLS policies enabled for all training tables';
END $$;
