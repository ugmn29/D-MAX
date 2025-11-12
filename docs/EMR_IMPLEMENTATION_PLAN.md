# 電子カルテシステム実装計画書
## Electronic Medical Record (EMR) System Implementation Plan

**作成日**: 2025-11-12
**プロジェクト**: D-MAX歯科診療報酬電子カルテシステム
**対象**: 歯科診療所向け完全統合型EMRシステム

---

## 1. プロジェクト概要

### 1.1 目的
既存のD-MAX予約管理システムに、厚生労働省の歯科診療報酬点数表データを統合し、以下の機能を持つ完全な電子カルテシステムを構築する:

- 診療記録入力・管理
- 病名・診療行為のコード管理
- 保険点数自動計算
- レセプト（診療報酬明細書）生成・管理
- 電子レセプト提出（UKE/XML形式）
- 医療文書自動生成
- 会計・請求管理
- 治療計画管理

### 1.2 スコープ
- **Phase 1 (1-2ヶ月)**: マスターデータ管理・取込基盤
- **Phase 2 (3-4ヶ月)**: 電子カルテ入力UI・診療記録管理
- **Phase 3 (2-3ヶ月)**: レセプト生成・検証・提出機能
- **Phase 4 (2-3ヶ月)**: オンライン資格確認・拡張機能

**総開発期間**: 8-12ヶ月
**想定規模**: 1000+クリニック、各クリニック数百名の患者、同時接続5-10名

### 1.3 技術スタック
- **フレームワーク**: Next.js 14+ (App Router)
- **言語**: TypeScript
- **データベース**: Supabase (PostgreSQL)
- **認証**: Supabase Auth
- **ストレージ**: Supabase Storage (保険証画像、PDF等)
- **UI**: React + Tailwind CSS
- **デプロイ**: Vercel (フロントエンド) + Supabase (バックエンド)

---

## 2. データソース

### 2.1 厚生労働省 診療報酬点数表マスター（歯科）

**提供元**: 厚生労働省
**ダウンロードURL（歯科専用）**: https://shinryohoshu.mhlw.go.jp/shinryohoshu/receDentalMenu/doReceDentalDownloadR06

**重要**: 医科と歯科でマスターが分かれています。必ず**歯科専用**のマスターをダウンロードしてください。

**ファイル構成** (歯科):
1. **01補助マスターテーブル（歯科）.csv** - 診療行為マスター
2. **02包括テーブル（歯科）.csv** - 包括関係（含まれる処置）
3. **03-1背反テーブル（歯科）.csv** - 同日算定不可
4. **03-2背反テーブル（歯科）.csv** - 同月算定不可
5. **03-3背反テーブル（歯科）.csv** - 同時算定不可
6. **03-4背反テーブル（歯科）.csv** - 同一部位同時算定不可
7. **03-5背反テーブル（歯科）.csv** - 同週算定不可
8. **04算定回数テーブル（歯科）.csv** - 算定回数制限
9. **歯科医薬品マスター** - 処方薬（歯科用）

**文字エンコーディング**: Shift-JIS
**更新頻度**: 2年ごと（診療報酬改定: 偶数年4月）
**最終更新**: 令和7年（2025年）9月1日

**処理方法**:
```bash
# Shift-JIS → UTF-8変換
iconv -f SHIFT-JIS -t UTF-8 "01補助マスターテーブル（歯科）.csv" > treatment_master.csv
```

### 2.2 病名マスター（医科・歯科共通）

**重要**: 病名マスターは医科・歯科共通です。歯科病名も含まれています。

**提供元1**: MEDIS-DC（一般財団法人医療情報システム開発センター）
**名称**: ICD10対応標準病名マスター
**ダウンロードURL**: https://www2.medis.or.jp/stdcd/byomei/index.html
**最新版**: Ver.5.17 (2025年)
**特徴**:
- ICD-DA分類コード採用（歯科対応）
- 歯科傷病名省略名称も含む
- レセプト電算処理システムと連携

**提供元2**: 社会保険診療報酬支払基金
**名称**: 傷病名マスター
**ダウンロードURL**: https://www.ssk.or.jp/seikyushiharai/tensuhyo/kihonmasta/
**最終更新**: 2025年10月
**特徴**:
- レセプト電算処理用
- MEDIS-DC版と同じ内容（フィールド構造のみ異なる）

