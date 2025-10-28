# LINE LIFF ID UI設定機能

## 概要

LINE連携に必要な5つのLIFF ID（LINEミニアプリID）を、D-MAXの設定画面から直接入力・管理できるようになりました。

これにより、従来必要だった`.env.local`ファイルの手動編集が不要になり、より簡単にLINE連携を設定できます。

## 実装内容

### 1. 設定画面への追加

**場所**: 設定 > 通知 > LINE連携設定

設定画面の「LINE連携設定」セクションに、以下の5つのLIFF ID入力フィールドを追加しました:

1. **初回連携 LIFF ID** (`NEXT_PUBLIC_LIFF_ID_INITIAL_LINK`)
   - 患者の初回LINE連携時に使用
   - サイズ: Tall

2. **QRコード LIFF ID** (`NEXT_PUBLIC_LIFF_ID_QR_CODE`)
   - 受付用QRコード表示に使用
   - サイズ: Tall

3. **家族登録 LIFF ID** (`NEXT_PUBLIC_LIFF_ID_FAMILY_REGISTER`)
   - 家族アカウント登録時に使用
   - サイズ: Tall

4. **予約確認 LIFF ID** (`NEXT_PUBLIC_LIFF_ID_APPOINTMENTS`)
   - 予約の確認・キャンセルに使用
   - サイズ: Full

5. **Web予約 LIFF ID** (`NEXT_PUBLIC_LIFF_ID_WEB_BOOKING`)
   - Web予約画面へのアクセスに使用
   - サイズ: Full

### 2. UI設計

```
┌─────────────────────────────────────────────────────┐
│ 💡 LIFF ID / LINEミニアプリID                        │
├─────────────────────────────────────────────────────┤
│ LINE Developers Console で作成した5つのLIFF         │
│ （またはLINEミニアプリ）のIDを入力してください。     │
│ 設定後は .env.local ファイルへの手動設定は不要      │
│ になります。                                         │
│                                                     │
│ ┌─ 初回連携 LIFF ID ─────────────────────────┐   │
│ │ [1234567890-abcdefgh                    ]   │   │
│ │ 環境変数: NEXT_PUBLIC_LIFF_ID_INITIAL_LINK │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ ┌─ QRコード LIFF ID ──────────────────────────┐  │
│ │ [1234567890-xxxxxxxx                    ]   │   │
│ │ 環境変数: NEXT_PUBLIC_LIFF_ID_QR_CODE      │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ ... (残り3つのフィールド)                           │
│                                                     │
│ ┌───── 💡 設定のヒント ───────────────────────┐  │
│ │ • LINE Developers Console の「LIFF」         │  │
│ │   または「LINEミニアプリ」タブで作成          │  │
│ │ • 各LIFFアプリ作成後に表示されるIDをコピー   │  │
│ │ • 保存後、サーバーを再起動すると設定が反映   │  │
│ └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 3. データ構造

**notificationSettings.line オブジェクト**:
```typescript
{
  enabled: boolean,
  channel_id: string,
  channel_secret: string,
  channel_access_token: string,
  webhook_url: string,
  // 追加されたフィールド
  liff_id_initial_link: string,
  liff_id_qr_code: string,
  liff_id_family_register: string,
  liff_id_appointments: string,
  liff_id_web_booking: string
}
```

### 4. 保存処理

既存の通知設定保存API (`/api/notification-settings`) を使用して保存されます。

```typescript
// app/settings/page.tsx (lines 2915-2922)
const response = await fetch("/api/notification-settings", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    clinic_id: DEMO_CLINIC_ID,
    settings: notificationSettings, // LIFF IDを含む
  }),
});
```

## 使用方法

### 1. LINE Developers Consoleでの準備

1. LINE Developers Console (https://developers.line.biz/) にログイン
2. 「LIFF」または「LINEミニアプリ」タブを開く
3. 5つのLIFFアプリを作成:
   - 初回連携 (Tall, /liff/initial-link)
   - QRコード (Tall, /liff/qr-code)
   - 家族登録 (Tall, /liff/family-register)
   - 予約確認 (Full, /liff/appointments)
   - Web予約 (Full, /liff/web-booking)

### 2. D-MAXでの設定

1. D-MAX設定画面を開く: `http://localhost:3000/settings`
2. 左メニューから「通知」を選択
3. 「LINE連携設定」セクションまでスクロール
4. 「LIFF ID / LINEミニアプリID」セクションに各IDを入力
5. 「保存」ボタンをクリック
6. 開発サーバーを再起動

### 3. 設定の確認

保存後、以下の方法で設定を確認できます:

```bash
# データベースから設定を確認
psql -h localhost -U postgres -d d-max -c "SELECT settings FROM notification_settings WHERE clinic_id='550e8400-e29b-41d4-a716-446655440000';"
```

または、ブラウザのDevToolsで:
```javascript
// LIFFページで確認
console.log(process.env.NEXT_PUBLIC_LIFF_ID_INITIAL_LINK)
console.log(process.env.NEXT_PUBLIC_LIFF_ID_QR_CODE)
console.log(process.env.NEXT_PUBLIC_LIFF_ID_FAMILY_REGISTER)
console.log(process.env.NEXT_PUBLIC_LIFF_ID_APPOINTMENTS)
console.log(process.env.NEXT_PUBLIC_LIFF_ID_WEB_BOOKING)
```

