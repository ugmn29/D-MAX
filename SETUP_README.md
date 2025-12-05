# D-MAX 本番環境セットアップ 完全ガイド

本番環境（https://d-max.vercel.app）で通知設定の保存エラーを解決するための完全なセットアップガイドです。

## 📋 セットアップの流れ

```
1. Supabaseプロジェクト作成 ✅ 完了
   └─ Project URL: https://obdfmwpdkwraqqqyjgwu.supabase.co

2. マイグレーション適用 ⬅️ 次のステップ
   └─ データベースにテーブルを作成

3. Vercel環境変数設定 ⬅️ その次
   └─ 本番環境でSupabaseに接続

4. Vercel再デプロイ
   └─ 新しい環境変数を反映

5. 動作確認
   └─ 通知設定の保存をテスト
```

## 🚀 クイックスタート（推奨）

### ステップ1: データベースセットアップ

1. https://supabase.com/dashboard/project/obdfmwpdkwraqqqyjgwu/sql にアクセス
2. [quick-migration.sql](quick-migration.sql) の内容をコピー
3. SQL Editorに貼り付けて **Run** をクリック
4. ✅ 成功メッセージを確認

### ステップ2: Vercel環境変数設定

1. https://vercel.com → D-MAXプロジェクト → Settings → Environment Variables
2. 以下の3つを追加（[VERCEL_SETUP.md](VERCEL_SETUP.md) 参照）：

```
NEXT_PUBLIC_SUPABASE_URL = https://obdfmwpdkwraqqqyjgwu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGZtd3Bka3dyYXFxcXlqZ3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MzM2OTQsImV4cCI6MjA4MDUwOTY5NH0.je0tI7XWplnlTHKdI9E4lAZihVizGfozIOV6Gl49XtM
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGZtd3Bka3dyYXFxcXlqZ3d1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDkzMzY5NCwiZXhwIjoyMDgwNTA5Njk0fQ.9Wrs5wTgCC1gDujfydvO4xrA_IpNx6SCR_jLYgo8gLs
```

### ステップ3: 再デプロイ

1. Vercel → Deployments タブ
2. 最新デプロイメントの **"..."** → **"Redeploy"**
3. ⚠️ **"Use existing Build Cache" のチェックを外す**
4. **"Redeploy"** をクリック

### ステップ4: 動作確認

1. デプロイ完了まで待つ（2-3分）
2. https://d-max.vercel.app にアクセス
3. 通知設定画面で設定を保存
4. ✅ エラーが出ないことを確認

## 📚 詳細ガイド

### データベースマイグレーション

- **クイック版**: [quick-migration.sql](quick-migration.sql)
  - 必要最小限のテーブルとRLS無効化
  - 1回のSQLで完了

- **完全版**: [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
  - すべてのマイグレーションを順番に適用
  - 各テーブルの詳細な説明

### Vercel設定

- **完全ガイド**: [VERCEL_SETUP.md](VERCEL_SETUP.md)
  - 環境変数の詳細な説明
  - トラブルシューティング
  - セキュリティ注意事項

### 本番環境概要

- **完全セットアップ**: [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md)
  - Supabaseプロジェクト作成から完了まで
  - 全ステップの詳細

## 🔧 現在の状態

### ✅ 完了済み

- [x] Supabaseプロジェクト作成
- [x] 認証情報取得
- [x] マイグレーションファイル準備
- [x] セットアップガイド作成

### ⬜ 実施が必要

- [ ] データベースマイグレーション適用
- [ ] Vercel環境変数設定
- [ ] Vercel再デプロイ
- [ ] 動作確認

## 🐛 トラブルシューティング

### エラー: POST /api/notification-settings 500

**原因**: 本番環境がローカルSupabase（127.0.0.1）に接続しようとしている

**解決策**:
1. Vercel環境変数が正しく設定されているか確認
2. "Use existing Build Cache" を外して再デプロイ
3. ブラウザキャッシュをクリア（Cmd+Shift+R）

### エラー: relation "clinic_settings" does not exist

**原因**: データベースマイグレーションが適用されていない

**解決策**:
1. [quick-migration.sql](quick-migration.sql) を実行
2. または [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) に従って個別に適用

### エラー: Connection refused

**原因**: Supabase URLが間違っている

**解決策**:
1. `https://obdfmwpdkwraqqqyjgwu.supabase.co` が正しいことを確認
2. `http://127.0.0.1:54321` になっていないか確認

## 📊 環境の違い

### ローカル開発環境

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...（ローカル用）
```

### 本番環境（Vercel）

```bash
NEXT_PUBLIC_SUPABASE_URL=https://obdfmwpdkwraqqqyjgwu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...（本番用）
```

## 🔐 セキュリティ

- ✅ `.env.local` はGitにコミットしない
- ✅ `SUPABASE_SERVICE_ROLE_KEY` は絶対に公開しない
- ✅ RLSポリシーは本番環境でも無効化（アプリ側で制御）
- ✅ Vercel環境変数はプロジェクトメンバーのみアクセス可能

## 📝 次回のデプロイ時

本番環境のセットアップが完了した後、新しいマイグレーションを追加する場合：

1. ローカルで `supabase/migrations/新しいファイル.sql` を作成
2. ローカルでテスト: `npx supabase db reset`
3. 本番に適用: Supabase SQL Editorで実行
4. Gitにコミット&プッシュ（自動デプロイ）

## 🆘 サポート

問題が解決しない場合：

1. Supabase SQL Editorでテーブル一覧を確認:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```

2. Vercel デプロイメントログを確認
3. ブラウザ開発者ツールのNetworkタブを確認

## 📦 ファイル一覧

- `SETUP_README.md` - このファイル（セットアップの概要）
- `quick-migration.sql` - クイックマイグレーション（推奨）
- `MIGRATION_GUIDE.md` - 詳細なマイグレーションガイド
- `VERCEL_SETUP.md` - Vercel環境変数設定ガイド
- `PRODUCTION_SETUP.md` - 完全セットアップガイド
- `apply-migrations.sh` - psqlを使ったマイグレーション適用スクリプト

---

**今すぐ始める**: [quick-migration.sql](quick-migration.sql) を実行して、[VERCEL_SETUP.md](VERCEL_SETUP.md) に従って環境変数を設定してください！