**推奨**: MEDIS-DC版（より詳細なICD10コード対応、歯科対応確認済み）

### 2.3 医薬品マスター（歯科専用）

**重要**: 医薬品マスターは医科・歯科で分かれています。診療行為マスターと同じ歯科専用ページからダウンロードしてください。

**提供元**: 厚生労働省
**名称**: 歯科医薬品マスター（レセプト電算処理システム用）
**ダウンロードURL（歯科専用）**: https://shinryohoshu.mhlw.go.jp/shinryohoshu/receDentalMenu/doReceDentalDownloadR06
**更新頻度**: 2年ごと（診療報酬改定時）
**最終更新**: 令和7年（2025年）9月1日

**注意**:
- 歯科診療行為マスターと同じページからダウンロード
- 処方薬（歯科用）が含まれる
- 一般的な医薬品マスター（医科用）とは異なるため注意

---

## 3. データベース設計

### 3.1 新規テーブル一覧

#### 3.1.1 マスターデータテーブル

**① treatment_codes (診療行為マスター)**
```typescript
{
  id: string (UUID, PK)
  code: string (9桁診療行為コード + 5桁加算コード, UNIQUE)
  name: string (診療行為名称)
  category: string (カテゴリ)
  points: number (基本点数)
  inclusion_rules: string[] (包括される処置コード配列)
  exclusion_rules: {
    same_day: string[]      // 同日不可
    same_month: string[]    // 同月不可
    simultaneous: string[]  // 同時不可
    same_site: string[]     // 同一部位同時不可
    same_week: string[]     // 同週不可
  }
  frequency_limits: {
    period: 'day' | 'week' | 'month' | 'year'
    max_count: number
  }[]
  effective_from: date (診療報酬改定適用開始日)
  effective_to: date | null (適用終了日)
  requires_documents: string[] (必須文書コード, 例: ['歯科疾患管理料'])
  metadata: jsonb (その他属性)
  created_at: timestamp
  updated_at: timestamp
}
```

**インデックス**:
- `code` (UNIQUE)
- `effective_from, effective_to` (診療日ベース検索用)
- `name` (GIN index for full-text search)

---

**② disease_codes (病名マスター)**
```typescript
{
  id: string (UUID, PK)
  code: string (病名コード, UNIQUE)
  name: string (病名)
  kana: string (カナ読み)
  icd10_code: string (ICD10コード)
  category: string (カテゴリ)
  is_dental: boolean (歯科関連フラグ)
  synonyms: string[] (同義語配列)
  effective_from: date
  effective_to: date | null
  metadata: jsonb
  created_at: timestamp
  updated_at: timestamp
}
```

**インデックス**:
- `code` (UNIQUE)
- `name` (GIN index)
- `kana` (検索用)
- `icd10_code`

---

**③ medicine_codes (医薬品マスター)**
```typescript
{
  id: string (UUID, PK)
  code: string (医薬品コード, UNIQUE)
  name: string (医薬品名)
  generic_name: string (一般名)
  manufacturer: string (製造元)
  unit: string (単位: 錠、mL等)
  price_per_unit: number (薬価)
  category: string (カテゴリ)
  prescription_required: boolean (処方箋要否)
  effective_from: date
  effective_to: date | null
  metadata: jsonb
  created_at: timestamp
  updated_at: timestamp
}
```

---

**④ self_pay_treatments (自費診療マスター)**
```typescript
{
  id: string (UUID, PK)
  clinic_id: string (FK → clinics.id)
  code: string (クリニック内コード)
  name: string (診療名)
  description: text (説明)
  price: number (料金)
  tax_rate: number (消費税率, 0.10等)
  category: string (カテゴリ)
  is_active: boolean
  display_order: number
  created_at: timestamp
  updated_at: timestamp
}
```

**UNIQUE制約**: `(clinic_id, code)`

---

#### 3.1.2 診療記録テーブル