## 従来の方法との比較

### 従来の方法 (.env.localファイル編集)

```bash
# .env.local
NEXT_PUBLIC_LIFF_ID_INITIAL_LINK=1234567890-abcdefgh
NEXT_PUBLIC_LIFF_ID_QR_CODE=1234567890-xxxxxxxx
NEXT_PUBLIC_LIFF_ID_FAMILY_REGISTER=1234567890-yyyyyyyy
NEXT_PUBLIC_LIFF_ID_APPOINTMENTS=1234567890-zzzzzzzz
NEXT_PUBLIC_LIFF_ID_WEB_BOOKING=1234567890-wwwwwwww
```

**問題点**:
- ファイルシステムへのアクセスが必要
- タイプミスのリスク
- 設定変更の履歴管理が困難
- 非技術スタッフには難しい

### 新しい方法 (UI設定)

**メリット**:
✅ ブラウザから直接設定可能
✅ リアルタイムバリデーション（今後追加予定）
✅ 設定履歴の管理が容易
✅ 非技術スタッフでも簡単に設定可能
✅ 環境変数名のマッピングが表示され、ミスが減る

## データベーススキーマ

LIFF ID設定は `notification_settings` テーブルに保存されます:

```sql
-- notification_settings テーブル
CREATE TABLE notification_settings (
  clinic_id UUID PRIMARY KEY,
  settings JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- settings JSONBの構造例
{
  "email": {...},
  "sms": {...},
  "line": {
    "enabled": true,
    "channel_id": "2000000000",
    "channel_secret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "channel_access_token": "...",
    "webhook_url": "https://example.com/api/line/webhook",
    "liff_id_initial_link": "1234567890-abcdefgh",
    "liff_id_qr_code": "1234567890-xxxxxxxx",
    "liff_id_family_register": "1234567890-yyyyyyyy",
    "liff_id_appointments": "1234567890-zzzzzzzz",
    "liff_id_web_booking": "1234567890-wwwwwwww"
  }
}
```

## 今後の拡張予定

### 1. バリデーション機能

LIFF IDの形式チェックを追加:
```typescript
const validateLiffId = (id: string): boolean => {
  // LIFF IDは "数字10桁-英数字8桁" の形式
  return /^\d{10}-[a-zA-Z0-9]{8}$/.test(id)
}
```

### 2. LIFF接続テスト

設定したLIFF IDが正しく動作するかテスト:
```typescript
const testLiffConnection = async (liffId: string) => {
  try {
    await window.liff.init({ liffId })
    return { success: true, message: "接続成功" }
  } catch (error) {
    return { success: false, message: "接続失敗: " + error.message }
  }
}
```

### 3. 一括インポート機能

複数のLIFF IDをまとめて入力:
```typescript
// JSONファイルからインポート
{
  "liff_id_initial_link": "1234567890-abcdefgh",
  "liff_id_qr_code": "1234567890-xxxxxxxx",
  ...
}
```

### 4. 設定ウィザード

初回セットアップを案内するウィザード機能:
1. LINE Developers Console へのリンク
2. LIFF作成手順の表示
3. IDのコピー&ペースト
4. 接続テスト
5. 完了確認

## トラブルシューティング

### LIFF IDを入力したのに反映されない

**原因**: 環境変数はビルド時に埋め込まれるため、サーバー再起動が必要

**解決策**:
```bash
# 開発サーバーを再起動
Ctrl+C
npm run dev
```

### LIFF IDの形式がわからない

**LIFF IDの形式**: `1234567890-abcdefgh`
- 前半: 10桁の数字
- ハイフン
- 後半: 8文字の英数字

**確認方法**:
1. LINE Developers Console を開く
2. 「LIFF」または「LINEミニアプリ」タブ
3. 作成したLIFFアプリをクリック
4. LIFF IDをコピー

### 保存できない

**チェック項目**:
- [ ] インターネット接続は正常か
- [ ] データベースは起動しているか
- [ ] 他のLINE設定（Channel ID、Secret等）は入力済みか
- [ ] ブラウザのコンソールにエラーが出ていないか

## 関連ファイル

- **UI実装**: `/app/settings/page.tsx` (lines 444-448, 10228-10373)
- **API実装**: `/app/api/notification-settings/route.ts`
- **データベース**: `notification_settings` テーブル
- **環境変数**: `.env.local` (オプション、UIで設定可能)

## 参考ドキュメント

- [LINE_SETUP_STEP_BY_STEP.md](./LINE_SETUP_STEP_BY_STEP.md) - LINE連携の完全セットアップガイド
- [LINE_MINIAPP_SETUP_GUIDE.md](./LINE_MINIAPP_SETUP_GUIDE.md) - LINEミニアプリでの設定方法
- [LINE_INTEGRATION_SETUP.md](./LINE_INTEGRATION_SETUP.md) - LINE連携の技術仕様
- [LINE_TESTING_GUIDE.md](./LINE_TESTING_GUIDE.md) - テスト手順

## まとめ

LIFF ID UI設定機能により、LINE連携のセットアップがより簡単で直感的になりました。

**主な改善点**:
- ✅ ファイル編集不要
- ✅ リアルタイム設定
- ✅ 環境変数マッピング表示
- ✅ ヒント付きUI
- ✅ データベース管理

医院スタッフでも簡単に設定できる、ユーザーフレンドリーなインターフェースです。
