# 本番環境マイグレーション セットアップガイド

## 目的
Vercel環境変数を設定して、API経由で本番データベースのマイグレーションを実行できるようにする

## メリット
- ✅ 自動化可能（CI/CD統合）
- ✅ チーム全員が使える
- ✅ セキュア（パスワード共有不要）
- ✅ 環境の一貫性が保たれる
- ✅ 実行ログが残る

---

## セットアップ手順

### 1. Supabaseでデータベースパスワードを確認

1. Supabaseダッシュボードを開く:
   https://supabase.com/dashboard/project/obdfmwpdkwraqqqyjgwu/settings/database

2. **Connection string** セクションを探す

3. **Transaction pooler** (推奨) を選択

4. 接続文字列が表示される:
   ```
   postgresql://postgres.obdfmwpdkwraqqqyjgwu:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
   ```

5. `[YOUR-PASSWORD]` の部分をコピー

**もしパスワードが不明な場合**:
- 同じページの **Reset Database Password** ボタンをクリック
- 新しいパスワードが生成される
- **⚠️ 重要**: 新しいパスワードは一度しか表示されないので、必ずコピーすること

---

### 2. Vercelに環境変数を設定

1. Vercelダッシュボードを開く:
   https://vercel.com/ugmn29s-projects/d-max/settings/environment-variables

2. **Add New** ボタンをクリック

3. 以下を入力:
   - **Key**: `SUPABASE_DB_PASSWORD`
   - **Value**: (ステップ1でコピーしたパスワード)
   - **Environments**:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
     すべてチェック

4. **Save** をクリック

---

### 3. Vercelを再デプロイ

環境変数を追加しただけでは、既存のデプロイには反映されません。
再デプロイが必要です。

#### 方法A: Git経由で再デプロイ（推奨）

```bash
git commit --allow-empty -m "chore: trigger redeploy for SUPABASE_DB_PASSWORD env var"
git push
```

#### 方法B: Vercelダッシュボードから再デプロイ

1. https://vercel.com/ugmn29s-projects/d-max/deployments を開く
2. 最新のデプロイの右側にある「...」メニューをクリック
3. **Redeploy** をクリック
4. **Use existing Build Cache** のチェックを**外す**
5. **Redeploy** をクリック

---

### 4. デプロイ完了を待つ

通常1-2分で完了します。

Vercelダッシュボードで「Ready」と表示されたら完了です。

---

## マイグレーション実行方法

セットアップが完了したら、以下のコマンドでマイグレーションを実行できます:

```bash
node run-migration-pg-api.mjs
```

### 実行例

```bash
$ node run-migration-pg-api.mjs

🚀 マイグレーション実行開始
環境: https://dmax-mu.vercel.app
ファイル: 20251210000004_add_original_patient_data_to_questionnaire_responses.sql
エンドポイント: /api/migrations/run-pg (pgライブラリ使用)

✅ マイグレーション実行成功!

メッセージ: マイグレーション実行完了
実行結果:
  コマンド: ALTER TABLE
  影響行数: 0

🎉 original_patient_dataカラムが正常に追加されました!

次のステップ:
1. 確認: source .env.local && node check-original-data.mjs
2. 新しい予約を作成してテストしてください
3. 問診票を連携して、その後連携解除してみてください
4. 患者名が元の予約時の名前に戻ることを確認してください
```

---

## トラブルシューティング

### エラー: "Tenant or user not found"

**原因**: データベースパスワードが正しく設定されていない

**解決方法**:
1. Vercel環境変数を確認
2. パスワードが正しいか確認
3. 再デプロイを実行

### エラー: "SUPABASE_DB_PASSWORD is not set"

**原因**: 環境変数が設定されていないか、再デプロイされていない

**解決方法**:
1. Vercel環境変数を確認
2. 再デプロイを実行

### 新しいマイグレーションファイルを実行したい

`run-migration-pg-api.mjs` の6行目を編集:

```javascript
const MIGRATION_FILE = '新しいマイグレーションファイル名.sql'
```

---

## 今後の使い方

1. マイグレーションファイルを作成:
   ```
   supabase/migrations/YYYYMMDDHHMMSS_description.sql
   ```

2. Git にコミット&プッシュ:
   ```bash
   git add supabase/migrations/
   git commit -m "feat: add new migration"
   git push
   ```

3. マイグレーション実行:
   ```bash
   node run-migration-pg-api.mjs
   ```

4. 確認:
   ```bash
   # 適切な確認スクリプトを実行
   ```

---

## セキュリティ注意事項

- ✅ データベースパスワードは `.env` ファイルに保存しない（gitignore済み）
- ✅ パスワードは Vercel環境変数として管理
- ✅ チームメンバーにはパスワードを共有せず、Vercelへのアクセス権を付与
- ✅ 定期的にパスワードをローテーション

---

## まとめ

このセットアップにより:
- 🚀 コマンド1つでマイグレーション実行
- 🔒 セキュアな環境変数管理
- 👥 チーム全員が同じ方法で実行可能
- 📝 実行ログが Vercel に記録される
- 🔄 CI/CD パイプラインに統合可能

これで本番環境のマイグレーションが安全かつ効率的に実行できるようになります！