**⑤ medical_records (診療記録)**
```typescript
{
  id: string (UUID, PK)
  patient_id: string (FK → patients.id)
  clinic_id: string (FK → clinics.id)
  visit_date: date (診療日)
  visit_type: 'initial' | 'regular' | 'emergency' | 'home_visit' (診療区分)
  facility_id: string | null (FK → facilities.id, 訪問診療時)

  // 病名情報
  diseases: {
    disease_code_id: string (FK → disease_codes.id)
    onset_date: date | null (発症日)
    is_primary: boolean (主病名フラグ)
    status: 'active' | 'resolved' (状態)
    notes: string (メモ)
  }[]

  // 診療内容
  treatments: {
    treatment_code_id: string (FK → treatment_codes.id)
    tooth_numbers: number[] (対象歯番号配列)
    quantity: number (数量)
    points: number (計算点数)
    notes: string (メモ)
    operator_id: string (FK → staff.id, 施術者)
  }[]

  // 処方
  prescriptions: {
    medicine_code_id: string (FK → medicine_codes.id)
    quantity: number (数量)
    dosage: string (用法)
    days: number (日数)
    notes: string
  }[]

  // 自費診療
  self_pay_items: {
    self_pay_treatment_id: string (FK �� self_pay_treatments.id)
    quantity: number
    unit_price: number
    subtotal: number
    tax: number
    total: number
    notes: string
  }[]

  // 計算結果
  total_points: number (合計点数)
  total_insurance_amount: number (保険分請求額)
  patient_copay_amount: number (患者負担額)
  self_pay_amount: number (自費合計)

  // SOAP記録（既存サブカルテ機能統合）
  subjective: text (S: 主訴)
  objective: text (O: 所見)
  assessment: text (A: 評価)
  plan: text (P: 計画)

  // 関連情報
  related_document_ids: string[] (関連医療文書ID配列)
  treatment_plan_id: string | null (FK → treatment_plans.id)
  receipt_id: string | null (FK → receipts.id, レセプト番号)

  // メタデータ
  created_by: string (FK → staff.id)
  created_at: timestamp
  updated_by: string (FK → staff.id)
  updated_at: timestamp

  // 監査ログ
  version: number (バージョン番号)
  snapshot_data: jsonb (診療時点のマスターデータスナップショット)
}
```

**RLS (Row Level Security)**:
- 同一クリニックのスタッフのみ閲覧・編集可能
- 閲覧専用スタッフは編集不可

---

**⑥ treatment_plans (治療計画)**
```typescript
{
  id: string (UUID, PK)
  patient_id: string (FK → patients.id)
  clinic_id: string (FK → clinics.id)
  title: string (治療計画名)
  status: 'draft' | 'active' | 'completed' | 'cancelled'

  // 計画内容
  planned_treatments: {
    treatment_code_id: string
    tooth_numbers: number[]
    sequence: number (実施順序)
    estimated_date: date | null
    completed_date: date | null
    medical_record_id: string | null (実施記録ID)
    notes: string
  }[]

  // 見積もり
  estimated_total_points: number
  estimated_insurance_amount: number
  estimated_patient_amount: number
  estimated_self_pay_amount: number

  // 関連情報
  created_by: string (FK → staff.id)
  created_at: timestamp
  updated_by: string
  updated_at: timestamp
}
```

---

**⑦ receipts (レセプト)**
```typescript
{
  id: string (UUID, PK)
  clinic_id: string (FK → clinics.id)
  patient_id: string (FK → patients.id)
  year_month: string ('2025-11' 形式)

  // 医療記録
  medical_record_ids: string[] (対象診療記録ID配列)

  // 計算結果
  total_points: number
  total_amount: number (点数 × 10円)
  insurance_amount: number (保険者負担額)
  patient_amount: number (患者負担額)

  // レセプト情報
  status: 'draft' | 'validated' | 'submitted' | 'approved' | 'rejected' | 'resubmitted'
  validation_errors: {
    rule_id: string
    severity: 'error' | 'warning'
    message: string
    field: string
  }[]

  // 提出情報
  submitted_at: timestamp | null
  submission_file_path: string | null (UKE/XMLファイルパス)
  receipt_number: string | null (レセプト番号)

  // 審査結果
  審査結果: {
    status: 'approved' | 'reduced' | 'rejected'
    reduced_amount: number
    rejection_reason: string
    inquiry_details: text
    response_details: text
    response_submitted_at: timestamp | null
  } | null

  created_by: string (FK → staff.id)
  created_at: timestamp
  updated_at: timestamp
}
```

