# データベースマイグレーション手順

## 🎯 目的
LINE関連テーブルの`patient_id`カラムをUUID型からTEXT型に変更します。

## 📋 実行手順

### 1. Supabase Dashboardにアクセス

https://supabase.com/dashboard/project/obdfmwpdkwraqqqyjgwu/sql

### 2. SQL Editorを開く

左メニューから「SQL Editor」をクリック

### 3. 以下のSQLをコピー&ペースト

```sql
-- LINE関連テーブルのpatient_idをUUIDからTEXTに変更

-- 1. line_invitation_codes
ALTER TABLE line_invitation_codes
  DROP CONSTRAINT IF EXISTS line_invitation_codes_patient_id_fkey,
  ALTER COLUMN patient_id TYPE TEXT;

-- 2. line_patient_linkages
ALTER TABLE line_patient_linkages
  DROP CONSTRAINT IF EXISTS line_patient_linkages_patient_id_fkey,
  ALTER COLUMN patient_id TYPE TEXT;

-- 3. patient_qr_codes
ALTER TABLE patient_qr_codes
  DROP CONSTRAINT IF EXISTS patient_qr_codes_patient_id_fkey,
  ALTER COLUMN patient_id TYPE TEXT;

-- コメント追加
COMMENT ON COLUMN line_invitation_codes.patient_id IS '患者ID (TEXT型: patient_TIMESTAMP_RANDOM形式)';
COMMENT ON COLUMN line_patient_linkages.patient_id IS '患者ID (TEXT型: patient_TIMESTAMP_RANDOM形式)';
COMMENT ON COLUMN patient_qr_codes.patient_id IS '患者ID (TEXT型: patient_TIMESTAMP_RANDOM形式)';
```

### 4. 実行

「Run」ボタンをクリック

### 5. 成功確認

以下のメッセージが表示されればOK：
```
Success. No rows returned
```

## ✅ 実行後の確認

ローカルで確認スクリプトを実行：

```bash
node check-line-tables.mjs
```

すべてのテーブルで `patient_id: text` と表示されればOK！

## 🚀 次のステップ

マイグレーション成功後：

1. 開発サーバーにアクセス: http://localhost:3000
2. 患者一覧ページ: http://localhost:3000/patients
3. 任意の患者をクリック
4. 「基本情報」タブ → 「LINE連携」セクション
5. 「招待コードを発行」ボタンをクリック
6. 招待コードが表示されることを確認

## ❌ エラーが出た場合

### エラー例1: "relation does not exist"
→ テーブルが存在しません。先にテーブル作成マイグレーションを実行してください。

### エラー例2: "permission denied"
→ 権限が不足しています。プロジェクトオーナーでログインしてください。

### エラー例3: "constraint does not exist"
→ すでに外部キー制約が削除されています。問題ありません。

---

**準備OK！Supabase Dashboardでマイグレーションを実行してください！** 🚀
