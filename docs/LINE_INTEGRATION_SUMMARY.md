# LINE連携機能 完成サマリー

## 📋 プロジェクト概要

D-MAXのLINE連携機能が完成しました。患者はLINE公式アカウントを通じて、予約確認、Web予約、家族登録などの操作が可能になります。

**完成日**: 2025-10-28
**ステータス**: ✅ 実装完了（テスト準備完了）

---

## 🎯 実装された機能

### 1. 患者向け機能（LIFF/LINEミニアプリ）

| 機能 | エンドポイント | LIFF ID環境変数 | サイズ | 説明 |
|------|--------------|----------------|--------|------|
| 初回連携 | `/liff/initial-link` | `NEXT_PUBLIC_LIFF_ID_INITIAL_LINK` | Tall | 患者番号・生年月日での初回連携 |
| QRコード | `/liff/qr-code` | `NEXT_PUBLIC_LIFF_ID_QR_CODE` | Tall | 受付用QRコード表示 |
| 家族登録 | `/liff/family-register` | `NEXT_PUBLIC_LIFF_ID_FAMILY_REGISTER` | Tall | 家族アカウントの追加登録 |
| 予約確認 | `/liff/appointments` | `NEXT_PUBLIC_LIFF_ID_APPOINTMENTS` | Full | 予約一覧・キャンセル |
| Web予約 | `/liff/web-booking` | `NEXT_PUBLIC_LIFF_ID_WEB_BOOKING` | Full | Web予約フォームへ遷移 |

### 2. 通知機能

| 通知タイプ | トリガー | 送信タイミング |
|----------|---------|--------------|
| 予約確認 | 予約作成時 | 即時 |
| 予約リマインダー | 予約日前日 | 前日18:00（設定可能） |
| キャンセル確認 | 予約キャンセル時 | 即時 |
| Web予約受付 | Web予約完了時 | 即時 |
| Web予約キャンセル | Web予約キャンセル時 | 即時 |

### 3. バックエンドAPI

| API | メソッド | 用途 |
|-----|---------|------|
| `/api/line/webhook` | POST | LINEプラットフォームからのイベント受信 |
| `/api/line/link-patient` | GET/POST | 患者連携の照会・登録 |
| `/api/line/appointments` | GET/PATCH | 予約一覧取得・キャンセル |
| `/api/line/rich-menu` | POST | リッチメニュー作成・設定 |
| `/api/line/send-notification` | POST | 通知送信（予約確認等） |
| `/api/notification-settings` | GET/POST | 通知設定の取得・保存 |

### 4. 管理機能

- **設定UI**: 設定画面からLINE連携を完全に管理
  - チャネル情報設定
  - LIFF ID設定（5個）
  - 通知テンプレート管理
  - 自動通知ON/OFF
- **テンプレート管理**: 通知メッセージのカスタマイズ
- **患者連携管理**: 連携状況の確認

---

## 📊 データベース構造

### 新規追加テーブル

```sql
-- LINE患者連携
CREATE TABLE line_patient_linkages (
  id UUID PRIMARY KEY,
  line_user_id TEXT NOT NULL,
  patient_id UUID REFERENCES patients(id),
  linked_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(line_user_id, patient_id)
);

-- 通知設定
CREATE TABLE notification_settings (
  clinic_id UUID PRIMARY KEY,
  settings JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 通知テンプレート
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY,
  clinic_id UUID,
  name TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  line_message TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 通知履歴
CREATE TABLE notification_history (
  id UUID PRIMARY KEY,
  clinic_id UUID,
  patient_id UUID,
  notification_type TEXT,
  channel TEXT, -- 'line', 'email', 'sms'
  status TEXT, -- 'sent', 'failed', 'pending'
  message TEXT,
  sent_at TIMESTAMP DEFAULT NOW()
);
```

### 既存テーブルへの追加カラム

```sql
-- patients テーブル
ALTER TABLE patients ADD COLUMN line_notification_enabled BOOLEAN DEFAULT TRUE;

-- appointments テーブル
ALTER TABLE appointments ADD COLUMN notification_sent BOOLEAN DEFAULT FALSE;
```

---

## 🔧 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Next.js 15, React, TypeScript, Tailwind CSS |
| LIFF SDK | @line/liff v2.x |
| バックエンド | Next.js API Routes |
| LINE API | Messaging API, LIFF |
| データベース | PostgreSQL (Supabase) |
| 認証 | LIFF認証, Supabase Auth |

