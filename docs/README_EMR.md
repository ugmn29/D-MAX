# 電子カルテ (EMR) システムドキュメント
## Electronic Medical Record System Documentation

このフォルダには、D-MAX歯科診療所管理システムに統合される電子カルテシステムの完全なドキュメントが含まれています。

---

## 📚 ドキュメント一覧

### 1. 実装準備完了通知 ⭐
**ファイル**: [`EMR_PHASE1_READY.md`](./EMR_PHASE1_READY.md)

**内容**: Phase 1実装準備の完了報告
- 完了した作業の詳細
- 作成されたファイル一覧
- 次のステップ（実装開始手順）
- データ構造サマリー
- 技術的なポイント
- チェックリスト

**👉 まずはこのファイルをお読みください**

---

### 2. 実装計画書（最重要）
**ファイル**: [`EMR_IMPLEMENTATION_PLAN.md`](./EMR_IMPLEMENTATION_PLAN.md)

**内容**: 完全な実装計画（41KB、約8,000行）
- プロジェクト概要
- データソース詳細（CSV取得先URL）
- データベース設計（10テーブル詳細）
- UI/UX設計（ワンスクリーン設計）
- 実装フェーズ（Phase 1-4、8-12ヶ月）
- セキュリティ・コンプライアンス
- テスト計画
- リスク管理

**開発時の参照必須ドキュメント**

---

### 3. 統合サマリー
**ファイル**: [`EMR_INTEGRATION_SUMMARY.md`](./EMR_INTEGRATION_SUMMARY.md)

**内容**: 電子カルテ統合の全体像
- 統合概要
- 既存機能との連携
- データフロー
- 実装アプローチ
- 技術スタック

---

### 4. エビデンスレベル文書
**ファイル**: [`EMR_INTEGRATION_EVIDENCE_LEVEL.md`](./EMR_INTEGRATION_EVIDENCE_LEVEL.md)

**内容**: 統合機能のエビデンスレベル評価
- 各機能のエビデンスレベル（Lv.1-4）
- 実装済み・未実装の明確な区別
- 今後の実装計画

---

### 5. 詳細実装ガイド
**ファイル**: [`ELECTRONIC_MEDICAL_RECORD_INTEGRATION.md`](./ELECTRONIC_MEDICAL_RECORD_INTEGRATION.md)

**内容**: 電子カルテ統合の詳細な技術仕様
- コンポーネント設計
- API設計
- データベーススキーマ詳細
- セキュリティ設計

---

### 6. その他の関連ドキュメント

#### CSVインポートマッピング
- **ファイル**: [`CSV_IMPORT_DETAILED_MAPPING.md`](./CSV_IMPORT_DETAILED_MAPPING.md)
- **内容**: CSVインポート時のフィールドマッピング詳細

#### LINE連携ガイド
- **ファイル**: [`LIFF_SETUP_GUIDE.md`](./LIFF_SETUP_GUIDE.md)
- **内容**: LIFF (LINE Front-end Framework) セットアップガイド

#### 売上管理CSV
- **ファイル**: [`SALES_CSV_FORMAT.md`](./SALES_CSV_FORMAT.md)
- **内容**: 売上データCSV形式仕様

#### のざ・おぷてっく統合
- **ファイル**: [`NOZA_OPTECH_INTEGRATION_GUIDE.md`](./NOZA_OPTECH_INTEGRATION_GUIDE.md)
- **内容**: 外部システム統合ガイド

---

## 🗂️ ファイル構成

```
D-MAX/
├── docs/
│   ├── README_EMR.md                            ← このファイル
│   ├── EMR_PHASE1_READY.md                      ⭐ まずはこれを読む
│   ├── EMR_IMPLEMENTATION_PLAN.md               📘 実装計画書（最重要）
│   ├── EMR_INTEGRATION_SUMMARY.md               📄 統合サマリー
│   ├── EMR_INTEGRATION_EVIDENCE_LEVEL.md        📊 エビデンスレベル
│   ├── ELECTRONIC_MEDICAL_RECORD_INTEGRATION.md 🔧 詳細実装ガイド
│   ├── CSV_IMPORT_DETAILED_MAPPING.md
│   ├── LIFF_SETUP_GUIDE.md
│   ├── SALES_CSV_FORMAT.md
│   └── NOZA_OPTECH_INTEGRATION_GUIDE.md
├── types/
│   ├── emr.ts                                    📝 EMR型定義（新規）
│   └── database.ts                               📝 既存型定義（EMR追加）
├── supabase/
│   └── migrations/
│       └── 20251112000001_create_emr_system_tables.sql  🗄️ マイグレーション
└── tensuhyo_04 2/                                📦 診療報酬CSVデータ
    ├── 00ファイル一覧表（歯科）.pdf
    ├── 01補助マスターテーブル（歯科）.csv
    ├── 02包括テーブル（歯科）.csv
    ├── 03-1背反テーブル（歯科）.csv
    ├── 03-2背反テーブル（歯科）.csv
    ├── 03-3背反テーブル（歯科）.csv
    ├── 03-4背反テーブル（歯科）.csv
    ├── 03-5背反テーブル（歯科）.csv
    └── 04算定回数テーブル（歯科）.csv
```

