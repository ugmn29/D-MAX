# 本番環境デプロイチェックリスト

## ✅ **完了した作業**

- ✅ コードをGitにコミット
- ✅ GitHubにプッシュ（main ブランチ）
- ✅ Vercel自動デプロイ開始

---

## 🔧 **次に実行すること（優先度順）**

### 1. **データベースマイグレーション実行** ⚠️ 最優先

本番環境のSupabaseでマイグレーションを実行してください。

#### アクセス先
https://supabase.com/dashboard/project/obdfmwpdkwraqqqyjgwu/sql

#### 実行するSQL
```sql
-- LINE関連テーブルのpatient_idをUUIDからTEXTに変更

ALTER TABLE line_invitation_codes
  DROP CONSTRAINT IF EXISTS line_invitation_codes_patient_id_fkey,
  ALTER COLUMN patient_id TYPE TEXT;

ALTER TABLE line_patient_linkages
  DROP CONSTRAINT IF EXISTS line_patient_linkages_patient_id_fkey,
  ALTER COLUMN patient_id TYPE TEXT;

ALTER TABLE patient_qr_codes
  DROP CONSTRAINT IF EXISTS patient_qr_codes_patient_id_fkey,
  ALTER COLUMN patient_id TYPE TEXT;

-- コメント追加
COMMENT ON COLUMN line_invitation_codes.patient_id IS '患者ID (TEXT型: patient_TIMESTAMP_RANDOM形式)';
COMMENT ON COLUMN line_patient_linkages.patient_id IS '患者ID (TEXT型: patient_TIMESTAMP_RANDOM形式)';
COMMENT ON COLUMN patient_qr_codes.patient_id IS '患者ID (TEXT型: patient_TIMESTAMP_RANDOM形式)';
```

---

### 2. **Vercelデプロイ確認**

#### アクセス先
https://vercel.com/ugmn29s-projects/d-max/deployments

#### 確認事項
- ✅ デプロイが「Ready」になっているか
- ✅ ビルドエラーがないか
- ✅ 本番URLにアクセスできるか

---

### 3. **LINE設定の登録**

本番環境の設定ページで以下を登録：

#### アクセス先（本番URL）
https://your-production-url.vercel.app/settings

#### 設定項目
- **Channel ID**: LINE公式アカウントのChannel ID
- **Channel Secret**: LINE公式アカウントのChannel Secret
- **Channel Access Token**: LINE Messaging APIのAccess Token
- **LIFF ID（5種類）**:
  - 初回連携: `NEXT_PUBLIC_LIFF_ID_INITIAL_LINK`
  - Web予約: `NEXT_PUBLIC_LIFF_ID_WEB_BOOKING`
  - 予約一覧: `NEXT_PUBLIC_LIFF_ID_APPOINTMENTS`
  - QRコード: `NEXT_PUBLIC_LIFF_ID_QR_CODE`
  - 家族登録: `NEXT_PUBLIC_LIFF_ID_FAMILY_REGISTER`
- **リッチメニューID**:
  - 連携済み用: LINE Developers Consoleで作成
  - 未連携用: LINE Developers Consoleで作成

---

### 4. **Vercel環境変数の設定**（オプション）

Cronジョブの認証用シークレットを設定：

#### アクセス先
https://vercel.com/ugmn29s-projects/d-max/settings/environment-variables

#### 追加する環境変数
```
CRON_SECRET=your-random-secret-key-here
```

---

### 5. **Vercel Cronジョブの設定**（オプション）

定期通知の自動送信を有効化する場合、`vercel.json` を作成：

```json
{
  "crons": [
    {
      "path": "/api/cron/send-scheduled-notifications",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

その後、再度デプロイ：
```bash
git add vercel.json
git commit -m "feat: Cronジョブ設定追加"
git push
```

---

### 6. **動作確認**

#### 招待コード発行テスト
1. 本番URLにアクセス
2. 患者一覧ページを開く
3. 任意の患者を選択
4. 「基本情報」タブ → 「LINE連携」セクション
5. 「招待コードを発行」ボタンをクリック
6. 招待コードが表示されることを確認

#### LINE連携テスト
1. LINE公式アカウントを友だち追加
2. リッチメニューから「初回登録」をタップ
3. 招待コードと生年月日を入力
4. 連携完了メッセージが表示されることを確認
5. リッチメニューが切り替わることを確認

#### 通知送信テスト
1. 患者詳細ページで「通知」タブを開く
2. 通知スケジュールを作成
3. 自動送信が有効な通知を作成
4. 送信時刻になったら自動的にLINEに通知が届くことを確認

---

## 📊 **デプロイステータス**

### コミット情報
- コミット: `48cc9d6`
- ブランチ: `main`
- メッセージ: "feat: LINE連携システム完全実装"

### 変更されたファイル
- 13 files changed
- 1727 insertions(+), 3 deletions(-)

### 新規作成されたファイル
- `lib/line/messaging.ts` - LINE送信ヘルパー
- `app/api/line/send-message/route.ts` - メッセージ送信API
- `app/api/line/send-notification/route.ts` - 通知送信API
- `app/api/line/switch-rich-menu/route.ts` - リッチメニュー切り替えAPI
- `app/api/line/patient-linkages/route.ts` - 連携情報取得API
- `app/api/cron/send-scheduled-notifications/route.ts` - 定期送信ジョブ
- `app/api/admin/migrate-line-tables/route.ts` - マイグレーションAPI
- `supabase/migrations/20251211000001_fix_line_patient_id_to_text.sql` - マイグレーション
- `docs/LINE_INTEGRATION_GUIDE.md` - 実装ガイド
- `MIGRATION_INSTRUCTIONS.md` - マイグレーション手順

---

## 🚀 **次のアクション**

1. **今すぐ**: Supabase Dashboardでマイグレーション実行
2. **その後**: Vercelデプロイ完了を確認
3. **最後**: 本番環境で招待コード発行をテスト

---

**デプロイは進行中です！まずはデータベースマイグレーションを実行してください。** 🎉
