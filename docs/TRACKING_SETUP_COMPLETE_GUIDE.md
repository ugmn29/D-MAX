# Web予約流入経路測定 完全セットアップガイド

## 📊 概要

このシステムでは、以下のツールを統合して、あらゆる経路からの流入を追跡できます:

### 統合されたツール

1. **独自データベース (D-MAX)** - メイン測定システム
2. **Google Tag Manager (GTM)** - タグ一元管理
3. **Google Analytics 4 (GA4)** - ユーザー行動分析
4. **Google Ads** - リスティング広告測定
5. **META Pixel** - Instagram/Facebook広告測定
6. **Microsoft Clarity** - ヒートマップ・セッションレコーディング

### 測定できる流入経路

- Googleリスティング広告
- Instagram広告
- ポスティングチラシ（QRコード）
- 看板（QRコード）
- HP経由の予約ボタン
- SNS投稿
- 紹介カード
- その他（全てUTMパラメータで識別）

### 2重測定システム

- **UTM追跡**: URLパラメータで自動測定
- **アンケート**: 患者の認識を測定
- **統合判定**: 両方を比較して最終流入元を判定

---

## 🚀 セットアップ手順

### Step 1: データベースマイグレーション

```bash
cd /path/to/D-MAX
npx supabase db push
```

このマイグレーションで以下のテーブルが追加/更新されます:
- `tracking_tags` - トラッキングタグ設定（Microsoft Clarityフィールド追加）
- 既存の`patient_acquisition_sources`, `web_booking_funnel_events`, `ad_spend_records`は変更なし

---

### Step 2: Google Tag Manager (GTM) のセットアップ

#### 2.1 GTMアカウント作成

