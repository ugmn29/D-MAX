# D-MAX アップデートワークフロー

開発環境で機能を開発し、本番環境に反映するまでの手順です。

---

## 🔄 基本的な開発フロー

```
開発環境で開発 → ローカルでテスト → 本番に適用 → 完了
```

---

## 📝 詳細な手順

### ステップ1: 新機能を開発環境で開発

#### データベース変更が必要な場合

```bash
# 新しいマイグレーションファイルを作成
npx supabase migration new add_new_feature
```

これで `supabase/migrations/` に新しいSQLファイルが作成されます。
例: `20251206000001_add_new_feature.sql`

#### マイグレーションファイルを編集

作成されたファイルを開いて、必要なSQLを記述：

```sql
-- 例: 新しいテーブルを追加
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  amount INTEGER NOT NULL,
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLSを無効化
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;

-- インデックスを作成
CREATE INDEX idx_sales_clinic_id ON sales(clinic_id);
CREATE INDEX idx_sales_created_at ON sales(created_at);
```

---

### ステップ2: ローカル環境でテスト

```bash
# ローカルデータベースをリセットして全マイグレーションを適用
npx supabase db reset

# アプリを起動
npm run dev

# ブラウザで動作確認
# http://localhost:3000
```

#### 確認事項：
- ✅ マイグレーションがエラーなく適用される
- ✅ 新機能が正しく動作する
- ✅ 既存機能に影響がない
- ✅ エラーログが出ていない

---

### ステップ3: コードをGitにコミット

```bash
# 変更内容を確認
git status
git diff

# ファイルを追加
git add .

# コミット（わかりやすいメッセージで）
git commit -m "feat: 売上管理機能を追加

- salesテーブルを追加
- 売上登録画面を実装
- 売上一覧・集計機能を追加"

# リモートにプッシュ
git push origin main
```

---

### ステップ4: 本番データベースに適用

```bash
# 本番環境にマイグレーションを適用（1コマンド！）
npx supabase db push
```

このコマンドは：
- ✅ 本番環境で未適用のマイグレーションだけを実行
- ✅ 既に適用済みのものはスキップ
- ✅ エラーが出たら自動でロールバック
- ✅ 適用前に確認プロンプトが表示される

#### 実行例：

```
$ npx supabase db push
Connecting to remote database...
Apply migration 20251206000001_add_sales_table.sql to remote database? [y/N] y
Applying migration...
✓ Migration applied successfully
```

---

### ステップ5: Vercelで自動デプロイ

Gitにプッシュすると、Vercelが自動的にデプロイを開始します：

1. https://vercel.com/dashboard にアクセス
2. D-MAXプロジェクトを選択
3. Deploymentsタブで進行状況を確認
4. "Ready" になるまで待つ（通常2-3分）

---

### ステップ6: 本番環境で動作確認

```bash
# 本番URLにアクセス
open https://d-max.vercel.app
```

#### 確認事項：
- ✅ 新機能が正しく動作する
- ✅ データが保存できる
- ✅ 既存機能に影響がない
- ✅ エラーが出ていない

---

## 🔍 マイグレーションの確認コマンド

### ローカル環境のマイグレーション一覧

```bash
# ローカルのマイグレーションファイルを確認
ls -la supabase/migrations/
```

### 本番環境のマイグレーション状態

```bash
# 本番環境で適用済みのマイグレーションを確認
npx supabase migration list

# 本番環境とローカルの差分を確認
npx supabase db diff
```

---

## 🚨 トラブルシューティング

### マイグレーションがエラーで失敗した場合

#### ローカル環境の場合

```bash
# データベースをリセットして再試行
npx supabase db reset

# それでもエラーが出る場合はマイグレーションファイルを修正
```

#### 本番環境の場合

```bash
# エラー内容を確認
npx supabase db push --debug

# 必要に応じて修正マイグレーションを作成
npx supabase migration new fix_previous_migration

# 修正マイグレーションで対応
```

### マイグレーション履歴の不整合エラー

**エラー**: `Remote migration versions not found in local migrations directory`

**原因**: 本番環境とローカルのマイグレーション履歴が一致しない

**解決方法 (3つの選択肢)**:

#### 方法1: Supabase SQL Editorで直接実行 (推奨) ✅

1. https://supabase.com/dashboard/project/obdfmwpdkwraqqqyjgwu/sql にアクセス
2. マイグレーションファイルのSQLをコピー
3. SQL Editorで実行

**メリット**: 簡単、確実、履歴の問題を回避

#### 方法2: Node.jsスクリプトで実行

```bash
# run-migration.mjsを作成して実行
SUPABASE_DB_PASSWORD='your_password' node run-migration.mjs
```

**メリット**: 自動化できる、スクリプトで再利用可能

#### 方法3: マイグレーション履歴を修復

