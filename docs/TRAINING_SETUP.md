# トレーニング機能セットアップガイド

## 概要
このガイドでは、口腔機能トレーニング機能のデータベースセットアップと初期設定を行います。

---

## 前提条件

- Supabaseプロジェクトが作成済み
- Supabase CLIがインストール済み（または、Dashboard経由でマイグレーション実行）
- 環境変数が設定済み

---

## ステップ1: マイグレーション実行

### 方法A: Supabase CLI を使用（推奨）

```bash
# 1. Supabaseプロジェクトにログイン
supabase login

# 2. プロジェクトにリンク
supabase link --project-ref your-project-ref

# 3. マイグレーション実行
supabase db push

# または、特定のマイグレーションのみ実行
supabase db push --file supabase/migrations/023_add_training_system.sql
supabase db push --file supabase/migrations/024_create_training_storage.sql
```

### 方法B: Supabase Dashboard を使用

1. Supabase Dashboard にログイン
2. **SQL Editor** を開く
3. 以下のファイルの内容をコピー&ペーストして実行:
   - `supabase/migrations/023_add_training_system.sql`
   - `supabase/migrations/024_create_training_storage.sql`

---

## ステップ2: 環境変数の設定

### ローカル環境（`.env.local`）

```.env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Vercel環境

1. Vercelダッシュボード → Settings → Environment Variables
2. 上記3つの環境変数を追加

---

## ステップ3: データベース確認

### 作成されたテーブル（9個）

```sql
-- 確認クエリ
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'training%'
  OR table_name IN ('templates', 'operation_logs', 'device_accounts')
ORDER BY table_name;
```

**期待される結果:**
- `trainings`
- `training_menus`
- `menu_trainings`
- `training_records`
- `templates`
- `template_trainings`
- `operation_logs`
- `device_accounts`

### デフォルトトレーニングの確認

```sql
SELECT training_name, category, is_default
FROM trainings
WHERE is_default = true
ORDER BY created_at;
```

**期待される結果:** 16件のトレーニングが登録されている

---

## ステップ4: Supabase Storage バケット確認

### Dashboard で確認

1. Supabase Dashboard → **Storage**
2. `training-animations` バケットが作成されているか確認
3. バケット設定:
   - Public: **Yes**
   - File size limit: **5MB**
   - Allowed MIME types: **application/json**

### ポリシー確認

```sql
-- Storageポリシー確認
SELECT * FROM storage.policies
WHERE bucket_id = 'training-animations';
```

**期待される結果:** 5つのポリシーが作成されている

---

## ステップ5: RLS（Row Level Security）確認

```sql
-- RLSが有効化されているか確認
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'training%'
ORDER BY tablename;
```

**期待される結果:** すべてのテーブルで `rowsecurity = true`

---

## ステップ6: 患者テーブルの拡張確認

```sql
-- patientsテーブルに新しいカラムが追加されているか確認
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'patients'
  AND column_name IN ('password_hash', 'password_set', 'training_last_login_at');
```

**期待される結果:**
- `password_hash` (text)
- `password_set` (boolean)
- `training_last_login_at` (timestamp with time zone)

---

## ステップ7: APIエンドポイント確認

### ローカルで開発サーバー起動

```bash
npm run dev
```

### 患者ログインAPIのテスト

```bash
curl -X POST http://localhost:3000/api/training/auth/patient-login \
  -H "Content-Type: application/json" \
  -d '{
    "clinicId": "your-clinic-id",
    "patientNumber": 1,
    "credential": "20150415"
  }'
```

---

## トラブルシューティング

### マイグレーションエラー

**エラー: `relation "trainings" already exists`**
- 原因: 既にテーブルが存在する
- 対処: マイグレーションをスキップするか、既存テーブルを削除

**エラー: `permission denied for schema storage`**
- 原因: Storage権限不足
- 対処: Service Role Keyを使用してマイグレーション実行

### API エラー

**エラー: `SUPABASE_SERVICE_ROLE_KEY is not defined`**
- 原因: 環境変数が設定されていない
- 対処: `.env.local` に環境変数を追加

**エラー: `bcryptjs not found`**
- 原因: パッケージ未インストール
- 対処: `npm install bcryptjs @types/bcryptjs`

---

## 次のステップ

1. ✅ データベースセットアップ完了
2. ✅ 認証API実装完了
3. 🔲 フロントエンド実装開始
   - 医院側管理画面
   - 患者側トレーニング画面
4. 🔲 アニメーションファイルのアップロード
5. 🔲 テスト・デバッグ

---

## 参考リンク

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [bcryptjs Documentation](https://www.npmjs.com/package/bcryptjs)
