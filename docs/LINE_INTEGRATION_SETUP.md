# LINE連携システム セットアップガイド

## 概要
このシステムは、患者さんのLINEアカウントとクリニックの患者データを連携し、以下の機能を提供します：

- 📱 **初回連携** - 招待コード + 生年月日による安全な連携
- 👨‍👩‍👧‍👦 **家族登録** - 子供や家族の診察券を一括管理
- 📅 **予約確認** - LINEから予約の確認・変更・キャンセル
- 🔲 **QRコード** - 受付用QRコードの表示
- 🌐 **Web予約連携** - LINEからWeb予約画面を開く

---

## 🗄️ データベース構造

### 1. `line_invitation_codes` - 招待コード管理
患者とLINEを連携するための一時的な招待コードを管理します。

| カラム名 | 型 | 説明 |
|---------|------|------|
| `id` | UUID | 主キー |
| `clinic_id` | UUID | クリニックID |
| `patient_id` | UUID | 患者ID |
| `invitation_code` | TEXT | 招待コード（例: AB12-CD34） |
| `status` | TEXT | pending / used / expired |
| `expires_at` | TIMESTAMP | 有効期限（デフォルト: 30日後） |
| `used_at` | TIMESTAMP | 使用日時 |
| `created_by` | UUID | 発行者（スタッフID） |
| `created_at` | TIMESTAMP | 作成日時 |

### 2. `line_patient_linkages` - 患者連携情報
LINEユーザーIDと患者IDの連携情報を保存します。

| カラム名 | 型 | 説明 |
|---------|------|------|
| `id` | UUID | 主キー |
| `line_user_id` | TEXT | LINE User ID |
| `patient_id` | UUID | 患者ID |
| `clinic_id` | UUID | クリニックID |
| `relationship` | TEXT | self / parent / spouse / child / other |
| `is_primary` | BOOLEAN | メインアカウントか |
| `linked_at` | TIMESTAMP | 連携日時 |

### 3. `patient_qr_codes` - 患者QRコード
患者ごとの受付用QRコードを管理します。

| カラム名 | 型 | 説明 |
|---------|------|------|
| `id` | UUID | 主キー |
| `patient_id` | UUID | 患者ID（ユニーク） |
| `clinic_id` | UUID | クリニックID |
| `qr_token` | TEXT | QRコード用トークン |
| `expires_at` | TIMESTAMP | 有効期限（null=無期限） |
| `last_used_at` | TIMESTAMP | 最終使用日時 |
| `usage_count` | INTEGER | 使用回数 |

---

## 🚀 セットアップ手順

### 1. LINE Developersでの設定