---

**⑧ facilities (施設マスター: 訪問診療先)**
```typescript
{
  id: string (UUID, PK)
  clinic_id: string (FK → clinics.id)
  code: string (施設コード)
  name: string (施設名)
  type: '介護老人保健施設' | '特別養護老人ホーム' | etc.
  postal_code: string
  address: string
  phone: string
  contact_person: string
  notes: text
  is_active: boolean
  created_at: timestamp
  updated_at: timestamp
}
```

---

**⑨ lab_orders (技工指示書)**
```typescript
{
  id: string (UUID, PK)
  clinic_id: string (FK → clinics.id)
  patient_id: string (FK → patients.id)
  medical_record_id: string (FK → medical_records.id)
  lab_id: string (FK → labs.id)

  order_date: date
  due_date: date
  completed_date: date | null

  items: {
    type: 'crown' | 'bridge' | 'denture' | etc.
    tooth_numbers: number[]
    material: string
    shade: string (色調)
    instructions: text
    price: number
  }[]

  total_cost: number
  status: 'ordered' | 'in_progress' | 'completed' | 'delivered'

  created_by: string (FK → staff.id)
  created_at: timestamp
  updated_at: timestamp
}
```

---

**⑩ labs (技工所マスター)**
```typescript
{
  id: string (UUID, PK)
  clinic_id: string (FK → clinics.id)
  name: string
  postal_code: string
  address: string
  phone: string
  email: string
  contact_person: string
  is_active: boolean
  created_at: timestamp
  updated_at: timestamp
}
```

---

### 3.2 既存テーブル拡張

**patients テーブル**への追加カラム:
```typescript
{
  insurance_card_image_path: string | null // Supabase Storage path
  insurance_verification_status: 'unverified' | 'verified' | 'expired'
  last_insurance_verification_date: timestamp | null
  copay_rate: number (患者負担割合: 0.1, 0.2, 0.3等)
}
```

**medical_documents テーブル**への追加カラム:
```typescript
{
  medical_record_id: string | null (FK → medical_records.id)
  auto_generated: boolean (自動生成フラグ)
  template_id: string | null (テンプレートID)
}
```

---

## 4. UI/UX設計

### 4.1 デザインコンセプト

**参考システム**:
- Julea (クラウド型歯科電子カルテ): ワンスクリーン設計、10秒入力
- Dentis (歯科電子カルテ): SOAP入力、シンプルUI

**設計方針**:
- **ワンスクリーンデザイン**: 1画面で患者情報・歯式図・診療入力・会計を同時表示
- **タッチ最適化**: タブレット対応、大きなボタン
- **高速入力**: テンプレート、お気に入り、音声入力連携
- **レスポンシブ**: デスクトップ・タブレット両対応

### 4.2 画面構成

#### 4.2.1 電子カルテ入力画面 (新規)

**レイアウト**:
```
┌─────────────────────────────────────────────────────────┐
│ [患者情報ヘッダー]                          [保存] [印刷] │
├──────────────────┬──────────────────────────────────────┤
│                  │  診療日: [2025-11-12]  区分: [通常]  │
│   歯式図         │  ──────────────────────────────────  │
│   (Dental Chart) │  【病名選択】                         │
│                  │  ┌────────────────────────────────┐  │
│   [既存コンポー  │  │ [検索: C04.6 齲蝕          ] [+] │  │
│    ネント再利用] │  │ ☑ C04.6 歯髄及び根尖周囲組織... │  │
│                  │  └────────────────────────────────┘  │
│                  │  ──────────────────────────────────  │
│                  │  【診療行為入力】                     │
│                  │  ┌────────────────────────────────┐  │
│                  │  │ [検索: 抜髄             ] [+]   │  │
│                  │  │ 対象歯: ☑11 ☐12 ☐13 ...       │  │
│                  │  │                                  │  │
│                  │  │ • 110000110 抜髄      560点     │  │
│                  │  │   対象: #11  数量: 1            │  │
│                  │  │                          [削除] │  │
│                  │  └────────────────────────────────┘  │
├──────────────────┤  ──────────────────────────────────  │
│ SOAP記録         │  【処方】                             │
│ (既存サブカルテ  │  [+ 医薬品追加]                       │
│  統合)           │  ──────────────────────────────────  │
│                  │  【自費診療】                         │
│ S: [音声入力対応]│  [+ 自費項目追加]                     │
│ O:               │  ──────────────────────────────────  │
│ A:               │  【会計サマリー】                     │
│ P:               │  保険点数合計: 560点                  │
│                  │  保険診療額: 5,600円                  │
│                  │  患者負担(30%): 1,680円               │
│                  │  自費診療: 0円                        │
│                  │  ────────────────────                │
│                  │  合計請求額: 1,680円                  │
└──────────────────┴──────────────────────────────────────┘
```

