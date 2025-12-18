# Vercel自動デプロイ設定ガイド

## 方法1: VercelのGitHub統合（推奨・最も簡単）

これは最も簡単で確実な方法です。VercelがGitHubリポジトリを直接監視し、プッシュのたびに自動的にデプロイします。

### 設定手順

1. **Vercelダッシュボードにアクセス**
   - https://vercel.com にアクセスしてログイン
   - D-MAXプロジェクトを選択

2. **GitHubリポジトリを接続**
   - **Settings** タブをクリック
   - **Git** セクションを確認
   - もしGitHubリポジトリが接続されていない場合：
     - **Connect Git Repository** をクリック
     - GitHubアカウントを認証
     - `ugmn29/D-MAX` リポジトリを選択
     - **Connect** をクリック

3. **自動デプロイの確認**
   - **Settings** > **Git** で以下が設定されていることを確認：
     - Production Branch: `main`
     - Automatic deployments from Git: **有効**

4. **テスト**
   - この設定が完了すると、`main` ブランチにプッシュするたびに自動的にデプロイされます

---

## 方法2: GitHub Actions + Vercel CLI（現在の設定）

GitHub Actionsを使ってVercel CLIでデプロイする方法です。以下のSecretsをGitHubに設定する必要があります。

### 必要なGitHub Secrets

GitHubリポジトリの **Settings** > **Secrets and variables** > **Actions** で以下を追加：

1. **VERCEL_TOKEN**
   - Vercelダッシュボード > **Settings** > **Tokens** で新しいトークンを作成
   - トークンをコピーしてGitHub Secretsに追加

2. **VERCEL_ORG_ID**
   - Vercelダッシュボード > **Settings** > **General** で確認
   - または、`vercel whoami` コマンドで確認

3. **VERCEL_PROJECT_ID**
   - プロジェクトID: `prj_7Zh9NIVjz82QhHmCuk1n8yWgtp34`（vercel-deploy.ymlから取得）

### Vercelトークンの取得方法

1. Vercelダッシュボードにアクセス
2. 右上のアバターをクリック > **Settings**
3. 左サイドバーから **Tokens** を選択
4. **Create Token** をクリック
5. トークン名を入力（例: "GitHub Actions Deploy"）
6. スコープを選択（**Full Account** を推奨）
7. **Create** をクリック
8. 表示されたトークンをコピー（一度しか表示されません）

### Vercel ORG_IDの取得方法

1. Vercelダッシュボード > **Settings** > **General**
2. **Team ID** または **Personal Account ID** をコピー
3. または、以下のコマンドで確認：
   ```bash
   vercel whoami
   ```

### GitHub Secretsの設定手順

1. GitHubリポジトリ（https://github.com/ugmn29/D-MAX）にアクセス
2. **Settings** タブをクリック
3. 左サイドバーから **Secrets and variables** > **Actions** を選択
4. **New repository secret** をクリック
5. 以下の3つのSecretsを追加：
   - Name: `VERCEL_TOKEN` / Value: （上記で取得したトークン）
   - Name: `VERCEL_ORG_ID` / Value: （上記で取得したORG ID）
   - Name: `VERCEL_PROJECT_ID` / Value: `prj_7Zh9NIVjz82QhHmCuk1n8yWgtp34`

---

## 推奨される方法

**方法1（VercelのGitHub統合）を強く推奨します。**
- 設定が簡単
- 追加のSecrets設定が不要
- Vercelが自動的にGitHubの変更を検知
- プレビューデプロイも自動的に作成される

---

## トラブルシューティング

### 自動デプロイが動作しない場合

1. **Vercelダッシュボードで確認**
   - **Deployments** タブで最新のデプロイメントを確認
   - エラーメッセージがあるか確認

2. **GitHub Actionsの実行状況を確認**
   - GitHubリポジトリ > **Actions** タブでワークフローの実行状況を確認
   - エラーがある場合はログを確認

3. **VercelとGitHubの接続を確認**
   - Vercelダッシュボード > **Settings** > **Git** で接続状態を確認

4. **ブランチ名を確認**
   - デフォルトブランチが `main` であることを確認

---

## テスト方法

1. 小さな変更を加える（例: READMEの更新）
2. コミットしてプッシュ：
   ```bash
   git add .
   git commit -m "Test: Auto-deploy test"
   git push origin main
   ```
3. Vercelダッシュボードの **Deployments** タブで新しいデプロイメントが開始されることを確認
4. 数分待って、デプロイメントが完了することを確認

