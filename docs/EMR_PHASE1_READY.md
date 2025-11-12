# 電子カルテシステム - Phase 1 実装準備完了
## EMR System - Phase 1 Implementation Ready

**作成日**: 2025-11-12
**ステータス**: ✅ Phase 1 実装準備完了

---

## 📋 完了した作業

### 1. 要件すり合わせ ✅

包括的な要件定義が完了しました:

- **データフロー確認**: 病名選択 → 診療行為選択 → 保険点数計算 → 請求業務
- **診療報酬改定対応**: 診療日基準で点数表を自動選択、スナップショット保存
- **自費診療**: クリニックごとに独自料金設定、見積書発行
- **治療計画**: 既存の治療計画タブと統合
- **保険証管理**: 画像アップロード対応
- **オンライン資格確認**: Phase 4で実装予定
- **技工管理**: 技工所マスター、発注書、技工料金管理
- **訪問診療**: 施設マスター、訪問診療専用の初診料対応
- **レセプト管理**: 月次生成、140+検証ルール、審査結果・再提出管理
- **UI/UX方針**: Julea/Dentis風のワンスクリーン設計
- **音声入力統合**: 既存サブカルテの音声入力をEMRに反映

**ドキュメント**: [`docs/EMR_INTEGRATION_SUMMARY.md`](./EMR_INTEGRATION_SUMMARY.md)

---

### 2. マスターデータ取得先確認 ✅

#### 診療行為マスター（既に取得済み）
- **ファイル**: `tensuhyo_04 2/` フォルダ内のCSVファイル（8ファイル）
- **文字コード**: Shift-JIS → UTF-8変換が必要

#### 病名マスター（要ダウンロード）- 医科・歯科共通
- **提供元**: MEDIS-DC（一般財団法人医療情報システム開発センター）
- **名称**: ICD10対応標準病名マスター Ver.5.17 (2025年)
- **URL**: https://www2.medis.or.jp/stdcd/byomei/index.html
- **特徴**: 歯科病名も含む（ICD-DA分類コード採用）
- **代替**: 社会保険診療報酬支払基金 - https://www.ssk.or.jp/seikyushiharai/tensuhyo/kihonmasta/

#### 医薬品マスター（要ダウンロード）- **歯科専用**
- **提供元**: 厚生労働省
- **名称**: 歯科医薬品マスター（レセプト電算処理システム用）
- **URL（歯科専用）**: https://shinryohoshu.mhlw.go.jp/shinryohoshu/receDentalMenu/doReceDentalDownloadR06
- **重要**: 診療行為マスターと同じページからダウンロード
- **更新頻度**: 2年ごと（診療報酬改定時）
- **最終更新**: 令和7年（2025年）9月1日

**参考**: [`docs/EMR_IMPLEMENTATION_PLAN.md`](./EMR_IMPLEMENTATION_PLAN.md) セクション2

---

### 3. 実装計画書作成 ✅

包括的な実装計画書を作成しました:

**ファイル**: [`docs/EMR_IMPLEMENTATION_PLAN.md`](./EMR_IMPLEMENTATION_PLAN.md)

**内容**:
- プロジェクト概要（目的、スコープ、技術スタック）
- データソース詳細
- データベース設計（10テーブル）
- UI/UX設計（ワンスクリーン設計）
- 実装フェーズ詳細（Phase 1-4）
- セキュリティ・コンプライアンス
- データ移行計画
- テスト計画
- リスク管理
- 参考資料

**総開発期間**: 8-12ヶ月
**想定規模**: 1000+クリニック

---

### 4. TypeScript型定義作成 ✅

完全なTypeScript型定義を作成しました:

**ファイル**: [`types/emr.ts`](../types/emr.ts)

**定義された型**:
- **マスターデータ**: TreatmentCode, DiseaseCode, MedicineCode, SelfPayTreatment, Facility, Lab
- **診療記録**: MedicalRecord, TreatmentPlan, Receipt, LabOrder
- **検証・計算**: PointCalculationRequest, PointCalculationResult, ReceiptValidationResult
- **拡張型**: MedicalRecordWithRelations, ReceiptWithRelations

各型には Insert, Update バリアントも含まれています。

**統合**: [`types/database.ts`](../types/database.ts) から自動エクスポート

---

### 5. データベースマイグレーション作成 ✅

完全なSQLマイグレーションファイルを作成しました:

**ファイル**: [`supabase/migrations/20251112000001_create_emr_system_tables.sql`](../supabase/migrations/20251112000001_create_emr_system_tables.sql)

**作成されるテーブル** (10テーブル):

