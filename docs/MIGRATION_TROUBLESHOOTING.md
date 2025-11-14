# マイグレーション トラブルシューティング

## エラー: relation "treatment_codes" does not exist

このエラーは、`treatment_codes`テーブルがデータベースに存在しないことを意味します。

### 原因

1. Supabaseプロジェクトが一時停止中にデータがリセットされた
2. まだ基本的なEMRマイグレーションが実行されていない
3. 別のデータベースに接続している

### 解決方法

## ステップ1: テーブルの存在確認

Supabase Dashboard → SQL Editorで以下を実行：

```sql
-- すべてのテーブルを確認
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

## ステップ2: treatment_codesテーブルがない場合

まず、EMRシステムの基本テーブルを作成する必要があります。

以下のマイグレーションを**先に**実行してください：

```sql
-- このファイルを実行: supabase/migrations/20251112000001_create_emr_system_tables.sql
```

## ステップ3: 基本テーブル作成後、PDFルールを適用

`treatment_codes`テーブルが作成されたら、PDFルールのマイグレーションを実行できます：

```sql
-- このファイルを実行: supabase/migrations/2025-11-12_add_pdf_detailed_rules.sql
```

---

## 簡単な確認SQLコマンド

### 1. データベースに何があるか確認
```sql
\dt
```

### 2. treatment_codesテーブルが存在するか確認
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'treatment_codes'
);
```

### 3. 既存のマイグレーション履歴を確認
```sql
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 10;
```

---

## 次のアクション

実際の状況を確認するために、上記の「ステップ1」のSQLを実行してください。
結果を教えていただければ、適切な対応をお伝えします。
