# Supabase データベースパスワードの見つけ方

## 手順

### 1. Supabaseダッシュボードを開く

まず、プロジェクトのダッシュボードを開きます:
https://supabase.com/dashboard/project/obdfmwpdkwraqqqyjgwu

### 2. Settings（設定）に移動

左サイドバーの一番下にある **⚙️ Settings** をクリック

### 3. Database を選択

Settings内の **Database** タブをクリック

直接リンク:
https://supabase.com/dashboard/project/obdfmwpdkwraqqqyjgwu/settings/database

### 4. Connection string（接続文字列）を見つける

ページを下にスクロールすると、以下のセクションがあります:

```
Connection string
```

その下に、いくつかのタブがあります:
- **URI** (推奨)
- Postgres
- JDBC
- .NET

### 5. 接続方法を選択

**URI** タブが選択されていることを確認します。

さらに、以下のいずれかを選択:

#### Option A: Transaction pooler (推奨) ⭐

```
Use connection pooling
Session pooler / Transaction pooler
```

**Transaction pooler** を選択すると、以下のような接続文字列が表示されます:

```
postgresql://postgres.obdfmwpdkwraqqqyjgwu:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
```

#### Option B: Direct connection

直接接続の場合:

```
postgresql://postgres.obdfmwpdkwraqqqyjgwu:[YOUR-PASSWORD]@db.obdfmwpdkwraqqqyjgwu.supabase.co:5432/postgres
```

### 6. パスワード部分を確認

`[YOUR-PASSWORD]` の部分が実際のパスワードです。

**もし `[YOUR-PASSWORD]` と表示されている場合**:
- これはパスワードが隠されている状態です
- 右側に **👁️ Show password** のようなボタンがあるはずです
- それをクリックすると実際のパスワードが表示されます

**もしパスワードが表示されない/わからない場合**:
1. 同じページの下の方に **Reset Database Password** ボタンがあります
2. それをクリックすると新しいパスワードが生成されます
3. ⚠️ **重要**: 新しいパスワードは一度しか表示されないので、必ずコピーしてください

---

## 見つからない場合

もし上記の手順で見つからない場合は、以下をお試しください:

### 別の方法: API Settings から取得

1. Settings > API に移動
   https://supabase.com/dashboard/project/obdfmwpdkwraqqqyjgwu/settings/api

2. **Project API keys** セクションを探す

3. しかし、ここにはデータベースパスワードはありません
   （データベースパスワードは Settings > Database にのみあります）

---

## パスワードをリセットする方法（最も簡単）

パスワードが見つからない場合、リセットするのが最も簡単です:

1. Settings > Database に移動
   https://supabase.com/dashboard/project/obdfmwpdkwraqqqyjgwu/settings/database

2. ページを下にスクロール

3. **Database password** セクションを探す

4. **Reset Database Password** ボタンをクリック

5. 新しいパスワードが生成されます（例: `abc123def456...`）

6. **必ずコピーしてください**（一度しか表示されません）

7. このパスワードを Vercel環境変数に設定します

---

## よくある質問

### Q: パスワードをリセットすると既存の接続に影響しますか？

A: はい、影響します。以下を更新する必要があります:
- Vercel環境変数の `SUPABASE_DB_PASSWORD`
- ローカルの `.env.production.local`（もし使っている場合）

### Q: API KeyとDatabase Passwordの違いは？

A:
- **API Key** (anon key / service role key): Supabase REST API用
- **Database Password**: PostgreSQL データベースへの直接接続用

今回必要なのは **Database Password** です。

### Q: どこに保存すればいいですか？

A:
- ✅ Vercel環境変数（推奨）
- ✅ パスワードマネージャー（1Password, LastPassなど）
- ❌ Gitリポジトリ（絶対にダメ！）
- ❌ Slackやメール（セキュリティリスク）

---

## 次のステップ

パスワードを取得したら:

1. Vercel環境変数に設定
   https://vercel.com/ugmn29s-projects/d-max/settings/environment-variables

2. 再デプロイ

3. マイグレーション実行
   ```bash
   node run-migration-pg-api.mjs
   ```
