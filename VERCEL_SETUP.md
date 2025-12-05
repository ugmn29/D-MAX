# Vercel環境変数設定ガイド

## 本番環境のSupabase認証情報

以下の認証情報を使用します：

- **Project URL**: `https://obdfmwpdkwraqqqyjgwu.supabase.co`
- **Project Ref**: `obdfmwpdkwraqqqyjgwu`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGZtd3Bka3dyYXFxcXlqZ3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MzM2OTQsImV4cCI6MjA4MDUwOTY5NH0.je0tI7XWplnlTHKdI9E4lAZihVizGfozIOV6Gl49XtM`
- **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGZtd3Bka3dyYXFxcXlqZ3d1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDkzMzY5NCwiZXhwIjoyMDgwNTA5Njk0fQ.9Wrs5wTgCC1gDujfydvO4xrA_IpNx6SCR_jLYgo8gLs`

## Vercel環境変数設定手順

### ステップ1: Vercelダッシュボードにアクセス

1. https://vercel.com にアクセスしてログイン
2. D-MAXプロジェクトを選択
3. 上部タブから **Settings** をクリック
4. 左サイドバーから **Environment Variables** を選択

### ステップ2: 環境変数を追加

以下の3つの環境変数を追加します。各変数について：

---

#### 1. NEXT_PUBLIC_SUPABASE_URL

- **Key (名前)**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value (値)**: `https://obdfmwpdkwraqqqyjgwu.supabase.co`
- **Environment (環境)**:
  - ✅ Production
  - ✅ Preview
  - ✅ Development

**追加方法:**
1. "Add Variable" または "Add New" ボタンをクリック
2. Key欄に `NEXT_PUBLIC_SUPABASE_URL` を入力
3. Value欄に `https://obdfmwpdkwraqqqyjgwu.supabase.co` を貼り付け
4. Production, Preview, Development すべてにチェック
5. "Save" をクリック

---

#### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY

- **Key (名前)**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value (値)**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGZtd3Bka3dyYXFxcXlqZ3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MzM2OTQsImV4cCI6MjA4MDUwOTY5NH0.je0tI7XWplnlTHKdI9E4lAZihVizGfozIOV6Gl49XtM`
- **Environment (環境)**:
  - ✅ Production
  - ✅ Preview
  - ✅ Development

**追加方法:**
1. "Add Variable" ボタンをクリック
2. Key欄に `NEXT_PUBLIC_SUPABASE_ANON_KEY` を入力
3. Value欄に上記のanon keyを貼り付け
4. Production, Preview, Development すべてにチェック
5. "Save" をクリック

---

#### 3. SUPABASE_SERVICE_ROLE_KEY

- **Key (名前)**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value (値)**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGZtd3Bka3dyYXFxcXlqZ3d1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDkzMzY5NCwiZXhwIjoyMDgwNTA5Njk0fQ.9Wrs5wTgCC1gDujfydvO4xrA_IpNx6SCR_jLYgo8gLs`
- **Environment (環境)**:
  - ✅ Production
  - ⬜ Preview (オプション)
  - ⬜ Development (オプション)

**⚠️ 重要**: この鍵は強力な権限を持つため、Production環境のみに設定することを推奨

**追加方法:**
1. "Add Variable" ボタンをクリック
2. Key欄に `SUPABASE_SERVICE_ROLE_KEY` を入力
3. Value欄に上記のservice role keyを貼り付け
4. **Production のみ** にチェック
5. "Save" をクリック

---

### ステップ3: 設定内容の確認

Environment Variables画面で、以下の3つの変数が表示されていることを確認：

```
✅ NEXT_PUBLIC_SUPABASE_URL         (Production, Preview, Development)
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY    (Production, Preview, Development)
✅ SUPABASE_SERVICE_ROLE_KEY        (Production)
```

## 次のステップ: Vercel再デプロイ

環境変数を追加した後は、必ず再デプロイが必要です：

### 方法1: Vercelダッシュボードから再デプロイ（推奨）

1. Vercel プロジェクトページに戻る
2. 上部タブから **Deployments** をクリック
3. 最新のデプロイメント（一番上）の右側にある **"..."** メニューをクリック
4. **"Redeploy"** を選択
5. **重要**: "Use existing Build Cache" の **チェックを外す**
6. **"Redeploy"** ボタンをクリック

### 方法2: Gitから新しいコミットをプッシュ

```bash
# 環境変数設定完了をコミット
git add .
git commit -m "Add production Supabase environment variables"
git push origin main
```

Vercelが自動的に新しいデプロイメントを開始します。

## デプロイメント確認

1. Deploymentsタブでデプロイメントのステータスを確認
2. "Building" → "Ready" になるまで待つ（通常2-3分）
3. デプロイメントが完了したら、本番URL（https://d-max.vercel.app）にアクセス
4. 通知設定画面で設定を保存してみる
5. エラーが出ないことを確認 ✅

## トラブルシューティング

### ビルドエラーが出る場合

1. Vercel Deploymentsタブでエラーログを確認
2. 環境変数の名前が正しいか確認（スペースや大文字小文字の間違い）
3. 環境変数の値が正しくコピーされているか確認（途中で切れていないか）

### 本番環境でまだエラーが出る場合

1. ブラウザのキャッシュをクリア（Cmd+Shift+R / Ctrl+Shift+R）
2. Vercelで "Use existing Build Cache" のチェックを外して再デプロイ
3. SupabaseでRLSポリシーが無効化されているか確認

### 環境変数が反映されない場合

- 必ず "Use existing Build Cache" のチェックを外して再デプロイ
- 環境変数を変更した後は、新しいビルドが必要です

## 確認コマンド（オプション）

ローカルで環境変数が正しいか確認：

```bash
# .env.local を確認（ローカル開発環境）
cat .env.local

# 本番環境の環境変数を確認（Vercelの場合）
# Vercelダッシュボード > Settings > Environment Variables で確認
```

## セキュリティ注意事項

⚠️ **SUPABASE_SERVICE_ROLE_KEY** は絶対に公開しないでください：
- Gitにコミットしない
- クライアント側のコードで使用しない
- `NEXT_PUBLIC_` プレフィックスを付けない
- サーバーサイドのAPIルートでのみ使用

✅ **NEXT_PUBLIC_SUPABASE_ANON_KEY** は公開されても問題ありません：
- クライアント側で使用される
- ブラウザに表示される
- RLSポリシーで保護される（本アプリでは無効化済み）