#### ① Messaging API チャネルを作成
1. [LINE Developers Console](https://developers.line.biz/console/) にアクセス
2. プロバイダーを作成（既存の場合はスキップ）
3. 「Messaging API」チャネルを新規作成
4. チャネル基本設定で以下を取得:
   - **Channel ID**
   - **Channel secret**
   - **Channel access token** (長期)

#### ② Webhook設定
1. Webhook URLを設定: `https://yourdomain.com/api/line/webhook`
2. Webhookを「有効」にする
3. 「応答メッセージ」を「無効」にする（Botモードに切り替え）

#### ③ LIFF アプリを作成
以下の4つのLIFFアプリを作成します:

| アプリ名 | エンドポイントURL | サイズ | 説明 |
|---------|------------------|--------|------|
| 初回登録 | `/liff/initial-link` | Tall | 招待コード入力画面 |
| 家族登録 | `/liff/family-register` | Tall | 家族追加画面 |
| 予約確認 | `/liff/appointments` | Full | 予約一覧・変更 |
| Web予約 | `/liff/web-booking` | Full | Web予約画面 |

各LIFFアプリの作成手順:
1. LINE Developers Console → 作成したチャネル → LIFF
2. 「追加」ボタンをクリック
3. 各設定を入力:
   - **LIFFアプリ名**: 上記表を参照
   - **サイズ**: 上記表を参照
   - **エンドポイントURL**: `https://yourdomain.com{エンドポイントURL}`
   - **Scope**: `profile`, `openid`
4. 作成後、**LIFF ID** (例: `1234567890-abcdefgh`) をコピー

---

### 2. 環境変数の設定

`.env.local` ファイルに以下を追加:

```bash
# LINE設定
LINE_CHANNEL_ACCESS_TOKEN=your-channel-access-token
LINE_CHANNEL_SECRET=your-channel-secret

# LIFF設定
NEXT_PUBLIC_LIFF_ID_INITIAL_LINK=1234567890-abcdefgh
NEXT_PUBLIC_LIFF_ID_FAMILY_REGISTER=1234567890-ijklmnop
NEXT_PUBLIC_LIFF_ID_APPOINTMENTS=1234567890-qrstuvwx
NEXT_PUBLIC_LIFF_ID_WEB_BOOKING=1234567890-yz123456
```

---

### 3. データベースマイグレーション

```bash
# ローカル環境
npx supabase db reset --local

# 本番環境
npx supabase db push
```

---

## 📱 使い方

### クリニック側の操作

#### 1. 招待コードの発行
1. 患者一覧 → 患者詳細 → 基本情報タブ
2. 「LINE連携」セクションの「招待コードを発行」ボタンをクリック
3. 8桁の招待コード（例: AB12-CD34）が表示される
4. 招待コードを患者さんに伝える（口頭 / SMS / 印刷）

#### 2. 連携状態の確認
- 患者詳細の「LINE連携」セクションで連携状態を確認
- 連携済みの場合は「LINE連携済み」バッジが表示される

---

### 患者側の操作

#### 1. LINE友だち追加
1. クリニックのLINE公式アカウントを友だち追加
2. リッチメニューが表示される

#### 2. 初回登録（連携）
1. リッチメニューから「初回登録」をタップ
2. クリニックから受け取った招待コードを入力（例: AB12-CD34）
3. 生年月日を入力（例: 1990/01/01）
4. 「連携する」ボタンをタップ
5. 連携完了！

#### 3. リッチメニューの機能
連携後、以下の機能が利用可能になります:

- **QRコード** - 受付でQRコードを提示
- **予約確認** - 予約の確認・変更・キャンセル
- **家族登録** - 家族を追加連携
- **予約を取る** - Web予約画面を開く
- **Webサイト** - クリニックのホームページを開く
- **お問合せ** - メッセージでお問い合わせ

---

## 🔧 API エンドポイント

### 招待コード管理

#### `POST /api/line/invitation-codes`
招待コードを発行

**Request:**
```json
{
  "patient_id": "uuid",
  "clinic_id": "uuid",
  "created_by": "staff_uuid",
  "expires_in_days": 30
}
```

**Response:**
```json
{
  "invitation_code": "AB12-CD34",
  "expires_at": "2025-02-28T23:59:59Z",
  "is_new": true
}
```

#### `GET /api/line/invitation-codes?patient_id=xxx`
患者の招待コード一覧を取得

#### `DELETE /api/line/invitation-codes?id=xxx`
招待コードを無効化

---

### 患者検索（家族登録用）

#### `GET /api/patients/search?name=xxx&birth_date=xxx&phone=xxx`
患者を検索（家族登録用）

**Query Parameters:**
- `name`: 氏名（姓または名の一部）
- `birth_date`: 生年月日（YYYY-MM-DD形式）
- `phone`: 電話番号（ハイフンあり/なし両方可）

**Response:**
```json
{
  "results": [
    {
      "id": "uuid",
      "patient_number": 12345,
      "last_name": "山田",
      "first_name": "太郎",
      "birth_date": "1990-01-01",
      "phone": "090-****-5678"
    }
  ],
  "count": 1
}
```

**セキュリティ:**
- 名前、生年月日、電話番号のすべてが一致する場合のみ結果を返す
- 電話番号は部分マスキング（090-****-5678形式）
- 検索結果は最大5件まで

---

### 患者連携管理

#### `POST /api/line/link-patient`
招待コードで患者を連携

**Request:**
```json
{
  "line_user_id": "U1234567890abcdef",
  "invitation_code": "AB12-CD34",
  "birth_date": "1990-01-01"
}
```

**Response:**
```json
{
  "success": true,
  "linkage": {
    "id": "uuid",
    "patient": {
      "id": "uuid",
      "name": "山田 太郎",
      "patient_number": 12345
    },
    "is_primary": true,
    "linked_at": "2025-01-28T12:00:00Z"
  }
}
```

#### `GET /api/line/link-patient?line_user_id=xxx`
LINEユーザーの連携患者一覧を取得

#### `DELETE /api/line/link-patient?linkage_id=xxx`
連携を解除

---

### 家族連携管理

#### `POST /api/line/family-linkage`
家族メンバーを連携

**Request:**
```json
{
  "line_user_id": "U1234567890abcdef",
  "patient_id": "uuid",
  "relationship": "child"
}
```

**Response:**
```json
{
  "success": true,
  "linkage": {
    "id": "uuid",
    "patient": {
      "id": "uuid",
      "name": "山田 花子",
      "patient_number": 12346,
      "birth_date": "2010-05-15"
    },
    "relationship": "child",
    "is_primary": false,
    "linked_at": "2025-01-28T12:00:00Z"
  }
}
```

#### `GET /api/line/family-linkage?line_user_id=xxx`
連携済みの家族メンバー一覧を取得

#### `DELETE /api/line/family-linkage?id=xxx`
家族連携を解除

---

### 予約管理

#### `GET /api/line/appointments?line_user_id=xxx`
LINE連携患者の予約一覧を取得

**Response:**
```json
{
  "appointments_by_patient": [
    {
      "patient": {
        "id": "uuid",
        "name": "山田 太郎",
        "patient_number": 12345
      },
      "appointments": [
        {
          "id": "uuid",
          "patient": {
            "id": "uuid",
            "name": "山田 太郎",
            "patient_number": 12345
          },
          "appointment_date": "2025-02-01",
          "appointment_time": "10:00:00",
          "duration": 30,
          "status": "scheduled",
          "treatment_type": "定期検診",
          "notes": "午前中希望",
          "staff": {
            "id": "uuid",
            "name": "佐藤 医師"
          }
        }
      ],
      "count": 1
    }
  ],
  "total_count": 1,
  "patient_count": 1
}
```

**機能:**
- 今日以降の予約のみ取得
- 患者ごとにグループ化
- 日付・時刻で昇順ソート

#### `PATCH /api/line/appointments`
予約をキャンセル

**Request:**
```json
{
  "appointment_id": "uuid",
  "line_user_id": "U1234567890abcdef",
  "cancellation_reason": "体調不良のため"
}
```

**Response:**
```json
{
  "success": true,
  "appointment": {
    "id": "uuid",
    "status": "cancelled",
    "cancellation_reason": "体調不良のため",
    "cancelled_at": "2025-01-28T12:00:00Z"
  },
  "message": "予約をキャンセルしました"
}
```

**バリデーション:**
- LINE連携の確認（キャンセル権限チェック）
- 既にキャンセル済みでないか確認
- 過去の予約はキャンセル不可

---

### Web予約連携

LINEからWeb予約画面を開く際、以下のパラメータを渡すことで患者情報を自動入力できます。

**URL例:**
```
https://yourdomain.com/web-booking?patient_id=xxx&patient_number=12345&phone=09012345678&birth_date=1990-01-01&from_line=true
```

**パラメータ:**
- `patient_id`: 患者ID（UUID）
- `patient_number`: 患者番号
- `phone`: 電話番号
- `birth_date`: 生年月日（YYYY-MM-DD形式）
- `from_line`: LINE経由フラグ（true）

**動作:**
1. パラメータから患者情報を読み込み
2. 再診患者として自動認証
3. 患者情報（氏名・電話番号・メール）を自動入力
4. メニュー選択画面から開始（新規/再診の選択をスキップ）

---

## 🎨 LIFF画面

### 1. 初回連携画面 (`/liff/initial-link`)
- 招待コード入力（8桁、自動フォーマット）
- 生年月日入力（本人確認）
- 連携ボタン
- エラー表示
- 成功画面（3秒後に自動的に閉じる）

### 2. 家族登録画面 (`/liff/family-register`)
- 患者検索（名前・生年月日・電話番号）
- 検索結果表示（電話番号部分マスク）
- 関係性選択（親・配偶者・子供・その他）
- 連携ボタン
- 成功画面（3秒後に自動的に閉じる）

### 3. 予約確認画面 (`/liff/appointments`)
- 連携患者の予約一覧（今日以降の予約のみ表示）
- 患者切り替え機能（複数家族対応）
- 予約詳細表示（日時・治療内容・担当医・備考）
- 予約ステータス表示（予約済み・確定・キャンセルなど）
- 予約キャンセル機能（理由入力可能）
- キャンセル確認ダイアログ
- 注意事項表示

### 4. Web予約画面 (`/liff/web-booking`)
- 連携患者一覧表示
- 患者選択機能（複数家族対応）
- Web予約画面への遷移
- 患者情報自動入力（氏名・電話番号・生年月日）
- メニュー選択から開始（新規/再診の選択不要）

---

## 🔒 セキュリティ

### 招待コード
- 8桁の英数字（混同しやすい文字を除外: 0, O, I, 1, L）
- 有効期限: 30日（カスタマイズ可能）
- 一度使用すると無効化
- 重複チェック付き生成

### 本人確認
- 生年月日による認証
- LINE User IDとの紐付け
- 複合ユニーク制約（同じLINEユーザーが同じ患者に2回連携不可）

### データアクセス
- Row Level Security (RLS) 有効
- スタッフは自分のクリニックのデータのみアクセス可能
- 患者はLINE User IDで認証

---

## 📊 実装状況

| 機能 | 状態 | 説明 |
|-----|------|------|
| データベース設計 | ✅ 完了 | 3つのテーブル作成済み |
| 招待コード発行API | ✅ 完了 | POST/GET/DELETE対応 |
| 患者連携API | ✅ 完了 | POST/GET/DELETE対応 |
| LINE連携UIコンポーネント | ✅ 完了 | 患者詳細画面に追加 |
| 初回連携LIFF画面 | ✅ 完了 | 招待コード入力画面 |
| QRコード生成API | ✅ 完了 | QR画像生成・管理 |
| QRコード表示LIFF | ✅ 完了 | 家族対応QRコード表示 |
| 患者検索API | ✅ 完了 | セキュアな検索・マスキング |
| 家族連携API | ✅ 完了 | POST/GET/DELETE対応 |
| 家族登録LIFF | ✅ 完了 | 患者検索・連携画面 |
| 予約管理API | ✅ 完了 | GET/PATCH対応 |
| 予約確認LIFF | ✅ 完了 | 予約一覧・キャンセル機能 |
| Web予約LIFF | ✅ 完了 | 患者選択・自動入力 |
| Web予約画面拡張 | ✅ 完了 | LINEパラメータ対応 |
| LINE通知機能 | ⏳ 未実装 | 次のステップ |

---

## 🐛 トラブルシューティング

### LIFF初期化エラー
**症状:** 「LIFF初期化に失敗しました」と表示される

**対処法:**
1. LIFF IDが正しく設定されているか確認
2. エンドポイントURLがHTTPSか確認（ローカル開発時はngrokを使用）
3. ブラウザのコンソールでエラーを確認

### 招待コードが無効
**症状:** 「招待コードが見つからないか、有効期限が切れています」

**対処法:**
1. 招待コードの有効期限を確認（30日）
2. 既に使用済みでないか確認
3. 新しい招待コードを発行

### 生年月日が一致しない
**症状:** 「生年月日が一致しません」

**対処法:**
1. 患者マスタの生年月日を確認
2. 入力形式が正しいか確認（YYYY/MM/DD）
3. 年・月・日が正確か確認

---

## 📝 今後の開発予定

1. **QRコード機能**
   - QRコード画像生成
   - カルーセル形式での表示（家族複数対応）
   - 受付リーダーとの連携

2. **家族登録機能**
   - 患者検索API（セキュアな検索）
   - 家族追加LIFF画面
   - 連携解除機能

3. **予約管理機能**
   - 予約一覧API
   - 予約変更・キャンセルAPI
   - 予約確認LIFF画面

4. **Web予約連携**
   - 患者情報自動入力
   - 治療メニュー自動選択
   - Web予約LIFF画面

5. **通知機能**
   - 予約確定通知
   - 予約変更通知
   - リマインダー通知

---

## 📚 参考資料

- [LINE Messaging API ドキュメント](https://developers.line.biz/ja/docs/messaging-api/)
- [LIFF ドキュメント](https://developers.line.biz/ja/docs/liff/)
- [Supabase ドキュメント](https://supabase.com/docs)
- [Next.js App Router ドキュメント](https://nextjs.org/docs/app)

---

## ✨ まとめ

LINE連携システムの基盤が完成しました！

**実装完了項目:**
- ✅ データベース設計・作成
- ✅ 招待コード発行・管理API
- ✅ 患者連携API
- ✅ LINE連携UIコンポーネント
- ✅ 初回連携LIFF画面
- ✅ QRコード生成・表示機能
- ✅ 患者検索API（セキュアな検索・マスキング）
- ✅ 家族連携API
- ✅ 家族登録LIFF画面
- ✅ 予約管理API（一覧取得・キャンセル）
- ✅ 予約確認LIFF画面
- ✅ Web予約LIFF画面（患者選択）
- ✅ Web予約画面拡張（LINE連携対応）

**次のステップ:**
1. LINE通知機能（予約確認・リマインダー・キャンセル通知）
2. Webhook機能の強化（QRコード送信など）
3. 運用フロー最適化

患者さんとクリニックをLINEでつなぐシステムの第一歩が完成しました！🎉
