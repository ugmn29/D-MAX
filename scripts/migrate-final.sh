#!/bin/bash

# Service Role Key経由でマイグレーション実行

SUPABASE_URL="https://pgvozzkedpqhnjhzneuh.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBndm96emtlZHBxaG5qaHpuZXVoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM2MDEzNCwiZXhwIjoyMDczOTM2MTM0fQ.A10uHHvGukzwXd9sTwjWluaTxWrDEs6A-pGxSOYiJug"

echo "🚀 Supabase Dashboard SQL Editor で実行する方法"
echo "================================================"
echo ""
echo "1. https://app.supabase.com を開く"
echo "2. プロジェクト 'd-max-production' を選択"
echo "3. SQL Editor を開く"
echo "4. 以下のファイルの内容をコピー&ペースト:"
echo ""
echo "   📄 supabase/migrations/023_add_training_system.sql"
echo "   📄 supabase/migrations/024_create_training_storage.sql"
echo ""
echo "5. 順番に実行"
echo ""
echo "================================================"
echo ""
echo "VSCodeでファイルを開くには:"
echo "code supabase/migrations/023_add_training_system.sql"
echo "code supabase/migrations/024_create_training_storage.sql"
echo ""
