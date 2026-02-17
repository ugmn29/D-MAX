# GCP Cloud SQL セットアップガイド

このガイドでは、歯科Bot（ShikaBot）アプリケーションをGCP Cloud SQLに接続するための手順を説明します。

## 前提条件

- gcloud CLIがインストールされている
- GCPプロジェクト `d-max-voice-input` へのアクセス権限
- ローカルにPrismaスキーマが生成済み

## セットアップ手順

### 1. Google Cloud認証

ターミナルで以下のコマンドを実行し、ブラウザで認証を完了させます。

```bash
gcloud auth login
```

### 2. Cloud SQLインスタンス作成

以下のコマンドでCloud SQLインスタンスを作成します：

```bash
./scripts/setup-cloud-sql.sh
```

このスクリプトは以下を自動実行します：
- Cloud SQL Admin APIの有効化
- PostgreSQL 16インスタンスの作成
- パブリックIPの有効化
- 接続許可設定（開発用に全IPを許可）
- データベース作成
- 接続情報の表示

**作成されるインスタンス仕様（開発用）:**
- インスタンス名: `shikabot-postgres`
- リージョン: `asia-northeast1`（東京）
- マシンタイプ: `db-f1-micro`（無料枠対象）
- ストレージ: 10GB SSD
- PostgreSQLバージョン: 16

**⏱ 作成時間**: 約5-10分

### 3. 接続情報を保存

スクリプト実行後に表示される接続情報をメモしてください：

```
接続名: d-max-voice-input:asia-northeast1:shikabot-postgres
パブリックIP: 34.84.XXX.XXX
ユーザー名: postgres
パスワード: [自動生成された32文字のパスワード]
データベース: postgres
ポート: 5432
```

### 4. 環境変数ファイルの作成

プロジェクトルートに `.env.production` を作成します：

```bash
# .env.production

# GCP Cloud SQL接続情報
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@YOUR_PUBLIC_IP:5432/postgres"

# その他の環境変数は .env.local からコピー
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
# ... など
```

### 5. Prismaスキーママイグレーション

Cloud SQLに127テーブルのスキーマを作成します：

```bash
# 本番環境のDATABASE_URLを使用
DATABASE_URL="postgresql://postgres:PASSWORD@PUBLIC_IP:5432/postgres" \
  npx prisma db push
```

**確認コマンド:**
```bash
DATABASE_URL="postgresql://postgres:PASSWORD@PUBLIC_IP:5432/postgres" \
  npx prisma db pull
```

### 6. マスターデータのインポート

エクスポート済みのマスターデータをCloud SQLにインポートします：

```bash
cd .master-data

# 環境変数を設定
export PGHOST=YOUR_PUBLIC_IP
export PGPORT=5432
export PGDATABASE=postgres
export PGUSER=postgres
export PGPASSWORD=YOUR_PASSWORD

# インポート実行
./import-master-data.sh
```

インポートされるデータ：
- トレーニング: 18件
- 問診票: 3件（質問249件）
- 通知テンプレート: 5件
- メモテンプレート: 4件
- 診療コード: 7件

### 7. 接続テスト

ローカル開発サーバーからCloud SQLに接続してテストします：

```bash
# .env.production を使用して起動
DATABASE_URL="postgresql://postgres:PASSWORD@PUBLIC_IP:5432/postgres" \
  npm run dev
```

ブラウザで http://localhost:3000 にアクセスし、以下を確認：
- ログインできる
- 患者一覧が表示される
- 予約一覧が表示される
- マスターデータ（診療メニュー、スタッフなど）が表示される

## カスタマイズ

### 本番用インスタンス作成

より高性能なインスタンスを作成する場合：

```bash
GCP_PROJECT_ID=d-max-voice-input \
DB_INSTANCE_NAME=shikabot-postgres-prod \
DB_TIER=db-custom-2-7680 \
DB_STORAGE_SIZE=20GB \
DB_BACKUP_ENABLED=true \
./scripts/setup-cloud-sql.sh
```

### 環境変数でカスタマイズ可能な項目

| 変数名 | デフォルト値 | 説明 |
|--------|-------------|------|
| `GCP_PROJECT_ID` | `d-max-voice-input` | GCPプロジェクトID |
| `DB_INSTANCE_NAME` | `shikabot-postgres` | インスタンス名 |
| `GCP_REGION` | `asia-northeast1` | リージョン |
| `DB_VERSION` | `POSTGRES_16` | PostgreSQLバージョン |
| `DB_TIER` | `db-f1-micro` | マシンタイプ |
| `DB_STORAGE_SIZE` | `10GB` | ストレージサイズ |
| `DB_ROOT_PASSWORD` | 自動生成 | rootパスワード |

## セキュリティ注意事項

### 開発環境
- ✅ 全IPからの接続を許可（`0.0.0.0/0`）
- ✅ パブリックIP使用

### 本番環境（推奨設定）
- ⚠️ 承認済みネットワークを制限（Cloud Runの静的IPのみ許可）
- ⚠️ Cloud SQL Proxyの使用を検討
- ⚠️ IAMデータベース認証の有効化
- ⚠️ SSL/TLS接続の強制

## トラブルシューティング

### 接続できない

```bash
# 1. インスタンスのステータス確認
gcloud sql instances describe shikabot-postgres \
  --project=d-max-voice-input

# 2. ファイアウォールルール確認
gcloud sql instances describe shikabot-postgres \
  --project=d-max-voice-input \
  --format="value(settings.ipConfiguration.authorizedNetworks)"

# 3. 接続テスト（psql経由）
psql "postgresql://postgres:PASSWORD@PUBLIC_IP:5432/postgres" -c "SELECT version();"
```

### パスワードを忘れた

```bash
# rootパスワードのリセット
gcloud sql users set-password postgres \
  --instance=shikabot-postgres \
  --project=d-max-voice-input \
  --password=NEW_PASSWORD
```

### インスタンスの削除

```bash
# 注意: データは完全に削除されます
gcloud sql instances delete shikabot-postgres \
  --project=d-max-voice-input
```

## コスト管理

### 無料枠
- `db-f1-micro`: 月750時間無料（1インスタンス）
- ストレージ: 30GB HDD無料（SSDは有料）

### 想定コスト（開発環境）
- `db-f1-micro` + 10GB SSD: 約 $10-15/月

### 想定コスト（本番環境）
- `db-custom-2-7680` + 20GB SSD + バックアップ: 約 $80-120/月

### コスト削減のヒント
- 開発環境は使用しない時は停止する
- 自動バックアップの保持期間を短くする（7日 → 3日）
- テスト環境と本番環境でインスタンスを分ける

## 次のステップ

Cloud SQL接続が完了したら：

1. Cloud Runへのデプロイ
2. カスタムドメインの設定
3. Cloud CDNの有効化
4. Cloud Monitoringのセットアップ
5. BigQueryとの連携（分析用）
