# 本番環境マイグレーション適用ガイド

## 方法1: Supabase SQL Editorから適用（推奨）

### ステップ1: Supabaseダッシュボードにアクセス

1. https://supabase.com/dashboard にアクセス
2. プロジェクト `obdfmwpdkwraqqqyjgwu` を選択
3. 左サイドバーから **SQL Editor** をクリック

### ステップ2: 主要なマイグレーションを順番に実行

以下のマイグレーションファイルを **順番に** SQL Editorで実行してください：

#### 必須マイグレーション（この順番で実行）:

1. `001_initial_schema.sql` - 初期スキーマ作成
2. `20240101000000_initial_setup.sql` - 初期セットアップ
3. `014_create_minimal_tables.sql` - 最小限のテーブル作成
4. `004_create_shift_tables.sql` - シフトテーブル作成
5. `005_create_individual_holidays.sql` - 個別休日テーブル
6. `015_add_patient_note_types.sql` - 患者ノートタイプ追加
7. `016_add_cancel_reasons.sql` - キャンセル理由追加
8. `017_create_questionnaire_tables.sql` - 質問票テーブル作成
9. `020_create_subkarte_tables.sql` - サブカルテテーブル作成
10. `021_create_analytics_tables.sql` - アナリティクステーブル作成
11. `026_create_notification_system.sql` - 通知システム作成 ⚠️ **重要**
12. `20250128_line_integration.sql` - LINE連携 ⚠️ **重要**
13. `20251024000002_create_staff_unit_priorities.sql` - スタッフ・ユニット優先度
14. `20251106000001_add_visit_reason_and_medications_to_patients.sql` - 来院理由と服薬情報
15. `20251202000001_create_appointment_staff_table.sql` - 予約スタッフテーブル
16. `20251204000001_fix_patient_id_to_text.sql` - patient_id型修正 ⚠️ **最新**

#### 各ファイルの適用方法:

```bash
# ローカルでファイルの内容を表示
cat supabase/migrations/001_initial_schema.sql
```

1. ファイルの内容をコピー
2. Supabase SQL Editorに貼り付け
3. **Run** ボタンをクリック
4. エラーが出ないことを確認
5. 次のマイグレーションに進む

### ステップ3: RLSポリシーの無効化

開発環境と同じように、RLSポリシーを無効化します：

```sql
-- すべてのテーブルのRLSを無効化
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE units DISABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_menus DISABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_memos DISABLE ROW LEVEL SECURITY;
ALTER TABLE patient_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE shift_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE individual_holidays DISABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE subkarte_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE line_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE line_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_unit_priorities DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_staff DISABLE ROW LEVEL SECURITY;
```

### ステップ4: デモデータの作成

デモクリニックとスタッフを作成：

```sql
-- デモクリニックの作成
INSERT INTO clinics (id, name, created_at, updated_at)
VALUES ('11111111-1111-1111-1111-111111111111', 'デモクリニック', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- デモスタッフの作成（必要に応じて）
-- マイグレーション 20251108000002_create_demo_staff.sql の内容を実行
```

## 方法2: psqlコマンドラインから適用

psqlがインストールされている場合、以下のコマンドで一括適用できます：

```bash
# 実行権限を付与
chmod +x apply-migrations.sh

# データベースパスワードを設定して実行
# （Supabaseプロジェクト作成時に設定したパスワード）
PGPASSWORD='your_database_password' ./apply-migrations.sh
```

## 確認方法

マイグレーション適用後、以下のテーブルが存在することを確認：

```sql
-- テーブル一覧を確認
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

重要なテーブル:
- ✅ appointments
- ✅ patients
- ✅ staff
- ✅ units
- ✅ clinic_settings ⚠️ 通知設定保存に必要
- ✅ notification_templates
- ✅ line_users
- ✅ staff_unit_priorities
- ✅ appointment_staff

## トラブルシューティング

### エラー: relation already exists
→ そのテーブルはすでに存在しているので、次のマイグレーションに進んでOK

### エラー: column already exists
→ そのカラムはすでに存在しているので、次のマイグレーションに進んでOK

### エラー: constraint does not exist
→ 既に削除されているので、次のマイグレーションに進んでOK

### 重要なエラー
以下のようなエラーが出た場合は、SQLを修正する必要があります：
- syntax error
- invalid input syntax
- permission denied

## 次のステップ

マイグレーション適用後：
1. ✅ Vercel環境変数を設定
2. ✅ Vercelを再デプロイ
3. ✅ 本番環境で動作確認