**主要機能**:
- リアルタイム点数計算・検証
- 包括/背反/算定回数チェック（警告表示）
- テンプレート保存・呼び出し
- 前回診療内容コピー
- 自動文書生成トリガー（特定コード入力時）

---

#### 4.2.2 レセプト管理画面 (新規)

**機能**:
- 月次レセプト一覧
- 検証エラー表示・修正
- UKE/XML出力
- 審査結果管理
- 再提出管理

---

#### 4.2.3 マスター管理画面 (新規)

**サブページ**:
- CSV一括取込（診療行為・病名・医薬品）
- 自費診療マスター管理
- 技工所マスター管理
- 施設マスター管理

---

## 5. 実装フェーズ

### Phase 1: マスターデータ基盤 (1-2ヶ月)

**成果物**:
1. データベースマイグレーション (全テーブル作成)
2. CSV取込管理画面
   - Shift-JIS → UTF-8変換
   - プレビュー機能
   - 適用日管理
   - 履歴保持
3. 自費診療マスター管理画面
4. API実装
   - `/api/master/treatments` (診療行為マスター)
   - `/api/master/diseases` (病名マスター)
   - `/api/master/medicines` (医薬品マスター)
   - `/api/master/self-pay` (自費診療)

**タスク**:
- [ ] マイグレーションファイル作成
- [ ] TypeScript型定義更新 (`types/database.ts`)
- [ ] CSV取込ユーティリティ実装
- [ ] 管理画面UI実装
- [ ] RLSポリシー設定

---

### Phase 2: 電子カルテ入力 (3-4ヶ月)

**成果物**:
1. 電子カルテ入力画面
2. 病名・診療行為検索コンポーネント
3. リアルタイム点数計算エンジン
4. 検証ルールエンジン
   - 包括チェック
   - 背反チェック (5種)
   - 算定回数チェック
5. テンプレート機能
6. 音声入力統合 (既存サブカルテ)
7. 自動文書生成連携

**API**:
- `/api/medical-records` (CRUD)
- `/api/medical-records/validate` (検証)
- `/api/medical-records/calculate` (点数計算)
- `/api/treatment-plans` (治療計画)

**タスク**:
- [ ] UI/UXデザイン作成
- [ ] 電子カルテ入力画面実装
- [ ] 検索コンポーネント実装 (オートコンプリート)
- [ ] 点数計算ロジック実装
- [ ] 検証ルールエンジン実装
- [ ] テンプレート機能実装
- [ ] 既存歯式図コンポーネント統合
- [ ] 医療文書自動生成ロジック実装

---

### Phase 3: レセプト機能 (2-3ヶ月)

**成果物**:
1. レセプト生成サービス
2. レセプト検証サービス (140+ルール)
3. UKE/XML出力機能
4. レセプト管理画面
5. 審査結果管理機能
6. 再提出管理機能

**API**:
- `/api/receipts` (CRUD)
- `/api/receipts/generate` (月次生成)
- `/api/receipts/validate` (検証)
- `/api/receipts/export` (UKE/XML)

**タスク**:
- [ ] レセプトフォーマット調査
- [ ] 検証ルール実装 (140+ルール)
- [ ] UKE/XMLパーサー実装
- [ ] レセプト管理UI実装
- [ ] 審査結果入力UI実装

---

### Phase 4: 拡張機能 (2-3ヶ月)

**成果物**:
1. オンライン資格確認システム
2. カードリーダー連携
3. 訪問診療管理
4. 技工管理
5. レポート・分析機能拡張

