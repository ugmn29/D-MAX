# マイグレーション実行手順

## 方法1: ローカルSupabase Studio（推奨）

### 前提条件
- ローカルSupabaseが起動していること（`npx supabase start`）

### 手順

#### 1. Supabase Studioを開く
ブラウザで http://127.0.0.1:54323 にアクセスします。

または、コマンドで開く：
```bash
open http://127.0.0.1:54323
```

#### 2. SQL Editorに移動
左サイドバーから「SQL Editor」をクリックします。

#### 3. マイグレーション1を実行
1. 「New query」をクリック
2. `supabase/migrations/026_add_evaluation_and_issue_system.sql` の内容を全てコピー&ペースト
3. 「Run」ボタンをクリック
4. 下部に成功メッセージが表示されることを確認

#### 4. マイグレーション2を実行
1. 「New query」をクリック
2. `supabase/migrations/027_insert_issue_and_evaluation_data.sql` の内容を全てコピー&ペースト
3. 「Run」ボタンをクリック
4. 下部に成功メッセージが表示されることを確認

---

## 方法2: Supabase Dashboard（本番環境）

### 前提条件
- Supabaseプロジェクトにログインできること
- SQL Editorへのアクセス権限があること

### 手順

#### 1. Supabase Dashboardにログイン
https://supabase.com/dashboard にアクセスしてログインしてください。

#### 2. プロジェクトを選択
D-MAXプロジェクトを選択します。

#### 3. SQL Editorを開く
左サイドバーから「SQL Editor」をクリックします。

#### 4. マイグレーション1を実行

「New query」をクリックして新しいクエリを作成し、以下のファイルの内容をコピー&ペーストして実行してください：

**ファイル:** `supabase/migrations/026_add_evaluation_and_issue_system.sql`

実行手順：
1. ファイルの内容を全てコピー
2. SQL Editorにペースト
3. 「Run」ボタンをクリック
4. 成功メッセージが表示されることを確認

#### 5. マイグレーション2を実行

同様に、次のファイルの内容をコピー&ペーストして実行してください：

**ファイル:** `supabase/migrations/027_insert_issue_and_evaluation_data.sql`

実行手順：
1. ファイルの内容を全てコピー
2. SQL Editorで新しいクエリを作成（または前のクエリを削除）
3. ペースト
4. 「Run」ボタンをクリック
5. 成功メッセージが表示されることを確認

### 確認

マイグレーションが正常に完了したか確認します：

```sql
-- 新しいテーブルが作成されたか確認
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'patient_issues',
  'issue_training_mappings',
  'patient_issue_records',
  'training_evaluations',
  'evaluation_issue_rules',
  'clinic_training_customizations'
);

-- 課題マスタが投入されたか確認（6件）
SELECT COUNT(*) FROM patient_issues;

-- 新規トレーニングが追加されたか確認（18件になっているはず）
SELECT COUNT(*) FROM trainings WHERE is_deleted = false;

-- トレーニング名を確認
SELECT training_name FROM trainings WHERE training_name IN ('舌小帯伸ばし', 'チューブ吸い');
```

### トラブルシューティング

#### エラー: "relation already exists"
すでにマイグレーションが実行済みです。問題ありません。

#### エラー: "permission denied"
データベースの権限を確認してください。プロジェクトのオーナーまたは管理者である必要があります。

#### エラー: "syntax error"
SQLファイルの内容が正しくコピーされているか確認してください。

## 完了確認

マイグレーション完了後、アプリケーションで以下の機能が使用できるようになります：

1. ✅ 来院時評価の記録
2. ✅ 課題の自動判定
3. ✅ 推奨トレーニングの提案
4. ✅ 評価履歴の表示（タイムライン）
5. ✅ 進捗グラフの表示
6. ✅ 課題管理
7. ✅ 評価基準のカスタマイズ

## 次のステップ

マイグレーション完了後：
1. 患者詳細画面で「来院時評価を記録」ボタンが表示されることを確認
2. 評価を記録して課題が自動判定されることを確認
3. 評価基準カスタマイズ画面（`/training/clinic/settings/evaluation-criteria`）にアクセスできることを確認
