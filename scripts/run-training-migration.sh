#!/bin/bash

# トレーニング機能のマイグレーション実行スクリプト

echo "🚀 トレーニング機能マイグレーション実行開始..."
echo ""

# 環境変数チェック
if [ -z "$SUPABASE_DB_URL" ]; then
    echo "❌ エラー: SUPABASE_DB_URL環境変数が設定されていません"
    echo "例: export SUPABASE_DB_URL='postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres'"
    exit 1
fi

echo "📦 ステップ1: トレーニングシステムテーブル作成..."
psql "$SUPABASE_DB_URL" -f supabase/migrations/023_add_training_system.sql

if [ $? -ne 0 ]; then
    echo "❌ ステップ1でエラーが発生しました"
    exit 1
fi

echo "✅ ステップ1完了"
echo ""

echo "📦 ステップ2: Storageバケット作成..."
psql "$SUPABASE_DB_URL" -f supabase/migrations/024_create_training_storage.sql

if [ $? -ne 0 ]; then
    echo "❌ ステップ2でエラーが発生しました"
    exit 1
fi

echo "✅ ステップ2完了"
echo ""

echo "🎉 マイグレーション完了！"
echo ""
echo "次のステップ:"
echo "1. テーブル作成を確認: supabase db remote list"
echo "2. デフォルトトレーニング確認: SELECT COUNT(*) FROM trainings WHERE is_default = true;"