1. [Google Tag Manager](https://tagmanager.google.com/) にアクセス
2. 「アカウントを作成」をクリック
3. **アカウント名**: `D-MAX [クリニック名]`
4. **国**: 日本
5. **コンテナ名**: `Web予約サイト`
6. **プラットフォーム**: ウェブ

#### 2.2 コンテナIDを取得

- 作成すると `GTM-XXXXXXX` という形式のIDが発行されます
- このIDをコピーしてください

#### 2.3 D-MAXに設定

1. D-MAXにログイン
2. 「分析」→「Web予約効果」→「タグ設定」タブ
3. **Google Tag Manager** セクション:
   - スイッチをON
   - コンテナID: `GTM-XXXXXXX` を入力
4. 「保存」をクリック

✅ これでGTMが自動的にWebサイトに埋め込まれます！

---

### Step 3: Google Analytics 4 (GA4) のセットアップ

#### 3.1 GA4プロパティ作成

1. [Google Analytics](https://analytics.google.com/) にアクセス
2. 「管理」→「プロパティを作成」
3. **プロパティ名**: `D-MAX Web予約 [クリニック名]`
4. **タイムゾーン**: 日本
5. **通貨**: 日本円 (JPY)
6. 「次へ」をクリック

#### 3.2 データストリーム作成

1. プラットフォーム: **ウェブ**
2. **ウェブサイトのURL**: あなたのWebサイトURL
3. **ストリーム名**: `Web予約サイト`
4. 測定ID `G-XXXXXXXXXX` をコピー

#### 3.3 D-MAXに設定

1. 「分析」→「Web予約効果」→「タグ設定」タブ
2. **Google Analytics 4** セクション:
   - スイッチをON
   - 測定ID: `G-XXXXXXXXXX` を入力
3. 「保存」をクリック

#### 3.4 GTMでGA4タグを設定（推奨）

GTMを使う場合、GA4はGTM側でも設定します:

1. GTMコンテナを開く
2. 「タグ」→「新規」
3. タグの種類: **Google アナリティクス: GA4 設定**
4. 測定ID: `G-XXXXXXXXXX`
5. トリガー: **All Pages**
6. タグ名: `GA4 - 全ページ計測`
7. 「保存」→「公開」

---

### Step 4: Microsoft Clarity (ヒートマップ) のセットアップ

#### 4.1 Clarityプロジェクト作成

1. [Microsoft Clarity](https://clarity.microsoft.com/) にアクセス
2. Microsoftアカウントでサインイン（無料）
3. 「新しいプロジェクト」をクリック
4. **プロジェクト名**: `[クリニック名] Web予約`
5. **ウェブサイトURL**: あなたのWebサイトURL
6. Project ID（例: `abcd1234ef`）をコピー

#### 4.2 D-MAXに設定

1. 「分析」→「Web予約効果」→「タグ設定」タブ
2. **Microsoft Clarity** セクション:
   - スイッチをON
   - Project ID: `abcd1234ef` を入力
3. 「保存」をクリック

✅ これでヒートマップとセッションレコーディングが有効になります！

#### 4.3 Clarityで確認できること

- **ヒートマップ**: クリック、スクロール、マウス移動の可視化
- **セッションレコーディング**: 実際のユーザー操作を録画
- **怒りクリック検知**: ユーザーがイライラしている場所を特定
- **デッドクリック検知**: クリックしても反応しない要素を特定

---

### Step 5: Google Ads コンバージョントラッキング

#### 5.1 Google Adsでコンバージョンアクション作成

1. [Google Ads](https://ads.google.com/) 管理画面 → 「ツールと設定」
2. 「測定」→「コンバージョン」
3. 「新しいコンバージョンアクション」
4. ソース: **ウェブサイト**
5. **カテゴリ**: 予約
6. **コンバージョン名**: `Web予約完了`
7. **値**: 毎回同じ値（例: 10000円）
8. **カウント方法**: 全件
9. **コンバージョンウィンドウ**: 30日
10. コンバージョンID `AW-XXXXXXXXX` とラベルをコピー

#### 5.2 D-MAXに設定

1. 「分析」→「Web予約効果」→「タグ設定」タブ
2. **Google 広告** セクション:
   - スイッチをON
   - コンバージョンID: `AW-XXXXXXXXX`
   - コンバージョンラベル: (取得したラベル)
3. 「保存」をクリック

---

### Step 6: META Pixel (Instagram/Facebook広告)

#### 6.1 META Pixel作成

1. [Meta Business Suite](https://business.facebook.com/) にアクセス
2. 「イベントマネージャ」→「データソースを接続」
3. 「ウェブ」→「Meta Pixel」
4. **Pixel名**: `[クリニック名] Web予約`
5. Pixel ID（16桁の数字）をコピー

#### 6.2 D-MAXに設定

1. 「分析」→「Web予約効果」→「タグ設定」タブ
2. **META Pixel** セクション:
   - スイッチをON
   - Pixel ID: `1234567890123456` を入力
3. 「保存」をクリック

---

## 📱 使い方

### 1. クライアント専用URLの生成

#### HP用の予約ボタンURL

1. 「分析」→「Web予約効果」→「クライアントURL」タブ
2. URLスラッグを入力（例: `tanaka-dental`）
3. 「保存」をクリック
4. 生成されたURLとコードをコピー
5. クライアントのHPに設置

**生成例:**
```
URL: https://dmax.com/clinic/tanaka-dental/booking?utm_source=hp&utm_medium=button&utm_campaign=top
コード: <a href="...">予約する</a>
```

### 2. QRコードの生成（チラシ・看板用）

#### ポスティングチラシ用QRコード

1. 「分析」→「Web予約効果」→「QRコード生成」タブ
2. 流入元: **ポスティングチラシ**
3. メディア: **オフライン**
4. キャンペーン名: `shibuya_2025q1` (エリア・時期)
5. 「QRコード生成」をクリック
6. 「高解像度でダウンロード」→ チラシに配置

#### 看板用QRコード

1. 流入元: **看板**
2. キャンペーン名: `station_a` (設置場所)
3. QRコード生成 → ダウンロード

#### 紹介カード用QRコード

1. 流入元: **紹介カード**
2. キャンペーン名: `referral_202501` (月別)
3. QRコード生成 → ダウンロード

### 3. 広告のUTMパラメータ設定

#### Googleリスティング広告

**トラッキングテンプレート:**
```
{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={adgroupid}&utm_term={keyword}
```

#### Instagram広告

**URLパラメータ:**
```
?utm_source=instagram&utm_medium=paid&utm_campaign=april_promo&utm_content={{ad.id}}
```

---

## 📊 分析方法

### 獲得経路分析

1. 「分析」→「Web予約効果」→「獲得経路分析」タブ
2. 期間を選択
3. 流入元別の予約数を確認
4. UTM追跡 vs アンケート回答を比較
5. 「CSVエクスポート」でデータをダウンロード

### ROI/ROAS分析

1. 「分析」→「Web予約効果」→「ROI/ROAS分析」タブ
2. 「広告費管理」タブで広告費を入力
3. 流入元別のROI・ROASを確認
4. CPA（顧客獲得単価）を確認

**指標の意味:**
- **ROI**: (売上 - 広告費) ÷ 広告費 × 100
- **ROAS**: 売上 ÷ 広告費
- **CPA**: 広告費 ÷ 獲得患者数

### LTV分析

1. 「分析」→「Web予約効果」→「LTV分析」タブ
2. 流入元別の平均LTVを確認
3. どの流入元が長期的に価値が高いかを判断

### ヒートマップ分析（Microsoft Clarity）

1. [Clarity](https://clarity.microsoft.com/) にアクセス
2. プロジェクトを選択
3. 「Heatmaps」→ ページを選択
4. クリック/スクロール/エリア別に可視化

---

## 🔍 トラブルシューティング

### タグが発火しない

1. GTMの「プレビュー」モードで確認
2. ブラウザのコンソールでエラーを確認
3. 「タグ設定」でスイッチがONになっているか確認

### GA4にデータが表示されない

- 測定IDが正しいか確認
- データストリームが有効か確認
- 最大24時間遅延する場合があります
- DebugViewで確認（リアルタイム）

### Clarityにデータが表示されない

- Project IDが正しいか確認
- 24時間経過してから確認
- セッション数が少ない場合、データが表示されるまで時間がかかる

### コンバージョンが計測されない

- Google Ads Tag Assistantで確認
- コンバージョンIDとラベルが正しいか確認
- トリガー条件を確認

---

## 📈 推奨設定

### 最小構成（無料）

✅ 独自DB測定（D-MAX標準機能）
✅ Microsoft Clarity（無料・無制限）
✅ Google Analytics 4（無料）

### 推奨構成（広告運用時）

✅ 独自DB測定
✅ Google Tag Manager
✅ Google Analytics 4
✅ Microsoft Clarity
✅ Google Ads（リスティング広告運用時）
✅ META Pixel（Instagram広告運用時）

---

## 🎯 活用例

### ケース1: ポスティングチラシの効果測定

1. エリア別にQRコード生成
   - 渋谷エリア: `posting_shibuya_2025q1`
   - 目黒エリア: `posting_meguro_2025q1`
2. 各エリアに配布
3. 1週間後、分析画面で流入数を比較
4. 効果の高いエリアを特定

### ケース2: 広告媒体の比較

1. Googleリスティング、Instagram広告、看板に投資
2. それぞれUTMパラメータで追跡
3. ROI/ROAS分析で費用対効果を比較
4. 最も効率の良い媒体に予算を集中

### ケース3: Clarityでユーザー体験改善

1. Clarityでヒートマップを確認
2. クリックされているが反応しない箇所を特定
3. セッションレコーディングでユーザーの迷いを確認
4. UIを改善し、コンバージョン率アップ

---

## 📞 サポート

設定でお困りの場合は、D-MAXサポートチームまでお問い合わせください。

**参考ドキュメント:**
- [GTM設定ガイド](./GTM_SETUP_GUIDE.md)
- Google Tag Manager公式: https://tagmanager.google.com/
- Google Analytics 4公式: https://analytics.google.com/
- Microsoft Clarity公式: https://clarity.microsoft.com/
- Meta Business Suite: https://business.facebook.com/

---

## 🎉 完成！

これで、あらゆる経路からの流入を完全に追跡できるシステムが完成しました。

**測定できる流入経路の例:**
- ✅ Googleリスティング広告
- ✅ Instagram広告
- ✅ ポスティングチラシ（エリア別）
- ✅ 駅前看板（場所別）
- ✅ 紹介カード（月別）
- ✅ HP予約ボタン
- ✅ SNS投稿
- ✅ その他（カスタムURL）

**取得できるデータ:**
- ✅ 流入元別の予約数
- ✅ デバイス別の予約数
- ✅ 予約ファネルの離脱率
- ✅ 流入元別のLTV
- ✅ 広告費対効果（ROI/ROAS）
- ✅ ヒートマップ・セッションレコーディング

すべてのデータがCSVエクスポート可能で、Excelで自由に分析できます！
