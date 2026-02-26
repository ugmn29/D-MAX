#!/bin/bash
# GitHub Secrets を .env.local から一括設定するスクリプト
# 実行前提: gh CLI がインストール済み・ログイン済みであること
#   gh auth login

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$ROOT_DIR/.env.local"
GCP_OUTPUT="$ROOT_DIR/.gcp-setup-output"

echo -e "${BLUE}🔐 GitHub Secrets 一括設定${NC}"
echo "=================================================="
echo ""

# gh CLI の確認
if ! command -v gh &> /dev/null; then
  echo -e "${RED}❌ gh CLI が見つかりません。${NC}"
  echo "インストール方法: brew install gh"
  echo "ログイン方法:     gh auth login"
  exit 1
fi

# ログイン確認
if ! gh auth status >/dev/null 2>&1; then
  echo -e "${RED}❌ gh CLI にログインしていません。${NC}"
  echo "実行してください: gh auth login"
  exit 1
fi

# リポジトリ確認
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")
if [ -z "$REPO" ]; then
  echo -e "${YELLOW}GitHubリポジトリ名を入力してください (例: your-org/d-max):${NC}"
  read -r REPO
fi
echo -e "${YELLOW}対象リポジトリ: ${REPO}${NC}"
echo ""

# .env.local の確認
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}❌ .env.local が見つかりません: $ENV_FILE${NC}"
  exit 1
fi

# GCP セットアップ出力を読み込み
WIF_PROVIDER=""
SA_EMAIL=""
if [ -f "$GCP_OUTPUT" ]; then
  source "$GCP_OUTPUT"
  WIF_PROVIDER="${GCP_WORKLOAD_IDENTITY_PROVIDER:-}"
  SA_EMAIL="${GCP_SERVICE_ACCOUNT:-}"
  echo -e "${GREEN}✅ GCP セットアップ値を自動読み込みしました${NC}"
fi

# GCP 値が未設定の場合は手動入力
if [ -z "$WIF_PROVIDER" ]; then
  echo -e "${YELLOW}GCP_WORKLOAD_IDENTITY_PROVIDER を入力してください:${NC}"
  read -r WIF_PROVIDER
fi
if [ -z "$SA_EMAIL" ]; then
  echo -e "${YELLOW}GCP_SERVICE_ACCOUNT を入力してください:${NC}"
  read -r SA_EMAIL
fi

echo ""
echo -e "${BLUE}GitHub Secrets を設定中...${NC}"
echo ""

# ヘルパー関数: Secretを設定
set_secret() {
  local name="$1"
  local value="$2"
  if [ -n "$value" ] && [ "$value" != '""' ]; then
    echo "$value" | gh secret set "$name" --repo="$REPO"
    echo -e "  ${GREEN}✅ ${name}${NC}"
  else
    echo -e "  ${YELLOW}⚠️  ${name} の値が空です。スキップします。${NC}"
  fi
}

# .env.local から値を取得するヘルパー
get_env() {
  local key="$1"
  grep -E "^${key}=" "$ENV_FILE" 2>/dev/null | head -1 | sed 's/^[^=]*=//' | tr -d '"' | tr -d "'"
}

# -------------------------------------------------------
# GCP 認証情報
# -------------------------------------------------------
echo -e "${BLUE}[GCP 認証]${NC}"
set_secret "GCP_WORKLOAD_IDENTITY_PROVIDER" "$WIF_PROVIDER"
set_secret "GCP_SERVICE_ACCOUNT" "$SA_EMAIL"
echo ""

# -------------------------------------------------------
# データベース
# -------------------------------------------------------
echo -e "${BLUE}[データベース]${NC}"
set_secret "DATABASE_URL" "$(get_env DATABASE_URL)"
echo ""

# -------------------------------------------------------
# Firebase
# -------------------------------------------------------
echo -e "${BLUE}[Firebase]${NC}"
set_secret "NEXT_PUBLIC_FIREBASE_API_KEY"            "$(get_env NEXT_PUBLIC_FIREBASE_API_KEY)"
set_secret "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"        "$(get_env NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN)"
set_secret "NEXT_PUBLIC_FIREBASE_PROJECT_ID"         "$(get_env NEXT_PUBLIC_FIREBASE_PROJECT_ID)"
set_secret "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"     "$(get_env NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)"
set_secret "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" "$(get_env NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID)"
set_secret "NEXT_PUBLIC_FIREBASE_APP_ID"             "$(get_env NEXT_PUBLIC_FIREBASE_APP_ID)"
echo ""

