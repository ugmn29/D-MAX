# 環境切り替えガイド

このプロジェクトでは、ローカルSupabaseと本番Supabaseを**自動的に**切り替えられます。

## 🚀 クイックスタート

### ローカル環境で開発（デフォルト）

```bash
npm run dev:local
```

または単に

```bash
npm run dev
```

- ローカルのSupabaseインスタンス（http://127.0.0.1:54321）に接続
- Supabaseローカル環境を自動起動
- ポート: 3000

### 本番環境に接続して開発

```bash
npm run dev:production
```

- 本番のSupabase（https://pgvozzkedpqhnjhzneuh.supabase.co）に接続
- 本番データベースを直接操作（⚠️ 注意！）
- ポート: 3001（ローカルと同時起動可能）

## 🔄 環境の自動切り替え

`.env.local`の`USE_PRODUCTION`フラグで自動的に切り替わります：

```bash
# ローカル環境（デフォルト）
USE_PRODUCTION=false

# 本番環境に切り替え
USE_PRODUCTION=true
```

**手動で切り替える場合:**

1. `.env.local`を開く
2. `USE_PRODUCTION=false`を`USE_PRODUCTION=true`に変更
3. 開発サーバーを再起動

## 📁 環境ファイルの説明

- `.env.local` - **メイン設定ファイル**（自動切り替え対応）
  - `USE_PRODUCTION=false` → ローカル環境
  - `USE_PRODUCTION=true` → 本番環境
- `.env.local.development` - ローカル環境のバックアップ
- `.env.local.production` - 本番環境のバックアップ
- `.env.remote` - レガシー設定ファイル

## ⚠️ 注意事項

### 本番環境に接続する際の注意
- `dev:production`または`USE_PRODUCTION=true`を使用すると、**本番データベースに直接アクセス**します
- データの変更・削除には十分注意してください
- テストデータの作成は避けてください
- できる限りローカル環境で開発してください

### Supabaseローカル環境
- `dev:local`を使用する前に、Supabaseがインストールされている必要があります
- 初回起動時は時間がかかる場合があります
- ローカルSupabaseが起動していない場合、自動的に起動します

## 🔍 現在の接続先を確認

アプリ起動時、コンソールに以下のように表示されます:

```
🔌 Supabase接続先: ローカル環境
📍 URL: http://127.0.0.1:54321
```

または

```
🔌 Supabase接続先: 本番環境
📍 URL: https://pgvozzkedpqhnjhzneuh.supabase.co
```

## 💡 ベストプラクティス

1. **基本はローカル環境で開発**
   ```bash
   npm run dev
   ```

2. **本番データの確認が必要な時だけ本番接続**
   ```bash
   npm run dev:production
   ```

3. **両方同時に起動して比較**
   - ターミナル1: `npm run dev:local` (ポート3000)
   - ターミナル2: `npm run dev:production` (ポート3001)