---

## 📁 ファイル構成

### LIFFページ（患者向けUI）
```
app/liff/
├── initial-link/
│   └── page.tsx           # 初回連携画面
├── qr-code/
│   └── page.tsx           # QRコード表示
├── family-register/
│   └── page.tsx           # 家族登録
├── appointments/
│   └── page.tsx           # 予約確認・キャンセル
└── web-booking/
    └── page.tsx           # Web予約遷移
```

### APIエンドポイント
```
app/api/line/
├── webhook/
│   └── route.ts           # Webhook受信
├── link-patient/
│   └── route.ts           # 患者連携API
├── appointments/
│   └── route.ts           # 予約管理API
├── rich-menu/
│   └── route.ts           # リッチメニューAPI
└── send-notification/
    └── route.ts           # 通知送信API

app/api/notification-settings/
└── route.ts               # 通知設定API
```

### 管理画面
```
app/settings/
└── page.tsx               # 設定画面（LINE設定含む）
```

### ドキュメント
```
docs/
├── LINE_INTEGRATION_SETUP.md          # 技術仕様
├── LINE_TESTING_GUIDE.md              # テスト手順
├── LINE_MULTI_CLINIC_DEPLOYMENT.md    # 複数医院展開
├── LINE_SETUP_STEP_BY_STEP.md        # セットアップガイド
├── LINE_MINIAPP_MIGRATION.md          # ミニアプリ移行
├── LINE_MINIAPP_SETUP_GUIDE.md        # ミニアプリ設定
├── LINE_LIFF_ID_UI_CONFIGURATION.md   # UI設定機能
└── LINE_INTEGRATION_SUMMARY.md        # このファイル
```

---

## 🚀 セットアップ手順

### 1. LINE Developers Console設定（30分）

1. **アカウント作成** (5分)
   - https://developers.line.biz/ でアカウント作成
   - Provider作成

2. **Messaging APIチャネル作成** (5分)
   - チャネル名、説明、アイコン設定
   - プライバシーポリシー、利用規約URL入力

3. **重要設定** (10分)
   - Channel Access Token発行
   - Channel Secret取得
   - Webhook URL設定: `https://yourdomain.com/api/line/webhook`
   - 応答メッセージOFF

4. **LIFF/ミニアプリ作成** (15分)
   - 5つのLIFFアプリを作成:
     - 初回連携 (Tall, `/liff/initial-link`)
     - QRコード (Tall, `/liff/qr-code`)
     - 家族登録 (Tall, `/liff/family-register`)
     - 予約確認 (Full, `/liff/appointments`)
     - Web予約 (Full, `/liff/web-booking`)

### 2. D-MAX設定（5分）

1. **設定画面からLINE連携設定**
   - 設定 > 通知 > LINE連携設定
   - チャネル情報入力:
     - Channel ID
     - Channel Secret
     - Channel Access Token
   - LIFF ID入力（5個）
   - 保存

2. **開発サーバー再起動**
   ```bash
   # サーバー再起動
   Ctrl+C
   npm run dev
   ```

### 3. リッチメニュー設定（5分）

1. **リッチメニューAPI実行**
   ```bash
   curl -X POST http://localhost:3000/api/line/rich-menu \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

2. **確認**: LINE公式アカウントでリッチメニューが表示されることを確認

### 4. テスト（10分）

詳細は [LINE_TESTING_GUIDE.md](./LINE_TESTING_GUIDE.md) を参照。

---

## 🎨 リッチメニュー構成

```
┌─────────────────────────────────────┐
│     LINE公式アカウント リッチメニュー      │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────┐  ┌──────────┐         │
│  │ 予約確認  │  │ Web予約   │         │
│  │    📅    │  │    🗓️    │         │
│  └──────────┘  └──────────┘         │
│                                     │
│  ┌──────────┐  ┌──────────┐         │
│  │ QRコード │  │ 家族登録  │         │
│  │    📱    │  │   👨‍👩‍👧  │         │
│  └──────────┘  └──────────┘         │
│                                     │
└─────────────────────────────────────┘
```

### ボタンアクション

| ボタン | タップ時の動作 |
|--------|--------------|
| 予約確認 | `/liff/appointments` を開く |
| Web予約 | `/liff/web-booking` を開く |
| QRコード | `/liff/qr-code` を開く |
| 家族登録 | `/liff/family-register` を開く |

---

## 🔐 セキュリティ機能

### 1. 患者認証
- 患者番号 + 生年月日による本人確認
- LINE User IDとの紐付け
- 家族アカウントの連携管理

### 2. データ保護
- Webhook署名検証
- HTTPS必須
- Supabase RLS（Row Level Security）
- 患者情報の暗号化

### 3. アクセス制御
- LIFF認証必須
- 連携患者のみデータアクセス可能
- キャンセル権限チェック

---

## 📱 ユーザーフロー

### 初回連携フロー

```
1. 患者が医院のLINE公式アカウントを友だち追加
   ↓