---

## 🚀 クイックスタート

### 1. 現在の状況確認

```bash
# ドキュメントを確認
cat docs/EMR_PHASE1_READY.md

# 型定義を確認
cat types/emr.ts

# マイグレーションを確認
cat supabase/migrations/20251112000001_create_emr_system_tables.sql
```

### 2. 次に実施すべきこと

**ステップ1**: マスターデータダウンロード
- 病名マスター: https://www2.medis.or.jp/stdcd/byomei/index.html
- 医薬品マスター: https://shinryohoshu.mhlw.go.jp/shinryohoshu/downloadMenu/

**ステップ2**: マイグレーション実行
```bash
npx supabase db reset  # 開発環境
```

**ステップ3**: Phase 1実装開始
- CSV取込ツール実装
- マスター管理API実装
- マスター管理UI実装

詳細は [`EMR_PHASE1_READY.md`](./EMR_PHASE1_READY.md) を参照してください。

---

## 📊 システム概要

### 目的
既存のD-MAX予約管理システムに、日本の歯科診療報酬制度に完全準拠した電子カルテシステムを統合。

### 主要機能
- ✅ 診療記録入力・管理
- ✅ 病名・診療行為のコード管理
- ✅ 保険点数自動計算（包括・背反・算定回数チェック）
- ✅ レセプト（診療報酬明細書）生成・管理
- ✅ 電子レセプト提出（UKE/XML形式）
- ✅ 医療文書自動生成
- ✅ 会計・請求管理
- ✅ 治療計画管理
- ✅ 技工管理
- ✅ 訪問診療対応
- 🔜 オンライン資格確認（Phase 4）

### 技術スタック
- **フレームワーク**: Next.js 14+ (App Router)
- **言語**: TypeScript
- **データベース**: Supabase (PostgreSQL)
- **認証**: Supabase Auth
- **ストレージ**: Supabase Storage

### 開発スケジュール
- **Phase 1** (1-2ヶ月): マスターデータ管理
- **Phase 2** (3-4ヶ月): 電子カルテ入力UI
- **Phase 3** (2-3ヶ月): レセプト機能
- **Phase 4** (2-3ヶ月): 拡張機能

**総開発期間**: 8-12ヶ月

---

## 🔗 外部リンク

### 公式データソース
- [診療報酬情報提供サービス (厚生労働省)](https://shinryohoshu.mhlw.go.jp/shinryohoshu/downloadMenu/)
- [MEDIS-DC 標準病名マスター](https://www2.medis.or.jp/stdcd/byomei/index.html)
- [社会保険診療報酬支払基金](https://www.ssk.or.jp/)

### 技術ドキュメント
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)

---

## 📞 サポート

### ドキュメントに関する質問
1. まず [`EMR_PHASE1_READY.md`](./EMR_PHASE1_READY.md) を確認
2. 詳細は [`EMR_IMPLEMENTATION_PLAN.md`](./EMR_IMPLEMENTATION_PLAN.md) を参照
3. 技術仕様は [`ELECTRONIC_MEDICAL_RECORD_INTEGRATION.md`](./ELECTRONIC_MEDICAL_RECORD_INTEGRATION.md) を確認

### 実装に関する質問
- 型定義: [`types/emr.ts`](../types/emr.ts)
- データベーススキーマ: [`supabase/migrations/20251112000001_create_emr_system_tables.sql`](../supabase/migrations/20251112000001_create_emr_system_tables.sql)

---

**最終更新**: 2025-11-12
**作成者**: Claude Code
**ステータス**: ✅ Phase 1 実装準備完了
