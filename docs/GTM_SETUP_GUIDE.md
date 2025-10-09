# Google Tag Manager 設定ガイド

Web予約効果測定システムで使用する外部トラッキングツールの設定方法を説明します。

## 概要

このシステムでは以下の3つのトラッキング手法を併用します:

1. **自社DB（独自トラッキング）** - UTMパラメータとファネルイベントを記録
2. **Google Tag Manager (GTM)** - 各種タグを一元管理
3. **外部ツール** - Google Analytics 4、Google Ads、META Pixel

## 1. Google Tag Managerのセットアップ

### 1.1 アカウント作成

1. [Google Tag Manager](https://tagmanager.google.com/) にアクセス
2. 「アカウントを作成」をクリック
3. アカウント名: `D-MAX クリニック名`
4. 国: 日本
5. コンテナ名: `Web予約サイト`
6. プラットフォーム: **ウェブ**

### 1.2 GTMコードの設置

アカウント作成後、以下のコードが表示されます:

```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
<!-- End Google Tag Manager -->
```

**設置場所:**
- `/app/layout.tsx` の `<head>` タグ内に追加
- `<body>` タグ直後に `<noscript>` 版も追加

## 2. Google Analytics 4 (GA4) の設定

### 2.1 GA4プロパティ作成

1. [Google Analytics](https://analytics.google.com/) にアクセス
2. 「管理」→「プロパティを作成」
3. プロパティ名: `D-MAX Web予約`
4. タイムゾーン: 日本
5. データストリームを作成: **ウェブ**
6. URL: あなたのWebサイトURL
7. 測定ID (G-XXXXXXXXXX) をコピー

### 2.2 GTMでGA4タグを設定

1. GTMの「タグ」→「新規」
2. タグの種類: **Google アナリティクス: GA4 設定**
3. 測定ID: 上でコピーしたID (G-XXXXXXXXXX)
4. トリガー: **All Pages**
5. タグ名: `GA4 - 全ページ計測`
6. 保存

### 2.3 GA4でカスタムイベントを設定

以下のイベントをGTMで設定します:

#### イベント1: メニュー選択
- イベント名: `select_menu`
- トリガー: カスタムイベント `menu_selected`
- パラメータ:
  - `menu_name`: メニュー名
  - `menu_id`: メニューID

#### イベント2: 予約完了
- イベント名: `booking_complete`
- トリガー: カスタムイベント `booking_completed`
- パラメータ:
  - `value`: 予約金額（もしあれば）
  - `menu_name`: メニュー名

## 3. Google Ads コンバージョントラッキング

### 3.1 Google Adsでコンバージョンアクション作成

1. Google Ads管理画面 → 「ツールと設定」
2. 「測定」→「コンバージョン」
3. 「新しいコンバージョンアクション」
4. ソース: **ウェブサイト**
5. カテゴリ: **予約**
6. コンバージョン名: `Web予約完了`
7. 値: 毎回同じ値（例: 10000円）
8. カウント方法: **全件**
9. コンバージョンウィンドウ: 30日

### 3.2 GTMでGoogle Adsタグを設定

1. GTMの「タグ」→「新規」
2. タグの種類: **Google Ads コンバージョントラッキング**
3. コンバージョンID: `AW-XXXXXXXXX`
4. コンバージョンラベル: `XXXXXXXXXXXXX`
5. トリガー: カスタムイベント `booking_completed`
6. タグ名: `Google Ads - 予約完了CV`
7. 保存

## 4. META Pixel (Facebook/Instagram広告)

### 4.1 META Pixel作成

1. [Meta Business Suite](https://business.facebook.com/) にアクセス
2. 「イベントマネージャ」→「データソースを接続」
3. 「ウェブ」→「Meta Pixel」
4. Pixel名: `D-MAX Web予約`
5. PixelID (16桁の数字) をコピー

### 4.2 GTMでMETA Pixelタグを設定

#### ベースコード
1. GTMの「タグ」→「新規」
2. タグの種類: **カスタムHTML**
3. HTML:
```html
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', 'YOUR_PIXEL_ID');
fbq('track', 'PageView');
</script>
```
4. `YOUR_PIXEL_ID` を実際のPixel IDに置き換え
5. トリガー: **All Pages**
6. タグ名: `META Pixel - ベースコード`
7. 保存

#### 予約完了イベント
1. GTMの「タグ」→「新規」
2. タグの種類: **カスタムHTML**
3. HTML:
```html
<script>
fbq('track', 'Lead', {
  content_name: '{{menu_name}}',
  value: {{booking_value}},
  currency: 'JPY'
});
</script>
```
4. トリガー: カスタムイベント `booking_completed`
5. タグ名: `META Pixel - 予約完了`
6. 保存

## 5. データレイヤーの実装

`/app/web-booking/page.tsx` に以下のコードを追加してください:

### 予約完了時
```typescript
// 予約完了時にデータレイヤーにpush
if (typeof window !== 'undefined' && (window as any).dataLayer) {
  (window as any).dataLayer.push({
    event: 'booking_completed',
    menu_name: selectedMenuData?.name,
    booking_value: selectedMenuData?.price || 0,
    menu_id: bookingData.selectedMenu,
    is_new_patient: bookingData.isNewPatient
  })
}
```

### メニュー選択時
```typescript
// メニュー選択時
if (typeof window !== 'undefined' && (window as any).dataLayer) {
  (window as any).dataLayer.push({
    event: 'menu_selected',
    menu_name: menu.display_name || menu.treatment_menu_name,
    menu_id: menu.treatment_menu_id
  })
}
```

## 6. GTMの公開

1. GTMの右上「公開」ボタンをクリック
2. バージョン名: `初期設定`
3. バージョンの説明: `GA4、Google Ads、META Pixelの初期設定`
4. 「公開」をクリック

## 7. 動作確認

### GTM Previewモードで確認
1. GTM画面右上「プレビュー」
2. Web予約ページのURLを入力
3. Tag Assistantで以下を確認:
   - ページロード時に全てのベースタグが発火
   - メニュー選択時にイベントが発火
   - 予約完了時にコンバージョンタグが発火

### GA4 DebugViewで確認
1. GA4管理画面 → 「設定」→「DebugView」
2. Web予約ページで操作
3. リアルタイムでイベントが表示されることを確認

### META Pixel Helperで確認
1. Chrome拡張機能 [Meta Pixel Helper](https://chrome.google.com/webstore/detail/meta-pixel-helper/) をインストール
2. Web予約ページを開く
3. 拡張機能アイコンをクリックし、Pixelが正しく発火していることを確認

## 8. レポートの確認

### GA4
- **リアルタイム** → 現在のユーザー動向
- **獲得** → トラフィック獲得レポート
- **エンゲージメント** → イベント、コンバージョン
- **探索** → カスタムレポート作成

### Google Ads
- **コンバージョン** → コンバージョン数と費用
- **キャンペーン** → ROASの確認

### META Ads
- **広告マネージャ** → イベント、コンバージョン
- **ピクセル** → イベント数の確認

## 9. プライバシーポリシーの更新

以下の内容をプライバシーポリシーに追加してください:

```
当院では、Webサイトの利用状況を把握し、サービス向上のため、以下のツールを使用しています:
- Google Analytics
- Google 広告
- Meta Pixel (Facebook/Instagram)

これらのツールは、Cookieを使用してユーザーの行動を追跡します。
詳細は各サービスのプライバシーポリシーをご確認ください。
```

## トラブルシューティング

### タグが発火しない
- GTMのプレビューモードで確認
- ブラウザのコンソールでエラーを確認
- トリガー条件を再確認

### データがGA4に表示されない
- 測定IDが正しいか確認
- データストリームが有効か確認
- 最大24時間遅延する場合があります

### コンバージョンが計測されない
- コンバージョンタグのトリガーを確認
- Google Ads Tag Assistantで確認
- コンバージョンIDとラベルが正しいか確認

## サポート

設定でお困りの場合は、D-MAXサポートチームまでお問い合わせください。
