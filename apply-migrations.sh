#!/bin/bash

# 本番Supabaseデータベースに接続してマイグレーションを適用するスクリプト
# 使用方法: ./apply-migrations.sh

# 本番データベース接続情報
DB_HOST="db.obdfmwpdkwraqqqyjgwu.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"

echo "========================================="
echo "本番データベースへのマイグレーション適用"
echo "========================================="
echo ""
echo "データベース: $DB_HOST"
echo ""
echo "マイグレーションファイル数: $(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)"
echo ""

# データベースパスワードが設定されているか確認
if [ -z "$PGPASSWORD" ]; then
  echo "エラー: PGPASSWORD環境変数が設定されていません"
  echo ""
  echo "使用方法:"
  echo "  PGPASSWORD='your_database_password' ./apply-migrations.sh"
  echo ""
  exit 1
fi

# マイグレーションファイルを順番に適用
SUCCESS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

for migration_file in $(ls -1 supabase/migrations/*.sql | sort); do
  filename=$(basename "$migration_file")

  # 一部のファイルはスキップ（開発環境専用など）
  if [[ "$filename" == *"disable_rls"* ]]; then
    echo "⏩ スキップ: $filename (開発環境専用)"
    SKIP_COUNT=$((SKIP_COUNT + 1))
    continue
  fi

  echo "📝 適用中: $filename"

  # psqlコマンドで適用
  PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file" -v ON_ERROR_STOP=1 > /dev/null 2>&1

  if [ $? -eq 0 ]; then
    echo "✅ 成功: $filename"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  else
    echo "❌ 失敗: $filename"
    echo "   詳細を確認するには、以下のコマンドを実行してください:"
    echo "   PGPASSWORD='...' psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $migration_file"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
  echo ""
done

echo "========================================="
echo "マイグレーション適用結果"
echo "========================================="
echo "成功: $SUCCESS_COUNT"
echo "失敗: $FAIL_COUNT"
echo "スキップ: $SKIP_COUNT"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
  echo "✅ すべてのマイグレーションが正常に適用されました！"
  exit 0
else
  echo "⚠️  一部のマイグレーションが失敗しました。詳細を確認してください。"
  exit 1
fi
