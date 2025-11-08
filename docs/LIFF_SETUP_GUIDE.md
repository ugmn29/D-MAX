# LIFF セットアップ & トラブルシューティングガイド

## 重要: LIFFアプリのアクセス方法

### ❌ 間違った方法
- ブラウザで直接 `https://lofty-herlinda-compulsively.ngrok-free.dev/liff/initial-link` にアクセスする
- LINE Developers Console の「Visit site」ボタンを押す

### ✅ 正しい方法
LIFFアプリは **LINEアプリ内** からのみ正常に動作します。以下の方法でアクセスしてください：

1. **リッチメニューから起動**
   - LINE公式アカウントのトークルームを開く
   - 下部のリッチメニューから該当するボタンをタップ

2. **テスト用URLから起動**
   - LINEアプリ内のトークで以下のURLを送信して自分でタップ
   - 例: `https://liff.line.me/2008447826-wjJgbD7o`

## LIFF ID一覧

設定済みのLIFF IDは以下の通りです：

| 用途 | LIFF ID | エンドポイントURL |
|------|---------|-----------------|
| 初回登録 | 2008447826-wjJgbD7o | /liff/initial-link |
| QRコード表示 | 2008447826-dOjOoqM3 | /liff/qr-code |
| 予約確認 | 2008447826-dB18MVka | /liff/appointments |
| 家族登録 | 2008447826-Dyo8R47e | /liff/family-register |
| Web予約 | 2008447826-MYxkGrKv | /liff/web-booking |

## LINE Developers Console でのLIFF設定確認

### 1. 基本設定
各LIFFアプリで以下を確認してください：

- **Size (サイズ)**: Full
- **Endpoint URL**: `https://lofty-herlinda-compulsively.ngrok-free.dev/liff/[該当ページ]`
- **Scope**: `profile`, `openid`
- **Bot link feature**: On (Aggressive)

### 2. Endpoint URL の詳細

| LIFF App名 | Endpoint URL |
|-----------|--------------|
| D-MAX 初回登録 | `https://lofty-herlinda-compulsively.ngrok-free.dev/liff/initial-link` |
| D-MAX QRコード | `https://lofty-herlinda-compulsively.ngrok-free.dev/liff/qr-code` |
| D-MAX 予約確認 | `https://lofty-herlinda-compulsively.ngrok-free.dev/liff/appointments` |
| D-MAX 家族登録 | `https://lofty-herlinda-compulsively.ngrok-free.dev/liff/family-register` |
| D-MAX Web予約 | `https://lofty-herlinda-compulsively.ngrok-free.dev/liff/web-booking` |

⚠️ **重要**: ngrokドメインが変更された場合は、すべてのEndpoint URLを更新してください。

## テスト手順

### 1. LINEアプリでの初回登録テスト

1. LINEアプリを開く
2. D-MAXの公式アカウントのトークルームを開く
3. 下部のリッチメニューから「初回登録」ボタンをタップ
4. LIFF画面が開き、以下が表示されるはず：
   - 「初回登録」のヘッダー
   - 招待コード入力欄
   - 生年月日入力欄

### 2. デバッグ方法（ブラウザコンソールで確認）

LINEアプリ内のブラウザでコンソールログを確認する方法：