# -------------------------------------------------------
# LINE
# -------------------------------------------------------
echo -e "${BLUE}[LINE]${NC}"
set_secret "LINE_CHANNEL_ACCESS_TOKEN"       "$(get_env LINE_CHANNEL_ACCESS_TOKEN)"
set_secret "LINE_CHANNEL_SECRET"             "$(get_env LINE_CHANNEL_SECRET)"
set_secret "NEXT_PUBLIC_LIFF_ID_INITIAL_LINK"  "$(get_env NEXT_PUBLIC_LIFF_ID_INITIAL_LINK)"
set_secret "NEXT_PUBLIC_LIFF_ID_QR_CODE"       "$(get_env NEXT_PUBLIC_LIFF_ID_QR_CODE)"
set_secret "NEXT_PUBLIC_LIFF_ID_APPOINTMENTS"  "$(get_env NEXT_PUBLIC_LIFF_ID_APPOINTMENTS)"
set_secret "NEXT_PUBLIC_LIFF_ID_FAMILY_REGISTER" "$(get_env NEXT_PUBLIC_LIFF_ID_FAMILY_REGISTER)"
set_secret "NEXT_PUBLIC_LIFF_ID_WEB_BOOKING"  "$(get_env NEXT_PUBLIC_LIFF_ID_WEB_BOOKING)"
echo ""

# -------------------------------------------------------
# Supabase
# -------------------------------------------------------
echo -e "${BLUE}[Supabase]${NC}"
set_secret "NEXT_PUBLIC_SUPABASE_URL"        "$(get_env NEXT_PUBLIC_SUPABASE_URL_PRODUCTION)"
set_secret "NEXT_PUBLIC_SUPABASE_ANON_KEY"   "$(get_env NEXT_PUBLIC_SUPABASE_ANON_KEY_PRODUCTION)"
set_secret "SUPABASE_SERVICE_ROLE_KEY"       "$(get_env SUPABASE_SERVICE_ROLE_KEY_PRODUCTION)"
echo ""

# -------------------------------------------------------
# 通知サービス
# -------------------------------------------------------
echo -e "${BLUE}[通知 (Resend / Twilio)]${NC}"
set_secret "RESEND_API_KEY"       "$(get_env RESEND_API_KEY)"
set_secret "TWILIO_ACCOUNT_SID"   "$(get_env TWILIO_ACCOUNT_SID)"
set_secret "TWILIO_AUTH_TOKEN"    "$(get_env TWILIO_AUTH_TOKEN)"
set_secret "TWILIO_FROM_NUMBER"   "$(get_env TWILIO_FROM_NUMBER)"
echo ""

# -------------------------------------------------------
# AWS Bedrock
# -------------------------------------------------------
echo -e "${BLUE}[AWS Bedrock]${NC}"
set_secret "AWS_ACCESS_KEY_ID"     "$(get_env AWS_ACCESS_KEY_ID)"
set_secret "AWS_SECRET_ACCESS_KEY" "$(get_env AWS_SECRET_ACCESS_KEY)"
echo ""

# -------------------------------------------------------
# 管理者・Cron
# -------------------------------------------------------
echo -e "${BLUE}[管理者・Cron]${NC}"
set_secret "ADMIN_EMAIL"          "$(get_env ADMIN_EMAIL)"
set_secret "ADMIN_PASSWORD"       "$(get_env ADMIN_PASSWORD)"
set_secret "ADMIN_SESSION_SECRET" "$(get_env ADMIN_SESSION_SECRET)"

# CRON_SECRET が未設定なら自動生成
CRON_SECRET_VAL="$(get_env CRON_SECRET)"
if [ -z "$CRON_SECRET_VAL" ]; then
  CRON_SECRET_VAL=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
  echo -e "  ${YELLOW}CRON_SECRET が未設定のため自動生成: ${CRON_SECRET_VAL}${NC}"
  echo -e "  ${YELLOW}.env.local にも追記します...${NC}"
  echo "" >> "$ENV_FILE"
  echo "CRON_SECRET=${CRON_SECRET_VAL}" >> "$ENV_FILE"
fi
set_secret "CRON_SECRET" "$CRON_SECRET_VAL"
echo ""

# -------------------------------------------------------
# 完了
# -------------------------------------------------------
echo -e "${GREEN}=================================================="
echo -e "✅ GitHub Secrets の設定が完了しました！"
echo -e "==================================================${NC}"
echo ""
echo -e "${YELLOW}次のステップ:${NC}"
echo "  1. git push origin main を実行してデプロイ開始"
echo "  2. GitHub Actions タブでビルドを確認"
echo "  3. デプロイ完了後に表示される Cloud Run URL を控える"
echo "  4. Firebase・LINE・LIFF の設定を Cloud Run URL に更新"
echo ""
echo -e "  ${BLUE}gh run watch${NC}  でリアルタイムにビルドを確認できます"
