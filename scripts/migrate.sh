#!/bin/bash

# カラー出力用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Supabase マイグレーション実行スクリプト${NC}"
echo ""

# 環境選択
if [ "$1" == "local" ]; then
    echo -e "${YELLOW}📍 環境: ローカル${NC}"
    export $(cat .env.local | grep -v '^#' | xargs)
    supabase db push
elif [ "$1" == "remote" ] || [ "$1" == "production" ]; then
    echo -e "${YELLOW}📍 環境: 本番（リモート）${NC}"

    # .env.remote から環境変数を読み込み
    if [ ! -f .env.remote ]; then
        echo -e "${RED}❌ エラー: .env.remote ファイルが見つかりません${NC}"
        echo "以下の手順で設定してください："
        echo "1. .env.remote ファイルを作成"
        echo "2. Supabase Dashboard から以下の情報を取得："
        echo "   - NEXT_PUBLIC_SUPABASE_URL"
        echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
        echo "   - SUPABASE_SERVICE_ROLE_KEY"
        echo "   - SUPABASE_DB_PASSWORD"
        exit 1
    fi

    export $(cat .env.remote | grep -v '^#' | xargs)

    # パスワード確認
    if [ -z "$SUPABASE_DB_PASSWORD" ]; then
        echo -e "${YELLOW}⚠️  データベースパスワードが設定されていません${NC}"
        echo "Supabase Dashboard → Settings → Database でパスワードを確認してください"
        echo ""
        read -sp "データベースパスワードを入力: " DB_PASSWORD
        echo ""
        export SUPABASE_DB_PASSWORD=$DB_PASSWORD
    fi

    # 接続URL構築
    PROJECT_REF="pgvozzkedpqhnjhzneuh"

    # Direct Connection (Port 5432) を使用
    DB_URL="postgresql://postgres.${PROJECT_REF}:${SUPABASE_DB_PASSWORD}@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"

    echo -e "${GREEN}✅ 本番データベースに接続します...${NC}"

    # マイグレーション実行
    supabase db push --db-url "$DB_URL"

elif [ "$1" == "status" ]; then
    echo -e "${YELLOW}📊 マイグレーション状態を確認中...${NC}"
    supabase migration list
else
    echo -e "${YELLOW}使い方:${NC}"
    echo "  ./scripts/migrate.sh local       # ローカル環境"
    echo "  ./scripts/migrate.sh remote      # 本番環境"
    echo "  ./scripts/migrate.sh production  # 本番環境（remoteと同じ）"
    echo "  ./scripts/migrate.sh status      # マイグレーション状態確認"
    echo ""
    echo -e "${YELLOW}例:${NC}"
    echo "  ./scripts/migrate.sh remote      # 本番DBにマイグレーション実行"
    exit 1
fi

# 結果確認
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ マイグレーション完了！${NC}"
    echo ""
    echo "次のステップ:"
    echo "1. Supabase Dashboard でテーブル作成を確認"
    echo "2. アプリケーションをテスト"
else
    echo ""
    echo -e "${RED}❌ マイグレーションに失敗しました${NC}"
    echo ""
    echo "トラブルシューティング:"
    echo "1. Supabase Dashboard → Settings → Database でパスワードを確認"
    echo "2. プロジェクトが一時停止していないか確認"
    echo "3. --debug フラグを付けて再実行: supabase db push --debug"
fi
