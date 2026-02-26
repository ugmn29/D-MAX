#!/bin/bash
# Cloud Run デプロイに必要な GCP リソースをセットアップするスクリプト
# 実行前提: gcloud CLI がインストール済み・ログイン済みであること
#   gcloud auth login
#   gcloud config set project d-max-66011

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ID="d-max-66011"
REGION="asia-northeast1"
SERVICE_NAME="d-max"
REPO_NAME="d-max"
SA_NAME="github-actions-deploy"
SA_DISPLAY="GitHub Actions Deploy SA"
GITHUB_REPO="${GITHUB_REPO:-}"  # 例: your-org/d-max

echo -e "${BLUE}🚀 Cloud Run セットアップ開始${NC}"
echo "=================================================="
echo -e "${YELLOW}プロジェクト: ${PROJECT_ID}${NC}"
echo -e "${YELLOW}リージョン:   ${REGION}${NC}"
echo ""

# GITHUB_REPO の確認
if [ -z "$GITHUB_REPO" ]; then
  echo -e "${YELLOW}GitHubリポジトリ名を入力してください (例: your-org/d-max):${NC}"
  read -r GITHUB_REPO
fi

echo ""

# -------------------------------------------------------
# 1. 必要な API を有効化
# -------------------------------------------------------
echo -e "${BLUE}[1/6] GCP API を有効化中...${NC}"
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  iam.googleapis.com \
  iamcredentials.googleapis.com \
  cloudresourcemanager.googleapis.com \
  --project="$PROJECT_ID"
echo -e "${GREEN}✅ API 有効化完了${NC}"
echo ""

# -------------------------------------------------------
# 2. Artifact Registry リポジトリ作成
# -------------------------------------------------------
echo -e "${BLUE}[2/6] Artifact Registry リポジトリを作成中...${NC}"
if gcloud artifacts repositories describe "$REPO_NAME" \
    --location="$REGION" --project="$PROJECT_ID" >/dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  リポジトリ '${REPO_NAME}' は既に存在します。スキップします。${NC}"
else
  gcloud artifacts repositories create "$REPO_NAME" \
    --repository-format=docker \
    --location="$REGION" \
    --project="$PROJECT_ID" \
    --description="D-MAX app Docker images"
  echo -e "${GREEN}✅ Artifact Registry 作成完了${NC}"
fi
echo ""

# -------------------------------------------------------
# 3. サービスアカウント作成
# -------------------------------------------------------
echo -e "${BLUE}[3/6] サービスアカウントを作成中...${NC}"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

if gcloud iam service-accounts describe "$SA_EMAIL" \
    --project="$PROJECT_ID" >/dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  サービスアカウント '${SA_EMAIL}' は既に存在します。スキップします。${NC}"
else
  gcloud iam service-accounts create "$SA_NAME" \
    --display-name="$SA_DISPLAY" \
    --project="$PROJECT_ID"
  echo -e "${GREEN}✅ サービスアカウント作成完了${NC}"
fi

# IAM ロール付与
echo -e "${BLUE}   IAM ロールを付与中...${NC}"
for ROLE in \
  "roles/run.admin" \
  "roles/artifactregistry.writer" \
  "roles/iam.serviceAccountTokenCreator" \
  "roles/cloudsql.client"; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="$ROLE" \
    --quiet
done
echo -e "${GREEN}✅ IAM ロール付与完了${NC}"
echo ""

# -------------------------------------------------------
# 4. Workload Identity Federation セットアップ
# -------------------------------------------------------
echo -e "${BLUE}[4/6] Workload Identity Federation を設定中...${NC}"
POOL_NAME="github-pool"
PROVIDER_NAME="github-provider"

# プール作成
if gcloud iam workload-identity-pools describe "$POOL_NAME" \
    --location=global --project="$PROJECT_ID" >/dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  プール '${POOL_NAME}' は既に存在します。スキップします。${NC}"
else
  gcloud iam workload-identity-pools create "$POOL_NAME" \
    --location=global \
    --project="$PROJECT_ID" \
    --display-name="GitHub Actions Pool"
  echo -e "${GREEN}✅ WIF プール作成完了${NC}"
fi

# プロバイダー作成
POOL_RESOURCE="projects/$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')/locations/global/workloadIdentityPools/${POOL_NAME}"

if gcloud iam workload-identity-pools providers describe "$PROVIDER_NAME" \
    --workload-identity-pool="$POOL_NAME" \
    --location=global --project="$PROJECT_ID" >/dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  プロバイダー '${PROVIDER_NAME}' は既に存在します。スキップします。${NC}"
else
  gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_NAME" \
    --project="$PROJECT_ID" \
    --location=global \
    --workload-identity-pool="$POOL_NAME" \
    --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
    --attribute-condition="assertion.repository=='${GITHUB_REPO}'"
  echo -e "${GREEN}✅ WIF プロバイダー作成完了${NC}"
fi

# サービスアカウントに WIF バインディング
gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
  --project="$PROJECT_ID" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/${POOL_RESOURCE}/attribute.repository/${GITHUB_REPO}" \
  --quiet
echo -e "${GREEN}✅ WIF バインディング完了${NC}"
echo ""

# -------------------------------------------------------
# 5. 出力値を取得
# -------------------------------------------------------
echo -e "${BLUE}[5/6] GitHub Secrets に設定する値を生成中...${NC}"
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
WIF_PROVIDER="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_NAME}/providers/${PROVIDER_NAME}"

echo ""
echo -e "${GREEN}=================================================="
echo -e "✅ GCP セットアップ完了！"
echo -e "==================================================${NC}"
echo ""
echo -e "${YELLOW}以下の値を GitHub Secrets に設定してください:${NC}"
echo ""
echo -e "${BLUE}GCP_WORKLOAD_IDENTITY_PROVIDER${NC}"
echo "  ${WIF_PROVIDER}"
echo ""
echo -e "${BLUE}GCP_SERVICE_ACCOUNT${NC}"
echo "  ${SA_EMAIL}"
echo ""

# -------------------------------------------------------
# 6. GitHub Secrets セットアップスクリプトの案内
# -------------------------------------------------------
echo -e "${BLUE}[6/6] 次のステップ${NC}"
echo ""
echo "GitHub Secrets の一括設定は以下で実行できます:"
echo -e "${GREEN}  bash scripts/setup-github-secrets.sh${NC}"
echo ""
echo "その際、上記の GCP_WORKLOAD_IDENTITY_PROVIDER と GCP_SERVICE_ACCOUNT の"
echo "値を入力するプロンプトが表示されます。"
echo ""

# 値をファイルに保存（次のスクリプトが読み込む）
cat > .gcp-setup-output << EOF
GCP_WORKLOAD_IDENTITY_PROVIDER=${WIF_PROVIDER}
GCP_SERVICE_ACCOUNT=${SA_EMAIL}
EOF
echo -e "${YELLOW}値を .gcp-setup-output に保存しました（setup-github-secrets.sh が自動読み込みします）${NC}"
