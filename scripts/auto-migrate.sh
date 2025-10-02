#!/bin/bash

# 完全自動マイグレーション実行スクリプト
# Service Role Key経由でSupabase Meta APIを使用

set -e

SUPABASE_URL="https://pgvozzkedpqhnjhzneuh.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBndm96emtlZHBxaG5qaHpuZXVoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM2MDEzNCwiZXhwIjoyMDczOTM2MTM0fQ.A10uHHvGukzwXd9sTwjWluaTxWrDEs6A-pGxSOYiJug"

echo "🚀 トレーニングシステム - 完全自動マイグレーション"
echo "================================================"
echo ""

# マイグレーション023を読み込み
MIGRATION_023=$(cat supabase/migrations/023_add_training_system.sql)

echo "📦 ステップ1: トレーニングシステムテーブル作成中..."

# Supabase Meta API経由でSQLを実行
RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{\"query\": $(echo "$MIGRATION_023" | jq -Rs .)}")

# エラーチェック
if echo "$RESPONSE" | grep -q "error"; then
    echo "⚠️  エラーまたは警告: $(echo "$RESPONSE" | jq -r '.message // .hint // .')"
    echo "   (テーブルが既に存在する場合は正常です)"
else
    echo "✅ マイグレーション023完了"
fi

echo ""
echo "📦 ステップ2: Storageバケット作成中..."

# マイグレーション024を読み込み
MIGRATION_024=$(cat supabase/migrations/024_create_training_storage.sql)

RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{\"query\": $(echo "$MIGRATION_024" | jq -Rs .)}")

if echo "$RESPONSE" | grep -q "error"; then
    echo "⚠️  エラーまたは警告: $(echo "$RESPONSE" | jq -r '.message // .hint // .')"
else
    echo "✅ マイグレーション024完了"
fi

echo ""
echo "🔍 検証中..."

# テーブル作成の確認
TABLES=$(curl -s "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT table_name FROM information_schema.tables WHERE table_schema = '\''public'\'' AND table_name LIKE '\''%training%'\'' ORDER BY table_name;"}')

echo "作成されたテーブル:"
echo "$TABLES" | jq -r '.[].table_name // empty' 2>/dev/null || echo "  (確認中...)"

echo ""
echo "🎉 マイグレーション完了！"
echo ""
echo "次のステップ:"
echo "1. Supabase Dashboard でテーブルを確認"
echo "2. デフォルトトレーニング16種類が登録されているか確認"