#### マスターデータ
1. **treatment_codes** - 診療行為マスター
2. **disease_codes** - 病名マスター
3. **medicine_codes** - 医薬品マスター
4. **self_pay_treatments** - 自費診療マスター
5. **facilities** - 施設マスター（訪問診療先）
6. **labs** - 技工所マスター

#### 診療記録
7. **medical_records** - 診療記録（電子カルテの中核）
8. **treatment_plans** - 治療計画
9. **receipts** - レセプト（診療報酬明細書）
10. **lab_orders** - 技工指示書

#### 既存テーブル拡張
- **patients**: 保険証画像、資格確認ステータス、患者負担割合
- **medical_documents**: 診療記録連携、自動生成フラグ

**機能**:
- ✅ 適切なインデックス設定（全文検索、日付範囲検索等）
- ✅ JSONB型による柔軟なデータ保存
- ✅ 外部キー制約
- ✅ CHECK制約
- ✅ updated_at自動更新トリガー
- ✅ コメント（日本語説明）
- ✅ RLS無効化（開発環境用）

---

## 📁 作成されたファイル一覧

```
D-MAX/
├── docs/
│   ├── EMR_IMPLEMENTATION_PLAN.md          (実装計画書 - 41KB)
│   └── EMR_PHASE1_READY.md                 (このファイル)
├── types/
│   ├── emr.ts                              (EMR型定義 - 新規)
│   └── database.ts                         (既存ファイル - EMR型をエクスポート追加)
└── supabase/
    └── migrations/
        └── 20251112000001_create_emr_system_tables.sql  (マイグレーション - 新規)
```

---

## 🚀 次のステップ (Phase 1 実装開始)

### ステップ1: マスターデータダウンロード

```bash
# 1. 病名マスターをダウンロード（医科・歯科共通）
# URL: https://www2.medis.or.jp/stdcd/byomei/index.html
# → ダウンロード後、tensuhyo_04 2/ フォルダに配置

# 2. 歯科医薬品マスターをダウンロード（歯科専用）
# URL: https://shinryohoshu.mhlw.go.jp/shinryohoshu/receDentalMenu/doReceDentalDownloadR06
# → ダウンロード後、tensuhyo_04 2/ フォルダに配置
# ⚠️ 重要: 診療行為マスターと同じページから歯科専用版をダウンロード
```

### ステップ2: データベースマイグレーション実行

```bash
# Supabase CLIでマイグレーション実行
cd /Users/fukunagashindai/Downloads/D-MAX
npx supabase db reset  # 開発環境の場合
# または
npx supabase db push   # 本番環境の場合
```

### ステップ3: CSVインポートツール実装

**優先順位**:
1. ✅ マイグレーション実行（上記）
2. 📝 CSV取込ユーティリティ実装 (`lib/utils/csv-import.ts`)
   - Shift-JIS → UTF-8変換
   - CSVパース
   - バリデーション
   - プレビュー機能
3. 📝 マスター管理API実装
   - `app/api/master/treatments/route.ts`
   - `app/api/master/diseases/route.ts`
   - `app/api/master/medicines/route.ts`
   - `app/api/master/self-pay/route.ts`
4. 📝 マスター管理UI実装
   - `app/settings/emr/masters/page.tsx`
   - CSV取込画面
   - 自費診療マスター管理画面

### ステップ4: 開発環境セットアップ

```bash
# 依存関係インストール（必要に応じて）
npm install papaparse iconv-lite
npm install -D @types/papaparse @types/iconv-lite

# 型チェック
npx tsc --noEmit

# 開発サーバー起動
npm run dev
```

---

## 📊 データ構造サマリー

### 診療記録 (medical_records) の構造

```typescript
{
  // 基本情報
  visit_date: '2025-11-12',
  visit_type: 'regular',

  // 病名 (JSONB配列)
  diseases: [
    {
      disease_code_id: 'uuid...',
      onset_date: '2025-11-01',
      is_primary: true,
      status: 'active',
      notes: '...'
    }
  ],

  // 診療行為 (JSONB配列)
  treatments: [
    {
      treatment_code_id: 'uuid...',
      tooth_numbers: [11, 12],
      quantity: 1,
      points: 560,
      notes: '抜髄',
      operator_id: 'staff_uuid...'
    }
  ],

  // 処方 (JSONB配列)
  prescriptions: [...],

  // 自費診療 (JSONB配列)
  self_pay_items: [...],

  // SOAP記録
  subjective: '右上奥歯が痛い',
  objective: '#11に深い齲蝕、打診痛(+)',
  assessment: 'C4 (#11)',
  plan: '抜髄、根管治療',

  // 計算結果
  total_points: 560,
  total_insurance_amount: 5600,
  patient_copay_amount: 1680,  // 30%負担

  // スナップショット（診療時点の点数表）
  snapshot_data: {
    revision_date: '2024-04-01',
    treatment_codes_version: 'R06'
  }
}
```

