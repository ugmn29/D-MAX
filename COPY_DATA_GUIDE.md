# ローカルデータを本番環境にコピーする方法

## ⚠️ 注意事項

- 開発環境のテストデータを本番環境にコピーすることになります
- 本当に必要な場合のみ実施してください
- 通常は、本番環境で新しくデータを入力する方が安全です

## 方法1: Supabase CLIでデータをエクスポート＆インポート

### ステップ1: ローカルSupabaseを起動

```bash
npx supabase start
```

### ステップ2: データをエクスポート

```bash
# スキーマとデータを両方エクスポート
npx supabase db dump --data-only -f local-data.sql

# または、特定のテーブルのみエクスポート
npx supabase db dump --data-only \
  -t public.clinics \
  -t public.staff \
  -t public.units \
  -t public.patients \
  -t public.treatment_menus \
  -t public.appointments \
  -f local-data.sql
```

### ステップ3: 本番環境にインポート

```bash
# データベースパスワードが必要
psql "postgresql://postgres:YOUR_PASSWORD@db.obdfmwpdkwraqqqyjgwu.supabase.co:5432/postgres" \
  -f local-data.sql
```

---

## 方法2: Supabase Table Editorで手動コピー

### 基本的な流れ：

1. ローカルSupabase Studio を開く
   ```bash
   npx supabase start
   # http://127.0.0.1:54323 にアクセス
   ```

2. 各テーブルのデータをCSVでエクスポート
   - Table Editor → テーブル選択 → Export → CSV

3. 本番Supabase Table Editorでインポート
   - https://supabase.com/dashboard/project/obdfmwpdkwraqqqyjgwu/editor
   - Table Editor → テーブル選択 → Import → CSV

### コピーする順番（外部キー制約を考慮）：

1. clinics
2. staff
3. units
4. treatment_menus
5. patients
6. appointments
7. その他のテーブル

---

## 方法3: 最小限のマスターデータだけコピー

実際の患者・予約データはコピーせず、マスターデータだけコピー：

### コピーするもの：
- ✅ スタッフ（staff）
- ✅ ユニット（units）
- ✅ 診療メニュー（treatment_menus）
- ✅ キャンセル理由（cancel_reasons）

### コピーしないもの：
- ❌ 患者（patients）- 本番で新規登録
- ❌ 予約（appointments）- 本番で新規作成
- ❌ 日次メモ（daily_memos）

### 実行手順：

1. ローカルでマスターデータをエクスポート：

```bash
npx supabase start

# マスターデータのみエクスポート
pg_dump "postgresql://postgres:postgres@127.0.0.1:54321/postgres" \
  --data-only \
  --table=public.staff \
  --table=public.units \
  --table=public.treatment_menus \
  --table=public.cancel_reasons \
  > master-data.sql
```

2. 本番環境にインポート：

```bash
psql "postgresql://postgres:YOUR_PASSWORD@db.obdfmwpdkwraqqqyjgwu.supabase.co:5432/postgres" \
  -f master-data.sql
```

---

## おすすめの方法

### 🥇 推奨: 本番環境で新規入力

本番環境は空の状態で開始し、実際に使いながらデータを入力：

**メリット**:
- クリーンな状態で開始
- テストデータが混ざらない
- 本番専用のIDで管理できる

**デメリット**:
- 初期セットアップに時間がかかる

---

### 🥈 次点: マスターデータのみコピー

スタッフ・ユニット・診療メニューなどの設定だけコピー：

**メリット**:
- 設定済みのマスターデータが使える
- 患者データは本番で新規登録

**デメリット**:
- 一部のデータは手動入力が必要

---

### 🥉 非推奨: 全データコピー

**デメリット**:
- テストデータが本番に混ざる
- IDの重複リスク
- データの整合性問題

---

## 実際の手順（推奨方法）

### ステップ1: quick-migration.sqlを実行

テーブル構造を作成（すでに完了）

### ステップ2: Vercel環境変数を設定

本番Supabaseに接続できるようにする

### ステップ3: アプリにアクセスして初期設定

1. https://d-max.vercel.app にアクセス
2. スタッフ管理画面でスタッフを登録
3. ユニット管理画面でユニットを登録
4. 診療メニュー管理画面でメニューを登録

### ステップ4: 実際に使い始める

患者登録・予約作成などを本番環境で行う

---

## どの方法がいいですか？

1. **本番環境で新規入力**（最も推奨）
2. **マスターデータのみコピー**（時間短縮）
3. **全データコピー**（非推奨、テストデータが混ざる）

どれを選びますか？