#### Android の場合
1. PCとAndroidデバイスをUSBケーブルで接続
2. Chrome DevTools を開く (chrome://inspect)
3. デバイス一覧から該当のWebViewを選択

#### iOS の場合
1. iPhone の設定 → Safari → 詳細 → Webインスペクタを有効化
2. MacとiPhoneをケーブルで接続
3. Mac の Safari → 開発 → [デバイス名] → [該当ページ]

#### 確認すべきコンソールログ
正常な場合、以下のログが順番に表示されます：
```
LIFF初期化開始...
LIFF SDK読み込み完了
localStorageからLIFF ID取得: 2008447826-wjJgbD7o
使用するLIFF ID: 2008447826-wjJgbD7o
LIFF初期化中...
LIFF初期化成功
ログイン済み - プロフィール取得中
プロフィール取得成功: [LINE User ID]
```

### 3. エラーが出る場合

#### エラー: "LIFF IDが設定されていません"
**原因**: 設定画面でLIFF IDが保存されていない、または環境変数が設定されていない

**解決方法**:
1. `http://localhost:3000/settings` にアクセス
2. 「LINE連携設定」タブを開く
3. 各LIFF IDを入力して保存

#### エラー: "初期化に失敗しました"
**原因**: LIFF IDが間違っている、またはEndpoint URLが正しくない

**解決方法**:
1. LINE Developers Console で LIFF ID を確認
2. Endpoint URL が ngrok ドメインと一致しているか確認
3. LIFF アプリのステータスが「公開中」になっているか確認

#### エラー: "初期化中のまま止まる"（ブラウザで直接アクセスした場合）
**原因**: LIFFアプリをブラウザで直接開いている

**解決方法**: LINEアプリから開いてください（上記「正しい方法」参照）

## リッチメニューの設定確認

リッチメニューが正しく設定されているか確認する方法：

1. LINE公式アカウントのトークルームを開く
2. 画面下部にメニューが表示されているか確認
3. 各ボタンが正しく機能するかテスト

リッチメニューを再作成する場合：
1. `http://localhost:3000/settings` にアクセス
2. 「LINE連携設定」タブで設定を確認
3. 「LINEに反映」ボタンをクリック

## 環境変数の設定

`.env.local` ファイルに以下が設定されていることを確認してください：

```env
# LIFF App IDs (fallback values - settings UI takes priority)
NEXT_PUBLIC_LIFF_ID_INITIAL_LINK=2008447826-wjJgbD7o
NEXT_PUBLIC_LIFF_ID_QR_CODE=2008447826-dOjOoqM3
NEXT_PUBLIC_LIFF_ID_APPOINTMENTS=2008447826-dB18MVka
NEXT_PUBLIC_LIFF_ID_FAMILY_REGISTER=2008447826-Dyo8R47e
NEXT_PUBLIC_LIFF_ID_WEB_BOOKING=2008447826-MYxkGrKv
```

⚠️ **注意**: 環境変数を変更した場合は、開発サーバーを再起動してください。

## よくある質問

### Q1: リッチメニューのボタンを押すと「システムエラー」が出る
**A**: 以下を確認してください：
1. LINE Developers Console で各LIFF appのEndpoint URLが正しいか
2. ngrokが起動しているか (`http://localhost:4040` でトンネル状態を確認)
3. 開発サーバーが起動しているか (`npm run dev`)

### Q2: LIFF IDはどこで確認できる？
**A**: LINE Developers Console → Provider → Channel (LINE Login) → LIFFタブ → 各LIFF appの詳細画面

### Q3: Channel IDとLIFF IDの違いは？
**A**:
- **Channel ID**: LINEチャネル全体の10桁のID（Basic settingsで確認）
- **LIFF ID**: 個々のLIFFアプリの10桁のID（LIFFタブで確認）
- 両者は異なる値です

### Q4: ngrokのドメインが変わったらどうする？
**A**: 以下を更新する必要があります：
1. LINE Developers Console の全LIFF appのEndpoint URL
2. `next.config.js` の `images.domains` 配列
3. 設定画面のWebhook URL（必要に応じて）

### Q5: ブラウザで直接開けないの？
**A**: LIFFアプリは必ずLINEアプリ内から開く必要があります。これはLINE Front-end Frameworkの仕様です。

## トラブルシューティングチェックリスト

問題が発生した場合、以下を順番に確認してください：

- [ ] LINEアプリ内から開いている（ブラウザで直接開いていない）
- [ ] ngrokが起動している
- [ ] 開発サーバー (`npm run dev`) が起動している
- [ ] LINE Developers Console でLIFF appのEndpoint URLが正しい
- [ ] LIFF appのステータスが「公開中」になっている
- [ ] 設定画面 (`/settings`) でLIFF IDが保存されている
- [ ] `.env.local` に環境変数が設定されている
- [ ] リッチメニューが正しく作成されている

## サポート

さらにサポートが必要な場合：
1. ブラウザコンソールのログをコピー
2. エラーメッセージのスクリーンショットを撮る
3. どの手順で問題が発生したかを記録