---

## 🔍 技術的なポイント

### 1. JSONB vs 正規化

**採用方針**: ハイブリッド設計

- **マスターデータ**: 正規化テーブル（検索・更新頻度が高い）
- **診療記録の詳細**: JSONB（柔軟性・スナップショット保存）

**理由**:
- 診療報酬改定時にマスターが変更されても、過去の診療記録は変更しない（スナップショット）
- 複雑な配列構造（diseases, treatments, prescriptions等）を柔軟に保存
- PostgreSQLのJSONB型は高性能なインデックス・クエリをサポート

### 2. 文字エンコーディング変換

```bash
# Shift-JIS → UTF-8変換コマンド
iconv -f SHIFT-JIS -t UTF-8 "01補助マスターテーブル（歯科）.csv" > treatment_master_utf8.csv
```

Node.jsでの実装:
```typescript
import iconv from 'iconv-lite'

const buffer = await fs.readFile(csvPath)
const utf8Content = iconv.decode(buffer, 'shift-jis')
```

### 3. 全文検索

GINインデックスを使用した日本語全文検索:

```sql
CREATE INDEX idx_treatment_codes_name_gin
ON treatment_codes USING gin(to_tsvector('japanese', name));

-- クエリ例
SELECT * FROM treatment_codes
WHERE to_tsvector('japanese', name) @@ to_tsquery('japanese', '抜髄');
```

### 4. 診療報酬改定対応

```sql
-- 診療日に有効な点数表を検索
SELECT * FROM treatment_codes
WHERE code = '110000110'
  AND effective_from <= '2025-11-12'
  AND (effective_to IS NULL OR effective_to >= '2025-11-12');
```

---

## ⚠️ 注意事項

### 開発環境
- RLSは現在無効化されています（開発用）
- 本番環境では必ずRLSポリシーを有効化してください

### セキュリティ
- 保険証画像はSupabase Storageに暗号化保存
- 診療記録は機密情報のため、適切なアクセス制御が必須
- レセプトデータは3年間の保存義務あり

### パフォーマンス
- 大量データの場合、ページネーション必須
- 全文検索インデックスは定期的に再構築（REINDEX）
- JSONBクエリは適切なインデックス設計が重要

### コンプライアンス
- e-文書法準拠
- 個人情報保護法準拠
- 医療情報システムの安全管理に関するガイドライン準拠

---

## 📚 参考資料

### 公式ドキュメント
- [診療報酬情報提供サービス (厚生労働省)](https://shinryohoshu.mhlw.go.jp/shinryohoshu/downloadMenu/)
- [MEDIS-DC 標準病名マスター](https://www2.medis.or.jp/stdcd/byomei/index.html)
- [社会保険診療報酬支払基金](https://www.ssk.or.jp/)
- [レセプト電算処理システム仕様書](https://shinryohoshu.mhlw.go.jp/shinryohoshu/file/spec/R06rec_mente240906.pdf)

### プロジェクトドキュメント
- [EMR統合サマリー](./EMR_INTEGRATION_SUMMARY.md)
- [EMR統合エビデンスレベル](./EMR_INTEGRATION_EVIDENCE_LEVEL.md)
- [実装計画書](./EMR_IMPLEMENTATION_PLAN.md)
- [LIFF設定ガイド](./LIFF_SETUP_GUIDE.md)

---

## ✅ チェックリスト

### Phase 1 実装準備
- [x] 要件すり合わせ完了
- [x] データソース確認
- [x] 実装計画書作成
- [x] TypeScript型定義作成
- [x] データベースマイグレーション作成

### Phase 1 実装開始前の確認事項
- [ ] 病名マスターCSVダウンロード完了
- [ ] 医薬品マスターCSVダウンロード完了
- [ ] データベースマイグレーション実行完了
- [ ] 開発環境セットアップ完了

### Phase 1 実装タスク（次回）
- [ ] CSV取込ユーティリティ実装
- [ ] マスター管理API実装
- [ ] マスター管理UI実装
- [ ] 自費診療マスター管理画面実装

---

**作成者**: Claude Code
**最終更新**: 2025-11-12

🎉 **Phase 1 実装準備が完了しました！次は実装フェーズに進めます。**