**API**:
- `/api/insurance/verify` (オンライン資格確認)
- `/api/facilities` (施設マスター)
- `/api/lab-orders` (技工指示)

**タスク**:
- [ ] マイナンバーカードリーダー連携調査
- [ ] オンライン資格確認API実装
- [ ] 訪問診療機能実装
- [ ] 技工管理機能実装
- [ ] アナリティクス統合

---

## 6. セキュリティ・コンプライアンス

### 6.1 個人情報保護

- **GDPR/個人情報保護法準拠**
- **データ暗号化**: 保存時・転送時
- **アクセス制御**: RLS (Row Level Security)
- **監査ログ**: 全変更履歴記録 (medical_records.version, snapshot_data)

### 6.2 医療データ保管

- **e-文書法準拠**: 電子保存要件
- **保存期間**: 診療録5年、レセプト3年
- **バックアップ**: Supabase自動バックアップ + 定期エクスポート

### 6.3 権限管理

**ロール定義**:
- **管理者**: 全機能アクセス
- **医師**: 診療記録入力・閲覧、レセプト管理
- **歯科衛生士**: 診療記録入力補助、閲覧
- **受付**: 予約管理、会計、閲覧のみ
- **閲覧専用**: 診療記録閲覧のみ

---

## 7. データ移行計画

### 7.1 既存EMRからの移行

**対応項目**:
- 患者マスター統合
- 過去の診療履歴取込 (可能な範囲)
- 保険情報移行

**移行方法**:
- CSVエクスポート → マッピング → インポート
- 手動検証・補正
- 段階的切り替え (並行運用期間設定)

---

## 8. テスト計画

### 8.1 単体テスト
- 点数計算ロジック
- 検証ルール
- API エンドポイント

### 8.2 統合テスト
- 電子カルテ入力 → レセプト生成フロー
- マスターデータ更新 → 診療記録への反映

### 8.3 受入テスト
- 実際のクリニック環境でのパイロット運用
- 歯科医師・歯科衛生士・受付スタッフによる評価

---

## 9. リスク管理

### 9.1 主要リスク

| リスク | 影響 | 対策 |
|--------|------|------|
| 診療報酬改定への対応遅れ | 高 | 改定前3ヶ月からマスターデータ準備 |
| レセプト検証ルール不備 | 高 | 既存EMRシステムの検証ロジック参考 |
| データ移行失敗 | 中 | 並行運用期間設定、段階的移行 |
| パフォーマンス問題 | 中 | 適切なインデックス設計、キャッシング |
| UI/UX不評 | 中 | 早期プロトタイプ作成、ユーザーテスト |

---

## 10. 次のアクション

### 10.1 即座に実施すべきタスク

1. **マスターデータダウンロード**:
   - [ ] MEDIS-DC ICD10対応標準病名マスター取得
   - [ ] 厚生労働省 医薬品マスター取得
   - [ ] データ構造確認・ドキュメント化

2. **データベーススキーマ完成版作成**:
   - [ ] 全テーブル定義をTypeScriptで記述
   - [ ] マイグレーションファイル作成

3. **Phase 1 キックオフ準備**:
   - [ ] 開発環境セットアップ
   - [ ] タスク詳細化
   - [ ] スプリント計画

### 10.2 確認事項

- [ ] ユーザー（クリニック）へのデモ・ヒアリング日程調整
- [ ] 既存EMRシステム調査（競合分析）
- [ ] 保険請求代行業者との連携可能性確認

---

## 11. 参考資料

### 11.1 公式ドキュメント
- [診療報酬情報提供サービス (厚生労働省)](https://shinryohoshu.mhlw.go.jp/shinryohoshu/downloadMenu/)
- [MEDIS-DC 標準病名マスター](https://www2.medis.or.jp/stdcd/byomei/index.html)
- [社会保険診療報酬支払基金](https://www.ssk.or.jp/)
- [レセプト電算処理システム仕様書](https://shinryohoshu.mhlw.go.jp/shinryohoshu/file/spec/R06rec_mente240906.pdf)

### 11.2 技術スタック
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html)

---

**作成者**: Claude Code
**最終更新**: 2025-11-12