```bash
# 本番のマイグレーション履歴を確認
npx supabase migration list

# 問題のあるマイグレーションを修復
npx supabase migration repair --status reverted 20251112

# 再度プッシュ
npx supabase db push
```

**メリット**: 履歴が正しく管理される

**今後のベストプラクティス**:
- マイグレーションファイル名は必ずユニークにする
- 同じ日付で複数のマイグレーションを作る場合は時刻も含める（例: `20251205132347`）
- 本番適用前に必ず `npx supabase migration list` で履歴を確認

### Vercelのデプロイが失敗した場合

1. Vercel Deploymentsタブでエラーログを確認
2. ビルドエラーの場合：
   - TypeScriptエラーを修正
   - `npm run build` でローカル確認
   - 修正してから再プッシュ

3. 環境変数エラーの場合：
   - Vercel Settings → Environment Variables を確認
   - 必要な変数が設定されているか確認

---

## 📊 よくある開発パターン

### パターン1: 新しいテーブルを追加

```bash
# 1. マイグレーション作成
npx supabase migration new create_xxx_table

# 2. SQLを記述
# CREATE TABLE xxx (...)

# 3. ローカルテスト
npx supabase db reset
npm run dev

# 4. 本番適用
npx supabase db push
git add . && git commit -m "Add xxx table" && git push
```

### パターン2: 既存テーブルにカラム追加

```bash
# 1. マイグレーション作成
npx supabase migration new add_column_to_xxx

# 2. SQLを記述
# ALTER TABLE xxx ADD COLUMN yyy TEXT;

# 3. ローカルテスト
npx supabase db reset
npm run dev

# 4. 本番適用
npx supabase db push
git add . && git commit -m "Add yyy column to xxx" && git push
```

### パターン3: コードのみの変更（DB変更なし）

```bash
# データベース変更がない場合
npm run dev  # ローカルテスト
git add . && git commit -m "Update UI" && git push
# Vercelが自動デプロイ
```

---

## 🎯 ベストプラクティス

### ✅ やるべきこと

1. **小さく頻繁にコミット**
   - 機能ごとにコミット
   - わかりやすいコミットメッセージ

2. **必ずローカルでテスト**
   - `npx supabase db reset` で全マイグレーション確認
   - 本番適用前に動作確認

3. **マイグレーションファイル名を明確に**
   - 良い例: `add_sales_table.sql`, `add_payment_method_column.sql`
   - 悪い例: `update.sql`, `fix.sql`

4. **本番適用は慎重に**
   - `npx supabase db push` の確認プロンプトをよく読む
   - データが消える可能性がある変更は特に注意

### ❌ 避けるべきこと

1. **本番データベースを直接編集**
   - 必ずマイグレーションファイルで管理
   - 手動SQLは記録に残らない

2. **マイグレーションファイルを削除・編集**
   - 一度適用したマイグレーションは変更しない
   - 修正が必要なら新しいマイグレーションを作成

3. **テストなしで本番適用**
   - 必ずローカルで動作確認
   - いきなり本番は危険

---

## 📚 参考コマンド一覧

### マイグレーション関連

```bash
# 新しいマイグレーション作成
npx supabase migration new <name>

# ローカルDBリセット（全マイグレーション再適用）
npx supabase db reset

# 本番に適用
npx supabase db push

# マイグレーション一覧確認
npx supabase migration list

# 本番とローカルの差分確認
npx supabase db diff
```

### Supabase関連

```bash
# ローカルSupabase起動
npx supabase start

# ローカルSupabase停止
npx supabase stop

# ステータス確認
npx supabase status

# ローカルStudioを開く
open http://127.0.0.1:54323
```

### 開発関連

```bash
# 開発サーバー起動
npm run dev

# ビルド確認
npm run build

# 本番確認
npm run start
```

### Git関連

```bash
# 状態確認
git status
git diff

# コミット
git add .
git commit -m "message"
git push origin main

# ログ確認
git log --oneline
```

---

## 🔗 関連リンク

- **本番環境**: https://d-max.vercel.app
- **Vercelダッシュボード**: https://vercel.com/dashboard
- **Supabaseダッシュボード**: https://supabase.com/dashboard/project/obdfmwpdkwraqqqyjgwu
- **ローカルStudio**: http://127.0.0.1:54323

---

## 💡 まとめ

### 通常のアップデートフロー（最短）

```bash
# 1. マイグレーション作成（DB変更がある場合）
npx supabase migration new feature_name

# 2. SQLを編集してローカルテスト
npx supabase db reset && npm run dev

# 3. 本番適用
npx supabase db push

# 4. コードをプッシュ（Vercel自動デプロイ）
git add . && git commit -m "Add feature" && git push
```

**これだけです！**

開発環境で動作確認したら、1コマンドで本番に反映できます。