2. リッチメニュー「予約確認」タップ
   ↓
3. 初回連携画面が表示される
   ↓
4. 患者番号と生年月日を入力
   ↓
5. 連携完了 → 予約確認画面へ
```

### 予約確認フロー

```
1. リッチメニュー「予約確認」タップ
   ↓
2. 連携済み患者の予約一覧表示
   ↓
3. 予約詳細を確認
   ↓
4. 必要に応じてキャンセル
```

### Web予約フロー

```
1. リッチメニュー「Web予約」タップ
   ↓
2. 患者選択（複数連携時）
   ↓
3. Web予約画面を開く（患者情報自動入力）
   ↓
4. 日時・診療内容を選択
   ↓
5. 予約完了 → LINE通知送信
```

### 家族登録フロー

```
1. リッチメニュー「家族登録」タップ
   ↓
2. 家族の患者番号と生年月日を入力
   ↓
3. 連携完了 → 複数アカウント管理可能
```

---

## 🔔 通知パターン

### 1. 予約確認通知（予約作成時）

```
【予約完了のお知らせ】

山田 太郎 様

以下の内容で予約を承りました。

📅 日時: 2025-11-15 14:30
⏱️ 所要時間: 30分
👨‍⚕️ 担当: 佐藤先生
📝 診療内容: 定期検診

ご来院お待ちしております。
```

### 2. リマインダー通知（前日）

```
【明日のご予約のお知らせ】

山田 太郎 様

明日のご予約をお知らせします。

📅 日時: 2025-11-15 14:30
⏱️ 所要時間: 30分
👨‍⚕️ 担当: 佐藤先生

変更・キャンセルは「予約確認」メニューから可能です。
```

### 3. キャンセル確認通知

```
【予約キャンセル完了】

山田 太郎 様

以下の予約をキャンセルしました。

📅 日時: 2025-11-15 14:30

またのご利用をお待ちしております。
```

---

## 🧪 テスト項目

### 必須テスト

- [ ] **初回連携テスト**
  - 正しい患者番号・生年月日で連携成功
  - 誤った情報で連携失敗
  - 重複連携の防止

- [ ] **予約確認テスト**
  - 予約一覧表示
  - 予約詳細表示
  - 予約キャンセル
  - 過去予約の表示

- [ ] **Web予約テスト**
  - 患者情報自動入力
  - 予約作成
  - 通知送信

- [ ] **家族登録テスト**
  - 複数アカウント連携
  - 患者切り替え

- [ ] **通知テスト**
  - 予約確認通知
  - リマインダー通知
  - キャンセル通知

- [ ] **リッチメニューテスト**
  - 各ボタンの動作
  - 画像表示

### 詳細テスト手順

[LINE_TESTING_GUIDE.md](./LINE_TESTING_GUIDE.md) を参照。

---

## 🏥 複数医院展開

### デプロイ方式

**推奨**: 医院ごとに独立したLINE公式アカウント

### セットアップ時間

- **初回**: 30分
- **2回目以降**: 15分（慣れれば）

### 展開手順

各医院で以下を実施:

1. LINE Developers Console設定（30分）
2. D-MAX設定画面から設定（5分）
3. リッチメニュー作成（5分）
4. テスト（10分）

詳細は [LINE_MULTI_CLINIC_DEPLOYMENT.md](./LINE_MULTI_CLINIC_DEPLOYMENT.md) を参照。

---

## 📈 今後の拡張予定

### フェーズ2: 高度な通知機能

- [ ] プッシュ通知のスケジューリング
- [ ] 患者属性別の通知設定
- [ ] A/Bテストによる通知最適化
- [ ] 開封率・クリック率の分析

### フェーズ3: 双方向コミュニケーション

- [ ] チャットボット機能
- [ ] よくある質問の自動応答
- [ ] 診療時間の問い合わせ対応
- [ ] 予約変更のチャット対応

### フェーズ4: LINE Pay連携

- [ ] オンライン決済
- [ ] 予約時の事前決済
- [ ] 定期検診パッケージ販売

### フェーズ5: AI機能

- [ ] 自然言語での予約作成
- [ ] 症状に基づく診療推奨
- [ ] 口腔ケアアドバイス

---

## 🐛 トラブルシューティング

### よくある問題

#### 1. LIFF初期化エラー

**症状**: "LIFF IDが設定されていません"

**原因**: 環境変数またはDB設定が未設定

**解決策**:
1. 設定画面でLIFF IDを入力
2. 保存後、サーバー再起動
3. ブラウザキャッシュクリア

#### 2. Webhook受信エラー

**症状**: 通知が送信されない

**原因**: Webhook URL設定ミス

**解決策**:
1. LINE Developers ConsoleでWebhook URL確認
2. `https://yourdomain.com/api/line/webhook` が正しいか
3. SSL証明書が有効か確認
4. ngrokを使用している場合はURL更新

