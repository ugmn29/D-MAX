# 最も簡単なセットアップ方法

開発環境と同じように動作する本番環境を作るには、以下の2ステップだけです：

## 方法A: 1コマンドで完了（推奨）⭐

あなた自身のターミナルで以下を実行：

```bash
# ステップ1: 本番プロジェクトにリンク
npx supabase link --project-ref obdfmwpdkwraqqqyjgwu

# データベースパスワードを入力

# ステップ2: ローカルのスキーマを本番にプッシュ
npx supabase db push
```

これだけで、**ローカルと全く同じテーブル構造**が本番に作成されます！

---

## 方法B: SQLファイルを使う

### ステップ1: production-full-schema.sql を開く

すでに作成済みのファイルを使います：

```bash
# ファイルの場所を確認
ls -lh production-full-schema.sql
```

### ステップ2: Supabase SQL Editorで実行

1. https://supabase.com/dashboard/project/obdfmwpdkwraqqqyjgwu/sql を開く
2. `production-full-schema.sql` をエディタで開く（VSCodeなど）
3. 全内容をコピー
4. SQL Editorに貼り付け
5. "Run" をクリック

⚠️ ファイルが大きい（6438行）ので、時間がかかるかもしれません

---

## どちらを選ぶ？

### 方法A - Supabase CLI（推奨）
- ✅ 最も速い（1分）
- ✅ 自動で全て適用
- ✅ エラーハンドリング自動
- ❌ コマンドラインが必要

### 方法B - SQL Editor
- ✅ ブラウザだけで完結
- ✅ 実行内容が見える
- ❌ 時間がかかる（5分）
- ❌ 大きなSQLファイル

---

## 次のステップ

どちらの方法でも、テーブル構造が作成されたら：

### 1. Vercel環境変数を設定

https://vercel.com → D-MAX → Settings → Environment Variables

以下の3つを追加：

```
NEXT_PUBLIC_SUPABASE_URL = https://obdfmwpdkwraqqqyjgwu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGZtd3Bka3dyYXFxcXlqZ3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MzM2OTQsImV4cCI6MjA4MDUwOTY5NH0.je0tI7XWplnlTHKdI9E4lAZihVizGfozIOV6Gl49XtM
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGZtd3Bka3dyYXFxcXlqZ3d1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDkzMzY5NCwiZXhwIjoyMDgwNTA5Njk0fQ.9Wrs5wTgCC1gDujfydvO4xrA_IpNx6SCR_jLYgo8gLs
```

すべて Production, Preview, Development にチェック（service_roleはProductionのみでもOK）

### 2. Vercel再デプロイ

Vercel → Deployments → 最新デプロイ → "..." → Redeploy

⚠️ **"Use existing Build Cache" のチェックを外す**

### 3. 動作確認

https://d-max.vercel.app にアクセスして：
- スタッフを登録できる
- 患者を登録できる
- 予約を作成できる
- 通知設定を保存できる

すべて開発環境と同じように動作します！

---

## まとめ

```
ローカルと同じ構造を本番に作る
↓
Vercel環境変数で本番Supabaseに接続
↓
再デプロイ
↓
完了！本番で新しいデータを入力できる
```

**開発環境のデータは移行されません**。本番環境で新しく入力していきます。
