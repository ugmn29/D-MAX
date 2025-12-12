# LINEリッチメニュー自動切り替え機能セットアップガイド

## 概要

患者がLINE連携を行った際に、リッチメニューが自動的に「未連携用（3ボタン）」から「連携済み用（6ボタン）」に切り替わる機能が実装されました。

## 実装内容

### 1. 作成されたAPIエンドポイント

- **`/api/line/create-rich-menu`**
  - LINE Messaging APIにリッチメニューを作成
  - ボタン配置を自動計算してLINE API形式に変換
  - 作成したリッチメニューIDを返却

- **`/api/line/save-rich-menu-ids`**
  - リッチメニューIDをデータベースに保存
  - `clinic_settings` テーブルの `line_rich_menu` キーに保存
  - 既存の自動切り替えロジックが参照

### 2. 設定画面の更新

- **場所**: 設定ページ → 通知タブ → LINEリッチメニュータブ
- **変更点**:
  - 「LINEに反映」ボタン → 「LINE APIに登録」ボタンに変更
  - クリック時にリッチメニューをLINE APIに登録
  - リッチメニューIDを自動的にデータベースに保存
  - 成功メッセージでリッチメニューIDを表示

## セットアップ手順

### ステップ 1: LINE設定を保存

1. 設定ページの「通知」タブ → 「接続設定」を開く
2. 「LINE公式アカウント設定」セクションに以下を入力:
   - チャンネルID
   - チャンネルシークレット
   - チャンネルアクセストークン
   - Webhook URL（例: `https://d-max-lemon.vercel.app/api/line/webhook`）
3. 「設定を保存」ボタンをクリック

### ステップ 2: リッチメニューを登録

1. 設定ページの「通知」タブ → 「LINEリッチメニュー」を開く

2. **未連携ユーザー用メニューを登録**:
   - 「未連携ユーザー用」タブを選択
   - 各ボタンのラベルとURLを確認（デフォルト: 初回登録、Webサイト、お問合せ）
   - 「LINE APIに登録」ボタンをクリック
   - 成功メッセージとリッチメニューIDを確認

3. **連携済みユーザー用メニューを登録**:
   - 「連携済みユーザー用」タブを選択
   - 各ボタンのラベルとURLを確認（デフォルト: QRコード、予約確認、家族登録、Webサイト、お問合せ、予約を取る）
   - 「LINE APIに登録」ボタンをクリック
   - 成功メッセージとリッチメニューIDを確認

### ステップ 3: 動作確認

1. **患者連携を実行**:
   - LINEアプリで「初回登録」ボタンをタップ
   - 連携フローを完了

2. **リッチメニューの切り替えを確認**:
   - 連携後、リッチメニューが6ボタンに変わることを確認
   - 各ボタンが正しく動作することを確認

3. **連携解除を確認**:
   - 患者詳細ページで「連携解除」ボタンをクリック
   - リッチメニューが3ボタンに戻ることを確認

## データベース構造

### `clinic_settings` テーブル

```sql
-- LINE基本設定
{
  clinic_id: "...",
  setting_key: "line",
  setting_value: {
    channel_access_token: "...",
    channel_secret: "...",
    channel_id: "...",
    webhook_url: "..."
  }
}

-- リッチメニューID
{
  clinic_id: "...",
  setting_key: "line_rich_menu",
  setting_value: {
    line_registered_rich_menu_id: "richmenu-xxx",
    line_unregistered_rich_menu_id: "richmenu-yyy"
  }
}
```

## 自動切り替えの仕組み

1. **患者連携時** (`/api/line/link-patient`):
   - 連携完了後、`/api/line/switch-rich-menu` を呼び出し
   - `menuType: 'registered'` を指定
   - データベースから `line_registered_rich_menu_id` を取得
   - LINE APIでユーザーのリッチメニューを切り替え

2. **連携解除時** (`/api/line/unlink-patient`):
   - 解除完了後、`/api/line/switch-rich-menu` を呼び出し
   - `menuType: 'unregistered'` を指定
   - データベースから `line_unregistered_rich_menu_id` を取得
   - LINE APIでユーザーのリッチメニューを切り替え

## トラブルシューティング

### リッチメニューが切り替わらない

1. **LINE設定を確認**:
   ```bash
   source .env.local && node check-line-linkages.mjs
   ```

2. **リッチメニューIDを確認**:
   - 設定ページで両方のリッチメニューを登録したか確認
   - データベースに保存されているか確認

3. **Vercelログを確認**:
   ```bash
   vercel logs
   ```
   - 「リッチメニュー切り替え」のログを探す
   - エラーメッセージを確認

### リッチメニュー登録時のエラー

- **401 Unauthorized**:
  - Channel Access Tokenが正しいか確認
  - トークンの有効期限を確認

- **400 Bad Request**:
  - ボタンのURLが正しい形式か確認
  - 相対パス（`/appointment`）は自動的に絶対URLに変換されます

## 次のステップ

1. **リッチメニュー画像のアップロード**:
   - LINE Developers Consoleでリッチメニュー画像をアップロード
   - サイズ: 2500x1686px
   - 形式: JPEG or PNG

2. **デフォルトリッチメニューの設定**:
   - LINE Developers Consoleで未連携用メニューをデフォルトに設定

3. **本番環境でのテスト**:
   - 実際の患者アカウントで連携・解除をテスト
   - リッチメニューの切り替えを確認

## 参考資料

- [LINE Messaging APIドキュメント](https://developers.line.biz/ja/docs/messaging-api/)
- [リッチメニュー作成ガイド](https://developers.line.biz/ja/docs/messaging-api/using-rich-menus/)
- [LIFF_SETUP_GUIDE.md](./LIFF_SETUP_GUIDE.md) - LIFF設定ガイド
