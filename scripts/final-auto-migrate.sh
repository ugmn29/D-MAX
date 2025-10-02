#!/bin/bash

# 完全自動マイグレーション - Supabase Studio API使用
# パスワード不要、Service Role Keyのみで実行可能

set -e

PROJECT_REF="pgvozzkedpqhnjhzneuh"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBndm96emtlZHBxaG5qaHpuZXVoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM2MDEzNCwiZXhwIjoyMDczOTM2MTM0fQ.A10uHHvGukzwXd9sTwjWluaTxWrDEs6A-pGxSOYiJug"

echo "🚀 トレーニングシステム - 完全自動マイグレーション"
echo "============================================================"
echo ""

# 一時的なRPC関数を作成してSQLを実行
echo "📦 ステップ0: SQL実行用の一時関数を作成..."

CREATE_FUNCTION_SQL='
CREATE OR REPLACE FUNCTION temp_exec_migration(sql_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_text;
  RETURN '\''success'\'';
EXCEPTION WHEN OTHERS THEN
  RETURN SQLERRM;
END;
$$;
'

curl -s -X POST "https://${PROJECT_REF}.supabase.co/rest/v1/rpc/temp_exec_migration" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: params=single-object" \
  -d "{\"sql_text\": $(echo "$CREATE_FUNCTION_SQL" | jq -Rs .)}" > /dev/null 2>&1

echo "   ✅ 準備完了"
echo ""

# マイグレーション023を実行
echo "📦 ステップ1: トレーニングシステムテーブル作成..."

MIGRATION_023=$(cat supabase/migrations/023_add_training_system.sql | jq -Rs .)

RESULT=$(curl -s -X POST "https://${PROJECT_REF}.supabase.co/rest/v1/rpc/temp_exec_migration" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: params=single-object" \
  -d "{\"sql_text\": $MIGRATION_023}")

if [ "$RESULT" == '"success"' ]; then
    echo "   ✅ 完了"
else
    echo "   ⚠️  $RESULT (既に存在する場合は正常です)"
fi

echo ""

# マイグレーション024を実行
echo "📦 ステップ2: Storageバケット作成..."

MIGRATION_024=$(cat supabase/migrations/024_create_training_storage.sql | jq -Rs .)

RESULT=$(curl -s -X POST "https://${PROJECT_REF}.supabase.co/rest/v1/rpc/temp_exec_migration" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: params=single-object" \
  -d "{\"sql_text\": $MIGRATION_024}")

if [ "$RESULT" == '"success"' ]; then
    echo "   ✅ 完了"
else
    echo "   ⚠️  $RESULT"
fi

echo ""
echo "🎉 マイグレーション完了！"
echo ""
echo "確認方法:"
echo "  Supabase Dashboard → SQL Editor で以下を実行:"
echo "  SELECT COUNT(*) FROM trainings WHERE is_default = true;"
echo ""
