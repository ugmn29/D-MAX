# LINE連携システム 実装ガイド

## 📋 目次

1. [概要](#概要)
2. [実装済み機能](#実装済み機能)
3. [セットアップ手順](#セットアップ手順)
4. [API仕様](#api仕様)
5. [使い方](#使い方)
6. [トラブルシューティング](#トラブルシューティング)

---

## 概要

D-MAXシステムにLINE連携機能を統合し、以下を実現します：

- 患者とLINEアカウントの紐付け
- LINE経由での予約作成・確認・キャンセル
- LINE通知の自動送信（予約リマインド、定期検診など）
- リッチメニューの動的切り替え

---

## 実装済み機能

### ✅ **1. 招待コード発行・管理システム**

#### API
- `POST /api/line/invitation-codes` - 招待コード発行
- `GET /api/line/invitation-codes?patient_id=xxx` - 招待コード取得
- `DELETE /api/line/invitation-codes?id=xxx` - 招待コード無効化

#### 機能
- 8桁の招待コード生成（例: AB12-CD34）
- 有効期限管理（デフォルト30日間）
- ステータス管理（pending/used/expired）

---

### ✅ **2. 患者連携システム**

#### API
- `POST /api/line/link-patient` - 招待コード検証＆患者連携
- `GET /api/line/link-patient?line_user_id=xxx` - LINE User IDから患者情報取得
- `DELETE /api/line/link-patient?linkage_id=xxx` - 連携解除
- `GET /api/line/patient-linkages?patient_id=xxx` - 患者IDから連携情報取得

#### 機能
- 招待コード + 生年月日による本人確認
- LINE User ID ⇔ 患者ID の紐付け
- 家族アカウント対応（複数患者連携）
- QRコード自動生成

---

### ✅ **3. LINE通知送信システム**

#### API
- `POST /api/line/send-message` - シンプルなメッセージ送信
- `POST /api/line/send-notification` - テンプレート通知送信
- `GET /api/cron/send-scheduled-notifications` - 定期送信ジョブ

#### 通知タイプ
- **予約リマインド** (`appointment_reminder`)
  - Flex Messageでリッチな表示
  - 予約変更・キャンセルボタン付き
- **定期検診** (`periodic_checkup`)
  - 最終来院日表示
  - Web予約ボタン付き
- **治療リマインド** (`treatment_reminder`)
  - シンプルなテキストメッセージ
- **カスタム通知** (`custom`)
  - 自由形式のメッセージ

---

### ✅ **4. リッチメニュー切り替え**

#### API
- `POST /api/line/switch-rich-menu` - リッチメニュー切り替え

#### 機能
- 連携済み/未連携で異なるリッチメニューを表示
- 連携完了時に自動切り替え

---

### ✅ **5. LIFFページ（全5ページ）**

| ページ | パス | 機能 |
|--------|------|------|
| 初回登録 | `/liff/initial-link` | 招待コード入力で患者連携 |
| Web予約 | `/liff/web-booking` | 連携患者を選択して予約作成 |
| 予約一覧 | `/liff/appointments` | 予約確認・キャンセル |
| QRコード | `/liff/qr-code` | QRコード表示 |
| 家族登録 | `/liff/family-register` | 家族アカウント連携 |

---

## セットアップ手順

### 1. データベースマイグレーション

**重要**: LINE関連テーブルの`patient_id`をTEXT型に変更する必要があります。

#### Supabase Dashboardで実行

https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql にアクセスして以下のSQLを実行：

```sql
-- LINE関連テーブルのpatient_idをTEXT型に変更
ALTER TABLE line_invitation_codes
  DROP CONSTRAINT IF EXISTS line_invitation_codes_patient_id_fkey,
  ALTER COLUMN patient_id TYPE TEXT;

ALTER TABLE line_patient_linkages
  DROP CONSTRAINT IF EXISTS line_patient_linkages_patient_id_fkey,
  ALTER COLUMN patient_id TYPE TEXT;

ALTER TABLE patient_qr_codes
  DROP CONSTRAINT IF EXISTS patient_qr_codes_patient_id_fkey,
  ALTER COLUMN patient_id TYPE TEXT;
```

### 2. 環境変数設定

`.env.local` に以下を追加：

```bash
# LINE設定
NEXT_PUBLIC_LIFF_ID_INITIAL_LINK=2008448369-xxxxxxxx
NEXT_PUBLIC_LIFF_ID_WEB_BOOKING=2008448369-yyyyyyyy
NEXT_PUBLIC_LIFF_ID_APPOINTMENTS=2008448369-zzzzzzzz
NEXT_PUBLIC_LIFF_ID_QR_CODE=2008448369-aaaaaaaa
NEXT_PUBLIC_LIFF_ID_FAMILY_REGISTER=2008448369-bbbbbbbb

# Cron認証（本番環境のみ）
CRON_SECRET=your-secret-key
```

### 3. LINE設定をクリニック設定に登録

設定ページ（`/settings`）の「通知設定」セクションで以下を設定：

- **Channel ID**
- **Channel Secret**
- **Channel Access Token**
- **LIFF ID（5種類）**
- **リッチメニューID（連携済み/未連携）**

---

## API仕様

### 招待コード発行

```bash
POST /api/line/invitation-codes
Content-Type: application/json

{
  "patient_id": "patient_1234567890_abc",
  "clinic_id": "11111111-1111-1111-1111-111111111111",
  "created_by": "staff-uuid",
  "expires_in_days": 30
}
```

**レスポンス**:
```json
{
  "invitation_code": "AB12-CD34",
  "expires_at": "2025-01-10T12:00:00Z",
  "is_new": true
}
```

---

### 患者連携

```bash
POST /api/line/link-patient
Content-Type: application/json

{
  "line_user_id": "U1234567890abcdef",
  "invitation_code": "AB12-CD34",
  "birth_date": "1990-01-01"
}
```

**レスポンス**:
```json
{
  "success": true,
  "linkage": {
    "id": "linkage-uuid",
    "patient": {
      "id": "patient_1234567890_abc",
      "name": "山田 太郎",
      "patient_number": 1001
    },
    "is_primary": true,
    "linked_at": "2024-12-11T12:00:00Z"
  }
}
```

---

### LINE通知送信

```bash
POST /api/line/send-notification
Content-Type: application/json

{
  "clinic_id": "11111111-1111-1111-1111-111111111111",
  "patient_id": "patient_1234567890_abc",
  "notification_type": "appointment_reminder",
  "custom_data": {
    "appointment_date": "2024-12-15",
    "appointment_time": "14:00",
    "treatment_menu_name": "定期検診",
    "web_booking_url": "https://example.com/liff/appointments"
  }
}
```

**レスポンス**:
```json
{
  "success": true,
  "message": "LINE通知を送信しました",
  "sent_to": "U1234567890abcdef"
}
```

---

## 使い方

### 1. 招待コード発行（医院スタッフ）

1. 患者詳細ページを開く
2. 「基本情報」タブ → 「LINE連携」セクション
3. 「招待コードを発行」ボタンをクリック
4. 8桁の招待コードが表示される
5. 患者に伝える（印刷・コピー・QRコード）

### 2. 患者連携（患者）

1. LINE公式アカウントを友だち追加
2. リッチメニューから「初回登録」をタップ
3. LIFFページ（`/liff/initial-link`）が開く
4. 招待コード + 生年月日を入力
5. 「連携する」ボタンをクリック
6. 連携完了メッセージが表示される
7. リッチメニューが「連携済み用」に自動切り替え

### 3. 予約作成（患者）

1. LINEリッチメニュー「予約する」をタップ
2. LIFFページ（`/liff/web-booking`）が開く
3. 連携患者を選択
4. 日時・診療メニューを選択
5. 予約完了

### 4. 通知送信（自動）

通知スケジュールに登録されている通知は、Cronジョブにより自動送信されます：

**Cronジョブ設定例（Vercel）**:

`vercel.json`:
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

---

## トラブルシューティング

### 招待コード発行時に「保存に失敗しました」エラー

**原因**: `line_invitation_codes`テーブルの`patient_id`カラムがUUID型のまま

**解決方法**: 上記のマイグレーションSQLを実行

---

### LINE送信時に「Channel Access Tokenが設定されていません」エラー

**原因**: クリニック設定にLINE設定が未登録

**解決方法**:
1. `/settings` ページを開く
2. 「通知設定」セクション
3. LINE Channel Access Tokenを入力
4. 保存

---

### リッチメニューが切り替わらない

**原因**: リッチメニューIDが未設定

**解決方法**:
1. LINE Developers Consoleでリッチメニューを作成
2. リッチメニューIDを取得
3. `/settings` ページで登録
   - 連携済み用: `line_registered_rich_menu_id`
   - 未連携用: `line_unregistered_rich_menu_id`

---

## まとめ

LINE連携システムの実装が完了しました！

### 次のステップ

1. **データベースマイグレーション実行**
2. **招待コード発行をテスト**
3. **LINE連携をテスト**
4. **通知送信をテスト**
5. **本番環境へデプロイ**

ご不明な点があれば、お気軽にお問い合わせください！
