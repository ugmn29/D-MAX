# 歯科Bot (ShikaBot)

AI搭載の歯科予約・管理システム。SupabaseとGitをシームレスに連携させたNext.jsプロジェクトです。

## 🚀 セットアップ

### 1. リポジトリのクローン
```bash
git clone <your-repository-url>
cd shikabot
```

### 2. 依存関係のインストール
```bash
npm install
```

### 3. 環境変数の設定
```bash
# 環境変数ファイルをコピー
cp env.example .env.local

# .env.localファイルを編集してSupabaseの認証情報を入力
# - NEXT_PUBLIC_SUPABASE_URL: SupabaseプロジェクトのURL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY: Supabaseの匿名キー
# - SUPABASE_SERVICE_ROLE_KEY: Supabaseのサービスロールキー
```

### 4. Supabaseプロジェクトのリンク
```bash
# Supabaseプロジェクトにリンク
supabase link --project-ref <your-project-ref>

# ローカル開発環境を開始
supabase start
```

### 5. データベースマイグレーションの実行
```bash
# マイグレーションを適用
npm run db:push

# 型定義を生成
npm run types:generate
```

### 6. 開発サーバーの起動
```bash
npm run dev
```

## 🛠️ 利用可能なコマンド

### 開発
- `npm run dev` - 開発サーバーを起動
- `npm run build` - プロダクションビルド
- `npm run start` - プロダクションサーバーを起動

### Supabase
- `npm run db:start` - ローカルSupabaseを開始
- `npm run db:stop` - ローカルSupabaseを停止
- `npm run db:reset` - データベースをリセット
- `npm run db:push` - マイグレーションをプッシュ
- `npm run db:pull` - リモートからスキーマをプル
- `npm run db:diff` - データベースの差分を確認
- `npm run types:generate` - TypeScript型定義を生成
- `npm run studio` - Supabase Studioを開く

### Edge Functions
- `npm run functions:serve` - ローカルでEdge Functionsを実行
- `npm run functions:deploy` - Edge Functionsをデプロイ

## 🔧 Supabase Integration

このプロジェクトは以下のSupabase機能を統合しています：

- **データベース管理**: PostgreSQL + マイグレーション
- **認証**: ユーザー登録・ログイン
- **リアルタイム**: リアルタイムサブスクリプション
- **ストレージ**: ファイルアップロード
- **Edge Functions**: サーバーレス関数

## 🚀 CI/CD

GitHub Actionsを使用して自動デプロイが設定されています：

- **mainブランチへのプッシュ**: 本番環境に自動デプロイ
- **プルリクエスト**: プレビュー環境を作成

### 必要なGitHub Secrets

リポジトリのSettings > Secrets and variables > Actionsで以下を設定してください：

- `SUPABASE_ACCESS_TOKEN`: Supabaseアクセストークン
- `SUPABASE_PROJECT_REF`: Supabaseプロジェクト参照ID
- `NEXT_PUBLIC_SUPABASE_URL`: SupabaseプロジェクトURL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase匿名キー
- `SUPABASE_SERVICE_ROLE_KEY`: Supabaseサービスロールキー

## 📁 プロジェクト構造

```
shikabot/
├── .github/workflows/     # GitHub Actions設定
├── supabase/
│   ├── migrations/        # データベースマイグレーション
│   ├── seed/             # シードデータ
│   ├── functions/        # Edge Functions
│   └── config.toml       # Supabase設定
├── types/                # TypeScript型定義
└── ...                   # Next.jsアプリケーション
```

## 🔗 リンク

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)<!-- deploy test Thu Dec 18 09:45:53 JST 2025 -->
