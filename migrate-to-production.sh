#!/bin/bash

# ローカル開発環境のデータを本番環境に完全移行するスクリプト
# 使用方法: ./migrate-to-production.sh <本番データベースパスワード>

set -e  # エラーで停止

# カラー出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 本番環境の設定
PROD_HOST="db.obdfmwpdkwraqqqyjgwu.supabase.co"
PROD_PORT="5432"
PROD_DB="postgres"
PROD_USER="postgres"
PROD_PASSWORD="$1"

# ローカル環境の設定
LOCAL_HOST="127.0.0.1"
LOCAL_PORT="54322"
LOCAL_DB="postgres"
LOCAL_USER="postgres"
LOCAL_PASSWORD="postgres"

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}本番環境への完全移行スクリプト${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# パスワードチェック
if [ -z "$PROD_PASSWORD" ]; then
  echo -e "${RED}エラー: 本番データベースパスワードが指定されていません${NC}"
  echo ""
  echo "使用方法:"
  echo "  ./migrate-to-production.sh <本番データベースパスワード>"
  echo ""
  echo "本番データベースパスワードは、Supabaseプロジェクト作成時に設定したものです。"
  exit 1
fi

# ローカルSupabaseが起動しているか確認
echo -e "${YELLOW}ステップ1: ローカルSupabaseの確認...${NC}"
if ! psql "postgresql://$LOCAL_USER:$LOCAL_PASSWORD@$LOCAL_HOST:$LOCAL_PORT/$LOCAL_DB" -c '\q' 2>/dev/null; then
  echo -e "${RED}エラー: ローカルSupabaseが起動していません${NC}"
  echo "以下のコマンドで起動してください:"
  echo "  npx supabase start"
  exit 1
fi
echo -e "${GREEN}✅ ローカルSupabaseが起動しています${NC}"
echo ""

# 本番データベースに接続できるか確認
echo -e "${YELLOW}ステップ2: 本番データベースへの接続確認...${NC}"
if ! PGPASSWORD="$PROD_PASSWORD" psql "postgresql://$PROD_USER@$PROD_HOST:$PROD_PORT/$PROD_DB" -c '\q' 2>/dev/null; then
  echo -e "${RED}エラー: 本番データベースに接続できません${NC}"
  echo "パスワードが正しいか確認してください。"
  exit 1
fi
echo -e "${GREEN}✅ 本番データベースに接続しました${NC}"
echo ""

# 一時ファイル
SCHEMA_FILE="/tmp/production-schema.sql"
DATA_FILE="/tmp/production-data.sql"

# ステップ3: スキーマのエクスポート
echo -e "${YELLOW}ステップ3: ローカルのスキーマをエクスポート...${NC}"
pg_dump "postgresql://$LOCAL_USER:$LOCAL_PASSWORD@$LOCAL_HOST:$LOCAL_PORT/$LOCAL_DB" \
  --schema-only \
  --no-owner \
  --no-privileges \
  --no-tablespaces \
  --schema=public \
  > "$SCHEMA_FILE"
echo -e "${GREEN}✅ スキーマをエクスポートしました: $SCHEMA_FILE${NC}"
echo ""

# ステップ4: データのエクスポート
echo -e "${YELLOW}ステップ4: ローカルのデータをエクスポート...${NC}"
pg_dump "postgresql://$LOCAL_USER:$LOCAL_PASSWORD@$LOCAL_HOST:$LOCAL_PORT/$LOCAL_DB" \
  --data-only \
  --no-owner \
  --no-privileges \
  --schema=public \
  --disable-triggers \
  > "$DATA_FILE"
echo -e "${GREEN}✅ データをエクスポートしました: $DATA_FILE${NC}"
echo ""

# ファイルサイズを表示
SCHEMA_SIZE=$(ls -lh "$SCHEMA_FILE" | awk '{print $5}')
DATA_SIZE=$(ls -lh "$DATA_FILE" | awk '{print $5}')
echo -e "  スキーマファイル: ${SCHEMA_SIZE}"
echo -e "  データファイル: ${DATA_SIZE}"
echo ""

# 確認プロンプト
echo -e "${YELLOW}⚠️  警告: 本番データベースにスキーマとデータをインポートします${NC}"
echo -e "本番データベース: ${PROD_HOST}"
echo ""
read -p "続行しますか？ (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo -e "${RED}キャンセルしました${NC}"
  exit 0
fi
echo ""

# ステップ5: スキーマのインポート
echo -e "${YELLOW}ステップ5: 本番環境にスキーマをインポート...${NC}"
PGPASSWORD="$PROD_PASSWORD" psql "postgresql://$PROD_USER@$PROD_HOST:$PROD_PORT/$PROD_DB" \
  -v ON_ERROR_STOP=0 \
  -f "$SCHEMA_FILE" \
  > /tmp/schema-import.log 2>&1

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ スキーマをインポートしました${NC}"
else
  echo -e "${YELLOW}⚠️  一部のスキーマでエラーが発生しました（既に存在する可能性があります）${NC}"
  echo "詳細: /tmp/schema-import.log"
fi
echo ""

# ステップ6: データのインポート
echo -e "${YELLOW}ステップ6: 本番環境にデータをインポート...${NC}"
PGPASSWORD="$PROD_PASSWORD" psql "postgresql://$PROD_USER@$PROD_HOST:$PROD_PORT/$PROD_DB" \
  -v ON_ERROR_STOP=0 \
  -f "$DATA_FILE" \
  > /tmp/data-import.log 2>&1

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ データをインポートしました${NC}"
else
  echo -e "${YELLOW}⚠️  一部のデータでエラーが発生しました${NC}"
  echo "詳細: /tmp/data-import.log"
fi
echo ""

# ステップ7: RLSの無効化
echo -e "${YELLOW}ステップ7: Row Level Security (RLS) を無効化...${NC}"
PGPASSWORD="$PROD_PASSWORD" psql "postgresql://$PROD_USER@$PROD_HOST:$PROD_PORT/$PROD_DB" <<EOF
DO \$\$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
  LOOP
    EXECUTE 'ALTER TABLE ' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY';
  END LOOP;
END \$\$;
EOF
echo -e "${GREEN}✅ RLSを無効化しました${NC}"
echo ""

# ステップ8: データ確認
echo -e "${YELLOW}ステップ8: データ移行の確認...${NC}"
echo ""
echo -e "${BLUE}本番データベースのデータ数:${NC}"
PGPASSWORD="$PROD_PASSWORD" psql "postgresql://$PROD_USER@$PROD_HOST:$PROD_PORT/$PROD_DB" <<EOF
SELECT
  'clinics' as table_name, COUNT(*) as count FROM clinics
UNION ALL
SELECT 'staff', COUNT(*) FROM staff
UNION ALL
SELECT 'units', COUNT(*) FROM units
UNION ALL
SELECT 'patients', COUNT(*) FROM patients
UNION ALL
SELECT 'appointments', COUNT(*) FROM appointments
UNION ALL
SELECT 'treatment_menus', COUNT(*) FROM treatment_menus
ORDER BY table_name;
EOF
echo ""

# クリーンアップ
echo -e "${YELLOW}ステップ9: 一時ファイルのクリーンアップ...${NC}"
rm -f "$SCHEMA_FILE" "$DATA_FILE"
echo -e "${GREEN}✅ クリーンアップ完了${NC}"
echo ""

echo -e "${BLUE}=========================================${NC}"
echo -e "${GREEN}🎉 本番環境への移行が完了しました！${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
echo -e "${YELLOW}次のステップ:${NC}"
echo "1. Vercel環境変数を設定"
echo "2. Vercelを再デプロイ"
echo "3. https://d-max.vercel.app で動作確認"
echo ""
