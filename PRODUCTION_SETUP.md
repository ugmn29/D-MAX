# 本番環境セットアップガイド

## 1. Supabaseプロジェクト作成

1. https://supabase.com にアクセスしてログイン
2. "New Project" をクリック
3. プロジェクト名: `d-max-production` (任意)
4. データベースパスワードを設定（安全な場所に保存）
5. リージョンを選択（日本に近い場合は `Northeast Asia (Tokyo)` を推奨）
6. プロジェクトが作成されるまで待つ（2-3分）

## 2. Supabase認証情報を取得

プロジェクトが作成されたら：

1. Project Settings > API に移動
2. 以下の情報をコピー：
   - **Project URL** (例: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (長いトークン)
   - **service_role key** (Settings > API > service_role secret)

## 3. ローカルでSupabaseプロジェクトをリンク

ターミナルで以下を実行：

```bash
# Supabase CLIでログイン
npx supabase login

# プロジェクトをリンク
npx supabase link --project-ref YOUR_PROJECT_REF
```

**YOUR_PROJECT_REF** は、Project URLの `https://` と `.supabase.co` の間の部分です。
例: `https://abcdefghijk.supabase.co` → `abcdefghijk`

## 4. マイグレーションを本番環境に適用

```bash
# すべてのマイグレーションを本番環境にプッシュ
npx supabase db push
```

または、Supabaseダッシュボードから手動で適用：
1. SQL Editor に移動
2. 各マイグレーションファイルの内容をコピー&ペースト
3. 順番に実行（ファイル名の番号順）

## 5. Vercel環境変数を設定

Vercelダッシュボードで：

1. https://vercel.com にアクセス
2. D-MAXプロジェクトを選択
3. Settings > Environment Variables に移動
4. 以下の変数を追加：

### 追加する環境変数：

| 変数名 | 値 | 環境 |
|--------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ステップ2でコピーしたProject URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ステップ2でコピーしたanon key | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | ステップ2でコピーしたservice_role key | Production |

**重要**:
- `NEXT_PUBLIC_` で始まる変数はクライアント側でも使用されます
- `SUPABASE_SERVICE_ROLE_KEY` は機密情報なので、サーバー側のみで使用します

## 6. Vercelを再デプロイ

環境変数を設定したら：

1. Vercel Deploymentsタブに移動
2. 最新のデプロイメントの "..." メニューをクリック
3. "Redeploy" を選択
4. "Use existing Build Cache" のチェックを外す
5. "Redeploy" をクリック

または、GitHubに新しいコミットをプッシュして自動デプロイ

## 7. 動作確認

1. https://d-max.vercel.app にアクセス
2. 通知設定画面で設定を保存してみる
3. エラーが出ないことを確認
4. LINE連携機能をテスト

## トラブルシューティング

### マイグレーションエラーが出る場合

```bash
# マイグレーション状態を確認
npx supabase migration list

# 特定のマイグレーションを手動で適用
npx supabase db push --file supabase/migrations/ファイル名.sql
```

### Vercelで環境変数が反映されない

- 必ず "Use existing Build Cache" のチェックを外して再デプロイ
- ブラウザのキャッシュをクリア（Cmd+Shift+R / Ctrl+Shift+R）

### データベース接続エラー

- Supabase Project Settings > Database > Connection string を確認
- RLSポリシーが適切に設定されているか確認（多くのテーブルで無効化されています）

## 次のステップ

1. ✅ Supabaseプロジェクト作成
2. ✅ 認証情報取得
3. ⬜ プロジェクトリンク
4. ⬜ マイグレーション適用
5. ⬜ Vercel環境変数設定
6. ⬜ 再デプロイ
7. ⬜ 動作確認
