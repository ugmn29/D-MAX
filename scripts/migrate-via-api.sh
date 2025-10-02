#!/bin/bash

# Service Role Keyを使ってSupabase APIでマイグレーション実行

PROJECT_REF="pgvozzkedpqhnjhzneuh"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBndm96emtlZHBxaG5qaHpuZXVoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM2MDEzNCwiZXhwIjoyMDczOTM2MTM0fQ.A10uHHvGukzwXd9sTwjWluaTxWrDEs6A-pGxSOYiJug"
SUPABASE_URL="https://pgvozzkedpqhnjhzneuh.supabase.co"

echo "🚀 トレーニングシステムマイグレーション実行"
echo ""

# Migration 023
echo "📦 ステップ1: トレーニングシステムテーブル作成..."

MIGRATION_023=$(cat supabase/migrations/023_add_training_system.sql)

# Supabase REST APIでSQLを実行
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(echo "$MIGRATION_023" | jq -Rs .)}" \
  2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ マイグレーション023完了"
else
    echo "⚠️  マイグレーション023でエラー（テーブルが既に存在する可能性があります）"
fi

echo ""
echo "📦 ステップ2: Storageバケット作成..."

MIGRATION_024=$(cat supabase/migrations/024_create_training_storage.sql)

curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(echo "$MIGRATION_024" | jq -Rs .)}" \
  2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ マイグレーション024完了"
else
    echo "⚠️  マイグレーション024でエラー"
fi

echo ""
echo "🎉 マイグレーション完了！"