#### 3. 患者連携失敗

**症状**: "患者が見つかりません"

**原因**: 患者番号または生年月日が不一致

**解決策**:
1. 患者マスタで情報を確認
2. 全角・半角の違いをチェック
3. 生年月日フォーマット確認（YYYY-MM-DD）

#### 4. リッチメニューが表示されない

**症状**: LINE公式アカウントでメニューが出ない

**原因**: リッチメニュー未設定

**解決策**:
```bash
curl -X POST http://localhost:3000/api/line/rich-menu \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 📞 サポート

### ドキュメント

- [LINE_INTEGRATION_SETUP.md](./LINE_INTEGRATION_SETUP.md) - 技術詳細
- [LINE_TESTING_GUIDE.md](./LINE_TESTING_GUIDE.md) - テスト手順
- [LINE_SETUP_STEP_BY_STEP.md](./LINE_SETUP_STEP_BY_STEP.md) - セットアップガイド
- [LINE_LIFF_ID_UI_CONFIGURATION.md](./LINE_LIFF_ID_UI_CONFIGURATION.md) - UI設定

### LINE公式ドキュメント

- [LINE Developers](https://developers.line.biz/ja/)
- [Messaging API](https://developers.line.biz/ja/docs/messaging-api/)
- [LIFF (LINE Front-end Framework)](https://developers.line.biz/ja/docs/liff/)
- [LINEミニアプリ](https://developers.line.biz/ja/docs/line-mini-app/)

---

## ✅ 完成チェックリスト

### 実装

- [x] データベーススキーマ作成
- [x] LIFFページ実装（5画面）
- [x] APIエンドポイント実装（6本）
- [x] 通知機能実装
- [x] 設定UI実装
- [x] LIFF ID UI設定機能
- [x] リッチメニュー実装

### ドキュメント

- [x] 技術仕様書
- [x] テストガイド
- [x] セットアップガイド
- [x] ミニアプリ移行ガイド
- [x] UI設定ガイド
- [x] 複数医院展開ガイド
- [x] 完成サマリー

### テスト準備

- [x] ローカル開発環境
- [x] テスト手順書
- [x] ngrok設定手順
- [ ] LINE Developers Console設定（未実施）
- [ ] LIFF作成（未実施）
- [ ] 実機テスト（未実施）

---

## 🎉 まとめ

D-MAXのLINE連携機能が完成しました！

**主な成果**:
- ✅ 5つのLIFFページ
- ✅ 6つのAPIエンドポイント
- ✅ 自動通知機能
- ✅ UI設定機能
- ✅ リッチメニュー
- ✅ 完全なドキュメント

**次のステップ**:
1. LINE Developers Consoleでの設定
2. 実機テスト
3. 本番デプロイ

医院スタッフが簡単に設定・運用できる、完成度の高いLINE連携システムです！

---

**最終更新**: 2025-10-28
**バージョン**: 1.0.0
**ステータス**: ✅ 実装完了
