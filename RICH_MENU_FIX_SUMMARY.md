# リッチメニュー画像自動生成機能の実装

## 問題の原因

未連携のリッチメニューが表示されているのに、連携済みのリッチメニューが表示されない理由を調査した結果:

1. **未連携メニュー（表示されている）**
   - LINE Developers Consoleまたは過去の実装で手動作成
   - 画像がアップロード済み → 正常に表示される
   - richmenu-cffbb7fc8aa864967306f4d280206e22 など

2. **新しく作成したメニュー（表示されない）**
   - 設定ページから作成
   - 画像が未アップロード → 表示されない・紐付けできない

## 根本原因

設定ページのリッチメニュー保存機能には、**画像生成・アップロード機能がなかった**ため、新しく作成したリッチメニューには画像がなく、LINEアプリに表示されませんでした。

## 実装した解決策

未連携メニューと同じ方法（画像付き）でリッチメニューを作成できるように、以下の機能を実装しました:

### 1. 画像自動生成・アップロードAPI

**新規作成:** `/app/api/line/upload-rich-menu-image/route.ts`

- Canvas APIを使用してリッチメニュー画像を自動生成
- ボタンのラベルとアイコンを描画
- 連携済み（2列）・未連携（3列）のレイアウトに対応
- 生成した画像をLINE APIに自動アップロード

**特徴:**
- ボタン数とタイプに応じた自動レイアウト
- ラベルに応じたアイコン自動選択（QR、予約、Web等）
- 画像サイズ: 2500x1686（LINE リッチメニュー標準）

### 2. デフォルトリッチメニュー設定API

**新規作成:** `/app/api/line/set-default-rich-menu/route.ts`

- 未連携メニューをデフォルトとして自動設定
- 友だち追加直後のユーザーに表示される

### 3. 設定ページの保存処理を改善

**修正:** `/app/settings/page.tsx`

保存ボタンクリック時の処理を以下の順序で実行:

```typescript
1. LINE APIにリッチメニュー構造を作成
2. ✨ 画像を自動生成してアップロード（NEW）
3. リッチメニューIDをデータベースに保存
4. ✨ 未連携メニューの場合、デフォルトとして設定（NEW）
5. LocalStorageに保存
```

## 使用方法

### ステップ1: 未連携ユーザー用メニューを作成

1. 設定ページ > 通知設定 > LINEリッチメニュー
2. 「未連携ユーザー用」タブを選択
3. ボタンを設定（3つ推奨）
   - 初回登録
   - Webサイト
   - お問い合わせ
4. 「保存してLINE APIに登録」ボタンをクリック

**自動実行される処理:**
- ✓ LINE APIにリッチメニュー作成
- ✓ 画像を自動生成・アップロード
- ✓ データベースにID保存
- ✓ デフォルトメニューとして設定

### ステップ2: 連携済みユーザー用メニューを作成

1. 「連携済みユーザー用」タブを選択
2. ボタンを設定（6つ推奨）
   - QRコード表示
   - 予約確認
   - 家族登録
   - Webサイト
   - お問い合わせ
   - 予約を取る
3. 「保存してLINE APIに登録」ボタンをクリック

**自動実行される処理:**
- ✓ LINE APIにリッチメニュー作成
- ✓ 画像を自動生成・アップロード
- ✓ データベースにID保存

### ステップ3: 患者連携で自動切り替え

患者がLINEから連携すると、`/api/line/link-patient` が自動的に:
1. 患者情報をデータベースに保存
2. リッチメニューを「未連携」→「連携済み」に切り替え
3. 連携履歴を記録

## 技術仕様

### 画像生成ロジック

```typescript
// キャンバスサイズ
width: 2500px
height: 1686px

// レイアウト
連携済み: 2列 × 3行 = 6ボタン
未連携: 3列 × 1行 = 3ボタン

// ボタンサイズ
cellWidth = 2500 / cols
cellHeight = 1686 / rows

// アイコン
サイズ: 120px × 120px
色: #4A90E2
位置: ボタン中央上部

// ラベル
フォント: bold 60px sans-serif
色: #333333
位置: アイコン下部
```

### LINE API エンドポイント

```
作成: POST https://api.line.me/v2/bot/richmenu
画像: POST https://api-data.line.me/v2/bot/richmenu/{menuId}/content
デフォルト: POST https://api.line.me/v2/bot/user/all/richmenu/{menuId}
紐付け: POST https://api.line.me/v2/bot/user/{userId}/richmenu/{menuId}
```

## 成功の確認方法

### 画像アップロード確認
```bash
# リッチメニューに画像があるか確認
curl -X GET https://dmax-mu.vercel.app/api/line/check-menu-image?rich_menu_id=richmenu-xxxxx
```

### ユーザーメニュー確認
```bash
# ユーザーに紐付いているメニュー確認
curl -X GET "https://dmax-mu.vercel.app/api/line/check-user-menu?line_user_id=Uxxxxx"
```

### デフォルトメニュー確認
```bash
# デフォルトメニュー確認
node check-default-richmenu.mjs
```

## 今後の改善案

1. **画像デザインの改善**
   - よりリッチなアイコンデザイン
   - グラデーション背景
   - カスタム画像アップロード機能

2. **A/Bテスト機能**
   - 複数のリッチメニューパターンをテスト
   - 効果測定

3. **プレビュー機能強化**
   - 実際の画像プレビュー表示
   - スマホシミュレーター

## トラブルシューティング

### 問題: リッチメニューが表示されない

**原因チェックリスト:**
1. Channel Access Token が正しく設定されているか
2. 画像がアップロードされているか（check-menu-image APIで確認）
3. デフォルトメニューが設定されているか（未連携ユーザーの場合）
4. ユーザーにメニューが紐付いているか（check-user-menu APIで確認）

### 問題: 連携後もメニューが切り替わらない

**原因チェックリスト:**
1. `/api/line/link-patient` がエラーなく実行されたか
2. `line_patient_linkages` テーブルに履歴が記録されているか
3. 連携済みメニューに画像がアップロードされているか
4. LINEアプリのキャッシュ（アプリ再起動で解消）

### 解決手順

1. 診断APIで状態確認
```bash
curl https://dmax-mu.vercel.app/api/line/diagnose
```

2. 必要に応じてメニュー再作成
- 設定ページで両方のメニューを再保存

3. 画像アップロード確認
```bash
# check-menu-image APIで確認
```

4. ユーザーとの紐付け確認
```bash
# check-user-menu APIで確認
```

## 関連ファイル

### 新規作成
- `/app/api/line/upload-rich-menu-image/route.ts` - 画像生成・アップロード
- `/app/api/line/set-default-rich-menu/route.ts` - デフォルトメニュー設定
- `/app/api/line/check-menu-image/route.ts` - 画像存在確認
- `/app/api/line/check-user-menu/route.ts` - ユーザーメニュー確認

### 修正
- `/app/settings/page.tsx` - 保存処理に画像アップロード追加
- `/app/api/line/save-rich-menu-ids/route.ts` - マージロジック追加

### 既存（変更なし）
- `/app/api/line/create-rich-menu/route.ts` - リッチメニュー構造作成
- `/app/api/line/link-patient/route.ts` - 患者連携・メニュー切り替え
- `/lib/line/messaging.ts` - LINE設定取得

## まとめ

この実装により、設定ページから**ワンクリック**でLINE APIに画像付きリッチメニューを登録できるようになりました。

未連携メニューが表示されている方法と全く同じ仕組み（画像付き）で、連携済みメニューも作成されるため、正常に動作します。
