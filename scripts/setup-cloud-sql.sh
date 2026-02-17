#!/bin/bash

# GCP Cloud SQL PostgreSQLインスタンス作成スクリプト
# このスクリプトは再利用可能で、環境変数で設定をカスタマイズできます

set -e

# カラー出力
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 GCP Cloud SQL PostgreSQLインスタンス作成${NC}"
echo "=================================================="

# 設定（環境変数で上書き可能）
PROJECT_ID=${GCP_PROJECT_ID:-d-max-voice-input}
INSTANCE_NAME=${DB_INSTANCE_NAME:-shikabot-postgres}
REGION=${GCP_REGION:-asia-northeast1}
DATABASE_VERSION=${DB_VERSION:-POSTGRES_16}
TIER=${DB_TIER:-db-f1-micro}  # 開発用小規模
STORAGE_SIZE=${DB_STORAGE_SIZE:-10GB}
STORAGE_TYPE=${DB_STORAGE_TYPE:-SSD}
BACKUP_ENABLED=${DB_BACKUP_ENABLED:-true}

echo -e "${YELLOW}設定内容:${NC}"
echo "  プロジェクトID: $PROJECT_ID"
echo "  インスタンス名: $INSTANCE_NAME"
echo "  リージョン: $REGION"
echo "  PostgreSQLバージョン: $DATABASE_VERSION"
echo "  マシンタイプ: $TIER"
echo "  ストレージ: $STORAGE_SIZE $STORAGE_TYPE"
echo "  自動バックアップ: $BACKUP_ENABLED"
echo ""

# パスワード生成（または環境変数から取得）
if [ -z "$DB_ROOT_PASSWORD" ]; then
  echo -e "${YELLOW}⚠️  DB_ROOT_PASSWORD が設定されていません。ランダムパスワードを生成します。${NC}"
  DB_ROOT_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
  echo -e "${GREEN}生成されたパスワード: $DB_ROOT_PASSWORD${NC}"
  echo -e "${RED}このパスワードを必ず保存してください！${NC}"
  echo ""
fi

# 1. Cloud SQL Admin APIの有効化
echo -e "${BLUE}📡 Cloud SQL Admin APIを有効化中...${NC}"
gcloud services enable sqladmin.googleapis.com \
  --project=$PROJECT_ID

echo -e "${GREEN}✅ APIが有効化されました${NC}"
echo ""

# 2. インスタンスの存在確認
echo -e "${BLUE}🔍 既存インスタンスを確認中...${NC}"
if gcloud sql instances describe $INSTANCE_NAME --project=$PROJECT_ID >/dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  インスタンス '$INSTANCE_NAME' は既に存在します。${NC}"
  echo "続行しますか？ (y/N)"
  read -r response
  if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo -e "${RED}中止しました${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}✅ インスタンス名は使用可能です${NC}"
fi
echo ""

# 3. Cloud SQLインスタンスの作成
echo -e "${BLUE}🏗️  Cloud SQLインスタンスを作成中...${NC}"
echo "これには5-10分かかる場合があります。"

gcloud sql instances create $INSTANCE_NAME \
  --project=$PROJECT_ID \
  --database-version=$DATABASE_VERSION \
  --edition=ENTERPRISE \
  --tier=$TIER \
  --region=$REGION \
  --storage-type=$STORAGE_TYPE \
  --storage-size=$STORAGE_SIZE \
  --root-password="$DB_ROOT_PASSWORD" \
  --backup \
  --backup-start-time=03:00 \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=4 \
  --assign-ip

echo -e "${GREEN}✅ インスタンスが作成されました${NC}"
echo ""

# 4. 承認済みネットワークの追加（すべてのIPを許可 - 開発用のみ）
echo -e "${YELLOW}⚠️  開発用にすべてのIPからの接続を許可します（本番環境では制限してください）${NC}"
gcloud sql instances patch $INSTANCE_NAME \
  --project=$PROJECT_ID \
  --authorized-networks=0.0.0.0/0

echo ""

# 5. データベースの作成
echo -e "${BLUE}💾 データベースを作成中...${NC}"
gcloud sql databases create postgres \
  --instance=$INSTANCE_NAME \
  --project=$PROJECT_ID \
  --charset=UTF8 || echo "データベース 'postgres' は既に存在するかもしれません"

echo -e "${GREEN}✅ データベースが作成されました${NC}"
echo ""

# 6. 接続情報の取得
echo -e "${BLUE}📋 接続情報を取得中...${NC}"
CONNECTION_NAME=$(gcloud sql instances describe $INSTANCE_NAME --project=$PROJECT_ID --format="value(connectionName)")
PUBLIC_IP=$(gcloud sql instances describe $INSTANCE_NAME --project=$PROJECT_ID --format="value(ipAddresses[0].ipAddress)")

echo ""
echo -e "${GREEN}🎉 セットアップ完了！${NC}"
echo "=================================================="
echo ""
echo -e "${BLUE}接続情報:${NC}"
echo "  接続名: $CONNECTION_NAME"
echo "  パブリックIP: $PUBLIC_IP"
echo "  ユーザー名: postgres"
echo "  パスワード: $DB_ROOT_PASSWORD"
echo "  データベース: postgres"
echo "  ポート: 5432"
echo ""
echo -e "${BLUE}DATABASE_URL:${NC}"
echo "postgresql://postgres:$DB_ROOT_PASSWORD@$PUBLIC_IP:5432/postgres"
echo ""
echo -e "${YELLOW}次のステップ:${NC}"
echo "  1. .env.production を作成"
echo "  2. DATABASE_URL を設定"
echo "  3. Prismaマイグレーションを実行"
echo "  4. マスターデータをインポート"
echo ""
echo -e "${RED}重要: パスワードを安全な場所に保存してください！${NC}"

# パスワードをファイルに保存（オプション）
if [ "$SAVE_PASSWORD" = "true" ]; then
  PASSWORD_FILE=".cloud-sql-password"
  echo "$DB_ROOT_PASSWORD" > $PASSWORD_FILE
  chmod 600 $PASSWORD_FILE
  echo -e "${YELLOW}パスワードを $PASSWORD_FILE に保存しました（権限: 600）${NC}"
fi
