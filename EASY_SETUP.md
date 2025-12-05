# 最も簡単なセットアップ方法 🚀

SQLを書かずに、SupabaseのWeb UIだけで完了できます！

## 方法1: Supabase Table Editorから作成（最も簡単）⭐

### ステップ1: Supabaseダッシュボードを開く

https://supabase.com/dashboard/project/obdfmwpdkwraqqqyjgwu にアクセス

### ステップ2: 既存のローカルデータベースから本番にコピー

実は、**ローカルのSupabaseが動いている状態で**、以下のコマンドを実行するだけです：

```bash
# データベースのスキーマダンプを作成
npx supabase db dump -f schema.sql

# 本番データベースにスキーマを適用
# データベースパスワードを入力
psql "postgresql://postgres:YOUR_PASSWORD@db.obdfmwpdkwraqqqyjgwu.supabase.co:5432/postgres" -f schema.sql
```

---

## 方法2: もっと簡単 - Supabase Studio経由でコピー 🎯

### 現在のローカルデータベース構造を確認

```bash
# ローカルのSupabaseが起動していることを確認
npx supabase status
```

### スキーマをエクスポート

```bash
# スキーマをファイルに保存
npx supabase db dump --schema public -f production-schema.sql
```

このファイルを本番で実行すればOK！

---

## 方法3: 最速 - 最小限のテーブルだけ手動作成 ⚡

通知設定の保存に**最低限必要なテーブル**だけ作成します：

### Supabase Table Editor で以下を作成：

#### 1. clinicsテーブル

https://supabase.com/dashboard/project/obdfmwpdkwraqqqyjgwu/editor で "New table" をクリック

| カラム名 | 型 | デフォルト値 | 制約 |
|---------|------|------------|-----|
| id | uuid | gen_random_uuid() | PRIMARY KEY |
| name | text | - | NOT NULL |
| created_at | timestamptz | now() | - |
| updated_at | timestamptz | now() | - |

#### 2. clinic_settingsテーブル

| カラム名 | 型 | デフォルト値 | 制約 |
|---------|------|------------|-----|
| id | uuid | gen_random_uuid() | PRIMARY KEY |
| clinic_id | uuid | - | REFERENCES clinics(id) |
| setting_key | text | - | NOT NULL |
| setting_value | jsonb | - | - |
| created_at | timestamptz | now() | - |
| updated_at | timestamptz | now() | - |

UNIQUE制約を追加: `(clinic_id, setting_key)`

#### 3. デモクリニックを挿入

Table Editorで clinics テーブルを開いて "Insert row":

- id: `11111111-1111-1111-1111-111111111111`
- name: `デモクリニック`

---

## 方法4: 自動スクリプト（推奨） 🤖

Supabaseプロジェクトをリンクして、自動でマイグレーションを適用：

```bash
# Supabaseにログイン（ブラウザが開きます）
npx supabase login

# プロジェクトをリンク
npx supabase link --project-ref obdfmwpdkwraqqqyjgwu

# マイグレーションを一括適用
npx supabase db push
```

これだけで**すべてのマイグレーション**が自動的に適用されます！

---

## おすすめの順番

### 🥇 第1位: 方法4 - 自動スクリプト
- 最も確実で速い
- すべてのテーブルが正しく作成される
- 3コマンドで完了

### 🥈 第2位: 方法3 - 最小限のテーブル手動作成
- SQLを書かない
- GUIで完結
- 5分で完了

### 🥉 第3位: quick-migration.sql を実行
- SQL Editorで1回実行
- すべて自動

---

## 実際にやってみましょう！

### オプションA: 自動スクリプト（3分）

```bash
# 1. ログイン
npx supabase login

# 2. リンク
npx supabase link --project-ref obdfmwpdkwraqqqyjgwu
# データベースパスワードを入力

# 3. マイグレーション適用
npx supabase db push
```

### オプションB: SQL Editor（2分）

1. https://supabase.com/dashboard/project/obdfmwpdkwraqqqyjgwu/sql を開く
2. [quick-migration.sql](quick-migration.sql) をコピー＆ペースト
3. "Run" をクリック

### オプションC: Table Editorで手動（5分）

1. https://supabase.com/dashboard/project/obdfmwpdkwraqqqyjgwu/editor を開く
2. 上記の「方法3」の手順に従ってテーブルを作成

---

どの方法が良いですか？

- **速さ重視**: オプションA（自動スクリプト）
- **簡単さ重視**: オプションB（SQL Editor）
- **GUI重視**: オプションC（Table Editor）

試してみて、うまくいかなかったら別の方法を試しましょう！
